const db = require('../config/db');

/**
 * Create new job (Alış or Satış)
 * SUPPORTS MULTIPLE PRODUCTS
 */
const createJob = async (req, res) => {
    const client = await db.pool.connect();

    try {
        console.log('Create Job Payload:', JSON.stringify(req.body, null, 2));
        const { islem_tipi, taraf_id, tarih, urunler } = req.body;

        // Validate input
        if (!islem_tipi || !taraf_id || !tarih || !urunler || !Array.isArray(urunler) || urunler.length === 0) {
            console.error('Validation Failed:', {
                islem_tipi: !!islem_tipi,
                taraf_id: !!taraf_id,
                tarih: !!tarih,
                urunler_valid: Array.isArray(urunler) && urunler.length > 0
            });
            return res.status(400).json({
                error: 'İşlem tipi, taraf, tarih ve en az bir ürün gereklidir.',
            });
        }

        if (!['Alış', 'Satış'].includes(islem_tipi)) {
            console.error('Invalid islem_tipi:', islem_tipi);
            return res.status(400).json({
                error: 'İşlem tipi "Alış" veya "Satış" olmalıdır.',
            });
        }

        // Validate each product
        for (const [index, urun] of urunler.entries()) {
            if (!urun.urun_id || !urun.miktar || !urun.birim_fiyat) {
                console.error(`Product Validation Failed at index ${index}:`, urun);
                return res.status(400).json({
                    error: 'Her ürün için ürün ID, miktar ve birim fiyat gereklidir.',
                });
            }
        }

        await client.query('BEGIN');

        // Set user ID for triggers
        if (req.user && req.user.id) {
            await client.query("SELECT set_config('doguas.current_user_id', $1, true)", [req.user.id.toString()]);
        }

        const insertedItems = [];

        // Insert each product
        for (const urun of urunler) {
            const { urun_id, miktar, birim_fiyat } = urun;
            const toplam = miktar * birim_fiyat;

            let result;

            if (islem_tipi === 'Satış') {
                result = await client.query(
                    `INSERT INTO urun_musteri_islem (musteri_id, urun_id, satilan_adet, urun_satis_fiyati, 
                     toplam_satis_tutari, islem_tarihi, islemin_durumu)
                     VALUES ($1, $2, $3, $4, $5, $6, 'DEVAM EDIYOR')
                     RETURNING *`,
                    [taraf_id, urun_id, miktar, birim_fiyat, toplam, tarih]
                );
            } else {
                result = await client.query(
                    `INSERT INTO urun_tedarikci_alis (tedarikci_id, urun_id, alinan_adet, urun_alis_fiyati, 
                     toplam_alis_tutari, alis_tarihi, alis_durumu)
                     VALUES ($1, $2, $3, $4, $5, $6, false)
                     RETURNING *`,
                    [taraf_id, urun_id, miktar, birim_fiyat, toplam, tarih]
                );
            }

            insertedItems.push(result.rows[0]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: `${insertedItems.length} ürün ile iş başarıyla oluşturuldu.`,
            data: insertedItems,
            islem_tipi,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create job error:', error);

        // Handle Stock Constraint Violation (check_stok_positive)
        if (error.code === '23514' && error.constraint === 'check_stok_positive') {
            return res.status(400).json({
                error: 'Yetersiz Stok: Bu işlem stoğu negatife düşüreceği için gerçekleştirilemedi.'
            });
        }

        res.status(500).json({ error: 'İş oluşturulamadı: ' + error.message });
    } finally {
        client.release();
    }
};

/**
 * Complete job with survey data
 */
const completeJob = async (req, res) => {
    const client = await db.pool.connect();

    try {
        const { id } = req.params;
        const { islem_tipi, survey } = req.body;

        if (!['Alış', 'Satış'].includes(islem_tipi)) {
            return res.status(400).json({
                error: 'İşlem tipi "Alış" veya "Satış" olmalıdır.',
            });
        }

        // Validate survey data ONLY for Alış
        if (islem_tipi === 'Alış') {
            if (!survey || !survey.teslimat_hizi || !survey.eksiksiz_teslimat || !survey.fiyat_performans) {
                return res.status(400).json({
                    error: 'Anket verileri eksik. Lütfen tüm soruları cevaplayın.',
                });
            }
        }

        // Calculate average satisfaction score (only for Alış)
        let averageScore = 0;
        if (islem_tipi === 'Alış') {
            averageScore = (
                (survey.teslimat_hizi + survey.eksiksiz_teslimat + survey.fiyat_performans) / 3
            ).toFixed(2);
        }

        await client.query('BEGIN');

        // Set user ID for triggers
        if (req.user && req.user.id) {
            await client.query("SELECT set_config('doguas.current_user_id', $1, true)", [req.user.id.toString()]);
        }

        let jobResult, tarafId;

        if (islem_tipi === 'Satış') {
            jobResult = await client.query(
                `UPDATE urun_musteri_islem
                 SET islemin_durumu = 'TAMAMLANDI'
                 WHERE islem_id = $1 AND islemin_durumu = 'DEVAM EDIYOR'
                 RETURNING musteri_id`,
                [id]
            );

            // For Sales, we DO NOT update satisfaction score anymore
        } else {
            jobResult = await client.query(
                `UPDATE urun_tedarikci_alis
                 SET alis_durumu = true
                 WHERE alis_id = $1 AND alis_durumu = false
                 RETURNING tedarikci_id`,
                [id]
            );

            if (jobResult.rows.length > 0) {
                tarafId = jobResult.rows[0].tedarikci_id;
                await client.query(
                    `UPDATE tedarikci SET tedarikci_memnuniyeti = $1 WHERE tedarikci_id = $2`,
                    [averageScore, tarafId]
                );
            }
        }

        if (jobResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                error: 'İş bulunamadı veya zaten tamamlandı.',
            });
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'İş başarıyla tamamlandı.',
            averageScore: islem_tipi === 'Alış' ? parseFloat(averageScore) : null,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Complete job error:', error);
        res.status(500).json({ error: 'İş tamamlanamadı.' });
    } finally {
        client.release();
    }
};

/**
 * Get active jobs (DEVAM EDIYOR status) with items
 */
const getActiveJobs = async (req, res) => {
    try {
        // Get customer jobs with items
        const musteriJobs = await db.query(
            `SELECT 
                'Satış' AS islem_tipi, 
                mi.islem_id AS id, 
                mi.musteri_id AS taraf_id,
                m.musteri_adi AS taraf_adi, 
                mi.islem_tarihi AS tarih, 
                mi.islemin_durumu AS durum,
                json_agg(json_build_object(
                    'urun_adi', u.urun_adi,
                    'miktar', mi.satilan_adet,
                    'birim_fiyat', mi.urun_satis_fiyati,
                    'toplam', mi.toplam_satis_tutari
                )) AS items
             FROM urun_musteri_islem mi
             LEFT JOIN musteri m ON mi.musteri_id = m.musteri_id
             LEFT JOIN urun u ON mi.urun_id = u.urun_id
             WHERE mi.islemin_durumu = 'DEVAM EDIYOR'
             GROUP BY mi.islem_id, m.musteri_adi, mi.islem_tarihi, mi.islemin_durumu
             ORDER BY mi.islem_tarihi DESC`
        );

        // Get supplier jobs with items
        const tedarikciJobs = await db.query(
            `SELECT 
                'Alış' AS islem_tipi, 
                ti.alis_id AS id, 
                ti.tedarikci_id AS taraf_id,
                t.tedarikci_adi AS taraf_adi, 
                ti.alis_tarihi AS tarih,
                CASE WHEN ti.alis_durumu = false THEN 'DEVAM EDIYOR' ELSE 'TAMAMLANDI' END AS durum,
                json_agg(json_build_object(
                    'urun_adi', u.urun_adi,
                    'miktar', ti.alinan_adet,
                    'birim_fiyat', ti.urun_alis_fiyati,
                    'toplam', ti.toplam_alis_tutari
                )) AS items
             FROM urun_tedarikci_alis ti
             LEFT JOIN tedarikci t ON ti.tedarikci_id = t.tedarikci_id
             LEFT JOIN urun u ON ti.urun_id = u.urun_id
             WHERE ti.alis_durumu = false
             GROUP BY ti.alis_id, t.tedarikci_adi, ti.alis_tarihi, ti.alis_durumu
             ORDER BY ti.alis_tarihi DESC`
        );

        const allJobs = [...musteriJobs.rows, ...tedarikciJobs.rows];

        // Sort combined list by date desc
        allJobs.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

        res.json({
            success: true,
            data: allJobs,
        });
    } catch (error) {
        console.error('Get active jobs error:', error);
        res.status(500).json({ error: 'Aktif işler alınamadı.' });
    }
};

/**
 * Get job details with all items
 */
const getJobDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { islem_tipi } = req.query;

        if (!islem_tipi || !['Alış', 'Satış'].includes(islem_tipi)) {
            return res.status(400).json({
                error: 'İşlem tipi parametresi gerekli ("Alış" veya "Satış").',
            });
        }

        let jobResult;

        if (islem_tipi === 'Satış') {
            jobResult = await db.query(
                `SELECT i.*, m.musteri_adi AS taraf_adi, u.urun_adi
                 FROM urun_musteri_islem i
                 LEFT JOIN musteri m ON i.musteri_id = m.musteri_id
                 LEFT JOIN urun u ON i.urun_id = u.urun_id
                 WHERE i.islem_id = $1`,
                [id]
            );
        } else {
            jobResult = await db.query(
                `SELECT i.*, t.tedarikci_adi AS taraf_adi, u.urun_adi
                 FROM urun_tedarikci_alis i
                 LEFT JOIN tedarikci t ON i.tedarikci_id = t.tedarikci_id
                 LEFT JOIN urun u ON i.urun_id = u.urun_id
                 WHERE i.alis_id = $1`,
                [id]
            );
        }

        if (jobResult.rows.length === 0) {
            return res.status(404).json({ error: 'İş bulunamadı.' });
        }

        res.json({
            success: true,
            data: {
                ...jobResult.rows[0],
                islem_tipi,
            },
        });
    } catch (error) {
        console.error('Get job details error:', error);
        res.status(500).json({ error: 'İş detayları alınamadı.' });
    }
};

/**
 * Get customers list (for job creation)
 */
const getCustomers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT musteri_id AS id, musteri_adi, musteri_iletisim_no AS telefon
       FROM musteri
       ORDER BY musteri_adi`
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Müşteriler alınamadı.' });
    }
};

/**
 * Get suppliers list (for job creation)
 */
const getSuppliers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT tedarikci_id AS id, tedarikci_adi, tedarikci_iletisim_no AS telefon
       FROM tedarikci
       ORDER BY tedarikci_adi`
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get suppliers error:', error);
        res.status(500).json({ error: 'Tedarikçiler alınamadı.' });
    }
};

// Helper to title case names
const toTitleCase = (str) => {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
};

/**
 * Create new customer
 */
const createCustomer = async (req, res) => {
    try {
        const { musteri_adi, musteri_iletisim_no } = req.body;

        if (!musteri_adi) {
            return res.status(400).json({ error: 'Müşteri adı gereklidir.' });
        }

        const formattedName = toTitleCase(musteri_adi);

        const result = await db.query(
            `INSERT INTO musteri (musteri_adi, musteri_iletisim_no)
             VALUES ($1, $2)
             RETURNING *`,
            [formattedName, musteri_iletisim_no || null]
        );

        res.status(201).json({
            success: true,
            message: 'Müşteri başarıyla oluşturuldu.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Müşteri oluşturulamadı.' });
    }
};

/**
 * Create new supplier
 */
const createSupplier = async (req, res) => {
    try {
        const { tedarikci_adi, tedarikci_iletisim_no } = req.body;

        if (!tedarikci_adi) {
            return res.status(400).json({ error: 'Tedarikçi adı gereklidir.' });
        }

        const formattedName = toTitleCase(tedarikci_adi);

        const result = await db.query(
            `INSERT INTO tedarikci (tedarikci_adi, tedarikci_iletisim_no)
             VALUES ($1, $2)
             RETURNING *`,
            [formattedName, tedarikci_iletisim_no || null]
        );

        res.status(201).json({
            success: true,
            message: 'Tedarikçi başarıyla oluşturuldu.',
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create supplier error:', error);
        res.status(500).json({ error: 'Tedarikçi oluşturulamadı: ' + error.message });
    }
};

module.exports = {
    createJob,
    completeJob,
    getActiveJobs,
    getJobDetails,
    getCustomers,
    getSuppliers,
    createCustomer,
    createSupplier,
};

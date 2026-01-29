const db = require('../config/db');

/**
 * Get transaction history with filters
 */
const getHistory = async (req, res) => {
    try {
        const { startDate, endDate, type, partyName } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        let musteriQuery = `
      SELECT 'Satış' AS islem_tipi, mi.islem_id AS id, mi.musteri_id AS taraf_id,
             m.musteri_adi AS taraf_adi, mi.islem_tarihi AS tarih, 
             mi.islemin_durumu AS durum, mi.toplam_satis_tutari AS toplam_fiyat
      FROM urun_musteri_islem mi
      LEFT JOIN musteri m ON mi.musteri_id = m.musteri_id
      WHERE mi.islemin_durumu = 'TAMAMLANDI'
    `;

        let tedarikciQuery = `
      SELECT 'Alış' AS islem_tipi, ti.alis_id AS id, ti.tedarikci_id AS taraf_id,
             t.tedarikci_adi AS taraf_adi, ti.alis_tarihi AS tarih,
             CASE WHEN ti.alis_durumu = true THEN 'TAMAMLANDI' ELSE 'DEVAM EDIYOR' END AS durum,
             ti.toplam_alis_tutari AS toplam_fiyat
      FROM urun_tedarikci_alis ti
      LEFT JOIN tedarikci t ON ti.tedarikci_id = t.tedarikci_id
      WHERE ti.alis_durumu = true
    `;

        const params = [];
        let paramIndex = 1;

        // Date filters
        if (startDate) {
            musteriQuery += ` AND mi.islem_tarihi >= $${paramIndex}`;
            tedarikciQuery += ` AND ti.alis_tarihi >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            musteriQuery += ` AND mi.islem_tarihi <= $${paramIndex}`;
            tedarikciQuery += ` AND ti.alis_tarihi <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        // Party name filter
        if (partyName) {
            musteriQuery += ` AND m.musteri_adi ILIKE $${paramIndex}`;
            tedarikciQuery += ` AND t.tedarikci_adi ILIKE $${paramIndex}`;
            params.push(`%${partyName}%`);
            paramIndex++;
        }

        // Build union query based on type filter
        let finalQuery;
        if (type === 'Satış') {
            finalQuery = musteriQuery;
        } else if (type === 'Alış') {
            finalQuery = tedarikciQuery;
        } else {
            finalQuery = `(${musteriQuery}) UNION ALL (${tedarikciQuery})`;
        }

        finalQuery = `SELECT * FROM (${finalQuery}) AS combined ORDER BY tarih DESC`;

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${finalQuery}) AS counted`;
        const countResult = await db.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count);

        // Add pagination
        finalQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(finalQuery, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Geçmiş işler alınamadı.' });
    }
};

/**
 * Get transaction details
 */
const getTransactionDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { islem_tipi } = req.query;

        if (!islem_tipi || !['Alış', 'Satış'].includes(islem_tipi)) {
            return res.status(400).json({
                error: 'İşlem tipi parametresi gerekli ("Alış" veya "Satış").',
            });
        }

        let transactionResult;

        if (islem_tipi === 'Satış') {
            transactionResult = await db.query(
                `SELECT i.*, m.musteri_adi AS taraf_adi, u.urun_adi
                 FROM urun_musteri_islem i
                 LEFT JOIN musteri m ON i.musteri_id = m.musteri_id
                 LEFT JOIN urun u ON i.urun_id = u.urun_id
                 WHERE i.islem_id = $1`,
                [id]
            );
        } else {
            transactionResult = await db.query(
                `SELECT i.*, t.tedarikci_adi AS taraf_adi, u.urun_adi
                 FROM urun_tedarikci_alis i
                 LEFT JOIN tedarikci t ON i.tedarikci_id = t.tedarikci_id
                 LEFT JOIN urun u ON i.urun_id = u.urun_id
                 WHERE i.alis_id = $1`,
                [id]
            );
        }

        if (transactionResult.rows.length === 0) {
            return res.status(404).json({ error: 'İşlem bulunamadı.' });
        }

        res.json({
            success: true,
            data: {
                ...transactionResult.rows[0],
                islem_tipi,
            },
        });
    } catch (error) {
        console.error('Get transaction details error:', error);
        res.status(500).json({ error: 'İşlem detayları alınamadı.' });
    }
};

/**
 * Get detailed history with advanced filtering and day calculation
 * For color coding based on days since last transaction
 */
const getDetailedHistory = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            type,
            urunIds,  // comma-separated product IDs
            tarafId,  // musteri or tedarikci ID
            minMemnuniyet,
            maxMemnuniyet
        } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        let musteriQuery = `
      SELECT 'Satış' AS islem_tipi, 
             mi.islem_id AS id, 
             mi.musteri_id AS taraf_id,
             m.musteri_adi AS taraf_adi,
             u.urun_adi,
             u.urun_id,
             mi.satilan_adet AS adet,
             mi.urun_satis_fiyati AS birim_fiyat,
             mi.toplam_satis_tutari AS toplam,
             mi.islem_tarihi AS tarih,
             m.musteri_memnuniyeti AS memnuniyet,
             EXTRACT(DAY FROM (NOW() - mi.islem_tarihi))::integer AS gun_farki,
             mi.islemin_durumu AS durum
      FROM urun_musteri_islem mi
      LEFT JOIN musteri m ON mi.musteri_id = m.musteri_id
      LEFT JOIN urun u ON mi.urun_id = u.urun_id
      WHERE mi.islemin_durumu = 'TAMAMLANDI'
    `;

        let tedarikciQuery = `
      SELECT 'Alış' AS islem_tipi,
             ti.alis_id AS id,
             ti.tedarikci_id AS taraf_id,
             t.tedarikci_adi AS taraf_adi,
             u.urun_adi,
             u.urun_id,
             ti.alinan_adet AS adet,
             ti.urun_alis_fiyati AS birim_fiyat,
             ti.toplam_alis_tutari AS toplam,
             ti.alis_tarihi AS tarih,
             t.tedarikci_memnuniyeti AS memnuniyet,
             EXTRACT(DAY FROM (NOW() - ti.alis_tarihi))::integer AS gun_farki,
             CASE WHEN ti.alis_durumu = true THEN 'TAMAMLANDI' ELSE 'DEVAM EDIYOR' END AS durum
      FROM urun_tedarikci_alis ti
      LEFT JOIN tedarikci t ON ti.tedarikci_id = t.tedarikci_id
      LEFT JOIN urun u ON ti.urun_id = u.urun_id
      WHERE ti.alis_durumu = true
    `;

        const params = [];
        let paramIndex = 1;

        // Date filters
        if (startDate) {
            musteriQuery += ` AND mi.islem_tarihi >= $${paramIndex}`;
            tedarikciQuery += ` AND ti.alis_tarihi >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            musteriQuery += ` AND mi.islem_tarihi <= $${paramIndex}`;
            tedarikciQuery += ` AND ti.alis_tarihi <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        // Product filter
        if (urunIds) {
            const urunIdArray = urunIds.split(',').map(id => parseInt(id.trim()));
            musteriQuery += ` AND mi.urun_id = ANY($${paramIndex}::int[])`;
            tedarikciQuery += ` AND ti.urun_id = ANY($${paramIndex}::int[])`;
            params.push(urunIdArray);
            paramIndex++;
        }

        // Party filter
        if (tarafId) {
            musteriQuery += ` AND mi.musteri_id = $${paramIndex}`;
            tedarikciQuery += ` AND ti.tedarikci_id = $${paramIndex}`;
            params.push(parseInt(tarafId));
            paramIndex++;
        }

        // Satisfaction filter
        if (minMemnuniyet) {
            musteriQuery += ` AND m.musteri_memnuniyeti >= $${paramIndex}`;
            tedarikciQuery += ` AND t.tedarikci_memnuniyeti >= $${paramIndex}`;
            params.push(parseFloat(minMemnuniyet));
            paramIndex++;
        }

        if (maxMemnuniyet) {
            musteriQuery += ` AND m.musteri_memnuniyeti <= $${paramIndex}`;
            tedarikciQuery += ` AND t.tedarikci_memnuniyeti <= $${paramIndex}`;
            params.push(parseFloat(maxMemnuniyet));
            paramIndex++;
        }
        // Sorting
        const { sortBy = 'tarih', sortOrder = 'DESC' } = req.query;
        const validSortColumns = ['tarih', 'toplam', 'memnuniyet'];
        const validSortOrders = ['ASC', 'DESC'];

        const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'tarih';
        const safeSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        // Use CTEs for cleaner query construction
        let query;
        if (type === 'Satış') {
            query = `
                WITH musteri_islem AS (
                    ${musteriQuery}
                )
                SELECT * FROM musteri_islem
                ORDER BY ${safeSortBy} ${safeSortOrder}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
        } else if (type === 'Alış') {
            query = `
                WITH tedarikci_islem AS (
                    ${tedarikciQuery}
                )
                SELECT * FROM tedarikci_islem
                ORDER BY ${safeSortBy} ${safeSortOrder}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
        } else {
            query = `
                WITH musteri_islem AS (
                    ${musteriQuery}
                ),
                tedarikci_islem AS (
                    ${tedarikciQuery}
                ),
                combined_results AS (
                    SELECT * FROM musteri_islem
                    UNION ALL
                    SELECT * FROM tedarikci_islem
                )
                SELECT * FROM combined_results
                ORDER BY ${safeSortBy} ${safeSortOrder}
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
            `;
        }

        params.push(limit, offset);

        const result = await db.query(query, params);

        // Count query
        let countQuery;
        const countParams = params.slice(0, -2); // remove limit and offset

        if (type === 'Satış') {
            countQuery = `SELECT COUNT(*) FROM (${musteriQuery}) AS counted`;
        } else if (type === 'Alış') {
            countQuery = `SELECT COUNT(*) FROM (${tedarikciQuery}) AS counted`;
        } else {
            countQuery = `SELECT COUNT(*) FROM ((${musteriQuery}) UNION ALL (${tedarikciQuery})) AS counted`;
        }

        const countResult = await db.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Get detailed history error:', error);
        res.status(500).json({ error: 'Detaylı geçmiş alınamadı: ' + error.message });
    }
};

module.exports = {
    getHistory,
    getTransactionDetails,
    getDetailedHistory,
};

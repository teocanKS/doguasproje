const db = require('../config/db');
const { parseQuoteExcel } = require('../services/excelService');
const fs = require('fs');
const path = require('path');

// Safe uploads directory (absolute path)
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

/**
 * Safely delete a file only if it's within the allowed uploads directory.
 * Prevents path traversal attacks.
 */
const safeUnlinkSync = (filePath) => {
    if (!filePath) return;
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(UPLOADS_DIR)) {
        console.error('Path traversal attempt blocked:', filePath);
        return;
    }
    if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
    }
};

const uploadQuote = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi.' });
        }

        const parsedData = parseQuoteExcel(req.file.path);

        // Clean up uploaded file (with path validation)
        safeUnlinkSync(req.file.path);

        const { metadata, items } = parsedData;

        // Start transaction
        await db.query('BEGIN');

        // Insert Quote Header
        const quoteResult = await db.query(
            `INSERT INTO teklifler (musteri_adi, proje_adi, teklif_tarihi, toplam_tutar, durum)
             VALUES ($1, $2, $3, $4, 'BEKLEMEDE')
             RETURNING teklif_id`,
            [metadata.musteri_adi, metadata.proje_adi, metadata.teklif_tarihi, metadata.toplam_tutar]
        );
        const teklifId = quoteResult.rows[0].teklif_id;

        // Insert Quote Items
        for (const item of items) {
            await db.query(
                `INSERT INTO teklif_kalemleri (teklif_id, malzeme_cinsi, miktar, birim, birim_fiyat, toplam_fiyat)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [teklifId, item.malzeme_cinsi, item.miktar, item.birim, item.birim_fiyat, item.toplam_fiyat]
            );
        }

        await db.query('COMMIT');

        res.json({ success: true, message: 'Teklif başarıyla yüklendi.', teklifId });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Upload quote error:', error);
        res.status(500).json({ error: 'Teklif yüklenirken hata oluştu: ' + error.message });
    }
};

const getQuotes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const countResult = await db.query('SELECT COUNT(*) FROM teklifler');
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        const result = await db.query(
            'SELECT * FROM teklifler ORDER BY olusturma_tarihi DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limit
            }
        });
    } catch (error) {
        console.error('Get quotes error:', error);
        res.status(500).json({ error: 'Teklifler alınamadı.' });
    }
};

const deleteQuote = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if quote exists
        const check = await db.query('SELECT * FROM teklifler WHERE teklif_id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Teklif bulunamadı.' });
        }

        // Delete quote (Cascade should handle items if configured, otherwise we might need to delete items first)
        // Assuming CASCADE is set up or we delete items manually. 
        // Let's delete items first to be safe if no cascade.
        await db.query('DELETE FROM teklif_kalemleri WHERE teklif_id = $1', [id]);
        await db.query('DELETE FROM teklifler WHERE teklif_id = $1', [id]);

        res.json({ success: true, message: 'Teklif başarıyla silindi.' });
    } catch (error) {
        console.error('Delete quote error:', error);
        res.status(500).json({ error: 'Teklif silinemedi.' });
    }
};

const getQuoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const quoteResult = await db.query('SELECT * FROM teklifler WHERE teklif_id = $1', [id]);

        if (quoteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Teklif bulunamadı.' });
        }

        const itemsResult = await db.query('SELECT * FROM teklif_kalemleri WHERE teklif_id = $1', [id]);

        res.json({
            success: true,
            data: {
                ...quoteResult.rows[0],
                items: itemsResult.rows
            }
        });
    } catch (error) {
        console.error('Get quote details error:', error);
        res.status(500).json({ error: 'Teklif detayları alınamadı.' });
    }
};

const approveQuote = async (req, res) => {
    try {
        const { id } = req.params;

        // Get quote details
        const quoteResult = await db.query('SELECT * FROM teklifler WHERE teklif_id = $1', [id]);
        if (quoteResult.rows.length === 0) return res.status(404).json({ error: 'Teklif bulunamadı.' });

        const quote = quoteResult.rows[0];
        if (quote.durum === 'ONAYLANDI') return res.status(400).json({ error: 'Bu teklif zaten onaylanmış.' });

        const itemsResult = await db.query('SELECT * FROM teklif_kalemleri WHERE teklif_id = $1', [id]);
        const items = itemsResult.rows;

        // Check/Create Customer
        let musteriId;
        const customerResult = await db.query('SELECT musteri_id FROM musteri WHERE musteri_adi ILIKE $1', [quote.musteri_adi]);

        if (customerResult.rows.length > 0) {
            musteriId = customerResult.rows[0].musteri_id;
        } else {
            // Create new customer
            const newCustomer = await db.query(
                'INSERT INTO musteri (musteri_adi, musteri_iletisim_no) VALUES ($1, $2) RETURNING musteri_id',
                [quote.musteri_adi, 'Belirtilmedi']
            );
            musteriId = newCustomer.rows[0].musteri_id;
        }

        await db.query('BEGIN');

        for (const item of items) {
            // Normalize product name (remove Ø and trim)
            const normalizedProductName = item.malzeme_cinsi.replace(/Ø\s*/g, '').trim();

            // Find or Create Product
            let urunId;
            const productResult = await db.query('SELECT urun_id FROM urun WHERE urun_adi ILIKE $1', [normalizedProductName]);

            if (productResult.rows.length > 0) {
                urunId = productResult.rows[0].urun_id;
            } else {
                // Create new product
                const newProduct = await db.query(
                    'INSERT INTO urun (urun_adi, kategori, birim) VALUES ($1, $2, $3) RETURNING urun_id',
                    [normalizedProductName, 'Genel', item.birim || 'Adet']
                );
                urunId = newProduct.rows[0].urun_id;

                // Initialize stock for new product
                await db.query(
                    'INSERT INTO urun_stok (urun_id, toplam_stok, referans_degeri) VALUES ($1, 0, 10)',
                    [urunId]
                );
            }

            // Insert Order (Satış)
            await db.query(
                `INSERT INTO urun_musteri_islem 
                 (musteri_id, urun_id, islem_tarihi, satilan_adet, urun_satis_fiyati, toplam_satis_tutari, islemin_durumu, teklif_id)
                 VALUES ($1, $2, $3, $4, $5, $6, 'TAMAMLANDI', $7)`,
                [
                    musteriId,
                    urunId,
                    quote.teklif_tarihi,
                    Math.round(item.miktar), // Round to integer as satilan_adet is bigint
                    item.birim_fiyat,
                    item.toplam_fiyat,
                    id // teklif_id
                ]
            );
        }

        // Update Quote Status
        await db.query("UPDATE teklifler SET durum = 'ONAYLANDI' WHERE teklif_id = $1", [id]);

        await db.query('COMMIT');

        res.json({ success: true, message: 'Teklif onaylandı ve siparişler oluşturuldu.' });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Approve quote error:', error);
        res.status(500).json({ error: 'Teklif onaylanırken hata oluştu: ' + error.message });
    }
};

/**
 * Reject Quote
 */
const rejectQuote = async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            "UPDATE teklifler SET durum = 'REDDEDILDI' WHERE teklif_id = $1",
            [id]
        );
        res.json({ success: true, message: 'Teklif reddedildi.' });
    } catch (error) {
        console.error('Reject quote error:', error);
        res.status(500).json({ error: 'Teklif reddedilemedi.' });
    }
};

/**
 * Create Quote from JSON (Client-side parsed)
 */
const createQuoteFromJson = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const { items, totalAmount } = req.body;
        const userId = req.user.id;

        // 1. Create Quote Header
        const quoteResult = await client.query(
            `INSERT INTO teklifler (kullanici_id, musteri_id, teklif_tarihi, toplam_tutar, durum)
             VALUES ($1, NULL, NOW(), $2, 'BEKLIYOR')
             RETURNING teklif_id`,
            [userId, totalAmount]
        );
        const teklifId = quoteResult.rows[0].teklif_id;

        // 2. Process Items
        for (const item of items) {
            // Find or Create Product
            let urunId;
            const productResult = await client.query('SELECT urun_id FROM urun WHERE urun_adi ILIKE $1', [item.malzeme_cinsi]);

            if (productResult.rows.length > 0) {
                urunId = productResult.rows[0].urun_id;
            } else {
                const newProduct = await client.query(
                    'INSERT INTO urun (urun_adi, kategori, birim) VALUES ($1, $2, $3) RETURNING urun_id',
                    [item.malzeme_cinsi, 'Genel', item.birim || 'Adet']
                );
                urunId = newProduct.rows[0].urun_id;
                await client.query(
                    'INSERT INTO urun_stok (urun_id, toplam_stok, referans_degeri) VALUES ($1, 0, 10)',
                    [urunId]
                );
            }

            // Insert Quote Item (Pending Order)
            // Note: We use urun_musteri_islem with 'BEKLIYOR' status for quote items
            await client.query(
                `INSERT INTO urun_musteri_islem 
                 (musteri_id, urun_id, islem_tarihi, satilan_adet, urun_satis_fiyati, toplam_satis_tutari, islemin_durumu, teklif_id)
                 VALUES (NULL, $1, NOW(), $2, $3, $4, 'BEKLIYOR', $5)`,
                [
                    urunId,
                    item.miktar,
                    item.birim_fiyat,
                    item.miktar * item.birim_fiyat,
                    teklifId
                ]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Teklif başarıyla oluşturuldu.', teklifId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create quote json error:', error);
        res.status(500).json({ error: 'Teklif oluşturulamadı.' });
    } finally {
        client.release();
    }
};

const crypto = require('crypto');
const { sendQuoteEmail, sendQuoteRejectionNotification } = require('../utils/emailService');

// Get all customers for autocomplete
const getCustomers = async (req, res) => {
    try {
        const result = await db.query('SELECT musteri_id, musteri_adi, musteri_email, musteri_iletisim_no FROM musteri ORDER BY musteri_adi ASC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Müşteriler alınamadı.' });
    }
};

// Get projects for a specific customer
const getProjectsByCustomer = async (req, res) => {
    const { musteri_id } = req.params;
    try {
        // Fetch distinct project names from quotes and orders (if available)
        // Currently assuming project names are stored in 'teklifler' table
        const result = await db.query(
            'SELECT DISTINCT proje_adi FROM teklifler WHERE musteri_email = (SELECT musteri_email FROM musteri WHERE musteri_id = $1) AND proje_adi IS NOT NULL',
            [musteri_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Projeler alınamadı.' });
    }
};

// Get items from the last approved quote for a customer/project
const getPreviousOrderItems = async (req, res) => {
    const { musteri_id, proje_adi } = req.query;
    try {
        // Find the latest approved quote for this customer (and project if provided)
        let query = `
            SELECT tk.malzeme_cinsi, tk.miktar, tk.birim, tk.birim_fiyat 
            FROM teklif_kalemleri tk
            JOIN teklifler t ON t.teklif_id = tk.teklif_id
            WHERE t.durum = 'ONAYLANDI' 
            AND t.musteri_email = (SELECT musteri_email FROM musteri WHERE musteri_id = $1)
        `;
        const params = [musteri_id];

        if (proje_adi) {
            query += ` AND t.proje_adi = $2`;
            params.push(proje_adi);
        }

        query += ` ORDER BY t.teklif_tarihi DESC LIMIT 20`; // Limit to avoid too many items if multiple quotes match, but ideally we want the *latest* quote's items.

        // Better approach: Get the ID of the latest approved quote first
        let latestQuoteQuery = `
            SELECT teklif_id FROM teklifler 
            WHERE durum = 'ONAYLANDI' 
            AND musteri_id = $1
        `;
        const latestParams = [musteri_id];

        if (proje_adi) {
            latestQuoteQuery += ` AND proje_adi = $2`;
            latestParams.push(proje_adi);
        }

        latestQuoteQuery += ` ORDER BY teklif_tarihi DESC LIMIT 1`;

        const latestQuoteResult = await db.query(latestQuoteQuery, latestParams);

        if (latestQuoteResult.rows.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const latestTeklifId = latestQuoteResult.rows[0].teklif_id;

        const itemsResult = await db.query(
            'SELECT malzeme_cinsi, miktar, birim, birim_fiyat FROM teklif_kalemleri WHERE teklif_id = $1',
            [latestTeklifId]
        );

        res.json({ success: true, data: itemsResult.rows });

    } catch (error) {
        console.error('Get previous items error:', error);
        res.status(500).json({ error: 'Önceki sipariş detayları alınamadı.' });
    }
};

// Helper to title case names
const toTitleCase = (str) => {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
};

// New: Create Quote with File Upload + Manual Data + Email
const createQuoteWithWorkflow = async (req, res) => {
    const client = await db.pool.connect();
    try {
        console.log('Starting createQuoteWithWorkflow...');
        await client.query('BEGIN');

        console.log('Parsing body data...');
        const { musteri_adi, musteri_email, musteri_iletisim, proje_adi, items } = JSON.parse(req.body.data);
        console.log('Parsed data:', { musteri_adi, musteri_email, musteri_iletisim, proje_adi, itemsCount: items.length });

        const file = req.file; // Uploaded PDF file
        console.log('File info:', file ? file.path : 'No file');

        if (!file) {
            throw new Error('PDF dosyası yüklenmedi.');
        }

        // Enforce Title Case
        const formattedMusteriAdi = toTitleCase(musteri_adi);

        // 1. Find or Create Customer IMMEDIATELY to save contact info
        let musteriId;
        const customerResult = await client.query('SELECT musteri_id FROM musteri WHERE musteri_adi ILIKE $1', [formattedMusteriAdi]);

        if (customerResult.rows.length > 0) {
            musteriId = customerResult.rows[0].musteri_id;
            // Optional: Update email/phone if provided and different? 
            // For now, let's update if the existing one is empty or 'Belirtilmedi'
            await client.query(
                `UPDATE musteri 
                 SET musteri_email = COALESCE(NULLIF($1, ''), musteri_email),
                     musteri_iletisim_no = COALESCE(NULLIF($2, ''), musteri_iletisim_no)
                 WHERE musteri_id = $3`,
                [musteri_email, musteri_iletisim, musteriId]
            );
        } else {
            console.log('Creating new customer:', formattedMusteriAdi);
            const newCustomer = await client.query(
                'INSERT INTO musteri (musteri_adi, musteri_email, musteri_iletisim_no) VALUES ($1, $2, $3) RETURNING musteri_id',
                [formattedMusteriAdi, musteri_email, musteri_iletisim || 'Belirtilmedi']
            );
            musteriId = newCustomer.rows[0].musteri_id;
        }

        // Calculate total amount
        const parsedItems = items;
        const totalAmount = parsedItems.reduce((sum, item) => sum + (item.miktar * item.birim_fiyat), 0);
        console.log('Total amount:', totalAmount);

        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');

        // Insert Quote Header (Include musteri_id)
        console.log('Inserting quote header...');
        const quoteResult = await client.query(
            `INSERT INTO teklifler (musteri_id, musteri_adi, musteri_email, proje_adi, teklif_tarihi, toplam_tutar, durum, dosya_yolu, token)
             VALUES ($1, $2, $3, $4, NOW(), $5, 'BEKLEMEDE', $6, $7)
             RETURNING teklif_id`,
            [musteriId, formattedMusteriAdi, musteri_email, proje_adi, totalAmount, file.path, token]
        );
        const teklifId = quoteResult.rows[0].teklif_id;
        console.log('Quote header inserted, ID:', teklifId);

        // Insert Quote Items (Pending)
        console.log('Processing items...');
        for (const item of parsedItems) {
            // Find or Create Product (Preliminary check)
            let urunId;
            const productResult = await client.query('SELECT urun_id FROM urun WHERE urun_adi ILIKE $1', [item.malzeme_cinsi]);

            if (productResult.rows.length > 0) {
                urunId = productResult.rows[0].urun_id;
            } else {
                console.log('Creating new product:', item.malzeme_cinsi);
                const newProduct = await client.query(
                    'INSERT INTO urun (urun_adi, kategori, birim) VALUES ($1, $2, $3) RETURNING urun_id',
                    [item.malzeme_cinsi, 'Genel', item.birim || 'Adet']
                );
                urunId = newProduct.rows[0].urun_id;
                await client.query(
                    'INSERT INTO urun_stok (urun_id, toplam_stok, referans_degeri) VALUES ($1, 0, 10)',
                    [urunId]
                );
            }

            await client.query(
                `INSERT INTO teklif_kalemleri (teklif_id, malzeme_cinsi, miktar, birim, birim_fiyat, toplam_fiyat)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [teklifId, item.malzeme_cinsi, item.miktar, item.birim, item.birim_fiyat, item.miktar * item.birim_fiyat]
            );
        }

        await client.query('COMMIT');
        console.log('Transaction committed.');

        // Send Email
        console.log('Sending email...');
        const approvalLink = `https://doguaspanel.ch/quote/approve?token=${token}`;
        try {
            await sendQuoteEmail(musteri_email, formattedMusteriAdi, approvalLink, file.path);
            console.log('Email sent successfully.');
        } catch (emailError) {
            console.error('Email sending failed BUT quote created:', emailError);
            // We don't rollback here because the quote is created successfully. 
            // We just log the error.
        }

        res.json({ success: true, message: 'Teklif oluşturuldu ve müşteriye gönderildi.', teklifId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create quote workflow error:', error);
        // Cleanup file if error (with path validation)
        if (req.file) {
            safeUnlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Teklif oluşturulamadı: ' + error.message });
    } finally {
        client.release();
    }
};

// Public: Get Quote by Token
const getQuoteByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const result = await db.query('SELECT * FROM teklifler WHERE token = $1', [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Teklif bulunamadı veya geçersiz bağlantı.' });
        }

        const quote = result.rows[0];
        const itemsResult = await db.query('SELECT * FROM teklif_kalemleri WHERE teklif_id = $1', [quote.teklif_id]);

        res.json({
            success: true,
            data: {
                ...quote,
                items: itemsResult.rows
            }
        });
    } catch (error) {
        console.error('Get quote by token error:', error);
        res.status(500).json({ error: 'Teklif bilgileri alınamadı.' });
    }
};

// Public: Handle Decision
const handleQuoteDecision = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { token } = req.params;
        const { decision, reason } = req.body; // 'approve' or 'reject', reason for rejection

        await client.query('BEGIN');

        const quoteResult = await client.query('SELECT * FROM teklifler WHERE token = $1', [token]);
        if (quoteResult.rows.length === 0) throw new Error('Teklif bulunamadı.');

        const quote = quoteResult.rows[0];
        if (quote.durum !== 'BEKLEMEDE') throw new Error('Bu teklif zaten yanıtlanmış.');

        if (decision === 'reject') {
            await client.query(
                "UPDATE teklifler SET durum = 'REDDEDILDI', red_sebebi = $1 WHERE teklif_id = $2",
                [reason || null, quote.teklif_id]
            );
            await client.query('COMMIT');

            // Send notification to admin
            try {
                await sendQuoteRejectionNotification(quote.musteri_adi, reason, quote.teklif_id);
            } catch (emailError) {
                console.error('Failed to send rejection notification:', emailError);
            }

            return res.json({ success: true, message: 'Teklif reddedildi.' });
        }

        if (decision === 'approve') {
            // Get Customer ID from quote (it should be there now)
            let musteriId = quote.musteri_id;

            // Fallback if musteri_id is missing (for old quotes)
            if (!musteriId) {
                const formattedMusteriAdi = toTitleCase(quote.musteri_adi);
                const customerResult = await client.query('SELECT musteri_id FROM musteri WHERE musteri_adi ILIKE $1', [formattedMusteriAdi]);

                if (customerResult.rows.length > 0) {
                    musteriId = customerResult.rows[0].musteri_id;
                } else {
                    // This case should be rare now
                    const newCustomer = await client.query(
                        'INSERT INTO musteri (musteri_adi, musteri_iletisim_no, musteri_email) VALUES ($1, $2, $3) RETURNING musteri_id',
                        [formattedMusteriAdi, 'Belirtilmedi', quote.musteri_email]
                    );
                    musteriId = newCustomer.rows[0].musteri_id;
                }
            }

            // Get Items
            const itemsResult = await client.query('SELECT * FROM teklif_kalemleri WHERE teklif_id = $1', [quote.teklif_id]);

            // Create Active Orders and Deduct Stock
            for (const item of itemsResult.rows) {
                // Find Product ID (should exist from creation step, but safe to check)
                const productResult = await client.query('SELECT urun_id FROM urun WHERE urun_adi ILIKE $1', [item.malzeme_cinsi]);
                const urunId = productResult.rows[0].urun_id;

                // Create Order
                await client.query(
                    `INSERT INTO urun_musteri_islem 
                     (musteri_id, urun_id, islem_tarihi, satilan_adet, urun_satis_fiyati, toplam_satis_tutari, islemin_durumu, teklif_id)
                     VALUES ($1, $2, NOW(), $3, $4, $5, 'DEVAM EDIYOR', $6)`,
                    [
                        musteriId,
                        urunId,
                        Math.round(item.miktar),
                        item.birim_fiyat,
                        item.toplam_fiyat,
                        quote.teklif_id
                    ]
                );

                // Deduct Stock
                await client.query(
                    'UPDATE urun_stok SET toplam_stok = toplam_stok - $1 WHERE urun_id = $2',
                    [Math.round(item.miktar), urunId]
                );
            }

            await client.query("UPDATE teklifler SET durum = 'ONAYLANDI' WHERE teklif_id = $1", [quote.teklif_id]);
            await client.query('COMMIT');
            return res.json({ success: true, message: 'Teklif onaylandı, siparişler oluşturuldu ve stoktan düşüldü.' });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Quote decision error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

module.exports = {
    uploadQuote,
    createQuoteFromJson,
    createQuoteWithWorkflow, // New
    getQuotes,
    getQuoteById,
    getQuoteByToken, // New
    handleQuoteDecision, // New
    approveQuote,
    rejectQuote,
    deleteQuote,
    getCustomers,
    getProjectsByCustomer,
    getPreviousOrderItems
};

const db = require('../config/db');

/**
 * Get stock status for all products with critical level flagging
 */
const getStockStatus = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT u.urun_id AS id, u.urun_adi, u.kategori, u.birim,
              COALESCE(s.toplam_stok, 0) AS toplam_stok,
              COALESCE(s.referans_degeri, 0) AS referans_degeri,
              CASE 
                WHEN COALESCE(s.toplam_stok, 0) < COALESCE(s.referans_degeri, 0) THEN true
                ELSE false
              END AS is_critical
       FROM urun u
       LEFT JOIN urun_stok s ON u.urun_id = s.urun_id
       ORDER BY is_critical DESC, u.urun_adi`
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get stock status error:', error);
        res.status(500).json({ error: 'Stok durumu alınamadı.' });
    }
};

/**
 * Get stock history for a specific product
 */
const getStockHistory = async (req, res) => {
    try {
        const { productId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const result = await db.query(
            `SELECT l.log_id AS id, l.tablo_adi, l.kayit_id, l.islem_turu,
              l.eski_deger, l.yeni_deger, l.islem_zamani
       FROM log_islemler l
       WHERE l.tablo_adi = 'urun_stok' AND l.kayit_id = $1
       ORDER BY l.islem_zamani DESC
       LIMIT $2`,
            [productId, limit]
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get stock history error:', error);
        res.status(500).json({ error: 'Stok geçmişi alınamadı.' });
    }
};

module.exports = {
    getStockStatus,
    getStockHistory,
};

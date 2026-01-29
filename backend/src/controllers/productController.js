const db = require('../config/db');

/**
 * Get all products with pagination and search
 */
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const offset = (page - 1) * limit;

        let query = `
      SELECT u.urun_id AS id, u.urun_adi, u.kategori, u.birim
      FROM urun u
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        // Search filter
        if (search) {
            query += ` AND u.urun_adi ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Category filter
        if (category) {
            query += ` AND u.kategori = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered`;
        const countResult = await db.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count);

        // Add pagination
        query += ` ORDER BY u.urun_adi LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

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
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Ürünler alınamadı.' });
    }
};

/**
 * Get single product details
 */
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT u.urun_id AS id, u.urun_adi, u.kategori, u.birim,
              COALESCE(s.toplam_stok, 0) AS toplam_stok,
              COALESCE(s.referans_degeri, 0) AS referans_degeri
       FROM urun u
       LEFT JOIN urun_stok s ON u.urun_id = s.urun_id
       WHERE u.urun_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı.' });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({ error: 'Ürün bilgisi alınamadı.' });
    }
};

/**
 * Get all product categories
 */
const getCategories = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT DISTINCT kategori
       FROM urun
       WHERE kategori IS NOT NULL
       ORDER BY kategori`
        );

        res.json({
            success: true,
            categories: result.rows.map(row => row.kategori),
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Kategoriler alınamadı.' });
    }
};

module.exports = {
    getProducts,
    getProductById,
    getCategories,
};

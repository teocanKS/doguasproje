const db = require('../config/db');

/**
 * Get logs with filters (Admin only)
 */
const getLogs = async (req, res) => {
    try {
        const { startDate, endDate, userId, tableName } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        let query = `
      SELECT l.log_id AS id, l.tablo_adi, l.kayit_id, l.islem_turu AS islem_tipi,
             l.eski_deger, l.yeni_deger, l.islem_zamani,
             u.name || ' ' || u.surname AS kullanici_adi
      FROM log_islemler l
      LEFT JOIN users u ON l.kullanici_id = u.users_id
      WHERE 1=1
    `;

        const params = [];
        let paramIndex = 1;

        // Date filters
        if (startDate) {
            query += ` AND l.islem_zamani >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND l.islem_zamani <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        // Table name filter
        if (tableName) {
            query += ` AND l.tablo_adi = $${paramIndex}`;
            params.push(tableName);
            paramIndex++;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM (${query}) AS counted`;
        const countResult = await db.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count);

        // Add pagination and ordering
        query += ` ORDER BY l.islem_zamani DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Parse JSON strings for eski_deger and yeni_deger
        const logsWithParsedData = result.rows.map(log => {
            let eskiDeger = null;
            let yeniDeger = null;

            try {
                eskiDeger = log.eski_deger ? JSON.parse(log.eski_deger) : null;
            } catch (e) {
                eskiDeger = log.eski_deger;
            }

            try {
                yeniDeger = log.yeni_deger ? JSON.parse(log.yeni_deger) : null;
            } catch (e) {
                yeniDeger = log.yeni_deger;
            }

            return {
                ...log,
                eski_deger: eskiDeger,
                yeni_deger: yeniDeger,
            };
        });

        res.json({
            success: true,
            data: logsWithParsedData,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ error: 'Loglar alınamadı.' });
    }
};

/**
 * Clear all logs (Admin only)
 */
const deleteLogs = async (req, res) => {
    try {
        await db.query('TRUNCATE TABLE log_islemler RESTART IDENTITY');
        res.json({ success: true, message: 'Tüm loglar başarıyla temizlendi.' });
    } catch (error) {
        console.error('Clear logs error:', error);
        res.status(500).json({ error: 'Loglar temizlenemedi.' });
    }
};

module.exports = {
    getLogs,
    deleteLogs,
};

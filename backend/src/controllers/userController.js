const db = require('../config/db');
const emailService = require('../utils/emailService');

/**
 * Get pending users (waiting for approval)
 * Admin only
 */
const getPendingUsers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT users_id AS id, email, name, surname, role, created_at
       FROM users
       WHERE is_approved = false
       ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users: result.rows,
        });
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ error: 'Bekleyen kullanıcılar alınamadı.' });
    }
};

/**
 * Approve user
 * Admin only
 */
const approveUser = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `UPDATE users
       SET is_approved = true
       WHERE users_id = $1
       RETURNING users_id AS id, email, name, surname, is_approved`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Send approval email
        await emailService.sendAccountApprovedEmail(result.rows[0]);

        res.json({
            success: true,
            message: 'Kullanıcı başarıyla onaylandı.',
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Kullanıcı onaylanamadı.' });
    }
};

/**
 * Get all users
 * Admin only
 */
const getAllUsers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT users_id AS id, email, name, surname, role, is_approved, created_at
       FROM users
       ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users: result.rows,
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Kullanıcılar alınamadı.' });
    }
};

/**
 * Reject user (Delete and notify)
 * Admin only
 */
const rejectUser = async (req, res) => {
    try {
        const { id } = req.params;

        // First get user info to send email
        const userResult = await db.query(
            'SELECT * FROM users WHERE users_id = $1',
            [id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const user = userResult.rows[0];

        // Delete user
        await db.query('DELETE FROM users WHERE users_id = $1', [id]);

        // Send rejection email
        await emailService.sendRegistrationRejectedEmail(user);

        res.json({
            success: true,
            message: 'Kullanıcı başvurusu reddedildi ve silindi.',
        });
    } catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ error: 'Kullanıcı reddedilemedi.' });
    }
};

module.exports = {
    getPendingUsers,
    approveUser,
    getAllUsers,
    rejectUser,
};

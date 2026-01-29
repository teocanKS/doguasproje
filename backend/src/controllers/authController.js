const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const emailService = require('../utils/emailService');

/**
 * User Registration
 * Creates user with role 'personel' and is_approved = false
 */
const register = async (req, res) => {
    try {
        const { email, password, name, surname, telefon } = req.body;

        // Validate required fields
        if (!email || !password || !name || !surname) {
            return res.status(400).json({ error: 'Email, şifre, ad ve soyad gereklidir.' });
        }

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT users_id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Bu email adresi zaten kayıtlı.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user (role: personel, is_approved: false)
        const result = await db.query(
            `INSERT INTO users (email, password, name, surname, role, is_approved, created_at)
       VALUES ($1, $2, $3, $4, 'personel', false, NOW())
       RETURNING users_id AS id, email, name, surname, role, is_approved`,
            [email, hashedPassword, name, surname]
        );

        const user = result.rows[0];

        // Send registration received email
        await emailService.sendRegistrationReceivedEmail(user);

        res.status(201).json({
            success: true,
            message: 'Kayıt başarılı! Yönetici onayı bekleniyor.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                role: user.role,
                is_approved: user.is_approved,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
    }
};

/**
 * User Login
 * Validates credentials and checks if user is approved
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email ve şifre gereklidir.' });
        }

        // Find user by email
        const result = await db.query(
            'SELECT users_id, email, password, name, surname, role, is_approved FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Geçersiz email veya şifre.' });
        }

        const user = result.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Geçersiz email veya şifre.' });
        }

        // Check if user is approved
        if (!user.is_approved) {
            return res.status(403).json({
                error: 'Hesabınız henüz onaylanmamış. Lütfen yönetici onayını bekleyin.',
                needsApproval: true,
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.users_id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Set secure cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Log login action
        await db.query(
            `INSERT INTO log_islemler (tablo_adi, kayit_id, islem_turu, yeni_deger, islem_zamani, kullanici_id)
             VALUES ('auth', $1, 'LOGIN', $2, NOW(), $3)`,
            [user.users_id, JSON.stringify({ message: 'Kullanıcı giriş yaptı', ip: req.ip }), user.users_id]
        );

        res.json({
            success: true,
            message: 'Giriş başarılı!',
            token,
            user: {
                id: user.users_id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
    }
};

/**
 * Get Current User
 * Returns user info from JWT token
 */
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            'SELECT users_id AS id, email, name, surname, role, is_approved, created_at FROM users WHERE users_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        res.json({
            success: true,
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Kullanıcı bilgileri alınamadı.' });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
};

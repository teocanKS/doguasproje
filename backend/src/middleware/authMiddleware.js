const jwt = require('jsonwebtoken');

/**
 * Authentication middleware - Verify JWT token
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Erişim reddedildi. Token bulunamadı.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, role }
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
};

/**
 * Admin-only middleware - Requires authentication + admin role
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Erişim reddedildi. Giriş yapmanız gerekiyor.' });
    }

    if (req.user.role !== 'yonetici') {
        return res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
    }

    next();
};

/**
 * Combination middleware: Authenticate + Require Admin
 */
const adminOnly = [authenticateToken, requireAdmin];

module.exports = {
    authenticateToken,
    requireAdmin,
    adminOnly,
};

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const jobRoutes = require('./routes/jobs');
const historyRoutes = require('./routes/history');
const logRoutes = require('./routes/logs');
const dashboardRoutes = require('./routes/dashboard');

// Import cron jobs
const inactivityCheck = require('./jobs/inactivityCheck');

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Nginx)
const PORT = 3000; // Force port 3000 to avoid conflicts

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            frameAncestors: ["'self'", "https://doguaspanel.ch", "https://www.doguaspanel.ch"],
            // Add other directives as needed
        }
    },
    frameguard: false // Disable X-Frame-Options to allow framing
}));

// Rate Limiting (App Level)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased from 100 to 1000 to prevent false positives
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin.' }
});
app.use('/api/', limiter); // Apply to API routes

app.use(cors({
    origin: ['https://doguaspanel.ch', 'https://www.doguaspanel.ch'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for large payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
// Use absolute path to /var/www/doguas/uploads to match system structure
const path = require('path');
const uploadsPath = '/var/www/doguas/uploads';
app.use('/uploads', (req, res, next) => {
    // Allow embedding in iframes and CORS for PDF.js
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://doguaspanel.ch https://www.doguaspanel.ch");
    next();
}, express.static(uploadsPath));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Doğu AŞ Backend API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/analysis', require('./routes/analysis'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint bulunamadı.' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        error: error.message || 'Sunucu hatası oluştu.',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Doğu AŞ Backend API running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database: ${process.env.DB_NAME || 'doguas_db'}\n`);

    // Start cron jobs
    inactivityCheck.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    db.pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});

module.exports = app;

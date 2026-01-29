const cron = require('node-cron');
const db = require('../config/db');
const emailService = require('../utils/emailService');

/**
 * Inactivity check cron job
 * Runs daily at midnight (00:00)
 */
const inactivityCheckJob = cron.schedule('0 0 * * *', async () => {
    console.log('Running inactivity check job...');

    try {
        // Query customers with inactivity >= 150 days (critical)
        const result = await db.query(
            `WITH customer_last_purchase AS (
        SELECT 
          m.musteri_id,
          m.musteri_adi,
          m.musteri_iletisim_no,
          MAX(i.islem_tarihi) AS son_alis_tarihi,
          EXTRACT(DAY FROM (NOW() - MAX(i.islem_tarihi)))::integer AS inactivity_days
        FROM musteri m
        LEFT JOIN urun_musteri_islem i ON m.musteri_id = i.musteri_id AND i.islemin_durumu = 'TAMAMLANDI'
        GROUP BY m.musteri_id, m.musteri_adi, m.musteri_iletisim_no
      )
      SELECT *
      FROM customer_last_purchase
      WHERE inactivity_days >= 150
      ORDER BY inactivity_days DESC`
        );

        if (result.rows.length > 0) {
            console.log(`Found ${result.rows.length} critically inactive customers (150+ days)`);

            // Send email alert
            const emailSent = await emailService.sendInactivityAlert(result.rows);

            if (emailSent) {
                console.log('✓ Inactivity alert email sent successfully');
            } else {
                console.error('✗ Failed to send inactivity alert email');
            }
        } else {
            console.log('No critically inactive customers found');
        }
    } catch (error) {
        console.error('Error running inactivity check job:', error);
    }
}, {
    scheduled: false, // Don't start automatically, will be started manually
    timezone: 'Europe/Istanbul',
});

module.exports = {
    start: () => {
        inactivityCheckJob.start();
        console.log('✓ Inactivity check cron job started (runs daily at midnight)');
    },
    stop: () => {
        inactivityCheckJob.stop();
        console.log('✗ Inactivity check cron job stopped');
    },
};

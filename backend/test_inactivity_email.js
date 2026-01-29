require('dotenv').config({ path: '/root/doguas/backend/.env' });
const emailService = require('./src/utils/emailService');

async function testInactivityEmail() {
    console.log('Testing Inactivity Alert Email...');

    // Mock data covering all thresholds
    const mockCustomers = [
        {
            musteri_adi: 'Test Müşteri 1 (30 Gün)',
            iletisim_kisi: 'Ahmet Yılmaz',
            telefon: '5551112233',
            son_alis_tarihi: '2025-11-03',
            inactivity_days: 30
        },
        {
            musteri_adi: 'Test Müşteri 2 (60 Gün)',
            iletisim_kisi: 'Ayşe Demir',
            telefon: '5554445566',
            son_alis_tarihi: '2025-10-04',
            inactivity_days: 60
        },
        {
            musteri_adi: 'Test Müşteri 3 (90 Gün)',
            iletisim_kisi: 'Mehmet Kaya',
            telefon: '5557778899',
            son_alis_tarihi: '2025-09-04',
            inactivity_days: 90
        },
        {
            musteri_adi: 'Test Müşteri 4 (120 Gün)',
            iletisim_kisi: 'Fatma Çelik',
            telefon: '5550001122',
            son_alis_tarihi: '2025-08-05',
            inactivity_days: 120
        },
        {
            musteri_adi: 'Test Müşteri 5 (150 Gün)',
            iletisim_kisi: 'Ali Şahin',
            telefon: '5553334455',
            son_alis_tarihi: '2025-07-06',
            inactivity_days: 150
        }
    ];

    console.log(`Sending email for ${mockCustomers.length} mock customers...`);

    const result = await emailService.sendInactivityAlert(mockCustomers);

    if (result) {
        console.log('✅ Inactivity Alert Email Sent Successfully!');
    } else {
        console.error('❌ Failed to send inactivity alert email.');
    }
}

testInactivityEmail();

require('dotenv').config({ path: '/root/doguas/backend/.env' });
const emailService = require('./src/utils/emailService');

async function testRegistrationEmail() {
    console.log('Testing Registration Received Email...');

    // Dummy user data
    const user = {
        name: 'Test',
        surname: 'Kullanıcı',
        email: 'teocan2408@gmail.com' // Sending to admin for verification
    };

    console.log('Sending email to:', user.email);

    const result = await emailService.sendRegistrationReceivedEmail(user);

    if (result) {
        console.log('✅ Registration Email Sent Successfully!');
    } else {
        console.error('❌ Failed to send registration email.');
    }
}

testRegistrationEmail();

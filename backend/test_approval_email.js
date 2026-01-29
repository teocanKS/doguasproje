require('dotenv').config({ path: '/root/doguas/backend/.env' });
const emailService = require('./src/utils/emailService');

async function testApprovalEmail() {
    console.log('Testing Account Approved Email...');

    // Dummy user data
    const user = {
        name: 'Test',
        surname: 'Kullanıcı',
        email: 'teocan2408@gmail.com' // Sending to admin for verification
    };

    console.log('Sending email to:', user.email);

    const result = await emailService.sendAccountApprovedEmail(user);

    if (result) {
        console.log('✅ Approval Email Sent Successfully!');
    } else {
        console.error('❌ Failed to send approval email.');
    }
}

testApprovalEmail();

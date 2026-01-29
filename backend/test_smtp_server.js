const nodemailer = require('nodemailer');
require('dotenv').config({ path: '/root/doguas/backend/.env' });

async function testSMTP() {
    console.log('Testing SMTP Connection...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: 'mali.erke23@gmail.com', // User's email from screenshot
            subject: 'SMTP Test',
            text: 'This is a test email from the server.'
        });
        console.log('✅ Test Email Sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error);
    }
}

testSMTP();

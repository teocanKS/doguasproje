require('dotenv').config({ path: '/root/doguas/backend/.env' });
const nodemailer = require('nodemailer');

async function testSMTP() {
    console.log('Nodemailer object:', nodemailer);
    console.log('Testing SMTP Connection...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('Admin Email:', process.env.ADMIN_EMAIL);

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
            from: `"Test" <${process.env.SMTP_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: 'SMTP Test Email',
            text: 'This is a test email to verify the SMTP configuration.',
        });

        console.log('✅ Test Email Sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error);
    }
}

testSMTP();

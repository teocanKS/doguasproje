const nodemailer = require('nodemailer');
const path = require('path');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send inactivity alert email
 */
const sendInactivityAlert = async (inactiveCustomers) => {
  try {
    const transporter = createTransporter();

    // Group customers by alert level
    const grouped = {
      danger: inactiveCustomers.filter(c => c.inactivity_days >= 120),
      warning: inactiveCustomers.filter(c => c.inactivity_days >= 60 && c.inactivity_days < 120),
      caution: inactiveCustomers.filter(c => c.inactivity_days >= 30 && c.inactivity_days < 60),
    };

    // Build HTML email content
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h2 { color: #333; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            .danger { background-color: #ffebee; }
            .warning { background-color: #fff3e0; }
            .caution { background-color: #fffde7; }
          </style>
        </head>
        <body>
          <h2>🔔 Doğu AŞ - Müşteri Hareketsizlik Raporu</h2>
          <p>Merhaba,</p>
          <p>Aşağıdaki müşteriler belirtilen süre içinde alış yapmamıştır:</p>
    `;

    // Add danger level customers (120+ days)
    if (grouped.danger.length > 0) {
      htmlContent += `
        <h3 style="color: #d32f2f;">🔴 Kritik Durum (120+ gün)</h3>
        <table>
          <thead>
            <tr>
              <th>Müşteri Adı</th>
              <th>İletişim Kişi</th>
              <th>Telefon</th>
              <th>Son Alış Tarihi</th>
              <th>Hareketsiz Gün</th>
            </tr>
          </thead>
          <tbody>
      `;
      grouped.danger.forEach(customer => {
        htmlContent += `
          <tr class="danger">
            <td>${customer.musteri_adi}</td>
            <td>${customer.iletisim_kisi || '-'}</td>
            <td>${customer.telefon || '-'}</td>
            <td>${customer.son_alis_tarihi || 'Hiç alış yok'}</td>
            <td>${customer.inactivity_days} gün</td>
          </tr>
        `;
      });
      htmlContent += `</tbody></table>`;
    }

    // Add warning level customers (60-119 days)
    if (grouped.warning.length > 0) {
      htmlContent += `
        <h3 style="color: #f57c00;">🟠 Uyarı (60-119 gün)</h3>
        <table>
          <thead>
            <tr>
              <th>Müşteri Adı</th>
              <th>İletişim Kişi</th>
              <th>Telefon</th>
              <th>Son Alış Tarihi</th>
              <th>Hareketsiz Gün</th>
            </tr>
          </thead>
          <tbody>
      `;
      grouped.warning.forEach(customer => {
        htmlContent += `
          <tr class="warning">
            <td>${customer.musteri_adi}</td>
            <td>${customer.iletisim_kisi || '-'}</td>
            <td>${customer.telefon || '-'}</td>
            <td>${customer.son_alis_tarihi || 'Hiç alış yok'}</td>
            <td>${customer.inactivity_days} gün</td>
          </tr>
        `;
      });
      htmlContent += `</tbody></table>`;
    }

    // Add caution level customers (30-59 days)
    if (grouped.caution.length > 0) {
      htmlContent += `
        <h3 style="color: #fbc02d;">🟡 Dikkat (30-59 gün)</h3>
        <table>
          <thead>
            <tr>
              <th>Müşteri Adı</th>
              <th>İletişim Kişi</th>
              <th>Telefon</th>
              <th>Son Alış Tarihi</th>
              <th>Hareketsiz Gün</th>
            </tr>
          </thead>
          <tbody>
      `;
      grouped.caution.forEach(customer => {
        htmlContent += `
          <tr class="caution">
            <td>${customer.musteri_adi}</td>
            <td>${customer.iletisim_kisi || '-'}</td>
            <td>${customer.telefon || '-'}</td>
            <td>${customer.son_alis_tarihi || 'Hiç alış yok'}</td>
            <td>${customer.inactivity_days} gün</td>
          </tr>
        `;
      });
      htmlContent += `</tbody></table>`;
    }

    htmlContent += `
          <p>Bu müşterilerle iletişime geçmeniz önerilir.</p>
          <p>---<br>Doğu AŞ Envanter Sistemi</p>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Doğu AŞ Sistem" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: '🔔 Müşteri Hareketsizlik Uyarısı',
      html: htmlContent,
    });

    console.log('Inactivity alert email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending inactivity alert email:', error);
    return false;
  }
};

/**
 * Send account approved email
 */
const sendAccountApprovedEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background-color: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 Hesabınız Onaylandı!</h2>
            </div>
            <div class="content">
              <p>Merhaba <strong>${user.name} ${user.surname}</strong>,</p>
              <p>Doğu AŞ Envanter ve Süreç Takip Sistemi'ne yaptığınız kayıt başvurusu yönetici tarafından onaylanmıştır.</p>
              <p>Artık sisteme giriş yapabilir ve tüm özellikleri kullanabilirsiniz.</p>
              <div style="text-align: center;">
                <a href="https://doguaspanel.ch/login" class="button">Sisteme Giriş Yap</a>
              </div>
            </div>
            <div class="footer">
              <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevaplamayınız.</p>
              <p>Doğu AŞ</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Doğu AŞ Sistem" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: '✅ Hesabınız Onaylandı - Doğu AŞ',
      html: htmlContent,
    });

    console.log('Account approved email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending account approved email:', error);
    return false;
  }
};

/**
 * Send registration received email
 */
const sendRegistrationReceivedEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background-color: #2196F3; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📝 Kaydınız Alındı</h2>
            </div>
            <div class="content">
              <p>Merhaba <strong>${user.name} ${user.surname}</strong>,</p>
              <p>Doğu AŞ Envanter ve Süreç Takip Sistemi'ne kayıt başvurunuz başarıyla alınmıştır.</p>
              <p>Hesabınız yönetici tarafından incelendikten sonra onaylanacaktır. Onaylandığında size tekrar e-posta ile bilgi verilecektir.</p>
              <p>Sabrınız için teşekkür ederiz.</p>
            </div>
            <div class="footer">
              <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevaplamayınız.</p>
              <p>Doğu AŞ</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Doğu AŞ Sistem" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: '📝 Kaydınız Alındı - Doğu AŞ',
      html: htmlContent,
    });

    console.log('Registration received email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending registration received email:', error);
    return false;
  }
};

/**
 * Send registration rejected email
 */
const sendRegistrationRejectedEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background-color: #F44336; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>❌ Kayıt Başvurunuz Reddedildi</h2>
            </div>
            <div class="content">
              <p>Merhaba <strong>${user.name} ${user.surname}</strong>,</p>
              <p>Doğu AŞ Envanter ve Süreç Takip Sistemi'ne yaptığınız kayıt başvurusu yönetici tarafından incelenmiş ve reddedilmiştir.</p>
              <p>Bu konuda bir yanlışlık olduğunu düşünüyorsanız lütfen yönetici ile iletişime geçiniz.</p>
            </div>
            <div class="footer">
              <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevaplamayınız.</p>
              <p>Doğu AŞ</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"Doğu AŞ Sistem" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: '❌ Kayıt Başvurunuz Reddedildi - Doğu AŞ',
      html: htmlContent,
    });

    console.log('Registration rejected email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending registration rejected email:', error);
    return false;
  }
};

/**
 * Send quote email to customer
 */
const sendQuoteEmail = async (customerEmail, customerName, quoteLink, filePath) => {
  try {
    const transporter = createTransporter();

    // Helper to title case names
    const toTitleCase = (str) => {
      return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
      );
    };

    const formattedName = toTitleCase(customerName);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
            .logo-container { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
            .logo-container img { width: 300px; max-width: 100%; height: auto; display: block; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h2 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
            .message { color: #4b5563; margin-bottom: 30px; }
            .button-container { text-align: center; margin: 35px 0; }
            .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
            .button:hover { background-color: #1d4ed8; color: #ffffff !important; }
            .info-box { background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 15px; border-radius: 4px; font-size: 14px; color: #4b5563; margin-top: 30px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-container">
              <img src="cid:logo" alt="Doğu AŞ Logo" width="200" style="width: 200px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
            </div>
            <div class="header">
              <h2>Fiyat Teklifiniz Hazır</h2>
            </div>
            <div class="content">
              <div class="greeting">Sayın ${formattedName},</div>
              <div class="message">
                <p>Doğu AŞ olarak talebiniz üzerine hazırladığımız detaylı fiyat teklifini ekte bulabilirsiniz.</p>
                <p>Teklifimizi inceledikten sonra, aşağıdaki güvenli bağlantı üzerinden onay veya ret kararınızı bize kolayca iletebilirsiniz.</p>
              </div>
              
              <div class="button-container">
                <a href="${quoteLink}" class="button">Teklifi İncele ve Yanıtla</a>
              </div>

              <div class="info-box">
                <strong>Bilgilendirme:</strong> Teklif detayları, birim fiyatlar ve teknik şartlar ekteki PDF dosyasında yer almaktadır.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Doğu AŞ İnşaat Malz. San. Tic. Ltd. Şti.</p>
              <p>Bu e-posta otomatik olarak oluşturulmuştur.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Doğu AŞ Teklif" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `📋 Fiyat Teklifi: ${formattedName} - Doğu AŞ`,
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, '../../uploads/logo.png'),
          cid: 'logo'
        }
      ]
    };

    if (filePath) {
      mailOptions.attachments.push({
        path: filePath
      });
    }

    console.log('Sending email to:', customerEmail);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. MessageId:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending quote email:', error);
    return false;
  }
};

/**
 * Send quote rejection notification to admin
 */
const sendQuoteRejectionNotification = async (customerName, reason, quoteId) => {
  try {
    const transporter = createTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
            .logo-container { background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; }
            .logo-container img { width: 300px; max-width: 100%; height: auto; display: block; margin: 0 auto; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .header h2 { margin: 0; font-size: 20px; font-weight: 600; }
            .content { padding: 30px; }
            .info-row { margin-bottom: 15px; border-bottom: 1px solid #f3f4f6; padding-bottom: 15px; }
            .info-label { font-weight: 600; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
            .info-value { color: #1f2937; font-size: 16px; }
            .reason-box { background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 15px; margin-top: 20px; }
            .reason-title { color: #991b1b; font-weight: 600; margin-bottom: 5px; }
            .reason-text { color: #7f1d1d; }
            .footer { background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo-container">
              <img src="cid:logo" alt="Doğu AŞ Logo" width="200" style="width: 200px; max-width: 100%; height: auto; display: block; margin: 0 auto;">
            </div>
            <div class="header">
              <h2>Teklif Reddedildi</h2>
            </div>
            <div class="content">
              <div class="info-row">
                <div class="info-label">Müşteri</div>
                <div class="info-value">${customerName}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Teklif ID</div>
                <div class="info-value">#${quoteId}</div>
              </div>
              
              <div class="reason-box">
                <div class="reason-title">Red Sebebi:</div>
                <div class="reason-text">${reason || 'Sebep belirtilmedi.'}</div>
              </div>
            </div>
            <div class="footer">
              <p>Bu bildirim otomatik olarak gönderilmiştir.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Doğu AŞ Sistem" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `❌ Teklif Reddedildi: ${customerName}`,
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.join(__dirname, '../../uploads/logo.png'),
          cid: 'logo'
        }
      ]
    };

    console.log('Sending rejection notification to admin...');
    await transporter.sendMail(mailOptions);
    console.log('Rejection notification sent.');
    return true;
  } catch (error) {
    console.error('Error sending rejection notification:', error);
    return false;
  }
};

module.exports = {
  sendInactivityAlert,
  sendAccountApprovedEmail,
  sendRegistrationReceivedEmail,
  sendRegistrationRejectedEmail,
  sendQuoteEmail,
  sendQuoteRejectionNotification
};

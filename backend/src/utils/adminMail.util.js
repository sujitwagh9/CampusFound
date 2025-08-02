// src/utils/mail.util.js
import nodemailer from 'nodemailer';

export const sendEmailNotification = async (to, subject, text, html = '') => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',  // or use host/port for custom providers
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"CampusFound" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
  }
};

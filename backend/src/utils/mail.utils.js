import nodemailer from 'nodemailer';

export const sendStatusChangeMail = async (to, item, newStatus) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"SUJIT's CampusFound" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Status Update for Your Reported Item: ${item.title}`,
      text: `Hello,\n\nThe status of your item "${item.title}" has been changed to "${newStatus}".\n\nThank you!`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent to ${to}: ${info.response}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
  }
};
import transporter from './transporter.js'; // ensure you import your configured transporter

export const sendClaimRequestMail = async (reporter, item, claimer) => {
  if (!reporter || !reporter.email) {
    console.error('Reporter details missing or incomplete:', reporter);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: reporter.email,
    subject: `Claim Request for Item: ${item.title}`,  // Assuming item.title is correct
    text: `Hello ${reporter.username},\n\n` +
          `A claim request has been made for your reported item "${item.title}".\n` +
          `Requested by: ${claimer.username} (${claimer.email})\n\n` +
          `Please review the claim request at your earliest convenience.\n\n` +
          `Thank you,\nCampusFound Team`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Claim request email sent successfully');
  } catch (error) {
    console.error('Error sending claim request email:', error);
  }
};

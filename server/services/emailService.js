const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Bhishi App" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error("Email error:", err.message);
    // Don't throw — email failure shouldn't break the request
  }
};

exports.sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: "Welcome to Bhishi App!",
    html: `<h2>Welcome, ${user.name}!</h2><p>Your account has been created successfully.</p>`,
  });

exports.sendPasswordResetEmail = (user, resetUrl) =>
  sendEmail({
    to: user.email,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

exports.sendGroupInviteEmail = (email, inviterName, groupName, inviteLink) =>
  sendEmail({
    to: email,
    subject: `You're invited to join ${groupName} on Bhishi App`,
    html: `
      <h2>Group Invitation</h2>
      <p><strong>${inviterName}</strong> has invited you to join the Bhishi group <strong>${groupName}</strong>.</p>
      <a href="${inviteLink}" style="background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Join Group</a>
    `,
  });

exports.sendPaymentReminderEmail = (user, group, month) =>
  sendEmail({
    to: user.email,
    subject: `Payment Reminder: ${group.name} - Month ${month}`,
    html: `
      <h2>Payment Reminder</h2>
      <p>Hi ${user.name}, your contribution of <strong>₹${group.monthlyAmount}</strong> for <strong>${group.name}</strong> (Month ${month}) is pending.</p>
      <p>Please log in to complete your payment.</p>
    `,
  });

exports.sendPayoutAnnouncementEmail = (user, group, amount, month) =>
  sendEmail({
    to: user.email,
    subject: `Payout Announcement: You receive ₹${amount} this month!`,
    html: `
      <h2>Congratulations, ${user.name}!</h2>
      <p>You are the payout recipient for <strong>${group.name}</strong> in Month ${month}.</p>
      <p>You will receive <strong>₹${amount}</strong> shortly.</p>
    `,
  });

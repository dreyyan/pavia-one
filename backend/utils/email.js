// [IMPORT] Nodemailer
const nodemailer = require("nodemailer");
require("dotenv").config();

// [CONFIG] Create transporter for Gmail with logging enabled
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true,
  debug: true,
});

// [VERIFY] Check connection once at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("[EMAIL] Nodemailer connection error:", error);
  } else {
    console.log("[EMAIL] Nodemailer is ready to send emails");
  }
});

// ? Function to send password reset email
async function sendResetEmail(to, resetLink) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
      <p>If you didn’t request this, you can ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Reset email sent to ${to}`);
  } catch (err) {
    console.error("[EMAIL] Failed to send reset email:", err);
    throw new Error("Failed to send reset email");
  }
}

// ? TEST FUNCTION - run this to quickly check email sending
async function testEmail() {
  try {
    const testRecipient = process.env.EMAIL_USER; // send to yourself
    const testLink = "http://localhost:5173/reset-password/testtoken?role=adviser";
    await sendResetEmail(testRecipient, testLink);
    console.log("[EMAIL TEST] Test email sent successfully!");
  } catch (err) {
    console.error("[EMAIL TEST] Error sending test email:", err);
  }
}

// Uncomment the line below to run the test immediately
// testEmail();

// [EXPORT]
module.exports = { sendResetEmail, testEmail };
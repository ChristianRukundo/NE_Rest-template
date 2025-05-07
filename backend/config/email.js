const nodemailer = require("nodemailer");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "user@example.com",
    pass: process.env.EMAIL_PASS || "password",
  },
});

const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from:
        process.env.EMAIL_FROM || '"Inventory System" <noreply@inventory.com>',
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = {
  sendEmail,
};

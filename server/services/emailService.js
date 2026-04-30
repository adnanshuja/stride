const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

const hasConfig = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && EMAIL_FROM;

let transporter = null;

if (hasConfig) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
} else {
  console.warn('[emailService] SMTP not configured — email sending disabled.');
}

async function sendSignupCode(email, code) {
  if (!transporter) {
    console.warn('[emailService] Cannot send email — SMTP not configured.');
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #51FAAA;">StrideSync — Your Signup Code</h2>
      <p style="color: #333; font-size: 14px;">Use the code below to complete your account setup:</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
        <code style="font-size: 24px; letter-spacing: 4px; font-weight: bold; color: #0C0E1D;">${code}</code>
      </div>
      <p style="color: #666; font-size: 12px;">This code expires in 7 days.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 11px;">StrideSync — Team Hourly Activity Tracker</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'StrideSync — Your Signup Code',
      html,
    });
    console.log(`[emailService] Signup code sent to ${email}`);
  } catch (err) {
    console.error(`[emailService] Failed to send email to ${email}:`, err.message);
  }
}

module.exports = { sendSignupCode };

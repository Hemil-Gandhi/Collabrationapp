import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: env.EMAIL_USER && env.EMAIL_PASS ? {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  } : undefined,
});

transporter
  .verify()
  .catch((error) => {
    logger.error("Error connecting to email service:", error);
  });

export async function sendOtpEmail(toEmail: string, otp: string): Promise<void> {
  const mailOptions = {
    from: `"Collab Hub" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #09090b; padding: 40px 32px; border-radius: 12px;">
        <h2 style="color: #ffffff; margin: 0 0 8px 0; font-size: 22px;">Verification Code</h2>
        <p style="color: #a1a1aa; margin: 0 0 20px 0; font-size: 14px;">This code expires in 10 minutes.</p>
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 28px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #ffffff; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #71717a; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

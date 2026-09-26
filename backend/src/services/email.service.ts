import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  const isGmail = env.EMAIL_HOST.includes("gmail.com");
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: isGmail ? 465 : env.EMAIL_PORT,
    secure: isGmail ? true : env.EMAIL_PORT === 465,
    auth: env.EMAIL_USER && env.EMAIL_PASS ? {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    } : undefined,
  });
  return transporter;
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<void> {
  const mailOptions = {
    from: `"CreatorLink" <${env.EMAIL_FROM || env.EMAIL_USER}>`,
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

  await getTransporter().sendMail(mailOptions);
}

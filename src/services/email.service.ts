import nodemailer from "nodemailer";

import { env } from "../config/env.js";

type EmailSendResult = {
  delivered: boolean;
  channel: "smtp" | "console";
};

const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  });
};

const transporter = createTransporter();

export const sendLoginOtpEmail = async (email: string, code: string): Promise<EmailSendResult> => {
  if (transporter) {
    await transporter.sendMail({
      from: env.SMTP_FROM || "Circle <no-reply@circle.app>",
      to: email,
      subject: "Your Circle login code",
      text: `Your Circle code is ${code}. It expires in ${env.OTP_EXPIRES_MINUTES} minutes.`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color: #0f172a;">
          <p>Your Circle code is:</p>
          <p style="font-size: 24px; font-weight: 700; letter-spacing: 2px;">${code}</p>
          <p>This code expires in ${env.OTP_EXPIRES_MINUTES} minutes.</p>
        </div>
      `,
    });

    return {
      delivered: true,
      channel: "smtp",
    };
  }

  console.log(`[OTP] ${email} => ${code}`);

  return {
    delivered: true,
    channel: "console",
  };
};

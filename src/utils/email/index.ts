import nodemailer from "nodemailer";
import { MailOptions } from "nodemailer/lib/sendmail-transport";
import { devConfig } from "../../config/env/dev.config";

export const sendMail = async (mailOptions: MailOptions) => {
    const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        service: "gmail", 
        port: 587,
        secure: false,
        auth: {
            user: devConfig.emailUsername,
            pass: devConfig.emailPassword
        }
    })
    mailOptions.from = `Social Media App <${devConfig.emailUsername}>`;
    return (await transport.sendMail(mailOptions));
    
};




export function otpEmailTemplate(otp: string, name: string) {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Your Verification Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; font-size: 16px; padding: 20px; color: #353535ff; line-height:1.6;">
      <h3 style="margin: 0 0 10px;">Hi ${name} 👋,</h3>
      <p style="margin: 0 0 15px;">Your verification code is:</p>
      <div style="font-size: 26px; font-weight: bold; letter-spacing: 6px; margin: 10px 0; color:#0f1724; padding:12px 20px; border:2px dashed #0f1724; border-radius:6px; text-align:center; display:inline-block;">
        ${otp}
      </div>
      <p style="margin: 10px 0;">This code will expire in 5 minutes.</p>
      <p style="margin: 0; font-size: 12px; color: #575757ff;">If you didn’t request this, you can safely ignore this email.</p>
    </body>
  </html>
  `;
}

import nodemailer from "nodemailer";
import { MailOptions } from "nodemailer/lib/sendmail-transport";
import { devConfig } from "../../config/env/dev.config";
import { IUser } from "../common";

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


// *******     Send Mention Emails     ******
interface SendMentionEmailParams {
  users: IUser[];
  sender: IUser;
  entityType: "post" | "comment";
  postId: string;
  content?: string;
}

export const sendMentionEmails = async ({
  users,
  sender,
  entityType,
  postId,
  content,
}: SendMentionEmailParams) => {
  if (!users.length) return;

  const postUrl = `${process.env.CLIENT_URL}/${entityType}/${postId}`;

  await Promise.allSettled(
    users.map((user) =>
      sendMail({
        to: user.email,
        subject: `${sender.firstName} mentioned you in a ${entityType}`,
        html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Mention Notification</title>
</head>

<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;background:#f3f4f6;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

  <!-- Header -->
  <tr>
    <td
      style="
        background:linear-gradient(135deg,#2563eb,#3b82f6);
        padding:32px;
        text-align:center;
        color:#ffffff;
      "
    >
      <h1 style="margin:0;font-size:28px;">
        👋 You've been mentioned
      </h1>

      <p style="margin-top:10px;font-size:15px;opacity:.9;">
        Someone wants your attention.
      </p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:35px;">

      <p style="font-size:16px;color:#374151;margin:0 0 18px;">
        Hello <strong>${user.firstName}</strong>,
      </p>

      <p style="font-size:16px;line-height:28px;color:#4b5563;">
        <strong>${sender.firstName} ${sender.lastName}</strong>
        mentioned you in a
        <strong>${entityType}</strong>.
      </p>

      ${content
            ? `
      <div
        style="
          margin:30px 0;
          padding:18px;
          background:#f9fafb;
          border-left:4px solid #2563eb;
          border-radius:8px;
          color:#374151;
          line-height:26px;
          white-space:pre-wrap;
        "
      >
        ${content}
      </div>
      `
            : ""
          }

      <div style="text-align:center;margin:40px 0;">

        <a
          href="${postUrl}"
          style="
            display:inline-block;
            padding:14px 32px;
            background:#2563eb;
            color:#ffffff;
            text-decoration:none;
            border-radius:10px;
            font-size:15px;
            font-weight:bold;
          "
        >
          View ${entityType}
        </a>

      </div>

      <hr
        style="
          border:none;
          border-top:1px solid #e5e7eb;
          margin:35px 0;
        "
      />

      <p
        style="
          margin:0;
          color:#6b7280;
          font-size:14px;
          line-height:24px;
        "
      >
        You're receiving this email because someone mentioned your account.
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="margin-top:12px;">
        <a
          href="${postUrl}"
          style="
            color:#2563eb;
            word-break:break-word;
            text-decoration:none;
          "
        >
          ${postUrl}
        </a>
      </p>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td
      style="
        background:#f9fafb;
        text-align:center;
        padding:24px;
        color:#9ca3af;
        font-size:13px;
      "
    >
      © ${new Date().getFullYear()} Connectly • All rights reserved.
    </td>
  </tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
      })
    )
  );
};
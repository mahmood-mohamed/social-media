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


export function otpEmailTemplate(otp: string, name: string, minutes: number = 5): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Connectly Verification Code</title>
    </head>

    <body style="margin:0;padding:0;background:#f7f9fb;font-family:Arial,Helvetica,sans-serif;color:#191c1e;">

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:40px 16px;">
        <tr>
          <td align="center">

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e6e8ea;border-radius:16px;overflow:hidden;">

              <!-- Header -->
              <tr>
                <td align="center" style="padding:40px 32px 24px;background:#191c1e;">
                  <h1 style="margin:0;font-size:30px;color:#ffffff;font-weight:700;">
                    Connectly
                  </h1>

                  <p style="margin:10px 0 0;color:#bec6e0;font-size:15px;">
                    Secure account verification
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:40px 32px;">

                  <h2 style="margin:0 0 16px;font-size:26px;color:#191c1e;">
                    Hello ${name} 👋
                  </h2>

                  <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#45464d;">
                    We received a request to verify your Connectly account.
                    Use the verification code below to continue.
                  </p>

                  <div style="text-align:center;margin:32px 0;">
                    <span
                      style="
                        display:inline-block;
                        background:#f2f4f6;
                        border:2px dashed #3980f4;
                        border-radius:12px;
                        padding:18px 32px;
                        font-size:34px;
                        font-weight:700;
                        letter-spacing:10px;
                        color:#191c1e;
                      "
                    >
                      ${otp}
                    </span>
                  </div>

                  <p style="margin:0 0 8px;font-size:15px;color:#45464d;">
                    ⏳ This verification code will expire in
                    <strong>${minutes} minutes</strong>.
                  </p>

                  <p style="margin:0;font-size:15px;color:#45464d;">
                    For your security, never share this code with anyone.
                  </p>

                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding:0 32px;">
                  <div style="height:1px;background:#eceef0;"></div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:28px 32px;text-align:center;">

                  <p style="margin:0 0 10px;font-size:13px;color:#76777d;line-height:1.7;">
                    If you didn't request this verification, you can safely ignore this email.
                    No changes will be made to your account.
                  </p>

                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    © ${new Date().getFullYear()} Connectly. All rights reserved.
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

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
        subject: `🔔 ${sender.firstName} mentioned you on Connectly`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Connectly Notification</title>
          </head>

          <body style="margin:0;padding:0;background:#f7f9fb;font-family:Arial,Helvetica,sans-serif;color:#191c1e;">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
          <tr>
          <td align="center">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="max-width:560px;background:#ffffff;border:1px solid #e6e8ea;border-radius:16px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td align="center" style="padding:40px 32px 24px;background:#191c1e;">
                <h1 style="margin:0;font-size:30px;font-weight:700;color:#ffffff;">
                  Connectly
                </h1>

                <p style="margin:10px 0 0;font-size:15px;color:#bec6e0;">
                  You have a new mention
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px 32px;">

                <h2 style="margin:0 0 18px;font-size:24px;color:#191c1e;">
                  Hi ${user.firstName} 👋
                </h2>

                <p style="margin:0;font-size:15px;line-height:28px;color:#45464d;">
                  <strong>${sender.firstName} ${sender.lastName}</strong>
                  mentioned you in a
                  <strong>${entityType}</strong>
                  on Connectly.
                </p>

                <p style="margin:14px 0 0;font-size:15px;line-height:26px;color:#6b7280;">
                  Open the conversation to see what they shared and continue the discussion.
                </p>

                ${
                  content
                    ? `
                <div
                  style="
                    margin:32px 0;
                    padding:20px;
                    background:#f2f4f6;
                    border:1px solid #e6e8ea;
                    border-radius:12px;
                    color:#191c1e;
                    font-size:15px;
                    line-height:28px;
                    white-space:pre-wrap;
                  "
                >
                  ${content}
                </div>
                `
                    : ""
                }

                <div style="text-align:center;margin:36px 0;">
                  <a
                    href="${postUrl}"
                    style="
                      display:inline-block;
                      padding:14px 36px;
                      background:#191c1e;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:12px;
                      font-size:15px;
                      font-weight:600;
                    "
                  >
                    ${entityType === "post" ? "View Post" : "View Comment"}
                  </a>
                </div>

                <div
                  style="
                    height:1px;
                    background:#eceef0;
                    margin:36px 0;
                  "
                ></div>

                <p
                  style="
                    margin:0;
                    color:#76777d;
                    font-size:14px;
                    line-height:24px;
                  "
                >
                  You're receiving this email because someone mentioned your Connectly account.
                  If you weren't expecting this notification, you can safely ignore this email.
                </p>

                <p style="margin:18px 0 0;font-size:13px;">
                  <a
                    href="${postUrl}"
                    style="
                      color:#3980f4;
                      text-decoration:none;
                      word-break:break-word;
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
                  background:#f7f9fb;
                  text-align:center;
                  padding:28px;
                  border-top:1px solid #eceef0;
                "
              >

                <p style="margin:0;font-size:15px;font-weight:700;color:#191c1e;">
                  Connectly
                </p>

                <p
                  style="
                    margin:10px 0 18px;
                    color:#76777d;
                    font-size:13px;
                    line-height:22px;
                  "
                >
                  Connect with people, share ideas, and build meaningful conversations.
                </p>

                <p style="margin:0;color:#9ca3af;font-size:12px;">
                  © ${new Date().getFullYear()} Connectly. All rights reserved.
                </p>

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

import nodemailer from "nodemailer";
import { logger } from "@/lib/utils/logger";

interface SendInvitationEmailParams {
  toEmail: string;
  inviteeName?: string | null;
  inviterName?: string | null;
  inviteUrl: string;
  taskTitle?: string | null;
  taskPriority?: string | null;
  taskDueDate?: string | null;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendInvitationEmail({
  toEmail,
  inviteeName,
  inviterName,
  inviteUrl,
  taskTitle,
  taskPriority,
  taskDueDate,
}: SendInvitationEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "Kanban Task Board <noreply@kanban.app>";

    const greetingName = inviteeName ? inviteeName : "there";
    const sender = inviterName ? inviterName : "Your team administrator";

    const taskHtmlSection = taskTitle
      ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 24px 0;">
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5;">
          Assigned Task
        </p>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #0f172a;">
          ${escapeHtml(taskTitle)}
        </h3>
        ${
          taskPriority || taskDueDate
            ? `
          <div style="display: flex; gap: 12px; font-size: 13px; color: #64748b; margin-top: 8px;">
            ${taskPriority ? `<span><strong>Priority:</strong> ${escapeHtml(taskPriority)}</span>` : ""}
            ${taskDueDate ? `<span><strong>Due Date:</strong> ${escapeHtml(taskDueDate)}</span>` : ""}
          </div>`
            : ""
        }
      </div>
      `
      : "";

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to Kanban Task Board</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 16px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: left; background-color: #4f46e5;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">
                Kanban Task Board
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px;">
              <h2 style="font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #0f172a;">
                Hi ${escapeHtml(greetingName)},
              </h2>
              <p style="font-size: 15px; line-height: 24px; color: #334155; margin-top: 0; margin-bottom: 16px;">
                <strong>${escapeHtml(sender)}</strong> has invited you to join the team on Kanban Task Board.
                ${taskTitle ? "You've also been assigned to a task to get started:" : ""}
              </p>

              ${taskHtmlSection}

              <p style="font-size: 15px; line-height: 24px; color: #334155; margin-top: 0; margin-bottom: 24px;">
                Click the button below to accept your invitation, confirm your display name, and set up your password:
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                      Accept Invitation & Set Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 20px; color: #64748b; margin-top: 0; margin-bottom: 12px;">
                This invitation link is valid for 15 minutes. If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; word-break: break-all; color: #4f46e5; margin: 0;">
                <a href="${inviteUrl}" style="color: #4f46e5; text-decoration: underline;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                If you weren't expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    if (!transporter) {
      logger.warn("SMTP credentials not configured (SMTP_USER/SMTP_PASS missing). Invitation link:", {
        toEmail,
        inviteUrl,
      });
      // In development / demo mode, print clearly to terminal
      console.log("\n================ [INVITATION EMAIL SIMULATION] ================");
      console.log(`To: ${toEmail}`);
      console.log(`Link: ${inviteUrl}`);
      console.log("Configure SMTP_USER and SMTP_PASS in .env to send real Gmails.");
      console.log("=================================================================\n");
      return { success: true };
    }

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: taskTitle
        ? `You've been assigned to "${taskTitle}" on Kanban Task Board`
        : `You've been invited to Kanban Task Board`,
      html,
    });

    logger.info("Invitation email dispatched successfully", { toEmail });
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to send email";
    logger.error("Error sending invitation email", { toEmail, error: errorMsg });
    return { success: false, error: errorMsg };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

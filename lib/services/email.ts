import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Workshop <noreply@workshop.dev>";

interface CollaborationInviteEmailData {
  inviteeName: string;
  inviterName: string;
  projectTitle: string;
  projectSlug: string;
  role: string;
  dashboardUrl: string;
}

interface InviteResponseEmailData {
  ownerName: string;
  collaboratorName: string;
  projectTitle: string;
  projectSlug: string;
  accepted: boolean;
  projectUrl: string;
}

interface MergeProposalEmailData {
  recipientName: string;
  proposerName: string;
  proposedTitle: string;
  proposedDescription?: string;
  projectCount: number;
  revenueSplit: number;
  dashboardUrl: string;
}

interface MergeCompletionEmailData {
  recipientName: string;
  mergedProjectTitle: string;
  mergedProjectSlug: string;
  coOwners: string[];
  projectUrl: string;
}

export async function sendCollaborationInviteEmail(
  to: string,
  data: CollaborationInviteEmailData
) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You've been invited to collaborate on ${data.projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Collaboration Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Workshop</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Collaborative Game Publishing</p>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">You've Been Invited! 🎉</h2>

            <p>Hi <strong>${data.inviteeName}</strong>,</p>

            <p><strong>${data.inviterName}</strong> has invited you to collaborate on their project:</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${data.projectTitle}</h3>
              <p style="margin: 0; color: #6b7280;">Role: <strong>${data.role}</strong></p>
            </div>

            <p>This is an opportunity to collaborate on a creative project and potentially earn revenue when the project is published to the marketplace.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Invitation</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              If you didn't expect this invitation, you can safely ignore this email or decline the invitation in your dashboard.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Workshop. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send collaboration invite email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending collaboration invite email:", error);
    return { success: false, error };
  }
}

export async function sendInviteResponseEmail(
  to: string,
  data: InviteResponseEmailData
) {
  const subject = data.accepted
    ? `${data.collaboratorName} accepted your collaboration invitation`
    : `${data.collaboratorName} declined your collaboration invitation`;

  const statusColor = data.accepted ? "#10b981" : "#ef4444";
  const statusText = data.accepted ? "Accepted ✓" : "Declined";
  const message = data.accepted
    ? `<strong>${data.collaboratorName}</strong> has accepted your invitation to collaborate on <strong>${data.projectTitle}</strong>. They now have access to the project!`
    : `<strong>${data.collaboratorName}</strong> has declined your invitation to collaborate on <strong>${data.projectTitle}</strong>.`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation ${statusText}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Workshop</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Collaborative Game Publishing</p>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: ${statusColor}; color: white; padding: 12px 20px; border-radius: 6px; text-align: center; font-weight: 600; margin-bottom: 20px;">
              ${statusText}
            </div>

            <p>Hi <strong>${data.ownerName}</strong>,</p>

            <p>${message}</p>

            ${
              data.accepted
                ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.projectUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Project</a>
            </div>
            `
                : ""
            }
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Workshop. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send invite response email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending invite response email:", error);
    return { success: false, error };
  }
}

export async function sendMergeProposalEmail(
  to: string,
  data: MergeProposalEmailData
) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New merge proposal: ${data.proposedTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Merge Proposal</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Workshop</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Collaborative Game Publishing</p>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Merge Proposal 🤝</h2>

            <p>Hi <strong>${data.recipientName}</strong>,</p>

            <p><strong>${data.proposerName}</strong> has proposed merging multiple projects to create a collaborative work:</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">${data.proposedTitle}</h3>
              ${data.proposedDescription ? `<p style="margin: 10px 0; color: #4b5563;">${data.proposedDescription}</p>` : ""}
              <p style="margin: 10px 0 0 0; color: #6b7280;"><strong>Projects to merge:</strong> ${data.projectCount}</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Your revenue share:</strong> ${data.revenueSplit.toFixed(1)}%</p>
            </div>

            <p>This merge requires approval from all project owners. Review the proposal and decide if you'd like to proceed.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Review Proposal</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              You can approve or decline this proposal in your dashboard. All owners must approve for the merge to proceed.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Workshop. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send merge proposal email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending merge proposal email:", error);
    return { success: false, error };
  }
}

export async function sendMergeCompletionEmail(
  to: string,
  data: MergeCompletionEmailData
) {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Merge completed: ${data.mergedProjectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Merge Completed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Workshop</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Collaborative Game Publishing</p>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Merge Completed! 🎉</h2>

            <p>Hi <strong>${data.recipientName}</strong>,</p>

            <p>Great news! Your merge proposal has been approved by all parties and a new collaborative project has been created:</p>

            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; margin: 20px 0; color: white;">
              <h3 style="margin: 0 0 10px 0;">${data.mergedProjectTitle}</h3>
              <p style="margin: 0; opacity: 0.9;"><strong>Co-owners:</strong> ${data.coOwners.join(", ")}</p>
            </div>

            <p>You are now a co-owner of this project with equal revenue sharing. Start working together to bring this project to life!</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.projectUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Open Project</a>
            </div>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Workshop. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send merge completion email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending merge completion email:", error);
    return { success: false, error };
  }
}
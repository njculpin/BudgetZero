import { Resend } from "resend";

// Temporarily disabled - uncomment when ready to enable email notifications
// if (!process.env.RESEND_API_KEY) {
//   throw new Error("RESEND_API_KEY is not defined in environment variables");
// }

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
  // Skip sending emails if Resend is not configured
  if (!resend) {
    console.log("Email skipped (Resend not configured):", { to, subject: `Collaboration invite for ${data.projectTitle}` });
    return { success: true };
  }

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

  // Skip sending emails if Resend is not configured
  if (!resend) {
    console.log("Email skipped (Resend not configured):", { to, subject });
    return { success: true };
  }

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
  // Skip sending emails if Resend is not configured
  if (!resend) {
    console.log("Email skipped (Resend not configured):", { to, subject: `Merge proposal: ${data.proposedTitle}` });
    return { success: true };
  }

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
  // Skip sending emails if Resend is not configured
  if (!resend) {
    console.log("Email skipped (Resend not configured):", { to, subject: `Merge completed: ${data.mergedProjectTitle}` });
    return { success: true };
  }

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

interface AssetUsageNotificationData {
  creatorName: string;
  assetName: string;
  projectTitle: string;
  projectSlug: string;
  addedByName: string;
  assetUrl: string;
  projectUrl: string;
}

export async function sendAssetUsageNotification(
  to: string,
  data: AssetUsageNotificationData
): Promise<{ success: boolean; error?: any }> {
  if (!resend) {
    console.warn("Email service not configured - skipping asset usage notification email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your model "${data.assetName}" was added to a project!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Great News!</h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.creatorName},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Your model <strong>"${data.assetName}"</strong> has been added to a game project!
              </p>

              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong style="color: #333;">Project:</strong> ${data.projectTitle}<br>
                  <strong style="color: #333;">Added by:</strong> ${data.addedByName}
                </p>
              </div>

              <p style="font-size: 16px; margin-bottom: 20px;">
                This is a great opportunity to collaborate and see your work come to life in a game!
                ${data.addedByName} is using your model in their project.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.projectUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Project</a>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="${data.assetUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">View Your Model</a>
              </div>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="font-size: 14px; color: #666; margin: 0;">
                This is an automated notification from Workshop. Your model is helping game designers bring their visions to life!
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send asset usage notification:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending asset usage notification:", error);
    return { success: false, error };
  }
}

interface ForkRequestNotificationData {
  recipientName: string;
  requesterName: string;
  requesterProjectTitle: string;
  recipientProjectTitle: string;
  forkType: "merge" | "reference";
  message?: string;
  dashboardUrl: string;
}

export async function sendForkRequestNotification(
  to: string,
  data: ForkRequestNotificationData
): Promise<{ success: boolean; error?: any }> {
  if (!resend) {
    console.warn("Email service not configured - skipping fork request notification email");
    return { success: false, error: "Email service not configured" };
  }

  const forkTypeLabel = data.forkType === "merge" ? "merge" : "reference";

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Collaboration Request: ${data.requesterName} wants to ${forkTypeLabel} projects`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Collaboration Request</h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.recipientName},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                <strong>${data.requesterName}</strong> has sent you a collaboration request to ${forkTypeLabel} your projects together!
              </p>

              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                  <strong style="color: #333;">Their Project:</strong> ${data.requesterProjectTitle}<br>
                  <strong style="color: #333;">Your Project:</strong> ${data.recipientProjectTitle}<br>
                  <strong style="color: #333;">Type:</strong> ${forkTypeLabel === "merge" ? "Create a new collaborative project" : "Reference with attribution"}
                </p>
              </div>

              ${data.message ? `
                <div style="background: #f8f9fa; border-radius: 6px; padding: 15px; margin: 20px 0;">
                  <p style="font-size: 14px; font-weight: 600; color: #333; margin: 0 0 8px 0;">Message from ${data.requesterName}:</p>
                  <p style="font-size: 14px; color: #666; margin: 0; white-space: pre-wrap;">${data.message}</p>
                </div>
              ` : ""}

              <div style="background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #0369a1;">
                  <strong>What is a ${forkTypeLabel}?</strong><br>
                  ${forkTypeLabel === "merge"
                    ? "A merge creates a new collaborative project where both of you become co-owners. You'll share revenue equally and work together on the combined project."
                    : "A reference allows them to use your content in their project with proper attribution. You retain full ownership of your original project."}
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Request</a>
              </div>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="font-size: 14px; color: #666; margin: 0;">
                You can accept or decline this request from your dashboard. This is an opportunity to collaborate and create something amazing together!
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send fork request notification:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending fork request notification:", error);
    return { success: false, error };
  }
}

interface ForkResponseNotificationData {
  requesterName: string;
  responderName: string;
  projectTitle: string;
  accepted: boolean;
  dashboardUrl: string;
}

export async function sendForkResponseNotification(
  to: string,
  data: ForkResponseNotificationData
): Promise<{ success: boolean; error?: any }> {
  if (!resend) {
    console.warn("Email service not configured - skipping fork response notification email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: data.accepted
        ? `Great News! ${data.responderName} accepted your collaboration request`
        : `Collaboration request declined`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${data.accepted ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">
                ${data.accepted ? "Request Accepted!" : "Request Declined"}
              </h1>
            </div>

            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.requesterName},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                ${data.accepted
                  ? `<strong>${data.responderName}</strong> has accepted your collaboration request for "${data.projectTitle}"!`
                  : `<strong>${data.responderName}</strong> has declined your collaboration request for "${data.projectTitle}".`
                }
              </p>

              ${data.accepted ? `
                <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #065f46;">
                    <strong>Next Steps:</strong><br>
                    • Create a new collaborative project together<br>
                    • Define revenue split (default: 50/50)<br>
                    • Both parties must approve before publishing<br>
                    • Work together to create something amazing!
                  </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.dashboardUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Create Collaborative Project</a>
                </div>
              ` : `
                <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #374151;">
                    Don't be discouraged! There are many other creators looking to collaborate. Keep exploring and you'll find the right match.
                  </p>
                </div>
              `}

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="font-size: 14px; color: #666; margin: 0;">
                ${data.accepted
                  ? "This is the beginning of an exciting collaboration. Good luck with your project!"
                  : "Thank you for your interest in collaboration. Keep creating!"}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send fork response notification:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending fork response notification:", error);
    return { success: false, error };
  }
}
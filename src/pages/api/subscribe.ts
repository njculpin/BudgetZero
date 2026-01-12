import type { APIRoute } from "astro";
import { sendEmail } from "@/lib/email";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();

  if (!email || !email.includes("@")) {
    return new Response(JSON.stringify({ error: "Invalid email" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Send subscription confirmation email
    const result = await sendEmail({
      from: "Game Loopers <noreply@gameloopers.com>",
      to: email,
      subject: "Welcome to Game Loopers!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Game Loopers!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Thanks for subscribing to our mailing list! You'll be the first to know about:
          </p>
          <ul style="color: #666; font-size: 16px; line-height: 1.8;">
            <li>Featured creators and products</li>
            <li>Platform updates and new features</li>
            <li>Tips for tabletop game creators</li>
          </ul>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Ready to get started? <a href="${new URL(request.url).origin}/sign-up" style="color: #0070f3;">Create your free account</a> and start collaborating with other creators.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 14px;">
            Game Loopers - A social commerce platform for tabletop game creators
          </p>
        </div>
      `,
      text: `Welcome to Game Loopers!\n\nThanks for subscribing! You'll receive updates about featured creators, platform updates, and tips for tabletop game creators.\n\nReady to get started? Create your free account at ${new URL(request.url).origin}/sign-up\n\nGame Loopers - A social commerce platform for tabletop game creators`,
    });

    if (!result.success) {
      console.error('Failed to send subscription email:', result.error);
      // Don't fail the API call if email fails - subscription still succeeded
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to subscribe" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

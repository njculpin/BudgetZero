// TODO: Install resend package: npm install resend
// import { Resend } from "resend";
import type { APIRoute } from "astro";

// const resend = new Resend(import.meta.env.RESEND_API_KEY);

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
    // TODO: Uncomment when resend is installed
    // Example: Send a confirmation email
    // await resend.emails.send({
    //   from: "Your Site <no-reply@yoursite.com>",
    //   to: email,
    //   subject: "Welcome to our mailing list!",
    //   html: `<p>Thanks for subscribing! 🎉</p>`,
    // });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

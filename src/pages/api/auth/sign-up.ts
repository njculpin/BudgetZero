import type { APIRoute } from "astro";
import { signUp, signInWithPassword } from "../../../lib/auth";
import { sendEmail } from "@/lib/email";

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Email and password are required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { error: signUpError } = await signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("Sign-up error:", signUpError.message, signUpError);

    // Make error messages more user-friendly
    let userMessage = signUpError.message;

    if (signUpError.message.includes("Password should contain at least one character")) {
      userMessage = "Password must include: lowercase letter, uppercase letter, number, and special character (!@#$%^&* etc.)";
    } else if (signUpError.message.includes("Password should be at least")) {
      userMessage = "Password must be at least 6 characters long";
    } else if (signUpError.message.includes("User already registered")) {
      userMessage = "An account with this email already exists. Please sign in instead.";
    } else if (signUpError.message.includes("Invalid email")) {
      userMessage = "Please enter a valid email address";
    }

    return new Response(JSON.stringify({ error: userMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Auto-login after successful signup
  const { data: signInData, error: signInError } = await signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    console.error("Auto-login after signup failed:", signInError);
    // Fall back to manual sign-in
    return redirect("/sign-in?message=Account created. Please sign in.");
  }

  // Set session cookies
  cookies.set("sb-access-token", signInData.session.access_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  cookies.set("sb-refresh-token", signInData.session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // Send welcome email
  const origin = new URL(request.url).origin;
  await sendEmail({
    from: "Game Loopers <noreply@gameloopers.com>",
    to: email,
    subject: "Welcome to Game Loopers!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to Game Loopers!</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          Thanks for creating your account! You're now part of a growing community of tabletop game creators.
        </p>

        <h2 style="color: #333; font-size: 20px; margin-top: 30px;">Get Started</h2>
        <ul style="color: #666; font-size: 16px; line-height: 1.8;">
          <li><a href="${origin}/dashboard" style="color: #0070f3;">Complete your profile</a> - Add your bio, avatar, and connect your Stripe account</li>
          <li><a href="${origin}/products" style="color: #0070f3;">Browse products</a> - Discover what other creators are building</li>
          <li><a href="${origin}/jams" style="color: #0070f3;">Join a game jam</a> - Participate in community challenges</li>
          <li><a href="${origin}/assets/create" style="color: #0070f3;">Upload your first asset</a> - Share your work with the community</li>
        </ul>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333; font-size: 18px; margin-top: 0;">What is Game Loopers?</h3>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
            Game Loopers is a social commerce platform where tabletop game creators collaborate,
            publish digital downloads, manage licensing, and distribute royalties. Whether you're
            a designer, illustrator, 3D modeler, or printer - there's a place for you here.
          </p>
        </div>

        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          <a href="${origin}/sign-in" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Sign In Now
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 14px;">
          Questions? Reply to this email and we'll be happy to help.
        </p>
        <p style="color: #999; font-size: 14px;">
          Game Loopers - A social commerce platform for tabletop game creators
        </p>
      </div>
    `,
    text: `Welcome to Game Loopers!\n\nThanks for creating your account! You're now part of a growing community of tabletop game creators.\n\nGet Started:\n- Complete your profile at ${origin}/dashboard\n- Browse products at ${origin}/products\n- Join a game jam at ${origin}/jams\n- Upload your first asset at ${origin}/assets/create\n\nWhat is Game Loopers?\nGame Loopers is a social commerce platform where tabletop game creators collaborate, publish digital downloads, manage licensing, and distribute royalties.\n\nSign in now: ${origin}/sign-in\n\nQuestions? Reply to this email and we'll be happy to help.\n\nGame Loopers - A social commerce platform for tabletop game creators`,
  }).catch((error) => {
    // Log email error but don't fail registration
    console.error('Failed to send welcome email:', error);
  });

  // Redirect to dashboard after successful auto-login
  return redirect("/dashboard");
};
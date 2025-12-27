import type { APIRoute } from "astro";
import { signInWithPassword } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  const { data, error } = await signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign-in error:", error.message, error);
    // Map common Supabase errors to user-friendly messages
    let userMessage = error.message;
    if (error.message.includes("Invalid login credentials")) {
      userMessage = "The email or password you entered is incorrect. Please try again.";
    } else if (error.message.includes("Email not confirmed")) {
      userMessage = "Please verify your email address before signing in.";
    } else if (error.message.includes("User not found")) {
      userMessage = "No account found with this email address.";
    } else {
      userMessage = "Unable to sign in. Please check your credentials and try again.";
    }

    return new Response(JSON.stringify({ error: userMessage }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!data.session) {
    console.error("No session returned from sign-in");
    return new Response(JSON.stringify({ error: "Unable to create session. Please try again or contact support if the problem persists." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { access_token, refresh_token } = data.session;

  // Set cookies with proper options for auth
  cookies.set("sb-access-token", access_token, {
    path: "/",
    httpOnly: false,
    secure: false, // Set to true in production with HTTPS
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  cookies.set("sb-refresh-token", refresh_token, {
    path: "/",
    httpOnly: false,
    secure: false, // Set to true in production with HTTPS
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return redirect("/products", 303);
};

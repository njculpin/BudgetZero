import type { APIRoute } from "astro";
import { signInWithPassword, signInWithOAuth, type Provider } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const provider = formData.get("provider")?.toString();

  const validProviders = ["google", "github", "discord"];

  if (provider && validProviders.includes(provider)) {
    const { data, error } = await signInWithOAuth({
      provider: provider as Provider,
      redirectTo: "http://localhost:4321/api/auth/callback",
    });

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return redirect(data.url);
  }

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  const { data, error } = await signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign-in error:", error.message, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!data.session) {
    console.error("No session returned from sign-in");
    return new Response(JSON.stringify({ error: "No session returned" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
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

  console.log("Sign-in successful, redirecting to dashboard");
  return redirect("/dashboard", 303);
};
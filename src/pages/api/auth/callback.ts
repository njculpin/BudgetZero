import type { APIRoute } from "astro";
import { exchangeCodeForSession } from "../../../lib/auth";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    return new Response("No code provided", { status: 400 });
  }

  const { data, error } = await exchangeCodeForSession(authCode);

  if (error) {
    return new Response(error.message, { status: 500 });
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
import type { APIRoute } from "astro";
import { signOut } from "../../../lib/auth";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Call Supabase signOut to invalidate the session
  await signOut();

  // Delete the cookies
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });

  return redirect("/");
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Also support GET for backward compatibility
  await signOut();

  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });

  return redirect("/");
};
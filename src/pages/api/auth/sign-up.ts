import type { APIRoute } from "astro";
import { signUp } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, redirect }) => {
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

  const { error } = await signUp({
    email,
    password,
  });

  if (error) {
    console.error("Sign-up error:", error.message, error);

    // Make error messages more user-friendly
    let userMessage = error.message;

    if (error.message.includes("Password should contain at least one character")) {
      userMessage = "Password must include: lowercase letter, uppercase letter, number, and special character (!@#$%^&* etc.)";
    } else if (error.message.includes("Password should be at least")) {
      userMessage = "Password must be at least 6 characters long";
    } else if (error.message.includes("User already registered")) {
      userMessage = "An account with this email already exists. Please sign in instead.";
    } else if (error.message.includes("Invalid email")) {
      userMessage = "Please enter a valid email address";
    }

    return new Response(JSON.stringify({ error: userMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return redirect("/sign-in");
};
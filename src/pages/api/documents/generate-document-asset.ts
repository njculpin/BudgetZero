import type { APIRoute } from "astro";
import { getUser } from "@/lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  const { data: userData } = await getUser();
  const currentUser = userData?.user;
  return new Response(JSON.stringify({ error: "Not authorized" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
};

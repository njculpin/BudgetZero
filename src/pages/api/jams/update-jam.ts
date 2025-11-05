import type { APIRoute } from "astro";
import { updateJam, validateJamDates, getJamByHandle } from "@/lib/data-access/jams";
import { setSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return redirect("/sign-in", 302);
  }

  let currentUser = null;
  try {
    const session = await setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });
    if (!session.error && session.data.user) {
      currentUser = session.data.user;
    }
  } catch (error) {
    return redirect("/sign-in", 302);
  }

  if (!currentUser) {
    return redirect("/sign-in", 302);
  }

  const formData = await request.formData();
  const jamId = formData.get("jamId") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const rules = (formData.get("rules") as string) || "";
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const handle = formData.get("handle") as string;

  if (!jamId || !title || !startDate || !endDate || !handle) {
    return redirect(
      `/jams/${handle || ""}?mode=edit&error=${encodeURIComponent("Missing required fields")}`,
      302
    );
  }

  // Get the jam to verify ownership
  const jam = await getJamByHandle(handle);

  if (!jam) {
    return redirect(
      `/jams/${handle}?mode=edit&error=${encodeURIComponent("Jam not found")}`,
      302
    );
  }

  if (jam.user_id !== currentUser.id) {
    return redirect(
      `/jams/${handle}?mode=edit&error=${encodeURIComponent("You do not have permission to edit this jam")}`,
      302
    );
  }

  // Parse dates and ensure they're in ISO format
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  // Validate dates
  const validation = await validateJamDates(
    jamId,
    parsedStartDate,
    parsedEndDate
  );

  if (!validation.valid) {
    return redirect(
      `/jams/${handle}?mode=edit&error=${encodeURIComponent(validation.error || "Invalid dates")}`,
      302
    );
  }

  // Update the jam
  const updatedJam = await updateJam(jamId, {
    title: title.trim(),
    description: description.trim(),
    rules: rules.trim(),
    start_date: parsedStartDate.toISOString(),
    end_date: parsedEndDate.toISOString(),
  });

  if (!updatedJam) {
    return redirect(
      `/jams/${handle}?mode=edit&error=${encodeURIComponent("Failed to update jam")}`,
      302
    );
  }

  return redirect(`/jams/${handle}?mode=edit&success=true`, 302);
};

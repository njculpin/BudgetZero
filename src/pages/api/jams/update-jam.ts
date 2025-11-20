import type { APIRoute } from "astro";
import { updateJam, validateJamDates, getJamByHandle } from "@/lib/data-access/jams";
import { setSession } from "@/lib/auth";
import { uploadFile, generateFilePath } from "@/lib/storage";

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
  const coverImageFile = formData.get("cover_image") as File | null;

  if (!jamId || !title || !startDate || !endDate || !handle) {
    return redirect(
      `/jams/${handle || ""}?error=${encodeURIComponent("Missing required fields")}`,
      302
    );
  }

  // Get the jam to verify ownership
  const jam = await getJamByHandle(handle);

  if (!jam) {
    return redirect(
      `/jams/${handle}?error=${encodeURIComponent("Jam not found")}`,
      302
    );
  }

  if (jam.user_id !== currentUser.id) {
    return redirect(
      `/jams/${handle}?error=${encodeURIComponent("You do not have permission to edit this jam")}`,
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
      `/jams/${handle}?error=${encodeURIComponent(validation.error || "Invalid dates")}`,
      302
    );
  }

  // Get session for file upload
  const session = await setSession({
    refresh_token: refreshToken.value,
    access_token: accessToken.value,
  });

  const currentAccessToken = session.data.session?.access_token;

  // Handle cover image upload
  let preview_image_url = jam.preview_image_url;
  let preview_image_storage_path = jam.preview_image_storage_path;
  let preview_image_mime_type = jam.preview_image_mime_type;

  if (coverImageFile && coverImageFile.size > 0) {
    // Validate file type
    if (!coverImageFile.type.startsWith("image/")) {
      return redirect(
        `/jams/${handle}?error=${encodeURIComponent("Please select a valid image file")}`,
        302
      );
    }

    // Validate file size (5MB max)
    if (coverImageFile.size > 5 * 1024 * 1024) {
      return redirect(
        `/jams/${handle}?error=${encodeURIComponent("Image must be smaller than 5MB")}`,
        302
      );
    }

    if (currentAccessToken) {
      const filePath = generateFilePath(currentUser.id, coverImageFile.name);
      const uploadResult = await uploadFile({
        bucket: "jam-images",
        path: filePath,
        file: coverImageFile,
        accessToken: currentAccessToken,
        upsert: true,
      });

      if (uploadResult) {
        preview_image_url = uploadResult.url;
        preview_image_storage_path = uploadResult.path;
        preview_image_mime_type = uploadResult.type;
      }
    }
  }

  // Update the jam
  const updatedJam = await updateJam(jamId, {
    title: title.trim(),
    description: description.trim(),
    rules: rules.trim(),
    start_date: parsedStartDate.toISOString(),
    end_date: parsedEndDate.toISOString(),
    preview_image_url,
    preview_image_storage_path,
    preview_image_mime_type,
  });

  if (!updatedJam) {
    return redirect(
      `/jams/${handle}?error=${encodeURIComponent("Failed to update jam")}`,
      302
    );
  }

  return redirect(`/jams/${handle}?success=true`, 302);
};

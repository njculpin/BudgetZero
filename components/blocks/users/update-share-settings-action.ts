"use server";

import { revalidatePath } from "next/cache";
import { upsertUserShareSettings } from "@/lib/sdk/server/users";
import { createClient } from "@/lib/supabase/server";

export async function updateUserShareSettingsAction(
  userId: string,
  data: {
    show_created_products: boolean;
    show_created_assets: boolean;
  },
) {
  try {
    const client = await createClient();

    const result = await upsertUserShareSettings(client, userId, {
      show_created_products: data.show_created_products,
      show_created_assets: data.show_created_assets,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Failed to update settings",
      };
    }

    // Revalidate the profile page
    revalidatePath("/u");
    revalidatePath(`/u/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Update share settings error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

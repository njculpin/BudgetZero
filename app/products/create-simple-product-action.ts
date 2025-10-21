"use server";

import { revalidatePath } from "next/cache";
import {
  addProductTeam,
  createProduct,
  createProductPrice,
  createProductVariant,
  hardDeleteProduct,
} from "@/lib/sdk/server/products";
import {
  addTeamUser,
  createTeam,
  getUserTeams,
  hardDeleteTeam,
} from "@/lib/sdk/server/teams";
import { getMe } from "@/lib/sdk/server/users";
import { createServiceClient } from "@/lib/supabase/service";

interface CreateSimpleProductResult {
  success: boolean;
  productId?: string;
  error?: string;
}

export async function createSimpleProductAction(
  title: string,
): Promise<CreateSimpleProductResult> {
  try {
    console.log("[CREATE SIMPLE PRODUCT] Starting...");
    const user = await getMe();
    console.log("[CREATE SIMPLE PRODUCT] User authenticated:", user.id);

    const supabase = createServiceClient();

    // Generate handle from title
    const handle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    // Create product
    const { data: product, error: productError } = await createProduct(
      supabase,
      {
        title,
        handle,
        status: "draft",
      },
    );

    if (productError || !product) {
      console.error("[CREATE SIMPLE PRODUCT] Failed:", productError);

      // Check for duplicate handle error
      const error = productError as { code?: string; message?: string };
      if (
        error?.code === "23505" &&
        error?.message?.includes("products_handle_key")
      ) {
        return {
          success: false,
          error: `A product with the handle "${handle}" already exists. Please choose a different title.`,
        };
      }

      return {
        success: false,
        error: error?.message || "Failed to create product",
      };
    }

    // Find or create user's team
    let team: { id: string; name: string } | null = null;

    const { data: userTeams, error: getUserTeamsError } = await getUserTeams(
      supabase,
      user.id,
    );

    if (!getUserTeamsError && userTeams && userTeams.length > 0) {
      team = userTeams[0];
    }

    if (!team) {
      const { data: newTeam, error: teamError } = await createTeam(supabase, {
        name: `${user.email}'s Team`,
      });

      if (teamError || !newTeam) {
        await hardDeleteProduct(supabase, product.id);
        return {
          success: false,
          error: teamError?.message || "Failed to create team for product",
        };
      }

      team = newTeam;

      const { error: teamUserError } = await addTeamUser(supabase, {
        team_id: team.id,
        user_id: user.id,
      });

      if (teamUserError) {
        await hardDeleteProduct(supabase, product.id);
        await hardDeleteTeam(supabase, team.id);
        return {
          success: false,
          error: teamUserError.message || "Failed to add user to team",
        };
      }
    }

    // Link team to product
    const { error: productTeamError } = await addProductTeam(supabase, {
      product_id: product.id,
      team_id: team.id,
    });

    if (productTeamError) {
      await hardDeleteProduct(supabase, product.id);
      return {
        success: false,
        error: productTeamError.message || "Failed to link team to product",
      };
    }

    // Create default variant
    const { data: variant, error: variantError } = await createProductVariant(
      supabase,
      {
        product_id: product.id,
        title: "Standard",
        sku: `${handle}-standard`,
      },
    );

    if (variantError || !variant) {
      await hardDeleteProduct(supabase, product.id);
      return {
        success: false,
        error: variantError?.message || "Failed to create product variant",
      };
    }

    // Create default price
    const { error: priceError } = await createProductPrice(supabase, {
      variant_id: variant.id,
      price_cents: 0,
      currency: "USD",
    });

    if (priceError) {
      await hardDeleteProduct(supabase, product.id);
      return {
        success: false,
        error: priceError.message || "Failed to create product price",
      };
    }

    revalidatePath("/products");
    revalidatePath(`/products/${product.id}`);

    return { success: true, productId: product.id };
  } catch (error) {
    console.error("[CREATE SIMPLE PRODUCT] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

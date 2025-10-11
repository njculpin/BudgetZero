import { NextRequest, NextResponse } from "next/server";
import { useAdminUpdateAsset } from "@/lib/sdk/server/use-admin-update-asset";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await useAdminUpdateAsset({
      assetId: id,
      ...body,
    });

    if (error) {
      console.error("Asset update error:", error);
      const status =
        error.message === "Unauthorized" ? 401 :
        error.message === "Asset not found" ? 404 :
        error.message === "Forbidden" ? 403 :
        500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({
      success: true,
      message: "Asset updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

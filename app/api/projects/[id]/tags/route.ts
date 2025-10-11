import { NextRequest, NextResponse } from "next/server";
import { useAdminUpdateProjectTags } from "@/lib/sdk/server/use-admin-update-project-tags";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { tags } = body;

    const { data, error } = await useAdminUpdateProjectTags({
      projectId: id,
      tags,
    });

    if (error) {
      console.error("Tags update error:", error);
      const status =
        error.message === "Unauthorized" ? 401 :
        error.message === "Project not found" ? 404 :
        error.message === "Forbidden" ? 403 :
        error.message.includes("must be an array") ? 400 :
        500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({
      success: true,
      message: "Tags updated successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

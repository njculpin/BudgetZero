import { NextRequest, NextResponse } from "next/server";
import { useAdminInviteTeamMember } from "@/lib/sdk/server/use-admin-invite-team-member";
import { useAdminGetTeamInvitations } from "@/lib/sdk/server/use-admin-get-team-invitations";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/teams/[id]/invitations - Invite user to team by email
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: teamId } = await context.params;
    const body = await request.json();
    const { email, role } = body;

    const { data, error } = await useAdminInviteTeamMember({
      teamId,
      email,
      role,
    });

    if (error) {
      console.error("Error inviting member:", error);
      const status =
        error.message === "Unauthorized" ? 401 :
        error.message.includes("already") ? 400 :
        error.message.includes("Only team") ? 403 :
        500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/teams/[id]/invitations - Get team invitations and pending members
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: teamId } = await context.params;

    const { data, error } = await useAdminGetTeamInvitations(teamId);

    if (error) {
      console.error("Error fetching invitations:", error);
      const status = error.message === "Unauthorized" ? 401 : 403;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

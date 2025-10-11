import { NextRequest, NextResponse } from "next/server";
import { useAdminGetTeams } from "@/lib/sdk/server/use-admin-get-teams";
import { useAdminCreateTeam } from "@/lib/sdk/server/use-admin-create-team";

// GET /api/teams - List user's teams
export async function GET() {
  try {
    const { data: teams, error } = await useAdminGetTeams();

    if (error) {
      console.error("Error fetching teams:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch teams" },
        { status: error.message === "Unauthorized" ? 401 : 500 },
      );
    }

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    const { data: team, error } = await useAdminCreateTeam({
      name,
      description,
    });

    if (error) {
      console.error("Team creation error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create team" },
        { status: error.message === "Unauthorized" ? 401 : 400 },
      );
    }

    return NextResponse.json({
      team,
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

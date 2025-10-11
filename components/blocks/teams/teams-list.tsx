"use client";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreateTeamDialog } from "@/components/blocks/teams/create-team-dialog";
import { InviteMemberDialog } from "@/components/blocks/teams/invite-member-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  team_members: Array<{
    role: string;
  }>;
}

export function TeamsList() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchTeams() {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleTeamCreated = () => {
    fetchTeams();
    router.refresh();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No teams yet"
            description="Create your first team to collaborate with others on projects and assets"
            action={<CreateTeamDialog onTeamCreated={handleTeamCreated} />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateTeamDialog onTeamCreated={handleTeamCreated} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => {
          const userRole = team.team_members[0]?.role || "member";
          const canInvite = ["owner", "admin"].includes(userRole);

          return (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {team.name}
                      <Badge variant="outline" className="text-xs">
                        {userRole}
                      </Badge>
                    </CardTitle>
                    {team.description && (
                      <CardDescription>{team.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </p>
                  {canInvite && (
                    <InviteMemberDialog
                      teamId={team.id}
                      teamName={team.name}
                      onMemberInvited={fetchTeams}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

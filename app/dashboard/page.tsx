import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, GitMerge, UserPlus, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { getUserCollaborationInvites, getUserMergeProposals } from "@/lib/actions/collaboration-actions";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch pending invitations and merge proposals
  const { data: invites } = await getUserCollaborationInvites();
  const { data: mergeProposals } = await getUserMergeProposals();

  const pendingInvites = invites || [];
  const pendingMergeProposals = (mergeProposals || []).filter(
    (proposal: any) => proposal.merge_status === "proposed" && proposal.requires_approval_from.includes(user.id)
  );
  const totalPending = pendingInvites.length + pendingMergeProposals.length;

  return (
    <MainLayout
      title="Dashboard"
      subtitle="Manage your collaborations and project invitations"
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <CardTitle>Notifications</CardTitle>
              </div>
              {totalPending > 0 && (
                <Badge variant="destructive">{totalPending} pending</Badge>
              )}
            </div>
            <CardDescription>
              Review and respond to collaboration invitations and merge proposals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalPending === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending invitations or proposals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-4 h-4 text-blue-700" />
                    <span className="font-medium text-blue-900">Collaboration Invites</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{pendingInvites.length}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <GitMerge className="w-4 h-4 text-green-700" />
                    <span className="font-medium text-green-900">Merge Proposals</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{pendingMergeProposals.length}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Collaboration Invites */}
        {pendingInvites.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <CardTitle>Collaboration Invitations</CardTitle>
              </div>
              <CardDescription>
                You've been invited to collaborate on these projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingInvites.map((invite: any) => (
                  <div key={invite.id} className="p-4 border rounded-lg bg-blue-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {invite.project?.title || "Unknown Project"}
                          </h3>
                          <Badge variant="secondary">{invite.role}</Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          Invited by <strong>{invite.inviter?.full_name || invite.inviter?.email}</strong>
                        </p>

                        {invite.contribution_description && (
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Expected contribution:</strong> {invite.contribution_description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Invited {new Date(invite.invited_at).toLocaleDateString()}
                          </Badge>
                          {invite.permissions?.map((perm: string) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <form action={async () => {
                          "use server";
                          const { respondToCollaborationInvite } = await import("@/lib/actions/collaboration-actions");
                          await respondToCollaborationInvite(invite.id, "accept");
                        }}>
                          <Button size="sm" variant="default">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                        </form>

                        <form action={async () => {
                          "use server";
                          const { respondToCollaborationInvite } = await import("@/lib/actions/collaboration-actions");
                          await respondToCollaborationInvite(invite.id, "decline");
                        }}>
                          <Button size="sm" variant="outline">
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Merge Proposals */}
        {pendingMergeProposals.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-green-600" />
                <CardTitle>Merge Proposals</CardTitle>
              </div>
              <CardDescription>
                These projects want to merge with yours to create collaborative works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingMergeProposals.map((proposal: any) => (
                  <div key={proposal.id} className="p-4 border rounded-lg bg-green-50/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {proposal.proposed_title}
                        </h3>

                        {proposal.proposed_description && (
                          <p className="text-sm text-gray-700 mb-3">
                            {proposal.proposed_description}
                          </p>
                        )}

                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Proposed by:</strong> {proposal.proposer?.full_name || proposal.proposer?.email}
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          <strong>Projects to merge:</strong> {proposal.source_project_ids.length + 1} projects
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-700">
                            Requires approval from {proposal.requires_approval_from.length} creators
                          </span>
                        </div>

                        <div className="text-xs text-gray-500">
                          Revenue will be split equally: {(100 / Object.keys(proposal.revenue_split).length).toFixed(1)}% each
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <form action={async () => {
                          "use server";
                          const { respondToMergeProposal } = await import("@/lib/actions/collaboration-actions");
                          await respondToMergeProposal(proposal.id, "approve");
                        }}>
                          <Button size="sm" variant="default">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </form>

                        <form action={async () => {
                          "use server";
                          const { respondToMergeProposal } = await import("@/lib/actions/collaboration-actions");
                          await respondToMergeProposal(proposal.id, "decline");
                        }}>
                          <Button size="sm" variant="outline">
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/projects">
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="font-medium text-gray-900">My Projects</p>
                  <p className="text-sm text-gray-600 mt-1">View all your projects</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/projects/new">
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="font-medium text-gray-900">Create Project</p>
                  <p className="text-sm text-gray-600 mt-1">Start a new game project</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/browse">
            <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="font-medium text-gray-900">Browse Projects</p>
                  <p className="text-sm text-gray-600 mt-1">Find collaborators</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
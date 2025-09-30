"use client";

import { useState, useEffect } from "react";
import { Users, Check, X, DollarSign, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CollaborativeProjectService } from "@/lib/services/collaborative-project-service";
import type { CollaborativeProjectWithDetails } from "@/lib/types/database";
import Link from "next/link";

interface CollaborativeProjectWorkspaceProps {
  projectId: string;
}

export function CollaborativeProjectWorkspace({
  projectId,
}: CollaborativeProjectWorkspaceProps) {
  const [project, setProject] = useState<CollaborativeProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [comments, setComments] = useState("");

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    setLoading(true);
    const result = await CollaborativeProjectService.getCollaborativeProject(projectId);
    if (result.success && result.data) {
      setProject(result.data);
    }
    setLoading(false);
  }

  async function handleApprove(approved: boolean) {
    setApproving(true);
    const result = await CollaborativeProjectService.approveCollaborativeProject(
      projectId,
      approved,
      comments || undefined
    );
    if (result.success) {
      await loadProject();
      setComments("");
    }
    setApproving(false);
  }

  async function handlePublish() {
    setApproving(true);
    const result = await CollaborativeProjectService.publishCollaborativeProject(projectId);
    if (result.success) {
      await loadProject();
    }
    setApproving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-gray-500">
        Collaborative project not found
      </div>
    );
  }

  const approvalCount = project.approvals.filter((a) => a.approved === true).length;
  const totalApprovals = project.approvals.length;
  const approvalPercentage = (approvalCount / totalApprovals) * 100;
  const allApproved = approvalCount === totalApprovals;
  const anyRejected = project.approvals.some((a) => a.approved === false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <Badge
            variant={
              project.status === "published"
                ? "default"
                : project.status === "review"
                  ? "secondary"
                  : "outline"
            }
            className="capitalize"
          >
            {project.status}
          </Badge>
        </div>
        {project.description && (
          <p className="text-gray-600 text-lg">{project.description}</p>
        )}
      </div>

      {/* Source Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Source Projects</CardTitle>
          <CardDescription>
            Projects merged into this collaboration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.source_projects.map((sourceProject) => (
              <div
                key={sourceProject.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{sourceProject.title}</h4>
                  {sourceProject.description && (
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {sourceProject.description}
                    </p>
                  )}
                </div>
                <Link href={`/projects/${sourceProject.slug}`} target="_blank">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Co-owners & Revenue Split */}
      <Card>
        <CardHeader>
          <CardTitle>Co-owners & Revenue Split</CardTitle>
          <CardDescription>
            Revenue will be distributed among co-owners as shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {member.user.full_name || member.user.username || member.user.email}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold">{member.revenue_percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approval Status */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Status</CardTitle>
          <CardDescription>
            {project.requires_unanimous_approval
              ? "All co-owners must approve before publishing"
              : "Majority approval required"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {approvalCount} of {totalApprovals} approved
              </span>
              <span className="text-gray-600">{Math.round(approvalPercentage)}%</span>
            </div>
            <Progress value={approvalPercentage} />
          </div>

          {/* Approvals List */}
          <div className="space-y-3">
            {project.approvals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">
                      {approval.approver.full_name ||
                        approval.approver.username ||
                        approval.approver.email}
                    </p>
                    {approval.approved === true && (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Approved
                      </Badge>
                    )}
                    {approval.approved === false && (
                      <Badge variant="destructive" className="gap-1">
                        <X className="h-3 w-3" />
                        Declined
                      </Badge>
                    )}
                    {approval.approved === null && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                  {approval.comments && (
                    <p className="text-sm text-gray-600">{approval.comments}</p>
                  )}
                  {approval.approved_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(approval.approved_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Approval Actions (if user hasn't approved yet) */}
          {project.approvals.some((a) => a.approved === null) && (
            <div className="border-t pt-4 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comments (Optional)
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments or feedback..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(true)}
                  disabled={approving}
                  className="flex-1 gap-2"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleApprove(false)}
                  disabled={approving}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          )}

          {/* Publish Button (if all approved) */}
          {allApproved && project.status === "review" && (
            <div className="border-t pt-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 font-medium">
                  ✓ All co-owners have approved! Ready to publish.
                </p>
              </div>
              <Button
                onClick={handlePublish}
                disabled={approving}
                className="w-full gap-2"
                size="lg"
              >
                {approving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>Publish Collaborative Project</>
                )}
              </Button>
            </div>
          )}

          {/* Rejected Message */}
          {anyRejected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                This collaboration has been declined by one or more co-owners.
                You may need to discuss changes with your collaborators.
              </p>
            </div>
          )}

          {/* Published Message */}
          {project.status === "published" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">
                🎉 This collaborative project is now published!
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Revenue will be split according to the agreed percentages.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
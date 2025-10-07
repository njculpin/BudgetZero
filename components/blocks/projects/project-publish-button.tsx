"use client";

import { CheckCircle2, Rocket, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PublishProjectButtonProps {
  projectId: string;
  projectTitle: string;
  currentStatus?: string;
}

interface ValidationResult {
  can_publish: boolean;
  validation: {
    has_pricing: boolean;
    has_content: boolean;
    approvals: Array<{
      collaborator_id: string;
      approved: boolean;
      profiles: { full_name: string | null };
    }>;
  };
}

export function PublishProjectButton({
  projectId,
  projectTitle,
  currentStatus = "draft",
}: PublishProjectButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchValidation();
    }
  }, [isOpen]);

  const fetchValidation = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/publish`);
      if (response.ok) {
        const data = await response.json();
        setValidation(data);
      }
    } catch (error) {
      console.error("Error fetching validation:", error);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.validation_errors?.join(", ") ||
            data.error ||
            "Failed to publish",
        );
      }

      toast.success("Project published to marketplace!");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error publishing:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to publish project",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus === "published") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            Project Published
          </CardTitle>
          <CardDescription className="text-green-700">
            Your project is live in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/marketplace">View in Marketplace</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const allRequirementsMet = validation?.can_publish;
  const { has_pricing, has_content, approvals } = validation?.validation || {};

  const pendingApprovals = approvals?.filter((a) => !a.approved).length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Publish to Marketplace
          </CardTitle>
          <CardDescription>
            Share your project with the community and start earning revenue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Requirements Checklist */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Publishing Requirements:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {has_pricing ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
                <span className={has_pricing ? "text-green-700" : ""}>
                  At least one pricing tier
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {has_content ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
                <span className={has_content ? "text-green-700" : ""}>
                  At least one asset or document
                </span>
              </div>
              {approvals && approvals.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  {pendingApprovals === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span
                    className={pendingApprovals === 0 ? "text-green-700" : ""}
                  >
                    All co-owner approvals (
                    {approvals.length - pendingApprovals}/{approvals.length})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Publish Button */}
          <Button
            onClick={() => setIsOpen(true)}
            disabled={!allRequirementsMet}
            className="w-full"
          >
            <Rocket className="w-4 h-4 mr-2" />
            {allRequirementsMet
              ? "Publish to Marketplace"
              : "Requirements Not Met"}
          </Button>

          {!allRequirementsMet && (
            <p className="text-xs text-muted-foreground">
              Complete all requirements above to publish your project
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish "{projectTitle}" to Marketplace?</DialogTitle>
            <DialogDescription>
              Your project will be visible to all users and available for
              purchase. Revenue will be split among co-owners according to the
              agreed percentages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                What happens when you publish:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Project appears in marketplace listings</li>
                <li>Users can browse and purchase your work</li>
                <li>Revenue splits automatically among co-owners</li>
                <li>All co-owners receive notifications</li>
              </ul>
            </div>

            {approvals && approvals.length > 0 && (
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">
                  Co-owner Approvals:
                </h4>
                <div className="space-y-1">
                  {approvals.map((approval) => (
                    <div
                      key={approval.collaborator_id}
                      className="flex items-center gap-2 text-sm"
                    >
                      {approval.approved ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      )}
                      <span>
                        {approval.profiles.full_name || "Unknown"}{" "}
                        {approval.approved ? "(Approved)" : "(Pending)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={isLoading}>
              {isLoading ? "Publishing..." : "Publish Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

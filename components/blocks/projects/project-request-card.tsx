"use client";

import { format } from "date-fns";
import { Box, Check, Clock, FileText, Loader2, Palette, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RequestComments } from "@/components/blocks/projects/project-request-comment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AttributionRequestCardProps {
  referenceId: string;
  referenceType: "asset" | "document";
  contentTitle: string;
  contentType: string;
  thumbnailUrl?: string | null;
  projectTitle: string;
  projectSlug: string;
  requesterName: string;
  royaltyPercentage: number;
  requestedAt: string;
  currentUserId: string;
  status?: string;
}

export function AttributionRequestCard({
  referenceId,
  referenceType,
  contentTitle,
  contentType,
  thumbnailUrl,
  projectTitle,
  projectSlug,
  requesterName,
  royaltyPercentage,
  requestedAt,
  currentUserId,
  status = "pending",
}: AttributionRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleApproval = async (status: "approved" | "rejected") => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/project-asset-references", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_id: referenceId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reference");
      }

      if (status === "approved") {
        toast.success("Reference approved", {
          description: `${requesterName} can now use "${contentTitle}" in their project`,
        });
      } else {
        toast.info("Reference rejected", {
          description: `${requesterName} has been notified`,
        });
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating reference:", error);
      toast.error("Failed to update reference", {
        description: "Please try again",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getIcon = () => {
    if (referenceType === "asset") {
      return contentType === "model" ? (
        <Box className="w-5 h-5 text-blue-600" />
      ) : (
        <Palette className="w-5 h-5 text-purple-600" />
      );
    }
    return <FileText className="w-5 h-5 text-green-600" />;
  };

  const getTypeLabel = () => {
    if (referenceType === "asset") {
      return contentType === "model" ? "Model" : "Illustration";
    }
    return contentType.replace(/_/g, " ");
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Content Icon/Thumbnail */}
          <div className="flex-shrink-0">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={`${contentTitle} thumbnail - ${getTypeLabel()}`}
                className="w-16 h-16 object-cover rounded-md"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                {getIcon()}
              </div>
            )}
          </div>

          {/* Content Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {contentTitle}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize text-xs">
                    {getTypeLabel()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="font-medium">{requesterName}</span>
                <span>wants to use this in</span>
                <Link
                  href={`/projects/${projectSlug}`}
                  className="font-medium text-blue-600 hover:underline truncate focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                >
                  {projectTitle}
                </Link>
              </div>

              {/* Revenue Split Preview */}
              {/* <RevenueSplitPreview
                royaltyContributors={[
                  { name: "Your royalty", percentage: royaltyPercentage },
                ]}
                variant="default"
              /> */}

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  {format(new Date(requestedAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>

            {/* Comments Section */}
            <Separator className="my-4" />
            <RequestComments
              referenceId={referenceId}
              currentUserId={currentUserId}
              status={status}
            />
          </div>

          {/* Action Buttons - Primary action appears first on mobile */}
          <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              onClick={() => handleApproval("rejected")}
              disabled={isProcessing}
              aria-label={`Reject attribution request for ${contentTitle} by ${requesterName}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  <span className="sr-only">Processing rejection</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="default"
              className="bg-green-600 hover:bg-green-700 focus-visible:ring-green-600/20"
              onClick={() => handleApproval("approved")}
              disabled={isProcessing}
              aria-label={`Approve attribution request for ${contentTitle} by ${requesterName}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  <span className="sr-only">Processing approval</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

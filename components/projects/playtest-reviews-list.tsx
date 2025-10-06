"use client";

import { format } from "date-fns";
import { Star, ThumbsUp, ThumbsDown, Trophy, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  playtime_hours: number;
  playtest_date: string;
  upvotes: number;
  downvotes: number;
  vp_earned: number;
  is_verified: boolean;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
}

interface PlaytestReviewsListProps {
  projectId: string;
  currentUserId?: string;
  refreshTrigger?: number;
}

export function PlaytestReviewsList({
  projectId,
  currentUserId,
  refreshTrigger,
}: PlaytestReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingStates, setVotingStates] = useState<
    Record<string, "upvote" | "downvote" | null>
  >({});

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `/api/playtest-reviews?project_id=${projectId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [projectId, refreshTrigger]);

  const handleVote = async (
    reviewId: string,
    voteType: "upvote" | "downvote",
  ) => {
    if (!currentUserId) {
      toast.error("You must be logged in to vote");
      return;
    }

    try {
      const response = await fetch("/api/playtest-reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: reviewId,
          vote_type: voteType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to vote");
      }

      // Update local voting state
      if (data.action === "removed") {
        setVotingStates((prev) => ({ ...prev, [reviewId]: null }));
      } else {
        setVotingStates((prev) => ({ ...prev, [reviewId]: voteType }));
      }

      // Refresh reviews to get updated counts
      await fetchReviews();

      if (data.action === "created" || data.action === "updated") {
        const points = voteType === "upvote" ? 5 : -2;
        toast.success(
          `Vote recorded! Reviewer ${points > 0 ? "earned" : "lost"} ${Math.abs(points)} VP`,
        );
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit vote",
      );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Playtest Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading reviews...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Playtest Reviews</CardTitle>
            <CardDescription>
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              {reviews.length > 0 && (
                <span className="ml-2">
                  • Average: {averageRating.toFixed(1)} / 5.0
                </span>
              )}
            </CardDescription>
          </div>
          {reviews.length > 0 && (
            <div>{renderStars(Math.round(averageRating))}</div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm">
              Be the first to playtest this project and earn Victory Points!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => {
              const reviewer = review.profiles;
              const reviewerName =
                reviewer.full_name || reviewer.email || "Anonymous";
              const userVote = votingStates[review.id];
              const isOwnReview = currentUserId === reviewer.id;

              return (
                <div key={review.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {reviewerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{reviewerName}</p>
                            {review.is_verified && (
                              <Badge
                                variant="secondary"
                                className="text-xs flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="text-xs flex items-center gap-1"
                            >
                              <Trophy className="h-3 w-3 text-amber-600" />
                              {review.vp_earned} VP
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            {renderStars(review.rating)}
                            <span>•</span>
                            <span>{review.playtime_hours}h playtime</span>
                            <span>•</span>
                            <span>
                              {format(
                                new Date(review.playtest_date),
                                "MMM d, yyyy",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed">
                      {review.review_text}
                    </p>

                    {/* Voting */}
                    {!isOwnReview && currentUserId && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`gap-1 ${userVote === "upvote" ? "text-green-600" : ""}`}
                          onClick={() => handleVote(review.id, "upvote")}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">{review.upvotes}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`gap-1 ${userVote === "downvote" ? "text-red-600" : ""}`}
                          onClick={() => handleVote(review.id, "downvote")}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span className="text-xs">{review.downvotes}</span>
                        </Button>
                      </div>
                    )}

                    {isOwnReview && (
                      <p className="text-xs text-muted-foreground italic">
                        This is your review
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

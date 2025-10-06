"use client";

import { Star, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PlaytestReviewFormProps {
  projectId: string;
  projectTitle: string;
  onReviewSubmitted?: () => void;
}

export function PlaytestReviewForm({
  projectId,
  projectTitle,
  onReviewSubmitted,
}: PlaytestReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [playtimeHours, setPlaytimeHours] = useState("");
  const [playtestDate, setPlaytestDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (reviewText.length < 50) {
      toast.error("Review must be at least 50 characters");
      return;
    }

    if (!playtimeHours || Number.parseFloat(playtimeHours) <= 0) {
      toast.error("Please enter playtime hours");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/playtest-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          rating,
          review_text: reviewText,
          playtime_hours: Number.parseFloat(playtimeHours),
          playtest_date: playtestDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast.success(
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" />
          <span>Review submitted! You earned 50 VP</span>
        </div>,
      );

      // Reset form
      setRating(0);
      setReviewText("");
      setPlaytimeHours("");
      setPlaytestDate(new Date().toISOString().split("T")[0]);

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = reviewText.length;
  const minChars = 50;
  const maxChars = 5000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" />
          Submit Playtest Review
        </CardTitle>
        <CardDescription>
          Share your playtesting experience and earn 50 Victory Points
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="transition-transform hover:scale-110"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Review * (minimum 50 characters)</Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your playtesting experience... What worked well? What could be improved? How was the gameplay?"
              className="min-h-[120px]"
              maxLength={maxChars}
              required
            />
            <p
              className={`text-xs ${characterCount < minChars ? "text-red-600" : "text-muted-foreground"}`}
            >
              {characterCount}/{maxChars} characters
              {characterCount < minChars &&
                ` (${minChars - characterCount} more needed)`}
            </p>
          </div>

          {/* Playtime and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playtime">Playtime (hours) *</Label>
              <input
                id="playtime"
                type="number"
                step="0.5"
                min="0.5"
                value={playtimeHours}
                onChange={(e) => setPlaytimeHours(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="2.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="playtest-date">Playtest Date *</Label>
              <input
                id="playtest-date"
                type="date"
                value={playtestDate}
                onChange={(e) => setPlaytestDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || characterCount < minChars}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Review & Earn 50 VP"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

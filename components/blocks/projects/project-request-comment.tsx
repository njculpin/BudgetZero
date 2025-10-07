"use client";

import { MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeAgo } from "@/lib/utils/date";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

interface RequestCommentsProps {
  referenceId: string;
  currentUserId: string;
  status: string; // "pending" | "approved" | "rejected"
}

export function RequestComments({
  referenceId,
  currentUserId,
  status,
}: RequestCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/request-comments?reference_id=${referenceId}`,
      );
      if (response.ok) {
        const { comments: fetchedComments } = await response.json();
        setComments(fetchedComments);
        if (fetchedComments.length > 0) {
          setIsExpanded(true);
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/request-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_id: referenceId,
          comment_text: newComment.trim(),
        }),
      });

      if (response.ok) {
        setNewComment("");
        await fetchComments();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canComment = status === "pending";

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground animate-pulse">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Comment Toggle */}
      {comments.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {comments.length} {comments.length === 1 ? "message" : "messages"}
          {isExpanded ? " ▼" : " ▶"}
        </Button>
      )}

      {/* Comment Thread */}
      {isExpanded && comments.length > 0 && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          {comments.map((comment) => {
            const isCurrentUser = comment.user.id === currentUserId;
            const displayName = comment.user.full_name || comment.user.email;
            const initials = displayName
              .split(" ")
              .map((n) => n.charAt(0))
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {displayName}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (you)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {comment.comment_text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comment Form */}
      {canComment && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a message..."
            className="min-h-[80px] resize-none"
            maxLength={2000}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newComment.length}/2000
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      )}

      {status !== "pending" && comments.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          No messages on this request
        </p>
      )}
    </div>
  );
}

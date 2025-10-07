"use client";

import { Badge } from "@/components/ui/badge";
import { usePendingRequests } from "@/hooks/use-pending-requests";

export function PendingRequestsBadge() {
  const count = usePendingRequests();

  if (count === 0) return null;

  return (
    <Badge variant="default" className="ml-auto">
      {count}
    </Badge>
  );
}

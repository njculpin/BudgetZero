"use client";

import { Badge } from "@/components/ui/badge";

export function PendingRequestsBadge() {
  const count = 1;
  return (
    <Badge variant="default" className="ml-auto">
      {count}
    </Badge>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserRound } from "lucide-react";

export function AssetViewAsToggle({
  as,
  setAs,
}: {
  as: "customer" | "owner";
  setAs: (as: "customer" | "owner") => void;
}) {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>View as</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full mb-6 flex items-center">
            <div className="inline-flex items-center gap-2 rounded-lg border bg-background p-1">
              <Button
                type="button"
                variant={as === "owner" ? "default" : "ghost"}
                size="sm"
                onClick={() => setAs("owner")}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Owner
              </Button>
              <Button
                type="button"
                variant={as === "customer" ? "default" : "ghost"}
                size="sm"
                onClick={() => setAs("customer")}
                className="gap-2"
              >
                <UserRound className="h-4 w-4" />
                Customer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

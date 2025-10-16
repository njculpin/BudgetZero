"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { formatTimeAgo } from "@/lib/utils/date";
import { TrendingUp, Trophy } from "lucide-react";
import { useState } from "react";

interface VPTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

interface VPBalance {
  total_points: number;
  lifetime_earned: number;
  updated_at: string;
}

export function VPDisplay() {
  const [vpData, setVpData] = useState<{
    balance: VPBalance | null;
    transactions: VPTransaction[];
  }>({
    balance: null,
    transactions: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVP = async () => {
    try {
      const response = await fetch("/api/victory-points?transactions=true");
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("VP API error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to load VP balance");
      }
      const data = await response.json();
      setVpData(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching VP:", error);
      setError("Unable to load VP");
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchVP();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const getTransactionColor = (points: number) => {
    return points > 0 ? "text-green-600" : "text-red-600";
  };

  const totalPoints = vpData.balance?.total_points || 0;
  const lifetimeEarned = vpData.balance?.lifetime_earned || 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg animate-pulse">
        <Trophy className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-900">---</span>
      </div>
    );
  }

  if (error) {
    return (
      <Button
        variant="ghost"
        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg h-auto"
        onClick={fetchVP}
      >
        <Trophy className="h-4 w-4 text-red-600" />
        <span className="text-sm font-medium text-red-900">{error}</span>
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg h-auto"
          aria-label="View Victory Points balance and transaction history"
        >
          <Trophy className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-950">
            {totalPoints.toLocaleString()} VP
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-600" />
              Victory Points
            </h4>
            <p className="text-sm text-muted-foreground">
              Earn VP by playtesting and reviewing products
            </p>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold text-amber-600">
                {totalPoints.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Lifetime Earned
              </p>
              <p className="text-2xl font-bold text-gray-700">
                {lifetimeEarned.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* Recent Transactions */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Recent Activity</h5>
            {vpData.transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                No activity yet. Submit a playtest review to earn VP!
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {vpData.transactions.slice(0, 10).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-start justify-between text-xs py-1.5 px-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {transaction.description ||
                          transaction.transaction_type}
                      </p>
                      <p className="text-muted-foreground">
                        {formatTimeAgo(transaction.created_at)}
                      </p>
                    </div>
                    <span
                      className={`font-semibold ml-2 ${getTransactionColor(transaction.points)}`}
                    >
                      {transaction.points > 0 ? "+" : ""}
                      {transaction.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

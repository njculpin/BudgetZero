"use client";

import { useState, useEffect } from "react";
import { GitFork, Check, X, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForkService } from "@/lib/services/fork-service";
import type { ProjectForkWithProjects } from "@/lib/types/database";
import Link from "next/link";

export function ForkRequestsList() {
  const [incoming, setIncoming] = useState<ProjectForkWithProjects[]>([]);
  const [outgoing, setOutgoing] = useState<ProjectForkWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadForkRequests();
  }, []);

  async function loadForkRequests() {
    setLoading(true);
    const result = await ForkService.getUserForkRequests();
    if (result.success) {
      setIncoming(result.incoming || []);
      setOutgoing(result.outgoing || []);
    }
    setLoading(false);
  }

  async function handleRespond(forkId: string, status: "accepted" | "rejected") {
    setResponding(forkId);
    const result = await ForkService.respondToForkRequest(forkId, status);
    if (result.success) {
      await loadForkRequests();
    }
    setResponding(null);
  }

  async function handleDelete(forkId: string) {
    const result = await ForkService.deleteForkRequest(forkId);
    if (result.success) {
      await loadForkRequests();
    }
  }

  function ForkRequestCard({ fork, type }: { fork: ProjectForkWithProjects; type: "incoming" | "outgoing" }) {
    const isIncoming = type === "incoming";
    const otherProject = isIncoming ? fork.parent_project : fork.child_project;
    const isPending = fork.status === "pending";

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <GitFork className="h-4 w-4 text-gray-500" />
                <Badge
                  variant={
                    fork.status === "accepted"
                      ? "default"
                      : fork.status === "pending"
                        ? "secondary"
                        : "outline"
                  }
                  className="capitalize"
                >
                  {fork.status}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {fork.fork_type}
                </Badge>
              </div>
              <CardTitle className="text-lg">
                {isIncoming ? (
                  <>
                    {fork.requester.full_name || fork.requester.username} wants to merge
                  </>
                ) : (
                  <>
                    Merge request sent
                  </>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {isIncoming ? (
                  <>
                    Merge "{otherProject.title}" with your project "{fork.child_project.title}"
                  </>
                ) : (
                  <>
                    Your project "{fork.parent_project.title}" → "{otherProject.title}"
                  </>
                )}
              </CardDescription>
            </div>
            <Link
              href={`/projects/${otherProject.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {fork.message && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-700 mb-1">Message:</p>
              <p className="text-gray-600">{fork.message}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              Requested {new Date(fork.requested_at).toLocaleDateString()}
            </span>
          </div>

          {isIncoming && isPending && (
            <div className="flex gap-2">
              <Button
                onClick={() => handleRespond(fork.id, "accepted")}
                disabled={responding === fork.id}
                className="flex-1 gap-2"
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button
                onClick={() => handleRespond(fork.id, "rejected")}
                disabled={responding === fork.id}
                variant="outline"
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>
          )}

          {!isIncoming && isPending && (
            <div className="flex justify-end">
              <Button
                onClick={() => handleDelete(fork.id)}
                variant="outline"
                size="sm"
              >
                Cancel Request
              </Button>
            </div>
          )}

          {fork.status === "accepted" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✓ Request accepted! You can now create a collaborative project together.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading fork requests...</div>
      </div>
    );
  }

  const totalPending = incoming.filter(f => f.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fork Requests</h2>
          <p className="text-gray-600">
            Manage collaboration requests between projects
          </p>
        </div>
        {totalPending > 0 && (
          <Badge variant="default" className="text-base px-3 py-1">
            {totalPending} pending
          </Badge>
        )}
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="incoming">
            Incoming ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing ({outgoing.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          {incoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                <GitFork className="h-12 w-12 mb-3 text-gray-300" />
                <p>No incoming fork requests</p>
                <p className="text-sm">
                  When someone wants to collaborate with your projects, they'll appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            incoming.map((fork) => (
              <ForkRequestCard key={fork.id} fork={fork} type="incoming" />
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-4">
          {outgoing.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                <GitFork className="h-12 w-12 mb-3 text-gray-300" />
                <p>No outgoing fork requests</p>
                <p className="text-sm">
                  Fork requests you send to other projects will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            outgoing.map((fork) => (
              <ForkRequestCard key={fork.id} fork={fork} type="outgoing" />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
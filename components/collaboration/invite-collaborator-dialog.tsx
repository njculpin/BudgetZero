"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, Mail } from "lucide-react";
import { inviteCollaborator } from "@/lib/actions/collaboration-actions";
import { CreatorRole, CollaborationPermission } from "@/lib/types/database";

interface InviteCollaboratorDialogProps {
  projectId: string;
  projectTitle: string;
}

const CREATOR_ROLES: { value: CreatorRole; label: string }[] = [
  { value: "designer", label: "Game Designer" },
  { value: "illustrator", label: "Illustrator" },
  { value: "modeler", label: "3D Modeler" },
  { value: "editor", label: "Editor" },
  { value: "photographer", label: "Photographer" },
];

const PERMISSION_LEVELS: {
  value: CollaborationPermission[];
  label: string;
  description: string
}[] = [
  {
    value: ["read"],
    label: "Viewer",
    description: "Can view project and make comments",
  },
  {
    value: ["read", "comment"],
    label: "Commenter",
    description: "Can view and comment on project",
  },
  {
    value: ["read", "comment", "edit"],
    label: "Editor",
    description: "Can edit content and manage sections",
  },
  {
    value: ["read", "comment", "edit", "admin"],
    label: "Admin",
    description: "Can manage team and project settings",
  },
];

export function InviteCollaboratorDialog({
  projectId,
  projectTitle,
}: InviteCollaboratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<CreatorRole>("designer");
  const [selectedPermissions, setSelectedPermissions] = useState<CollaborationPermission[]>(["read", "comment"]);
  const [contributionDescription, setContributionDescription] = useState("");
  const [error, setError] = useState("");

  const handleInvite = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!contributionDescription.trim()) {
      setError("Please describe what this collaborator will contribute");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await inviteCollaborator(
        projectId,
        email.trim(),
        selectedRole,
        selectedPermissions,
        contributionDescription.trim()
      );

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form and close dialog
        setEmail("");
        setSelectedRole("designer");
        setSelectedPermissions(["read", "comment"]);
        setContributionDescription("");
        setIsOpen(false);
      }
    } catch (err) {
      setError("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPermissionLevel = PERMISSION_LEVELS.find(
    (level) => level.value.length === selectedPermissions.length &&
              level.value.every((perm) => selectedPermissions.includes(perm))
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Collaborator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Invite Collaborator
          </DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on <strong>{projectTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborator@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Creator Role</Label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as CreatorRole)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {CREATOR_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permissions">Permission Level</Label>
            <select
              id="permissions"
              value={selectedPermissions.join(",")}
              onChange={(e) => {
                const level = PERMISSION_LEVELS.find(
                  (level) => level.value.join(",") === e.target.value
                );
                if (level) {
                  setSelectedPermissions(level.value);
                }
              }}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {PERMISSION_LEVELS.map((level) => (
                <option key={level.value.join(",")} value={level.value.join(",")}>
                  {level.label}
                </option>
              ))}
            </select>
            {selectedPermissionLevel && (
              <p className="text-xs text-slate-600">
                {selectedPermissionLevel.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution">Expected Contribution</Label>
            <Textarea
              id="contribution"
              value={contributionDescription}
              onChange={(e) => setContributionDescription(e.target.value)}
              placeholder="Describe what this person will contribute to the project..."
              disabled={isLoading}
              className="min-h-20"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-xs text-blue-700">
                <strong>Future Revenue Sharing:</strong> When projects are merged
                or published to the marketplace, revenue will be split equally among
                all contributors by default. This can be negotiated during the merge process.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={isLoading || !email.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
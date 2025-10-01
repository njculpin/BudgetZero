"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { CollaborationProposalModal } from "./collaboration-proposal-modal";

interface ProposeCollaborationButtonProps {
  asset: {
    id: string;
    title: string;
    asset_type: 'model' | 'illustration';
    creator: {
      id: string;
      full_name?: string;
      username?: string;
    };
  };
  currentProject?: {
    id: string;
    title: string;
  };
}

export function ProposeCollaborationButton({
  asset,
  currentProject,
}: ProposeCollaborationButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Users className="h-4 w-4 mr-2" />
        Propose Collaboration
      </Button>

      <CollaborationProposalModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        asset={asset}
        currentProject={currentProject}
      />
    </>
  );
}

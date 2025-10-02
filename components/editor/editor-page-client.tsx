"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GameProject, Rulebook } from "@/lib/types/database";
import { BlockEditor } from "./block-editor";

interface EditorPageClientProps {
  project?: GameProject;
  rulebook?: Rulebook | null;
  documentId?: string;
  initialContent?: any;
  canEdit: boolean;
}

export function EditorPageClient({
  project,
  rulebook,
  documentId,
  initialContent,
  canEdit,
}: EditorPageClientProps) {
  const [_isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async (content: any) => {
    setIsSaving(true);
    try {
      if (documentId) {
        // Update document
        const { error } = await supabase
          .from("documents")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", documentId);

        if (error) {
          console.error("Error updating document:", error);
          throw new Error("Failed to save changes");
        }
      } else if (rulebook) {
        // Update existing rulebook (legacy)
        const { error } = await supabase
          .from("rulebooks")
          .update({
            content,
            last_edited_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq("id", rulebook.id);

        if (error) {
          console.error("Error updating rulebook:", error);
          throw new Error("Failed to save changes");
        }
      } else if (project) {
        // Create new rulebook (legacy)
        const { error } = await supabase.from("rulebooks").insert({
          project_id: project.id,
          title: `${project.title} Rulebook`,
          content,
          last_edited_by: (await supabase.auth.getUser()).data.user?.id,
        });

        if (error) {
          console.error("Error creating rulebook:", error);
          throw new Error("Failed to create rulebook");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BlockEditor
      initialContent={initialContent || rulebook?.content}
      projectTitle={project?.title || "Document"}
      isReadOnly={!canEdit}
      onSave={canEdit ? handleSave : undefined}
    />
  );
}

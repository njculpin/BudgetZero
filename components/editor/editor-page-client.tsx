'use client';

import { useState } from 'react';
import { SimpleEditor } from './simple-editor';
import { createClient } from '@/lib/supabase/client';
import { GameProject, Rulebook } from '@/lib/types/database';

interface EditorPageClientProps {
  project: GameProject;
  rulebook: Rulebook | null;
  canEdit: boolean;
}

export function EditorPageClient({ project, rulebook, canEdit }: EditorPageClientProps) {
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async (content: any) => {
    setIsSaving(true);
    try {
      if (rulebook) {
        // Update existing rulebook
        const { error } = await supabase
          .from('rulebooks')
          .update({
            content,
            last_edited_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq('id', rulebook.id);

        if (error) {
          console.error('Error updating rulebook:', error);
          throw new Error('Failed to save changes');
        }
      } else {
        // Create new rulebook
        const { error } = await supabase
          .from('rulebooks')
          .insert({
            project_id: project.id,
            title: `${project.title} Rulebook`,
            content,
            last_edited_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) {
          console.error('Error creating rulebook:', error);
          throw new Error('Failed to create rulebook');
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SimpleEditor
      initialContent={rulebook?.content}
      projectTitle={project.title}
      isReadOnly={!canEdit}
      onSave={canEdit ? handleSave : undefined}
    />
  );
}
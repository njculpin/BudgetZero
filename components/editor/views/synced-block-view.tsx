'use client';

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Copy, Unlink, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SyncedBlockViewProps {
  node: any;
  updateAttributes: (attributes: any) => void;
  deleteNode: () => void;
  editor: any;
}

export function SyncedBlockView({ node, updateAttributes, deleteNode, editor }: SyncedBlockViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { syncId, isOriginal, lastSynced } = node.attrs;

  const handleCopyReference = () => {
    // Insert a reference to this synced block at cursor position
    const { from } = editor.state.selection;
    editor.chain()
      .focus()
      .insertContentAt(from, {
        type: 'syncedBlock',
        attrs: {
          syncId,
          isOriginal: false,
          lastSynced: new Date().toISOString(),
        },
        content: node.content.toJSON(),
      })
      .run();
  };

  const handleUnlink = () => {
    // Convert this synced block back to regular content
    const content = node.content.toJSON();
    editor.chain()
      .focus()
      .deleteNode('syncedBlock')
      .insertContent(content)
      .run();
  };

  const handleCreateReference = () => {
    // Show a dialog or menu to insert references elsewhere
    // For now, just copy the sync ID to clipboard
    navigator.clipboard.writeText(syncId);
    // TODO: Show toast notification
  };

  const formatLastSynced = (timestamp: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <NodeViewWrapper
      className={`synced-block-wrapper relative border-2 border-dashed rounded-lg p-4 my-4 transition-all duration-200 ${
        isOriginal
          ? 'border-blue-300 bg-blue-50/50'
          : 'border-purple-300 bg-purple-50/50'
      } ${isHovered ? 'shadow-md' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Synced Block Header */}
      <div className="flex items-center justify-between mb-3 -mt-2">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gray-500" />
          <Badge
            variant={isOriginal ? "default" : "secondary"}
            className="text-xs"
          >
            {isOriginal ? 'Original' : 'Reference'}
          </Badge>
          <span className="text-xs text-gray-500">
            Synced {formatLastSynced(lastSynced)}
          </span>
        </div>

        {/* Synced Block Actions */}
        {isHovered && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCopyReference}
              title="Create reference"
            >
              <Copy className="w-3 h-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="More options"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Synced Block</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleCreateReference}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy sync ID
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyReference}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Create reference
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleUnlink}
                  className="text-red-600 focus:text-red-600"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink from sync
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Synced Block Content */}
      <div className="relative">
        <NodeViewContent className="synced-block-content" />

        {/* Sync Indicator */}
        {!isOriginal && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full opacity-60" />
        )}
      </div>

      {/* Sync Info Footer */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
        <span>Sync ID: </span>
        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
          {syncId.slice(0, 8)}...
        </code>
      </div>
    </NodeViewWrapper>
  );
}
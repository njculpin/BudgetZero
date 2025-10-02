"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import {
  Copy,
  Hash,
  Link2,
  MoreHorizontal,
  Navigation,
  Trash2,
  Unlink,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getSyncGroupA11yDescription,
  getSyncGroupColor,
  getSyncGroupId,
  getSyncGroupInfo,
  getSyncGroupNavigation,
  getSyncGroupStyles,
  getSyncGroupTooltipContent,
} from "@/lib/sync-group-utils";

interface SyncedBlockViewProps {
  node: any;
  updateAttributes: (attributes: any) => void;
  deleteNode: () => void;
  editor: any;
  selected?: boolean;
  getPos: () => number | undefined;
}

export function SyncedBlockView({
  node,
  updateAttributes: _updateAttributes,
  deleteNode,
  editor,
  selected: _selected = false,
  getPos: _getPos,
}: SyncedBlockViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const { syncId, lastSynced } = node.attrs;

  // Get sync group identification and styling
  const _syncGroupColor = getSyncGroupColor(syncId);
  const syncGroupId = getSyncGroupId(syncId);
  const syncGroupStyles = getSyncGroupStyles(syncId);
  const syncGroupInfo = getSyncGroupInfo(syncId, editor);
  const currentPos = _getPos?.() ?? 0;
  const navigation = getSyncGroupNavigation(syncId, currentPos, editor);
  const tooltipContent = getSyncGroupTooltipContent(syncId, editor);
  const a11yDescription = getSyncGroupA11yDescription(
    syncId,
    syncGroupInfo.totalInstances,
  );

  const handleCopyReference = () => {
    // Find a safe position to insert the reference (outside any synced blocks)
    const { from } = editor.state.selection;
    let insertPos = from;

    // Walk up the document tree to find if we're inside a synced block
    editor.state.doc.nodesBetween(
      0,
      editor.state.doc.content.size,
      (node: { type: { name: string }; nodeSize: number }, pos: number) => {
        if (
          node.type.name === "syncedBlock" &&
          pos < from &&
          pos + node.nodeSize > from
        ) {
          // We're inside a synced block, insert after it
          insertPos = pos + node.nodeSize;
          return false; // Stop traversing
        }
      },
    );

    // Insert a reference to this synced block at the safe position
    // Use the same timestamp as the source block to show they're synchronized
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: "syncedBlock",
        attrs: {
          syncId,
          lastSynced: lastSynced || new Date().toISOString(),
        },
        content: node.content.toJSON(),
      })
      .run();
  };

  const handleUnlink = () => {
    // Convert this synced block back to regular content
    const content = node.content.toJSON();
    editor
      .chain()
      .focus()
      .deleteNode("syncedBlock")
      .insertContent(content)
      .run();
  };

  const handleCreateReference = () => {
    // Show a dialog or menu to insert references elsewhere
    // For now, just copy the sync ID to clipboard
    navigator.clipboard.writeText(syncId);
    // TODO: Show toast notification
  };

  const handleNavigateToNext = () => {
    if (navigation?.next) {
      editor.commands.setTextSelection(navigation.next.pos);
      editor.commands.scrollIntoView();
    }
  };

  const handleNavigateToPrevious = () => {
    if (navigation?.previous) {
      editor.commands.setTextSelection(navigation.previous.pos);
      editor.commands.scrollIntoView();
    }
  };

  // Count how many instances of this syncId exist
  const countSyncedBlocks = () => {
    return syncGroupInfo.totalInstances;
  };

  const handleDeleteThis = () => {
    // Delete only this instance
    deleteNode();
    setShowDeleteDialog(false);
  };

  const handleDeleteAll = () => {
    // Delete all synced blocks with this syncId
    editor.commands.deleteSyncedBlock(syncId, true);
    setShowDeleteAllDialog(false);
  };

  const handleDeleteThisClick = () => {
    const totalBlocks = countSyncedBlocks();
    if (totalBlocks === 1) {
      setShowDeleteDialog(true);
    } else {
      handleDeleteThis();
    }
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllDialog(true);
  };

  const formatLastSynced = (timestamp: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <NodeViewWrapper
      className={`synced-block-wrapper relative border-2 border-dashed rounded-lg p-4 my-4 transition-all duration-200 overflow-visible ${syncGroupStyles.borderClass} ${syncGroupStyles.backgroundClass} ${syncGroupStyles.hoverClass} ${syncGroupStyles.focusClass} ${
        isHovered ? "shadow-md" : ""
      }`}
      style={syncGroupStyles.customProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label={a11yDescription}
    >
      {/* Synced Block Header */}
      <div
        className="flex items-center justify-between mb-3 -mt-2"
        contentEditable={false}
      >
        <div className="flex items-center gap-2">
          <Link2 className={`w-4 h-4 ${syncGroupStyles.textClass}`} />
          <Badge
            variant="outline"
            className={`text-xs ${syncGroupStyles.badgeClass}`}
            title={tooltipContent.description}
          >
            <Hash className="w-3 h-3 mr-1" />
            {syncGroupId}
          </Badge>
          {syncGroupInfo.totalInstances > 1 && (
            <Badge variant="secondary" className="text-xs">
              {navigation?.currentIndex}/{syncGroupInfo.totalInstances}
            </Badge>
          )}
          <span className="text-xs text-gray-500">
            Updated {formatLastSynced(lastSynced)}
          </span>
        </div>

        {/* Synced Block Actions */}
        {isHovered && (
          <div className="flex items-center gap-1" contentEditable={false}>
            {/* Navigation controls - only show if multiple instances */}
            {syncGroupInfo.totalInstances > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNavigateToPrevious();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  title="Go to previous synced block"
                  disabled={!navigation?.previous}
                >
                  <Navigation className="w-3 h-3 rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNavigateToNext();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  title="Go to next synced block"
                  disabled={!navigation?.next}
                >
                  <Navigation className="w-3 h-3" />
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyReference();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              title="Create reference"
            >
              <Copy className="w-3 h-3" />
            </Button>

            {/* Three-dot dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="More options"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{tooltipContent.title}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Navigation group - only show if multiple instances */}
                {syncGroupInfo.totalInstances > 1 && (
                  <>
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNavigateToPrevious();
                        }}
                        disabled={!navigation?.previous}
                      >
                        <Navigation className="w-4 h-4 mr-2 rotate-180" />
                        Go to previous (
                        {navigation?.currentIndex === 1
                          ? syncGroupInfo.totalInstances
                          : (navigation?.currentIndex || 1) - 1}
                        )
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNavigateToNext();
                        }}
                        disabled={!navigation?.next}
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Go to next (
                        {navigation?.currentIndex ===
                        syncGroupInfo.totalInstances
                          ? 1
                          : (navigation?.currentIndex || 1) + 1}
                        )
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateReference();
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy sync ID
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyReference();
                    }}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Create reference
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteThisClick();
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete this block
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteAllClick();
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete all synced blocks
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUnlink();
                  }}
                  className="text-orange-600 focus:text-orange-600"
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
        <NodeViewContent
          className="synced-block-content"
          as="div"
          data-drag-handle=""
        />

        {/* Sync Indicator */}
        <div
          className={`absolute top-2 right-2 w-2 h-2 ${syncGroupStyles.textClass.replace("text", "bg")} rounded-full opacity-60`}
        />
      </div>

      {/* Sync Info Footer */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Group: </span>
          <code
            className={`px-1 py-0.5 rounded text-xs ${syncGroupStyles.badgeClass}`}
          >
            {syncGroupId}
          </code>
          {syncGroupInfo.totalInstances > 1 && (
            <span className={`${syncGroupStyles.textClass} font-medium`}>
              {syncGroupInfo.totalInstances} synced
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs">{tooltipContent.hint}</span>
      </div>

      {/* Delete Last Block Warning Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Last Synced Block?</DialogTitle>
            <DialogDescription>
              This is the last remaining synced block with this ID. Deleting it
              will permanently remove all synced content. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteThis}>
              Delete Last Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Blocks Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Synced Blocks?</DialogTitle>
            <DialogDescription>
              This will permanently delete all {countSyncedBlocks()} synced
              blocks with this ID throughout the entire document. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              Delete All ({countSyncedBlocks()}) Blocks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
}

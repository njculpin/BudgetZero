"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Box, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AssetReferenceView({
  node,
  deleteNode,
  selected,
}: NodeViewProps) {
  const {
    assetId,
    assetName,
    assetType,
    thumbnailUrl,
    creatorName,
    licenseType,
  } = node.attrs;

  return (
    <NodeViewWrapper
      className={`asset-reference-wrapper my-4 ${selected ? "ring-2 ring-blue-500" : ""}`}
    >
      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={assetName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Box className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{assetName}</h3>
                {creatorName && (
                  <p className="text-sm text-gray-600 mt-1">by {creatorName}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/models/${assetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="View asset details"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={deleteNode}
                  title="Remove asset from project"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                {assetType}
              </Badge>
              {licenseType && (
                <Badge variant="outline" className="text-xs capitalize">
                  {licenseType} license
                </Badge>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Asset reference • Click to view details or remove
            </p>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

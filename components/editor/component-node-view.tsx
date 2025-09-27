'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Info,
  Zap,
  Trash2,
  Copy,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReusableComponent } from './reusable-component';

interface ComponentNodeViewProps {
  node: {
    attrs: {
      componentId: string;
      componentType: ReusableComponent['type'];
      componentTitle: string;
      componentContent: string;
      componentSettings: ReusableComponent['settings'];
    };
  };
  deleteNode: () => void;
  selected: boolean;
}

const componentTypeConfig = {
  reminder: {
    icon: AlertCircle,
    defaultBackground: 'bg-blue-50/50',
    defaultBorder: 'border-l-4 border-blue-400',
    label: 'Reminder'
  },
  mechanic: {
    icon: Zap,
    defaultBackground: 'bg-amber-50/50',
    defaultBorder: 'border-l-4 border-amber-400',
    label: 'Game Mechanic'
  },
  callout: {
    icon: Info,
    defaultBackground: 'bg-slate-50/50',
    defaultBorder: 'border-l-4 border-slate-400',
    label: 'Callout'
  }
};

export function ComponentNodeView({ node, deleteNode, selected }: ComponentNodeViewProps) {
  const { componentType, componentTitle, componentContent, componentSettings } = node.attrs;
  const config = componentTypeConfig[componentType];
  const IconComponent = config.icon;

  return (
    <NodeViewWrapper className="my-4">
      <div
        className={cn(
          'group relative p-4 rounded-md border',
          config.defaultBackground,
          config.defaultBorder,
          selected && 'ring-2 ring-primary/20'
        )}
      >
        {/* Component Actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteNode}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div>
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className="h-4 w-4 text-primary" />
            {componentSettings.showTitle !== false && (
              <h4 className="font-medium text-sm">{componentTitle}</h4>
            )}
            <Badge variant="secondary" className="text-xs">
              {config.label}
            </Badge>
          </div>

          {/* Content */}
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {componentContent}
          </div>

          {/* Component indicator */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-muted/20">
            <div className="text-xs text-muted-foreground">
              Reusable Component
            </div>
            <Badge variant="outline" className="text-xs">
              ID: {node.attrs.componentId.slice(-8)}
            </Badge>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
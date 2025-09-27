'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Settings,
  Copy,
  Edit2,
  Trash2,
  Bookmark,
  Info,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReusableComponent {
  id: string;
  type: 'reminder' | 'mechanic' | 'callout';
  title: string;
  content: string;
  settings: {
    backgroundColor?: string;
    borderColor?: string;
    icon?: string;
    showTitle?: boolean;
  };
  metadata: {
    createdAt: Date;
    usageCount: number;
    tags: string[];
  };
}

interface ReusableComponentDisplayProps {
  component: ReusableComponent;
  isSelected?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSelect?: () => void;
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

export function ReusableComponentDisplay({
  component,
  isSelected = false,
  isEditing = false,
  onEdit,
  onDuplicate,
  onDelete,
  onSelect,
}: ReusableComponentDisplayProps) {
  const config = componentTypeConfig[component.type];
  const IconComponent = config.icon;

  return (
    <Card
      className={cn(
        'relative p-4 cursor-pointer transition-all duration-200',
        config.defaultBackground,
        config.defaultBorder,
        isSelected && 'ring-2 ring-primary/20',
        isEditing && 'border-dashed border-primary/30'
      )}
      onClick={onSelect}
    >
      {/* Component Actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
        {onDuplicate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="group">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <IconComponent className="h-4 w-4 text-primary" />
          {component.settings.showTitle !== false && (
            <h4 className="font-medium text-sm">{component.title}</h4>
          )}
          <Badge variant="secondary" className="text-xs">
            {config.label}
          </Badge>
        </div>

        {/* Content */}
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {component.content}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Used {component.metadata.usageCount} times</span>
          </div>
          <div className="flex items-center gap-1">
            {component.metadata.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface CreateComponentDialogProps {
  trigger: React.ReactNode;
  onCreateComponent: (component: Omit<ReusableComponent, 'id' | 'metadata'>) => void;
}

export function CreateComponentDialog({ trigger, onCreateComponent }: CreateComponentDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReusableComponent['type']>('reminder');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showTitle, setShowTitle] = useState(true);
  const [tags, setTags] = useState('');

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;

    const component: Omit<ReusableComponent, 'id' | 'metadata'> = {
      type,
      title: title.trim(),
      content: content.trim(),
      settings: {
        showTitle,
        backgroundColor: componentTypeConfig[type].defaultBackground,
        borderColor: componentTypeConfig[type].defaultBorder,
        icon: componentTypeConfig[type].icon.name,
      }
    };

    onCreateComponent(component);

    // Reset form
    setTitle('');
    setContent('');
    setTags('');
    setShowTitle(true);
    setType('reminder');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Reusable Component</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Select value={type} onValueChange={(value: ReusableComponent['type']) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reminder">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    Reminder
                  </div>
                </SelectItem>
                <SelectItem value="mechanic">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    Game Mechanic
                  </div>
                </SelectItem>
                <SelectItem value="callout">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-600" />
                    Callout
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter component title..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the reusable content..."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="combat, setup, rules..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showTitle"
              checked={showTitle}
              onChange={(e) => setShowTitle(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showTitle" className="text-sm">Show title in component</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!title.trim() || !content.trim()}>
              Create Component
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  GripVertical,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RulebookSection {
  id: string;
  title: string;
  type: 'section' | 'page';
  content?: any;
  isVisible?: boolean;
  isExpanded?: boolean;
  parentId?: string;
  order: number;
  children?: RulebookSection[];
}

interface SortableItemProps {
  section: RulebookSection;
  isActive: boolean;
  onSelect: (section: RulebookSection) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  depth?: number;
}

function SortableItem({
  section,
  isActive,
  onSelect,
  onToggleVisibility,
  onEdit,
  onDelete,
  onToggleExpanded,
  depth = 0
}: SortableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEditSubmit = () => {
    if (editTitle.trim()) {
      onEdit(section.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(section.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "opacity-50"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-colors",
          "hover:bg-muted/50",
          isActive && "bg-muted border-l-4 border-primary",
          depth > 0 && "ml-4"
        )}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>

        {section.type === 'section' && section.children && section.children.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0"
            onClick={() => onToggleExpanded(section.id)}
          >
            {section.isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {section.type === 'section' ? (
            <Layers className="w-4 h-4 text-blue-500 flex-shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}

          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleEditKeyPress}
              className="h-6 text-sm"
              autoFocus
            />
          ) : (
            <span
              className={cn(
                "text-sm font-medium truncate cursor-pointer",
                !section.isVisible && "opacity-50 line-through"
              )}
              onClick={() => onSelect(section)}
            >
              {section.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0"
            onClick={() => onToggleVisibility(section.id)}
          >
            {section.isVisible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(section.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {section.type === 'section' && section.isExpanded && section.children && (
        <div className="ml-2">
          {section.children.map((child) => (
            <SortableItem
              key={child.id}
              section={child}
              isActive={isActive}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpanded={onToggleExpanded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionManagerProps {
  sections: RulebookSection[];
  activeSection?: RulebookSection;
  onSectionsChange: (sections: RulebookSection[]) => void;
  onSectionSelect: (section: RulebookSection) => void;
}

export function SectionManager({
  sections,
  activeSection,
  onSectionsChange,
  onSectionSelect
}: SectionManagerProps) {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'section' | 'page'>('section');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((item) => item.id === active.id);
      const newIndex = sections.findIndex((item) => item.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      // Update order values
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order: index
      }));
      onSectionsChange(updatedSections);
    }
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: RulebookSection = {
      id: `${addType}-${Date.now()}`,
      title: newSectionTitle.trim(),
      type: addType,
      isVisible: true,
      isExpanded: true,
      order: sections.length,
      children: addType === 'section' ? [] : undefined
    };

    onSectionsChange([...sections, newSection]);
    setNewSectionTitle('');
    setShowAddForm(false);
  };

  const handleToggleVisibility = (id: string) => {
    const updatedSections = sections.map(section =>
      section.id === id ? { ...section, isVisible: !section.isVisible } : section
    );
    onSectionsChange(updatedSections);
  };

  const handleEdit = (id: string, title: string) => {
    const updatedSections = sections.map(section =>
      section.id === id ? { ...section, title } : section
    );
    onSectionsChange(updatedSections);
  };

  const handleDelete = (id: string) => {
    const updatedSections = sections.filter(section => section.id !== id);
    onSectionsChange(updatedSections);
  };

  const handleToggleExpanded = (id: string) => {
    const updatedSections = sections.map(section =>
      section.id === id ? { ...section, isExpanded: !section.isExpanded } : section
    );
    onSectionsChange(updatedSections);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Document Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableItem
                  key={section.id}
                  section={section}
                  isActive={activeSection?.id === section.id}
                  onSelect={onSectionSelect}
                  onToggleVisibility={handleToggleVisibility}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleExpanded={handleToggleExpanded}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <Separator />

        {showAddForm ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={addType === 'section' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAddType('section')}
                >
                  <Layers className="w-4 h-4 mr-1" />
                  Section
                </Button>
                <Button
                  variant={addType === 'page' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAddType('page')}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Page
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder={`Enter ${addType} title...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection();
                  if (e.key === 'Escape') {
                    setShowAddForm(false);
                    setNewSectionTitle('');
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddSection} disabled={!newSectionTitle.trim()}>
                Add {addType}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewSectionTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Section/Page
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
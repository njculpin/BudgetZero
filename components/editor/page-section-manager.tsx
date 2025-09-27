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
  DragOverlay,
  DragStartEvent,
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
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RulebookPage {
  id: string;
  title: string;
  order: number;
  isVisible?: boolean;
  isExpanded?: boolean;
  sections: RulebookSection[];
}

export interface RulebookSection {
  id: string;
  title: string;
  content?: any;
  order: number;
  pageId: string;
  isVisible?: boolean;
}

interface SortablePageProps {
  page: RulebookPage;
  isExpanded: boolean;
  activeSection?: RulebookSection;
  onSelectSection: (section: RulebookSection) => void;
  onTogglePage: (pageId: string) => void;
  onEditPage: (pageId: string, title: string) => void;
  onDeletePage: (pageId: string) => void;
  onAddSection: (pageId: string) => void;
  onEditSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
}

function SortablePage({
  page,
  isExpanded,
  activeSection,
  onSelectSection,
  onTogglePage,
  onEditPage,
  onDeletePage,
  onAddSection,
  onEditSection,
  onDeleteSection,
}: SortablePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEdit = () => {
    if (isEditing) {
      onEditPage(page.id, editTitle);
    }
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setEditTitle(page.title);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <div className="mb-2">
        {/* Page Header */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
          <div {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePage(page.id)}
            className="h-auto p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <FileText className="h-4 w-4 text-blue-600" />

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-7 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') handleCancel();
                }}
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-7 w-7 p-0"
              >
                ✓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-7 w-7 p-0"
              >
                ✕
              </Button>
            </div>
          ) : (
            <span className="font-medium flex-1">{page.title}</span>
          )}

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSection(page.id)}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeletePage(page.id)}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Sections */}
        {isExpanded && (
          <div className="ml-6 mt-2 space-y-1">
            {page.sections.length === 0 ? (
              <div className="p-3 border-2 border-dashed border-muted-foreground/20 rounded-md text-center text-sm text-muted-foreground bg-muted/10">
                Drop sections here or click "+" to add
              </div>
            ) : (
              page.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  isActive={activeSection?.id === section.id}
                  onSelect={onSelectSection}
                  onEdit={onEditSection}
                  onDelete={onDeleteSection}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SortableSectionProps {
  section: RulebookSection;
  isActive: boolean;
  onSelect: (section: RulebookSection) => void;
  onEdit: (sectionId: string, title: string) => void;
  onDelete: (sectionId: string) => void;
}

function SortableSection({
  section,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: SortableSectionProps) {
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

  const handleEdit = () => {
    if (isEditing) {
      onEdit(section.id, editTitle);
    }
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setEditTitle(section.title);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-all duration-200 cursor-pointer",
          "hover:bg-muted/50 hover:shadow-sm",
          isActive ?
            "bg-primary/10 border-l-4 border-primary shadow-md ring-2 ring-primary/20 ring-offset-1" :
            "border-l-4 border-transparent"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditing) {
            onSelect(section);
          }
        }}
      >
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>

        <Layers className={cn(
          "h-3 w-3 transition-colors",
          isActive ? "text-primary" : "text-green-600"
        )} />

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-6 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEdit();
                if (e.key === 'Escape') handleCancel();
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="h-6 w-6 p-0"
            >
              ✓
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        ) : (
          <span className={cn(
            "text-sm flex-1 transition-colors",
            isActive ? "font-medium text-primary" : ""
          )}>{section.title}</span>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-2.5 w-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(section.id);
            }}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PageSectionManagerProps {
  pages: RulebookPage[];
  activeSection?: RulebookSection;
  onPagesChange: (pages: RulebookPage[]) => void;
  onSectionSelect: (section: RulebookSection) => void;
}

export function PageSectionManager({
  pages,
  activeSection,
  onPagesChange,
  onSectionSelect,
}: PageSectionManagerProps) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    new Set(pages.map(p => p.id))
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're dragging a page
    const activePageIndex = pages.findIndex(page => page.id === activeId);
    const overPageIndex = pages.findIndex(page => page.id === overId);

    if (activePageIndex !== -1) {
      // Dragging a page
      if (overPageIndex !== -1) {
        const newPages = arrayMove(pages, activePageIndex, overPageIndex).map((page, index) => ({
          ...page,
          order: index,
        }));
        onPagesChange(newPages);
      }
      return;
    }

    // Find the active section
    let activePageId = '';
    let activeSectionIndex = -1;
    let activeSection: RulebookSection | null = null;

    for (const page of pages) {
      const sectionIndex = page.sections.findIndex(section => section.id === activeId);
      if (sectionIndex !== -1) {
        activePageId = page.id;
        activeSectionIndex = sectionIndex;
        activeSection = page.sections[sectionIndex];
        break;
      }
    }

    if (!activeSection) return;

    // Check if dropping on a page (move section to end of that page)
    const targetPage = pages.find(page => page.id === overId);
    if (targetPage) {
      const newPages = pages.map(page => {
        if (page.id === activePageId) {
          // Remove section from source page
          return {
            ...page,
            sections: page.sections.filter(section => section.id !== activeId)
          };
        } else if (page.id === overId) {
          // Add section to target page
          return {
            ...page,
            sections: [
              ...page.sections,
              { ...activeSection, pageId: overId, order: page.sections.length }
            ]
          };
        }
        return page;
      });
      onPagesChange(newPages);
      return;
    }

    // Find the target section
    let targetPageId = '';
    let targetSectionIndex = -1;

    for (const page of pages) {
      const sectionIndex = page.sections.findIndex(section => section.id === overId);
      if (sectionIndex !== -1) {
        targetPageId = page.id;
        targetSectionIndex = sectionIndex;
        break;
      }
    }

    if (targetPageId === '') return;

    if (activePageId === targetPageId) {
      // Moving within the same page
      const newPages = pages.map(page => {
        if (page.id === activePageId) {
          const newSections = arrayMove(page.sections, activeSectionIndex, targetSectionIndex)
            .map((section, index) => ({ ...section, order: index }));
          return { ...page, sections: newSections };
        }
        return page;
      });
      onPagesChange(newPages);
    } else {
      // Moving between different pages
      const newPages = pages.map(page => {
        if (page.id === activePageId) {
          // Remove from source page
          return {
            ...page,
            sections: page.sections
              .filter(section => section.id !== activeId)
              .map((section, index) => ({ ...section, order: index }))
          };
        } else if (page.id === targetPageId) {
          // Add to target page at specific position
          const newSections = [...page.sections];
          newSections.splice(targetSectionIndex, 0, {
            ...activeSection,
            pageId: targetPageId,
            order: targetSectionIndex
          });
          return {
            ...page,
            sections: newSections.map((section, index) => ({ ...section, order: index }))
          };
        }
        return page;
      });
      onPagesChange(newPages);
    }
    setActiveId(null);
  };

  const handleTogglePage = (pageId: string) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleAddPage = () => {
    const newPage: RulebookPage = {
      id: `page-${Date.now()}`,
      title: 'New Page',
      order: pages.length,
      isVisible: true,
      isExpanded: true,
      sections: []
    };
    onPagesChange([...pages, newPage]);
    setExpandedPages(prev => new Set([...prev, newPage.id]));
  };

  const handleEditPage = (pageId: string, title: string) => {
    const updatedPages = pages.map(page =>
      page.id === pageId ? { ...page, title } : page
    );
    onPagesChange(updatedPages);
  };

  const handleDeletePage = (pageId: string) => {
    const updatedPages = pages.filter(page => page.id !== pageId);
    onPagesChange(updatedPages);
    setExpandedPages(prev => {
      const next = new Set(prev);
      next.delete(pageId);
      return next;
    });
  };

  const handleAddSection = (pageId: string) => {
    const updatedPages = pages.map(page => {
      if (page.id === pageId) {
        const newSection: RulebookSection = {
          id: `section-${Date.now()}`,
          title: 'New Section',
          order: page.sections.length,
          pageId: pageId,
          isVisible: true
        };
        return {
          ...page,
          sections: [...page.sections, newSection]
        };
      }
      return page;
    });
    onPagesChange(updatedPages);
  };

  const handleEditSection = (sectionId: string, title: string) => {
    const updatedPages = pages.map(page => ({
      ...page,
      sections: page.sections.map(section =>
        section.id === sectionId ? { ...section, title } : section
      )
    }));
    onPagesChange(updatedPages);
  };

  const handleDeleteSection = (sectionId: string) => {
    const updatedPages = pages.map(page => ({
      ...page,
      sections: page.sections.filter(section => section.id !== sectionId)
    }));
    onPagesChange(updatedPages);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Rulebook Structure</CardTitle>
          <Button onClick={handleAddPage} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Page
          </Button>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {pages.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-6">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-medium mb-2">Create your first page</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Pages help organize your rulebook into logical sections
              </p>
            </div>

            <Button onClick={handleAddPage} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={[
                ...pages.map(p => p.id),
                ...pages.flatMap(p => p.sections.map(s => s.id))
              ]}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {pages.map((page) => (
                  <SortablePage
                    key={page.id}
                    page={page}
                    isExpanded={expandedPages.has(page.id)}
                    activeSection={activeSection}
                    onSelectSection={onSectionSelect}
                    onTogglePage={handleTogglePage}
                    onEditPage={handleEditPage}
                    onDeletePage={handleDeletePage}
                    onAddSection={handleAddSection}
                    onEditSection={handleEditSection}
                    onDeleteSection={handleDeleteSection}
                  />
                ))}
              </div>
              </SortableContext>
            <DragOverlay>
              {activeId ? (
                (() => {
                  // Find if activeId is a page
                  const page = pages.find(p => p.id === activeId);
                  if (page) {
                    return (
                      <div className="p-2 bg-background border rounded-md shadow-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{page.title}</span>
                        </div>
                      </div>
                    );
                  }

                  // Find if activeId is a section
                  for (const p of pages) {
                    const section = p.sections.find(s => s.id === activeId);
                    if (section) {
                      return (
                        <div className="p-2 bg-background border rounded-md shadow-lg">
                          <div className="flex items-center gap-2">
                            <Layers className="h-3 w-3 text-green-600" />
                            <span className="text-sm">{section.title}</span>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
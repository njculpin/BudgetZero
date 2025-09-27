'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageSectionManager, RulebookPage, RulebookSection } from './page-section-manager';
import { SectionEditor } from './section-editor';
import { ComponentLibrary } from './component-library';
import { ReusableComponent } from './reusable-component';
import {
  Save,
  Eye,
  Users,
  CheckCircle,
  ChevronRight,
  FileText,
  Layers
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface RulebookEditorProps {
  initialContent?: any;
  onSave?: (content: any, pages?: RulebookPage[], components?: ReusableComponent[]) => Promise<void>;
  onContentChange?: (content: any, pages?: RulebookPage[]) => void;
  isReadOnly?: boolean;
  projectTitle?: string;
  initialPages?: RulebookPage[];
  initialComponents?: ReusableComponent[];
}

export function RulebookEditor({
  initialContent,
  onSave,
  onContentChange,
  isReadOnly = false,
  projectTitle = "Untitled Project",
  initialPages,
  initialComponents
}: RulebookEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [pages, setPages] = useState<RulebookPage[]>(initialPages || []);

  // Get all sections from all pages for easier access
  const allSections = pages.flatMap(page => page.sections);
  const [activeSection, setActiveSection] = useState<RulebookSection | undefined>(allSections[0]);

  // Component library state
  const [components, setComponents] = useState<ReusableComponent[]>(initialComponents || []);

  // Handle content changes from individual section editors
  const handleSectionContentChange = useCallback((sectionId: string, content: any) => {
    const updatedPages = pages.map(page => ({
      ...page,
      sections: page.sections.map(section =>
        section.id === sectionId
          ? { ...section, content }
          : section
      )
    }));
    setPages(updatedPages);
    if (onContentChange) {
      onContentChange(content, updatedPages);
    }
  }, [pages, onContentChange]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      // Compile all section content into one document organized by pages
      const allContent = {
        type: 'doc',
        content: pages.flatMap(page => [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: page.title }]
          },
          ...page.sections.flatMap(section =>
            section.content?.content || [
              {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: section.title }]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Start writing content for this section...' }]
              }
            ]
          )
        ])
      };
      await onSave(allContent, pages, components);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, pages, components]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!onSave || isReadOnly) return;

    const interval = setInterval(() => {
      handleSave();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleSave, onSave, isReadOnly]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleSectionSelect = (section: RulebookSection) => {
    console.log('Section selected:', section.title, section.id);
    setActiveSection(section);
  };

  const handlePagesChange = (newPages: RulebookPage[]) => {
    setPages(newPages);
    if (onContentChange) {
      // With multiple editors, we pass the compiled content from all pages and sections
      const allContent = {
        type: 'doc',
        content: newPages.flatMap(page => [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: page.title }]
          },
          ...page.sections.flatMap(section =>
            section.content?.content || [
              {
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: section.title }]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Start writing content for this section...' }]
              }
            ]
          )
        ])
      };
      onContentChange(allContent, newPages);
    }
  };

  // Component library handlers
  const handleCreateComponent = useCallback((componentData: Omit<ReusableComponent, 'id' | 'metadata'>) => {
    const newComponent: ReusableComponent = {
      ...componentData,
      id: `comp-${Date.now()}`,
      metadata: {
        createdAt: new Date(),
        usageCount: 0,
        tags: []
      }
    };
    setComponents(prev => [...prev, newComponent]);
  }, []);

  const handleInsertComponent = useCallback((component: ReusableComponent) => {
    if (activeSection) {
      // Call the insertion method for the active section
      const insertMethod = (window as any)[`insertIntoSection_${activeSection.id}`];
      if (insertMethod) {
        insertMethod(
          component.id,
          component.type,
          component.title,
          component.content,
          component.settings
        );
      } else {
        console.warn('No active section editor found for insertion');
      }
    } else {
      console.warn('No active section selected for component insertion');
    }
  }, [activeSection]);

  const handleEditComponent = useCallback((id: string, updates: Partial<ReusableComponent>) => {
    setComponents(prev => prev.map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  }, []);

  const handleDeleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
  }, []);

  const handleDuplicateComponent = useCallback((component: ReusableComponent) => {
    const duplicated: ReusableComponent = {
      ...component,
      id: `comp-${Date.now()}`,
      title: `${component.title} (Copy)`,
      metadata: {
        ...component.metadata,
        createdAt: new Date(),
        usageCount: 0
      }
    };
    setComponents(prev => [...prev, duplicated]);
  }, []);

  return (
    <div className="w-full flex gap-6 min-h-[calc(100vh-200px)]">
      {/* Sidebar for page and section management */}
      <div className="w-80 flex-shrink-0">
        <PageSectionManager
          pages={pages}
          activeSection={activeSection}
          onPagesChange={handlePagesChange}
          onSectionSelect={handleSectionSelect}
        />
      </div>

      {/* Main editor area */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Simple toolbar */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeSection ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>
                      {pages.find(p => p.sections.some(s => s.id === activeSection.id))?.title || 'Page'}
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-primary font-medium">{activeSection.title}</span>
                  </div>
                  <div className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md border">
                    Editing
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-muted-foreground">
                    Select a section to edit
                  </h2>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
              >
                <Users className="w-4 h-4 mr-1" />
                Share
              </Button>
              {onSave && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Section editors */}
        {allSections.map((section) => (
          <SectionEditor
            key={section.id}
            section={section}
            onContentChange={handleSectionContentChange}
            isReadOnly={isReadOnly}
            isVisible={activeSection?.id === section.id}
            onInsertComponent={(componentId, componentType, componentTitle, componentContent, componentSettings) => {
              // This is handled through the window method approach
            }}
          />
        ))}

        {pages.length === 0 ? (
          <Card className="flex-1 min-h-[500px] flex items-center justify-center border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
            <div className="text-center max-w-lg p-8">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">
                  Welcome to your new rulebook
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Create your first page to start organizing your game rules. Pages help structure your content and can contain multiple sections for different topics.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-muted/30 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">1</span>
                    Create your first page
                  </h4>
                  <p className="text-sm text-muted-foreground">Click "Add Page" in the sidebar to create a new page for your rulebook.</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">2</span>
                    Add sections to organize content
                  </h4>
                  <p className="text-sm text-muted-foreground">Break your page into logical sections like "Game Overview" or "Setup Instructions".</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">3</span>
                    Start writing and formatting
                  </h4>
                  <p className="text-sm text-muted-foreground">Use the rich text editor with keyboard shortcuts like Ctrl+B for bold or ? for help.</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground/80 bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium text-blue-900 mb-2">💡 Pro tip:</p>
                <p className="text-blue-800">Common page types include: Game Overview, Components, Setup, Gameplay Rules, Victory Conditions, and Reference.</p>
              </div>
            </div>
          </Card>
        ) : !activeSection ? (
          <Card className="flex-1 min-h-[500px] flex items-center justify-center border-0 shadow-none bg-muted/5">
            <div className="text-center max-w-lg p-8">
              <div className="mb-6">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-foreground/80 mb-3 tracking-tight">
                  Ready to start writing
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Choose a section from the sidebar to begin crafting your rulebook content. Each section focuses on a specific aspect of your game.
                </p>
              </div>

              <div className="bg-muted/20 rounded-lg p-4 text-left">
                <h4 className="font-medium text-sm mb-2 text-foreground">Available sections:</h4>
                <div className="space-y-1">
                  {pages.map(page => page.sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section)}
                      className="w-full text-left px-2 py-1 text-sm rounded hover:bg-muted/50 transition-colors flex items-center gap-2"
                    >
                      <Layers className="h-3 w-3 text-green-600" />
                      <span>{page.title}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-muted-foreground">{section.title}</span>
                    </button>
                  )))}
                </div>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      {/* Component Library Panel */}
      <div className="w-80 flex-shrink-0">
        <ComponentLibrary
          components={components}
          onCreateComponent={handleCreateComponent}
          onInsertComponent={handleInsertComponent}
          onEditComponent={handleEditComponent}
          onDeleteComponent={handleDeleteComponent}
          onDuplicateComponent={handleDuplicateComponent}
        />
      </div>
    </div>
  );
}
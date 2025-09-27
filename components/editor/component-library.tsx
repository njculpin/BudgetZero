'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ReusableComponent,
  ReusableComponentDisplay,
  CreateComponentDialog
} from './reusable-component';
import {
  Plus,
  Search,
  Filter,
  Bookmark,
  Clock,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComponentLibraryProps {
  components: ReusableComponent[];
  onCreateComponent: (component: Omit<ReusableComponent, 'id' | 'metadata'>) => void;
  onInsertComponent: (component: ReusableComponent) => void;
  onEditComponent: (id: string, updates: Partial<ReusableComponent>) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (component: ReusableComponent) => void;
}

export function ComponentLibrary({
  components,
  onCreateComponent,
  onInsertComponent,
  onEditComponent,
  onDeleteComponent,
  onDuplicateComponent,
}: ComponentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Filter components based on search only
  const filteredComponents = components.filter(component => {
    const matchesSearch = component.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         component.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         component.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  // Get recently used components (sorted by usage count)
  const recentComponents = filteredComponents
    .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
    .slice(0, 5);

  const handleCreateComponent = (componentData: Omit<ReusableComponent, 'id' | 'metadata'>) => {
    onCreateComponent(componentData);
  };

  const handleInsertComponent = (component: ReusableComponent) => {
    // Increment usage count
    onEditComponent(component.id, {
      metadata: {
        ...component.metadata,
        usageCount: component.metadata.usageCount + 1
      }
    });
    onInsertComponent(component);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Component Library</CardTitle>
          <CreateComponentDialog
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            }
            onCreateComponent={handleCreateComponent}
          />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Separator />
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <ComponentGrid
          components={filteredComponents}
          selectedComponent={selectedComponent}
          onSelectComponent={setSelectedComponent}
          onInsertComponent={handleInsertComponent}
          onEditComponent={onEditComponent}
          onDeleteComponent={onDeleteComponent}
          onDuplicateComponent={onDuplicateComponent}
        />

        {/* Recently Used Section */}
        {recentComponents.length > 0 && components.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recently Used
            </h3>
            <div className="space-y-2">
              {recentComponents.slice(0, 3).map(component => (
                <div
                  key={component.id}
                  className="p-2 bg-muted/30 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleInsertComponent(component)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{component.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {component.metadata.usageCount}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ComponentGridProps {
  components: ReusableComponent[];
  selectedComponent: string | null;
  onSelectComponent: (id: string | null) => void;
  onInsertComponent: (component: ReusableComponent) => void;
  onEditComponent: (id: string, updates: Partial<ReusableComponent>) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (component: ReusableComponent) => void;
}

function ComponentGrid({
  components,
  selectedComponent,
  onSelectComponent,
  onInsertComponent,
  onEditComponent,
  onDeleteComponent,
  onDuplicateComponent,
}: ComponentGridProps) {
  if (components.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Hash className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <h3 className="font-medium text-foreground mb-2">No components yet</h3>
        <p className="text-sm mb-4">Create reusable components to speed up your writing</p>
        <div className="space-y-2 text-xs text-left bg-muted/30 p-3 rounded-md">
          <p><span className="font-medium">Examples:</span></p>
          <p>• Reminder boxes for important rules</p>
          <p>• Game mechanic explanations</p>
          <p>• Setup instructions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {components.map(component => (
        <div key={component.id} className="relative group">
          <ReusableComponentDisplay
            component={component}
            isSelected={selectedComponent === component.id}
            onSelect={() => onSelectComponent(
              selectedComponent === component.id ? null : component.id
            )}
            onEdit={() => {
              // TODO: Implement edit dialog
              console.log('Edit component:', component.id);
            }}
            onDuplicate={() => onDuplicateComponent(component)}
            onDelete={() => onDeleteComponent(component.id)}
          />

          {/* Insert Button */}
          <Button
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onInsertComponent(component);
            }}
          >
            Insert
          </Button>
        </div>
      ))}
    </div>
  );
}
'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Settings, Trash2, Move } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface GridLayoutNodeViewProps {
  node: {
    attrs: {
      columns: number;
      rows: number;
      gap: string;
      items: Array<{
        id: string;
        type: 'text' | 'component';
        content: any;
        position: { col: number; row: number; colspan?: number; rowspan?: number };
      }>;
    };
  };
  deleteNode: () => void;
  selected: boolean;
  updateAttributes: (attributes: any) => void;
}

export function GridLayoutNodeView({ node, deleteNode, selected, updateAttributes }: GridLayoutNodeViewProps) {
  const { columns, rows, gap, items } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);

  // Create grid template
  const gridCols = `repeat(${columns}, minmax(0, 1fr))`;
  const gridRows = rows ? `repeat(${rows}, minmax(100px, auto))` : 'auto';

  // Generate grid cells
  const totalCells = columns * (rows || 1);
  const gridCells = Array.from({ length: totalCells }, (_, index) => {
    const col = (index % columns) + 1;
    const row = Math.floor(index / columns) + 1;
    return { col, row, index };
  });

  // Find item for each cell
  const getItemForCell = (col: number, row: number) => {
    return items.find(item =>
      item.position.col === col && item.position.row === row
    );
  };

  const addTextBox = (col: number, row: number) => {
    const newItem = {
      id: `item-${Date.now()}`,
      type: 'text' as const,
      content: { type: 'paragraph', content: [{ type: 'text', text: 'Click to edit text...' }] },
      position: { col, row }
    };

    updateAttributes({
      items: [...items, newItem]
    });
  };

  const removeItem = (itemId: string) => {
    updateAttributes({
      items: items.filter(item => item.id !== itemId)
    });
  };

  const updateItemContent = (itemId: string, content: any) => {
    updateAttributes({
      items: items.map(item =>
        item.id === itemId ? { ...item, content } : item
      )
    });
  };

  return (
    <NodeViewWrapper className="my-4">
      <Card className={cn(
        'relative p-4 transition-all duration-200',
        selected && 'ring-2 ring-primary/20',
        'hover:shadow-sm'
      )}>
        {/* Grid Controls */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Grid Layout ({columns}×{rows || 'auto'})</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteNode}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Grid Settings */}
        {isEditing && (
          <div className="mb-4 p-3 bg-muted/30 rounded-md">
            <div className="flex items-center gap-4">
              <label className="text-sm">
                Columns:
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={columns}
                  onChange={(e) => updateAttributes({ columns: parseInt(e.target.value) || 2 })}
                  className="ml-2 w-16 px-2 py-1 border rounded text-sm"
                />
              </label>
              <label className="text-sm">
                Rows:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rows || 1}
                  onChange={(e) => updateAttributes({ rows: parseInt(e.target.value) || 1 })}
                  className="ml-2 w-16 px-2 py-1 border rounded text-sm"
                />
              </label>
            </div>
          </div>
        )}

        {/* Grid Display */}
        <div
          className="grid gap-2 min-h-[200px]"
          style={{
            gridTemplateColumns: gridCols,
            gridTemplateRows: gridRows,
            gap: gap || '0.5rem'
          }}
        >
          {gridCells.map(({ col, row, index }) => {
            const item = getItemForCell(col, row);

            return (
              <div
                key={index}
                className={cn(
                  'border-2 border-dashed border-muted-foreground/20 rounded-md p-3 min-h-[100px] flex items-center justify-center transition-all duration-200',
                  'hover:border-muted-foreground/40 hover:bg-muted/10',
                  item && 'border-solid border-muted-foreground/60 bg-background'
                )}
                style={{
                  gridColumn: item?.position.colspan ? `span ${item.position.colspan}` : 'span 1',
                  gridRow: item?.position.rowspan ? `span ${item.position.rowspan}` : 'span 1'
                }}
              >
                {item ? (
                  <div className="w-full h-full relative group">
                    {/* Item Content */}
                    <div className="w-full h-full">
                      {item.type === 'text' ? (
                        <div className="text-sm p-2">
                          {typeof item.content === 'string' ? item.content : 'Text content'}
                        </div>
                      ) : (
                        <div className="text-sm p-2 bg-blue-50/50 rounded border-l-4 border-blue-400">
                          Component: {item.content?.title || 'Untitled'}
                        </div>
                      )}
                    </div>

                    {/* Item Controls */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addTextBox(col, row)}
                    className="flex flex-col items-center gap-1 h-full w-full text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-xs">Add Text</span>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid Info */}
        <div className="mt-3 pt-2 border-t border-muted/20 text-xs text-muted-foreground">
          Grid Layout • {items.length} items • Click empty cells to add content
        </div>
      </Card>
    </NodeViewWrapper>
  );
}
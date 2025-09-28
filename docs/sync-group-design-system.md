# Sync Group Design System

## Overview

The sync group identification system provides a comprehensive solution for visually distinguishing and managing synchronized content blocks in the collaborative editor. This system follows Atlassian Design System principles and provides multiple identification methods for optimal user experience.

## Design Principles

### 1. **Multi-Modal Identification**
- **Color-coded visual indicators** for quick group recognition
- **Human-readable group IDs** for clear identification
- **Position indicators** for context within large groups
- **Interactive navigation** for seamless movement between synced blocks

### 2. **Consistent Visual Language**
- Uses chart color palette from design system for consistency
- Maintains accessibility with proper contrast ratios
- Supports both light and dark themes automatically
- Progressive disclosure of information (basic → detailed on interaction)

### 3. **Scalable Information Architecture**
- Graceful handling from single blocks to large sync groups
- Context-aware UI that adapts to group size
- Efficient navigation patterns for productivity

## Visual Components

### Color System

The system uses 5 distinct colors from the design token palette:

```css
--color-chart-1: oklch(0.646 0.222 41.116) /* Orange-ish */
--color-chart-2: oklch(0.6 0.118 184.704)   /* Teal-ish */
--color-chart-3: oklch(0.398 0.07 227.392)  /* Blue-ish */
--color-chart-4: oklch(0.828 0.189 84.429)  /* Yellow-green */
--color-chart-5: oklch(0.769 0.188 70.08)   /* Yellow */
```

Colors are assigned deterministically based on syncId hash to ensure consistency across sessions and users.

### Component Anatomy

#### 1. **Container Styling**
- **Left border accent**: 4px solid border using group color
- **Background tint**: Subtle background using group color at 5% opacity
- **Border style**: Dashed border to differentiate from regular content
- **Hover states**: Enhanced shadow and color intensity on hover

#### 2. **Header Section**
- **Group indicator icon**: Link2 icon in group color
- **Primary badge**: Shows shortened sync ID with hash icon
- **Position badge**: Shows current position in group (e.g., "2/5") when multiple instances exist
- **Last updated**: Timestamp of last synchronization

#### 3. **Action Controls** (on hover)
- **Navigation arrows**: Previous/next buttons for multi-instance groups
- **Copy reference**: Quick duplication action
- **More options menu**: Comprehensive action menu

#### 4. **Footer Information**
- **Group ID**: Styled code element showing shortened sync ID
- **Instance count**: Number of synced blocks when multiple exist
- **Interaction hint**: Subtle guidance text

### Accessibility Features

#### Screen Reader Support
- **Region roles**: Sync blocks are marked as regions for navigation
- **Descriptive labels**: "Synced content group abc1-2de3, 3 instances total"
- **State announcements**: Navigation and actions are properly announced

#### Keyboard Navigation
- **Focus management**: Proper focus trapping and restoration
- **Tab order**: Logical navigation through controls
- **Keyboard shortcuts**: Support for quick navigation (planned)

#### Visual Accessibility
- **High contrast**: All color combinations meet WCAG AA standards
- **Color independence**: Information is conveyed through multiple channels (color + text + icons)
- **Reduced motion**: Respects user preferences for animations

## Implementation Patterns

### Basic Usage

```tsx
// Get sync group styling
const syncGroupStyles = getSyncGroupStyles(syncId);
const syncGroupId = getSyncGroupId(syncId);

// Apply to container
<div className={`${syncGroupStyles.borderClass} ${syncGroupStyles.backgroundClass}`}>
  <Badge className={syncGroupStyles.badgeClass}>
    <Hash className="w-3 h-3 mr-1" />
    {syncGroupId}
  </Badge>
</div>
```

### Advanced Integration

```tsx
// Get complete sync group information
const syncGroupInfo = getSyncGroupInfo(syncId, editor);
const navigation = getSyncGroupNavigation(syncId, currentPos, editor);

// Conditional rendering based on group size
{syncGroupInfo.totalInstances > 1 && (
  <NavigationControls navigation={navigation} />
)}
```

## User Experience Patterns

### 1. **Group Recognition**
- **At-a-glance identification**: Users can immediately identify which blocks belong together through color coding
- **Consistent visual language**: Same color = same sync group across the entire document
- **Scalable distinction**: System supports many sync groups without visual confusion

### 2. **Group Navigation**
- **Contextual navigation**: Navigation controls only appear when relevant (multiple instances)
- **Position awareness**: Users always know where they are within a sync group
- **Efficient movement**: One-click navigation to other instances

### 3. **Information Hierarchy**
- **Progressive disclosure**: Basic information always visible, detailed info on interaction
- **Contextual actions**: Relevant actions surface based on group state
- **Clear relationships**: Visual connections make sync relationships obvious

## Interaction Patterns

### Hover States
- **Enhanced visibility**: Subtle color intensification
- **Action revelation**: Navigation and management controls appear
- **Context hints**: Tooltips provide additional information

### Click/Touch Interactions
- **Primary actions**: Quick access to common tasks (copy, navigate)
- **Secondary actions**: Comprehensive menu for advanced operations
- **Safety patterns**: Destructive actions require confirmation

### Group Highlights (Future Enhancement)
- **Related highlighting**: When hovering one block, subtle highlight on all related blocks
- **Visual connections**: Temporary connection lines between related blocks
- **Document overview**: Minimap showing sync group distribution

## Technical Implementation

### Color Assignment Algorithm
```typescript
// Deterministic hash-based color assignment
function getSyncGroupColor(syncId: string) {
  const hash = hashString(syncId);
  const colorIndex = hash % SYNC_GROUP_COLORS.length;
  return SYNC_GROUP_COLORS[colorIndex];
}
```

### Performance Considerations
- **Memoized calculations**: Color and style calculations are cached
- **Efficient traversal**: Document traversal is optimized for large documents
- **Lazy loading**: Complex calculations only happen when needed

### Theme Support
- **CSS Custom Properties**: Colors adapt automatically to theme changes
- **Color mixing**: Dynamic alpha blending for consistent appearance
- **System compatibility**: Works with both light and dark themes

## Future Enhancements

### Phase 1: Enhanced Visual Connections
- **Subtle connection lines**: Visual threads between related blocks
- **Group highlighting**: Highlight all instances when interacting with one
- **Document overview**: Minimap showing sync group distribution

### Phase 2: Advanced Navigation
- **Keyboard shortcuts**: Quick navigation between sync groups
- **Search integration**: Find and navigate to specific sync groups
- **Bookmark system**: Save frequently accessed sync groups

### Phase 3: User Customization
- **Custom group names**: User-defined names for sync groups
- **Color preferences**: User or project-specific color schemes
- **Visibility controls**: Show/hide sync group indicators

## Guidelines for Contributors

### Design Consistency
1. **Always use utility functions** for color and style generation
2. **Maintain semantic markup** for accessibility
3. **Follow progressive disclosure** patterns for information hierarchy
4. **Test with multiple themes** to ensure compatibility

### Code Standards
1. **Use TypeScript interfaces** for all sync group data structures
2. **Implement proper error handling** for edge cases
3. **Write comprehensive tests** for utility functions
4. **Document accessibility features** in code comments

### Testing Requirements
1. **Accessibility testing**: Verify screen reader compatibility
2. **Color contrast validation**: Ensure WCAG compliance
3. **Cross-browser testing**: Verify appearance across browsers
4. **Performance testing**: Monitor impact on large documents

## Migration Notes

### Breaking Changes
- **Removed generic "Synced Block" badge**: Replaced with meaningful group identification
- **Updated CSS classes**: New color-based styling system
- **Enhanced accessibility**: Additional ARIA attributes and roles

### Backwards Compatibility
- **Graceful degradation**: System works with existing sync blocks
- **Progressive enhancement**: New features layer on top of existing functionality
- **Migration path**: Existing implementations continue to work during transition
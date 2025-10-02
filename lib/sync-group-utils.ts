/**
 * Utilities for sync group identification and visual styling
 * Following Atlassian Design System principles for consistency and accessibility
 */

// Chart colors from the design system (from globals.css)
const SYNC_GROUP_COLORS = [
  {
    name: "chart-1",
    light: "oklch(0.646 0.222 41.116)", // Orange-ish
    dark: "oklch(0.488 0.243 264.376)", // Purple-ish
    css: "chart-1",
  },
  {
    name: "chart-2",
    light: "oklch(0.6 0.118 184.704)", // Teal-ish
    dark: "oklch(0.696 0.17 162.48)", // Green-ish
    css: "chart-2",
  },
  {
    name: "chart-3",
    light: "oklch(0.398 0.07 227.392)", // Blue-ish
    dark: "oklch(0.769 0.188 70.08)", // Yellow-ish
    css: "chart-3",
  },
  {
    name: "chart-4",
    light: "oklch(0.828 0.189 84.429)", // Yellow-green
    dark: "oklch(0.627 0.265 303.9)", // Pink-ish
    css: "chart-4",
  },
  {
    name: "chart-5",
    light: "oklch(0.769 0.188 70.08)", // Yellow
    dark: "oklch(0.645 0.246 16.439)", // Red-orange
    css: "chart-5",
  },
] as const;

/**
 * Generate a deterministic hash from a string
 * Uses a simple hash function for consistent color assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get color assignment for a sync group based on syncId
 * Returns consistent color for the same syncId across sessions
 */
export function getSyncGroupColor(syncId: string) {
  const hash = hashString(syncId);
  const colorIndex = hash % SYNC_GROUP_COLORS.length;
  return SYNC_GROUP_COLORS[colorIndex];
}

/**
 * Generate human-readable sync group identifier
 * Creates a shortened, more readable version of the syncId
 */
export function getSyncGroupId(syncId: string): string {
  // Take first 8 characters for readability
  const shortId = syncId.slice(0, 8);

  // Format with dashes for better readability: "abc1-2de3"
  if (shortId.length >= 8) {
    return `${shortId.slice(0, 4)}-${shortId.slice(4, 8)}`;
  }

  return shortId;
}

/**
 * Generate Tailwind CSS classes for sync group styling
 * Provides consistent styling across light and dark themes
 */
export function getSyncGroupStyles(syncId: string) {
  const color = getSyncGroupColor(syncId);

  return {
    // Border accent using CSS variable for theme support
    borderClass: `border-l-4 border-l-${color.css}`,

    // Background tint - very subtle
    backgroundClass: `bg-${color.css}/5`,

    // Text color for identifiers
    textClass: `text-${color.css}`,

    // Badge styling with group color
    badgeClass: `bg-${color.css}/10 text-${color.css} border-${color.css}/20`,

    // Hover effects
    hoverClass: `hover:bg-${color.css}/10 hover:border-${color.css}/40`,

    // Focus ring using group color
    focusClass: `focus-within:ring-2 focus-within:ring-${color.css}/50`,

    // CSS custom properties for more complex styling
    customProperties: {
      "--sync-group-color": `var(--color-${color.css})`,
      "--sync-group-color-alpha-10": `color-mix(in oklch, var(--color-${color.css}), transparent 90%)`,
      "--sync-group-color-alpha-20": `color-mix(in oklch, var(--color-${color.css}), transparent 80%)`,
    },
  };
}

/**
 * Get sync group count and position information
 * Helps users understand the scope of sync groups in the document
 */
export function getSyncGroupInfo(syncId: string, editor: any) {
  const instances: Array<{ pos: number; node: any }> = [];

  // Traverse document to find all instances
  editor.state.doc.descendants((node: any, pos: number) => {
    if (node.type.name === "syncedBlock" && node.attrs.syncId === syncId) {
      instances.push({ pos, node });
    }
  });

  return {
    totalInstances: instances.length,
    instances,
    // Determine if this is a large group (affects UI decisions)
    isLargeGroup: instances.length > 5,
  };
}

/**
 * Generate accessible description for sync groups
 * Provides screen reader friendly descriptions
 */
export function getSyncGroupA11yDescription(
  syncId: string,
  totalInstances: number,
): string {
  const groupId = getSyncGroupId(syncId);
  return `Synced content group ${groupId}, ${totalInstances} instance${totalInstances === 1 ? "" : "s"} total`;
}

/**
 * Get navigation helpers for sync groups
 * Provides data needed for "jump to next/previous" functionality
 */
export function getSyncGroupNavigation(
  syncId: string,
  currentPos: number,
  editor: any,
) {
  const { instances } = getSyncGroupInfo(syncId, editor);

  // Sort by position
  const sortedInstances = instances.sort((a, b) => a.pos - b.pos);

  // Find current instance index
  const currentIndex = sortedInstances.findIndex(
    (instance) => Math.abs(instance.pos - currentPos) < 10, // Allow for small position differences
  );

  if (currentIndex === -1) return null;

  const nextIndex = (currentIndex + 1) % sortedInstances.length;
  const prevIndex =
    currentIndex === 0 ? sortedInstances.length - 1 : currentIndex - 1;

  return {
    current: sortedInstances[currentIndex],
    next: sortedInstances[nextIndex],
    previous: sortedInstances[prevIndex],
    currentIndex: currentIndex + 1, // 1-based for display
    totalInstances: sortedInstances.length,
  };
}

/**
 * Generate tooltip content for sync groups
 * Provides rich information on hover
 */
export function getSyncGroupTooltipContent(syncId: string, editor: any) {
  const { totalInstances } = getSyncGroupInfo(syncId, editor);
  const groupId = getSyncGroupId(syncId);

  return {
    title: `Sync Group ${groupId}`,
    description: `${totalInstances} synced instance${totalInstances === 1 ? "" : "s"}`,
    hint: "Click actions menu for more options",
  };
}

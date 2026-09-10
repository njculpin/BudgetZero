/**
 * Formatting a byte count for display.
 *
 * There were three implementations of this and one inline
 * `(bytes / 1024 / 1024).toFixed(2)`. They disagreed visibly: one wrote `B`
 * and another `Bytes`; one gave one decimal place and another two; the inline
 * one showed every file in megabytes, so a 2 KB rulebook read `0.00 MB`.
 */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * @example formatFileSize(0)        // "0 B"
 * @example formatFileSize(900)      // "900 B"
 * @example formatFileSize(2048)     // "2 KB"
 * @example formatFileSize(1536)     // "1.5 KB"
 * @example formatFileSize(10485760) // "10 MB"
 */
export function formatFileSize(bytes: number): string {
  // A negative or non-finite size means an upstream value went wrong. Rendering
  // "NaN MB" next to a download button is worse than saying nothing certain.
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${Math.round(bytes)} B`;

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);

  // One decimal place, but not a trailing ".0": "2 KB" reads better than
  // "2.0 KB", and the extra digit only matters below about ten units.
  const rounded = Math.round(value * 10) / 10;

  return `${rounded} ${UNITS[exponent]}`;
}

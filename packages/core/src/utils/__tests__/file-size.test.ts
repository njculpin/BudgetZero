import { describe, it, expect } from 'vitest';
import { formatFileSize } from '../file-size';

describe('formatFileSize', () => {
  it('shows bytes below a kilobyte', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1)).toBe('1 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('switches unit at each power of 1024', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('keeps one decimal place only when it says something', () => {
    // "2.0 KB" is noise; "1.5 KB" is not.
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('does not render a small file in megabytes', () => {
    // The checkout page used `(bytes / 1024 / 1024).toFixed(2)`, so every
    // rulebook under 5 KB displayed as "0.00 MB".
    expect(formatFileSize(2000)).not.toContain('MB');
    expect(formatFileSize(2000)).toBe('2 KB');
  });

  it('caps at terabytes rather than inventing a unit', () => {
    expect(formatFileSize(1024 ** 5)).toContain('TB');
  });

  it('says nothing certain for a value that cannot be a size', () => {
    // Rendering "NaN MB" beside a download button is worse than a dash.
    expect(formatFileSize(Number.NaN)).toBe('—');
    expect(formatFileSize(-1)).toBe('—');
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

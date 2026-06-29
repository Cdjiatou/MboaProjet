/**
 * @file relativeTime.test.ts
 * @description Unit tests for the formatRelativeTime utility function
 * 
 * Validates: Requirement 4.3 - Format timestamps as "Il y a X min/h" relative time
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime } from './relativeTime';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "À l\'instant" for timestamps less than 1 minute ago', () => {
    const timestamp = new Date('2025-01-01T11:59:30Z');
    expect(formatRelativeTime(timestamp)).toBe("À l'instant");
  });

  it('should return "Il y a X min" for timestamps in minutes', () => {
    const timestamp = new Date('2025-01-01T11:58:00Z');
    expect(formatRelativeTime(timestamp)).toBe('Il y a 2 min');
  });

  it('should return "Il y a X h" for timestamps in hours', () => {
    const timestamp = new Date('2025-01-01T09:00:00Z');
    expect(formatRelativeTime(timestamp)).toBe('Il y a 3 h');
  });

  it('should return "Il y a X j" for timestamps in days', () => {
    const timestamp = new Date('2024-12-30T12:00:00Z');
    expect(formatRelativeTime(timestamp)).toBe('Il y a 2 j');
  });

  it('should return "Il y a X sem" for timestamps in weeks', () => {
    const timestamp = new Date('2024-12-18T12:00:00Z');
    expect(formatRelativeTime(timestamp)).toBe('Il y a 2 sem');
  });

  it('should return "Il y a X mois" for timestamps in months', () => {
    const timestamp = new Date('2024-09-01T12:00:00Z');
    expect(formatRelativeTime(timestamp)).toBe('Il y a 4 mois');
  });

  it('should return "Il y a X an(s)" for timestamps in years', () => {
    const timestamp = new Date('2023-01-01T12:00:00Z');
    expect(formatRelativeTime(timestamp)).toBe('Il y a 2 ans');
  });

  it('should return "Il y a 1 an" (singular) for exactly 1 year', () => {
    const timestamp = new Date('2024-01-01T12:00:00Z');
    expect(formatRelativeTime(timestamp)).toBe('Il y a 1 an');
  });

  it('should handle string timestamps', () => {
    const timestamp = '2025-01-01T11:58:00Z';
    expect(formatRelativeTime(timestamp)).toBe('Il y a 2 min');
  });

  it('should handle number timestamps (milliseconds)', () => {
    const timestamp = new Date('2025-01-01T11:58:00Z').getTime();
    expect(formatRelativeTime(timestamp)).toBe('Il y a 2 min');
  });

  it('should return "À l\'instant" for future timestamps', () => {
    const timestamp = new Date('2025-01-01T13:00:00Z');
    expect(formatRelativeTime(timestamp)).toBe("À l'instant");
  });

  it('should handle invalid timestamps', () => {
    expect(formatRelativeTime('invalid')).toBe("À l'instant");
  });
});

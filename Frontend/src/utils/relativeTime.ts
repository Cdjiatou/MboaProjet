/**
 * @file relativeTime.ts
 * @description Utility function for formatting timestamps as relative time in French.
 * 
 * Implements Requirement 4.3: Format timestamps as "Il y a X min/h" relative time
 */

/**
 * Formats a timestamp as relative time in French.
 * 
 * @param timestamp - The timestamp to format (Date, string, or number)
 * @returns The relative time string in French (e.g., "Il y a 2 min", "Il y a 3 h")
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 2 * 60 * 1000)) // → "Il y a 2 min"
 * formatRelativeTime(new Date(Date.now() - 3 * 60 * 60 * 1000)) // → "Il y a 3 h"
 * formatRelativeTime(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // → "Il y a 2 j"
 */
export const formatRelativeTime = (timestamp: Date | string | number): string => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  // If future timestamp or invalid, return "À l'instant"
  if (diffMs < 0 || isNaN(diffMs)) {
    return "À l'instant";
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  // Less than 1 minute
  if (diffMinutes < 1) {
    return "À l'instant";
  }

  // Less than 1 hour
  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  // Less than 7 days
  if (diffDays < 7) {
    return `Il y a ${diffDays} j`;
  }

  // Less than 4 weeks
  if (diffWeeks < 4) {
    return `Il y a ${diffWeeks} sem`;
  }

  // Less than 12 months
  if (diffMonths < 12) {
    return `Il y a ${diffMonths} mois`;
  }

  // More than a year
  const years = Math.floor(diffMonths / 12);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
};

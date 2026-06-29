/**
 * @file maskIdentifier.ts
 * @description Utility function for masking voter identifiers for privacy in the frontend.
 * 
 * This function preserves the first 3 and last 3 characters of an identifier
 * while replacing all middle characters with asterisks (***).
 * 
 * Implements Requirement 4.2: Mask voter identifiers by keeping only the first 3 and last 3 characters
 */

/**
 * Masks a voter identifier for privacy.
 * 
 * @param identifier - The voter identifier to mask (e.g., phone number)
 * @returns The masked identifier with first3 + *** + last3 pattern
 * 
 * @example
 * maskVoterIdentifier("237691234567") // → "237***567"
 * maskVoterIdentifier("+237691234567") // → "+23***567"
 * maskVoterIdentifier("12345") // → "12345" (too short, returned as-is)
 */
export const maskVoterIdentifier = (identifier: string): string => {
  // Handle edge case: if identifier is too short (< 6 characters),
  // return it as-is since we can't preserve first3 + last3
  if (!identifier || identifier.length < 6) {
    return identifier;
  }

  // Extract first 3 characters
  const first3 = identifier.substring(0, 3);
  
  // Extract last 3 characters
  const last3 = identifier.substring(identifier.length - 3);
  
  // Return masked format: first3 + "***" + last3
  return `${first3}***${last3}`;
};

/**
 * @file maskIdentifier.test.ts
 * @description Unit tests for the maskVoterIdentifier utility function
 * 
 * Validates: Requirement 4.2 - Mask voter identifiers by keeping only the first 3 and last 3 characters
 */

import { describe, it, expect } from 'vitest';
import { maskVoterIdentifier } from './maskIdentifier';

describe('maskVoterIdentifier', () => {
  it('should mask a valid phone number with first3 + *** + last3', () => {
    const result = maskVoterIdentifier('237691234567');
    expect(result).toBe('237***567');
  });

  it('should mask a phone number with country code', () => {
    const result = maskVoterIdentifier('+237691234567');
    expect(result).toBe('+23***567');
  });

  it('should handle identifiers exactly 6 characters long', () => {
    const result = maskVoterIdentifier('123456');
    expect(result).toBe('123***456');
  });

  it('should return short identifiers as-is (less than 6 chars)', () => {
    const result = maskVoterIdentifier('12345');
    expect(result).toBe('12345');
  });

  it('should handle empty string', () => {
    const result = maskVoterIdentifier('');
    expect(result).toBe('');
  });

  it('should handle very long identifiers', () => {
    const result = maskVoterIdentifier('1234567890123456789');
    expect(result).toBe('123***789');
  });

  it('should handle identifiers with special characters', () => {
    const result = maskVoterIdentifier('+1-234-567-890');
    expect(result).toBe('+1-***890');
  });
});

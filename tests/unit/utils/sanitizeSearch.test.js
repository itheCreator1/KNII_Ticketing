/**
 * Unit Tests for Search Input Sanitization
 *
 * Tests the sanitizeSearchInput utility function to ensure proper escaping
 * of SQL ILIKE wildcard characters to prevent ReDoS attacks.
 */

const { sanitizeSearchInput } = require('../../../utils/sanitizeSearch');

describe('sanitizeSearchInput', () => {
  describe('Wildcard Character Escaping', () => {
    it('should escape percent sign (%) wildcard', () => {
      const input = 'test%value';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('test\\%value');
    });

    it('should escape underscore (_) wildcard', () => {
      const input = 'test_value';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('test\\_value');
    });

    it('should escape backslash (\\) escape character', () => {
      const input = 'test\\value';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('test\\\\value');
    });

    it('should escape multiple wildcards in single string', () => {
      const input = 'test%_value\\more';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('test\\%\\_value\\\\more');
    });

    it('should escape consecutive wildcards', () => {
      const input = '%%__\\\\';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('\\%\\%\\_\\_\\\\\\\\');
    });
  });

  describe('ReDoS Attack Prevention', () => {
    it('should safely handle potential ReDoS patterns with percent signs', () => {
      const maliciousInput = '%'.repeat(1000); // 1000 percent signs
      const result = sanitizeSearchInput(maliciousInput);
      expect(result).toBe('\\%'.repeat(1000));
      expect(result.length).toBe(2000); // Each % becomes \%
    });

    it('should safely handle potential ReDoS patterns with underscores', () => {
      const maliciousInput = '_'.repeat(1000); // 1000 underscores
      const result = sanitizeSearchInput(maliciousInput);
      expect(result).toBe('\\_'.repeat(1000));
    });

    it('should safely handle mixed wildcard spam', () => {
      const maliciousInput = '%_%_'.repeat(100);
      const result = sanitizeSearchInput(maliciousInput);
      expect(result).toContain('\\%');
      expect(result).toContain('\\_');
    });
  });

  describe('Normal Input Handling', () => {
    it('should not modify alphanumeric characters', () => {
      const input = 'ticket123';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('ticket123');
    });

    it('should not modify special characters except wildcards', () => {
      const input = 'test@email.com';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('test@email.com');
    });

    it('should preserve spaces', () => {
      const input = 'test value with spaces';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('test value with spaces');
    });

    it('should handle Unicode characters correctly', () => {
      const input = 'δοκιμή τεστ';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('δοκιμή τεστ');
    });

    it('should handle punctuation correctly', () => {
      const input = 'test: value, with; punctuation!';
      const result = sanitizeSearchInput(input);
      expect(result).toBe('test: value, with; punctuation!');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty string for null input', () => {
      const result = sanitizeSearchInput(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = sanitizeSearchInput(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty string', () => {
      const result = sanitizeSearchInput('');
      expect(result).toBe('');
    });

    it('should handle non-string inputs gracefully', () => {
      expect(sanitizeSearchInput(123)).toBe('');
      expect(sanitizeSearchInput({})).toBe('');
      expect(sanitizeSearchInput([])).toBe('');
      expect(sanitizeSearchInput(true)).toBe('');
    });

    it('should handle very long strings efficiently', () => {
      const longString = 'a'.repeat(10000);
      const result = sanitizeSearchInput(longString);
      expect(result).toBe(longString);
      expect(result.length).toBe(10000);
    });

    it('should handle single wildcard character', () => {
      expect(sanitizeSearchInput('%')).toBe('\\%');
      expect(sanitizeSearchInput('_')).toBe('\\_');
      expect(sanitizeSearchInput('\\')).toBe('\\\\');
    });
  });

  describe('Real-World Usage Scenarios', () => {
    it('should sanitize ticket search with wildcard attempt', () => {
      const userInput = 'urgent%'; // User trying to search all urgent tickets
      const result = sanitizeSearchInput(userInput);
      expect(result).toBe('urgent\\%');
      // This ensures literal search for "urgent%" not "urgent*"
    });

    it('should sanitize department search with underscore', () => {
      const userInput = 'IT_Support'; // User searching for IT_Support
      const result = sanitizeSearchInput(userInput);
      expect(result).toBe('IT\\_Support');
      // Ensures exact match, not IT[any char]Support
    });

    it('should handle Windows path-like input', () => {
      const userInput = 'C:\\Program Files\\App';
      const result = sanitizeSearchInput(userInput);
      expect(result).toBe('C:\\\\Program Files\\\\App');
    });

    it('should handle SQL injection attempt disguised as wildcard', () => {
      const userInput = "test' OR '1'='1"; // No wildcards but SQL injection attempt
      const result = sanitizeSearchInput(userInput);
      expect(result).toBe("test' OR '1'='1"); // Unchanged (not our concern, parameterized queries handle this)
    });
  });

  describe('Integration with SQL ILIKE Pattern', () => {
    it('should produce correct pattern when wrapped with %', () => {
      const userInput = 'test';
      const sanitized = sanitizeSearchInput(userInput);
      const sqlPattern = `%${sanitized}%`;
      expect(sqlPattern).toBe('%test%');
    });

    it('should prevent wildcard injection in ILIKE pattern', () => {
      const userInput = 'test%injected'; // User trying to inject wildcard
      const sanitized = sanitizeSearchInput(userInput);
      const sqlPattern = `%${sanitized}%`;
      expect(sqlPattern).toBe('%test\\%injected%');
      // Will match literal "test%injected" not "test[anything]injected"
    });

    it('should handle empty search after sanitization', () => {
      const userInput = '';
      const sanitized = sanitizeSearchInput(userInput);
      const sqlPattern = `%${sanitized}%`;
      expect(sqlPattern).toBe('%%');
      // Will match all records (equivalent to no filter)
    });
  });
});

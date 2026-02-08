import { z } from 'zod';

import { coerceBoolean } from './coerce-boolean';

describe('coerceBoolean', () => {
  describe('valid values', () => {
    const schema = z.object({
      flag: coerceBoolean(true)
    });

    it('should return true for boolean true', () => {
      expect(schema.parse({ flag: true })).toEqual({ flag: true });
    });

    it('should return false for boolean false', () => {
      expect(schema.parse({ flag: false })).toEqual({ flag: false });
    });

    it('should return true for string "true"', () => {
      expect(schema.parse({ flag: 'true' })).toEqual({ flag: true });
    });

    it('should return false for string "false"', () => {
      expect(schema.parse({ flag: 'false' })).toEqual({ flag: false });
    });

    it('should handle upper casing truthy string values', () => {
      expect(() => schema.parse({ flag: 'TRUE' })).toThrow();
      expect(() => schema.parse({ flag: 'True' })).toThrow();
    });

    it('should handle upper casing falsy string values', () => {
      expect(() => schema.parse({ flag: 'FALSE' })).toThrow();
      expect(() => schema.parse({ flag: 'False' })).toThrow();
    });
  });

  describe('fallback to default value', () => {
    const schema = z.object({
      flag: coerceBoolean(false)
    });

    it('should allow empty string', () => {
      expect(schema.parse({ flag: '' })).toEqual({ flag: false });
    });

    it('should allow value with spaces', () => {
      expect(schema.parse({ flag: '  ' })).toEqual({ flag: false });
    });

    it('should allow null', () => {
      expect(schema.parse({ flag: null })).toEqual({ flag: false });
    });

    it('should allow undefined', () => {
      expect(schema.parse({ flag: undefined })).toEqual({ flag: false });
    });

    it('should treat line breaks as whitespace', () => {
      expect(schema.parse({ flag: '\n' })).toEqual({ flag: false });
      expect(schema.parse({ flag: '\r' })).toEqual({ flag: false });
      expect(schema.parse({ flag: '\t' })).toEqual({ flag: false });
    });

    it('should handle both true and false default values', () => {
      const schemaTrue = z.object({
        flag: coerceBoolean(true)
      });
      expect(schemaTrue.parse({ flag: '' })).toEqual({ flag: true });
      expect(schemaTrue.parse({ flag: undefined })).toEqual({
        flag: true
      });

      const schemaFalse = z.object({
        flag: coerceBoolean(false)
      });
      expect(schemaFalse.parse({ flag: '' })).toEqual({ flag: false });
      expect(schemaFalse.parse({ flag: undefined })).toEqual({
        flag: false
      });
    });
  });

  describe('throw for invalid values', () => {
    const schema = z.object({
      flag: coerceBoolean(false)
    });

    it('should not allow numeric values', () => {
      expect(() => schema.parse({ flag: 1 })).toThrow();
      expect(() => schema.parse({ flag: 0 })).toThrow();
    });

    it("should not allow 'yes' or 'no'", () => {
      expect(() => schema.parse({ flag: 'yes' })).toThrow();
      expect(() => schema.parse({ flag: 'no' })).toThrow();
    });

    it('should not allow object values', () => {
      expect(() => schema.parse({ flag: '{}' })).toThrow();
    });

    it('should not allow array values', () => {
      expect(() => schema.parse({ flag: '[]' })).toThrow();
    });
  });
});

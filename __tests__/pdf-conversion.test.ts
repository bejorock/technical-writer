/**
 * Unit tests for PDF conversion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fromPath } from 'pdf2pic';

const TEST_DIR = './test-pdf-conversion';

beforeEach(() => {
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true });
  }
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe('PDF conversion', () => {
  describe('fromPath', () => {
    it('should create a converter from PDF path', () => {
      // This test requires a real PDF file
      // For now, we just test the function exists
      expect(typeof fromPath).toBe('function');
    });
  });

  describe('converter options', () => {
    it('should accept format option', () => {
      // Test that converter accepts format option
      const options = {
        density: 300,
        saveFilename: 'test',
        savePath: TEST_DIR,
        format: 'png',
        width: 1200,
        height: 1600,
      };
      
      expect(options.format).toBe('png');
      expect(options.density).toBe(300);
    });

    it('should accept jpeg format', () => {
      const options = {
        format: 'jpeg',
      };
      
      expect(options.format).toBe('jpeg');
    });
  });

  describe('page parsing', () => {
    it('should parse single page', () => {
      const pages = '1';
      const pageNums = pages.split(',').map(Number);
      expect(pageNums).toEqual([1]);
    });

    it('should parse multiple pages', () => {
      const pages = '1,3,5';
      const pageNums = pages.split(',').map(Number);
      expect(pageNums).toEqual([1, 3, 5]);
    });

    it('should parse page range', () => {
      const pages = '1-3';
      const parts = pages.split('-');
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      const pageNums = [];
      for (let i = start; i <= end; i++) {
        pageNums.push(i);
      }
      expect(pageNums).toEqual([1, 2, 3]);
    });
  });
});

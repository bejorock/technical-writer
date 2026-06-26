/**
 * Unit tests for Image tool operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const TEST_DIR = './test-images';

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

describe('Image operations', () => {
  describe('create test image', () => {
    it('should create a test PNG image', async () => {
      const testImage = join(TEST_DIR, 'test.png');
      
      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toFile(testImage);

      expect(existsSync(testImage)).toBe(true);
    });
  });

  describe('crop image', () => {
    it('should crop an image to specified dimensions', async () => {
      const testImage = join(TEST_DIR, 'test.png');
      const croppedImage = join(TEST_DIR, 'cropped.png');

      // Create test image
      await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toFile(testImage);

      // Crop image
      await sharp(testImage)
        .extract({ left: 50, top: 50, width: 100, height: 100 })
        .toFile(croppedImage);

      expect(existsSync(croppedImage)).toBe(true);

      // Verify dimensions
      const metadata = await sharp(croppedImage).metadata();
      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
    });
  });

  describe('convert format', () => {
    it('should convert PNG to JPEG', async () => {
      const testPng = join(TEST_DIR, 'test.png');
      const testJpeg = join(TEST_DIR, 'test.jpg');

      // Create test PNG
      await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toFile(testPng);

      // Convert to JPEG
      await sharp(testPng)
        .jpeg({ quality: 90 })
        .toFile(testJpeg);

      expect(existsSync(testJpeg)).toBe(true);
    });
  });

  describe('resize image', () => {
    it('should resize image to specified dimensions', async () => {
      const testImage = join(TEST_DIR, 'test.png');
      const resizedImage = join(TEST_DIR, 'resized.png');

      // Create test image
      await sharp({
        create: {
          width: 200,
          height: 200,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toFile(testImage);

      // Resize
      await sharp(testImage)
        .resize(100, 100)
        .toFile(resizedImage);

      expect(existsSync(resizedImage)).toBe(true);

      const metadata = await sharp(resizedImage).metadata();
      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
    });
  });
});

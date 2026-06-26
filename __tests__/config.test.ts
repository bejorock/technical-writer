/**
 * Unit tests for configuration management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, saveConfig, validateConfig } from '../extensions/config';

const TEST_DIR = './test-config';
const CONFIG_FILE = join(TEST_DIR, '.pi/google-docs/config.json');
const KEY_FILE = join(TEST_DIR, 'test-key.json');

beforeEach(() => {
  // Create test directory structure
  mkdirSync(join(TEST_DIR, '.pi/google-docs'), { recursive: true });
  writeFileSync(KEY_FILE, JSON.stringify({ type: 'service_account' }));
});

afterEach(() => {
  // Clean up
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('should return null if config file does not exist', () => {
    expect(loadConfig('/nonexistent')).toBeNull();
  });

  it('should load config from file', () => {
    const config = {
      serviceAccountKeyPath: KEY_FILE,
      targetFolderId: 'test-folder-id',
      useSharedDrive: true,
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(config));

    const loaded = loadConfig(TEST_DIR);
    expect(loaded).toEqual(config);
  });
});

describe('saveConfig', () => {
  it('should save config to file', () => {
    const config = {
      serviceAccountKeyPath: KEY_FILE,
      targetFolderId: 'test-folder-id',
      useSharedDrive: true,
    };

    const result = saveConfig(TEST_DIR, config);
    expect(result).toBe(true);
    expect(existsSync(CONFIG_FILE)).toBe(true);
  });
});

describe('validateConfig', () => {
  it('should return errors for missing required fields', () => {
    const config = { serviceAccountKeyPath: '', targetFolderId: '', useSharedDrive: false };
    const errors = validateConfig(config);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should return error for nonexistent key file', () => {
    const config = {
      serviceAccountKeyPath: '/nonexistent/key.json',
      targetFolderId: 'test-folder-id',
      useSharedDrive: true,
    };
    const errors = validateConfig(config);
    expect(errors.some(e => e.includes('not found'))).toBe(true);
  });

  it('should return no errors for valid config', () => {
    const config = {
      serviceAccountKeyPath: KEY_FILE,
      targetFolderId: '0AHAPdW0qB70bUk9PVA',
      useSharedDrive: true,
    };
    const errors = validateConfig(config);
    expect(errors.length).toBe(0);
  });
});

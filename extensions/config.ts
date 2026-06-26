/**
 * Configuration Management
 *
 * Handles loading, saving, and validating the extension configuration.
 * Config is stored in .pi/google-docs/config.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { extractFolderId } from "../lib/utils";

export interface GoogleDocsConfig {
  serviceAccountKeyPath: string;
  targetFolderId: string;
  useSharedDrive: boolean; // Required for service accounts
  // Cached auth client (not persisted)
  _authClient?: any;
}

const CONFIG_DIR = ".pi/google-docs";
const CONFIG_FILE = "config.json";

function getConfigPath(cwd: string): string {
  return join(cwd, CONFIG_DIR, CONFIG_FILE);
}

function ensureConfigDir(cwd: string): void {
  const configDir = join(cwd, CONFIG_DIR);
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

export function loadConfig(cwd: string): GoogleDocsConfig | null {
  const configPath = getConfigPath(cwd);

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content) as GoogleDocsConfig;
  } catch (error) {
    console.error("Failed to load config:", error);
    return null;
  }
}

export function saveConfig(cwd: string, config: GoogleDocsConfig): boolean {
  ensureConfigDir(cwd);
  const configPath = getConfigPath(cwd);

  try {
    // Don't persist the cached auth client
    const configToSave = { ...config };
    delete configToSave._authClient;

    writeFileSync(configPath, JSON.stringify(configToSave, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to save config:", error);
    return false;
  }
}

export function validateConfig(config: GoogleDocsConfig): string[] {
  const errors: string[] = [];

  if (!config.serviceAccountKeyPath) {
    errors.push("Service account key path is required");
  } else if (!existsSync(config.serviceAccountKeyPath)) {
    errors.push(`Service account key file not found: ${config.serviceAccountKeyPath}`);
  }

  if (!config.targetFolderId) {
    errors.push("Target folder ID is required");
  } else {
    // Try to extract folder ID from URL or validate as ID
    try {
      extractFolderId(config.targetFolderId);
    } catch (e) {
      errors.push("Invalid folder ID or URL format");
    }
  }

  return errors;
}

export function registerConfigCommands(pi: ExtensionAPI) {
  // /google-config set key-path <path>
  pi.registerCommand("google-config", {
    description: "Configure Google Docs extension",
    handler: async (args, ctx) => {
      const parts = args?.trim().split(/\s+/) || [];
      const subcommand = parts[0];

      if (!subcommand) {
        ctx.ui.notify("Usage: /google-config [set|show|test]", "info");
        return;
      }

      const config = loadConfig(ctx.cwd) || {
        serviceAccountKeyPath: "",
        targetFolderId: "",
      };

      switch (subcommand) {
        case "set": {
          const key = parts[1];
          const value = parts.slice(2).join(" ");

          if (!key || !value) {
            ctx.ui.notify("Usage: /google-config set [key-path|folder-id] <value>", "error");
            return;
          }

          switch (key) {
            case "key-path":
              config.serviceAccountKeyPath = value;
              break;
            case "folder-id":
              // Extract folder ID from URL if needed
              try {
                config.targetFolderId = extractFolderId(value);
              } catch (e) {
                ctx.ui.notify(`Invalid folder ID or URL: ${value}`, "error");
                return;
              }
              break;
            default:
              ctx.ui.notify(`Unknown config key: ${key}`, "error");
              return;
          }

          const errors = validateConfig(config);
          if (errors.length > 0) {
            ctx.ui.notify(`Validation errors: ${errors.join(", ")}`, "error");
            return;
          }

          if (saveConfig(ctx.cwd, config)) {
            ctx.ui.notify(`Configuration saved: ${key} = ${value}`, "info");
          } else {
            ctx.ui.notify("Failed to save configuration", "error");
          }
          break;
        }

        case "show": {
          if (!config.serviceAccountKeyPath && !config.targetFolderId) {
            ctx.ui.notify("No configuration found. Use /google-config set to configure.", "info");
            return;
          }

          const display = [
            `Key Path: ${config.serviceAccountKeyPath || "(not set)"}`,
            `Folder ID: ${config.targetFolderId || "(not set)"}`,
          ];

          ctx.ui.notify(display.join("\n"), "info");
          break;
        }

        case "test": {
          const errors = validateConfig(config);
          if (errors.length > 0) {
            ctx.ui.notify(`Configuration errors:\n${errors.join("\n")}`, "error");
            return;
          }

          ctx.ui.notify("Testing authentication...", "info");
          try {
            const { testAuth } = await import("../lib/clients/auth");
            const result = await testAuth(config);
            if (result.success) {
              ctx.ui.notify("✅ Authentication successful!", "info");
            } else {
              ctx.ui.notify(`❌ Authentication failed: ${result.error}`, "error");
            }
          } catch (error: any) {
            ctx.ui.notify(`❌ Test failed: ${error.message}`, "error");
          }
          break;
        }

        default:
          ctx.ui.notify(`Unknown subcommand: ${subcommand}`, "error");
      }
    },
  });
}

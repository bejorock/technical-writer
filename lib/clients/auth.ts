/**
 * Google API Authentication Module
 *
 * Handles authentication using service account credentials.
 * Provides a reusable auth client for all Google API calls.
 */

import { google, Auth } from "googleapis";
import { readFileSync } from "node:fs";
import type { GoogleDocsConfig } from "../extensions/config";

// Scopes required for the extension
const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

// Singleton auth client
let authClient: Auth.GoogleAuth | null = null;
let currentConfigKey: string | null = null;

/**
 * Get or create a Google Auth client from config
 */
export async function getAuthClient(
  config: GoogleDocsConfig
): Promise<Auth.GoogleAuth> {
  // Create a key from config to detect changes
  const configKey = `${config.serviceAccountKeyPath}:${config.targetFolderId}`;

  // Return cached client if config hasn't changed
  if (authClient && currentConfigKey === configKey) {
    return authClient;
  }

  try {
    // Read the service account key file
    const keyFile = readFileSync(config.serviceAccountKeyPath, "utf-8");
    const credentials = JSON.parse(keyFile);

    // Create auth client
    authClient = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });

    currentConfigKey = configKey;

    // Verify the client works
    const client = await authClient.getClient();
    if (!client) {
      throw new Error("Failed to create auth client");
    }

    return authClient;
  } catch (error) {
    // Reset cached client on error
    authClient = null;
    currentConfigKey = null;
    throw error;
  }
}

/**
 * Get authenticated Google API clients
 */
export async function getGoogleClients(config: GoogleDocsConfig) {
  const auth = await getAuthClient(config);

  return {
    auth,
    docs: google.docs({ version: "v1", auth }),
    sheets: google.sheets({ version: "v4", auth }),
    drive: google.drive({ version: "v3", auth }),
  };
}

/**
 * Test authentication by making a simple API call
 */
export async function testAuth(config: GoogleDocsConfig): Promise<{
  success: boolean;
  error?: string;
  user?: string;
}> {
  try {
    const { drive } = await getGoogleClients(config);

    // Try to list files to verify auth works
    const response = await drive.files.list({
      pageSize: 1,
      fields: "files(id, name)",
    });

    return {
      success: true,
      user: config.serviceAccountKeyPath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Authentication failed",
    };
  }
}

/**
 * Get the service account email from the key file
 */
export function getServiceAccountEmail(config: GoogleDocsConfig): string | null {
  try {
    const keyFile = readFileSync(config.serviceAccountKeyPath, "utf-8");
    const credentials = JSON.parse(keyFile);
    return credentials.client_email || null;
  } catch {
    return null;
  }
}

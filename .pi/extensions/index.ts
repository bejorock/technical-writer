/**
 * Technical Writer Extension
 *
 * A pi agent extension for technical writing assistance.
 * Provides tools and commands for documentation, style checking,
 * and content generation.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Subscribe to session start
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Technical Writer extension loaded!", "info");
  });

  // TODO: Add your tools, commands, and event handlers here

  console.log("Technical Writer extension initialized");
}

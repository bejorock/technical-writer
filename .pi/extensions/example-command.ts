/**
 * Example: Custom Command
 *
 * This demonstrates how to register a custom command (like /hello).
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export function registerExampleCommand(pi: ExtensionAPI) {
  pi.registerCommand("tech-writer", {
    description: "Show technical writer extension info",
    handler: async (_args, ctx) => {
      ctx.ui.notify("Technical Writer Extension v0.1.0", "info");
    },
  });
}

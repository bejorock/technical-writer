/**
 * Example: Event Handler
 *
 * This demonstrates how to intercept and modify tool calls.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";

export function registerExampleEventHandler(pi: ExtensionAPI) {
  // Example: Log all bash commands
  pi.on("tool_call", async (event, _ctx) => {
    if (isToolCallEventType("bash", event)) {
      console.log(`[tech-writer] Bash command: ${event.input.command}`);
    }
  });

  // Example: Show notification when agent starts
  pi.on("agent_start", async (_event, ctx) => {
    ctx.ui.setStatus("tech-writer", "Processing...");
  });

  // Example: Clear status when agent ends
  pi.on("agent_end", async (_event, ctx) => {
    ctx.ui.setStatus("tech-writer", "");
  });
}

/**
 * Example: Custom Tool
 *
 * This demonstrates how to create a custom tool that the LLM can call.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

// Define the tool schema
const wordCountSchema = Type.Object({
  text: Type.String({ description: "Text to count words in" }),
  includeChars: Type.Optional(
    Type.Boolean({ description: "Include character count", default: false })
  ),
});

// Register the tool when the extension loads
export function registerWordCountTool(pi: ExtensionAPI) {
  pi.registerTool({
    name: "word_count",
    label: "Word Count",
    description: "Count words and optionally characters in text",
    promptSnippet: "Count words and characters in text",
    promptGuidelines: [
      "Use word_count when the user asks to count words or characters in text.",
    ],
    parameters: wordCountSchema,

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const text = params.text;
      const words = text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, "").length;

      const result: string[] = [`Words: ${words}`];

      if (params.includeChars) {
        result.push(`Characters: ${chars}`);
        result.push(`Characters (no spaces): ${charsNoSpaces}`);
      }

      return {
        content: [{ type: "text", text: result.join("\n") }],
        details: { words, chars, charsNoSpaces },
      };
    },
  });
}

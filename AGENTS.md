# Technical Writer Project

This is a pi agent extension project for technical writing assistance.

## Project Structure

- `extensions/` - Pi extension source files (TypeScript)
- `skills/` - Agent skills (SKILL.md files)
- `prompts/` - Prompt templates
- `.pi/extensions/` - Auto-discovered extensions (copied from extensions/)

## Development

### Testing Extensions

```bash
# Test a single extension
pi -e ./extensions/index.ts

# Test with project extensions (auto-discovered)
pi -a
```

### Adding New Extensions

1. Create a `.ts` file in `extensions/`
2. Export a default function that receives `ExtensionAPI`
3. Register tools, commands, and event handlers
4. Copy to `.pi/extensions/` for auto-discovery

### Extension API

- `pi.registerTool()` - Add custom tools for the LLM
- `pi.registerCommand()` - Add slash commands
- `pi.on()` - Subscribe to lifecycle events
- `ctx.ui` - User interaction (notify, confirm, select)

# Paragraph Formatting Implementation

## Changes Made

### 1. lib/clients/docs.ts

Added three new methods to the DocsClient class:

```typescript
/**
 * Set line spacing for a paragraph range
 * @param spacing - Line spacing percentage (100=single, 150=1.5, 200=double)
 */
async setLineSpacing(
  documentId: string,
  startIndex: number,
  endIndex: number,
  spacing: number
): Promise<void>

/**
 * Set paragraph spacing (space before/after)
 * @param spaceBefore - Space before paragraph in points
 * @param spaceAfter - Space after paragraph in points
 */
async setParagraphSpacing(
  documentId: string,
  startIndex: number,
  endIndex: number,
  spaceBefore?: number,
  spaceAfter?: number
): Promise<void>

/**
 * Set paragraph indentation
 * @param indentLeft - Left indent in points
 * @param indentRight - Right indent in points
 * @param firstLine - First line indent in points (negative for hanging indent)
 */
async setParagraphIndentation(
  documentId: string,
  startIndex: number,
  endIndex: number,
  indentLeft?: number,
  indentRight?: number,
  firstLine?: number
): Promise<void>
```

All methods use the Google Docs API `UpdateParagraphStyleRequest` with appropriate fields:
- `setLineSpacing`: Uses `lineSpacing` field with `magnitude` and `unit: 'PERCENT'`
- `setParagraphSpacing`: Uses `spaceAbove` and `spaceBelow` fields with `unit: 'PT'`
- `setParagraphIndentation`: Uses `indentStart`, `indentEnd`, and `indentFirstLine` fields with `unit: 'PT'`

### 2. extensions/index.ts

Added three new operations to the `google_docs` tool:

1. **set_line_spacing** - Set line spacing for paragraph range
   - Parameters: documentId, startIndex, endIndex, spacing

2. **set_paragraph_spacing** - Set space before/after paragraphs
   - Parameters: documentId, startIndex, endIndex, spaceBefore, spaceAfter

3. **set_paragraph_indentation** - Set indentation
   - Parameters: documentId, startIndex, endIndex, indentLeft, indentRight, firstLine

Also added corresponding TypeBox parameter definitions:
- `spacing`: Line spacing percentage (100=single, 150=1.5, 200=double)
- `spaceBefore`: Space before paragraph in points
- `spaceAfter`: Space after paragraph in points
- `indentLeft`: Left indent in points
- `indentRight`: Right indent in points
- `firstLine`: First line indent in points

## Testing

All 126 existing tests pass:
```
Test Files  9 passed (9)
     Tests  126 passed (126)
```

## Usage Examples

### Set line spacing to 1.5
```typescript
google_docs({
  operation: "set_line_spacing",
  documentId: "DOC_ID",
  startIndex: 0,
  endIndex: 100,
  spacing: 150
})
```

### Set paragraph spacing
```typescript
google_docs({
  operation: "set_paragraph_spacing",
  documentId: "DOC_ID",
  startIndex: 0,
  endIndex: 100,
  spaceBefore: 12,
  spaceAfter: 6
})
```

### Set paragraph indentation
```typescript
google_docs({
  operation: "set_paragraph_indentation",
  documentId: "DOC_ID",
  startIndex: 0,
  endIndex: 100,
  indentLeft: 36,
  firstLine: 18
})
```

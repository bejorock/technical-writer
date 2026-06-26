# Technical Writer - Google Docs/Sheets Extension

A pi agent extension for Google Docs and Sheets integration.

## Features

### Google Docs
- Create, read, update, delete documents
- Insert, append, find/replace text
- Apply formatting (bold, italic, underline, strikethrough, font, color)
- Insert tables, paragraphs, page breaks, horizontal rules
- Export to PDF, DOCX, TXT, HTML

### Google Sheets
- Create, read, update, delete spreadsheets
- Read/write cell ranges, append rows
- Format cells (colors, fonts, alignment)
- Add/delete sheet tabs
- Export to PDF, XLSX, CSV, TSV

### Google Drive
- List files with pagination
- Create folders, move/copy/delete files
- Search files by name or type

### Configuration
- `/google-config set key-path <path>` - Set service account key file
- `/google-config set folder-id <id>` - Set target Drive folder
- `/google-config show` - View current configuration
- `/google-config test` - Test authentication

## Installation

### As a Pi Package

```bash
pi install /path/to/technical-writer
# or
pi install git:github.com/yourusername/technical-writer
```

### Development

```bash
# Clone the repository
git clone <repo-url>
cd technical-writer

# Install dependencies
npm install

# Test authentication
npx tsx test-auth.ts
```

## Configuration

### 1. Set Service Account Key

```bash
/google-config set key-path /path/to/your-service-account.json
```

### 2. Set Target Folder

```bash
/google-config set folder-id 1fZNsAaWw1yXPWwB2o8H-TYcb5xHL-QBi
```

### 3. Test Connection

```bash
/google-config test
```

## Usage

### Tools

#### `google_docs`
Create, read, update, and manage Google Docs documents.

```typescript
// Create a document
google_docs({ operation: "create", title: "My Document" })

// Read a document
google_docs({ operation: "get", documentId: "doc-id" })

// Insert text
google_docs({ 
  operation: "insert_text", 
  documentId: "doc-id", 
  text: "Hello World", 
  index: 0 
})

// Format text
google_docs({ 
  operation: "format_text", 
  documentId: "doc-id", 
  startIndex: 0, 
  endIndex: 5,
  formatOptions: { bold: true, italic: true }
})
```

#### `google_sheets`
Create, read, update, and manage Google Sheets spreadsheets.

```typescript
// Create a spreadsheet
google_sheets({ operation: "create", title: "My Spreadsheet" })

// Read a range
google_sheets({ 
  operation: "read_range", 
  spreadsheetId: "sheet-id", 
  range: "A1:B10" 
})

// Write values
google_sheets({ 
  operation: "write_range", 
  spreadsheetId: "sheet-id", 
  range: "A1:B2", 
  values: [["Name", "Age"], ["Alice", 30]] 
})

// Format cells
google_sheets({ 
  operation: "format_cells", 
  spreadsheetId: "sheet-id", 
  range: "A1:B1",
  formatOptions: { bold: true, backgroundColor: "#FFFF00" }
})
```

#### `google_drive`
Manage Google Drive files and folders.

```typescript
// List files
google_drive({ operation: "list" })

// List with pagination
google_drive({ operation: "list", pageSize: 50, pageToken: "token" })

// Create a folder
google_drive({ operation: "create_folder", name: "My Folder" })

// Move a file
google_drive({ 
  operation: "move", 
  fileId: "file-id", 
  targetFolderId: "folder-id" 
})
```

#### `google_export`
Export Google Docs and Sheets to various formats.

```typescript
// Export document to PDF
google_export({ 
  operation: "export_document", 
  fileId: "doc-id", 
  format: "pdf" 
})

// Export spreadsheet to CSV
google_export({ 
  operation: "export_spreadsheet", 
  fileId: "sheet-id", 
  format: "csv",
  sheetId: 0
})
```

### Commands

| Command | Description |
|---------|-------------|
| `/google-config set key-path <path>` | Set service account key file path |
| `/google-config set folder-id <id>` | Set target Drive folder ID |
| `/google-config show` | Display current configuration |
| `/google-config test` | Test authentication |

## Project Structure

```
technical-writer/
├── extensions/
│   ├── index.ts              # Main extension entry point
│   └── config.ts             # Configuration management
├── lib/
│   ├── clients/
│   │   ├── auth.ts           # Google API authentication
│   │   ├── docs.ts           # Google Docs client
│   │   ├── sheets.ts         # Google Sheets client
│   │   └── drive.ts          # Google Drive client
│   └── export/
│       └── index.ts          # Export functionality
├── skills/                   # Agent skills
├── prompts/                  # Prompt templates
├── package.json              # Pi package manifest
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

## Development

### Adding New Operations

1. Add the operation to the appropriate client file (docs.ts, sheets.ts, drive.ts)
2. Update the tool in extensions/index.ts with the new operation
3. Add TypeBox schema for the operation parameters
4. Add prompt guidelines for the new operation

### Testing

```bash
# Test authentication
npx tsx test-auth.ts

# Test in pi
pi -e ./extensions/index.ts
```

## Known Limitations

- Service account has limited storage quota
- Some operations require specific Google API permissions
- Snapshot features (page as image) not yet implemented
- Row/column reordering not yet implemented

## Resources

- [Pi Documentation](https://pi.dev)
- [Extension Guide](https://pi.dev/docs/extensions)
- [Google Docs API](https://developers.google.com/docs/api)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Drive API](https://developers.google.com/drive/api)

## License

MIT

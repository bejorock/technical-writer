# Technical Writer - Google Docs/Sheets Pi Extension

A pi agent extension for Google Docs and Sheets integration using service account authentication.

## Features

- 📄 **Google Docs** - Create, read, update, format documents
- 📊 **Google Sheets** - Create, read, write, format spreadsheets
- 📁 **Google Drive** - Manage files and folders
- 📥 **Export** - Download as PDF, DOCX, XLSX, CSV, TSV
- 🖼️ **Image Tools** - Convert PDF to images, crop images
- 🔐 **Service Account Auth** - Secure authentication via GCP

## Installation

### From GitHub (Recommended)

```bash
pi install git:github.com/bejorock/technical-writer
```

### From Local Folder

```bash
pi install /path/to/technical-writer
```

### For Current Project Only

```bash
pi install git:github.com/bejorock/technical-writer -l
```

## Prerequisites

1. **Google Cloud Project** with these APIs enabled:
   - Google Docs API
   - Google Sheets API
   - Google Drive API

2. **Service Account** with Editor role

3. **Shared Drive** folder shared with the service account

## Configuration

### Step 1: Set Service Account Key Path

```bash
/google-config set key-path /path/to/your-service-account.json
```

Or with URL:
```bash
/google-config set key-path https://drive.google.com/file/d/.../view
```

### Step 2: Set Target Folder ID

```bash
/google-config set folder-id YOUR_FOLDER_ID
```

Or with URL:
```bash
/google-config set folder-id https://drive.google.com/drive/folders/FOLDER_ID
```

### Step 3: Test Configuration

```bash
/google-config test
```

### View Current Config

```bash
/google-config show
```

## Configuration File

Settings are stored in `.pi/google-docs/config.json`:

```json
{
  "serviceAccountKeyPath": "./service-account.json",
  "targetFolderId": "0AHAPdW0qB70bUk9PVA",
  "useSharedDrive": true
}
```

## Available Tools

### 1. google_docs

Create and manage Google Docs documents.

| Operation | Parameters | Description |
|-----------|------------|-------------|
| `create` | `title` | Create new document |
| `get` | `documentId` | Get document content |
| `list` | - | List all documents |
| `delete` | `documentId` | Delete a document |
| `rename` | `documentId`, `title` | Rename a document |
| `insert_text` | `documentId`, `text`, `index` | Insert text at position |
| `append_text` | `documentId`, `text` | Append text to end |
| `find_replace` | `documentId`, `findText`, `replaceText` | Find and replace |
| `format_text` | `documentId`, `startIndex`, `endIndex`, `formatOptions` | Apply formatting |
| `insert_table` | `documentId`, `rows`, `columns`, `index` | Insert a table |

**Example:**
```bash
pi -e ./extensions/index.ts -p "Create a Google Doc called 'Meeting Notes' with a title and bullet points"
```

### 2. google_sheets

Create and manage Google Sheets spreadsheets.

| Operation | Parameters | Description |
|-----------|------------|-------------|
| `create` | `title` | Create new spreadsheet |
| `get` | `spreadsheetId` | Get spreadsheet metadata |
| `list` | - | List all spreadsheets |
| `delete` | `spreadsheetId` | Delete a spreadsheet |
| `read_range` | `spreadsheetId`, `range` | Read cell values |
| `write_range` | `spreadsheetId`, `range`, `values` | Write values to range |
| `append_rows` | `spreadsheetId`, `range`, `values` | Append rows |
| `format_cells` | `spreadsheetId`, `range`, `formatOptions` | Format cells |

**Example:**
```bash
pi -e ./extensions/index.ts -p "Create a spreadsheet with sales data: Product, Quantity, Price"
```

### 3. google_drive

Manage Google Drive files and folders.

| Operation | Parameters | Description |
|-----------|------------|-------------|
| `list` | `pageToken`, `pageSize` | List files |
| `create_folder` | `name`, `targetFolderId` | Create a folder |
| `delete` | `fileId` | Delete a file |
| `move` | `fileId`, `targetFolderId` | Move a file |
| `copy` | `fileId`, `name`, `targetFolderId` | Copy a file |
| `rename` | `fileId`, `name` | Rename a file |

**Example:**
```bash
pi -e ./extensions/index.ts -p "List all files in my Google Drive folder"
```

### 4. google_export

Export Google Docs and Sheets to various formats.

| Operation | Parameters | Description |
|-----------|------------|-------------|
| `export_document` | `fileId`, `format` | Export document |
| `export_spreadsheet` | `fileId`, `format` | Export spreadsheet |

**Supported Formats:**
- Documents: `pdf`, `docx`, `txt`, `html`
- Spreadsheets: `pdf`, `xlsx`, `csv`, `tsv`

**Example:**
```bash
pi -e ./extensions/index.ts -p "Export the Meeting Notes document to PDF"
```

### 5. image_tool

Convert PDF to images and crop images.

| Operation | Parameters | Description |
|-----------|------------|-------------|
| `pdf_to_images` | `pdfPath`, `outputPath`, `pages`, `format` | Convert PDF to images |
| `crop` | `imagePath`, `cropX`, `cropY`, `cropWidth`, `cropHeight` | Crop an image |

**Example:**
```bash
pi -e ./extensions/index.ts -p "Export the document to PDF and convert it to PNG images"
```

## URL Support

You can use URLs instead of IDs for all tools:

```bash
# Folder URL
/google-config set folder-id https://drive.google.com/drive/folders/FOLDER_ID

# File ID or URL works for all operations
google_docs({ operation: "get", documentId: "https://docs.google.com/document/d/DOC_ID/edit" })
```

## Supported URL Formats

| Type | Format |
|------|--------|
| Folder | `https://drive.google.com/drive/folders/FOLDER_ID` |
| Folder with user | `https://drive.google.com/drive/u/1/folders/FOLDER_ID` |
| Document | `https://docs.google.com/document/d/DOC_ID/edit` |
| Spreadsheet | `https://docs.google.com/spreadsheets/d/SHEET_ID/edit` |

## Workflow Examples

### Create and Fill a Document

```bash
pi -e ./extensions/index.ts -p "Create a project proposal document with sections: Introduction, Goals, Timeline, Budget"
```

### Create and Format a Spreadsheet

```bash
pi -e ./extensions/index.ts -p "Create an expense tracker with columns: Date, Description, Amount, Category. Add 5 sample rows."
```

### Export and Convert

```bash
pi -e ./extensions/index.ts -p "Export the expense tracker to CSV and the proposal to PDF"
```

### List and Organize

```bash
pi -e ./extensions/index.ts -p "List all my documents and create a folder called 'Archive' for older files"
```

## Troubleshooting

### "Permission denied" Error

- Ensure the service account has **Editor** role on the Shared Drive
- Check that the folder is shared with the service account email

### "Storage quota exceeded" Error

- Service accounts require **Shared Drives**, not personal drives
- Use the Shared Drive folder ID, not a personal folder

### "Configuration not found" Error

- Run `/google-config set key-path <path>` and `/google-config set folder-id <id>`

### Test Authentication

```bash
/google-config test
```

## Development

### Run Tests

```bash
npm test
```

### Build

```bash
npm run build
```

## Requirements

- Node.js 18+
- pi installed globally
- Google Cloud project with APIs enabled
- Service account with Editor role
- Shared Drive folder

## License

MIT

## Support

- [Pi Documentation](https://pi.dev)
- [GitHub Issues](https://github.com/bejorock/technical-writer/issues)

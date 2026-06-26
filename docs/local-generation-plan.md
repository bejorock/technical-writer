# Local Generation Revamp Plan

## Overview

Transition from Google Docs/Sheets API to local document generation using:
- **docx** library for DOCX files
- **xlsx** library for XLSX files
- **LibreOffice** for PDF conversion
- **Google Drive API** for uploading files

## Architecture

```
User Request
    ↓
Extension Tool (google_docs/google_sheets)
    ↓
Local Generator (docx/xlsx library)
    ↓
Local File (DOCX/XLSX)
    ↓
Drive Client (upload to Google Drive)
    ↓
Return Google Drive Link
```

## Tools to Modify

### 1. google_docs Tool

**Operations to keep (use local generation):**
- `create` → Create local DOCX, upload to Drive
- `create_document` → Create local DOCX with structured content, upload to Drive

**Operations to remove (no longer needed):**
- `get` → Use Google Drive API to download if needed
- `list` → Keep using Drive API
- `delete` → Keep using Drive API
- `rename` → Keep using Drive API
- `insert_text`, `append_text`, `find_replace` → Edit locally, re-upload
- `format_text`, `set_named_style`, `set_paragraph_alignment` → Edit locally, re-upload
- `insert_table`, `insert_paragraph`, `insert_bullet_list`, `insert_numbered_list` → Edit locally, re-upload
- All header/footer operations → Edit locally, re-upload
- All table operations → Edit locally, re-upload

**New approach:**
1. Download existing document from Drive (if editing)
2. Apply changes locally using docx library
3. Re-upload to Drive

### 2. google_sheets Tool

**Operations to keep (use local generation):**
- `create` → Create local XLSX, upload to Drive

**Operations to remove:**
- `get` → Use Google Drive API to download if needed
- `list` → Keep using Drive API
- `delete` → Keep using Drive API
- `read_range`, `write_range`, `append_rows` → Edit locally, re-upload
- `format_cells` → Edit locally, re-upload
- `add_sheet`, `delete_sheet` → Edit locally, re-upload

### 3. google_export Tool

**Keep using LibreOffice:**
- Convert DOCX to PDF
- Convert XLSX to PDF
- Convert to other formats

## Implementation Steps

### Phase 1: Create Local Generators (Done)
- [x] `lib/generators/document.ts` - DOCX generation
- [x] `lib/generators/spreadsheet.ts` - XLSX generation
- [x] `lib/converters/pdf.ts` - PDF conversion

### Phase 2: Modify Extension Tools
- [ ] Update `google_docs` tool create operations
- [ ] Update `google_sheets` tool create operations
- [ ] Update `google_export` tool to use local conversion
- [ ] Remove/simplify edit operations

### Phase 3: Update Tests
- [ ] Update unit tests for new approach
- [ ] Add integration tests for local generation

### Phase 4: Documentation
- [ ] Update README.md
- [ ] Update tool documentation

## Benefits

1. **Full Control** - No API limitations or index errors
2. **Faster** - No network latency for creation
3. **Reliable** - No complex index calculations
4. **Offline** - Can create documents without internet
5. **Flexible** - Easy to add custom formatting

## Trade-offs

1. **Edit Workflow** - To edit existing documents, need to download → edit → re-upload
2. **Collaboration** - Real-time collaboration not supported (but was never supported via API anyway)
3. **File Size** - Local files may be larger than Google Docs format

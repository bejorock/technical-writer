# Feature Specification — Google Docs & Sheets Node.js App

---

## Authentication

- Authenticate to Google APIs using a Service Account JSON key file
- Load credentials from environment variables, never hardcoded
- Single shared auth client reused across all API calls (no re-auth per request)
- Scopes covered: Docs, Sheets, Drive

---

## Google Docs — Features

### Document Management
- Create a new blank document with a given title
- Retrieve a document by its ID (returns full content and metadata)
- Rename an existing document
- Delete a document permanently
- List all documents owned or accessible by the service account (via Drive)
- Duplicate an existing document (copy via Drive API)

### Content — Text
- Insert plain text at a specific position in the document
- Insert text at the end of the document (append)
- Replace a specific piece of text with new text (find and replace)
- Delete a specific range of text by start and end index
- Read all text content from the document as a plain string

### Content — Paragraphs & Headings
- Insert a paragraph with a named style: Heading 1, Heading 2, Heading 3, Normal Text, Title, Subtitle
- Insert a page break
- Insert a horizontal rule
- Set paragraph alignment: left, center, right, justified
- Set line spacing for a paragraph
- Set paragraph indentation (left and right)
- Add space before or after a paragraph

### Content — Text Formatting
- Apply bold, italic, underline, or strikethrough to a text range
- Set font family for a text range
- Set font size for a text range
- Set text color for a text range
- Set text background highlight color for a text range
- Set text to superscript or subscript
- Create a hyperlink on a text range (link to a URL)
- Remove all formatting from a text range (reset to default)

### Content — Lists
- Insert a bulleted list (unordered)
- Insert a numbered list (ordered)
- Set the nesting level of a list item (indent / outdent)
- Remove list formatting from a paragraph (convert back to normal text)

### Content — Tables
- Insert a table with a specified number of rows and columns
- Insert a new row into an existing table (at a given position)
- Insert a new column into an existing table
- Delete a row from a table
- Delete a column from a table
- Write text content into a specific table cell (by row and column index)
- Set the background color of a table cell
- Set the border style of a table cell
- Set column width of a table
- Merge cells in a table (row span / column span)
- Delete an entire table

### Content — Images
- Insert an inline image from a public URL at a specific position
- Set the width and height of an inline image
- Delete an image from the document

### Headers, Footers & Page Setup
- Set document page size (width and height)
- Set document margins (top, bottom, left, right)
- Create a document header with text
- Create a document footer with text
- Insert page number into header or footer
- Remove header or footer

### Export & Download
- Download the entire document as a PDF file and save it to a local path
- Download the entire document as a `.docx` file and save it to a local path
- Download the entire document as a plain `.txt` file and save it to a local path
- Download the entire document as an `.html` file and save it to a local path

### Snapshot — Page as Image
- Take a snapshot of a specific page in the document and save it as a PNG image
- Take a snapshot of all pages in the document, saving each page as a separate PNG file
- Take a snapshot of all pages and save them as a single multi-page PDF
- Set the resolution (DPI) for the snapshot output
- Set the image dimensions (width and height in pixels) for the snapshot output

---

## Google Sheets — Features

### Spreadsheet Management
- Create a new blank spreadsheet with a given title
- Retrieve spreadsheet metadata (title, list of sheets, sheet IDs)
- Rename a spreadsheet
- Delete a spreadsheet permanently
- Duplicate a spreadsheet (copy via Drive API)
- List all spreadsheets accessible by the service account (via Drive)

### Sheet (Tab) Management
- Add a new sheet tab with a given name
- Rename an existing sheet tab
- Delete a sheet tab
- Duplicate a sheet tab within the same spreadsheet
- Reorder sheet tabs (change position)
- Set sheet tab color
- Show or hide a sheet tab

### Reading Data
- Read a single cell value by A1 notation (e.g. `A1`, `B3`)
- Read a range of cells by A1 notation (e.g. `A1:D10`)
- Read an entire sheet
- Read formatted values (what the user sees) vs raw values (what is actually stored)
- Read cell formulas instead of computed values
- Read all sheet names and their IDs in a spreadsheet

### Writing Data
- Write a value to a single cell
- Write a 2D array of values to a range
- Append rows after the last row that contains data
- Write a formula to a cell (e.g. `=SUM(A1:A10)`)
- Clear all values in a range (preserves formatting)
- Clear all values and formatting in a range

### Row & Column Operations
- Insert one or more blank rows at a specific position
- Insert one or more blank columns at a specific position
- Delete specific rows by index range
- Delete specific columns by index range
- Move a row or column to a different position
- Set the height of a row
- Set the width of a column
- Hide a row or column
- Show a hidden row or column
- Freeze a number of rows at the top
- Freeze a number of columns at the left

### Cell Formatting
- Set background color of a cell or range
- Set text color of a cell or range
- Set font family, font size, bold, italic, underline, strikethrough on a cell or range
- Set horizontal alignment: left, center, right
- Set vertical alignment: top, middle, bottom
- Enable or disable text wrapping in a cell
- Set number format (e.g. currency, percentage, date, plain number, custom pattern)
- Set border style (solid, dashed, dotted) and color on each side of a cell or range
- Merge cells across rows or columns
- Unmerge cells

### Data Operations
- Sort a range by a specific column (ascending or descending)
- Filter rows in a range by a condition (basic filter)
- Add data validation to a cell range (dropdown list, number range, date range, custom formula)
- Remove data validation from a range
- Add a named range (assign a name to a cell range for easy reference)
- Remove a named range

### Cell Notes
- Add a note (comment) to a cell
- Edit an existing cell note
- Delete a cell note

### Protected Ranges
- Protect a range or sheet from editing
- Remove protection from a range or sheet

### Export & Download
- Download the entire spreadsheet as a PDF file and save it to a local path
- Download a specific sheet tab as a PDF file and save it to a local path
- Download the entire spreadsheet as an `.xlsx` file and save it to a local path
- Download a specific sheet tab as a `.csv` file and save it to a local path
- Download a specific sheet tab as a `.tsv` file and save it to a local path

### Snapshot — Sheet Tab as Image
- Take a snapshot of a specific sheet tab and save it as a PNG image
- Take a snapshot of a specific cell range within a sheet tab and save it as a PNG image
- Take snapshots of all sheet tabs in the spreadsheet, saving each as a separate PNG file
- Set the resolution (DPI) for the snapshot output
- Set the image dimensions (width and height in pixels) for the snapshot output

---

## Drive — Supporting Features
> Used internally to support Docs and Sheets features above

- Create a file (used by createDocument and createSpreadsheet)
- Delete a file by ID
- Rename a file by ID
- Copy a file by ID
- List files filtered by MIME type (Docs or Sheets only)
- Move a file to a specific folder

---

## Drive — Folder Management

### Folder Operations
- Create a new folder inside a given parent folder by name
- Rename an existing folder by its ID
- Delete a folder permanently by its ID (including all contents)
- Trash a folder (move to bin without permanent deletion)
- Duplicate a folder (copy folder and all its contents into a new folder)
- Move a folder into another folder

### Listing Files in a Folder
- List all files inside a folder by folder ID (returns name, ID, MIME type, created date, modified date)
- List only Google Docs files inside a folder
- List only Google Sheets files inside a folder
- List only subfolders inside a folder
- List files with pagination support (limit results per page, fetch next page)
- Search files inside a folder by name (partial match)
- Sort file listing by name, created date, or last modified date (ascending or descending)
- List files recursively including all subfolders and their contents

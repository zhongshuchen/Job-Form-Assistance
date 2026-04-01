# Job Application Assistant

A Chrome browser extension for quickly filling out job application forms with pre-prepared text snippets (materials).

## Features

- **Sidebar Interface**: Slides out from the right side of the browser
- **Material Groups**: Organize materials into collapsible groups
- **Quick Insert**: Click any material to insert into the active form field
- **Drag & Drop**: Drag materials directly into text fields
- **Smart Classification**: Automatic detection of dates, phone numbers, and emails
- **Date Format Toggle**: Switch between `YYYY-MM-DD` and `YYYY-MM` formats
- **Material Management**: Create, edit, delete, and reorder materials

## Installation

### Developer Mode (Unpacked)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the `job-assistant-extension` folder
5. The extension icon should appear in your toolbar

### Usage

1. Click the extension icon (or use the keyboard shortcut) to open the sidebar
2. Create groups to organize your materials
3. Add materials with optional labels
4. When filling out job applications:
   - Click a material to insert at cursor position
   - Or drag and drop directly into form fields

## File Structure

```
job-assistant-extension/
├── manifest.json      # Extension manifest (v3)
├── background.js      # Service worker
├── content.js         # Content script for form interaction
├── sidebar.html       # Sidebar UI
├── sidebar.js         # Sidebar logic
├── sidebar.css        # Sidebar styles
└── icons/             # Extension icons
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```

## Development

### Making Changes

After modifying any files:

1. Go to `chrome://extensions/`
2. Find the extension and click the refresh icon
3. Changes will take effect immediately

### Debugging

- **Background script**: Click "service worker" link in chrome://extensions
- **Content script**: Open DevTools on any page, look in Console
- **Sidebar**: Right-click in sidebar, select "Inspect"

## Permissions

- `storage`: Save materials and settings locally
- `activeTab`: Interact with the current tab
- `scripting`: Inject content script for form interaction

## Data Storage

All materials are stored locally using Chrome's `chrome.storage.local` API. Data persists across browser sessions.

## License

MIT

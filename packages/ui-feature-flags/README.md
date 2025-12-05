# Feature Flags UI

React application for managing feature flags with full CRUD operations.

## Features

- ✅ View all feature flags in a clean, organized interface
- ✅ Create new feature flags with JSONB data
- ✅ Edit existing flags (description, enabled state, data)
- ✅ Toggle flags on/off with a single click
- ✅ Delete flags with confirmation
- ✅ Search flags by key or description
- ✅ Real-time updates from PostgreSQL
- ✅ Responsive design
- ✅ TypeScript for type safety

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Running API server (see `../api-feature-flags-server`)

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Make sure the API server is running on port 3001:
```bash
cd ../api-feature-flags-server
pnpm dev
```

3. Start the development server:
```bash
pnpm dev
```

The UI will open at `http://localhost:3000`.

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm clean` - Clean build artifacts

## API Integration

The UI communicates with the Express API server through a proxy configuration:
- UI runs on: `http://localhost:3000`
- API runs on: `http://localhost:3001`
- API requests to `/api/*` are proxied to the API server

## Architecture

```
src/
├── components/
│   ├── CreateFlagForm.tsx  # Form for creating new flags
│   ├── EditFlagForm.tsx    # Form for editing existing flags
│   └── FlagList.tsx        # List view of all flags
├── services/
│   └── api.ts              # API client for backend communication
├── types/
│   └── feature-flag.types.ts  # TypeScript interfaces
├── App.tsx                 # Main application component
├── main.tsx                # Application entry point
└── index.css               # Global styles
```

## Usage

### Creating a Flag

1. Click "Create New Flag" button
2. Fill in the flag key (required), description, and flag data (JSON)
3. Toggle "Enabled" if you want the flag active immediately
4. Click "Create Flag"

### Editing a Flag

1. Click the "Edit" button on any flag card
2. Modify the description, enabled state, or flag data
3. Click "Update Flag"

### Toggling a Flag

- Click the "Enable" or "Disable" button to quickly toggle the flag's state

### Deleting a Flag

1. Click the "Delete" button on any flag card
2. Confirm the deletion in the popup dialog

### Searching Flags

1. Enter a search term in the search box
2. Click "Search" or press Enter
3. Click "Clear" to reset the search

## Feature Flag Data Format

Feature flags support flexible JSONB data. Examples:

```json
// Boolean flag
{}

// Number flag
{"value": 42}

// String flag
{"value": "hello world"}

// Complex object
{
  "value": {
    "foo": "bar",
    "nested": {
      "key": "value"
    }
  }
}
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **CSS-in-JS** - Inline styles for simplicity

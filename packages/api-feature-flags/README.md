# Feature Flags API Server

Express API server for managing feature flags with PostgreSQL JSONB storage.

## Features

- ✅ Full CRUD operations for feature flags
- ✅ PostgreSQL with JSONB for flexible flag storage
- ✅ TypeScript for type safety
- ✅ Connection pooling for performance
- ✅ Error handling and validation
- ✅ Health check endpoints
- ✅ CORS enabled for React frontend
- ✅ Security headers with Helmet
- ✅ Request logging with Morgan

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (or npm/yarn)

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feature_flags
DB_USER=postgres
DB_PASSWORD=your_password
```

4. Setup the database (if not already done):
```bash
psql postgres -c "CREATE DATABASE feature_flags;"
psql feature_flags -f ../../libs/postgresql/schema/feature-flags.sql
```

5. Start the development server:
```bash
pnpm dev
```

The server will start on `http://localhost:3001`.

## API Endpoints

### Get All Feature Flags
```http
GET /api/feature-flags
```

Query parameters:
- `search` - Search by flag key or description

### Get Enabled Flags Only
```http
GET /api/feature-flags/enabled
```

### Get Single Feature Flag
```http
GET /api/feature-flags/:key
```

### Create Feature Flag
```http
POST /api/feature-flags
Content-Type: application/json

{
  "flag_key": "new-feature",
  "description": "Enable new feature",
  "enabled": false,
  "flag_data": {
    "value": "some value"
  }
}
```

### Update Feature Flag
```http
PUT /api/feature-flags/:key
Content-Type: application/json

{
  "description": "Updated description",
  "enabled": true,
  "flag_data": {
    "value": "updated value"
  }
}
```

### Toggle Feature Flag
```http
PATCH /api/feature-flags/:key/toggle
```

### Delete Feature Flag
```http
DELETE /api/feature-flags/:key
```

## Response Format

All responses follow this format:

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Health Checks

- `GET /health` - Application health
- `GET /health/db` - Database connection health

## Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm clean` - Clean build artifacts

## Architecture

```
src/
├── config/
│   └── database.ts         # PostgreSQL connection pool
├── controllers/
│   └── feature-flag.controller.ts  # Request handlers
├── middleware/
│   └── error-handler.ts    # Global error handling
├── routes/
│   └── index.ts            # API routes
├── services/
│   └── feature-flag.service.ts     # Business logic
├── types/
│   └── feature-flag.types.ts       # TypeScript types
└── index.ts                # Application entry point
```

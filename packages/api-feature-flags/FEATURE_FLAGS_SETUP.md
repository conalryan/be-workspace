# Feature Flags System - PostgreSQL JSONB Implementation

A complete feature flag management system with PostgreSQL JSONB storage, Express API server, and React UI.

## 🏗️ Architecture

```
┌─────────────────┐
│   React UI      │  Port 3000 - User interface for CRUD operations
│  (Vite + TS)    │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  Express API    │  Port 3001 - REST API endpoints
│  (Node + TS)    │
└────────┬────────┘
         │ pg (node-postgres)
         ↓
┌─────────────────┐
│  PostgreSQL     │  Port 5432 - JSONB storage
│   Database      │
└─────────────────┘
```

## 📦 Packages

- **`libs/postgresql/schema/`** - Database schema and migrations
- **`packages/api-feature-flags-server/`** - Express REST API server
- **`packages/ui-feature-flags/`** - React web application

## 🚀 Quick Start

### Step 1: Setup PostgreSQL Database

1. **Install PostgreSQL** (if not already installed):
```bash
brew install postgresql@18
brew services start postgresql@18
```

2. **Create the database**:
```bash
psql postgres -c "CREATE DATABASE feature_flags;"
```

3. **Run the schema**:
```bash
psql feature_flags -f packages/api-feature-flags/schema/feature-flags.sql
```

### Step 2: Setup API Server

1. **Navigate to the server directory**:
```bash
cd packages/api-feature-flags-server
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Create environment file**:
```bash
cp .env.example .env
```

4. **Edit `.env` with your database credentials**:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feature_flags
DB_USER=postgres
DB_PASSWORD=your_password
```

5. **Start the API server**:
```bash
pnpm dev
```

Server should start on `http://localhost:3001`

### Step 3: Setup React UI

1. **Navigate to the UI directory** (in a new terminal):
```bash
cd packages/ui-feature-flags
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Start the development server**:
```bash
pnpm dev
```

UI should open at `http://localhost:3000`

## 🎯 Usage

### Using the UI

1. **View Flags**: All flags are displayed on the main page
2. **Create Flag**: Click "Create New Flag" button
3. **Edit Flag**: Click the "Edit" button on any flag card
4. **Toggle Flag**: Click "Enable" or "Disable" to toggle state
5. **Delete Flag**: Click "Delete" and confirm
6. **Search Flags**: Use the search box to filter by key or description

### Using the API

#### Get All Flags
```bash
curl http://localhost:3001/api/feature-flags
```

#### Get a Specific Flag
```bash
curl http://localhost:3001/api/feature-flags/a-boolean-flag
```

#### Create a Flag
```bash
curl -X POST http://localhost:3001/api/feature-flags \
  -H "Content-Type: application/json" \
  -d '{
    "flag_key": "new-feature",
    "description": "My new feature",
    "enabled": false,
    "flag_data": {"value": "test"}
  }'
```

#### Update a Flag
```bash
curl -X PUT http://localhost:3001/api/feature-flags/new-feature \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "flag_data": {"value": "updated"}
  }'
```

#### Toggle a Flag
```bash
curl -X PATCH http://localhost:3001/api/feature-flags/new-feature/toggle
```

#### Delete a Flag
```bash
curl -X DELETE http://localhost:3001/api/feature-flags/new-feature
```

## 🗄️ Database Schema

### Table: `feature_flags`

| Column      | Type         | Description                    |
|-------------|--------------|--------------------------------|
| id          | SERIAL       | Primary key                    |
| flag_key    | VARCHAR(255) | Unique flag identifier         |
| description | TEXT         | Human-readable description     |
| enabled     | BOOLEAN      | Whether flag is active         |
| flag_data   | JSONB        | Flexible JSON configuration    |
| created_at  | TIMESTAMPTZ  | Creation timestamp             |
| updated_at  | TIMESTAMPTZ  | Last update (auto-updated)     |

### Indexes

- B-tree on `flag_key` for fast lookups
- B-tree on `enabled` for filtering
- GIN on `flag_data` for JSONB queries

### Sample Queries

```sql
-- Get all enabled flags
SELECT * FROM feature_flags WHERE enabled = true;

-- Query JSONB data
SELECT flag_key, flag_data->>'value' as value
FROM feature_flags
WHERE flag_data ? 'value';

-- Update JSONB data
UPDATE feature_flags
SET flag_data = flag_data || '{"new_key": "new_value"}'::jsonb
WHERE flag_key = 'my-flag';
```

## 🔧 Development

### Run Everything in Development

From the root directory:

```bash
# Terminal 1 - API Server
cd packages/api-feature-flags-server && pnpm dev

# Terminal 2 - UI
cd packages/ui-feature-flags && pnpm dev
```

### Build for Production

```bash
# Build API Server
cd packages/api-feature-flags-server
pnpm build
pnpm start

# Build UI
cd packages/ui-feature-flags
pnpm build
pnpm preview
```

## 📝 Feature Flag Data Examples

### Boolean Flag
```json
{
  "flag_key": "feature-enabled",
  "description": "Simple on/off feature",
  "enabled": true,
  "flag_data": {}
}
```

### Number Flag
```json
{
  "flag_key": "max-connections",
  "description": "Maximum number of connections",
  "enabled": true,
  "flag_data": {
    "value": 100
  }
}
```

### String Flag
```json
{
  "flag_key": "api-endpoint",
  "description": "API endpoint URL",
  "enabled": true,
  "flag_data": {
    "value": "https://api.example.com"
  }
}
```

### Complex Object Flag
```json
{
  "flag_key": "feature-config",
  "description": "Complex feature configuration",
  "enabled": true,
  "flag_data": {
    "value": {
      "timeout": 5000,
      "retries": 3,
      "endpoints": ["api1.example.com", "api2.example.com"],
      "options": {
        "cache": true,
        "compression": "gzip"
      }
    }
  }
}
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database Credentials**: Use strong passwords and rotate regularly
3. **CORS**: Configure CORS_ORIGIN in production
4. **SQL Injection**: All queries use parameterized statements
5. **Input Validation**: Validate JSON data on both client and server

## 🧪 Testing

### Test Database Connection
```bash
curl http://localhost:3001/health/db
```

### Test API Endpoints
```bash
# Check server health
curl http://localhost:3001/health

# List all flags
curl http://localhost:3001/api/feature-flags

# Search flags
curl "http://localhost:3001/api/feature-flags?search=boolean"
```

## 📚 Additional Resources

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
brew services list | grep postgres

# Test connection
psql postgres -c "SELECT version();"
```

### Port Already in Use
```bash
# Find process using port 3001
lsof -ti:3001 | xargs kill

# Find process using port 3000
lsof -ti:3000 | xargs kill
```

### Clear Everything and Restart
```bash
# Drop and recreate database
psql postgres -c "DROP DATABASE IF EXISTS feature_flags;"
psql postgres -c "CREATE DATABASE feature_flags;"
psql feature_flags -f libs/postgresql/schema/feature-flags.sql

# Reinstall dependencies
cd packages/api-feature-flags-server && rm -rf node_modules && pnpm install
cd ../ui-feature-flags && rm -rf node_modules && pnpm install
```

## 📄 License

MIT

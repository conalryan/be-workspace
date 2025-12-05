# Feature Flags Database System

A PostgreSQL-based feature flag management system to replace Launch Darkly, with real-time updates and a React admin UI.

## Architecture Overview

```
┌─────────────────────┐
│   React Admin UI    │
│  (Feature Flags)    │
└──────────┬──────────┘
           │ HTTP/WebSocket
┌──────────▼──────────┐
│   Express Server    │
│   + Socket.io       │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Service Layer      │
│  (Business Logic    │
│   + Caching)        │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  PostgreSQL         │
│  (JSONB Storage)    │
└─────────────────────┘
```

## Why PostgreSQL with JSONB?

**Chosen Database: PostgreSQL with JSONB**

### Advantages:
1. **Flexible Schema**: JSONB allows storing complex nested JSON structures exactly like Launch Darkly's format
2. **Indexing**: GIN indexes enable fast queries on JSON fields
3. **ACID Compliance**: Ensures data consistency for flag updates
4. **Relational Support**: Can add audit logs, users, environments in separate tables
5. **Performance**: JSONB is binary format, faster than plain JSON
6. **Battle-tested**: PostgreSQL is enterprise-ready and widely supported
7. **Query Power**: Can query inside JSON with operators like `->`, `->>`, `@>`, etc.

### Example Queries:
```sql
-- Find flags where config.enabled = true
SELECT * FROM feature_flag_configs
WHERE config->>'enabled' = 'true';

-- Find flags with specific variation
SELECT * FROM feature_flag_configs
WHERE config->>'variation' = '0';

-- Update nested JSON field
UPDATE feature_flag_configs
SET config = jsonb_set(config, '{value,beta}', 'true'::jsonb)
WHERE flag_id = '...';
```

## Database Schema

### Tables:

1. **environments** - Different deployment environments (dev, staging, prod)
2. **feature_flags** - Core flag metadata (key, name, type, tags)
3. **feature_flag_configs** - Environment-specific configurations (JSONB)
4. **feature_flag_audit_log** - Complete audit trail of all changes
5. **user_segments** - User targeting rules
6. **flag_prerequisites** - Flag dependencies

### Key Design Decisions:

- **JSONB for configs**: Stores the entire Launch Darkly-style configuration
- **Separate flag and config**: Flags are global, configs are per-environment
- **Soft deletes**: `archived` flag instead of hard deletes
- **Automatic timestamps**: `updated_at` auto-updated via triggers
- **Comprehensive indexing**: Fast lookups by key, environment, enabled status
- **Audit logging**: Every change tracked with before/after states

## Setup Instructions

### 1. Install Dependencies

```bash
# In your project root
cd /compute-api-feature-flags

# Install Node.js dependencies (you'll need to add these)
pnpm install pg express cors socket.io socket.io-client
pnpm install --save-dev @types/node @types/pg @types/express @types/cors
```

### 2. Set Up PostgreSQL

```bash
# Install PostgreSQL (if not already installed)
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb feature_flags

# Or using psql
psql postgres
CREATE DATABASE feature_flags;
\q
```

### 3. Initialize Database Schema

```bash
psql feature_flags < src/schema.sql
```

### 4. Seed Sample Data (Optional)

```bash
psql feature_flags < src/seed-data.sql
```

### 5. Configure Environment Variables

Create a `.env` file:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=feature_flags
DB_USER=postgres
DB_PASSWORD=
DB_POOL_MAX=20
DB_SSL=false

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000

# React App Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=http://localhost:3001
```

### 6. Start the Server

```bash
# Compile TypeScript (you'll need to set up tsconfig)
npx tsc src/*.ts --outDir dist

# Run the server
node dist/server.js
```

## API Endpoints

### Flags

- `GET /api/flags` - Get all feature flags
- `GET /api/flags/:key` - Get specific flag
- `POST /api/flags` - Create new flag
- `PATCH /api/flags/:key` - Update flag
- `DELETE /api/flags/:key` - Archive flag

### Configurations

- `GET /api/flags/:key/config/:environment` - Get flag config for environment
- `GET /api/environments/:environment/flags` - Get all flags (Launch Darkly format)
- `PUT /api/flags/:key/config/:environment` - Update flag config
- `POST /api/flags/:key/toggle` - Toggle flag on/off

### Audit

- `GET /api/flags/:key/audit` - Get audit log for flag
- `GET /api/audit` - Get all audit logs

### Health

- `GET /health` - Server and database health check

## API Usage Examples

### Get All Flags for Staging (Launch Darkly Format)

```bash
curl http://localhost:3001/api/environments/staging/flags
```

Response:
```json
{
  "databasePremium": {
    "flagVersion": 1,
    "trackEvents": false,
    "value": true,
    "variation": 0,
    "version": 1
  },
  "aclp": {
    "flagVersion": 9,
    "trackEvents": false,
    "value": {
      "beta": false,
      "enabled": true,
      "bypassAccountCapabilities": true
    },
    "variation": 1,
    "version": 435
  }
}
```

### Toggle a Flag

```bash
curl -X POST http://localhost:3001/api/flags/databasePremium/toggle \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin" \
  -H "x-user-email: admin@example.com" \
  -d '{
    "environment": "staging",
    "enabled": false
  }'
```

### Create a New Flag

```bash
curl -X POST http://localhost:3001/api/flags \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin" \
  -d '{
    "key": "myNewFeature",
    "name": "My New Feature",
    "description": "Enables the new feature",
    "type": "boolean",
    "enabled": false,
    "tags": ["feature", "beta"]
  }'
```

## Real-Time Updates

The system uses Socket.io for real-time updates:

### Client-Side (JavaScript)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Subscribe to environment
socket.emit('subscribe', 'staging');

// Listen for flag updates
socket.on('flag:updated', (data) => {
  console.log('Flag updated:', data.flagKey, data.config);
  // Update your UI
});

socket.on('flag:toggled', (data) => {
  console.log('Flag toggled:', data.flagKey, data.enabled);
  // Update your UI
});
```

## Integration with Cloud Manager

### 1. Replace Launch Darkly Client

In `packages/manager/src/featureFlags.ts`, replace the Launch Darkly SDK with your API:

```typescript
import { io } from 'socket.io-client';

class FeatureFlagClient {
  private flags: Flags = {} as Flags;
  private socket: Socket;

  async initialize() {
    // Fetch initial flags
    const response = await fetch(
      `${API_URL}/environments/${environment}/flags`
    );
    this.flags = await response.json();

    // Set up WebSocket for real-time updates
    this.socket = io(WS_URL);
    this.socket.emit('subscribe', environment);

    this.socket.on('flag:updated', (data) => {
      this.flags[data.flagKey] = data.config;
      this.notifyListeners();
    });
  }

  getFlags(): Flags {
    return this.flags;
  }
}
```

### 2. Add Admin Route

In your router configuration:

```typescript
import { FeatureFlagsAdmin } from './features/FeatureFlags/FeatureFlagsAdmin';

// Add route
{
  path: '/feature-flags',
  element: <FeatureFlagsAdmin />,
}
```

## Migration from Launch Darkly

### Import Existing Flags

```typescript
// Script to import from Launch Darkly JSON
import fs from 'fs';
import { featureFlagService } from './feature-flag-service';

const ldFlags = JSON.parse(
  fs.readFileSync('launch-darkly-staging.json', 'utf8')
);

for (const [key, config] of Object.entries(ldFlags)) {
  await featureFlagService.createFlag({
    key,
    name: key,
    type: typeof config.value === 'boolean' ? 'boolean' : 'json',
    enabled: true,
  });

  await featureFlagService.updateFlagConfig(key, 'staging', {
    config,
    enabled: true,
  });
}
```

## Performance Considerations

1. **Caching**: Service layer includes 1-minute cache
2. **Indexes**: GIN indexes on JSONB fields
3. **Connection Pooling**: Max 20 connections by default
4. **Real-time**: WebSocket reduces polling overhead

## Security Considerations

1. **Authentication**: Add JWT or OAuth middleware to routes
2. **Authorization**: Role-based access control for flag changes
3. **Audit Logging**: Every change is logged with user info
4. **Input Validation**: Validate all inputs before database operations
5. **SQL Injection**: Using parameterized queries throughout

## Monitoring & Observability

1. **Health Check**: `/health` endpoint for monitoring
2. **Audit Log**: Complete history of all changes
3. **Database Metrics**: Monitor connection pool, query times
4. **WebSocket Monitoring**: Track connected clients

## Backup & Recovery

```bash
# Backup database
pg_dump feature_flags > backup.sql

# Restore database
psql feature_flags < backup.sql

# Backup specific table
pg_dump -t feature_flags feature_flags > flags_backup.sql
```

## Next Steps

1. **Add Authentication**: Implement JWT/OAuth for API
2. **Add User Management**: Create user roles and permissions
3. **Enhanced UI**: Build full-featured admin dashboard
4. **Analytics**: Track flag usage and performance
5. **A/B Testing**: Add percentage rollout support
6. **Multi-tenancy**: Support multiple projects/teams
7. **Scheduling**: Schedule flag changes for future dates
8. **Approval Workflow**: Require approvals for production changes

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
brew services list

# Check connection
psql feature_flags -c "SELECT 1"
```

### Port Conflicts

```bash
# Check what's using port 3001
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### WebSocket Not Connecting

- Check CORS settings
- Verify firewall rules
- Check browser console for errors

## Support

For issues or questions:
1. Check the audit log for recent changes
2. Review server logs
3. Test API endpoints directly with curl
4. Check PostgreSQL logs: `tail -f /usr/local/var/log/postgres.log`

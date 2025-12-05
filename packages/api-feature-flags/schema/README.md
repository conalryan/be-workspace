# PostgreSQL Feature Flags Schema

This directory contains the database schema for the feature flags system.

## Setup

1. Create the database:
```bash
psql postgres -c "CREATE DATABASE feature_flags;"
```

2. Run the schema:
```bash
psql feature_flags -f schema/feature-flags.sql
```

## Schema Overview

### Table: `feature_flags`

| Column      | Type         | Description                                    |
|-------------|--------------|------------------------------------------------|
| id          | SERIAL       | Primary key                                    |
| flag_key    | VARCHAR(255) | Unique identifier for the feature flag         |
| description | TEXT         | Human-readable description                     |
| enabled     | BOOLEAN      | Whether the flag is currently enabled          |
| flag_data   | JSONB        | Flexible JSON data for flag values             |
| created_at  | TIMESTAMPTZ  | Creation timestamp                             |
| updated_at  | TIMESTAMPTZ  | Last update timestamp (auto-updated)           |

### Indexes

- `idx_feature_flags_flag_key`: B-tree index on flag_key for fast lookups
- `idx_feature_flags_enabled`: B-tree index on enabled for filtering
- `idx_feature_flags_flag_data`: GIN index on flag_data for JSONB queries

### Functions

- `get_enabled_flags()`: Returns all enabled feature flags
- `get_flag_value(flag_key)`: Returns the flag_data for a specific enabled flag
- `update_updated_at_column()`: Trigger function to update the updated_at timestamp

## JSONB Benefits

1. **Flexible Schema**: Store any JSON structure without schema changes
2. **Indexing**: GIN indexes enable fast queries on JSON properties
3. **Querying**: Use PostgreSQL's rich JSONB operators
4. **Storage**: Binary format for efficient storage and retrieval

## Example Queries

```sql
-- Get all enabled flags
SELECT * FROM get_enabled_flags();

-- Get a specific flag value
SELECT get_flag_value('a-number-flag');

-- Query JSONB data
SELECT flag_key, flag_data->>'value' as value
FROM feature_flags
WHERE flag_data ? 'value';

-- Update flag data
UPDATE feature_flags
SET flag_data = flag_data || '{"value": 100}'::jsonb
WHERE flag_key = 'a-number-flag';
```

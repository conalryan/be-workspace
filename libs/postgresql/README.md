# [PostgreSQL](https://www.postgresql.org/)

A comprehensive guide for senior software engineers to get started with PostgreSQL - the world's most advanced open-source relational database.

## Table of Contents
- [Installation & Setup](#1-installation--setup)
- [Basic Operations](#2-basic-operations)
- [Schema Design](#3-schema-design)
- [Advanced Queries](#4-advanced-queries)
- [Performance & Optimization](#5-performance--optimization)
- [Security Best Practices](#6-security-best-practices)
- [Backup & Recovery](#7-backup--recovery)
- [Monitoring & Maintenance](#8-monitoring--maintenance)
- [Connection Pooling](#9-connection-pooling)
- [Common Patterns & Anti-Patterns](#10-common-patterns--anti-patterns)

## 1. Installation & Setup

### macOS Installation
```bash
# Install PostgreSQL (latest version)
brew install postgresql@18

# Start PostgreSQL service
brew services start postgresql@18

# Verify installation
psql --version

# Check service status
brew services list | grep postgres
```

### Initial Configuration
```bash
# Connect to default postgres database
psql postgres

# Create your application database
CREATE DATABASE demo_db;

# List all databases
\l

# Connect to your database
\c demo_db

# Check current connection info
\conninfo
```

### Create Application User
```sql
-- Create a dedicated user for your application
CREATE USER app_user WITH PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE demo_db TO app_user;

-- Connect to the database first
\c demo_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;
```

## 2. Basic Operations

### Essential psql Commands
```sql
-- List databases
\l

-- Connect to database
\c database_name

-- List tables
\dt

-- Describe table structure
\d table_name
\d+ table_name  -- More details

-- List schemas
\dn

-- List users/roles
\du

-- Execute SQL from file
\i /path/to/file.sql

-- Toggle timing of queries
\timing

-- Quit
\q
```

### CRUD Operations
```sql
-- CREATE TABLE
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INSERT user
INSERT INTO users (name, email, created_at) 
VALUES ('John Doe', 'john@example.com', NOW());

-- Multiple inserts
INSERT INTO users (name, email, created_at) VALUES 
  ('Jane Smith', 'jane@example.com', NOW()),
  ('Bob Wilson', 'bob@example.com', NOW());

-- INSERT and return generated values
INSERT INTO users (name, email) 
VALUES ('Alice Brown', 'alice@example.com', NOW()) 
RETURNING id, created_at;

-- READ
SELECT * FROM users;
SELECT id, name, email FROM users WHERE email LIKE '%example.com';
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- UPDATE
UPDATE users SET name = 'John Smith' WHERE id = 1;
UPDATE users SET updated_at = NOW() WHERE email = 'john@example.com' RETURNING *;

-- DELETE
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE created_at < NOW() - INTERVAL '1 year';
```

## 3. Schema Design

### Data Types - Best Practices
```sql
-- Use appropriate numeric types
id BIGSERIAL PRIMARY KEY,           -- Auto-incrementing 64-bit integer
user_id BIGINT NOT NULL,            -- Foreign keys should match primary key type
price NUMERIC(10, 2),               -- Exact decimal for money (avoid FLOAT)
quantity INTEGER,                   -- Standard 32-bit integer
is_active BOOLEAN DEFAULT true,     -- Use BOOLEAN, not integers

-- String types
email VARCHAR(255) NOT NULL,        -- Variable length with limit
status VARCHAR(50) NOT NULL,        -- Use CHECK constraint for enums
description TEXT,                   -- Unlimited text

-- Date/Time types (always use timestamptz for timestamps)
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  -- Timezone-aware
updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
date_of_birth DATE,                 -- Date only
event_time TIME,                    -- Time only

-- JSON types
metadata JSONB,                     -- Binary JSON (preferred)
settings JSON,                      -- Text JSON (use JSONB instead)

-- Arrays
tags TEXT[],
scores INTEGER[],

-- UUID
uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,

-- ENUM types (custom)
-- CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');
CREATE TYPE user_role AS ENUM ('viewer', 'collaborator', 'creator,', 'admin');
role user_role DEFAULT 'viewer';
```

### Table Design Example
```sql
-- Users table with best practices
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_role_valid CHECK (role IN ('viewer', 'collaborator', 'creator,', 'admin'))
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;  -- Partial index
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;  -- For soft deletes

-- Trigger for updated_at
-- 1. The Function Definition
-- Creates a reusable function that can be attached to multiple tables
-- OR REPLACE allows you to update the function if it already exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- NEW: Special variable containing the new row values after the UPDATE
    -- NOW(): Gets the current timestamp
    -- RETURN NEW: Returns the modified row to be saved
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger Attachment
-- BEFORE UPDATE: Runs before the row is actually updated (allowing modification)
-- ON users: Attaches to the users table
-- FOR EACH ROW: Executes once per modified row
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Alter Table
```sql
ALTER TABLE users 
ADD COLUMN column_name data_type [constraints];

-- Add multiple columns 
ALTER TABLE users 
ADD COLUMN email VARCHAR(255) UNIQUE,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add column with NOT NULL (for existing table with data):
-- First add nullable
ALTER TABLE users ADD COLUMN age INTEGER;
-- Update existing rows
UPDATE users SET age = 0 WHERE age IS NULL;
-- Then add constraint
ALTER TABLE users ALTER COLUMN age SET NOT NULL;

-- Add column with default values
ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';

-- Add foreign key column:
ALTER TABLE users 
ADD COLUMN role_id INTEGER REFERENCES roles(id);

-- Use IF NOT EXISTS (PostgreSQL 9.6+) to avoid errors:
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- View current structure beore altering:
\d users
```

### Relationships
```sql
-- One-to-Many: Users have many posts
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT posts_status_valid CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published ON posts(published_at) WHERE published_at IS NOT NULL;

-- Many-to-Many: Posts have many tags
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE post_tags (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
```

## 4. Advanced Queries

### Joins
```sql
-- INNER JOIN
SELECT u.name, p.title, p.published_at
FROM users u
INNER JOIN posts p ON u.id = p.user_id
WHERE p.status = 'published';

-- LEFT JOIN (get all users, even without posts)
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.name
ORDER BY post_count DESC;

-- Multiple JOINs
SELECT 
    u.name as author,
    p.title,
    array_agg(t.name) as tags
FROM users u
INNER JOIN posts p ON u.id = p.user_id
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.status = 'published'
GROUP BY u.id, u.name, p.id, p.title;
```

### Window Functions
```sql
-- Ranking
SELECT 
    name,
    email,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num,
    RANK() OVER (ORDER BY created_at) as rank,
    DENSE_RANK() OVER (ORDER BY created_at) as dense_rank
FROM users;

-- Partitioning
SELECT 
    u.name,
    p.title,
    p.created_at,
    ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY p.created_at DESC) as post_number
FROM users u
INNER JOIN posts p ON u.id = p.user_id;

-- Running totals
SELECT 
    created_at::date as date,
    COUNT(*) as daily_signups,
    SUM(COUNT(*)) OVER (ORDER BY created_at::date) as cumulative_signups
FROM users
GROUP BY created_at::date
ORDER BY date;
```

### Common Table Expressions (CTEs)
```sql
-- Basic CTE
WITH active_users AS (
    SELECT id, name, email
    FROM users
    WHERE is_active = true
)
SELECT au.*, COUNT(p.id) as post_count
FROM active_users au
LEFT JOIN posts p ON au.id = p.user_id
GROUP BY au.id, au.name, au.email;

-- Recursive CTE (hierarchical data)
WITH RECURSIVE org_chart AS (
    -- Base case: top-level managers
    SELECT id, name, manager_id, 1 as level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case
    SELECT e.id, e.name, e.manager_id, oc.level + 1
    FROM employees e
    INNER JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY level, name;
```

### JSON Operations
```sql
-- Query JSONB data
SELECT 
    id,
    metadata->>'name' as name,
    metadata->'settings'->>'theme' as theme
FROM products
WHERE metadata @> '{"active": true}';

-- Update JSONB
UPDATE products
SET metadata = metadata || '{"featured": true}'::jsonb
WHERE id = 1;

-- Array operations
SELECT * FROM posts WHERE tags @> ARRAY['postgresql'];
SELECT * FROM posts WHERE 'postgresql' = ANY(tags);
```

### Aggregations & Grouping
```sql
-- Basic aggregation
SELECT 
    status,
    COUNT(*) as count,
    AVG(view_count) as avg_views,
    MAX(created_at) as latest_post
FROM posts
GROUP BY status;

-- HAVING clause
SELECT 
    user_id,
    COUNT(*) as post_count
FROM posts
WHERE status = 'published'
GROUP BY user_id
HAVING COUNT(*) >= 10;

-- FILTER clause
SELECT 
    user_id,
    COUNT(*) as total_posts,
    COUNT(*) FILTER (WHERE status = 'published') as published_posts,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_posts
FROM posts
GROUP BY user_id;
```

## 5. Performance & Optimization

### Indexes
```sql
-- B-tree index (default, good for equality and range queries)
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_posts_user_status ON posts(user_id, status);

-- Partial index (smaller, faster for specific queries)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- Unique index
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Expression index
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- GIN index for full-text search
CREATE INDEX idx_posts_content_gin ON posts USING gin(to_tsvector('english', content));

-- GiST index for geometric data
CREATE INDEX idx_locations_geom ON locations USING gist(geom);

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexname NOT LIKE 'pg_%';
```

### Query Analysis
```sql
-- EXPLAIN shows query plan
EXPLAIN SELECT * FROM users WHERE email = 'john@example.com';

-- EXPLAIN ANALYZE actually runs the query
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'john@example.com';

-- More detailed analysis
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT u.*, COUNT(p.id)
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id;
```

### Optimization Techniques
```sql
-- Use LIMIT when you don't need all results
SELECT * FROM posts ORDER BY created_at DESC LIMIT 10;

-- Avoid SELECT * in production
SELECT id, name, email FROM users;  -- Better

-- Use EXISTS instead of COUNT for boolean checks
-- Bad
SELECT * FROM users WHERE (SELECT COUNT(*) FROM posts WHERE user_id = users.id) > 0;
-- Good
SELECT * FROM users WHERE EXISTS (SELECT 1 FROM posts WHERE user_id = users.id);

-- Batch inserts
INSERT INTO users (name, email) VALUES 
    ('User 1', 'user1@example.com'),
    ('User 2', 'user2@example.com'),
    ('User 3', 'user3@example.com');

-- Use COPY for bulk imports
COPY users(name, email) FROM '/path/to/users.csv' WITH CSV HEADER;
```

### Vacuuming
```sql
-- Manual vacuum (reclaim storage)
VACUUM ANALYZE users;

-- Full vacuum (locks table, reclaims more space)
VACUUM FULL users;

-- Check table bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 6. Security Best Practices

### User & Role Management
```sql
-- Create roles with specific privileges
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE demo_db TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;

CREATE ROLE readwrite;
GRANT CONNECT ON DATABASE demo_db TO readwrite;
GRANT USAGE, CREATE ON SCHEMA public TO readwrite;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readwrite;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO readwrite;

-- Create users with roles
CREATE USER reporting_user WITH PASSWORD 'secure_password';
GRANT readonly TO reporting_user;

CREATE USER app_backend WITH PASSWORD 'secure_password';
GRANT readwrite TO app_backend;

-- Revoke public access
REVOKE ALL ON DATABASE demo_db FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

### Row-Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own posts
CREATE POLICY user_posts ON posts
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::bigint);

-- Policy: admins can see everything
CREATE POLICY admin_posts ON posts
    FOR ALL
    USING (current_setting('app.user_role') = 'admin');

-- Set session variables
SET app.current_user_id = '123';
SET app.user_role = 'user';
```

### SQL Injection Prevention
```sql
-- NEVER do this (vulnerable to SQL injection):
-- query = "SELECT * FROM users WHERE email = '" + userInput + "'";

-- Use parameterized queries instead (application code example):
-- Python: cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
-- Node.js: pool.query("SELECT * FROM users WHERE email = $1", [email])

-- Use prepared statements
PREPARE get_user AS SELECT * FROM users WHERE email = $1;
EXECUTE get_user('john@example.com');
DEALLOCATE get_user;
```

## 7. Backup & Recovery

### Logical Backups with pg_dump
```bash
# Backup single database
pg_dump demo_db > demo_db_backup.sql
pg_dump -Fc demo_db > demo_db_backup.dump  # Custom format (compressed)

# Backup specific tables
pg_dump demo_db -t users -t posts > tables_backup.sql

# Backup schema only
pg_dump -s demo_db > schema_backup.sql

# Backup data only
pg_dump -a demo_db > data_backup.sql

# Restore from backup
psql demo_db < demo_db_backup.sql
pg_restore -d demo_db demo_db_backup.dump  # For custom format

# Backup all databases
pg_dumpall > all_databases_backup.sql
```

### Point-in-Time Recovery (PITR)
```sql
-- Enable WAL archiving (in postgresql.conf)
-- wal_level = replica
-- archive_mode = on
-- archive_command = 'cp %p /path/to/archive/%f'

-- Create base backup
SELECT pg_start_backup('backup_label');
-- Copy data directory
SELECT pg_stop_backup();

-- Restore to specific point in time
-- 1. Restore base backup
-- 2. Create recovery.conf with: recovery_target_time = '2024-12-03 10:30:00'
-- 3. Start PostgreSQL
```

### Continuous Archiving
```bash
# Create scheduled backups (cron example)
# 0 2 * * * pg_dump -Fc demo_db > /backups/demo_db_$(date +\%Y\%m\%d).dump

# Rotate old backups
# find /backups -name "demo_db_*.dump" -mtime +30 -delete
```

## 8. Monitoring & Maintenance

### Key System Views
```sql
-- Active queries
SELECT 
    pid,
    now() - query_start as duration,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Kill long-running query
SELECT pg_cancel_backend(pid);  -- Graceful
SELECT pg_terminate_backend(pid);  -- Force

-- Database size
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cache hit ratio (should be > 99%)
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_stattastic;

-- Index hit ratio
SELECT 
    sum(idx_blks_read) as idx_read,
    sum(idx_blks_hit) as idx_hit,
    sum(idx_blks_hit) / nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0) * 100 as index_hit_ratio
FROM pg_statio_user_indexes;

-- Slow queries (requires pg_stat_statements extension)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT 
    calls,
    mean_exec_time,
    total_exec_time,
    query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Maintenance Tasks
```sql
-- Analyze tables (update statistics)
ANALYZE users;
ANALYZE;  -- All tables

-- Reindex
REINDEX TABLE users;
REINDEX INDEX idx_users_email;

-- Check for bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_table_size(schemaname||'.'||tablename)) as size,
    n_dead_tup,
    n_live_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

## 9. Connection Pooling

### PgBouncer Setup
```bash
# Install PgBouncer
brew install pgbouncer

# Configure pgbouncer.ini
cat > /opt/homebrew/etc/pgbouncer.ini << EOF
[databases]
demo_db = host=localhost port=5432 dbname=demo_db

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /opt/homebrew/etc/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
EOF

# Create userlist.txt
echo '"app_user" "md5<password_hash>"' > /opt/homebrew/etc/userlist.txt

# Start PgBouncer
pgbouncer -d /opt/homebrew/etc/pgbouncer.ini
```

### Application Connection Strings
```bash
# Direct connection
postgres://app_user:password@localhost:5432/demo_db

# Through PgBouncer
postgres://app_user:password@localhost:6432/demo_db

# With SSL
postgres://app_user:password@localhost:5432/demo_db?sslmode=require
```

### Connection Pool Settings (Application Side)
```javascript
// Node.js example
const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'demo_db',
    user: 'app_user',
    password: 'password',
    max: 20,  // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
```

## 10. Common Patterns & Anti-Patterns

### ✅ Good Patterns

#### Use Transactions for Data Integrity
```sql
BEGIN;
    INSERT INTO orders (user_id, total) VALUES (1, 100.00);
    UPDATE inventory SET quantity = quantity - 1 WHERE product_id = 5;
    INSERT INTO order_items (order_id, product_id, quantity) VALUES (currval('orders_id_seq'), 5, 1);
COMMIT;
```

#### Soft Deletes
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;

-- "Delete" record
UPDATE users SET deleted_at = NOW() WHERE id = 1;

-- Query active records
SELECT * FROM users WHERE deleted_at IS NULL;
```

#### Audit Trail
```sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (table_name, record_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to table
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### ❌ Anti-Patterns to Avoid

#### Don't Use OFFSET for Large Pagination
```sql
-- Bad (slow for large offsets)
SELECT * FROM posts ORDER BY id LIMIT 10 OFFSET 10000;

-- Good (keyset pagination)
SELECT * FROM posts WHERE id > 10000 ORDER BY id LIMIT 10;
```

#### Don't Use Float for Money
```sql
-- Bad
CREATE TABLE products (price FLOAT);

-- Good
CREATE TABLE products (price NUMERIC(10, 2));
```

#### Don't Use LIKE for Full-Text Search
```sql
-- Bad (slow, can't use indexes)
SELECT * FROM posts WHERE content LIKE '%postgresql%';

-- Good (use full-text search)
CREATE INDEX idx_posts_content_fts ON posts USING gin(to_tsvector('english', content));
SELECT * FROM posts WHERE to_tsvector('english', content) @@ to_tsquery('postgresql');
```

#### Avoid N+1 Queries
```sql
-- Bad: Separate query for each user's posts
-- SELECT * FROM users;
-- For each user: SELECT * FROM posts WHERE user_id = ?

-- Good: Single query with JOIN
SELECT u.*, p.* 
FROM users u
LEFT JOIN posts p ON u.id = p.user_id;

-- Or use aggregation
SELECT 
    u.*,
    json_agg(p.*) as posts
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id;
```

## Additional Resources

- **Official Documentation**: https://www.postgresql.org/docs/
- **PostgreSQL Wiki**: https://wiki.postgresql.org/
- **Performance Tuning**: https://wiki.postgresql.org/wiki/Performance_Optimization
- **PgExercises**: https://pgexercises.com/ (Interactive SQL exercises)
- **Explain.depesz.com**: https://explain.depesz.com/ (EXPLAIN plan visualizer)

## Quick Reference Card

```bash
# Service Management
brew services start postgresql@18
brew services stop postgresql@18
brew services restart postgresql@18

# Database Operations
createdb mydb
dropdb mydb
psql mydb

# Backup & Restore
pg_dump mydb > backup.sql
psql mydb < backup.sql

# User Management
createuser myuser
dropuser myuser
```

**Pro Tips for Senior Engineers:**
1. Always use `TIMESTAMPTZ` instead of `TIMESTAMP` to handle timezones properly
2. Set up connection pooling (PgBouncer/pgpool) for production applications
3. Monitor slow queries with `pg_stat_statements` extension
4. Use partial indexes for commonly queried subsets
5. Implement read replicas for read-heavy workloads
6. Use `EXPLAIN ANALYZE` regularly to understand query performance
7. Keep PostgreSQL and extensions up to date for security and performance
8. Use migrations tools (Flyway, Liquibase, or framework-specific) for schema changes
9. Configure appropriate `work_mem`, `shared_buffers`, and `effective_cache_size` for your workload
10. Always use prepared statements to prevent SQL injection


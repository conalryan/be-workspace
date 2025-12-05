-- Common PostgreSQL queries for managing feature flags

-- ============================================================================
-- QUERYING FLAGS
-- ============================================================================

-- Get all flags with their configurations for staging
SELECT 
    f.key,
    f.name,
    f.type,
    fc.enabled,
    fc.config
FROM feature_flags f
JOIN feature_flag_configs fc ON f.id = fc.flag_id
JOIN environments e ON fc.environment_id = e.id
WHERE e.name = 'staging' AND NOT f.archived
ORDER BY f.key;

-- Get flags that are enabled in production
SELECT f.key, f.name, fc.config
FROM feature_flags f
JOIN feature_flag_configs fc ON f.id = fc.flag_id
JOIN environments e ON fc.environment_id = e.id
WHERE e.name = 'production' 
  AND fc.enabled = true
  AND NOT f.archived;

-- Search flags by tag
SELECT * FROM feature_flags
WHERE 'beta' = ANY(tags)
  AND NOT archived;

-- Get flags with boolean type and their values
SELECT 
    f.key,
    e.name as environment,
    fc.config->>'value' as value
FROM feature_flags f
JOIN feature_flag_configs fc ON f.id = fc.flag_id
JOIN environments e ON fc.environment_id = e.id
WHERE f.type = 'boolean'
  AND NOT f.archived
ORDER BY f.key, e.name;

-- ============================================================================
-- QUERYING JSON CONFIGURATIONS
-- ============================================================================

-- Get flags where config.value.enabled = true
SELECT 
    f.key,
    e.name as environment,
    fc.config
FROM feature_flags f
JOIN feature_flag_configs fc ON f.id = fc.flag_id
JOIN environments e ON fc.environment_id = e.id
WHERE fc.config->'value'->>'enabled' = 'true';

-- Get flags with specific variation
SELECT f.key, e.name, fc.config
FROM feature_flags f
JOIN feature_flag_configs fc ON f.id = fc.flag_id
JOIN environments e ON fc.environment_id = e.id
WHERE (fc.config->>'variation')::int = 0;

-- Get flags where config contains a specific key
SELECT f.key, e.name, fc.config
FROM feature_flags f
JOIN feature_flag_configs fc ON f.id = fc.flag_id
JOIN environments e ON fc.environment_id = e.id
WHERE fc.config->'value' ? 'beta';

-- ============================================================================
-- UPDATING FLAGS
-- ============================================================================

-- Toggle a flag on/off for production
UPDATE feature_flag_configs fc
SET 
    enabled = true,
    config = jsonb_set(config, '{value}', 'true'::jsonb)
FROM feature_flags f
JOIN environments e ON fc.environment_id = e.id
WHERE fc.flag_id = f.id 
  AND f.key = 'databasePremium'
  AND e.name = 'production';

-- Update nested JSON property (e.g., set beta flag to false)
UPDATE feature_flag_configs fc
SET config = jsonb_set(config, '{value,beta}', 'false'::jsonb)
FROM feature_flags f
JOIN environments e ON fc.environment_id = e.id
WHERE fc.flag_id = f.id 
  AND f.key = 'aclp'
  AND e.name = 'staging';

-- Increment version number
UPDATE feature_flag_configs fc
SET 
    version = version + 1,
    config = jsonb_set(config, '{version}', ((config->>'version')::int + 1)::text::jsonb)
FROM feature_flags f
WHERE fc.flag_id = f.id AND f.key = 'myFlag';

-- Update flag description
UPDATE feature_flags
SET description = 'New description here'
WHERE key = 'databasePremium';

-- Add a tag to a flag
UPDATE feature_flags
SET tags = array_append(tags, 'new-tag')
WHERE key = 'databasePremium'
  AND NOT 'new-tag' = ANY(tags);

-- Remove a tag from a flag
UPDATE feature_flags
SET tags = array_remove(tags, 'old-tag')
WHERE key = 'databasePremium';

-- ============================================================================
-- AUDIT & HISTORY
-- ============================================================================

-- Get recent changes (last 50)
SELECT 
    al.created_at,
    f.key as flag_key,
    e.name as environment,
    al.action,
    al.user_email,
    al.before_config,
    al.after_config
FROM feature_flag_audit_log al
LEFT JOIN feature_flags f ON al.flag_id = f.id
LEFT JOIN environments e ON al.environment_id = e.id
ORDER BY al.created_at DESC
LIMIT 50;

-- Get all changes for a specific flag
SELECT 
    al.created_at,
    e.name as environment,
    al.action,
    al.user_email,
    al.after_config->'config' as new_config
FROM feature_flag_audit_log al
JOIN feature_flags f ON al.flag_id = f.id
LEFT JOIN environments e ON al.environment_id = e.id
WHERE f.key = 'databasePremium'
ORDER BY al.created_at DESC;

-- Get changes by user
SELECT 
    al.created_at,
    f.key as flag_key,
    al.action
FROM feature_flag_audit_log al
LEFT JOIN feature_flags f ON al.flag_id = f.id
WHERE al.user_email = 'admin@example.com'
ORDER BY al.created_at DESC;

-- Find who last modified a flag
SELECT 
    al.created_at,
    al.user_email,
    al.action
FROM feature_flag_audit_log al
JOIN feature_flags f ON al.flag_id = f.id
WHERE f.key = 'databasePremium'
ORDER BY al.created_at DESC
LIMIT 1;

-- ============================================================================
-- STATISTICS & REPORTING
-- ============================================================================

-- Count flags by type
SELECT type, COUNT(*) 
FROM feature_flags 
WHERE NOT archived
GROUP BY type;

-- Count enabled vs disabled flags per environment
SELECT 
    e.name as environment,
    COUNT(CASE WHEN fc.enabled THEN 1 END) as enabled_count,
    COUNT(CASE WHEN NOT fc.enabled THEN 1 END) as disabled_count,
    COUNT(*) as total
FROM feature_flag_configs fc
JOIN environments e ON fc.environment_id = e.id
JOIN feature_flags f ON fc.flag_id = f.id
WHERE NOT f.archived
GROUP BY e.name;

-- Most frequently updated flags (last 30 days)
SELECT 
    f.key,
    f.name,
    COUNT(*) as change_count
FROM feature_flag_audit_log al
JOIN feature_flags f ON al.flag_id = f.id
WHERE al.created_at > NOW() - INTERVAL '30 days'
GROUP BY f.key, f.name
ORDER BY change_count DESC
LIMIT 10;

-- Flags not updated in last 90 days
SELECT 
    f.key,
    f.name,
    f.updated_at
FROM feature_flags f
WHERE f.updated_at < NOW() - INTERVAL '90 days'
  AND NOT f.archived
ORDER BY f.updated_at;

-- ============================================================================
-- MAINTENANCE
-- ============================================================================

-- Archive old flags
UPDATE feature_flags
SET archived = true
WHERE updated_at < NOW() - INTERVAL '1 year'
  AND NOT archived;

-- Clean up old audit logs (keep last 6 months)
DELETE FROM feature_flag_audit_log
WHERE created_at < NOW() - INTERVAL '6 months';

-- Vacuum tables (reclaim space)
VACUUM ANALYZE feature_flags;
VACUUM ANALYZE feature_flag_configs;
VACUUM ANALYZE feature_flag_audit_log;

-- Check database size
SELECT pg_size_pretty(pg_database_size('feature_flags'));

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- DEBUGGING
-- ============================================================================

-- Find duplicate flag keys (should be none due to unique constraint)
SELECT key, COUNT(*) 
FROM feature_flags 
GROUP BY key 
HAVING COUNT(*) > 1;

-- Find flags without configs
SELECT f.key
FROM feature_flags f
LEFT JOIN feature_flag_configs fc ON f.id = fc.flag_id
WHERE fc.id IS NULL;

-- Find orphaned configs (should be none due to foreign key)
SELECT fc.id
FROM feature_flag_configs fc
LEFT JOIN feature_flags f ON fc.flag_id = f.id
WHERE f.id IS NULL;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================================================
-- BACKUP & EXPORT
-- ============================================================================

-- Export all flags for staging as JSON (use psql with -t -A flags)
-- psql feature_flags -t -A -c "SELECT json_object_agg(f.key, fc.config) FROM feature_flags f JOIN feature_flag_configs fc ON f.id = fc.flag_id JOIN environments e ON fc.environment_id = e.id WHERE e.name = 'staging' AND NOT f.archived" > staging-flags.json

-- Export flag definitions only
COPY (
    SELECT key, name, type, description, enabled, tags
    FROM feature_flags
    WHERE NOT archived
) TO '/tmp/flags.csv' WITH CSV HEADER;

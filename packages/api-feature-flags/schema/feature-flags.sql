-- Feature Flags Database Schema
-- This schema stores feature flags using PostgreSQL JSONB for flexible flag configurations

-- Create the database
-- Run this separately first: CREATE DATABASE feature_flags;

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    flag_key VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    flag_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_data ON feature_flags USING GIN (flag_data);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data from the existing feature flags JSON
INSERT INTO feature_flags (flag_key, description, enabled, flag_data) VALUES
    ('a-boolean-flag', 'Test a boolean flag', false, '{}'::jsonb),
    ('a-number-flag', 'Test a number flag', false, '{"value": 42}'::jsonb),
    ('a-string-flag', 'Test a string flag', false, '{"value": "A string value"}'::jsonb),
    ('a-json-flag', 'Test a JSON flag', false, '{"value": {"foo": "value1", "bar": 2, "isBaz": true, "quxes": [1, 2, 3]}}'::jsonb)
ON CONFLICT (flag_key) DO NOTHING;

-- Helper function to get all enabled flags
CREATE OR REPLACE FUNCTION get_enabled_flags()
RETURNS TABLE (
    flag_key VARCHAR,
    description TEXT,
    enabled BOOLEAN,
    flag_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT ff.flag_key, ff.description, ff.enabled, ff.flag_data
    FROM feature_flags ff
    WHERE ff.enabled = true
    ORDER BY ff.flag_key;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get flag value by key
CREATE OR REPLACE FUNCTION get_flag_value(p_flag_key VARCHAR)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT flag_data INTO result
    FROM feature_flags
    WHERE flag_key = p_flag_key AND enabled = true;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE feature_flags IS 'Stores feature flags with JSONB data for flexible configurations';
COMMENT ON COLUMN feature_flags.flag_key IS 'Unique identifier for the feature flag';
COMMENT ON COLUMN feature_flags.description IS 'Human-readable description of the feature flag';
COMMENT ON COLUMN feature_flags.enabled IS 'Whether the feature flag is currently enabled';
COMMENT ON COLUMN feature_flags.flag_data IS 'JSONB column storing the flag value and additional configuration';
COMMENT ON COLUMN feature_flags.created_at IS 'Timestamp when the flag was created';
COMMENT ON COLUMN feature_flags.updated_at IS 'Timestamp when the flag was last updated';


-- Create a dedicated user for your application
CREATE USER app_user WITH PASSWORD 'secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE feature_flags TO app_user;

-- Connect to the database first
\c feature_flags

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;
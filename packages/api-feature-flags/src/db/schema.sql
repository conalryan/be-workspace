-- Feature Flags Database Schema for PostgreSQL with JSONB
-- This schema supports a Launch Darkly-style feature flag system

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Environments table (e.g., development, staging, production)
CREATE TABLE environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Feature flags table with JSONB for flexible configuration
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'boolean', -- boolean, string, number, json
    enabled BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    tags TEXT[],

    -- GIN index for faster JSONB queries
    CONSTRAINT valid_type CHECK (type IN ('boolean', 'string', 'number', 'json'))
);

-- Feature flag configurations per environment
CREATE TABLE feature_flag_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    environment_id UUID NOT NULL REFERENCES environments(id) ON DELETE CASCADE,

    -- Store the complete flag configuration as JSONB (variations, rules, targeting, etc.)
    config JSONB NOT NULL DEFAULT '{}',

    -- Quick access fields (duplicated from config for performance)
    enabled BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    flag_version INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(flag_id, environment_id)
);

-- Audit log for tracking all changes
CREATE TABLE feature_flag_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_id UUID REFERENCES feature_flags(id) ON DELETE SET NULL,
    environment_id UUID REFERENCES environments(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, toggled
    user_id VARCHAR(255),
    user_email VARCHAR(255),

    -- Store before and after states
    before_config JSONB,
    after_config JSONB,

    -- Additional context
    changes JSONB, -- Specific fields that changed
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_action CHECK (action IN ('created', 'updated', 'deleted', 'toggled', 'archived'))
);

-- User targeting segments (for advanced targeting)
CREATE TABLE user_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '[]', -- Array of targeting rules
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Flag prerequisites (flags that depend on other flags)
CREATE TABLE flag_prerequisites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    prerequisite_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    variation_index INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(flag_id, prerequisite_flag_id)
);

-- Indexes for performance
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled) WHERE NOT archived;
CREATE INDEX idx_feature_flags_archived ON feature_flags(archived);
CREATE INDEX idx_feature_flags_tags ON feature_flags USING GIN(tags);

CREATE INDEX idx_flag_configs_flag_id ON feature_flag_configs(flag_id);
CREATE INDEX idx_flag_configs_env_id ON feature_flag_configs(environment_id);
CREATE INDEX idx_flag_configs_enabled ON feature_flag_configs(enabled);
-- GIN index for JSONB config field to enable fast queries
CREATE INDEX idx_flag_configs_config ON feature_flag_configs USING GIN(config);

CREATE INDEX idx_audit_log_flag_id ON feature_flag_audit_log(flag_id);
CREATE INDEX idx_audit_log_env_id ON feature_flag_audit_log(environment_id);
CREATE INDEX idx_audit_log_created_at ON feature_flag_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON feature_flag_audit_log(action);

CREATE INDEX idx_user_segments_key ON user_segments(key);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flag_configs_updated_at BEFORE UPDATE ON feature_flag_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environments_updated_at BEFORE UPDATE ON environments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_segments_updated_at BEFORE UPDATE ON user_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default environments
INSERT INTO environments (name, description) VALUES
    ('development', 'Development environment'),
    ('staging', 'Staging/Testing environment'),
    ('production', 'Production environment');

-- Example view for easy flag retrieval with config
CREATE VIEW v_feature_flags_by_environment AS
SELECT
    e.name as environment,
    f.key,
    f.name,
    f.type,
    f.description,
    f.enabled as flag_enabled,
    f.archived,
    fc.config,
    fc.enabled as config_enabled,
    fc.version,
    fc.flag_version,
    f.tags,
    f.updated_at as flag_updated_at,
    fc.updated_at as config_updated_at
FROM feature_flags f
CROSS JOIN environments e
LEFT JOIN feature_flag_configs fc ON f.id = fc.flag_id AND e.id = fc.environment_id
WHERE NOT f.archived
ORDER BY f.key, e.name;

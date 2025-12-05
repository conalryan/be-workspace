-- Sample data migration to populate the database with Launch Darkly-style flags

-- Example: Boolean flag
DO $$
DECLARE
    flag_id UUID;
    dev_env_id UUID;
    staging_env_id UUID;
    prod_env_id UUID;
BEGIN
    -- Get environment IDs
    SELECT id INTO dev_env_id FROM environments WHERE name = 'development';
    SELECT id INTO staging_env_id FROM environments WHERE name = 'staging';
    SELECT id INTO prod_env_id FROM environments WHERE name = 'production';

    -- Create a simple boolean flag
    INSERT INTO feature_flags (key, name, description, type, enabled, tags, created_by)
    VALUES (
        'databasePremium',
        'Database Premium Plans',
        'Enable premium database plans feature',
        'boolean',
        true,
        ARRAY['database', 'premium'],
        'admin@example.com'
    )
    RETURNING id INTO flag_id;

    -- Development config (enabled)
    INSERT INTO feature_flag_configs (flag_id, environment_id, config, enabled, version, flag_version)
    VALUES (
        flag_id,
        dev_env_id,
        jsonb_build_object(
            'flagVersion', 1,
            'trackEvents', false,
            'value', true,
            'variation', 0,
            'version', 1
        ),
        true,
        1,
        1
    );

    -- Staging config (enabled)
    INSERT INTO feature_flag_configs (flag_id, environment_id, config, enabled, version, flag_version)
    VALUES (
        flag_id,
        staging_env_id,
        jsonb_build_object(
            'flagVersion', 1,
            'trackEvents', false,
            'value', true,
            'variation', 0,
            'version', 1
        ),
        true,
        1,
        1
    );

    -- Production config (disabled)
    INSERT INTO feature_flag_configs (flag_id, environment_id, config, enabled, version, flag_version)
    VALUES (
        flag_id,
        prod_env_id,
        jsonb_build_object(
            'flagVersion', 1,
            'trackEvents', false,
            'value', false,
            'variation', 1,
            'version', 1
        ),
        false,
        1,
        1
    );
END $$;

-- Example: JSON object flag (complex config like ACLP)
DO $$
DECLARE
    flag_id UUID;
    dev_env_id UUID;
    staging_env_id UUID;
    prod_env_id UUID;
BEGIN
    SELECT id INTO dev_env_id FROM environments WHERE name = 'development';
    SELECT id INTO staging_env_id FROM environments WHERE name = 'staging';
    SELECT id INTO prod_env_id FROM environments WHERE name = 'production';

    INSERT INTO feature_flags (key, name, description, type, enabled, tags, created_by)
    VALUES (
        'aclp',
        'Akamai Cloud Pulse',
        'Cloud monitoring and alerting platform',
        'json',
        true,
        ARRAY['monitoring', 'cloudpulse'],
        'admin@example.com'
    )
    RETURNING id INTO flag_id;

    -- All environments get the same complex config
    INSERT INTO feature_flag_configs (flag_id, environment_id, config, enabled, version, flag_version)
    VALUES (
        flag_id,
        staging_env_id,
        jsonb_build_object(
            'flagVersion', 9,
            'trackEvents', false,
            'value', jsonb_build_object(
                'beta', false,
                'bypassAccountCapabilities', true,
                'enabled', true,
                'showWidgetDimensionFilters', false
            ),
            'variation', 1,
            'version', 435
        ),
        true,
        435,
        9
    );
END $$;

-- Example: Array/List flag
DO $$
DECLARE
    flag_id UUID;
    staging_env_id UUID;
BEGIN
    SELECT id INTO staging_env_id FROM environments WHERE name = 'staging';

    INSERT INTO feature_flags (key, name, description, type, enabled, tags, created_by)
    VALUES (
        'aclpAlertServiceTypeConfig',
        'ACLP Alert Service Type Configuration',
        'Configuration for alert service types',
        'json',
        true,
        ARRAY['monitoring', 'alerts'],
        'admin@example.com'
    )
    RETURNING id INTO flag_id;

    INSERT INTO feature_flag_configs (flag_id, environment_id, config, enabled, version, flag_version)
    VALUES (
        flag_id,
        staging_env_id,
        jsonb_build_object(
            'flagVersion', 5,
            'trackEvents', false,
            'value', jsonb_build_array(
                jsonb_build_object(
                    'maxResourceSelectionCount', 100,
                    'serviceType', 'dbaas'
                )
            ),
            'variation', 0,
            'version', 435
        ),
        true,
        435,
        5
    );
END $$;

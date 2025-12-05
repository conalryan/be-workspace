import { pool } from '../config/database';
import { FeatureFlag, CreateFeatureFlagDto, UpdateFeatureFlagDto } from '../types/feature-flag.types';

export class FeatureFlagService {
  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    const query = `
      SELECT id, flag_key, description, enabled, flag_data, created_at, updated_at
      FROM feature_flags
      ORDER BY flag_key
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get a specific feature flag by key
   */
  async getFlagByKey(flagKey: string): Promise<FeatureFlag | null> {
    const query = `
      SELECT id, flag_key, description, enabled, flag_data, created_at, updated_at
      FROM feature_flags
      WHERE flag_key = $1
    `;
    const result = await pool.query(query, [flagKey]);
    return result.rows[0] || null;
  }

  /**
   * Get only enabled feature flags
   */
  async getEnabledFlags(): Promise<FeatureFlag[]> {
    const query = `
      SELECT id, flag_key, description, enabled, flag_data, created_at, updated_at
      FROM feature_flags
      WHERE enabled = true
      ORDER BY flag_key
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Create a new feature flag
   */
  async createFlag(data: CreateFeatureFlagDto): Promise<FeatureFlag> {
    const query = `
      INSERT INTO feature_flags (flag_key, description, enabled, flag_data)
      VALUES ($1, $2, $3, $4)
      RETURNING id, flag_key, description, enabled, flag_data, created_at, updated_at
    `;
    const values = [
      data.flag_key,
      data.description || '',
      data.enabled ?? false,
      JSON.stringify(data.flag_data || {}),
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update an existing feature flag
   */
  async updateFlag(flagKey: string, data: UpdateFeatureFlagDto): Promise<FeatureFlag | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (data.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(data.enabled);
    }

    if (data.flag_data !== undefined) {
      updates.push(`flag_data = $${paramIndex++}`);
      values.push(JSON.stringify(data.flag_data));
    }

    if (updates.length === 0) {
      return this.getFlagByKey(flagKey);
    }

    values.push(flagKey);
    const query = `
      UPDATE feature_flags
      SET ${updates.join(', ')}
      WHERE flag_key = $${paramIndex}
      RETURNING id, flag_key, description, enabled, flag_data, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(flagKey: string): Promise<boolean> {
    const query = `
      DELETE FROM feature_flags
      WHERE flag_key = $1
      RETURNING id
    `;
    const result = await pool.query(query, [flagKey]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Toggle a feature flag's enabled state
   */
  async toggleFlag(flagKey: string): Promise<FeatureFlag | null> {
    const query = `
      UPDATE feature_flags
      SET enabled = NOT enabled
      WHERE flag_key = $1
      RETURNING id, flag_key, description, enabled, flag_data, created_at, updated_at
    `;
    const result = await pool.query(query, [flagKey]);
    return result.rows[0] || null;
  }

  /**
   * Search flags by description or key
   */
  async searchFlags(searchTerm: string): Promise<FeatureFlag[]> {
    const query = `
      SELECT id, flag_key, description, enabled, flag_data, created_at, updated_at
      FROM feature_flags
      WHERE flag_key ILIKE $1 OR description ILIKE $1
      ORDER BY flag_key
    `;
    const result = await pool.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }
}

import { db } from '../db/feature-flag.dbconfig';
import { BEFeatureFlag, UIFeatureFlag } from '../types/feature-flag.types';

/** Service layer for feature flag operations */
class FeatureFlagService {

  /** Archive a flag (soft delete) */
  async archiveFlag(flagKey: string, userId?: string): Promise<void> {
    return db.transaction(async (client) => {
      const result = await client.query<BEFeatureFlag>(
        `UPDATE feature_flags SET archived = true WHERE key = $1 RETURNING *`,
        [flagKey]
      );

      if (result.rows.length === 0) {
        throw new Error(`Flag ${flagKey} not found`);
      }
    });
  }

  /** Create a new feature flag */
  async createFlag(input: UIFeatureFlag): Promise<BEFeatureFlag> {
    return db.transaction(async (client) => {
      const flagResult = await client.query<BEFeatureFlag>(
        `INSERT INTO feature_flags (name, description, enabled)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          input.name,
          input.description,
          input.enabled ?? false
        ]
      );

      const flag = flagResult.rows[0];
      return flag;
    });
  }

  /** Get all feature flags */
  async getAllFlags(includeArchived = false): Promise<BEFeatureFlag[]> {
    const query = includeArchived
      ? 'SELECT * FROM feature_flags ORDER BY name'
      : 'SELECT * FROM feature_flags WHERE NOT archived ORDER BY name';

    const result = await db.query<BEFeatureFlag>(query);
    return result.rows;
  }

  /** Get a single flag by name */
  async getFlagByName(name: string): Promise<BEFeatureFlag | null> {
    const result = await db.query<BEFeatureFlag>(
      'SELECT * FROM feature_flags WHERE name = $1 AND NOT archived',
      [name]
    );

    const flag = result.rows[0] || null;
    return flag;
  }

  /**
   * Toggle a flag on/off for a specific environment
   */
  async toggleFlag(
    name: string,
    enabled: boolean,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    return db.transaction(async (client) => {
      const result = await client.query(
        `UPDATE feature_flag_configs fc
         SET enabled = $1, config = jsonb_set(config, '{value}', $2::jsonb)
         FROM feature_flags f
         JOIN environments e ON fc.environment_id = e.id
         WHERE fc.flag_id = f.id AND f.key = $3 AND e.name = $4
         RETURNING fc.flag_id, fc.environment_id`,
        [enabled, enabled.toString(), name]
      );
    });
  }

  // /**
  //  * Update a feature flag
  //  */
  // async updateFlag(flagKey: string, input: UpdateFlagInput, userId?: string): Promise<FeatureFlag> {
  //   return db.transaction(async (client) => {
  //     const beforeResult = await client.query<FeatureFlag>(
  //       'SELECT * FROM feature_flags WHERE key = $1',
  //       [flagKey]
  //     );
  //     const before = beforeResult.rows[0];

  //     if (!before) {
  //       throw new Error(`Flag ${flagKey} not found`);
  //     }

  //     const updateFields: string[] = [];
  //     const values: any[] = [];
  //     let paramCount = 1;

  //     if (input.name !== undefined) {
  //       updateFields.push(`name = $${paramCount++}`);
  //       values.push(input.name);
  //     }
  //     if (input.description !== undefined) {
  //       updateFields.push(`description = $${paramCount++}`);
  //       values.push(input.description);
  //     }
  //     if (input.enabled !== undefined) {
  //       updateFields.push(`enabled = $${paramCount++}`);
  //       values.push(input.enabled);
  //     }
  //     if (input.tags !== undefined) {
  //       updateFields.push(`tags = $${paramCount++}`);
  //       values.push(input.tags);
  //     }

  //     values.push(flagKey);

  //     const result = await client.query<FeatureFlag>(
  //       `UPDATE feature_flags SET ${updateFields.join(
  //         ', '
  //       )} WHERE key = $${paramCount} RETURNING *`,
  //       values
  //     );

  //     const after = result.rows[0];

  //     await this.logAudit(client, {
  //       action: 'updated',
  //       after_config: after,
  //       before_config: before,
  //       flag_id: after.id,
  //       user_id: userId,
  //     });

  //     this.invalidateCache();
  //     return after;
  //   });
  // }
}

export const featureFlagService = new FeatureFlagService();
export default featureFlagService;

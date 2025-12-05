import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * Database configuration and connection pool for feature flags
 */

interface DatabaseConfig {
  connectionTimeoutMillis?: number;
  database: string;
  host: string;
  idleTimeoutMillis?: number;
  max?: number; // Maximum number of clients in the pool
  password: string;
  port: number;
  ssl?: boolean | object;
  user: string;
}

class FeatureFlagDatabase {
  private static instance: FeatureFlagDatabase;
  private pool: Pool;

  private constructor() {
    const config: DatabaseConfig = {
      connectionTimeoutMillis: 2000,
      database: process.env.DB_NAME || 'feature_flags',
      host: process.env.DB_HOST || 'localhost',
      idleTimeoutMillis: 30000,
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      user: process.env.DB_USER || 'postgres',
    };

    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
      process.exit(-1);
    });

    console.info('Database connection pool initialized');
  }

  /**
   * Get singleton instance of the database connection
   */
  public static getInstance(): FeatureFlagDatabase {
    if (!FeatureFlagDatabase.instance) {
      FeatureFlagDatabase.instance = new FeatureFlagDatabase();
    }
    return FeatureFlagDatabase.instance;
  }

  /**
   * Close the connection pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
    console.info('Database connection pool closed');
  }

  /**
   * Get a client from the pool for transactions
   */
  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Check database health
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Execute a query
   */
  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      console.info('Executed query', { duration, rows: result.rowCount, text });
      return result;
    } catch (error) {
      console.error('Database query error', { error, text });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const db = FeatureFlagDatabase.getInstance();

export default db;

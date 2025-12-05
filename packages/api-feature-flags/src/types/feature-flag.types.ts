export interface FeatureFlag {
  id: number;
  flag_key: string;
  description: string;
  enabled: boolean;
  flag_data: Record<string, any>;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFeatureFlagDto {
  flag_key: string;
  description?: string;
  enabled?: boolean;
  flag_data?: Record<string, any>;
}

export interface UpdateFeatureFlagDto {
  description?: string;
  enabled?: boolean;
  flag_data?: Record<string, any>;
}

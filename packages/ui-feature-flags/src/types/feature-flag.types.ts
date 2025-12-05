export interface FeatureFlag {
  id: number;
  flag_key: string;
  description: string;
  enabled: boolean;
  flag_data: Record<string, any>;
  created_at: string;
  updated_at: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

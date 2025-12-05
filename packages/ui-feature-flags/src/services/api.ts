import axios from 'axios';
import { FeatureFlag, CreateFeatureFlagDto, UpdateFeatureFlagDto, ApiResponse } from '../types/feature-flag.types';

const API_BASE_URL = '/api';

export const featureFlagApi = {
  // Get all feature flags
  getAllFlags: async (search?: string): Promise<FeatureFlag[]> => {
    const params = search ? { search } : {};
    const response = await axios.get<ApiResponse<FeatureFlag[]>>(
      `${API_BASE_URL}/feature-flags`,
      { params }
    );
    return response.data.data || [];
  },

  // Get only enabled flags
  getEnabledFlags: async (): Promise<FeatureFlag[]> => {
    const response = await axios.get<ApiResponse<FeatureFlag[]>>(
      `${API_BASE_URL}/feature-flags/enabled`
    );
    return response.data.data || [];
  },

  // Get single flag by key
  getFlagByKey: async (key: string): Promise<FeatureFlag> => {
    const response = await axios.get<ApiResponse<FeatureFlag>>(
      `${API_BASE_URL}/feature-flags/${key}`
    );
    if (!response.data.data) {
      throw new Error(response.data.error || 'Flag not found');
    }
    return response.data.data;
  },

  // Create new flag
  createFlag: async (data: CreateFeatureFlagDto): Promise<FeatureFlag> => {
    const response = await axios.post<ApiResponse<FeatureFlag>>(
      `${API_BASE_URL}/feature-flags`,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.error || 'Failed to create flag');
    }
    return response.data.data;
  },

  // Update existing flag
  updateFlag: async (key: string, data: UpdateFeatureFlagDto): Promise<FeatureFlag> => {
    const response = await axios.put<ApiResponse<FeatureFlag>>(
      `${API_BASE_URL}/feature-flags/${key}`,
      data
    );
    if (!response.data.data) {
      throw new Error(response.data.error || 'Failed to update flag');
    }
    return response.data.data;
  },

  // Toggle flag enabled state
  toggleFlag: async (key: string): Promise<FeatureFlag> => {
    const response = await axios.patch<ApiResponse<FeatureFlag>>(
      `${API_BASE_URL}/feature-flags/${key}/toggle`
    );
    if (!response.data.data) {
      throw new Error(response.data.error || 'Failed to toggle flag');
    }
    return response.data.data;
  },

  // Delete flag
  deleteFlag: async (key: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/feature-flags/${key}`);
  },
};

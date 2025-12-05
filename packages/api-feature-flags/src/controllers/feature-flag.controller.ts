import { Request, Response, NextFunction } from 'express';
import { FeatureFlagService } from '../services/feature-flag.service';

const featureFlagService = new FeatureFlagService();

export class FeatureFlagController {
  /**
   * GET /api/feature-flags
   * Get all feature flags
   */
  async getAllFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      
      let flags;
      if (search) {
        flags = await featureFlagService.searchFlags(search);
      } else {
        flags = await featureFlagService.getAllFlags();
      }
      
      res.json({ success: true, data: flags });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feature-flags/enabled
   * Get only enabled feature flags
   */
  async getEnabledFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const flags = await featureFlagService.getEnabledFlags();
      res.json({ success: true, data: flags });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/feature-flags/:key
   * Get a specific feature flag by key
   */
  async getFlagByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const flag = await featureFlagService.getFlagByKey(key);
      
      if (!flag) {
        return res.status(404).json({ 
          success: false, 
          error: `Feature flag '${key}' not found` 
        });
      }
      
      res.json({ success: true, data: flag });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/feature-flags
   * Create a new feature flag
   */
  async createFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const { flag_key, description, enabled, flag_data } = req.body;
      
      if (!flag_key) {
        return res.status(400).json({ 
          success: false, 
          error: 'flag_key is required' 
        });
      }

      // Check if flag already exists
      const existing = await featureFlagService.getFlagByKey(flag_key);
      if (existing) {
        return res.status(409).json({ 
          success: false, 
          error: `Feature flag '${flag_key}' already exists` 
        });
      }

      const flag = await featureFlagService.createFlag({
        flag_key,
        description,
        enabled,
        flag_data,
      });
      
      res.status(201).json({ success: true, data: flag });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/feature-flags/:key
   * Update an existing feature flag
   */
  async updateFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { description, enabled, flag_data } = req.body;
      
      const flag = await featureFlagService.updateFlag(key, {
        description,
        enabled,
        flag_data,
      });
      
      if (!flag) {
        return res.status(404).json({ 
          success: false, 
          error: `Feature flag '${key}' not found` 
        });
      }
      
      res.json({ success: true, data: flag });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/feature-flags/:key
   * Delete a feature flag
   */
  async deleteFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const deleted = await featureFlagService.deleteFlag(key);
      
      if (!deleted) {
        return res.status(404).json({ 
          success: false, 
          error: `Feature flag '${key}' not found` 
        });
      }
      
      res.json({ success: true, message: `Feature flag '${key}' deleted successfully` });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/feature-flags/:key/toggle
   * Toggle a feature flag's enabled state
   */
  async toggleFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const flag = await featureFlagService.toggleFlag(key);
      
      if (!flag) {
        return res.status(404).json({ 
          success: false, 
          error: `Feature flag '${key}' not found` 
        });
      }
      
      res.json({ success: true, data: flag });
    } catch (error) {
      next(error);
    }
  }
}

/* eslint-disable camelcase */
import express, { NextFunction, Request, Response, Router } from 'express';

import { featureFlagService } from '../service/feature-flag.service';

/**
 * REST API for managing feature flags
 * Express.js routes and controllers
 */
export const router: Router = express.Router();

// Middleware for error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/flags
 * Get all feature flags
 */
router.get(
  '/flags',
  asyncHandler(async (req: Request, res: Response) => {
    const includeArchived = req.query.includeArchived === 'true';
    const flags = await featureFlagService.getAllFlags(includeArchived);
    res.json({ flags });
  }),
);

/**
 * GET /api/flags/:name
 * Get a single feature flag by name
 */
router.get(
  '/flags/:name',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const flag = await featureFlagService.getFlagByName(name);

    if (!flag) {
      return res.status(404).json({ error: 'Flag not found' });
    }

    res.json({ flag });
  }),
);

/**
 * POST /api/flags
 * Create a new feature flag
 */
router.post(
  '/flags',
  asyncHandler(async (req: Request, res: Response) => {
    const { description, enabled, name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Missing required field: name',
      });
    }

    const userId = req.headers['x-user-id'] as string;

    const flag = await featureFlagService.createFlag({
      created_by: userId,
      description,
      enabled,
      name,
    });

    res.status(201).json({ flag });
  }),
);

/**
 * PATCH /api/flags/:name
 * Update a feature flag
 */
router.patch(
  '/flags/:name',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const { description, enabled, tags } = req.body;
    const userId = req.headers['x-user-id'] as string;

    const flag = await featureFlagService.updateFlag(
      name,
      { description, enabled, name },
      userId,
    );

    res.json({ flag });
  }),
);

/**
 * POST /api/flags/:name/toggle
 * Toggle a flag on/off
 */
router.post(
  '/flags/:name/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const { enabled, environment } = req.body;

    if (enabled === undefined) {
      return res.status(400).json({
        error: 'Missing required field: enabled',
      });
    }

    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    await featureFlagService.toggleFlag(name, enabled, userId, userEmail);

    res.json({ success: true });
  }),
);

/**
 * PUT /api/flags/:name/config/:environment
 * Update flag configuration for a specific environment
 */
router.put(
  '/flags/:name/config/:environment',
  asyncHandler(async (req: Request, res: Response) => {
    const { environment, name } = req.params;
    const { value, enabled } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Missing required field: value' });
    }

    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    await featureFlagService.updateFlagConfig(name, environment, {
      value,
      enabled,
      user_email: userEmail,
      user_id: userId,
    });

    res.json({ success: true });
  }),
);

/**
 * DELETE /api/flags/:name
 * Archive a flag (soft delete)
 */
router.delete(
  '/flags/:name',
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const userId = req.headers['x-user-id'] as string;

    await featureFlagService.archiveFlag(name, userId);

    res.json({ success: true });
  }),
);

/**
 * Error handling middleware
 */
router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);

  if (err.message.includes('not found')) {
    return res.status(404).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

export default router;

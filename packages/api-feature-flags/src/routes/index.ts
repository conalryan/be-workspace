import { Router } from 'express';
import { FeatureFlagController } from '../controllers/feature-flag.controller';

const router: Router = Router();
const controller = new FeatureFlagController();

// GET routes
router.get('/feature-flags', controller.getAllFlags.bind(controller));
router.get('/feature-flags/enabled', controller.getEnabledFlags.bind(controller));
router.get('/feature-flags/:key', controller.getFlagByKey.bind(controller));

// POST routes
router.post('/feature-flags', controller.createFlag.bind(controller));

// PUT routes
router.put('/feature-flags/:key', controller.updateFlag.bind(controller));

// PATCH routes
router.patch('/feature-flags/:key/toggle', controller.toggleFlag.bind(controller));

// DELETE routes
router.delete('/feature-flags/:key', controller.deleteFlag.bind(controller));

export default router;

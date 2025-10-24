import { Router } from 'express';
import vehicleController from '../controllers/vehicle.controller';

const router = Router();

/**
 * Vehicle routes
 */

// GET /api/v1/manufacturers
router.get('/manufacturers', (req, res, next) =>
  vehicleController.getManufacturers(req, res, next)
);

// GET /api/v1/manufacturers/:manufacturer/models
router.get('/manufacturers/:manufacturer/models', (req, res, next) =>
  vehicleController.getModels(req, res, next)
);

// GET /api/v1/vehicles
router.get('/vehicles', (req, res, next) =>
  vehicleController.searchVehicles(req, res, next)
);

// GET /api/v1/vehicles/:id
router.get('/vehicles/:id', (req, res, next) =>
  vehicleController.getVehicleById(req, res, next)
);

// GET /api/v1/filters
router.get('/filters', (req, res, next) =>
  vehicleController.getFilters(req, res, next)
);

// GET /api/v1/stats
router.get('/stats', (req, res, next) =>
  vehicleController.getStats(req, res, next)
);

/**
 * Health check route
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

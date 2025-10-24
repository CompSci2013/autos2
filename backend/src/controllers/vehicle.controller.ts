import { Request, Response, NextFunction } from 'express';
import vehicleService from '../services/vehicle.service';
import { SearchParams } from '../types/vehicle';

export class VehicleController {
  /**
   * GET /api/v1/manufacturers
   */
  async getManufacturers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search } = req.query;
      const result = await vehicleService.getManufacturers(search as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/manufacturers/:manufacturer/models
   */
  async getModels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { manufacturer } = req.params;
      const { search } = req.query;
      const result = await vehicleService.getModelsByManufacturer(manufacturer, search as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/vehicles
   */
  async searchVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params: SearchParams = {
        manufacturers: this.getArrayParam(req.query.manufacturers),
        models: this.getArrayParam(req.query.models),
        year_min: this.getNumberParam(req.query.year_min),
        year_max: this.getNumberParam(req.query.year_max),
        body_class: this.getArrayParam(req.query.body_class),
        body_style: this.getArrayParam(req.query.body_style),
        engine_type: this.getArrayParam(req.query.engine_type),
        drive_type: this.getArrayParam(req.query.drive_type),
        transmission_type: this.getArrayParam(req.query.transmission_type),
        search: req.query.search as string,
        sort: (req.query.sort as string) || 'manufacturer',
        order: (req.query.order as 'asc' | 'desc') || 'asc',
        page: this.getNumberParam(req.query.page) || 1,
        limit: Math.min(this.getNumberParam(req.query.limit) || 20, 100),
      };

      const result = await vehicleService.searchVehicles(params);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/vehicles/:id
   */
  async getVehicleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const vehicle = await vehicleService.getVehicleById(id);

      if (!vehicle) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Vehicle with ID '${id}' not found`,
          },
        });
        return;
      }

      res.json(vehicle);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/filters
   */
  async getFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const manufacturers = this.getArrayParam(req.query.manufacturers);
      const models = this.getArrayParam(req.query.models);
      const result = await vehicleService.getFilters(manufacturers, models);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await vehicleService.getStats();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper: Parse array parameter
   */
  private getArrayParam(param: any): string[] | undefined {
    if (!param) return undefined;
    return Array.isArray(param) ? param : [param];
  }

  /**
   * Helper: Parse number parameter
   */
  private getNumberParam(param: any): number | undefined {
    if (!param) return undefined;
    const num = parseInt(param as string, 10);
    return isNaN(num) ? undefined : num;
  }
}

export default new VehicleController();

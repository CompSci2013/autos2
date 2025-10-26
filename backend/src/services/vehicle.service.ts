import { esClient } from '../config/elasticsearch';
import config from '../config';
import {
  Vehicle,
  Manufacturer,
  Model,
  Filters,
  SearchParams,
  VehicleSearchResponse,
  DatabaseStats,
  FilterOption,
} from '../types/vehicle';

export class VehicleService {
  private readonly index = config.elasticsearch.index;

  /**
   * Get all manufacturers with vehicle and model counts
   */
  async getManufacturers(search?: string): Promise<{ manufacturers: Manufacturer[]; total: number }> {
    const query: any = {
      index: this.index,
      size: 0,
      body: {
        aggs: {
          manufacturers: {
            terms: {
              field: 'manufacturer.keyword',
              size: 1000,
              order: { _key: 'asc' },
            },
            aggs: {
              model_count: {
                cardinality: {
                  field: 'model.keyword',
                },
              },
            },
          },
        },
      },
    };

    // Add search filter if provided
    if (search) {
      query.body.query = {
        wildcard: {
          'manufacturer.keyword': `*${search}*`,
        },
      };
    }

    const result = await esClient.search(query);
    const buckets = (result.aggregations?.manufacturers as any)?.buckets || [];

    const manufacturers: Manufacturer[] = buckets.map((bucket: any) => ({
      name: bucket.key,
      vehicle_count: bucket.doc_count,
      model_count: bucket.model_count.value,
    }));

    return {
      manufacturers,
      total: manufacturers.length,
    };
  }

  /**
   * Get models for a specific manufacturer
   */
  async getModelsByManufacturer(
    manufacturer: string,
    search?: string
  ): Promise<{ manufacturer: string; models: Model[]; total: number }> {
    const must: any[] = [
      {
        term: {
          'manufacturer.keyword': manufacturer,
        },
      },
    ];

    if (search) {
      must.push({
        wildcard: {
          'model.keyword': `*${search}*`,
        },
      });
    }

    const result = await esClient.search({
      index: this.index,
      size: 0,
      body: {
        query: {
          bool: {
            must,
          },
        },
        aggs: {
          models: {
            terms: {
              field: 'model.keyword',
              size: 1000,
              order: { _key: 'asc' },
            },
            aggs: {
              year_min: {
                min: {
                  field: 'year',
                },
              },
              year_max: {
                max: {
                  field: 'year',
                },
              },
            },
          },
        },
      },
    });

    const buckets = (result.aggregations?.models as any)?.buckets || [];

    const models: Model[] = buckets.map((bucket: any) => ({
      name: bucket.key,
      vehicle_count: bucket.doc_count,
      year_range: {
        min: bucket.year_min.value || 0,
        max: bucket.year_max.value || 0,
      },
    }));

    return {
      manufacturer,
      models,
      total: models.length,
    };
  }

  /**
   * Search vehicles with filters and pagination
   */
  async searchVehicles(params: SearchParams): Promise<VehicleSearchResponse> {
    const {
      manufacturers,
      models,
      year_min,
      year_max,
      body_class,
      body_style,
      engine_type,
      drive_type,
      transmission_type,
      search,
      sort = 'manufacturer',
      order = 'asc',
      page = 1,
      limit = 20,
    } = params;

    // Build filter clauses
    const must: any[] = [];
    const filter: any[] = [];

    // Manufacturer filter
    if (manufacturers && manufacturers.length > 0) {
      filter.push({
        terms: {
          'manufacturer.keyword': manufacturers,
        },
      });
    }

    // Model filter
    if (models && models.length > 0) {
      filter.push({
        terms: {
          'model.keyword': models,
        },
      });
    }

    // Year range filter
    if (year_min || year_max) {
      const rangeQuery: any = {};
      if (year_min) rangeQuery.gte = year_min;
      if (year_max) rangeQuery.lte = year_max;
      filter.push({
        range: {
          year: rangeQuery,
        },
      });
    }

    // Body class filter
    if (body_class && body_class.length > 0) {
      filter.push({
        terms: {
          body_class: body_class,
        },
      });
    }

    // Body style filter
    if (body_style && body_style.length > 0) {
      filter.push({
        terms: {
          body_style: body_style,
        },
      });
    }

    // Engine type filter
    if (engine_type && engine_type.length > 0) {
      filter.push({
        terms: {
          engine_type: engine_type,
        },
      });
    }

    // Drive type filter
    if (drive_type && drive_type.length > 0) {
      filter.push({
        terms: {
          drive_type: drive_type,
        },
      });
    }

    // Transmission type filter
    if (transmission_type && transmission_type.length > 0) {
      filter.push({
        terms: {
          transmission_type: transmission_type,
        },
      });
    }

    // Full-text search
    if (search) {
      must.push({
        multi_match: {
          query: search,
          fields: ['manufacturer', 'model'],
          type: 'phrase_prefix',
        },
      });
    }

    // Build query
    const query: any = {
      bool: {},
    };

    if (must.length > 0) query.bool.must = must;
    if (filter.length > 0) query.bool.filter = filter;

    // Calculate pagination
    const from = (page - 1) * limit;

    // Execute search
    // Determine sort field - only add .keyword for text fields, not numeric fields like 'year'
    const numericFields = ['year'];
    const sortField = numericFields.includes(sort) ? sort : `${sort}.keyword`;

    const result = await esClient.search({
      index: this.index,
      from,
      size: limit,
      body: {
        query: Object.keys(query.bool).length > 0 ? query : { match_all: {} },
        sort: [{ [sortField]: { order } }],
      },
    });

    const vehicles: Vehicle[] = result.hits.hits.map((hit: any) => hit._source);
    const total = typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value || 0;

    return {
      vehicles,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
      filters_applied: {
        ...(manufacturers && { manufacturers }),
        ...(models && { models }),
        ...(body_class && { body_class }),
        ...(body_style && { body_style }),
        ...(engine_type && { engine_type }),
        ...(drive_type && { drive_type }),
        ...(transmission_type && { transmission_type }),
      },
    };
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const result = await esClient.search({
        index: this.index,
        body: {
          query: {
            term: {
              vehicle_id: id,
            },
          },
        },
      });

      if (result.hits.hits.length > 0) {
        return result.hits.hits[0]._source as Vehicle;
      }
      return null;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  }

  /**
   * Get available filter options
   */
  async getFilters(manufacturers?: string[], models?: string[]): Promise<Filters> {
    const filter: any[] = [];

    if (manufacturers && manufacturers.length > 0) {
      filter.push({
        terms: {
          'manufacturer.keyword': manufacturers,
        },
      });
    }

    if (models && models.length > 0) {
      filter.push({
        terms: {
          'model.keyword': models,
        },
      });
    }

    const query = filter.length > 0 ? { bool: { filter } } : { match_all: {} };

    const result = await esClient.search({
      index: this.index,
      size: 0,
      body: {
        query,
        aggs: {
          body_classes: {
            terms: { field: 'body_class', size: 100 },
          },
          body_styles: {
            terms: { field: 'body_style', size: 100 },
          },
          year_min: {
            min: { field: 'year' },
          },
          year_max: {
            max: { field: 'year' },
          },
          engine_types: {
            terms: { field: 'engine_type', size: 50 },
          },
          drive_types: {
            terms: { field: 'drive_type', size: 20 },
          },
          transmission_types: {
            terms: { field: 'transmission_type', size: 20 },
          },
        },
      },
    });

    const aggs: any = result.aggregations || {};

    return {
      body_classes: this.mapBuckets(aggs.body_classes?.buckets || []),
      body_styles: this.mapBuckets(aggs.body_styles?.buckets || []),
      years: {
        min: aggs.year_min?.value || 1950,
        max: aggs.year_max?.value || 2025,
      },
      engine_types: this.mapBuckets(aggs.engine_types?.buckets || []),
      drive_types: this.mapBuckets(aggs.drive_types?.buckets || []),
      transmission_types: this.mapBuckets(aggs.transmission_types?.buckets || []),
    };
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    const result = await esClient.search({
      index: this.index,
      size: 0,
      body: {
        aggs: {
          total_manufacturers: {
            cardinality: { field: 'manufacturer.keyword' },
          },
          total_models: {
            cardinality: { field: 'model.keyword' },
          },
          year_min: {
            min: { field: 'year' },
          },
          year_max: {
            max: { field: 'year' },
          },
          data_sources: {
            terms: { field: 'data_source', size: 50 },
          },
        },
      },
    });

    const count = await esClient.count({ index: this.index });
    const aggs: any = result.aggregations || {};

    return {
      total_vehicles: count.count,
      total_manufacturers: aggs.total_manufacturers?.value || 0,
      total_models: aggs.total_models?.value || 0,
      year_range: {
        min: aggs.year_min?.value || 1950,
        max: aggs.year_max?.value || 2025,
      },
      data_sources: this.mapBuckets(aggs.data_sources?.buckets || []).map((b) => ({
        source: b.value,
        count: b.count,
      })),
    };
  }

  /**
   * Helper: Map Elasticsearch buckets to FilterOption[]
   */
  private mapBuckets(buckets: any[]): FilterOption[] {
    return buckets
      .filter((b) => b.key) // Filter out null/undefined keys
      .map((bucket) => ({
        value: bucket.key,
        count: bucket.doc_count,
      }));
  }
}

export default new VehicleService();

# Autos2 API Specification

**Version:** 1.0.0
**Base URL:** `/api/v1`
**Data Source:** Elasticsearch index `autos-unified` @ `http://thor:30398`

## Data Model

Based on the Elasticsearch schema, each vehicle document contains:

### Core Fields
- `vehicle_id` (keyword) - Unique identifier
- `manufacturer` (text/keyword) - Vehicle manufacturer
- `model` (text/keyword) - Vehicle model
- `year` (integer) - Model year
- `vin` (keyword) - Vehicle Identification Number

### Body & Style
- `body_style` (keyword) - Body style classification
- `body_class` (keyword) - Body class category

### Engine Specifications
- `engine_type` (keyword) - Engine type/configuration
- `engine_cylinders` (integer) - Number of cylinders
- `engine_displacement_l` (float) - Displacement in liters
- `engine_hp` (integer) - Horsepower

### Transmission & Drivetrain
- `transmission_type` (keyword) - Transmission type
- `transmission_speeds` (integer) - Number of speeds
- `drive_type` (keyword) - Drive type (FWD/RWD/AWD/4WD)

### Metadata
- `data_source` (keyword) - Source of the data
- `ingested_at` (date) - Timestamp of ingestion

---

## API Endpoints

### 1. Get Manufacturers

**GET** `/api/v1/manufacturers`

Returns list of all manufacturers with vehicle counts.

**Query Parameters:**
- `search` (string, optional) - Filter manufacturers by name

**Response:**
```json
{
  "manufacturers": [
    {
      "name": "Ford",
      "vehicle_count": 1247,
      "model_count": 89
    }
  ],
  "total": 79
}
```

**Elasticsearch Query:**
- Aggregation on `manufacturer.keyword`
- Cardinality aggregation on `model.keyword` per manufacturer

---

### 2. Get Models by Manufacturer

**GET** `/api/v1/manufacturers/:manufacturer/models`

Returns all models for a specific manufacturer.

**Path Parameters:**
- `manufacturer` (string) - Manufacturer name

**Query Parameters:**
- `search` (string, optional) - Filter models by name

**Response:**
```json
{
  "manufacturer": "Ford",
  "models": [
    {
      "name": "F-150",
      "vehicle_count": 143,
      "year_range": {
        "min": 1950,
        "max": 2025
      }
    }
  ],
  "total": 89
}
```

**Elasticsearch Query:**
- Filter by `manufacturer.keyword`
- Aggregation on `model.keyword`
- Min/max aggregation on `year`

---

### 3. Search Vehicles

**GET** `/api/v1/vehicles`

Main search endpoint with filtering, sorting, and pagination.

**Query Parameters:**
- `manufacturers` (string[], optional) - Filter by manufacturers
- `models` (string[], optional) - Filter by models
- `year_min` (integer, optional) - Minimum year
- `year_max` (integer, optional) - Maximum year
- `body_class` (string[], optional) - Filter by body class
- `body_style` (string[], optional) - Filter by body style
- `engine_type` (string[], optional) - Filter by engine type
- `drive_type` (string[], optional) - Filter by drive type
- `transmission_type` (string[], optional) - Filter by transmission type
- `search` (string, optional) - Full-text search across manufacturer/model
- `sort` (string, optional) - Sort field (default: manufacturer)
- `order` (asc|desc, optional) - Sort order (default: asc)
- `page` (integer, optional) - Page number (default: 1)
- `limit` (integer, optional) - Results per page (default: 20, max: 100)

**Response:**
```json
{
  "vehicles": [
    {
      "vehicle_id": "nhsta-vin-abcd-1234",
      "manufacturer": "Ford",
      "model": "F-150",
      "year": 1965,
      "body_class": "Pickup Truck",
      "body_style": "Regular Cab",
      "vin": "1FTEX15N0RKA12345",
      "engine_type": "V8",
      "engine_cylinders": 8,
      "engine_displacement_l": 5.0,
      "engine_hp": 225,
      "transmission_type": "Manual",
      "transmission_speeds": 4,
      "drive_type": "RWD",
      "data_source": "NHTSA"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1247,
    "total_pages": 63
  },
  "filters_applied": {
    "manufacturers": ["Ford"],
    "models": ["F-150"]
  }
}
```

**Elasticsearch Query:**
- Bool query with multiple filter clauses
- Pagination via `from` and `size`
- Sorting via sort parameter

---

### 4. Get Vehicle by ID

**GET** `/api/v1/vehicles/:id`

Returns detailed information for a specific vehicle.

**Path Parameters:**
- `id` (string) - vehicle_id

**Response:**
```json
{
  "vehicle_id": "nhsta-vin-abcd-1234",
  "manufacturer": "Ford",
  "model": "F-150",
  "year": 1965,
  "body_class": "Pickup Truck",
  "body_style": "Regular Cab",
  "vin": "1FTEX15N0RKA12345",
  "engine_type": "V8",
  "engine_cylinders": 8,
  "engine_displacement_l": 5.0,
  "engine_hp": 225,
  "transmission_type": "Manual",
  "transmission_speeds": 4,
  "drive_type": "RWD",
  "data_source": "NHTSA",
  "ingested_at": "2024-10-15T10:30:00Z"
}
```

**Elasticsearch Query:**
- Get document by `vehicle_id`

---

### 5. Get Filter Options

**GET** `/api/v1/filters`

Returns available filter options for dropdowns/facets.

**Query Parameters:**
- `manufacturers` (string[], optional) - Pre-filter by manufacturers
- `models` (string[], optional) - Pre-filter by models

**Response:**
```json
{
  "body_classes": [
    {"value": "Pickup Truck", "count": 3421},
    {"value": "Sedan", "count": 8934}
  ],
  "body_styles": [
    {"value": "Regular Cab", "count": 1234}
  ],
  "years": {
    "min": 1950,
    "max": 2025
  },
  "engine_types": [
    {"value": "V8", "count": 5432}
  ],
  "drive_types": [
    {"value": "RWD", "count": 6789}
  ],
  "transmission_types": [
    {"value": "Manual", "count": 4321},
    {"value": "Automatic", "count": 7654}
  ]
}
```

**Elasticsearch Query:**
- Multiple aggregations on keyword fields
- Filtered based on query parameters

---

### 6. Get Statistics

**GET** `/api/v1/stats`

Returns database statistics and summary information.

**Response:**
```json
{
  "total_vehicles": 45678,
  "total_manufacturers": 79,
  "total_models": 3421,
  "year_range": {
    "min": 1950,
    "max": 2025
  },
  "data_sources": [
    {"source": "NHTSA", "count": 40000},
    {"source": "Manual", "count": 5678}
  ]
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameter: year_min must be a number",
    "details": {}
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid request parameters
- `NOT_FOUND` (404) - Resource not found
- `INTERNAL_ERROR` (500) - Server error
- `ELASTICSEARCH_ERROR` (503) - Elasticsearch unavailable

---

## Implementation Notes

### Elasticsearch Connection
- **Host:** `http://thor:30398`
- **Index:** `autos-unified`
- **Client:** `@elastic/elasticsearch` (Node.js)

### Performance Considerations
- Cache manufacturer/model lists (low change frequency)
- Use Elasticsearch aggregations for counts
- Implement pagination for all list endpoints
- Add request timeout handling (10s default)

### Security
- Input validation on all parameters
- Sanitize search queries to prevent injection
- Rate limiting on search endpoints
- CORS configuration for Angular frontend

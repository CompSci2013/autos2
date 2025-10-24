# Autos2 Backend API

Node.js + TypeScript + Elasticsearch backend API for the Autos2 vehicle search application.

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** Elasticsearch
- **Testing:** Jest

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Access to Elasticsearch instance at `http://thor:30398`
- Elasticsearch index `autos-unified` populated with vehicle data

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Development

```bash
# Run in development mode with hot-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Environment Variables

See `.env.example` for all available configuration options:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `ELASTICSEARCH_HOST` - Elasticsearch connection URL
- `ELASTICSEARCH_INDEX` - Index name (default: autos-unified)
- `CORS_ORIGIN` - Allowed CORS origin for frontend

## API Endpoints

Base URL: `/api/v1`

### Vehicles

- `GET /vehicles` - Search vehicles with filters
- `GET /vehicles/:id` - Get vehicle by ID

### Manufacturers & Models

- `GET /manufacturers` - List all manufacturers
- `GET /manufacturers/:manufacturer/models` - Get models for manufacturer

### Filters & Stats

- `GET /filters` - Get available filter options
- `GET /stats` - Get database statistics

### Health

- `GET /health` - Health check endpoint

## API Documentation

See [/docs/api-specification.md](../docs/api-specification.md) for detailed API documentation.

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration and Elasticsearch client
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic and ES queries
│   ├── routes/           # API route definitions
│   ├── middleware/       # Express middleware
│   ├── types/            # TypeScript type definitions
│   └── server.ts         # Main application entry point
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Testing the API

Once the server is running, you can test endpoints:

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Get manufacturers
curl http://localhost:3000/api/v1/manufacturers

# Search vehicles
curl "http://localhost:3000/api/v1/vehicles?manufacturers[]=Ford&limit=5"

# Get stats
curl http://localhost:3000/api/v1/stats
```

## Deployment

The backend is designed to run in a Kubernetes cluster. See [/k8s](../k8s) for deployment configurations.

## Error Handling

All API errors return a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Error codes:
- `VALIDATION_ERROR` (400) - Invalid request
- `NOT_FOUND` (404) - Resource not found
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `ELASTICSEARCH_ERROR` (503) - Database unavailable

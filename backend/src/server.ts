import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config';
import { initializeElasticsearch } from './config/elasticsearch';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Create and configure Express application
 */
function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Rate limiting (exclude health endpoint from rate limiting)
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    skip: (req) => {
      // Exclude health endpoint from rate limiting (used by K8s probes)
      return req.path === `/api/${config.apiVersion}/health`;
    },
  });
  app.use(`/api/${config.apiVersion}`, limiter);

  // API routes
  app.use(`/api/${config.apiVersion}`, routes);

  // Root route
  app.get('/', (_req, res) => {
    res.json({
      name: 'Autos2 API',
      version: config.apiVersion,
      status: 'running',
      endpoints: {
        health: `/api/${config.apiVersion}/health`,
        manufacturers: `/api/${config.apiVersion}/manufacturers`,
        vehicles: `/api/${config.apiVersion}/vehicles`,
        filters: `/api/${config.apiVersion}/filters`,
        stats: `/api/${config.apiVersion}/stats`,
      },
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    console.log('\n🚀 Starting Autos2 Backend API\n');
    console.log('='.repeat(60));

    // Initialize Elasticsearch
    await initializeElasticsearch();

    // Create Express app
    const app = createApp();

    // Start listening
    app.listen(config.port, () => {
      console.log('='.repeat(60));
      console.log(`\n✅ Server running on port ${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   API Base: /api/${config.apiVersion}`);
      console.log(`   Elasticsearch: ${config.elasticsearch.host}`);
      console.log(`   Index: ${config.elasticsearch.index}`);
      console.log(`\n📡 API Endpoints:`);
      console.log(`   http://localhost:${config.port}/api/${config.apiVersion}/health`);
      console.log(`   http://localhost:${config.port}/api/${config.apiVersion}/manufacturers`);
      console.log(`   http://localhost:${config.port}/api/${config.apiVersion}/vehicles`);
      console.log(`   http://localhost:${config.port}/api/${config.apiVersion}/filters`);
      console.log(`   http://localhost:${config.port}/api/${config.apiVersion}/stats`);
      console.log('\n' + '='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };

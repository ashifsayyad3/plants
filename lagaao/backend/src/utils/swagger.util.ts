import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { env } from '../config/env';
import { CONSTANTS } from '../config/constants';
import { logger } from '../config/logger';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: `${env.APP_NAME} API`,
      version: '1.0.0',
      description: `REST API documentation for ${env.APP_NAME}.com`,
      contact: {
        name: 'Lagaao Dev Team',
      },
    },
    servers: [
      {
        url: `${env.APP_URL}${CONSTANTS.API_PREFIX}`,
        description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        // ── Common reusable schemas ────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            errors: { type: 'object' },
            requestId: { type: 'string', format: 'uuid' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: { type: 'string' },
              },
              example: { email: ['Invalid email address'], name: ['Name is required'] },
            },
          },
        },
      },
    },
    // Applied globally — individual routes can override with security: []
    security: [{ BearerAuth: [] }],
  },
  // Scan all route and module files for JSDoc @swagger annotations
  apis: [
    './src/routes/**/*.ts',
    './src/modules/**/*.route.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Application): void {
  if (!env.SWAGGER_ENABLED) return;

  const swaggerPath = '/api-docs';

  app.use(
    swaggerPath,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: `${env.APP_NAME} API Docs`,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: !env.isProd(),
      },
    }),
  );

  // Raw JSON spec — useful for importing into Postman / Insomnia
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info(`Swagger UI available at ${env.APP_URL}${swaggerPath}`);
}

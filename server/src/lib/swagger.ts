/**
 * OpenAPI / Swagger Documentation
 * Auto-generates API documentation from JSDoc annotations.
 * Access at /api-docs when enabled.
 */
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import express from 'express';
import { serverLogger } from '../utils/logger';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NABD Chain System API',
      version: '1.0.0',
      description: 'Enterprise SaaS API for business management, supply chain, and B2B marketplace.',
      contact: {
        name: 'NABD Team',
        url: 'https://nabdchain.com',
      },
    },
    servers: [
      { url: '/api', description: 'API Base' },
      { url: '/api/v1', description: 'API v1' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk JWT or Portal JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            icon: { type: 'string' },
            color: { type: 'string' },
            ownerId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Board: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            workspaceId: { type: 'string', format: 'uuid' },
            defaultView: { type: 'string', enum: ['table', 'kanban', 'calendar', 'gantt', 'timeline'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
            totalAmount: { type: 'number' },
            currency: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceNumber: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled'] },
            totalAmount: { type: 'number' },
            dueDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Workspaces', description: 'Workspace management' },
      { name: 'Boards', description: 'Board/table management' },
      { name: 'Portal', description: 'Buyer/Seller portal' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Invoices', description: 'Invoice management' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Inventory', description: 'Inventory management' },
      { name: 'Monitoring', description: 'Health checks and metrics' },
    ],
  },
  // Scan route files for @swagger annotations
  apis: ['./src/routes/*.ts', './src/routes/**/*.ts'],
};

/**
 * Mount Swagger UI at /api-docs
 */
export function mountSwagger(app: express.Application): void {
  try {
    const spec = swaggerJsdoc(options);

    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'NABD API Documentation',
    }));

    // Serve raw OpenAPI JSON
    app.get('/api-docs.json', (_req, res) => {
      res.json(spec);
    });

    serverLogger.info('OpenAPI docs available at /api-docs');
  } catch (err) {
    serverLogger.error('Failed to initialize Swagger:', err);
  }
}

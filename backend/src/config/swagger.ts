import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Weekly Report Generator & Team Dashboard API',
    version: '1.0.0',
    description: 'REST API documentation for Weekly Report Generator & Team Dashboard with RBAC, versioning, review workflow, and analytics.',
  },
  servers: [
    {
      url: '/api',
      description: 'API Base URL',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Server Health Check',
        tags: ['System'],
        responses: { 200: { description: 'Server is healthy' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new team member account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User registered as TEAM_MEMBER' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Logged in successfully' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        tags: ['Authentication'],
        responses: { 200: { description: 'Current user details' } },
      },
    },
    '/reports': {
      get: {
        summary: 'List reports with pagination and filters (Manager/Admin)',
        tags: ['Reports'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED'] } },
          { name: 'projectId', in: 'query', schema: { type: 'integer' } },
          { name: 'userId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Filtered report list' } },
      },
      post: {
        summary: 'Create a new draft weekly report (Team Member)',
        tags: ['Reports'],
        responses: { 201: { description: 'Report draft created' } },
      },
    },
    '/reports/me': {
      get: {
        summary: 'List personal reports (Team Member)',
        tags: ['Reports'],
        responses: { 200: { description: 'List of own reports' } },
      },
    },
    '/reports/{id}': {
      get: {
        summary: 'Get report details by ID',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Report details' } },
      },
      put: {
        summary: 'Update draft or needs correction report',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Report updated' } },
      },
    },
    '/reports/{id}/submit': {
      post: {
        summary: 'Submit or resubmit a report for review',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Report submitted and version snapshot created' } },
      },
    },
    '/reports/{id}/review': {
      post: {
        summary: 'Review a submitted report (Approve or Request Changes)',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action', 'comment'],
                properties: {
                  action: { type: 'string', enum: ['APPROVED', 'CHANGES_REQUESTED'] },
                  comment: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Report review processed' } },
      },
    },
    '/reports/{id}/versions': {
      get: {
        summary: 'Get version snapshot history for a report',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Report versions history' } },
      },
    },
    '/dashboard/member': {
      get: {
        summary: 'Get member personal dashboard metrics',
        tags: ['Dashboard'],
        responses: { 200: { description: 'Member dashboard stats' } },
      },
    },
    '/dashboard/manager': {
      get: {
        summary: 'Get manager dashboard metrics & charts',
        tags: ['Dashboard'],
        responses: { 200: { description: 'Manager analytics' } },
      },
    },
    '/dashboard/overview': {
      get: {
        summary: 'Get weekly matrix overview table',
        tags: ['Dashboard'],
        responses: { 200: { description: 'Weekly overview matrix' } },
      },
    },
    '/projects': {
      get: {
        summary: 'List projects',
        tags: ['Projects'],
        responses: { 200: { description: 'Project list' } },
      },
      post: {
        summary: 'Create project (Admin/Manager)',
        tags: ['Projects'],
        responses: { 201: { description: 'Project created' } },
      },
    },
    '/ai/query': {
      post: {
        summary: 'Query AI assistant on team activity and reports',
        tags: ['AI Assistant'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: { query: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'AI answer generated' } },
      },
    },
  },
};

export const setupSwagger = (app: Express) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

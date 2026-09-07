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
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', format: 'email', example: 'jane@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
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
                  email: { type: 'string', format: 'email', example: 'alice@example.com' },
                  password: { type: 'string', example: 'password123' },
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
          { name: 'weekStart', in: 'query', schema: { type: 'string' } },
          { name: 'weekEnd', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Filtered report list' } },
      },
      post: {
        summary: 'Create a new draft weekly report (Team Member only)',
        tags: ['Reports'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectId', 'weekStart', 'weekEnd'],
                properties: {
                  projectId: { type: 'integer', example: 1 },
                  weekStart: { type: 'string', example: '2026-08-31' },
                  weekEnd: { type: 'string', example: '2026-09-04' },
                  notes: { type: 'string', example: 'Sprint summary notes' },
                  links: { type: 'string', example: 'https://github.com/org/repo/pull/1' },
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['name'],
                      properties: {
                        name: { type: 'string', example: 'Implement login' },
                        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'HIGH' },
                        plannedPercent: { type: 'integer', example: 100 },
                        actualPercent: { type: 'integer', example: 100 },
                        status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'], example: 'COMPLETED' },
                        plannedHours: { type: 'number', example: 16 },
                        actualHours: { type: 'number', example: 14 },
                        deliverable: { type: 'string', example: 'PR merged' },
                        isPlannedForNextWeek: { type: 'boolean', example: false },
                      },
                    },
                  },
                  blockers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['description'],
                      properties: {
                        description: { type: 'string', example: 'Waiting on API key' },
                        isKeyBlocker: { type: 'boolean', example: true },
                      },
                    },
                  },
                  achievements: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['description'],
                      properties: {
                        description: { type: 'string', example: 'Delivered ahead of schedule' },
                        isKeyAchievement: { type: 'boolean', example: true },
                      },
                    },
                  },
                  timeBreakdowns: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['category', 'hours'],
                      properties: {
                        category: { type: 'string', enum: ['DEVELOPMENT', 'TESTING', 'MEETINGS', 'DOCUMENTATION', 'OTHER'] },
                        hours: { type: 'number', example: 20 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Report draft created' }, 409: { description: 'Report already exists for this week' } },
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
        responses: { 200: { description: 'Report details' }, 403: { description: 'Access denied' }, 404: { description: 'Report not found' } },
      },
      put: {
        summary: 'Update draft or needs correction report (Team Member only)',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Report updated' }, 400: { description: 'Validation error' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      patch: {
        summary: 'Partial update draft or needs correction report (Team Member only)',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Report updated' }, 403: { description: 'Forbidden' } },
      },
    },
    '/reports/{id}/submit': {
      post: {
        summary: 'Submit or resubmit a report for review (Team Member only)',
        tags: ['Reports'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Report submitted and version snapshot created' }, 400: { description: 'Invalid transition' }, 403: { description: 'Forbidden' } },
      },
    },
    '/reports/{id}/review': {
      post: {
        summary: 'Review a submitted report (Approve or Request Changes - Manager/Admin)',
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
                  comment: { type: 'string', example: 'Please update task deliverable details.' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Report review processed' }, 400: { description: 'Invalid review action or comment missing' }, 403: { description: 'Forbidden' } },
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
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string' } },
          { name: 'weekStart', in: 'query', schema: { type: 'string' } },
          { name: 'weekEnd', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Manager analytics' } },
      },
    },
    '/dashboard/overview': {
      get: {
        summary: 'Get weekly matrix overview table',
        tags: ['Dashboard'],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string' } },
          { name: 'weekStart', in: 'query', schema: { type: 'string' } },
          { name: 'weekEnd', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Weekly overview matrix' } },
      },
    },
    '/projects': {
      get: {
        summary: 'List projects',
        tags: ['Projects'],
        parameters: [{ name: 'active', in: 'query', schema: { type: 'boolean' } }],
        responses: { 200: { description: 'Project list' } },
      },
      post: {
        summary: 'Create project (Admin/Manager)',
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'New Project' },
                  description: { type: 'string', example: 'Project description' },
                  isActive: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Project created' } },
      },
    },
    '/ai/chat': {
      post: {
        summary: 'Query AI assistant on team activity and reports (Manager/Admin)',
        tags: ['AI Assistant'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'What are the main blockers this week?' },
                  weekStart: { type: 'string', example: '2026-08-31' },
                  weekEnd: { type: 'string', example: '2026-09-04' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'AI answer generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        answer: { type: 'string', example: '⚠️ **1 active blocker** reported this week...' },
                        week: {
                          type: 'object',
                          properties: {
                            start: { type: 'string', example: '2026-08-31' },
                            end: { type: 'string', example: '2026-09-04' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { description: 'Forbidden for team members' },
        },
      },
    },
    '/ai/query': {
      post: {
        summary: 'Alias for AI Assistant chat query (Manager/Admin)',
        tags: ['AI Assistant'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Summarize this week' },
                  weekStart: { type: 'string', example: '2026-08-31' },
                  weekEnd: { type: 'string', example: '2026-09-04' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'AI answer generated' },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

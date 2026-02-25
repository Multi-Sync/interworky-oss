import { NextResponse } from 'next/server';

export async function GET() {
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Interworky AI Agent API',
      description:
        'API for Interworky AI Agent - a voice chatbot service that provides 24/7 customer support for websites',
      version: '1.0.0',
      contact: {
        name: 'Interworky Support',
        email: 'hello@interworky.com',
        url: 'https://interworky.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://interworky.com/api',
        description: 'Production server',
      },
      {
        url: 'https://dev.interworky.com/api',
        description: 'Development server',
      },
    ],
    security: [
      {
        OAuth2: ['openid', 'profile', 'email'],
      },
    ],
    paths: {
      '/agent-checker': {
        post: {
          summary: 'Run Agent-Ready Checker',
          description: 'Check if a website is compatible with ChatGPT and other AI agents',
          operationId: 'runAgentChecker',
          tags: ['Agent Checker'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['domain'],
                  properties: {
                    domain: {
                      type: 'string',
                      description: 'The domain to check',
                      example: 'example.com',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Check initiated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                      },
                      jobId: {
                        type: 'string',
                      },
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                      },
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/scraper/{jobId}': {
        get: {
          summary: 'Get job status',
          description: 'Get the status of a running job',
          operationId: 'getJobStatus',
          tags: ['Scraper'],
          parameters: [
            {
              name: 'jobId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'The job ID',
            },
          ],
          responses: {
            200: {
              description: 'Job status retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['pending', 'running', 'completed', 'failed'],
                      },
                      result: {
                        type: 'object',
                      },
                      progress: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Job not found',
            },
          },
        },
      },
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Check the health status of the API',
          operationId: 'healthCheck',
          tags: ['Health'],
          responses: {
            200: {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        example: 'healthy',
                      },
                      timestamp: {
                        type: 'string',
                        format: 'date-time',
                      },
                      uptime: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        head: {
          summary: 'Health check (HEAD)',
          description: 'Check the health status of the API using HEAD method',
          operationId: 'healthCheckHead',
          tags: ['Health'],
          responses: {
            200: {
              description: 'API is healthy',
            },
          },
        },
      },
      '/auth/userinfo': {
        get: {
          summary: 'Get user information',
          description: 'Get information about the authenticated user',
          operationId: 'getUserInfo',
          tags: ['Authentication'],
          security: [
            {
              OAuth2: ['openid', 'profile', 'email'],
            },
          ],
          responses: {
            200: {
              description: 'User information retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      sub: {
                        type: 'string',
                        description: 'Subject identifier',
                      },
                      name: {
                        type: 'string',
                        description: 'Full name',
                      },
                      given_name: {
                        type: 'string',
                        description: 'First name',
                      },
                      family_name: {
                        type: 'string',
                        description: 'Last name',
                      },
                      email: {
                        type: 'string',
                        format: 'email',
                        description: 'Email address',
                      },
                      email_verified: {
                        type: 'boolean',
                        description: 'Whether email is verified',
                      },
                      picture: {
                        type: 'string',
                        format: 'uri',
                        description: 'Profile picture URL',
                      },
                      locale: {
                        type: 'string',
                        description: 'User locale',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        OAuth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://interworky.com/api/auth/signin',
              tokenUrl: 'https://interworky.com/api/auth/token',
              scopes: {
                openid: 'OpenID Connect scope',
                profile: 'User profile information',
                email: 'User email address',
              },
            },
          },
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            error_description: {
              type: 'string',
            },
          },
        },
        AgentCheckerResult: {
          type: 'object',
          properties: {
            score: {
              type: 'number',
              description: 'Overall score (0-100)',
            },
            tier: {
              type: 'string',
              enum: ['Agent-Ready', 'Needs Work', 'Not Ready'],
              description: 'Overall tier classification',
            },
            checks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number',
                  },
                  question: {
                    type: 'string',
                  },
                  pass: {
                    type: 'boolean',
                  },
                  note: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Agent Checker',
        description: 'Operations for checking website compatibility with AI agents',
      },
      {
        name: 'Scraper',
        description: 'Operations for managing scraping jobs',
      },
      {
        name: 'Health',
        description: 'Health check operations',
      },
      {
        name: 'Authentication',
        description: 'Authentication and user information operations',
      },
    ],
  };

  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}

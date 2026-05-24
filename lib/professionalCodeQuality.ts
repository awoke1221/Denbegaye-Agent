// ===========================================
// DENBEGNAYE AGENT - PROFESSIONAL CODE QUALITY
// Enterprise-Grade Error Handling, Logging & Testing
// ===========================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';

// ===========================================
// ERROR HANDLING SYSTEM
// ===========================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
  details?: any;
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// ===========================================
// GLOBAL ERROR HANDLER
// ===========================================

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          ...(error instanceof ValidationError && error.details && { details: error.details }),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }

  // Generic error handling
  const isDevelopment = process.env.NODE_ENV === 'development';
  return NextResponse.json(
    {
      error: {
        message: isDevelopment ? (error as Error).message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  );
}

// ===========================================
// API RESPONSE UTILITIES
// ===========================================

export class ApiResponse {
  static success<T>(data: T, message?: string, meta?: any): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      message,
      ...(meta && { meta }),
    });
  }

  static error(message: string, code: string = 'ERROR', status: number = 400): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: { message, code },
      },
      { status }
    );
  }

  static paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ): NextResponse {
    return NextResponse.json({
      success: true,
      data,
      pagination,
    });
  }
}

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

export const UserSchemas = {
  profile: z.object({
    full_name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    timezone: z.string().optional(),
    preferences: z.record(z.any()).optional(),
  }),

  agent: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    config: z.record(z.any()),
    tags: z.array(z.string()).optional(),
  }),

  execution: z.object({
    agent_id: z.string().uuid(),
    input_data: z.record(z.any()),
    config: z.record(z.any()).optional(),
  }),
};

// ===========================================
// AUTHENTICATION MIDDLEWARE
// ===========================================

export async function authenticateRequest(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError();
  }

  const token = authHeader.substring(7);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthenticationError('Invalid or expired token');
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    throw new AuthenticationError('Email not verified');
  }

  return user.id;
}

export async function authorizeResource(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string = 'read'
): Promise<void> {
  // Check resource ownership based on type
  let query;
  switch (resourceType) {
    case 'agent':
      query = supabase.from('user_agents').select('user_id').eq('id', resourceId).single();
      break;
    case 'execution':
      query = supabase.from('agent_executions').select('user_id').eq('id', resourceId).single();
      break;
    default:
      throw new AuthorizationError('Unknown resource type');
  }

  const { data, error } = await query;

  if (error || !data) {
    throw new NotFoundError(resourceType);
  }

  if (data.user_id !== userId) {
    throw new AuthorizationError();
  }
}

// ===========================================
// RATE LIMITING
// ===========================================

export class RateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>();

  static check(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000 // 1 minute
  ): boolean {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    const current = this.limits.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > current.resetTime) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }

    if (current.count >= maxRequests) {
      return false;
    }

    current.count++;
    this.limits.set(key, current);
    return true;
  }

  static getRemainingRequests(identifier: string, windowMs: number = 60000): number {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    const current = this.limits.get(key);

    if (!current || now > current.resetTime) {
      return 100; // Default limit
    }

    return Math.max(0, 100 - current.count);
  }
}

// ===========================================
// LOGGING SYSTEM
// ===========================================

export class Logger {
  static info(message: string, meta?: any) {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  static warn(message: string, meta?: any) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  static error(message: string, error?: Error, meta?: any) {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : undefined,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  }

  static api(request: NextRequest, response: NextResponse, duration: number) {
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'api_request',
        method: request.method,
        url: request.url,
        status: response.status,
        duration,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for'),
        timestamp: new Date().toISOString(),
      })
    );
  }
}

// ===========================================
// API ROUTE TEMPLATE
// ===========================================

// lib/apiHandler.ts
export function createApiHandler<TQuery = any, TBody = any, TResponse = any>(
  config: {
    requireAuth?: boolean;
    rateLimit?: { maxRequests?: number; windowMs?: number };
    validation?: {
      query?: z.ZodSchema<TQuery>;
      body?: z.ZodSchema<TBody>;
    };
  },
  handler: (params: {
    request: NextRequest;
    userId?: string;
    query: TQuery;
    body: TBody;
  }) => Promise<NextResponse<TResponse>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      // Rate limiting
      if (config.rateLimit) {
        const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
        if (!RateLimiter.check(clientIp, config.rateLimit.maxRequests, config.rateLimit.windowMs)) {
          return ApiResponse.error('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
        }
      }

      // Authentication
      let userId: string | undefined;
      if (config.requireAuth) {
        userId = await authenticateRequest(request);
      }

      // Validation
      let query: TQuery = {} as TQuery;
      let body: TBody = {} as TBody;

      if (config.validation?.query) {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams);
        query = config.validation.query.parse(queryParams);
      }

      if (config.validation?.body) {
        const requestBody = await request.json();
        body = config.validation.body.parse(requestBody);
      }

      // Execute handler
      const response = await handler({ request, userId, query, body });

      // Log successful request
      Logger.api(request, response, Date.now() - startTime);

      return response;
    } catch (error) {
      // Log error
      Logger.error('API request failed', error as Error, {
        url: request.url,
        method: request.method,
        duration: Date.now() - startTime,
      });

      return handleApiError(error);
    }
  };
}
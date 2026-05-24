/**
 * Backend API Proxy - Forwards requests from Next.js frontend to Workers backend
 * Handles authentication, request forwarding, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface ForwardOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string | string[]>;
}

/**
 * Forward a request to the workers backend
 */
export async function forwardToBackend(
  endpoint: string,
  options: ForwardOptions,
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Build URL with query parameters
    const url = new URL(`${BACKEND_URL}${endpoint}`);
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v));
        } else if (value) {
          url.searchParams.set(key, value);
        }
      });
    }

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Forward authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    // Make the request to backend
    const backendResponse = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Parse response
    const contentType = backendResponse.headers.get('content-type');
    let responseData: any;

    if (contentType?.includes('application/json')) {
      responseData = await backendResponse.json();
    } else {
      responseData = await backendResponse.text();
    }

    // Return response from backend
    return NextResponse.json(responseData, { status: backendResponse.status });
  } catch (error) {
    console.error('Backend forwarding error:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to backend service',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Extract query parameters from Next.js request
 */
export function getQueryParams(request: NextRequest): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });
  return params;
}

/**
 * Get auth token from request
 */
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Create authorization headers
 */
export function createAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }
  return headers;
}

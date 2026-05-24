import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Profile, DatabaseResponse, DatabaseError } from '@/types/database';

/**
 * Helper function to get auth token from request
 */
async function getAuthToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Helper function to verify user token
 */
async function verifyUser(token: string): Promise<{ id: string; email: string } | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  return { id: user.id, email: user.email || '' };
}

/**
 * GET /api/profile
 * Fetch current user's profile
 * Returns: Profile object
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Token verification failed' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        {
          error: 'Profile not found',
          message: error.message,
        },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error: 'Profile not found',
          message: 'User profile does not exist',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        data,
      } as DatabaseResponse<Profile>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile
 * Allowed fields: full_name, avatar_url, bio, timezone, preferences
 * Returns: Updated Profile object
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const user = await verifyUser(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Token verification failed' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Whitelist of allowed fields to update
    const allowedFields = ['full_name', 'avatar_url', 'bio', 'timezone', 'preferences'];

    // Build update object with only allowed fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Validate preferences is an object if provided
    if (updateData.preferences && typeof updateData.preferences !== 'object') {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'preferences must be an object',
        },
        { status: 400 }
      );
    }

    // Validate timezone if provided
    if (updateData.timezone && typeof updateData.timezone !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'timezone must be a string',
        },
        { status: 400 }
      );
    }

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        {
          error: 'Update failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data,
      } as DatabaseResponse<Profile>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE method not supported
 */
export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'DELETE is not supported on /api/profile' },
    { status: 405 }
  );
}

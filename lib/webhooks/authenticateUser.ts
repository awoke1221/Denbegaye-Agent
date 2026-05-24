import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export async function authenticateUser(request: NextRequest): Promise<User> {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new AuthenticationError('Unauthorized: No token provided');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new AuthenticationError('Invalid token', 401);
  }

  return user;
}

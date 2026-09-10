import { NextRequest } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

export async function getOfficeIntelligenceUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const client = supabaseAdmin || supabase;
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);

    return error || !user ? null : user;
  } catch {
    return null;
  }
}

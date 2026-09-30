import { randomUUID } from 'crypto';
import { extname } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getOfficeIntelligenceUser } from '@/lib/office-intelligence-auth';
import { supabaseAdmin } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

const uploadBucket = 'office-intelligence-uploads';
const maxUploadBytes = 50 * 1024 * 1024;
const allowedExtensions = new Set([
  '.db',
  '.sqlite',
  '.sqlite3',
  '.csv',
  '.xlsx',
  '.xls',
  '.json',
  '.docx',
  '.doc',
  '.pdf',
]);

export async function GET(request: NextRequest) {
  const user = await getOfficeIntelligenceUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Office Intelligence signed upload endpoint is active.',
    max_file_size_bytes: maxUploadBytes,
  });
}

export async function POST(request: NextRequest) {
  const user = await getOfficeIntelligenceUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json(
      { ok: false, error: 'Supabase server storage is not configured.' },
      { status: 503 }
    );
  }

  let body: { name?: unknown; size?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid upload request.' }, { status: 400 });
  }

  const originalName = typeof body.name === 'string' ? body.name : '';
  const extension = extname(originalName).toLowerCase();
  const size = Number(body.size);
  if (!originalName || !Number.isSafeInteger(size) || size <= 0) {
    return NextResponse.json(
      { ok: false, error: 'A filename and valid file size are required.' },
      { status: 400 }
    );
  }
  if (!allowedExtensions.has(extension)) {
    return NextResponse.json({ ok: false, error: 'File type is not supported.' }, { status: 400 });
  }
  if (size > maxUploadBytes) {
    return NextResponse.json(
      { ok: false, error: 'File exceeds the 50 MB upload limit.' },
      { status: 413 }
    );
  }

  const storagePath = `${user.id}/${randomUUID()}${extension}`;
  const { data, error } = await supabaseAdmin.storage
    .from(uploadBucket)
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error('Failed to create Office Intelligence upload ticket:', error.message);
    return NextResponse.json(
      { ok: false, error: 'Could not prepare the file upload.' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      signed_url: data.signedUrl,
      token: data.token,
      storage_path: data.path,
      bucket: uploadBucket,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

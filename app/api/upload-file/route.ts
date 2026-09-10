import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getOfficeIntelligenceUser } from '@/lib/office-intelligence-auth';

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), '.uploads', 'office-intelligence');

function sanitizeFilename(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET(request: NextRequest) {
  const user = await getOfficeIntelligenceUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Office Intelligence upload endpoint is active.',
    uploadDirectory: UPLOAD_DIR,
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getOfficeIntelligenceUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const uploadedFile = formData.get('file');

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file was uploaded.' }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const safeName = `${Date.now()}-${sanitizeFilename(uploadedFile.name)}`;
    const filePath = path.join(UPLOAD_DIR, safeName);
    const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

    await writeFile(filePath, fileBuffer);

    return NextResponse.json({
      ok: true,
      file_name: uploadedFile.name,
      file_path: filePath,
      size: fileBuffer.length,
      type: uploadedFile.type || 'application/octet-stream',
      uploaded_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Office Intelligence upload failed:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to store uploaded file.',
        details: error instanceof Error ? error.message : 'Unknown upload error',
      },
      { status: 500 }
    );
  }
}

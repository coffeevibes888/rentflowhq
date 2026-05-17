/**
 * POST /api/mobile/upload
 *
 * Mirrors /api/upload but uses mobile-token auth so the app can upload images.
 * Multipart form-data: { file, folder? }
 *
 * Response: { url, publicId, width, height }
 */
import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { verifyMobileToken } from '@/lib/mobile-auth';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyMobileToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'mobile-uploads';

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadToCloudinary(buf, {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });

    return NextResponse.json({
      success: true,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (error) {
    console.error('[mobile/upload]', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

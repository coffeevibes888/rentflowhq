import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function requireCloudinaryConfig() {
  if (!isCloudinaryConfigured) {
    throw new Error(
      'Cloudinary environment variables are missing. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
    );
  }
}

export { cloudinary };

export function getSignedCloudinaryUrl(params: {
  publicId: string;
  resourceType?: 'image' | 'raw' | 'video';
  expiresInSeconds?: number;
}) {
  requireCloudinaryConfig();
  const resourceType = params.resourceType || 'raw';
  const expiresInSeconds = params.expiresInSeconds ?? 60 * 10;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.url(params.publicId, {
    resource_type: resourceType,
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
  });
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: UploadApiOptions
): Promise<UploadApiResponse> {
  requireCloudinaryConfig();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(error || new Error('Unknown Cloudinary upload error'));
          return;
        }
        resolve(result);
      })
      .end(fileBuffer);
  });
}

export async function uploadUrlToCloudinary(
  fileUrl: string,
  options: UploadApiOptions
): Promise<UploadApiResponse> {
  requireCloudinaryConfig();
  const result = await cloudinary.uploader.upload(fileUrl, options);
  return result;
}

import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { auth } from '@/auth';

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({
    image: { maxFileSize: '4MB' },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError('Unauthorized');
      return { userId: session?.user?.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
  videoUploader: f({
    video: { maxFileSize: '256MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError('Unauthorized');
      return { userId: session?.user?.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
  blogMediaUploader: f({
    image: { maxFileSize: '8MB' },
    video: { maxFileSize: '64MB' },
    pdf: { maxFileSize: '16MB' },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session || (session.user?.role !== 'admin' && session.user?.role !== 'superAdmin')) {
        throw new UploadThingError('Unauthorized');
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      return { uploadedBy: metadata.userId };
    }),
  workOrderMedia: f({
    image: { maxFileSize: '16MB', maxFileCount: 10 },
    video: { maxFileSize: '64MB', maxFileCount: 3 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError('Unauthorized');
      return { userId: session.user?.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl || file.url, type: file.type };
    }),
} satisfies FileRouter;
export type OurFileRouter = typeof ourFileRouter;

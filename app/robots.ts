import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://propertyflowhq.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/user/',
          '/employee/',
          '/contractor/',
          '/agent/',
          '/super-admin/',
          '/onboarding/',
          '/sign/',
          '/verify-payment-method/',
          '/_next/',
          '/unauthorized/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

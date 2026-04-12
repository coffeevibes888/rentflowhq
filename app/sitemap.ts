import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://propertyflowhq.com';
  
  // Static pages
  const staticPages = [
    '',
    '/contact',
    '/contractors',
    '/sign-in',
    '/sign-up',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));

  return staticEntries;
}

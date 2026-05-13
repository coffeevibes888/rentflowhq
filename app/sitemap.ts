import { MetadataRoute } from 'next';
import { prisma } from '@/db/prisma';
import { SERVER_URL } from '@/lib/constants';

/**
 * Dynamic sitemap — Phase 1 SEO foundation.
 *
 * Covers:
 *  - Static marketing pages
 *  - Every public contractor subdomain  → /{slug}
 *  - Every landlord subdomain           → /{subdomain}
 *  - Every available landlord property  → /{subdomain}/properties/{slug}
 *  - Every agent subdomain              → /{subdomain}
 *  - Every active agent listing         → /{subdomain}/listings/{slug}
 *
 * All URLs use the canonical apex host so /c/{slug} duplicates don't split
 * ranking signals. If the total exceeds 50k URLs, split via generateSitemaps.
 */

const baseUrl = (SERVER_URL || 'https://www.propertyflowhq.com').replace(/\/+$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ──────────────────────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = (
    [
      { path: '',            freq: 'weekly',  pri: 1.0 },
      { path: '/contact',    freq: 'monthly', pri: 0.6 },
      { path: '/contractors',freq: 'daily',   pri: 0.9 },
      { path: '/listings',   freq: 'daily',   pri: 0.9 },
      { path: '/about',      freq: 'monthly', pri: 0.5 },
      { path: '/faq',        freq: 'monthly', pri: 0.5 },
      { path: '/sign-in',    freq: 'monthly', pri: 0.3 },
      { path: '/sign-up',    freq: 'monthly', pri: 0.3 },
    ] as const
  ).map((p) => ({
    url: `${baseUrl}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.freq as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: p.pri,
  }));

  // ── Dynamic queries — all in parallel, each failure-tolerant ─────────────
  const [contractors, landlords, properties, agents, agentListings] = await Promise.all([

    // Contractors — use subdomain if set, otherwise slug
    prisma.contractorProfile
      .findMany({
        where: { isPublic: true },
        select: { slug: true, subdomain: true, updatedAt: true },
      })
      .catch(() => [] as { slug: string; subdomain: string | null; updatedAt: Date }[]),

    // Landlords — subdomain is non-nullable
    prisma.landlord
      .findMany({
        select: { subdomain: true, updatedAt: true },
      })
      .catch(() => [] as { subdomain: string; updatedAt: Date }[]),

    // Properties with available units — join landlord subdomain via separate query
    prisma.property
      .findMany({
        where: {
          status: { not: 'deleted' },
          units: { some: { isAvailable: true } },
        },
        select: {
          slug: true,
          updatedAt: true,
          landlordId: true,
        },
      })
      .catch(() => [] as { slug: string; updatedAt: Date; landlordId: string }[]),

    // Agents — subdomain is non-nullable
    prisma.agent
      .findMany({
        select: { subdomain: true, updatedAt: true },
      })
      .catch(() => [] as { subdomain: string; updatedAt: Date }[]),

    // Active agent listings — join agent subdomain via separate query
    prisma.agentListing
      .findMany({
        where: { status: 'active' },
        select: {
          slug: true,
          updatedAt: true,
          agentId: true,
        },
      })
      .catch(() => [] as { slug: string; updatedAt: Date; agentId: string }[]),
  ]);

  // Build lookup maps for the join data

  // We need landlordId → subdomain for properties
  const landlordById = await (async () => {
    if (properties.length === 0) return new Map<string, string>();
    const ids = [...new Set(properties.map((p) => p.landlordId).filter((id): id is string => id !== null))];
    if (ids.length === 0) return new Map<string, string>();
    const rows = await prisma.landlord
      .findMany({ where: { id: { in: ids } }, select: { id: true, subdomain: true } })
      .catch(() => [] as { id: string; subdomain: string }[]);
    return new Map(rows.map((r) => [r.id, r.subdomain]));
  })();

  // We need agentId → subdomain for listings
  const agentById = await (async () => {
    if (agentListings.length === 0) return new Map<string, string>();
    const ids = [...new Set(agentListings.map((l) => l.agentId))];
    const rows = await prisma.agent
      .findMany({ where: { id: { in: ids } }, select: { id: true, subdomain: true } })
      .catch(() => [] as { id: string; subdomain: string }[]);
    return new Map(rows.map((r) => [r.id, r.subdomain]));
  })();

  // ── Build entries ─────────────────────────────────────────────────────────

  const contractorEntries: MetadataRoute.Sitemap = contractors.map((c) => ({
    url: `${baseUrl}/${c.subdomain || c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const landlordEntries: MetadataRoute.Sitemap = landlords.map((l) => ({
    url: `${baseUrl}/${l.subdomain}`,
    lastModified: l.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const propertyEntries: MetadataRoute.Sitemap = properties
    .map((p) => {
      if (!p.landlordId) return null;
      const subdomain = landlordById.get(p.landlordId);
      if (!subdomain) return null;
      return {
        url: `${baseUrl}/${subdomain}/properties/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const agentEntries: MetadataRoute.Sitemap = agents.map((a) => ({
    url: `${baseUrl}/${a.subdomain}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const agentListingEntries: MetadataRoute.Sitemap = agentListings
    .map((al) => {
      const subdomain = agentById.get(al.agentId);
      if (!subdomain) return null;
      return {
        url: `${baseUrl}/${subdomain}/listings/${al.slug}`,
        lastModified: al.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return [
    ...staticEntries,
    ...contractorEntries,
    ...landlordEntries,
    ...propertyEntries,
    ...agentEntries,
    ...agentListingEntries,
  ];
}

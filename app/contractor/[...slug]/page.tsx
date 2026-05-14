import { redirect } from 'next/navigation';

// Catch-all redirect: /contractor/* → /contractor-dashboard/*
// Handles bookmarks and any hardcoded links to the old URL structure.
export default function ContractorCatchAllRedirect({
  params,
}: {
  params: { slug: string[] };
}) {
  const path = params.slug?.join('/') ?? '';
  redirect(`/contractor-dashboard/${path}`);
}

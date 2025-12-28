"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface SubdomainApplyButtonProps {
  propertySlug: string;
}

export function SubdomainApplyButton({ propertySlug }: SubdomainApplyButtonProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  // Extract subdomain from pathname (e.g., /landlord-slug/properties/... -> landlord-slug)
  const subdomain = pathname.split('/')[1];

  // If user is a tenant, send them straight to the application
  if (session?.user?.role === "tenant") {
    return (
      <Link
        href={`/${subdomain}/application?property=${encodeURIComponent(propertySlug)}`}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-600 transition-all hover:scale-105 group"
      >
        Apply Now - No Fees
      </Link>
    );
  }

  // If not logged in or not a tenant (landlord, property_manager, or no account yet),
  // send them to sign-in with special message flag, property slug, and redirect to dashboard after
  const signInHref = `/${subdomain}/sign-in?fromProperty=true&propertySlug=${encodeURIComponent(propertySlug)}`;

  return (
    <Link
      href={signInHref}
      className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-600 transition-all hover:scale-105 group"
    >
      Apply Now - No Fees
    </Link>
  );
}

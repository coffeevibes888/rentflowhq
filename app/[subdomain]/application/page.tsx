"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ApplicationWizard } from "@/components/tenant/application-wizard";

export default function SubdomainApplicationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const propertySlug = searchParams.get("property") ?? "";
  const [propertyName, setPropertyName] = useState<string>("");

  // Redirect to sign-up if not authenticated or not a tenant
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "tenant") {
      // User is authenticated and is a tenant, allow access
      return;
    } else if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "tenant")) {
      // Not authenticated or not a tenant, redirect to sign-up with propertySlug
      const signUpUrl = propertySlug
        ? `/sign-up?fromProperty=true&propertySlug=${encodeURIComponent(propertySlug)}`
        : "/sign-up?fromProperty=true";
      router.push(signUpUrl);
    }
  }, [status, session?.user?.role, propertySlug, router]);

  // Fetch property name if we have a slug
  useEffect(() => {
    if (propertySlug) {
      fetch(`/api/products/slug/${propertySlug}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.name) {
            setPropertyName(data.name);
          }
        })
        .catch(() => {});
    }
  }, [propertySlug]);

  if (status === "loading" || status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "tenant")) {
    return (
      <main className="flex-1 w-full flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-slate-200">Redirecting to sign up...</p>
        </div>
      </main>
    );
  }

  const handleComplete = () => {
    router.push("/user/dashboard");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ApplicationWizard
      propertySlug={propertySlug}
      propertyName={propertyName || propertySlug}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { headers } from 'next/headers';
import { SubdomainApplyButton } from '@/components/subdomain/apply-button';
import SubdomainHero from '@/components/subdomain/subdomain-hero';
import {
  CheckCircle2,
  CreditCard,
  Smartphone,
  Building2,
  Zap,
  Shield,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import type { Landlord } from '@prisma/client';

/**
 * Root page for any subdomain
 * Conversion-focused landing page with property listings
 * If logged in tenant, redirects to main domain tenant dashboard
 * If logged in landlord, redirects to main domain admin dashboard
 */

export default async function SubdomainRootPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  // Verify the subdomain exists and get owner info
  // Only select fields we actually use to avoid Decimal serialization issues
  const landlord = await prisma.landlord.findUnique({
    where: { subdomain },
    select: {
      id: true,
      name: true,
      subdomain: true,
      companyName: true,
      companyEmail: true,
      companyPhone: true,
      companyAddress: true,
      heroImages: true,
      owner: {
        select: {
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!landlord) {
    redirect('/');
  }

  const session = await auth();

  // Note: We allow landlords to view their own portal (for preview purposes)
  // Only redirect tenants who already have an active lease with this landlord
  if (session?.user?.id && session.user.role === 'tenant') {
    const tenantLease = await prisma.lease.findFirst({
      where: {
        tenantId: session.user.id,
        status: 'active',
        unit: {
          property: {
            landlordId: landlord.id,
          },
        },
      },
    }).catch(() => null);

    if (tenantLease) {
      redirect('/user/dashboard');
    }
  }

  // Get available properties
  const properties = await prisma.property.findMany({
    where: {
      landlordId: landlord.id,
      units: {
        some: {
          isAvailable: true,
        },
      },
    },
    include: {
      units: {
        where: { isAvailable: true },
        take: 3,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const brandName = landlord.companyName || landlord.name;
  const brandEmail = landlord.companyEmail || landlord.owner?.email;
  const brandPhone = landlord.companyPhone || landlord.owner?.phoneNumber;
  const brandAddress = landlord.companyAddress;
  const heroImages = landlord.heroImages || [];
  const heroMedia = heroImages.length
    ? heroImages
    : properties.flatMap((property) => property.units.flatMap((u) => u.images || [])).slice(0, 3);

  return (
    <main className="flex-1 w-full">
        {/* Hero Section - Conversion Focused */}
        <SubdomainHero
          brandName={brandName}
          brandEmail={brandEmail}
          brandPhone={brandPhone}
          brandAddress={brandAddress}
          heroMedia={heroMedia}
          subdomain={subdomain}
        />

        {/* Property Listings Section (moved up for visibility) */}
        <section id="properties" className="w-full py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Available Properties
                </h2>
                <Link
                  href={`/${subdomain}/sign-in`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-all hover:scale-105 shadow-lg"
                >
                  Apply Now
                </Link>
              </div>
              <p className="text-lg text-slate-700">
                Browse our available units and find your perfect home
              </p>
            </div>

            {properties.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm px-4 py-12 text-center shadow-lg">
                <p className="text-slate-700 mb-4">No properties are currently available.</p>
                <p className="text-sm text-slate-500">
                  Please check back soon or contact us for more information.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => {
                  const unitCount = property.units.length;
                  const firstUnit = property.units[0];
                  // Get first available image from any unit
                  const propertyImage = property.units.find(u => u.images?.length > 0)?.images?.[0] || null;
                  const isApartmentComplex = property.type === 'apartment' && unitCount > 3;
                  
                  // For apartment complexes, calculate price range and bed/bath range
                  const minRent = isApartmentComplex 
                    ? Math.min(...property.units.map(u => Number(u.rentAmount) || 0).filter(r => r > 0))
                    : null;
                  const maxRent = isApartmentComplex
                    ? Math.max(...property.units.map(u => Number(u.rentAmount) || 0))
                    : null;
                  const bedRange = isApartmentComplex
                    ? {
                        min: Math.min(...property.units.map(u => u.bedrooms || 0)),
                        max: Math.max(...property.units.map(u => u.bedrooms || 0))
                      }
                    : null;
                  
                  return (
                    <Link
                      key={property.id}
                      href={`/${subdomain}/properties/${property.slug}`}
                      className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-lg overflow-hidden flex flex-col hover:border-violet-400 transition-all hover:scale-[1.02]"
                    >
                      <div className="relative h-56 w-full bg-slate-100">
                        {propertyImage ? (
                          <Image
                            src={propertyImage}
                            alt={property.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
                            <Building2 className="h-16 w-16" />
                          </div>
                        )}
                        {isApartmentComplex && (
                          <div className="absolute top-3 left-3 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            Apartment Community
                          </div>
                        )}
                      </div>
                      <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xl mb-2">{property.name}</h3>
                          {property.address && 
                           typeof property.address === 'object' && 
                           !Array.isArray(property.address) &&
                           'street' in property.address && (
                            <p className="text-sm text-slate-600">
                              {String((property.address as { street?: string }).street || '')}
                            </p>
                          )}
                        </div>
                        
                        {isApartmentComplex ? (
                          // Apartment complex display - Zillow/Apartments.com style
                          <>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              {bedRange && (
                                <span>
                                  {bedRange.min === bedRange.max 
                                    ? (bedRange.min === 0 ? 'Studio' : `${bedRange.min} bed${bedRange.min !== 1 ? 's' : ''}`)
                                    : `${bedRange.min === 0 ? 'Studio' : bedRange.min} - ${bedRange.max} beds`}
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-violet-600">
                              {minRent && maxRent && minRent !== maxRent ? (
                                <>
                                  {formatCurrency(minRent)} - {formatCurrency(maxRent)}
                                  <span className="text-sm font-normal text-slate-500">/mo</span>
                                </>
                              ) : (
                                <>
                                  Starting at {formatCurrency(minRent || 0)}
                                  <span className="text-sm font-normal text-slate-500">/mo</span>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {unitCount} unit{unitCount !== 1 ? 's' : ''} available
                            </p>
                          </>
                        ) : (
                          // Single property / small multi-unit display
                          <>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              {firstUnit && (
                                <>
                                  {firstUnit.bedrooms && Number(firstUnit.bedrooms) > 0 && (
                                    <span>{Number(firstUnit.bedrooms)} bed{Number(firstUnit.bedrooms) !== 1 ? 's' : ''}</span>
                                  )}
                                  {firstUnit.bathrooms && Number(firstUnit.bathrooms) > 0 && (
                                    <span>{Number(firstUnit.bathrooms)} bath{Number(firstUnit.bathrooms) !== 1 ? 's' : ''}</span>
                                  )}
                                </>
                              )}
                            </div>
                            {firstUnit?.rentAmount && (
                              <div className="text-2xl font-bold text-violet-600">
                                {formatCurrency(Number(firstUnit.rentAmount))}
                                <span className="text-sm font-normal text-slate-500">/month</span>
                              </div>
                            )}
                            {unitCount > 1 && (
                              <p className="text-xs text-slate-500">
                                {unitCount} unit{unitCount !== 1 ? 's' : ''} available
                              </p>
                            )}
                          </>
                        )}
                        
                        <div className="mt-auto">
                          <span className="text-violet-600 text-sm font-medium hover:underline">
                            {isApartmentComplex ? 'View Floor Plans & Availability →' : 'View Details & Schedule Tour →'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="w-full py-12 px-4 bg-slate-900/40">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
                Pay Rent Your Way
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-400/30">
                    <CreditCard className="h-8 w-8 text-violet-300" />
                  </div>
                  <h3 className="font-semibold text-white">Credit/Debit Card</h3>
                  <p className="text-xs text-slate-300/80">Instant payments</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                    <Smartphone className="h-8 w-8 text-emerald-300" />
                  </div>
                  <h3 className="font-semibold text-white">Venmo</h3>
                  <p className="text-xs text-slate-300/80">Send from your phone</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
                    <Smartphone className="h-8 w-8 text-cyan-300" />
                  </div>
                  <h3 className="font-semibold text-white">CashApp</h3>
                  <p className="text-xs text-slate-300/80">Quick & easy</p>
                </div>
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                    <Building2 className="h-8 w-8 text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-white">Bank Transfer</h3>
                  <p className="text-xs text-slate-300/80">Automatic payments</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Why Choose {landlord.name}?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-400/30">
                  <Zap className="h-6 w-6 text-violet-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Fast Application Process</h3>
                <p className="text-sm text-slate-300/80">
                  Apply online in minutes. No paperwork, no hassle. Get approved quickly and move in faster.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                  <DollarSign className="h-6 w-6 text-emerald-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">No Application Fees</h3>
                <p className="text-sm text-slate-300/80">
                  Apply completely free. No hidden costs, no surprises. What you see is what you get.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                  <Shield className="h-6 w-6 text-blue-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Secure Online Payments</h3>
                <p className="text-sm text-slate-300/80">
                  Pay rent securely online. Set up automatic payments and never worry about late fees.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
                  <Clock className="h-6 w-6 text-amber-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">24/7 Maintenance</h3>
                <p className="text-sm text-slate-300/80">
                  Submit maintenance requests anytime, day or night. Track status and get updates in real-time.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-400/30">
                  <Smartphone className="h-6 w-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Mobile-Friendly Portal</h3>
                <p className="text-sm text-slate-300/80">
                  Access everything from your phone. Pay rent, submit requests, view documents - all in one app.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
                  <Building2 className="h-6 w-6 text-cyan-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Professional Management</h3>
                <p className="text-sm text-slate-300/80">
                  Experienced property management team dedicated to making your rental experience smooth and stress-free.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Find Your New Home?
              </h2>
              <p className="text-lg text-slate-200/90 mb-8">
                Apply online in minutes. No application fees. Get approved and move in faster.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/${subdomain}/sign-in`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet-600 hover:bg-violet-50 transition-all hover:scale-105 shadow-lg"
                >
                  Start Your Application
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href={`/${subdomain}/sign-in`}
                  className="inline-flex items-center justify-center rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-sm"
                >
                  Already Applied? Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}

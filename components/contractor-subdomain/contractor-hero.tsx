'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { CheckCircle2, MessageSquare, MapPin } from 'lucide-react';
import { ContractorQuoteButton } from '@/components/contractor/quote-button';
import { ContractorMessageWidget } from './contractor-message-widget';

interface ContractorSubdomainHeroProps {
  brandName: string;
  tagline?: string | null;
  brandEmail?: string | null;
  brandPhone?: string | null;
  baseCity?: string | null;
  baseState?: string | null;
  heroMedia: string[];
  subdomain: string;
  slug: string;
  specialties?: string[];
  contractorId?: string;
  contractorImage?: string | null;
  isAvailable?: boolean;
}

export default function ContractorSubdomainHero({
  brandName,
  tagline,
  brandEmail,
  brandPhone,
  baseCity,
  baseState,
  heroMedia,
  subdomain,
  slug,
  specialties = [],
  contractorId,
  contractorImage,
  isAvailable = true,
}: ContractorSubdomainHeroProps) {
  const location = [baseCity, baseState].filter(Boolean).join(', ');
  
  return (
    <div className="relative w-full min-h-[480px] md:h-[600px] overflow-visible flex items-center justify-center bg-transparent">
      <div className="w-full max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-start gap-8 md:gap-10 h-full pt-10 pb-10 md:ml-4">
        <div className="flex-1 flex flex-col items-center md:items-start gap-6 mt-0">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center md:text-left space-y-3"
          >
            <p className="text-xs tracking-[0.35em] uppercase text-slate-300/80">Professional Contractor</p>
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(129,140,248,0.65)]"
              style={{ fontFamily: 'Helvetica Neue, system-ui' }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: 'easeOut' }}
            >
              {brandName}
            </motion.h1>
            <motion.p
              className="text-sm sm:text-lg text-white/90 max-w-xl mx-auto md:mx-0 font-light"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
            >
              {tagline || `Quality workmanship, reliable service, and professional results—by ${brandName}.`}
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="w-full sm:w-auto">
              <ContractorQuoteButton
                contractorSlug={slug}
                contractorName={brandName}
              />
            </div>
            <Link href={`#services`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-8 py-3 rounded-full font-semibold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-all text-sm sm:text-base"
              >
                View Services
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
          >
            {specialties.slice(0, 4).map((specialty) => (
              <div key={specialty} className="flex items-center gap-2 text-violet-200 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">{specialty}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="text-sm text-slate-300/80 space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6 }}
          >
            {brandEmail && <p>Contact: <span className="text-slate-100">{brandEmail}</span></p>}
            {brandPhone && <p>Phone: <span className="text-slate-100">{brandPhone}</span></p>}
            {location && (
              <p className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="text-slate-100">{location}</span>
              </p>
            )}
          </motion.div>
        </div>

        <div className="flex-1 flex items-start justify-center w-full pt-2">
          {contractorId ? (
            <ContractorMessageWidget
              contractorId={contractorId}
              contractorName={brandName}
              contractorImage={contractorImage}
              contractorEmail={brandEmail}
              contractorPhone={brandPhone}
              subdomain={subdomain}
              isAvailable={isAvailable}
              responseTime="Usually responds within 2 hours"
            />
          ) : (
            <HeroImageRotator heroMedia={heroMedia} brandName={brandName} />
          )}
        </div>
      </div>
    </div>
  );
}


function HeroImageRotator({ heroMedia, brandName }: { heroMedia: string[]; brandName: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (heroMedia.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % heroMedia.length);
    }, 5000);
    return () => clearInterval(t);
  }, [heroMedia.length]);

  if (!heroMedia.length) {
    return (
      <div className="relative w-full max-w-md aspect-square flex items-center justify-center -mt-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center text-slate-200/90 w-full">
          Portfolio images coming soon.
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full max-w-md aspect-square flex items-center justify-center -mt-6 select-none"
      style={{ perspective: '2000px' }}
    >
      {heroMedia.map((src, i) => {
        const isActive = index === i;

        return (
          <motion.div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85, rotateY: -65 }}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.6,
              rotateY: isActive ? 0 : -65,
              zIndex: isActive ? 10 : 0,
            }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
          >
            <motion.div
              className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              animate={{ rotateY: isActive ? [0, 8, -8, 0] : 0 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
            >
              <Image
                src={src}
                alt={`${brandName} work ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 480px, (min-width: 768px) 400px, 80vw"
                className="object-cover drop-shadow-xl select-none"
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Dots */}
      {heroMedia.length > 1 && (
        <div className="absolute bottom-3 flex gap-3 z-20">
          {heroMedia.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              type="button"
              aria-label={`Show image ${i + 1}`}
              className={`min-h-[28px] min-w-[28px] rounded-full border border-black/20 flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/90 focus-visible:ring-offset-slate-900 ${
                index === i ? 'bg-black' : 'bg-gray-300/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

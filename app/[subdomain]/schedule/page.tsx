import { notFound } from 'next/navigation';
import { prisma } from '@/db/prisma';
import { detectSubdomainEntity } from '@/lib/utils/subdomain-detection';
import { Calendar, Clock, User, Mail, Phone, MessageSquare } from 'lucide-react';

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  
  const entity = await detectSubdomainEntity(subdomain);
  
  if (entity.type !== 'contractor') {
    notFound();
  }

  const contractor = entity.data;
  const brandName = contractor.businessName;

  return (
    <main className="flex-1 w-full min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Schedule an Appointment
          </h1>
          <p className="text-lg text-slate-300">
            Book a time with {brandName}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left - Calendar/Time Selection */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-400" />
                Select Date & Time
              </h2>
              <div className="space-y-4">
                <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-violet-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">Calendar Integration Coming Soon</h3>
                  <p className="text-slate-400 mb-4">
                    For now, please contact us directly to schedule your appointment
                  </p>
                  <div className="flex flex-col gap-3">
                    {contractor.phone && (
                      <a
                        href={`tel:${contractor.phone}`}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        Call {contractor.phone}
                      </a>
                    )}
                    {contractor.email && (
                      <a
                        href={`mailto:${contractor.email}`}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        Email Us
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Contact Form */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-violet-400" />
                Your Information
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Service Needed
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    placeholder="Describe what you need help with..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all"
                >
                  Request Appointment
                </button>
              </form>
            </div>
          </div>

          {/* Quick Contact Options */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-center text-slate-400 mb-4">
              Prefer to reach out directly?
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {contractor.phone && (
                <a
                  href={`tel:${contractor.phone}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {contractor.phone}
                </a>
              )}
              {contractor.email && (
                <a
                  href={`mailto:${contractor.email}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Email Us
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare } from 'lucide-react';
import InstantBookingModal from '@/components/contractor/booking/instant-booking-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface BookingButtonsProps {
  contractorId: string;
  contractorName: string;
  instantBookingEnabled?: boolean;
  displayName?: string;
  businessName?: string;
  depositRequired?: boolean;
  depositAmount?: number | null;
  cancellationPolicy?: string;
  cancellationHours?: number;
}

export default function BookingButtons({
  contractorId,
  contractorName,
  instantBookingEnabled,
  displayName,
  businessName,
  depositRequired,
  depositAmount,
  cancellationPolicy,
  cancellationHours,
}: BookingButtonsProps) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    description: '',
  });

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteLoading(true);

    try {
      const response = await fetch('/api/contractor/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId,
          ...quoteForm,
        }),
      });

      if (response.ok) {
        setQuoteModalOpen(false);
        setQuoteForm({ name: '', email: '', phone: '', serviceType: '', description: '' });
        // Show success message
        alert('Quote request sent successfully!');
      } else {
        alert('Failed to send quote request');
      }
    } catch (error) {
      console.error('Error requesting quote:', error);
      alert('Error sending quote request');
    } finally {
      setQuoteLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {instantBookingEnabled && (
          <Button
            onClick={() => setBookingModalOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Instant Book
          </Button>
        )}

        <Button
          onClick={() => setQuoteModalOpen(true)}
          variant="outline"
          className="w-full border-2"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Get a Quote
        </Button>
      </div>

      {/* Instant Booking Modal */}
      <InstantBookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        contractor={{
          id: contractorId,
          name: contractorName,
          businessName,
          depositRequired: depositRequired || false,
          depositAmount: depositAmount ? parseFloat(depositAmount.toString()) : undefined,
          cancellationPolicy,
          cancellationHours,
        }}
        serviceType={quoteForm.serviceType || 'General'}
      />

      {/* Quote Request Modal */}
      <Dialog open={quoteModalOpen} onOpenChange={setQuoteModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-sky-500 via-cyan-200 to-sky-500 border-0 shadow-2xl p-6 w-full">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-white text-2xl font-bold">Request a Quote</DialogTitle>
            <DialogDescription className="text-sky-50">
              Get a personalized quote from {displayName || businessName || contractorName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestQuote} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-white font-semibold text-sm">Full Name</Label>
              <input
                id="name"
                required
                value={quoteForm.name}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, name: e.target.value })
                }
                placeholder="Your name"
                className="w-full px-3 py-1.5 rounded-lg bg-white/90 border border-white/20 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white font-semibold text-sm">Email</Label>
              <input
                id="email"
                type="email"
                required
                value={quoteForm.email}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, email: e.target.value })
                }
                placeholder="your@email.com"
                className="w-full px-3 py-1.5 rounded-lg bg-white/90 border border-white/20 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-white font-semibold text-sm">Phone</Label>
              <input
                id="phone"
                type="tel"
                required
                value={quoteForm.phone}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
                className="w-full px-3 py-1.5 rounded-lg bg-white/90 border border-white/20 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="serviceType" className="text-white font-semibold text-sm">Service Type</Label>
              <input
                id="serviceType"
                required
                value={quoteForm.serviceType}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, serviceType: e.target.value })
                }
                placeholder="What service do you need?"
                className="w-full px-3 py-1.5 rounded-lg bg-white/90 border border-white/20 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-white font-semibold text-sm">Project Description</Label>
              <textarea
                id="description"
                required
                value={quoteForm.description}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, description: e.target.value })
                }
                placeholder="Tell us more about your project..."
                rows={3}
                className="w-full px-3 py-1.5 rounded-lg bg-white/90 border border-white/20 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white resize-none text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30 text-sm"
                onClick={() => setQuoteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={quoteLoading}
                className="flex-1 bg-white text-sky-600 hover:bg-sky-50 font-semibold text-sm"
              >
                {quoteLoading ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

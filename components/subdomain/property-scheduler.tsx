'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Calendar as CalendarIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { bookAppointment, getPropertySchedule, getPropertyAppointments } from '@/lib/actions/schedule.actions';
import { toast } from '@/hooks/use-toast';
import { format, addDays, addMinutes, parse } from 'date-fns';

interface PropertySchedulerProps {
  propertyId: string;
  propertyName: string;
}

export default function PropertyScheduler({ propertyId, propertyName }: PropertySchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    loadSchedule();
  }, [propertyId]);

  useEffect(() => {
    if (date && schedule) {
      loadAvailableSlots(date);
    }
  }, [date, schedule]);

  const loadSchedule = async () => {
    setIsLoading(true);
    try {
      const result = await getPropertySchedule(propertyId);
      if (result.success && result.schedule) {
        setSchedule(result.schedule);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async (selectedDate: Date) => {
    if (!schedule) return;

    const dayName = format(selectedDate, 'EEEE').toLowerCase();
    const daySchedule = schedule.schedule[dayName];

    if (!daySchedule || !daySchedule.enabled) {
      setAvailableSlots([]);
      return;
    }

    const appointmentsResult = await getPropertyAppointments(propertyId, selectedDate);
    const appointments =
      appointmentsResult.success && Array.isArray(appointmentsResult.appointments)
        ? appointmentsResult.appointments
        : [];
    const booked = appointments.map((apt: any) => apt.startTime);
    setBookedSlots(booked);

    const slots: { start: string; end: string }[] = [];
    daySchedule.slots.forEach((slot: { start: string; end: string }) => {
      const startTime = parse(slot.start, 'HH:mm', selectedDate);
      const endTime = parse(slot.end, 'HH:mm', selectedDate);
      const slotDuration = schedule.slotDuration || 30;

      let currentTime = startTime;
      while (currentTime < endTime) {
        const slotStart = format(currentTime, 'HH:mm');
        const nextTime = addMinutes(currentTime, slotDuration);
        const slotEnd = format(nextTime, 'HH:mm');
        
        if (!booked.includes(slotStart)) {
          slots.push({ start: slotStart, end: slotEnd });
        }
        
        currentTime = nextTime;
      }
    });

    setAvailableSlots(slots);
  };

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const result = await bookAppointment({
        propertyId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        notes: formData.notes,
      });

      if (result.success) {
        toast({
          title: 'Appointment Booked!',
          description: 'You will receive a confirmation email shortly.',
        });
        setShowForm(false);
        setSelectedSlot(null);
        setFormData({ name: '', email: '', phone: '', notes: '' });
        if (date) loadAvailableSlots(date);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to book appointment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200 bg-white/90 backdrop-blur-xl shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </CardContent>
      </Card>
    );
  }

  if (!schedule || !schedule.schedule) {
    return (
      <Card className="border-slate-200 bg-white/90 backdrop-blur-xl shadow-lg">
        <CardContent className="py-8 text-center">
          <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-700">Viewing schedule not yet available for this property.</p>
          <p className="text-sm text-slate-500 mt-2">Please contact us directly to schedule a viewing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white/90 backdrop-blur-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-violet-500" />
          Schedule a Viewing
        </CardTitle>
        <CardDescription className="text-slate-600">
          Book a time to tour {propertyName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showForm ? (
          <>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
                  className="rounded-lg border border-slate-200 bg-white"
                  classNames={{
                    caption_label: "text-sm font-medium text-slate-900",
                    head_cell: "text-slate-500 rounded-md w-9 font-normal text-[0.8rem]",
                    day: "h-9 w-9 p-0 font-normal text-slate-900 hover:bg-slate-100 rounded-md",
                    day_selected: "bg-violet-500 text-white hover:bg-violet-600 hover:text-white focus:bg-violet-500 focus:text-white",
                    day_today: "bg-slate-100 text-slate-900",
                    day_outside: "text-slate-400 opacity-50",
                    day_disabled: "text-slate-300 opacity-50",
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Available Times - {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
                </h3>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-slate-500">No available slots for this date.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="border-slate-300 hover:border-violet-400 hover:bg-violet-50 text-slate-700"
                        onClick={() => handleSlotSelect(slot)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {slot.start}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm text-violet-700">
                <strong>Selected Time:</strong> {date && format(date, 'MMMM d, yyyy')} at {selectedSlot?.start}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white border-slate-300 text-slate-900"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-white border-slate-300 text-slate-900"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-700">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white border-slate-300 text-slate-900"
                placeholder="Any special requests or questions..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setSelectedSlot(null);
                }}
                className="flex-1 text-slate-700 border-slate-300"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-violet-500 hover:bg-violet-600 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

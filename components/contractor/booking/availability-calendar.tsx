'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format, isSameDay, addDays } from 'date-fns';

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  serviceTypes?: string[];
}

interface AvailabilityCalendarProps {
  contractorId: string;
  serviceType: string;
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
  minDate?: Date;
  maxDate?: Date;
}

export default function AvailabilityCalendar({
  contractorId,
  serviceType,
  onSlotSelect,
  selectedSlot,
  minDate = new Date(),
  maxDate = addDays(new Date(), 60),
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(minDate);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, contractorId, serviceType]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/contractor/${contractorId}/availability?` +
          new URLSearchParams({
            date: date.toISOString(),
            serviceType,
          })
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      
      // Convert string dates back to Date objects
      const slots = data.slots.map((slot: any) => ({
        ...slot,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
      }));
      
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Unable to load availability. Please try again.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.isAvailable) {
      onSlotSelect(slot);
    }
  };

  const isSlotSelected = (slot: TimeSlot) => {
    return (
      selectedSlot &&
      isSameDay(slot.startTime, selectedSlot.startTime) &&
      slot.startTime.getTime() === selectedSlot.startTime.getTime()
    );
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    return `${format(slot.startTime, 'h:mm a')} - ${format(slot.endTime, 'h:mm a')}`;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Calendar Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select a Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) =>
              date < minDate || date > maxDate
            }
            className="rounded-md border border-slate-700"
          />
        </CardContent>
      </Card>

      {/* Time Slots Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Times
            {selectedDate && (
              <Badge variant="secondary" className="ml-auto">
                {format(selectedDate, 'MMM d, yyyy')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => selectedDate && fetchAvailableSlots(selectedDate)}
              >
                Try Again
              </Button>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">
                No available time slots for this date.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Try selecting a different date.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {availableSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={isSlotSelected(slot) ? 'default' : 'outline'}
                  className={`w-full justify-start ${
                    isSlotSelected(slot)
                      ? 'bg-violet-500 text-white hover:bg-violet-600'
                      : 'bg-slate-700 text-white hover:bg-slate-600 border-slate-600'
                  } ${
                    !slot.isAvailable
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.isAvailable}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {formatTimeSlot(slot)}
                  {isSlotSelected(slot) && (
                    <Badge className="ml-auto bg-white text-violet-600">
                      Selected
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

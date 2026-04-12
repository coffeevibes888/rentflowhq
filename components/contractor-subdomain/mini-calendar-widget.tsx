'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MiniCalendarWidgetProps {
  contractorId: string;
  subdomain: string;
}

export default function MiniCalendarWidget({ contractorId, subdomain }: MiniCalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [contractorId, currentMonth]);

  const fetchCalendarData = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const [appointmentsRes, availabilityRes] = await Promise.all([
        fetch(`/api/contractor/calendar/appointments?contractorId=${contractorId}&start=${start.toISOString()}&end=${end.toISOString()}`),
        fetch(`/api/contractor/calendar/availability?contractorId=${contractorId}`)
      ]);

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        const dates = data.appointments.map((apt: any) => new Date(apt.startTime));
        setBookedDates(dates);
      }

      if (availabilityRes.ok) {
        const data = await availabilityRes.json();
        if (data.availability) {
          setBlockedDates(data.availability.blockedDates.map((d: string) => new Date(d)));
        }
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayStatus = (day: Date) => {
    if (blockedDates.some(d => isSameDay(d, day))) return 'blocked';
    if (bookedDates.some(d => isSameDay(d, day))) return 'booked';
    return 'available';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5" />
            Availability
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, idx) => {
              const status = getDayStatus(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isPast = day < new Date() && !isToday;

              return (
                <div
                  key={idx}
                  className={cn(
                    'aspect-square flex items-center justify-center text-sm rounded-md',
                    !isCurrentMonth && 'text-muted-foreground opacity-40',
                    isCurrentMonth && !isPast && status === 'available' && 'bg-green-50 text-green-900 hover:bg-green-100',
                    isCurrentMonth && status === 'booked' && 'bg-blue-50 text-blue-900',
                    isCurrentMonth && status === 'blocked' && 'bg-red-50 text-red-900 line-through',
                    isPast && 'opacity-30',
                    isToday && 'ring-2 ring-primary font-bold'
                  )}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs pt-2 border-t">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
              <span>Blocked</span>
            </div>
          </div>

          {/* Book Now Button */}
          <Link href={`/c/${subdomain}/book`}>
            <Button className="w-full" size="lg">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

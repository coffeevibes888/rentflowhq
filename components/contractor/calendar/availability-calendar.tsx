'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, startOfDay, addDays, isSameMonth, isToday, getDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Clock, Calendar as CalendarIcon, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import BlockDateModal from './block-date-modal';

interface Appointment {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  status: string;
  serviceType: string;
}

interface AvailabilityCalendarProps {
  contractorId: string;
  mode?: 'view' | 'manage';
  onDateSelect?: (date: Date) => void;
  onSlotSelect?: (slot: { startTime: Date; endTime: Date }) => void;
}

export default function AvailabilityCalendar({
  contractorId,
  mode = 'view',
  onDateSelect,
  onSlotSelect,
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  // Calculate calendar days for month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    fetchCalendarData();
  }, [contractorId]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments for the month
      const startDate = startOfDay(new Date());
      const endDate = addDays(startDate, 60);
      
      const [appointmentsRes, availabilityRes] = await Promise.all([
        fetch(`/api/contractor/calendar/appointments?contractorId=${contractorId}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
        fetch(`/api/contractor/calendar/availability?contractorId=${contractorId}`)
      ]);

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        setAppointments(data.appointments.map((apt: any) => ({
          ...apt,
          startTime: new Date(apt.startTime),
          endTime: new Date(apt.endTime),
        })));
      }

      if (availabilityRes.ok) {
        const data = await availabilityRes.json();
        if (data.availability) {
          setAvailability(data.availability);
          setBlockedDates(data.availability.blockedDates?.map((d: string) => new Date(d)) || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const getDateStatus = (date: Date) => {
    const isBlocked = blockedDates.some(blocked => isSameDay(blocked, date));
    if (isBlocked) return 'blocked';

    const dayAppointments = appointments.filter(apt => 
      isSameDay(new Date(apt.startTime), date) && apt.status !== 'cancelled'
    );

    if (dayAppointments.length === 0) return 'available';
    
    // Check if fully booked (simplified - you'd check against actual schedule)
    if (dayAppointments.length >= 6) return 'booked';
    
    return 'partial';
  };

  const getDayAppointments = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.startTime), date) && apt.status !== 'cancelled'
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading calendar...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modifiers = {
    blocked: blockedDates,
    booked: appointments
      .filter(apt => apt.status !== 'cancelled')
      .map(apt => new Date(apt.startTime)),
  };

  const modifiersClassNames = {
    blocked: 'bg-red-100 text-red-900 line-through',
    booked: 'bg-blue-100 text-blue-900',
  };

  const selectedDayAppointments = getDayAppointments(selectedDate);
  const dateStatus = getDateStatus(selectedDate);

  return (
    <>
      <BlockDateModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        contractorId={contractorId}
        onSuccess={fetchCalendarData}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View */}
      <Card className="lg:col-span-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 shadow-2xl border border-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <CalendarIcon className="h-5 w-5 text-black" />
            {mode === 'manage' ? 'Manage Availability' : 'Booking Calendar'}
          </CardTitle>
          <CardDescription className="text-black/80">
            {mode === 'manage' 
              ? 'View and manage your availability and bookings'
              : 'Select a date to view available time slots'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm text-black">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                <span className="font-medium">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
                <span className="font-medium">Partially Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200 border border-gray-400" />
                <span className="font-medium">Fully Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-300 line-through" />
                <span className="font-medium">Blocked</span>
              </div>
            </div>

            {/* Calendar */}
            <div className="rounded-xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-xl">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-slate-800/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div
                    key={day}
                    className={`py-3 text-center text-sm font-medium border-r border-white/5 last:border-r-0 ${
                      i === 0 || i === 6 ? 'text-slate-500' : 'text-slate-300'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayAppointments = getDayAppointments(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isDayToday = isToday(day);
                  const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                  const dateStatus = getDateStatus(day);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        relative border-r border-b border-white/5 last:border-r-0 
                        min-h-[100px] transition-colors cursor-pointer group
                        ${!isCurrentMonth ? 'bg-slate-900/40' : ''}
                        ${isDayToday ? 'bg-violet-600/10' : ''}
                        ${isWeekend && !isDayToday ? 'bg-slate-800/20' : ''}
                        ${dateStatus === 'blocked' ? 'bg-red-900/20' : ''}
                        hover:bg-white/5
                      `}
                      onClick={() => handleDateSelect(day)}
                    >
                      {/* Day Number */}
                      <div className="p-2 flex items-start justify-between">
                        <span
                          className={`
                            inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                            ${isDayToday 
                              ? 'bg-violet-600 text-white' 
                              : isCurrentMonth 
                                ? 'text-white' 
                                : 'text-slate-600'
                            }
                            ${dateStatus === 'blocked' ? 'line-through text-red-400' : ''}
                          `}
                        >
                          {format(day, 'd')}
                        </span>
                        
                        {/* Status indicator */}
                        {dateStatus !== 'available' && isCurrentMonth && (
                          <div className={`w-2 h-2 rounded-full ${
                            dateStatus === 'blocked' ? 'bg-red-500' :
                            dateStatus === 'booked' ? 'bg-gray-500' :
                            'bg-blue-500'
                          }`} />
                        )}
                      </div>

                      {/* Appointments */}
                      <div className="px-1 pb-1 space-y-1 max-h-[60px] overflow-hidden">
                        {dayAppointments.slice(0, 2).map(apt => (
                          <div
                            key={apt.id}
                            className="bg-blue-500/20 border border-blue-500/30 rounded px-2 py-1 text-xs cursor-pointer hover:scale-[1.02] transition-transform"
                          >
                            <div className="font-medium text-blue-400 truncate">
                              {apt.title}
                            </div>
                            <div className="text-slate-400 text-[10px]">
                              {format(apt.startTime, 'h:mm a')}
                            </div>
                          </div>
                        ))}
                        
                        {dayAppointments.length > 2 && (
                          <div className="text-[10px] text-slate-500 px-2">
                            +{dayAppointments.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      <Card className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 shadow-2xl border border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg text-black">
            {format(selectedDate, 'EEEE, MMMM d')}
          </CardTitle>
          <CardDescription>
            <Badge 
              variant={
                dateStatus === 'available' ? 'default' :
                dateStatus === 'partial' ? 'secondary' :
                dateStatus === 'booked' ? 'outline' :
                'destructive'
              }
              className={cn(
                "text-black font-medium",
                dateStatus === 'available' && 'bg-green-100 text-green-800 hover:bg-green-200',
                dateStatus === 'partial' && 'bg-blue-100 text-blue-800 hover:bg-blue-200',
              )}
            >
              {dateStatus === 'available' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {dateStatus === 'blocked' && <XCircle className="h-3 w-3 mr-1" />}
              {dateStatus === 'available' ? 'Available' :
               dateStatus === 'partial' ? 'Partially Booked' :
               dateStatus === 'booked' ? 'Fully Booked' :
               'Blocked'}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedDayAppointments.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2 text-black">
                  <Clock className="h-4 w-4" />
                  Scheduled Appointments
                </h4>
                <div className="space-y-2">
                  {selectedDayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 rounded-lg border bg-white text-black border-black"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{apt.title}</p>
                          <p className="text-xs text-gray-600">
                            {format(apt.startTime, 'h:mm a')} - {format(apt.endTime, 'h:mm a')}
                          </p>
                          <Badge variant="outline" className="text-xs border-black text-black">
                            {apt.serviceType}
                          </Badge>
                        </div>
                        <Badge
                          variant={apt.status === 'confirmed' ? 'default' : 'secondary'}
                          className="text-xs bg-blue-100 text-blue-800"
                        >
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : dateStatus === 'blocked' ? (
              <div className="text-center py-8 text-black">
                <XCircle className="h-12 w-12 mx-auto mb-2 text-red-600" />
                <p className="text-sm font-medium">This date is blocked</p>
              </div>
            ) : (
              <div className="text-center py-8 text-black">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">No appointments scheduled</p>
                <p className="text-xs mt-1">Available for booking</p>
              </div>
            )}

            {mode === 'manage' && (
              <div className="pt-4 border-t border-black/20 space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black/10"
                  onClick={() => setBlockModalOpen(true)}
                >
                  Block Dates
                </Button>
                {dateStatus === 'blocked' && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={async () => {
                      try {
                        await fetch(`/api/contractor/calendar/block-date?contractorId=${contractorId}&date=${selectedDate.toISOString()}`, {
                          method: 'DELETE',
                        });
                        fetchCalendarData();
                      } catch (error) {
                        console.error('Failed to unblock date:', error);
                      }
                    }}
                  >
                    Unblock This Date
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

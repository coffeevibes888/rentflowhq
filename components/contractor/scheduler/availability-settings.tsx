'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Clock, Calendar as CalendarIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WeeklySchedule {
  [day: string]: { start: string; end: string; enabled: boolean };
}

interface AvailabilitySettings {
  weeklySchedule: WeeklySchedule;
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  blockedDates: Date[];
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function AvailabilitySettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySettings>({
    weeklySchedule: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: false },
      sunday: { start: '09:00', end: '17:00', enabled: false },
    },
    bufferMinutes: 30,
    minNoticeHours: 24,
    maxAdvanceDays: 60,
    blockedDates: [],
  });

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/contractor/scheduler/availability');

      if (response.ok) {
        const data = await response.json();
        if (data.availability) {
          // Convert blocked dates from strings to Date objects
          const blockedDates = data.availability.blockedDates.map(
            (date: string) => new Date(date)
          );
          setAvailability({
            ...data.availability,
            blockedDates,
          });
        }
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to load availability settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/contractor/scheduler/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      });

      if (!response.ok) {
        throw new Error('Failed to save availability');
      }

      toast({
        title: 'Success',
        description: 'Availability settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to save availability settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateDaySchedule = (
    day: string,
    field: 'start' | 'end' | 'enabled',
    value: string | boolean
  ) => {
    setAvailability((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          [field]: value,
        },
      },
    }));
  };

  const toggleBlockedDate = (date: Date) => {
    setAvailability((prev) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isBlocked = prev.blockedDates.some(
        (d) => format(d, 'yyyy-MM-dd') === dateStr
      );

      if (isBlocked) {
        return {
          ...prev,
          blockedDates: prev.blockedDates.filter(
            (d) => format(d, 'yyyy-MM-dd') !== dateStr
          ),
        };
      } else {
        return {
          ...prev,
          blockedDates: [...prev.blockedDates, date],
        };
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            Set your regular working hours for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => (
            <div
              key={day.key}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <div className="flex items-center gap-2 w-32">
                <Switch
                  checked={availability.weeklySchedule[day.key]?.enabled}
                  onCheckedChange={(checked) =>
                    updateDaySchedule(day.key, 'enabled', checked)
                  }
                />
                <Label className="font-medium">{day.label}</Label>
              </div>

              {availability.weeklySchedule[day.key]?.enabled && (
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">
                      From
                    </Label>
                    <Input
                      type="time"
                      value={availability.weeklySchedule[day.key]?.start}
                      onChange={(e) =>
                        updateDaySchedule(day.key, 'start', e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">To</Label>
                    <Input
                      type="time"
                      value={availability.weeklySchedule[day.key]?.end}
                      onChange={(e) =>
                        updateDaySchedule(day.key, 'end', e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Settings</CardTitle>
          <CardDescription>
            Configure buffer time and booking windows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bufferMinutes">Buffer Time (minutes)</Label>
              <Input
                id="bufferMinutes"
                type="number"
                min="0"
                max="120"
                value={availability.bufferMinutes}
                onChange={(e) =>
                  setAvailability((prev) => ({
                    ...prev,
                    bufferMinutes: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Time between appointments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minNoticeHours">
                Minimum Notice (hours)
              </Label>
              <Input
                id="minNoticeHours"
                type="number"
                min="0"
                max="168"
                value={availability.minNoticeHours}
                onChange={(e) =>
                  setAvailability((prev) => ({
                    ...prev,
                    minNoticeHours: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                How far in advance bookings required
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAdvanceDays">
                Maximum Advance (days)
              </Label>
              <Input
                id="maxAdvanceDays"
                type="number"
                min="1"
                max="365"
                value={availability.maxAdvanceDays}
                onChange={(e) =>
                  setAvailability((prev) => ({
                    ...prev,
                    maxAdvanceDays: parseInt(e.target.value) || 1,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                How far ahead customers can book
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Blocked Dates
          </CardTitle>
          <CardDescription>
            Select dates when you are unavailable (vacation, holidays, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="multiple"
            selected={availability.blockedDates}
            onSelect={(dates) =>
              setAvailability((prev) => ({
                ...prev,
                blockedDates: dates || [],
              }))
            }
            className="rounded-md border"
          />
          {availability.blockedDates.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">
                Blocked Dates ({availability.blockedDates.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {availability.blockedDates.map((date, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {format(date, 'MMM d, yyyy')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

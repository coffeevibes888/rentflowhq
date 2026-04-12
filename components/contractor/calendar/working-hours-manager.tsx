'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
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

export default function WorkingHoursManager({ contractorId }: { contractorId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<WorkingHours>({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
    bufferMinutes: 30,
    minNoticeHours: 24,
    maxAdvanceDays: 60,
  });

  useEffect(() => {
    fetchWorkingHours();
  }, [contractorId]);

  const fetchWorkingHours = async () => {
    try {
      const res = await fetch(`/api/contractor/calendar/availability?contractorId=${contractorId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.availability) {
          setHours({
            monday: data.availability.weeklySchedule.monday,
            tuesday: data.availability.weeklySchedule.tuesday,
            wednesday: data.availability.weeklySchedule.wednesday,
            thursday: data.availability.weeklySchedule.thursday,
            friday: data.availability.weeklySchedule.friday,
            saturday: data.availability.weeklySchedule.saturday,
            sunday: data.availability.weeklySchedule.sunday,
            bufferMinutes: data.availability.bufferMinutes,
            minNoticeHours: data.availability.minNoticeHours,
            maxAdvanceDays: data.availability.maxAdvanceDays,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch working hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/contractor/calendar/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId, availability: hours }),
      });

      if (res.ok) {
        toast({ title: 'Working hours updated successfully' });
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({ title: 'Failed to update working hours', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (day: string, field: keyof DaySchedule, value: any) => {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof WorkingHours] as DaySchedule, [field]: value }
    }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 shadow-2xl border border-slate-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black">
          <Clock className="h-5 w-5" />
          Working Hours
        </CardTitle>
        <CardDescription className="text-black/80">
          Set your availability schedule for customer bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Schedule */}
        <div className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const day = hours[key as keyof WorkingHours] as DaySchedule;
            return (
              <div key={key} className="flex items-center gap-4 p-4 rounded-lg border border-black bg-white shadow-sm">
                <div className="w-32">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={day.enabled}
                      onCheckedChange={(checked) => updateDay(key, 'enabled', checked)}
                      className="data-[state=checked]:bg-violet-600"
                    />
                    <Label className="font-medium text-black">{label}</Label>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={day.start}
                      onChange={(e) => updateDay(key, 'start', e.target.value)}
                      disabled={!day.enabled}
                      className="w-32 border-black text-black bg-white disabled:opacity-50"
                    />
                    <span className="text-black font-medium">to</span>
                    <Input
                      type="time"
                      value={day.end}
                      onChange={(e) => updateDay(key, 'end', e.target.value)}
                      disabled={!day.enabled}
                      className="w-32 border-black text-black bg-white disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Booking Settings */}
        <div className="space-y-4 pt-4 border-t border-black/20">
          <h4 className="font-medium text-black">Booking Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-black font-medium">Buffer Time (minutes)</Label>
              <Input
                type="number"
                value={hours.bufferMinutes}
                onChange={(e) => setHours(prev => ({ ...prev, bufferMinutes: parseInt(e.target.value) }))}
                min="0"
                max="120"
                className="border-black text-black bg-white"
              />
              <p className="text-xs text-black/70">Time between appointments</p>
            </div>
            <div className="space-y-2">
              <Label className="text-black font-medium">Minimum Notice (hours)</Label>
              <Input
                type="number"
                value={hours.minNoticeHours}
                onChange={(e) => setHours(prev => ({ ...prev, minNoticeHours: parseInt(e.target.value) }))}
                min="1"
                max="168"
                className="border-black text-black bg-white"
              />
              <p className="text-xs text-black/70">Advance booking required</p>
            </div>
            <div className="space-y-2">
              <Label className="text-black font-medium">Max Advance (days)</Label>
              <Input
                type="number"
                value={hours.maxAdvanceDays}
                onChange={(e) => setHours(prev => ({ ...prev, maxAdvanceDays: parseInt(e.target.value) }))}
                min="1"
                max="365"
                className="border-black text-black bg-white"
              />
              <p className="text-xs text-black/70">How far ahead to book</p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-black text-white hover:bg-black/90">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Working Hours'}
        </Button>
      </CardContent>
    </Card>
  );
}

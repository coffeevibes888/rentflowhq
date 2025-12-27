'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, ChevronLeft, ChevronRight, User, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { createShift, getShifts, deleteShift } from '@/lib/actions/team-operations.actions';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';

interface TeamMember {
  id: string;
  name: string;
  image: string | null;
}

interface Property {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  teamMember: { id: string; name: string; image: string | null };
  property: { id: string; name: string } | null;
}

export default function ScheduleTab() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [shiftsResult, membersRes, propsRes] = await Promise.all([
        getShifts({ startDate: weekStart, endDate: weekEnd }),
        fetch('/api/landlord/team/members').then(r => r.json()),
        fetch('/api/admin/properties').then(r => r.json()),
      ]);

      if (shiftsResult.success) {
        setShifts(shiftsResult.shifts.map(s => ({ ...s, date: new Date(s.date) })));
      }
      if (membersRes.members) {
        setTeamMembers(membersRes.members.map((m: { id: string; user: { name: string; image: string | null } }) => ({
          id: m.id,
          name: m.user.name,
          image: m.user.image,
        })));
      }
      if (propsRes.properties) {
        setProperties(propsRes.properties);
      }
    } catch (error) {
      console.error('Failed to load schedule data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateShift(formData: FormData) {
    const teamMemberId = formData.get('teamMemberId') as string;
    const propertyId = formData.get('propertyId') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const notes = formData.get('notes') as string;

    startTransition(async () => {
      const result = await createShift({
        teamMemberId,
        propertyId: propertyId || undefined,
        date: new Date(date).toISOString(),
        startTime,
        endTime,
        notes: notes || undefined,
      });

      if (result.success) {
        toast.success(result.message);
        setIsCreateOpen(false);
        loadData();
      } else {
        toast.error(result.message);
      }
    });
  }

  async function handleDeleteShift(shiftId: string) {
    if (!confirm('Delete this shift?')) return;

    startTransition(async () => {
      const result = await deleteShift(shiftId);
      if (result.success) {
        toast.success(result.message);
        loadData();
      } else {
        toast.error(result.message);
      }
    });
  }

  function getShiftsForDay(day: Date) {
    return shifts.filter(s => isSameDay(new Date(s.date), day));
  }

  const colorClasses = [
    'bg-blue-500/80',
    'bg-emerald-500/80',
    'bg-violet-500/80',
    'bg-amber-500/80',
    'bg-rose-500/80',
    'bg-cyan-500/80',
  ];

  function getMemberColor(memberId: string) {
    const index = teamMembers.findIndex(m => m.id === memberId);
    return colorClasses[index % colorClasses.length];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="bg-white/5 border-white/10 hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-white">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h3>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="bg-white/5 border-white/10 hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
            className="bg-white/5 border-white/10 hover:bg-white/10"
          >
            Today
          </Button>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Create Shift</DialogTitle>
            </DialogHeader>
            <form action={handleCreateShift} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Team Member</Label>
                <Select name="teamMemberId" required>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Property (optional)</Label>
                <Select name="propertyId">
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="All properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All properties</SelectItem>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Date</Label>
                <Input type="date" name="date" required className="bg-white/5 border-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Start Time</Label>
                  <Input type="time" name="startTime" required className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">End Time</Label>
                  <Input type="time" name="endTime" required className="bg-white/5 border-white/10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Notes</Label>
                <Input name="notes" placeholder="Optional notes" className="bg-white/5 border-white/10" />
              </div>

              <Button type="submit" disabled={isPending} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500">
                {isPending ? 'Creating...' : 'Create Shift'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl bg-slate-900/60 border border-white/10 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {weekDays.map(day => (
            <div
              key={day.toISOString()}
              className={`p-3 text-center border-r border-white/10 last:border-r-0 ${
                isSameDay(day, new Date()) ? 'bg-blue-600/20' : ''
              }`}
            >
              <div className="text-xs text-slate-400 uppercase">{format(day, 'EEE')}</div>
              <div className={`text-lg font-semibold ${isSameDay(day, new Date()) ? 'text-blue-400' : 'text-white'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Shift Grid */}
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map(day => {
            const dayShifts = getShiftsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`p-2 border-r border-white/10 last:border-r-0 ${
                  isSameDay(day, new Date()) ? 'bg-blue-600/10' : ''
                }`}
              >
                {isLoading ? (
                  <div className="animate-pulse bg-white/5 rounded h-16" />
                ) : dayShifts.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-4">No shifts</div>
                ) : (
                  <div className="space-y-2">
                    {dayShifts.map(shift => (
                      <div
                        key={shift.id}
                        className={`${getMemberColor(shift.teamMember.id)} rounded-lg p-2 text-xs cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => handleDeleteShift(shift.id)}
                        title="Click to delete"
                      >
                        <div className="flex items-center gap-1 font-medium text-white">
                          <User className="h-3 w-3" />
                          {shift.teamMember.name}
                        </div>
                        <div className="text-white/80">
                          {shift.startTime} - {shift.endTime}
                        </div>
                        {shift.property && (
                          <div className="flex items-center gap-1 text-white/70 mt-1">
                            <MapPin className="h-3 w-3" />
                            {shift.property.name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {teamMembers.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {teamMembers.map((member, index) => (
            <div key={member.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${colorClasses[index % colorClasses.length]}`} />
              <span className="text-sm text-slate-300">{member.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

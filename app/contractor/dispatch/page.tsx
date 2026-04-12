'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Truck, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  customerName: string;
  address: string;
  status: string;
  assignedEmployees: string[];
  startDate: string;
  estimatedHours: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DispatchBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');

  useEffect(() => {
    fetchDispatchData();
  }, [currentDate]);

  const fetchDispatchData = async () => {
    try {
      // Fetch jobs scheduled for this week
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const [jobsRes, employeesRes] = await Promise.all([
        fetch('/api/contractor/jobs/scheduled?' + new URLSearchParams({
          start: startOfWeek.toISOString(),
          end: endOfWeek.toISOString(),
        })),
        fetch('/api/contractor/team'),
      ]);

      if (jobsRes.ok && employeesRes.ok) {
        const jobsData = await jobsRes.json();
        const employeesData = await employeesRes.json();
        setJobs(jobsData.jobs || []);
        setEmployees(employeesData.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch dispatch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());

  const getJobsForDay = (dayOffset: number) => {
    const day = new Date(currentWeekStart);
    day.setDate(currentWeekStart.getDate() + dayOffset);
    return jobs.filter(job => {
      const jobDate = new Date(job.startDate);
      return jobDate.toDateString() === day.toDateString();
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-rose-200 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-rose-100 via-orange-50 to-rose-100" />
      <div className="relative p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dispatch Board</h1>
          <p className="text-slate-600">Schedule and dispatch your crew</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2">
            Week of {currentWeekStart.toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week View */}
      <Card className="border-rose-100 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900">Weekly Schedule</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {employees.length} Staff
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Truck className="h-3 w-3" />
                {jobs.length} Jobs
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const dayJobs = getJobsForDay(index);
              const isToday = new Date().toDateString() === 
                new Date(currentWeekStart.getTime() + index * 24 * 60 * 60 * 1000).toDateString();

              return (
                <div key={day} className={`border rounded-lg p-2 min-h-[200px] ${isToday ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}>
                  <div className="text-center mb-2">
                    <div className="font-semibold text-sm">{day}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(currentWeekStart.getTime() + index * 24 * 60 * 60 * 1000).getDate()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {dayJobs.map(job => (
                      <Link key={job.id} href={`/contractor/jobs/${job.id}`}>
                        <div className="p-2 bg-rose-50 rounded text-xs hover:bg-rose-100 transition-colors cursor-pointer">
                          <div className="font-medium truncate">{job.title}</div>
                          <div className="text-muted-foreground truncate">{job.customerName}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {job.estimatedHours}h
                          </div>
                        </div>
                      </Link>
                    ))}
                    {dayJobs.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-4">
                        No jobs
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Jobs */}
      <Card className="border-rose-100 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-900">Unassigned Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.filter(j => j.assignedEmployees.length === 0).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">All jobs are assigned!</p>
          ) : (
            <div className="divide-y">
              {jobs
                .filter(j => j.assignedEmployees.length === 0)
                .map(job => (
                  <div key={job.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-muted-foreground">{job.customerName}</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4" />
                        {job.address}
                      </div>
                    </div>
                    <Link href={`/contractor/jobs/${job.id}/assign`}>
                      <Button size="sm" className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 shadow-md">
                        Assign Crew
                      </Button>
                    </Link>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<any[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');

  useEffect(() => {
    loadJobs();
  }, [currentDate]);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/contractor/jobs?status=scheduled,in_progress');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getJobsForDate = (date: Date) => {
    return jobs.filter(job => {
      if (!job.estimatedStartDate) return false;
      const jobDate = new Date(job.estimatedStartDate);
      return jobDate.toDateString() === date.toDateString();
    });
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
          <p className="text-white/70 mt-1">Schedule and manage your jobs</p>
        </div>
        <Link href="/contractor/jobs/new">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Job
          </Button>
        </Link>
      </div>

      {/* Calendar Controls */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('prev')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-white" />
                <h2 className="text-xl font-semibold text-white">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('next')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
                className={view === 'day' ? 'bg-violet-600' : 'border-white/20 text-white hover:bg-white/10'}
              >
                Day
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
                className={view === 'week' ? 'bg-violet-600' : 'border-white/20 text-white hover:bg-white/10'}
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
                className={view === 'month' ? 'bg-violet-600' : 'border-white/20 text-white hover:bg-white/10'}
              >
                Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week View Calendar */}
      {view === 'week' && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b border-white/10">
                  <div className="p-4 border-r border-white/10">
                    <span className="text-sm text-white/70">Time</span>
                  </div>
                  {weekDays.map((day, index) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={index}
                        className={`p-4 text-center border-r border-white/10 ${
                          isToday ? 'bg-violet-500/20' : ''
                        }`}
                      >
                        <div className="text-sm text-white/70">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-semibold ${
                          isToday ? 'text-violet-300' : 'text-white'
                        }`}>
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <div className="max-h-[600px] overflow-y-auto">
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b border-white/10">
                      <div className="p-4 border-r border-white/10 text-sm text-white/70">
                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                      {weekDays.map((day, dayIndex) => {
                        const dayJobs = getJobsForDate(day);
                        return (
                          <div
                            key={dayIndex}
                            className="p-2 border-r border-white/10 min-h-[80px] relative"
                          >
                            {dayJobs.map((job) => (
                              <Link
                                key={job.id}
                                href={`/contractor/jobs/${job.id}`}
                                className="block mb-2"
                              >
                                <div className="p-2 rounded bg-violet-500/30 border border-violet-400/30 hover:bg-violet-500/40 transition-colors">
                                  <p className="text-xs font-semibold text-white truncate">
                                    {job.title}
                                  </p>
                                  <p className="text-xs text-white/70 truncate">
                                    {job.customer?.name}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Jobs List */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-white/70 text-center py-8">No scheduled jobs</p>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/contractor/jobs/${job.id}`}
                  className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{job.title}</h4>
                      <p className="text-sm text-white/60">{job.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      {job.estimatedStartDate && (
                        <p className="text-sm text-white">
                          {new Date(job.estimatedStartDate).toLocaleDateString()}
                        </p>
                      )}
                      <Badge className="bg-violet-500/30 text-violet-200 mt-1">
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

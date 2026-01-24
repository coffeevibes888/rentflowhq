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
          <h1 className="text-2xl font-bold text-blue-600">Calendar</h1>
          <p className="text-sm text-gray-600 mt-1">Schedule and manage your jobs</p>
        </div>
        <Link href="/contractor/jobs/new">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-gray-900 border-2 border-black shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Job
          </Button>
        </Link>
      </div>

      {/* Calendar Controls */}
      <div className="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek('prev')}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek('next')}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
              className={view === 'day' ? 'bg-blue-600 hover:bg-blue-700 text-gray-900' : 'border-2 border-gray-300 hover:bg-gray-50'}
            >
              Day
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-blue-600 hover:bg-blue-700 text-gray-900' : 'border-2 border-gray-300 hover:bg-gray-50'}
            >
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-blue-600 hover:bg-blue-700 text-gray-900' : 'border-2 border-gray-300 hover:bg-gray-50'}
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Week View Calendar */}
      {view === 'week' && (
        <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b-2 border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                <div className="p-4 border-r border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Time</span>
                </div>
                {weekDays.map((day, index) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={index}
                      className={`p-4 text-center border-r border-gray-200 ${
                        isToday ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-600">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
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
                  <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
                    <div className="p-4 border-r border-gray-200 text-sm font-medium text-gray-600 bg-gray-50">
                      {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </div>
                    {weekDays.map((day, dayIndex) => {
                      const dayJobs = getJobsForDate(day);
                      return (
                        <div
                          key={dayIndex}
                          className="p-2 border-r border-gray-200 min-h-[80px] relative hover:bg-gray-50"
                        >
                          {dayJobs.map((job) => (
                            <Link
                              key={job.id}
                              href={`/contractor/jobs/${job.id}`}
                              className="block mb-2"
                            >
                              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-100 to-blue-100 border-2 border-blue-300 hover:from-cyan-200 hover:to-blue-200 transition-colors">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {job.title}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
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
        </div>
      )}

      {/* Upcoming Jobs List */}
      <div className="rounded-xl border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Jobs</h3>
        </div>
        <div className="p-5">
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No scheduled jobs</p>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/contractor/jobs/${job.id}`}
                  className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                      <p className="text-sm text-gray-600">{job.customer?.name}</p>
                    </div>
                    <div className="text-right">
                      {job.estimatedStartDate && (
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(job.estimatedStartDate).toLocaleDateString()}
                        </p>
                      )}
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300 mt-1">
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

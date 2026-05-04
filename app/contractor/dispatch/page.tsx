'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Truck, Users, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
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

  useEffect(() => {
    fetchDispatchData();
  }, [currentDate]);

  const fetchDispatchData = async () => {
    try {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const [jobsRes, employeesRes] = await Promise.all([
        fetch('/api/contractor/jobs/scheduled?' + new URLSearchParams({ start: startOfWeek.toISOString(), end: endOfWeek.toISOString() })),
        fetch('/api/contractor/team'),
      ]);

      if (jobsRes.ok && employeesRes.ok) {
        setJobs((await jobsRes.json()).jobs || []);
        setEmployees((await employeesRes.json()).employees || []);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());

  const getJobsForDay = (dayOffset: number) => {
    const day = new Date(currentWeekStart);
    day.setDate(currentWeekStart.getDate() + dayOffset);
    return jobs.filter((job) => new Date(job.startDate).toDateString() === day.toDateString());
  };

  const statusConfig: Record<string, { bg: string; text: string }> = {
    scheduled: { bg: 'bg-blue-50', text: 'text-blue-600' },
    in_progress: { bg: 'bg-amber-50', text: 'text-amber-600' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    on_hold: { bg: 'bg-red-50', text: 'text-red-600' },
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500' />
      </div>
    );
  }

  return (
    <div className='w-full space-y-5'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-black'>Dispatch Board</h1>
          <p className='text-xs sm:text-sm text-gray-500 mt-0.5'>Schedule and dispatch your crew</p>
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={() => navigateWeek(-1)} className='p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors'>
            <ChevronLeft className='h-4 w-4 text-gray-600' />
          </button>
          <span className='text-sm font-medium text-gray-700 px-2'>
            Week of {currentWeekStart.toLocaleDateString()}
          </span>
          <button onClick={() => navigateWeek(1)} className='p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors'>
            <ChevronRight className='h-4 w-4 text-gray-600' />
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className='relative rounded-xl border border-gray-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 overflow-hidden'>
        <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-bl-full' />
        <div className='relative p-4'>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <div className='space-y-0.5'>
              <div className='text-[10px] text-gray-500 font-semibold uppercase tracking-wide'>Staff</div>
              <div className='text-base font-bold text-gray-800 flex items-center gap-1'><Users className='h-3.5 w-3.5 text-amber-500' />{employees.length}</div>
            </div>
            <div className='space-y-0.5'>
              <div className='text-[10px] text-gray-500 font-semibold uppercase tracking-wide'>Jobs This Week</div>
              <div className='text-base font-bold text-gray-800 flex items-center gap-1'><Truck className='h-3.5 w-3.5 text-amber-500' />{jobs.length}</div>
            </div>
            <div className='space-y-0.5'>
              <div className='text-[10px] text-gray-500 font-semibold uppercase tracking-wide'>Unassigned</div>
              <div className='text-base font-bold text-gray-800'>{jobs.filter((j) => j.assignedEmployees.length === 0).length}</div>
            </div>
            <div className='space-y-0.5'>
              <div className='text-[10px] text-gray-500 font-semibold uppercase tracking-wide'>In Progress</div>
              <div className='text-base font-bold text-gray-800'>{jobs.filter((j) => j.status === 'in_progress').length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
        <div className='flex items-center justify-between p-4 border-b border-gray-100'>
          <h3 className='text-sm font-bold text-gray-800'>Weekly Schedule</h3>
        </div>
        <div className='p-4 overflow-x-auto'>
          <div className='grid grid-cols-7 gap-2 min-w-[700px]'>
            {weekDays.map((day, index) => {
              const dayJobs = getJobsForDay(index);
              const dayDate = new Date(currentWeekStart.getTime() + index * 24 * 60 * 60 * 1000);
              const isToday = new Date().toDateString() === dayDate.toDateString();
              return (
                <div key={day} className={`rounded-lg border p-2 min-h-[180px] ${isToday ? 'border-amber-400 bg-amber-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                  <div className='text-center mb-2'>
                    <div className={`text-xs font-bold ${isToday ? 'text-amber-600' : 'text-gray-600'}`}>{day}</div>
                    <div className={`text-xs ${isToday ? 'text-amber-500 font-bold' : 'text-gray-400'}`}>{dayDate.getDate()}</div>
                  </div>
                  <div className='space-y-1.5'>
                    {dayJobs.map((job) => (
                      <Link key={job.id} href={`/contractor/jobs/${job.id}`}>
                        <div className='p-1.5 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer shadow-sm'>
                          <p className='text-[10px] font-semibold text-gray-800 truncate'>{job.title}</p>
                          <p className='text-[9px] text-gray-500 truncate'>{job.customerName}</p>
                          <div className='flex items-center gap-1 mt-0.5'>
                            <Clock className='h-2.5 w-2.5 text-gray-400' />
                            <span className='text-[9px] text-gray-400'>{job.estimatedHours}h</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {dayJobs.length === 0 && (
                      <p className='text-center text-[10px] text-gray-300 py-4'>No jobs</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unassigned Jobs */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden'>
        <div className='flex items-center justify-between p-4 border-b border-gray-100'>
          <h3 className='text-sm font-bold text-gray-800'>Unassigned Jobs</h3>
          <span className='text-xs text-gray-400'>{jobs.filter((j) => j.assignedEmployees.length === 0).length} jobs</span>
        </div>
        {jobs.filter((j) => j.assignedEmployees.length === 0).length === 0 ? (
          <div className='p-8 text-center'>
            <div className='w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center'>
              <Briefcase className='h-6 w-6 text-emerald-400' />
            </div>
            <p className='text-sm text-gray-500'>All jobs are assigned!</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-50'>
            {jobs.filter((j) => j.assignedEmployees.length === 0).map((job) => (
              <div key={job.id} className='flex items-center gap-3 px-4 py-3'>
                <div className='h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0'>
                  <Briefcase className='h-4 w-4 text-amber-500' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs font-semibold text-gray-800 truncate'>{job.title}</p>
                  <p className='text-[10px] text-gray-500'>{job.customerName}</p>
                  <div className='flex items-center gap-1 mt-0.5'>
                    <MapPin className='h-3 w-3 text-gray-400' />
                    <span className='text-[10px] text-gray-400 truncate'>{job.address}</span>
                  </div>
                </div>
                <Link href={`/contractor/jobs/${job.id}/assign`}>
                  <Button size='sm' className='bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-7 font-semibold'>
                    Assign Crew
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

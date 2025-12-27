'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, FileText, DollarSign, BarChart3 } from 'lucide-react';
import ScheduleTab from './team-ops/schedule-tab';
import TimeTrackingTab from './team-ops/time-tracking-tab';
import TimesheetsTab from './team-ops/timesheets-tab';
import PayrollTab from './team-ops/payroll-tab';
import ReportsTab from './team-ops/reports-tab';

export default function TeamOperationsPage() {
  const [activeTab, setActiveTab] = useState('schedule');

  return (
    <div className="w-full px-4 py-8 md:px-0">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-50 mb-2">
            Team Operations
          </h1>
          <p className="text-sm text-slate-300/80">
            Manage scheduling, time tracking, timesheets, and payroll for your team.
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-blue-700" />
          <div className="relative p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-slate-900/60 border border-white/10 rounded-xl p-1">
                <TabsTrigger
                  value="schedule"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </TabsTrigger>
                <TabsTrigger
                  value="time-tracking"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg"
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Time</span>
                </TabsTrigger>
                <TabsTrigger
                  value="timesheets"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Timesheets</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payroll"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Payroll</span>
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Reports</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="schedule" className="mt-0">
                  <ScheduleTab />
                </TabsContent>
                <TabsContent value="time-tracking" className="mt-0">
                  <TimeTrackingTab />
                </TabsContent>
                <TabsContent value="timesheets" className="mt-0">
                  <TimesheetsTab />
                </TabsContent>
                <TabsContent value="payroll" className="mt-0">
                  <PayrollTab />
                </TabsContent>
                <TabsContent value="reports" className="mt-0">
                  <ReportsTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

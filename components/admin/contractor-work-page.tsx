'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  ClipboardList, 
  CreditCard, 
  Wrench,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import ContractorDirectory from './contractor-directory';
import WorkOrdersTab from './work-orders-tab';
import ContractorPaymentsTab from './contractor-payments-tab';

export default function ContractorWorkPage() {
  const [activeTab, setActiveTab] = useState('directory');

  return (
    <main className="w-full px-2 py-4 md:px-6 lg:px-8 md:py-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-xl md:text-3xl font-bold text-black flex items-center gap-2">
            <Wrench className="h-5 w-5 md:h-7 md:w-7 text-black" />
            Contractor Hub
          </h1>
          <p className="text-xs md:text-sm text-black">
            Manage contractors, work orders, and payments all in one place
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-800 shadow-2xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">Contractors</p>
                  <p className="text-lg md:text-xl font-bold text-white">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]0">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-800 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">Active Jobs</p>
                  <p className="text-lg md:text-xl font-bold text-black">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-800 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">Completed</p>
                  <p className="text-lg md:text-xl font-bold text-black">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-800 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">This Month</p>
                  <p className="text-lg md:text-xl font-bold text-black">$--</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="rounded-lg sm:rounded-xl bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-500 border border-black p-2.5 sm:p-3 md:p-4 space-y-1 hover:border-slate-700 transition-colors shadow-2xl active:scale-[0.98]">
            <TabsTrigger 
              value="directory" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-white flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-2 text-white"
            >
              <Users className="h-4 w-4" />
              <span>Directory</span>
            </TabsTrigger>
            <TabsTrigger 
              value="work-orders" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-2 text-white"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Work Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-white flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-2 text-white"
            >
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="mt-4 md:mt-6">
            <ContractorDirectory />
          </TabsContent>

          <TabsContent value="work-orders" className="mt-4 md:mt-6">
            <WorkOrdersTab />
          </TabsContent>

          <TabsContent value="payments" className="mt-4 md:mt-6">
            <ContractorPaymentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

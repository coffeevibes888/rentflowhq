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
          <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 md:h-7 md:w-7 text-violet-400" />
            Contractor Hub
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Manage contractors, work orders, and payments all in one place
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-white/10 bg-gradient-to-br from-violet-600/20 to-violet-500/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Contractors</p>
                  <p className="text-lg md:text-xl font-bold text-white">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-white/10 bg-gradient-to-br from-cyan-600/20 to-cyan-500/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Active Jobs</p>
                  <p className="text-lg md:text-xl font-bold text-white">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-white/10 bg-gradient-to-br from-emerald-600/20 to-emerald-500/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Completed</p>
                  <p className="text-lg md:text-xl font-bold text-white">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-white/10 bg-gradient-to-br from-amber-600/20 to-amber-500/10">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">This Month</p>
                  <p className="text-lg md:text-xl font-bold text-white">$--</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gradient-to-r from-indigo-700 to-indigo-900 border border-white/10 p-1 flex flex-wrap h-auto gap-1 w-full md:w-auto">
            <TabsTrigger 
              value="directory" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-2 text-white"
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
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white flex items-center gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-2 text-white"
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

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ClipboardList, CreditCard } from 'lucide-react';
import ContractorDirectory from './contractor-directory';
import WorkOrdersTab from './work-orders-tab';
import ContractorPaymentsTab from './contractor-payments-tab';

export default function ContractorWorkPage() {
  const [activeTab, setActiveTab] = useState('directory');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contractor Work</h1>
        <p className="text-muted-foreground">
          Manage your contractors, work orders, and payments
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Directory</span>
          </TabsTrigger>
          <TabsTrigger value="work-orders" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Work Orders</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-6">
          <ContractorDirectory />
        </TabsContent>

        <TabsContent value="work-orders" className="mt-6">
          <WorkOrdersTab />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <ContractorPaymentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

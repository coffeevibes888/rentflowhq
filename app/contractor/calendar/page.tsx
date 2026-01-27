import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/db/prisma';
import AvailabilityCalendar from '@/components/contractor/calendar/availability-calendar';
import WorkingHoursManager from '@/components/contractor/calendar/working-hours-manager';
import BookingSettings from '@/components/contractor/calendar/booking-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Settings } from 'lucide-react';

export default async function ContractorCalendarPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const contractor = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      businessName: true,
      instantBookingEnabled: true,
    },
  });

  if (!contractor) {
    redirect('/contractor/dashboard');
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar & Availability</h1>
        <p className="text-muted-foreground mt-2">
          Manage your schedule, working hours, and booking availability
        </p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hours
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <AvailabilityCalendar
            contractorId={contractor.id}
            mode="manage"
          />
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <WorkingHoursManager contractorId={contractor.id} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <BookingSettings contractorId={contractor.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

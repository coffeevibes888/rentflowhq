'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Users, Calendar, Briefcase, 
  Clock, FileText, DollarSign, Crown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TeamChat } from '@/components/team/team-chat';
import { TeamMembersTab } from './team-hub/team-members-tab';
import { HiringTab } from './team-hub/hiring-tab';

// Lazy load enterprise-only components
import dynamic from 'next/dynamic';

const ScheduleTab = dynamic(() => import('./team-ops/schedule-tab'), { 
  loading: () => <TabLoadingState />,
  ssr: false 
});
const TimeTrackingTab = dynamic(() => import('./team-ops/time-tracking-tab'), { 
  loading: () => <TabLoadingState />,
  ssr: false 
});
const TimesheetsTab = dynamic(() => import('./team-ops/timesheets-tab'), { 
  loading: () => <TabLoadingState />,
  ssr: false 
});
const PayrollTab = dynamic(() => import('./team-ops/payroll-tab'), { 
  loading: () => <TabLoadingState />,
  ssr: false 
});

function TabLoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  );
}

interface TeamMemberData {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'inactive';
  invitedEmail?: string;
  permissions: string[];
  joinedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  } | null;
}

interface TeamHubProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  landlordId: string;
  teamMembers: TeamMemberData[];
  subscriptionTier: 'starter' | 'pro' | 'enterprise';
  currentUserRole?: string;
  canManageTeam?: boolean;
  features?: {
    teamManagement?: boolean;
    teamCommunications?: boolean;
    teamOperations?: boolean;
  };
}

export function TeamHub({ 
  currentUser, 
  landlordId, 
  teamMembers, 
  subscriptionTier,
  currentUserRole = 'member',
  canManageTeam = false,
}: TeamHubProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const isEnterprise = subscriptionTier === 'enterprise';
  const activeMembers = teamMembers.filter(m => m.status === 'active');
  const isOwner = currentUserRole === 'owner';

  const handleRolesClick = () => {
    setActiveTab('members');
  };

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Team Hub</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your team, communicate, and {isEnterprise ? 'run operations' : 'collaborate'}
            </p>
          </div>
          {isEnterprise && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Crown className="h-3 w-3 mr-1" />
              Enterprise
            </Badge>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 bg-slate-900/30">
          <TabsList className="inline-flex h-auto p-1 bg-slate-800/60 border border-white/10 rounded-xl gap-1 flex-wrap">
            {/* Always available tabs */}
            <TabsTrigger
              value="chat"
              className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg text-slate-300"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            
            <TabsTrigger
              value="members"
              className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg text-slate-300"
            >
              <Users className="h-4 w-4" />
              <span>Members</span>
              <Badge variant="secondary" className="ml-1 bg-white/10 text-xs">
                {activeMembers.length}
              </Badge>
            </TabsTrigger>

            {/* Enterprise-only tabs */}
            {isEnterprise && (
              <>
                <div className="w-px h-6 bg-white/10 mx-1 self-center" />
                
                <TabsTrigger
                  value="schedule"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg text-slate-300"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </TabsTrigger>
                
                <TabsTrigger
                  value="time"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg text-slate-300"
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Time</span>
                </TabsTrigger>
                
                <TabsTrigger
                  value="timesheets"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg text-slate-300"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Timesheets</span>
                </TabsTrigger>
                
                <TabsTrigger
                  value="payroll"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg text-slate-300"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Payroll</span>
                </TabsTrigger>
                
                <TabsTrigger
                  value="hiring"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg text-slate-300"
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Hiring</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* Tab Content - Full height, natural page scroll */}
        <div className="flex-1">
          <TabsContent value="chat" className="h-full mt-0">
            <div className="h-full">
              <TeamChat
                currentUser={currentUser}
                landlordId={landlordId}
                isFullPage={true}
                teamMembers={teamMembers}
                canManageTeam={canManageTeam}
                onRolesClick={handleRolesClick}
              />
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-0">
            <div className="p-6">
              <TeamMembersTab 
                members={teamMembers} 
                isEnterprise={isEnterprise}
                canManageTeam={canManageTeam}
                currentUserRole={currentUserRole}
              />
            </div>
          </TabsContent>

          {isEnterprise && (
            <>
              <TabsContent value="schedule" className="mt-0">
                <div className="p-6">
                  <ScheduleTab />
                </div>
              </TabsContent>

              <TabsContent value="time" className="mt-0">
                <div className="p-6">
                  <TimeTrackingTab />
                </div>
              </TabsContent>

              <TabsContent value="timesheets" className="mt-0">
                <div className="p-6">
                  <TimesheetsTab />
                </div>
              </TabsContent>

              <TabsContent value="payroll" className="mt-0">
                <div className="p-6">
                  <PayrollTab />
                </div>
              </TabsContent>

              <TabsContent value="hiring" className="mt-0">
                <div className="p-6">
                  <HiringTab landlordId={landlordId} />
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}


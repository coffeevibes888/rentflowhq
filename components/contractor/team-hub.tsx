'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Users, Calendar, Clock, 
  FileText, Crown, Briefcase
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TeamChat } from '@/components/team/team-chat';
import { ContractorTeamMembersTab } from './team-hub/team-members-tab';

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
  contractorId: string;
  teamMembers: TeamMemberData[];
  subscriptionTier: 'starter' | 'pro' | 'enterprise';
}

export function TeamHub({ 
  currentUser, 
  contractorId, 
  teamMembers, 
  subscriptionTier,
}: TeamHubProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const isEnterprise = subscriptionTier === 'enterprise';
  const isPro = subscriptionTier === 'pro' || subscriptionTier === 'enterprise';
  const activeMembers = teamMembers.filter(m => m.status === 'active');

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Briefcase className="h-7 w-7 text-violet-400" />
              Team Hub
            </h1>
            <p className="text-slate-300 mt-1 text-sm sm:text-base">
              {isEnterprise 
                ? 'Manage unlimited team members, communicate, and run operations'
                : isPro
                ? 'Manage up to 6 team members (5 + owner), communicate, and track operations'
                : 'Manage your team, communicate, and collaborate'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              {activeMembers.length} Active {activeMembers.length === 1 ? 'Member' : 'Members'}
            </Badge>
            {isEnterprise && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Crown className="h-3 w-3 mr-1" />
                Enterprise
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex-shrink-0 px-4 sm:px-6 pt-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 bg-slate-800/50 p-1">
            <TabsTrigger value="chat" className="flex items-center gap-2 text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            {isEnterprise && (
              <>
                <TabsTrigger value="schedule" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="time-tracking" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Time</span>
                </TabsTrigger>
                <TabsTrigger value="timesheets" className="flex items-center gap-2 text-xs sm:text-sm">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Timesheets</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="chat" className="mt-0 p-4 sm:p-6">
            <TeamChat
              currentUser={currentUser}
              landlordId={contractorId}
              teamMembers={teamMembers}
              isFullPage={true}
            />
          </TabsContent>

          <TabsContent value="members" className="mt-0 p-4 sm:p-6">
            <ContractorTeamMembersTab
              contractorId={contractorId}
              teamMembers={teamMembers}
              subscriptionTier={subscriptionTier}
            />
          </TabsContent>

          {isEnterprise && (
            <>
              <TabsContent value="schedule" className="mt-0 p-4 sm:p-6">
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300">Schedule management coming soon</p>
                </div>
              </TabsContent>

              <TabsContent value="time-tracking" className="mt-0 p-4 sm:p-6">
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300">Time tracking coming soon</p>
                </div>
              </TabsContent>

              <TabsContent value="timesheets" className="mt-0 p-4 sm:p-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300">Timesheets coming soon</p>
                </div>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>
    </div>
  );
}

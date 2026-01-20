'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, Shield, Clock } from 'lucide-react';

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

interface ContractorTeamMembersTabProps {
  teamMembers: TeamMemberData[];
  contractorId: string;
  subscriptionTier: 'starter' | 'pro' | 'enterprise';
}

export function ContractorTeamMembersTab({ 
  teamMembers, 
  contractorId, 
  subscriptionTier 
}: ContractorTeamMembersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {member.user?.name?.charAt(0) || member.invitedEmail?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {member.user?.name || member.invitedEmail || 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {member.user?.email || member.invitedEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

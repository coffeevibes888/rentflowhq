'use client';

import { Users } from 'lucide-react';
import { TeamMembersTab } from '@/components/contractor/team-hub/team-members-tab';

interface Props {
  members: any[];
  isEnterprise: boolean;
  canManageTeam: boolean;
  currentUserRole: string;
}

export function ContractorTeamDirectoryPage({ members, isEnterprise, canManageTeam, currentUserRole }: Props) {
  return (
    <div className="space-y-6">
      <div className="relative rounded-xl sm:rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.12),_transparent_60%)]" />
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                <Users className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Team Directory</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Manage your team members, roles, and permissions</p>
              </div>
            </div>
            {isEnterprise && (
              <span className="text-[10px] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 px-2.5 py-1 rounded-full font-bold shadow">ENTERPRISE</span>
            )}
          </div>
        </div>
      </div>

      <TeamMembersTab
        members={members}
        isEnterprise={isEnterprise}
        canManageTeam={canManageTeam}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}

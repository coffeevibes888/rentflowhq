'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, UserPlus, Mail, Shield, ShieldCheck, Crown, 
  MoreVertical, Trash2, UserCog, Clock, CheckCircle 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeamMember {
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

interface TeamDashboardProps {
  members: TeamMember[];
}

const ROLE_ICONS = {
  owner: Crown,
  admin: ShieldCheck,
  member: Shield,
};

const ROLE_COLORS = {
  owner: 'text-amber-400',
  admin: 'text-violet-400',
  member: 'text-slate-400',
};

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

export function TeamDashboard({ members: initialMembers }: TeamDashboardProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/landlord/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMembers([...members, data.member]);
        setShowInviteDialog(false);
        setInviteEmail('');
        setInviteRole('member');
      } else {
        alert(data.message || 'Failed to send invitation');
      }
    } catch {
      alert('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      const res = await fetch(`/api/landlord/team/${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setMembers(members.filter(m => m.id !== memberId));
      } else {
        alert(data.message || 'Failed to remove member');
      }
    } catch {
      alert('Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const res = await fetch(`/api/landlord/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMembers(members.map(m => 
          m.id === memberId ? { ...m, role: newRole } : m
        ));
      } else {
        alert(data.message || 'Failed to update role');
      }
    } catch {
      alert('Failed to update role');
    }
  };

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Users className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Team Members</p>
            <p className="text-2xl font-semibold text-white">{activeMembers.length}</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowInviteDialog(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Active Members */}
      <div className="rounded-2xl border border-black bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Active Members</h2>
        </div>
        
        {activeMembers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active team members yet</p>
            <p className="text-sm">Invite your first team member to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activeMembers.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role];
              return (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      {member.user?.image ? (
                        <img src={member.user.image} alt="" className="h-10 w-10 rounded-full" />
                      ) : (
                        <span className="text-white font-medium">
                          {(member.user?.name || member.invitedEmail || '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {member.user?.name || member.invitedEmail}
                      </p>
                      <p className="text-sm text-slate-400">{member.user?.email || member.invitedEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 ${ROLE_COLORS[member.role]}`}>
                      <RoleIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{ROLE_LABELS[member.role]}</span>
                    </div>
                    
                    {member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-white/10">
                          <DropdownMenuItem 
                            onClick={() => handleUpdateRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                            className="text-slate-200 focus:bg-white/10"
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Make {member.role === 'admin' ? 'Member' : 'Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-400 focus:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && (
        <div className="rounded-2xl border border-black bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-amber-500/20">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Pending Invitations
            </h2>
          </div>
          
          <div className="divide-y divide-amber-500/10">
            {pendingMembers.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{member.invitedEmail}</p>
                    <p className="text-sm text-amber-400">Invitation sent</p>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Team Member</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send an invitation to join your property management team.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Role</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}>
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="admin" className="text-white">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-violet-400" />
                      Admin - Full access to all features
                    </div>
                  </SelectItem>
                  <SelectItem value="member" className="text-white">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-400" />
                      Member - View & manage assigned tasks
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={isLoading || !inviteEmail.trim()}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

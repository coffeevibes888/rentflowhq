'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserPlus, Mail, Shield, ShieldCheck, Crown, 
  MoreVertical, Trash2, Clock, Search,
  Building2, Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'manager' | 'leasing_agent' | 'showing_agent' | 'employee';
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

interface TeamMembersTabProps {
  members: TeamMember[];
  isEnterprise?: boolean;
  canManageTeam?: boolean;
  currentUserRole?: string;
}

const ROLE_CONFIG = {
  owner: { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Owner' },
  admin: { icon: ShieldCheck, color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Admin' },
  manager: { icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Manager' },
  leasing_agent: { icon: Building2, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Leasing Agent' },
  showing_agent: { icon: Users, color: 'text-teal-400', bg: 'bg-teal-500/20', label: 'Showing Agent' },
  member: { icon: Shield, color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Member' },
  employee: { icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Employee' },
};

const PERMISSION_LABELS: Record<string, string> = {
  view_properties: 'View Properties',
  manage_tenants: 'Manage Tenants',
  manage_maintenance: 'Manage Maintenance',
  manage_finances: 'Manage Finances',
  manage_team: 'Manage Team',
  manage_schedule: 'Manage Schedule',
  approve_timesheets: 'Approve Timesheets',
  view_financials: 'View Financials',
  schedule_showings: 'Schedule Showings',
  process_applications: 'Process Applications',
};

export function TeamMembersTab({ 
  members: initialMembers, 
  isEnterprise = false,
  canManageTeam = false,
  currentUserRole = 'member',
}: TeamMembersTabProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPermissionsDialog, setShowPermissionsDialog] = useState<TeamMember | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsLoading(true);
    setInviteError(null);
    
    try {
      const res = await fetch('/api/landlord/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      
      if (data.success) {
        setInviteSuccess(true);
        if (data.member) {
          setMembers([...members, data.member]);
        }
        setTimeout(() => {
          setShowInviteDialog(false);
          setInviteEmail('');
          setInviteRole('member');
          setInviteSuccess(false);
        }, 1500);
      } else {
        setInviteError(data.message || 'Failed to send invitation');
      }
    } catch {
      setInviteError('Network error. Please try again.');
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

  const handleClearAllInvites = async () => {
    if (!confirm('Are you sure you want to clear all pending invitations?')) return;
    
    try {
      const res = await fetch('/api/landlord/team/clear-invites', {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setMembers(members.filter(m => m.status !== 'pending'));
        alert(data.message);
      } else {
        alert(data.message || 'Failed to clear invites');
      }
    } catch {
      alert('Failed to clear invites');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/landlord/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMembers(members.map(m => 
          m.id === memberId ? { ...m, role: newRole as TeamMember['role'] } : m
        ));
      } else {
        alert(data.message || 'Failed to update role');
      }
    } catch {
      alert('Failed to update role');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!showPermissionsDialog) return;
    
    try {
      const res = await fetch(`/api/landlord/team/${showPermissionsDialog.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });
      const data = await res.json();
      
      if (data.success) {
        setMembers(members.map(m => 
          m.id === showPermissionsDialog.id ? { ...m, permissions: selectedPermissions } : m
        ));
        setShowPermissionsDialog(null);
      } else {
        alert(data.message || 'Failed to update permissions');
      }
    } catch {
      alert('Failed to update permissions');
    }
  };

  const openPermissionsDialog = (member: TeamMember) => {
    setShowPermissionsDialog(member);
    setSelectedPermissions(member.permissions || []);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');
  
  // Calculate team limits based on tier
  const maxMembers = isEnterprise ? Infinity : 6; // Pro: 5 members + 1 owner = 6 total
  const isAtLimit = !isEnterprise && activeMembers.length >= maxMembers;
  
  const filteredActive = activeMembers.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.user?.name?.toLowerCase().includes(q) ||
      m.user?.email?.toLowerCase().includes(q) ||
      m.invitedEmail?.toLowerCase().includes(q)
    );
  });

  const availableRoles = isEnterprise 
    ? ['admin', 'manager', 'leasing_agent', 'showing_agent', 'member', 'employee']
    : ['admin', 'manager', 'leasing_agent', 'showing_agent', 'member'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-slate-900/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeMembers.length}</p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 bg-slate-900/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingMembers.length}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 bg-slate-900/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {activeMembers.filter(m => m.role === 'admin' || m.role === 'manager').length}
                </p>
                <p className="text-xs text-slate-400">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/10 bg-slate-900/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Crown className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {isEnterprise ? '∞' : `${activeMembers.length}/${maxMembers}`}
                </p>
                <p className="text-xs text-slate-400">{isEnterprise ? 'Unlimited' : 'Team Limit'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Invite */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-900/60 border-white/10 text-white"
          />
        </div>
        {canManageTeam && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setShowInviteDialog(true)}
              disabled={isAtLimit}
              className="bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={isAtLimit ? 'Team limit reached. Upgrade to Enterprise for unlimited members.' : 'Invite a new team member'}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        )}
      </div>

      {/* Team Limit Warning for Pro */}
      {!isEnterprise && isAtLimit && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">Team Limit Reached</p>
              <p className="text-sm text-amber-300/80 mt-1">
                You've reached the Pro plan limit of 6 team members (5 members + owner). 
                Upgrade to Enterprise for unlimited team members and advanced team operations features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Members */}
      <Card className="border-white/10 bg-slate-900/60">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredActive.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? 'No members found' : 'No active team members yet'}</p>
              {!searchQuery && (
                <p className="text-sm mt-1">Invite your first team member to get started</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredActive.map((member) => {
                const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
                const RoleIcon = config.icon;
                
                return (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                        {member.user?.image ? (
                          <img src={member.user.image} alt="" className="h-11 w-11 object-cover" />
                        ) : (
                          <span className="text-white font-medium text-lg">
                            {(member.user?.name || member.invitedEmail || '?')[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {member.user?.name || member.invitedEmail}
                        </p>
                        <p className="text-sm text-slate-400">{member.user?.email || member.invitedEmail}</p>
                        {member.joinedAt && (
                          <p className="text-xs text-slate-500">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={`${config.bg} ${config.color} border-0`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      
                      {member.role !== 'owner' && canManageTeam && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-white/10 w-48">
                            <div className="px-2 py-1.5 text-xs text-slate-400 font-medium">Change Role</div>
                            {availableRoles.map(role => (
                              <DropdownMenuItem 
                                key={role}
                                onClick={() => handleUpdateRole(member.id, role)}
                                className={`text-slate-200 focus:bg-white/10 ${member.role === role ? 'bg-white/5' : ''}`}
                              >
                                {ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.label || role}
                                {member.role === role && <span className="ml-auto text-violet-400">✓</span>}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem 
                              onClick={() => openPermissionsDialog(member)}
                              className="text-slate-200 focus:bg-white/10"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Custom Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem 
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-400 focus:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Team
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
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingMembers.length > 0 && canManageTeam && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="border-b border-amber-500/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                Pending Invitations
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllInvites}
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-amber-500/10">
              {pendingMembers.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.invitedEmail}</p>
                      <p className="text-sm text-amber-400">Invitation sent • Expires in 7 days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                      {ROLE_CONFIG[member.role]?.label || member.role}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={(open) => {
        setShowInviteDialog(open);
        if (!open) {
          setInviteError(null);
          setInviteSuccess(false);
        }
      }}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Team Member</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send an invitation to join your property management team.
              {!isEnterprise && (
                <span className="block mt-2 text-amber-400 text-sm">
                  Pro plan: {activeMembers.length}/{maxMembers} team members used
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {inviteError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {inviteError}
              </div>
            )}
            
            {inviteSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                ✓ Invitation sent successfully!
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError(null);
                }}
                className="bg-slate-800 border-white/10 text-white"
                disabled={isLoading || inviteSuccess}
              />
              <p className="text-xs text-slate-500">
                If they don&apos;t have an account, they&apos;ll be invited to sign up.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Role</label>
              <Select 
                value={inviteRole} 
                onValueChange={setInviteRole}
                disabled={isLoading || inviteSuccess}
              >
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {availableRoles.map(role => {
                    const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                    const Icon = config?.icon || Shield;
                    return (
                      <SelectItem key={role} value={role} className="text-white">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config?.color || 'text-slate-400'}`} />
                          {config?.label || role}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {isEnterprise && (
                <div className="text-xs text-slate-500 space-y-1 mt-2">
                  <p><strong>Admin:</strong> Full access to all features</p>
                  <p><strong>Manager:</strong> Can manage team, assign tasks, approve timesheets</p>
                  <p><strong>Leasing Agent:</strong> Process applications, manage tenants</p>
                  <p><strong>Showing Agent:</strong> Schedule and conduct property showings</p>
                  <p><strong>Member:</strong> View & manage assigned tasks</p>
                  <p><strong>Employee:</strong> Clock in/out, view schedule, request time off</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={isLoading || !inviteEmail.trim() || inviteSuccess}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {isLoading ? 'Sending...' : inviteSuccess ? '✓ Sent!' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Permissions Dialog */}
      <Dialog open={!!showPermissionsDialog} onOpenChange={(open) => {
        if (!open) setShowPermissionsDialog(null);
      }}>
        <DialogContent className="bg-slate-900 border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Custom Permissions</DialogTitle>
            <DialogDescription className="text-slate-400">
              Customize access permissions for {showPermissionsDialog?.user?.name || showPermissionsDialog?.invitedEmail}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-300 mb-3">Select Permissions</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <label 
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/60 border border-white/10 hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(key)}
                      onChange={() => togglePermission(key)}
                      className="h-4 w-4 rounded border-white/20 bg-slate-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-900"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{label}</p>
                      {key === 'manage_finances' && (
                        <p className="text-xs text-slate-400">Access to financial data and reports</p>
                      )}
                      {key === 'view_financials' && (
                        <p className="text-xs text-slate-400">View-only access to financial information</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-400">
                <strong>Tip:</strong> You can restrict access to finances by unchecking &quot;Manage Finances&quot; and &quot;View Financials&quot;
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPermissionsDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePermissions}
              className="bg-violet-600 hover:bg-violet-500"
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

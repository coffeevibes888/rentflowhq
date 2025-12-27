'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Hash, Users, Plus, Settings, ChevronDown, 
  MessageSquare, Search, X, MoreVertical, Bell, BellOff,
  Smile, Paperclip, AtSign, UserPlus, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status?: 'online' | 'away' | 'offline';
  userId?: string;
  invitedEmail?: string;
  joinedAt?: string;
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

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  description?: string;
  unreadCount?: number;
  members?: TeamMember[];
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  content: string;
  createdAt: string;
  isEdited?: boolean;
  reactions?: { emoji: string; users: string[] }[];
}

interface TeamChatProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  landlordId: string;
  onClose?: () => void;
  isFullPage?: boolean;
  teamMembers?: TeamMemberData[];
}

const STATUS_COLORS = {
  online: 'bg-emerald-500',
  away: 'bg-amber-500',
  offline: 'bg-slate-500',
};

export function TeamChat({ currentUser, landlordId, onClose, isFullPage = false, teamMembers: initialTeamMembers = [] }: TeamChatProps) {
  const [channels, setChannels] = useState<Channel[]>([
    { id: 'general', name: 'general', type: 'public', description: 'Company-wide announcements' },
    { id: 'maintenance', name: 'maintenance', type: 'public', description: 'Maintenance requests & updates' },
    { id: 'tenants', name: 'tenants', type: 'public', description: 'Tenant discussions' },
  ]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(channels[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'public' | 'private'>('public');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembers, setShowMembers] = useState(!isFullPage);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [teamMembersData, setTeamMembersData] = useState<TeamMemberData[]>(initialTeamMembers);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load team members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await fetch('/api/landlord/team/members');
        const data = await res.json();
        if (data.success && data.members) {
          setTeamMembersData(data.members);
          setMembers(data.members.map((m: TeamMemberData) => ({
            id: m.userId,
            name: m.user?.name || m.invitedEmail || 'Team Member',
            email: m.user?.email || m.invitedEmail,
            image: m.user?.image,
            role: m.role,
            status: 'online',
          })));
        }
      } catch {
        setMembers([{
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
          role: 'owner',
          status: 'online',
        }]);
      }
    };
    loadMembers();
  }, [currentUser]);

  // Load messages for active channel
  useEffect(() => {
    if (!activeChannel) return;
    
    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/landlord/team/channels/${activeChannel.id}/messages`);
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      } catch {
        // Demo messages for now
        setMessages([
          {
            id: '1',
            channelId: activeChannel.id,
            senderId: 'system',
            senderName: 'System',
            content: `Welcome to #${activeChannel.name}! This is the beginning of the channel.`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };
    loadMessages();
  }, [activeChannel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChannel) return;

    const content = input.trim();
    setInput('');
    setIsLoading(true);

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      channelId: activeChannel.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderImage: currentUser.image,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await fetch(`/api/landlord/team/channels/${activeChannel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      
      if (data.success && data.message) {
        setMessages(prev => prev.map(m => 
          m.id === tempMessage.id ? data.message : m
        ));
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(false);
    
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
          setTeamMembersData([...teamMembersData, data.member]);
        }
        // Close dialog after short delay to show success
        setTimeout(() => {
          setShowInviteDialog(false);
          setInviteEmail('');
          setInviteRole('member');
          setInviteSuccess(false);
        }, 1500);
      } else {
        setInviteError(data.message || 'Failed to send invitation. Please try again.');
      }
    } catch (error) {
      console.error('Invite error:', error);
      setInviteError('Network error. Please check your connection and try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this team member?')) return;
    
    try {
      const res = await fetch(`/api/landlord/team/${memberId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        setTeamMembersData(teamMembersData.filter(m => m.id !== memberId));
      }
    } catch {
    }
  };

  const activeMembers = teamMembersData.filter(m => m.status === 'active');
  const pendingMembers = teamMembersData.filter(m => m.status === 'pending');

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch('/api/landlord/team/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
          type: newChannelType,
        }),
      });
      const data = await res.json();
      
      if (data.success && data.channel) {
        setChannels(prev => [...prev, data.channel]);
        setActiveChannel(data.channel);
      } else {
        // Demo: add locally
        const newChannel: Channel = {
          id: `channel-${Date.now()}`,
          name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
          type: newChannelType,
        };
        setChannels(prev => [...prev, newChannel]);
        setActiveChannel(newChannel);
      }
      
      setShowCreateChannel(false);
      setNewChannelName('');
    } catch {
      // Demo: add locally
      const newChannel: Channel = {
        id: `channel-${Date.now()}`,
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        type: newChannelType,
      };
      setChannels(prev => [...prev, newChannel]);
      setActiveChannel(newChannel);
      setShowCreateChannel(false);
      setNewChannelName('');
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    
    msgs.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  };

  const containerClass = isFullPage
    ? 'relative flex h-full w-full rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl overflow-hidden'
    : 'relative flex flex-col sm:flex-row h-full bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl';

  const sidebarClass = isFullPage
    ? `${isMobileMenuOpen ? 'flex' : 'hidden'} absolute inset-y-0 left-0 z-20 w-72 bg-slate-950/90 backdrop-blur-xl border-r border-white/10 flex-col`
    : `${isMobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col w-full sm:w-48 md:w-56 bg-slate-950 border-b sm:border-b-0 sm:border-r border-white/10 max-h-48 sm:max-h-none overflow-y-auto`;

  const membersSidebarClass = isFullPage
    ? 'hidden xl:block w-56 border-l border-white/10 bg-slate-900/50 overflow-y-auto'
    : 'hidden md:block w-40 lg:w-48 border-l border-white/10 bg-slate-900/50 overflow-y-auto';

  return (
    <div className={containerClass}>
      {isFullPage && isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute inset-0 z-10 bg-black/40"
        />
      )}
      {/* Sidebar */}
      <aside className={sidebarClass}>
        {/* Workspace Header */}
        <div className="p-3 border-b border-white/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                    PM
                  </div>
                  <span className="font-semibold text-white text-sm">Property Team</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-800 border-white/10">
              <DropdownMenuItem className="text-slate-200">
                <Settings className="h-4 w-4 mr-2" />
                Workspace Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-200">
                <Users className="h-4 w-4 mr-2" />
                Invite People
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-slate-800/50 border-white/10 text-sm text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-2">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Channels</span>
              <button 
                onClick={() => setShowCreateChannel(true)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Plus className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            
            {channels.filter(c => c.type !== 'direct').map(channel => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  activeChannel?.id === channel.id
                    ? 'bg-violet-600/20 text-white'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Hash className="h-4 w-4 text-slate-500" />
                <span className="truncate">{channel.name}</span>
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="ml-auto bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Direct Messages */}
          <div className="px-2 py-2 border-t border-white/5">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Direct Messages</span>
              <button className="p-1 hover:bg-white/10 rounded transition-colors">
                <Plus className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            
            {members.slice(0, 5).map(member => (
              <button
                key={member.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-slate-300 hover:bg-white/5 transition-colors"
              >
                <div className="relative">
                  <div className="h-6 w-6 rounded-md bg-slate-700 flex items-center justify-center text-xs">
                    {member.image ? (
                      <img src={member.image} alt="" className="h-6 w-6 rounded-md" />
                    ) : (
                      member.name[0].toUpperCase()
                    )}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${STATUS_COLORS[member.status || 'offline']}`} />
                </div>
                <span className="truncate">{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <header className="h-12 sm:h-14 px-2 sm:px-4 flex items-center justify-between border-b border-white/10 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              className="p-1.5 hover:bg-white/10 rounded-lg flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500 flex-shrink-0" />
                <span className="font-semibold text-white text-sm sm:text-base truncate">{activeChannel?.name || 'Select a channel'}</span>
              </div>
              {activeChannel?.description && (
                <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[120px] sm:max-w-[200px]">{activeChannel.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white px-1.5 sm:px-3 h-8">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Invite</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-white/10">
                <DropdownMenuItem onClick={() => setShowInviteDialog(true)} className="text-slate-200">
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Team Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white px-1.5 sm:px-3 h-8">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Team ({activeMembers.length})</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-white/10 w-64 sm:w-80 max-h-96 overflow-y-auto">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase">Active Members</div>
                {activeMembers.map(m => (
                  <DropdownMenuItem key={m.id} className="text-slate-200 flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-slate-700 flex items-center justify-center text-xs flex-shrink-0">
                      {m.user?.image ? <img src={m.user.image} alt="" className="h-6 w-6 rounded" /> : (m.user?.name || m.invitedEmail || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{m.user?.name || m.invitedEmail}</div>
                      <div className="text-xs text-slate-400 capitalize">{m.role}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
                {pendingMembers.length > 0 && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <div className="px-2 py-1.5 text-xs font-semibold text-amber-400 uppercase">Pending</div>
                    {pendingMembers.map(m => (
                      <DropdownMenuItem key={m.id} className="text-slate-200 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        <span className="text-sm truncate">{m.invitedEmail}</span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button 
              onClick={() => setShowMembers(!showMembers)}
              className={`hidden md:block p-2 rounded-lg transition-colors ${showMembers ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <Users className="h-4 w-4" />
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {groupMessagesByDate(messages).map(group => (
                <div key={group.date}>
                  {/* Date Divider */}
                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(group.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  
                  {/* Messages */}
                  {group.messages.map((msg, idx) => {
                    const showAvatar = idx === 0 || 
                      group.messages[idx - 1].senderId !== msg.senderId;
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`group flex gap-3 px-2 py-1 hover:bg-white/5 rounded-lg ${!showAvatar ? 'mt-0.5' : 'mt-3'}`}
                      >
                        {showAvatar ? (
                          <div className="h-9 w-9 rounded-lg bg-slate-700 flex-shrink-0 flex items-center justify-center text-sm font-medium text-white">
                            {msg.senderImage ? (
                              <img src={msg.senderImage} alt="" className="h-9 w-9 rounded-lg" />
                            ) : (
                              msg.senderName[0].toUpperCase()
                            )}
                          </div>
                        ) : (
                          <div className="w-9 flex-shrink-0" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          {showAvatar && (
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-white text-sm">{msg.senderName}</span>
                              <span className="text-xs text-slate-500">{formatTime(msg.createdAt)}</span>
                            </div>
                          )}
                          <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        
                        {/* Message Actions (show on hover) */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button className="p-1 hover:bg-white/10 rounded text-slate-400">
                            <Smile className="h-4 w-4" />
                          </button>
                          <button className="p-1 hover:bg-white/10 rounded text-slate-400">
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-2 sm:p-4 border-t border-white/10 flex-shrink-0">
              <form onSubmit={handleSendMessage}>
                <div className="flex items-end gap-1 sm:gap-2 bg-slate-800 rounded-xl p-1.5 sm:p-2">
                  <button type="button" className="hidden sm:block p-2 hover:bg-white/10 rounded-lg text-slate-400">
                    <Plus className="h-5 w-5" />
                  </button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message #${activeChannel?.name || 'channel'}`}
                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-slate-500 text-sm"
                    disabled={!activeChannel}
                  />
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <button type="button" className="hidden sm:block p-2 hover:bg-white/10 rounded-lg text-slate-400">
                      <AtSign className="h-5 w-5" />
                    </button>
                    <button type="button" className="hidden sm:block p-2 hover:bg-white/10 rounded-lg text-slate-400">
                      <Smile className="h-5 w-5" />
                    </button>
                    <Button
                      type="submit"
                      disabled={!input.trim() || isLoading || !activeChannel}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-500 text-white h-8 w-8 sm:h-auto sm:w-auto p-1.5 sm:px-3"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Members Sidebar */}
          {showMembers && (
            <aside className={membersSidebarClass}>
              <div className="p-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Members — {members.length}
                </h3>
                <div className="space-y-1">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center text-sm">
                          {member.image ? (
                            <img src={member.image} alt="" className="h-8 w-8 rounded-lg" />
                          ) : (
                            member.name[0].toUpperCase()
                          )}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${STATUS_COLORS[member.status || 'offline']}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{member.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

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
                ✓ Invitation sent successfully! They&apos;ll receive an email shortly.
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
                disabled={isInviting || inviteSuccess}
              />
              <p className="text-xs text-slate-500">
                If they don&apos;t have an account, they&apos;ll be invited to sign up.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Role</label>
              <select 
                value={inviteRole} 
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="w-full p-2 rounded-lg bg-slate-800 border border-white/10 text-white"
                disabled={isInviting || inviteSuccess}
              >
                <option value="member">Member - View & manage assigned tasks</option>
                <option value="admin">Admin - Full access to all features</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)} disabled={isInviting}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteMember}
              disabled={isInviting || !inviteEmail.trim() || inviteSuccess}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {isInviting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Sending...
                </>
              ) : inviteSuccess ? (
                '✓ Sent!'
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

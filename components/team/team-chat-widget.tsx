'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { TeamChat } from './team-chat';
import { useSession } from 'next-auth/react';

interface TeamChatWidgetProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  landlordId: string;
  isTeamMember: boolean;
}

export function TeamChatWidget({ currentUser, landlordId, isTeamMember }: TeamChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const { data: session } = useSession();

  useEffect(() => {
    const checkBusinessHours = () => {
      const now = new Date();
      const day = now.getDay();
      const hours = now.getHours();

      const isWeekday = day >= 1 && day <= 5;
      const isBusinessHours = hours >= 9 && hours < 18;

      setIsOnline(isWeekday && isBusinessHours);
    };

    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const res = await fetch('/api/landlord/team/members');
        const data = await res.json();
        if (data.success && data.members) {
          setTeamMembers(data.members);
        }
      } catch {
        // Ignore errors
      }
    };
    loadTeamMembers();
  }, []);

  // Only show for team members
  if (!isTeamMember || !session?.user) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end justify-end`}>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all hover:scale-110 order-1 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <div className="relative">
              <Users className="w-6 h-6" />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  isOnline ? 'bg-green-500' : 'bg-slate-400'
                }`}
              />
            </div>
          </button>
        )}

        {!isOpen && (
          <div className="text-xs text-slate-600 dark:text-slate-400 text-center bg-white dark:bg-slate-800 px-2 py-1 rounded order-2">
            {isOnline ? '🟢 Team Online' : '⚫ Team Offline'}
          </div>
        )}

        {isOpen && (
          <div className="fixed inset-4 sm:inset-auto sm:relative sm:w-[380px] md:w-[600px] lg:w-[800px] h-[calc(100vh-32px)] sm:h-[500px] md:h-[600px] lg:h-[700px] sm:max-h-[calc(100vh-100px)] rounded-lg shadow-2xl overflow-hidden order-3 mb-2 z-50">
            <TeamChat
              currentUser={currentUser}
              landlordId={landlordId}
              onClose={() => setIsOpen(false)}
              isFullPage={false}
              teamMembers={teamMembers}
            />
          </div>
        )}
      </div>
    </>
  );
}
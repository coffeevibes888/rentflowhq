'use client';

import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Note {
  text: string;
  createdAt: Date;
  createdBy: string;
}

interface Message {
  id: string;
  content: string;
  senderName: string | null;
  senderEmail: string | null;
  role: string;
  createdAt: Date;
}

interface NotesTimelineProps {
  notes: Note[];
  messages: Message[];
}

export default function NotesTimeline({ notes, messages }: NotesTimelineProps) {
  // Combine notes and messages into a single timeline
  const timelineItems = [
    ...notes.map((note) => ({
      type: 'note' as const,
      content: note.text,
      author: note.createdBy,
      createdAt: new Date(note.createdAt),
    })),
    ...messages.map((message) => ({
      type: 'message' as const,
      content: message.content,
      author: message.senderName || message.senderEmail || 'Unknown',
      role: message.role,
      createdAt: new Date(message.createdAt),
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No notes or messages yet</p>
        <p className="text-sm mt-1">Add a note to start tracking your interactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timelineItems.map((item, index) => (
        <Card key={index} className="relative">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {item.type === 'note' ? (
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-violet-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {item.type === 'note' ? 'Note' : 'Message'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {item.content}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  by {item.author}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

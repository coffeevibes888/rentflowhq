'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  MessageSquare,
  MoreVertical,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface LeadCardProps {
  lead: {
    id: string;
    status: string;
    source: string;
    createdAt: Date;
    customer: {
      name: string;
      email: string;
      phone: string | null;
      address: any;
    };
  };
  onStatusChange: (leadId: string, newStatus: string) => void;
  onAddNote: (leadId: string) => void;
  onAddTag: (leadId: string) => void;
  onClick: (leadId: string) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-purple-100 text-purple-700 border-purple-200',
  quoted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  negotiating: 'bg-orange-100 text-orange-700 border-orange-200',
  won: 'bg-green-100 text-green-700 border-green-200',
  lost: 'bg-gray-100 text-gray-700 border-gray-200',
};

const sourceLabels: Record<string, string> = {
  marketplace: 'Marketplace',
  subdomain: 'Website',
  referral: 'Referral',
  job_posting: 'Job Post',
};

export default function LeadCard({
  lead,
  onStatusChange,
  onAddNote,
  onAddTag,
  onClick,
}: LeadCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusColor = statusColors[lead.status] || statusColors.new;
  const sourceLabel = sourceLabels[lead.source] || lead.source;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isHovered ? 'ring-2 ring-violet-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(lead.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{lead.customer.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={statusColor}>
                {lead.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {sourceLabel}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(lead.id, 'contacted');
              }}>
                Mark as Contacted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(lead.id, 'quoted');
              }}>
                Mark as Quoted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(lead.id, 'won');
              }}>
                Mark as Won
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange(lead.id, 'lost');
              }}>
                Mark as Lost
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onAddNote(lead.id);
              }}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onAddTag(lead.id);
              }}>
                <Tag className="h-4 w-4 mr-2" />
                Add Tag
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span className="truncate">{lead.customer.email}</span>
        </div>
        {lead.customer.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{lead.customer.phone}</span>
          </div>
        )}
        {lead.customer.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="truncate">
              {lead.customer.address.city}, {lead.customer.address.state}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
          <Clock className="h-4 w-4" />
          <span>{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
}

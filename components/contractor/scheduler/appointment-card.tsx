'use client';

import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  MapPin,
  User,
  DollarSign,
  MoreVertical,
  CheckCircle,
  XCircle,
  Edit,
} from 'lucide-react';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  status: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  depositAmount?: number;
  depositPaid: boolean;
  customerId: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onComplete?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
}

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', color: 'bg-blue-500' },
  completed: { label: 'Completed', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500' },
  no_show: { label: 'No Show', color: 'bg-gray-500' },
};

export default function AppointmentCard({
  appointment,
  onEdit,
  onComplete,
  onCancel,
}: AppointmentCardProps) {
  const statusConfig =
    STATUS_CONFIG[appointment.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.confirmed;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{appointment.title}</h3>
              <Badge className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {appointment.serviceType}
            </p>
          </div>

          {appointment.status === 'confirmed' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(appointment)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onComplete && (
                  <DropdownMenuItem onClick={() => onComplete(appointment.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {onCancel && (
                  <DropdownMenuItem
                    onClick={() => onCancel(appointment.id)}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {appointment.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {appointment.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(appointment.startTime), 'MMM d, yyyy')} •{' '}
              {format(new Date(appointment.startTime), 'h:mm a')} -{' '}
              {format(new Date(appointment.endTime), 'h:mm a')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {appointment.address.street}, {appointment.address.city},{' '}
              {appointment.address.state} {appointment.address.zip}
            </span>
          </div>

          {appointment.depositAmount && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>
                Deposit: ${appointment.depositAmount.toFixed(2)}
                {appointment.depositPaid && (
                  <Badge variant="outline" className="ml-2">
                    Paid
                  </Badge>
                )}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

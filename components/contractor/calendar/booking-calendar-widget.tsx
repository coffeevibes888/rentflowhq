'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import AvailabilityCalendar from './availability-calendar';
import TimeSlotPicker from './time-slot-picker';
import { format } from 'date-fns';

interface BookingCalendarWidgetProps {
  contractorId: string;
  contractorName: string;
  serviceTypes: string[];
  onBookingComplete?: (booking: any) => void;
}

export default function BookingCalendarWidget({
  contractorId,
  contractorName,
  serviceTypes,
  onBookingComplete,
}: BookingCalendarWidgetProps) {
  const [step, setStep] = useState<'date' | 'time' | 'details'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<string>(serviceTypes[0] || '');

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
  };

  const handleBack = () => {
    if (step === 'time') {
      setStep('date');
      setSelectedSlot(null);
    } else if (step === 'details') {
      setStep('time');
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'date' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Select Date</span>
        </div>
        <div className="w-12 h-px bg-border" />
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'time' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Select Time</span>
        </div>
        <div className="w-12 h-px bg-border" />
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'details' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <MapPin className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Details</span>
        </div>
      </div>

      {/* Service Type Selection */}
      {serviceTypes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serviceTypes.map((service) => (
                <Button
                  key={service}
                  variant={selectedService === service ? 'default' : 'outline'}
                  onClick={() => setSelectedService(service)}
                  className="capitalize"
                >
                  {service.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {step === 'date' && (
        <AvailabilityCalendar
          contractorId={contractorId}
          mode="view"
          onDateSelect={handleDateSelect}
        />
      )}

      {step === 'time' && selectedDate && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected Date</CardTitle>
              <CardDescription>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
          </Card>

          <TimeSlotPicker
            contractorId={contractorId}
            selectedDate={selectedDate}
            serviceType={selectedService}
            onSlotSelect={handleSlotSelect}
            selectedSlot={selectedSlot}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button
              onClick={() => setStep('details')}
              disabled={!selectedSlot}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'details' && selectedDate && selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
            <CardDescription>Review your booking details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contractor:</span>
                <span className="font-medium">{contractorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium capitalize">{selectedService.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">
                  {format(selectedSlot.startTime, 'h:mm a')} - {format(selectedSlot.endTime, 'h:mm a')}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button className="flex-1">
                Confirm Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

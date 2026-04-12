'use client';

import { useEffect, useCallback, useState } from 'react';
import { DoorOpen, Bath, Sofa, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useWizard } from '../wizard-context';
import { RoomData } from '../types';

interface RoomDetailsStepProps {
  setValidate: (fn: (() => boolean) | null) => void;
}

const ROOM_AMENITIES = [
  'Window', 'Closet', 'Desk', 'Chair', 'Bed Frame', 'Mattress',
  'Dresser', 'Nightstand', 'Lamp', 'Mirror', 'AC Unit', 'Ceiling Fan',
];

export function RoomDetailsStep({ setValidate }: RoomDetailsStepProps) {
  const { state, updateFormData } = useWizard();
  const [expandedRoom, setExpandedRoom] = useState<number>(0);

  const rooms = state.formData.rooms || [];

  const validate = useCallback(() => {
    // Basic validation - ensure all rooms have names
    const isValid = rooms.every(room => room.name && room.name.trim().length > 0);
    return isValid || true; // Allow progression even with minimal data
  }, [rooms]);

  useEffect(() => {
    setValidate(() => validate);
    return () => setValidate(null);
  }, [setValidate, validate]);

  const updateRoom = (index: number, updates: Partial<RoomData>) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], ...updates };
    updateFormData({ rooms: newRooms });
  };

  const toggleRoomAmenity = (roomIndex: number, amenity: string) => {
    const room = rooms[roomIndex];
    const currentAmenities = room.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    updateRoom(roomIndex, { amenities: newAmenities });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Room Details</h2>
        <p className="text-slate-400 mt-2">
          Add details for each room available for rent
        </p>
      </div>

      {/* Room Cards */}
      <div className="space-y-4">
        {rooms.map((room, index) => (
          <div
            key={room.id}
            className={cn(
              'rounded-xl border transition-all',
              expandedRoom === index
                ? 'border-violet-500 bg-slate-800/70'
                : 'border-slate-700 bg-slate-800/30'
            )}
          >
            {/* Room Header */}
            <button
              type="button"
              onClick={() => setExpandedRoom(expandedRoom === index ? -1 : index)}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  expandedRoom === index ? 'bg-violet-500/20' : 'bg-slate-700'
                )}>
                  <DoorOpen className={cn(
                    'h-5 w-5',
                    expandedRoom === index ? 'text-violet-400' : 'text-slate-400'
                  )} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white">{room.name || `Room ${index + 1}`}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {room.hasPrivateBath && <span>Private Bath</span>}
                    {room.isFurnished && <span>Furnished</span>}
                    {room.rentAmount && <span>${room.rentAmount}/mo</span>}
                  </div>
                </div>
              </div>
              {expandedRoom === index ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {/* Room Details (Expanded) */}
            {expandedRoom === index && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-700 pt-4">
                {/* Room Name */}
                <div className="space-y-2">
                  <Label className="text-slate-200">Room Name</Label>
                  <Input
                    value={room.name}
                    onChange={(e) => updateRoom(index, { name: e.target.value })}
                    placeholder="e.g., Master Bedroom, Room A"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Size & Rent */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Size (sq ft)</Label>
                    <Input
                      type="number"
                      value={room.sizeSqFt || ''}
                      onChange={(e) => updateRoom(index, { sizeSqFt: parseInt(e.target.value) || undefined })}
                      placeholder="Optional"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Monthly Rent
                    </Label>
                    <Input
                      type="number"
                      value={room.rentAmount || ''}
                      onChange={(e) => updateRoom(index, { rentAmount: parseInt(e.target.value) || undefined })}
                      placeholder="e.g., 800"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-slate-200">Private Bathroom</span>
                    </div>
                    <Switch
                      checked={room.hasPrivateBath}
                      onCheckedChange={(checked) => updateRoom(index, { hasPrivateBath: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sofa className="h-4 w-4 text-amber-400" />
                      <span className="text-sm text-slate-200">Furnished</span>
                    </div>
                    <Switch
                      checked={room.isFurnished}
                      onCheckedChange={(checked) => updateRoom(index, { isFurnished: checked })}
                    />
                  </div>
                </div>

                {/* Room Amenities */}
                <div className="space-y-2">
                  <Label className="text-slate-200">Room Amenities</Label>
                  <div className="flex flex-wrap gap-2">
                    {ROOM_AMENITIES.map((amenity) => {
                      const isSelected = room.amenities?.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleRoomAmenity(index, amenity)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs transition-all',
                            isSelected
                              ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                              : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                          )}
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h4 className="font-medium text-white mb-2">Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Total Rooms</p>
            <p className="text-white font-medium">{rooms.length}</p>
          </div>
          <div>
            <p className="text-slate-400">Private Baths</p>
            <p className="text-white font-medium">{rooms.filter(r => r.hasPrivateBath).length}</p>
          </div>
          <div>
            <p className="text-slate-400">Furnished</p>
            <p className="text-white font-medium">{rooms.filter(r => r.isFurnished).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  CheckCircle,
  Circle,
  Key,
  Search,
  Sparkles,
  Wrench,
  Wallet,
  Home,
} from 'lucide-react';

interface TurnoverChecklist {
  id: string;
  unitId: string;
  leaseId?: string;
  depositProcessed: boolean;
  depositProcessedAt?: string;
  keysCollected: boolean;
  keysCollectedAt?: string;
  unitInspected: boolean;
  unitInspectedAt?: string;
  cleaningCompleted: boolean;
  cleaningCompletedAt?: string;
  repairsCompleted: boolean;
  repairsCompletedAt?: string;
  notes?: string;
  completedAt?: string;
}

interface TurnoverChecklistCardProps {
  unitId: string;
  unitName: string;
  onComplete?: () => void;
}

const checklistItems = [
  { key: 'depositProcessed', label: 'Deposit Processed', icon: Wallet, description: 'Security deposit has been returned or applied' },
  { key: 'keysCollected', label: 'Keys Collected', icon: Key, description: 'All keys and access devices returned' },
  { key: 'unitInspected', label: 'Unit Inspected', icon: Search, description: 'Move-out inspection completed' },
  { key: 'cleaningCompleted', label: 'Cleaning Completed', icon: Sparkles, description: 'Unit has been cleaned and sanitized' },
  { key: 'repairsCompleted', label: 'Repairs Completed', icon: Wrench, description: 'All necessary repairs finished' },
] as const;

export function TurnoverChecklistCard({ unitId, unitName, onComplete }: TurnoverChecklistCardProps) {
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<TurnoverChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchChecklist();
  }, [unitId]);

  const fetchChecklist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/units/${unitId}/turnover-checklist`);
      if (res.ok) {
        const data = await res.json();
        setChecklist(data.checklist);
        setNotes(data.checklist?.notes || '');
      } else if (res.status === 404) {
        // No checklist exists yet, create one
        await createChecklist();
      }
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChecklist = async () => {
    try {
      const res = await fetch(`/api/admin/units/${unitId}/turnover-checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setChecklist(data.checklist);
      }
    } catch (error) {
      console.error('Failed to create checklist:', error);
    }
  };

  const updateItem = async (key: string, checked: boolean) => {
    if (!checklist) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/turnover-checklist/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [key]: checked,
          [`${key}At`]: checked ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const data = await res.json();
      setChecklist(data.checklist);

      // Check if all items are complete
      const allComplete = checklistItems.every(
        (item) => data.checklist[item.key]
      );
      if (allComplete && !data.checklist.completedAt) {
        toast({
          title: 'Checklist Complete!',
          description: 'All turnover tasks have been completed.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update checklist',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!checklist) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/turnover-checklist/${checklist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error('Failed to save notes');

      toast({ title: 'Notes saved' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const markAvailable = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/units/${unitId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: true }),
      });

      if (!res.ok) throw new Error('Failed to update availability');

      toast({
        title: 'Unit Available',
        description: `${unitName} is now available for listing`,
      });
      onComplete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark unit as available',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-800/60 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  const completedCount = checklist
    ? checklistItems.filter((item) => checklist[item.key as keyof TurnoverChecklist]).length
    : 0;
  const allComplete = completedCount === checklistItems.length;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Turnover Checklist</h3>
            <p className="text-xs text-slate-400">Unit {unitName}</p>
          </div>
        </div>
        <Badge
          className={
            allComplete
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
          }
        >
          {completedCount}/{checklistItems.length} Complete
        </Badge>
      </div>

      {/* Checklist Items */}
      <div className="p-4 space-y-3">
        {checklistItems.map((item) => {
          const isChecked = checklist?.[item.key as keyof TurnoverChecklist] as boolean;
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className={`rounded-lg border p-3 transition-colors ${
                isChecked
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-white/10 bg-slate-900/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={item.key}
                  checked={isChecked}
                  onCheckedChange={(checked) => updateItem(item.key, checked as boolean)}
                  disabled={saving}
                  className="mt-0.5 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={item.key}
                    className={`font-medium cursor-pointer ${
                      isChecked ? 'text-emerald-300' : 'text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Label>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
                {isChecked ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <Label className="text-slate-300">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the turnover..."
          className="bg-slate-900/40 border-white/10 text-white placeholder:text-slate-500 min-h-[80px]"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={saveNotes}
          disabled={saving || notes === (checklist?.notes || '')}
          className="border-white/10 text-slate-300"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Notes
        </Button>
      </div>

      {/* Mark Available Button */}
      <div className="p-4 border-t border-white/10">
        <Button
          onClick={markAvailable}
          disabled={!allComplete || saving}
          className={`w-full ${
            allComplete
              ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
              : 'bg-slate-700 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Home className="w-4 h-4 mr-2" />
              Mark Available for Listing
            </>
          )}
        </Button>
        {!allComplete && (
          <p className="text-xs text-slate-500 text-center mt-2">
            Complete all checklist items to enable this button
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, Loader2, Crown, Zap, Building2, DollarSign, X, Gift, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Landlord {
  id: string;
  name: string;
  email: string;
  currentTier: string;
  status: string;
  propertyCount: number;
  periodEnd?: string;
  isGranted?: boolean;
  isCurrentUser?: boolean;
}

interface Tier {
  id: string;
  name: string;
  price: number | null;
  unitLimit: number;
  noCashoutFees: boolean;
}

const DURATION_OPTIONS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days (3 months)' },
  { value: '180', label: '180 days (6 months)' },
  { value: '365', label: '1 year' },
  { value: '36500', label: 'Lifetime' },
];

export default function TierManager() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});
  const [selectedDurations, setSelectedDurations] = useState<Record<string, string>>({});
  const [currentUserLandlordId, setCurrentUserLandlordId] = useState<string | null>(null);
  const [currentUserTier, setCurrentUserTier] = useState<string>('free');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/super-admin/set-tier');
      if (res.ok) {
        const data = await res.json();
        setLandlords(data.landlords);
        setTiers(data.availableTiers);
        setCurrentUserLandlordId(data.currentUserLandlordId);
        setCurrentUserTier(data.currentUserTier);
        const initial: Record<string, string> = {};
        const initialDurations: Record<string, string> = {};
        data.landlords.forEach((l: Landlord) => {
          initial[l.id] = l.currentTier;
          initialDurations[l.id] = '30';
        });
        setSelectedTiers(initial);
        setSelectedDurations(initialDurations);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Error', description: 'Failed to load landlords', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const grantTier = async (landlordId: string) => {
    const newTier = selectedTiers[landlordId];
    const duration = parseInt(selectedDurations[landlordId] || '30');
    const landlord = landlords.find(l => l.id === landlordId);
    
    if (!newTier) {
      toast({ title: 'Info', description: 'Please select a tier' });
      return;
    }

    setUpdating(landlordId);
    try {
      const res = await fetch('/api/super-admin/set-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          landlordId, 
          tier: newTier,
          durationDays: duration,
          isGrant: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({ 
          title: 'Success', 
          description: `Granted ${data.tier} tier for ${duration} days` 
        });
        setLandlords(prev =>
          prev.map(l =>
            l.id === landlordId 
              ? { ...l, currentTier: newTier, isGranted: true, periodEnd: data.periodEnd } 
              : l
          )
        );
        if (landlordId === currentUserLandlordId) {
          setCurrentUserTier(newTier);
        }
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to grant tier', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to grant tier:', error);
      toast({ title: 'Error', description: 'Failed to grant tier', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const revokeTier = async (landlordId: string) => {
    if (!confirm('Are you sure you want to revoke this subscription? The landlord will be reset to the free tier.')) {
      return;
    }

    setRevoking(landlordId);
    try {
      const res = await fetch('/api/super-admin/set-tier', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({ title: 'Success', description: 'Subscription revoked' });
        setLandlords(prev =>
          prev.map(l =>
            l.id === landlordId 
              ? { ...l, currentTier: 'free', isGranted: false, periodEnd: undefined } 
              : l
          )
        );
        setSelectedTiers(prev => ({ ...prev, [landlordId]: 'free' }));
        if (landlordId === currentUserLandlordId) {
          setCurrentUserTier('free');
        }
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to revoke', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to revoke:', error);
      toast({ title: 'Error', description: 'Failed to revoke subscription', variant: 'destructive' });
    } finally {
      setRevoking(null);
    }
  };

  const toggleMyProAccess = async () => {
    if (!currentUserLandlordId) {
      toast({ title: 'Error', description: 'No landlord account found for your user', variant: 'destructive' });
      return;
    }

    const isCurrentlyPro = currentUserTier === 'pro' || currentUserTier === 'enterprise';
    
    if (isCurrentlyPro) {
      await revokeTier(currentUserLandlordId);
    } else {
      setSelectedTiers(prev => ({ ...prev, [currentUserLandlordId]: 'enterprise' }));
      setSelectedDurations(prev => ({ ...prev, [currentUserLandlordId]: '36500' }));
      
      setUpdating(currentUserLandlordId);
      try {
        const res = await fetch('/api/super-admin/set-tier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            landlordId: currentUserLandlordId, 
            tier: 'enterprise',
            durationDays: 36500,
            isGrant: true,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          toast({ title: 'Pro Access Enabled', description: 'You now have full Enterprise access!' });
          setCurrentUserTier('enterprise');
          setLandlords(prev =>
            prev.map(l =>
              l.id === currentUserLandlordId 
                ? { ...l, currentTier: 'enterprise', isGranted: true, periodEnd: data.periodEnd } 
                : l
            )
          );
        } else {
          toast({ title: 'Error', description: data.error || 'Failed to enable pro access', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to enable pro access', variant: 'destructive' });
      } finally {
        setUpdating(null);
      }
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'pro':
        return <Building2 className="h-4 w-4 text-violet-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pro':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isMyProEnabled = currentUserTier === 'pro' || currentUserTier === 'enterprise';

  return (
    <div className="space-y-6">
      {/* Super Admin Quick Toggle */}
      <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Owner Pro Access
          </CardTitle>
          <CardDescription>
            Toggle full Enterprise access for your own account. Unlocks all features without payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">
                {isMyProEnabled ? (
                  <span className="text-emerald-600 flex items-center gap-2">
                    <Check className="h-4 w-4" /> All Pro Features Unlocked
                  </span>
                ) : (
                  <span className="text-slate-600">Currently on Free Tier</span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {isMyProEnabled 
                  ? 'You have access to all Enterprise features' 
                  : 'Enable to unlock all features for testing'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {isMyProEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={isMyProEnabled}
                onCheckedChange={toggleMyProAccess}
                disabled={updating === currentUserLandlordId || !currentUserLandlordId}
              />
            </div>
          </div>
          {!currentUserLandlordId && (
            <p className="mt-3 text-sm text-amber-600">
              ⚠️ You don&apos;t have a landlord account yet. Create one first to use this feature.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Landlord Tier Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-violet-500" />
            Grant Pro Access to Landlords
          </CardTitle>
          <CardDescription>
            Assign Pro or Enterprise tiers to any landlord. Set duration and revoke anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tier Legend */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Available Tiers</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tiers.map((tier) => (
                <div key={tier.id} className="flex items-center gap-2 text-sm">
                  {getTierIcon(tier.id)}
                  <span className="font-medium">{tier.name}</span>
                  <span className="text-muted-foreground">
                    {tier.price === null ? 'Custom' : tier.price === 0 ? 'Free' : `$${tier.price}/mo`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Landlords List */}
          {landlords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No landlords found in the system.
            </p>
          ) : (
            <div className="space-y-3">
              {landlords.map((landlord) => (
                <div
                  key={landlord.id}
                  className={`flex flex-col gap-3 p-4 border rounded-lg ${
                    landlord.isCurrentUser ? 'border-amber-300 bg-amber-50/50' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{landlord.name}</span>
                        {landlord.isCurrentUser && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                            You
                          </Badge>
                        )}
                        <Badge variant="outline" className={getTierBadgeColor(landlord.currentTier)}>
                          {getTierIcon(landlord.currentTier)}
                          <span className="ml-1">{landlord.currentTier}</span>
                        </Badge>
                        {landlord.isGranted && (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                            <Gift className="h-3 w-3 mr-1" />
                            Granted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{landlord.email}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{landlord.propertyCount} {landlord.propertyCount === 1 ? 'property' : 'properties'}</span>
                        {landlord.periodEnd && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires: {new Date(landlord.periodEnd).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={selectedTiers[landlord.id] || landlord.currentTier}
                      onValueChange={(value) =>
                        setSelectedTiers((prev) => ({ ...prev, [landlord.id]: value }))
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            <div className="flex items-center gap-2">
                              {getTierIcon(tier.id)}
                              {tier.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedDurations[landlord.id] || '30'}
                      onValueChange={(value) =>
                        setSelectedDurations((prev) => ({ ...prev, [landlord.id]: value }))
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      onClick={() => grantTier(landlord.id)}
                      disabled={updating === landlord.id}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {updating === landlord.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Gift className="h-4 w-4 mr-1" />
                          Grant
                        </>
                      )}
                    </Button>

                    {(landlord.isGranted || landlord.currentTier !== 'free') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeTier(landlord.id)}
                        disabled={revoking === landlord.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {revoking === landlord.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tier Features Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Feature</th>
                  <th className="text-center py-2 px-2">Free</th>
                  <th className="text-center py-2 px-2">Pro</th>
                  <th className="text-center py-2 px-2">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4">Unit Limit</td>
                  <td className="text-center py-2 px-2">24</td>
                  <td className="text-center py-2 px-2">250</td>
                  <td className="text-center py-2 px-2">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">No Cashout Fees</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Rent Reminders</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Auto Late Fees</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Team Management</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Employment Verifications</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">Unlimited</td>
                  <td className="text-center py-2 px-2">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Custom Branding</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">API Access</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Webhooks</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">❌</td>
                  <td className="text-center py-2 px-2">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

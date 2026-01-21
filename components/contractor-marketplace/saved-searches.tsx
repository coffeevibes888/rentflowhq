'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  MoreVertical,
  Plus,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

interface SavedSearchesProps {
  searches: any[];
  onSearchSelect: (criteria: any) => void;
}

export function SavedSearches({ searches: initialSearches, onSearchSelect }: SavedSearchesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searches, setSearches] = useState(initialSearches);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState<any>(null);

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for this search',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: searchName,
          criteria: currentCriteria,
          emailAlerts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save search');
      }

      const data = await response.json();

      toast({
        title: 'Search Saved!',
        description: emailAlerts
          ? 'You\'ll receive email alerts when new contractors match'
          : 'Your search has been saved',
      });

      setSearches([data.savedSearch, ...searches]);
      setSaveDialogOpen(false);
      setSearchName('');
      setEmailAlerts(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save search',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    try {
      const response = await fetch(`/api/saved-searches/${searchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete search');
      }

      setSearches(searches.filter((s) => s.id !== searchId));
      toast({
        title: 'Search Deleted',
        description: 'Your saved search has been removed',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete search',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAlerts = async (searchId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/saved-searches/${searchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailAlerts: enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update alerts');
      }

      setSearches(
        searches.map((s) =>
          s.id === searchId ? { ...s, emailAlerts: enabled } : s
        )
      );

      toast({
        title: enabled ? 'Alerts Enabled' : 'Alerts Disabled',
        description: enabled
          ? 'You\'ll receive email notifications for this search'
          : 'Email notifications have been disabled',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update alerts',
        variant: 'destructive',
      });
    }
  };

  const openSaveDialog = (criteria: any) => {
    setCurrentCriteria(criteria);
    setSaveDialogOpen(true);
  };

  const getCriteriaDescription = (criteria: any) => {
    const parts = [];
    if (criteria.query) parts.push(`"${criteria.query}"`);
    if (criteria.location) parts.push(criteria.location);
    if (criteria.serviceTypes?.length > 0) {
      parts.push(`${criteria.serviceTypes.length} services`);
    }
    if (criteria.minRating > 0) parts.push(`${criteria.minRating}+ stars`);
    if (criteria.verified) parts.push('Verified');
    return parts.join(' • ') || 'All contractors';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Saved Searches
            </CardTitle>
            <Button
              size="sm"
              onClick={() => openSaveDialog({})}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-1" />
              Save Current
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {searches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No saved searches yet</p>
              <p className="text-xs mt-1">
                Save your search criteria for quick access later
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSearchSelect(search.criteria)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{search.name}</h4>
                      {search.emailAlerts && (
                        <Badge variant="secondary" className="text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          Alerts On
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getCriteriaDescription(search.criteria)}
                    </p>
                    {search.resultCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {search.resultCount} contractors found
                      </p>
                    )}
                    {search.lastViewed && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Last viewed {format(new Date(search.lastViewed), 'MMM d')}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleAlerts(search.id, !search.emailAlerts)
                        }
                      >
                        {search.emailAlerts ? (
                          <>
                            <BellOff className="h-4 w-4 mr-2" />
                            Disable Alerts
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Enable Alerts
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteSearch(search.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save your current search criteria for quick access later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="searchName">Search Name *</Label>
              <Input
                id="searchName"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Plumbers in Seattle"
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new contractors match this search
                </p>
              </div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Search'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

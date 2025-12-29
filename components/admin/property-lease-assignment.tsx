'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, AlertCircle, Settings2 } from 'lucide-react';
import LeaseSelectionModal from './lease-selection-modal';
import { useRouter } from 'next/navigation';

interface PropertyLeaseAssignmentProps {
  propertyId: string;
  propertyName: string;
  currentLease: {
    id: string;
    name: string;
    isFieldsConfigured: boolean;
  } | null;
}

export default function PropertyLeaseAssignment({
  propertyId,
  propertyName,
  currentLease,
}: PropertyLeaseAssignmentProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleComplete = () => {
    setShowModal(false);
    router.refresh();
  };

  return (
    <>
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            Lease Template
          </CardTitle>
          <CardDescription className="text-slate-400">
            The lease template used when creating leases for tenants in this property
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentLease ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{currentLease.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {currentLease.isFieldsConfigured ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ready to Use
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Needs Configuration
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
                className="border-white/20 text-slate-300 hover:bg-white/10"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Change
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-white">No Lease Template Assigned</p>
                  <p className="text-sm text-slate-400">
                    Assign a lease template to enable digital lease signing
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Assign Lease
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <LeaseSelectionModal
        open={showModal}
        onOpenChange={setShowModal}
        propertyId={propertyId}
        propertyName={propertyName}
        onComplete={handleComplete}
      />
    </>
  );
}

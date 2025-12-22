'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileCheck, Upload, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VerificationWizard } from '@/components/tenant/verification-wizard';

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  propertySlug: string | null;
  createdAt: string;
  unit: {
    name: string;
    property: {
      name: string;
      address: any;
    } | null;
  } | null;
  verification: {
    identityStatus: string;
    employmentStatus: string;
    overallStatus: string;
  } | null;
}

interface ApplicationsClientProps {
  applications: Application[];
}

export function ApplicationsClient({ applications }: ApplicationsClientProps) {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Find application that needs verification
  const pendingVerificationApp = applications.find(
    app => app.verification && 
    (app.verification.identityStatus === 'pending' || app.verification.employmentStatus === 'pending') &&
    app.verification.overallStatus !== 'complete'
  );

  // If showing verification wizard
  if (selectedAppId) {
    return (
      <div className="w-full">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedAppId(null)}
          className="mb-4"
        >
          ← Back to Applications
        </Button>
        <VerificationWizard
          applicationId={selectedAppId}
          onComplete={() => {
            setSelectedAppId(null);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  const getVerificationProgress = (verification?: Application['verification']) => {
    if (!verification) return 0;
    let progress = 0;
    if (verification.identityStatus === 'verified') progress += 50;
    if (verification.employmentStatus === 'verified') progress += 50;
    return progress;
  };

  return (
    <main className="w-full px-4 py-8 md:px-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-1">My Rental Applications</h1>
          <p className="text-sm text-slate-600">
            Track the status of your applications and complete verification.
          </p>
        </div>

        {/* Pending Verification Alert */}
        {pendingVerificationApp && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-amber-100">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 mb-1">Action Required: Complete Verification</h3>
                  <p className="text-sm text-amber-700 mb-4">
                    Your application for {pendingVerificationApp.unit?.property?.name || pendingVerificationApp.propertySlug || 'a property'} requires identity and income verification before it can be reviewed.
                  </p>
                  <Button 
                    onClick={() => setSelectedAppId(pendingVerificationApp.id)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Complete Verification
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Applications Yet</h3>
              <p className="text-sm text-slate-500 mb-4">
                You haven't submitted any rental applications.
              </p>
              <Link href="/">
                <Button>Browse Properties</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const progress = getVerificationProgress(app.verification);
              const needsVerification = app.verification && 
                (app.verification.identityStatus === 'pending' || app.verification.employmentStatus === 'pending');
              
              return (
                <Card key={app.id} className={needsVerification ? 'border-amber-200' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {app.unit?.property?.name || app.propertySlug || 'Property Application'}
                        </CardTitle>
                        <CardDescription>
                          {app.unit?.property?.address && typeof app.unit.property.address === 'object' && (
                            <span>
                              {(app.unit.property.address as any).street}, {(app.unit.property.address as any).city}, {(app.unit.property.address as any).state}
                            </span>
                          )}
                          {!app.unit?.property?.address && app.propertySlug && (
                            <span>Property: {app.propertySlug}</span>
                          )}
                        </CardDescription>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Verification Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Verification Progress</span>
                          <span className="text-sm text-slate-500">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Verification Steps */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg border ${
                          app.verification?.identityStatus === 'verified' 
                            ? 'bg-green-50 border-green-200' 
                            : app.verification?.identityStatus === 'rejected'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {app.verification?.identityStatus === 'verified' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : app.verification?.identityStatus === 'rejected' ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-600" />
                            )}
                            <span className="text-sm font-medium">ID Verification</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {app.verification?.identityStatus === 'verified' 
                              ? 'Identity verified' 
                              : app.verification?.identityStatus === 'rejected'
                              ? 'Verification failed'
                              : 'Upload government ID'}
                          </p>
                        </div>

                        <div className={`p-3 rounded-lg border ${
                          app.verification?.employmentStatus === 'verified' 
                            ? 'bg-green-50 border-green-200' 
                            : app.verification?.employmentStatus === 'rejected'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {app.verification?.employmentStatus === 'verified' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : app.verification?.employmentStatus === 'rejected' ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-600" />
                            )}
                            <span className="text-sm font-medium">Income Verification</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {app.verification?.employmentStatus === 'verified' 
                              ? 'Income verified' 
                              : app.verification?.employmentStatus === 'rejected'
                              ? 'Verification failed'
                              : 'Upload pay stubs or tax docs'}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      {needsVerification && (
                        <Button 
                          onClick={() => setSelectedAppId(app.id)}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Verification Documents
                        </Button>
                      )}

                      {/* Submitted Date */}
                      <p className="text-xs text-slate-400">
                        Submitted on {new Date(app.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

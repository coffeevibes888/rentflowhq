'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileCheck, Upload, CheckCircle2, Clock, AlertCircle, ArrowRight, Home, User, Sparkles } from 'lucide-react';
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
  const router = useRouter();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [justCompletedVerification, setJustCompletedVerification] = useState(false);

  // Check if any application has documents uploaded (even if not verified yet)
  const hasUploadedDocuments = (app: Application) => {
    if (!app.verification) return false;
    // If identity or employment status is not 'pending', documents have been uploaded
    return app.verification.identityStatus !== 'pending' || 
           app.verification.employmentStatus !== 'pending' ||
           app.verification.overallStatus === 'documents_submitted' ||
           app.verification.overallStatus === 'complete';
  };

  // Find application that needs verification (no documents uploaded yet)
  const pendingVerificationApp = applications.find(
    app => app.verification && 
    app.verification.identityStatus === 'pending' && 
    app.verification.employmentStatus === 'pending' &&
    app.verification.overallStatus !== 'complete' &&
    app.verification.overallStatus !== 'documents_submitted'
  );

  // Find applications with documents submitted but awaiting review
  const awaitingReviewApps = applications.filter(
    app => app.verification && 
    (app.verification.identityStatus !== 'pending' || app.verification.employmentStatus !== 'pending') &&
    app.verification.overallStatus !== 'complete' &&
    app.status === 'pending'
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
            setJustCompletedVerification(true);
          }}
        />
      </div>
    );
  }

  // Show success state after completing verification
  if (justCompletedVerification) {
    return (
      <main className="w-full px-4 py-8 md:px-0">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">
                    Documents Submitted Successfully! 🎉
                  </h2>
                  <p className="text-green-700">
                    Your verification documents have been uploaded and are now being reviewed by the landlord.
                  </p>
                </div>

                <div className="bg-white/60 rounded-lg p-4 text-left space-y-2">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    What happens next?
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• The landlord will review your documents within 1-2 business days</li>
                    <li>• You'll receive a notification when your application is approved</li>
                    <li>• Once approved, you can sign your lease digitally</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    While you wait...
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Complete your tenant profile to speed up the move-in process once you're approved!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/user/profile" className="flex-1">
                      <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                        <User className="w-4 h-4 mr-2" />
                        Complete Profile
                      </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                        <Home className="w-4 h-4 mr-2" />
                        Browse More Properties
                      </Button>
                    </Link>
                  </div>
                </div>

                <Button 
                  onClick={() => setJustCompletedVerification(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  View My Applications
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const getVerificationProgress = (verification?: Application['verification']) => {
    if (!verification) return 0;
    let progress = 0;
    // Give partial credit for uploaded (even if not verified)
    if (verification.identityStatus !== 'pending') progress += 25;
    if (verification.identityStatus === 'verified') progress += 25;
    if (verification.employmentStatus !== 'pending') progress += 25;
    if (verification.employmentStatus === 'verified') progress += 25;
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

        {/* Pending Verification Alert - Only show if NO documents uploaded yet */}
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

        {/* Awaiting Review Banner - Show when documents are uploaded but not yet verified */}
        {awaitingReviewApps.length > 0 && !pendingVerificationApp && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">Documents Under Review</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Your verification documents have been submitted and are being reviewed by the landlord. 
                    You'll be notified once your application is approved.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/user/profile">
                      <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        <User className="w-4 h-4 mr-2" />
                        Complete Your Profile
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                        <Home className="w-4 h-4 mr-2" />
                        Browse Properties
                      </Button>
                    </Link>
                  </div>
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
              const documentsUploaded = hasUploadedDocuments(app);
              const needsVerification = app.verification && 
                app.verification.identityStatus === 'pending' && 
                app.verification.employmentStatus === 'pending' &&
                !documentsUploaded;
              const awaitingReview = documentsUploaded && 
                app.verification?.overallStatus !== 'complete' &&
                app.status === 'pending';
              
              return (
                <Card key={app.id} className={needsVerification ? 'border-amber-200' : awaitingReview ? 'border-blue-200' : ''}>
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
                        awaitingReview ? 'bg-blue-100 text-blue-800' :
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status === 'approved' ? 'Approved' :
                         app.status === 'rejected' ? 'Rejected' :
                         awaitingReview ? 'Under Review' :
                         app.status.charAt(0).toUpperCase() + app.status.slice(1)}
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
                            : app.verification?.identityStatus !== 'pending'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {app.verification?.identityStatus === 'verified' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : app.verification?.identityStatus === 'rejected' ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : app.verification?.identityStatus !== 'pending' ? (
                              <Clock className="h-4 w-4 text-blue-600" />
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
                              : app.verification?.identityStatus !== 'pending'
                              ? 'Uploaded - Under review'
                              : 'Upload government ID'}
                          </p>
                        </div>

                        <div className={`p-3 rounded-lg border ${
                          app.verification?.employmentStatus === 'verified' 
                            ? 'bg-green-50 border-green-200' 
                            : app.verification?.employmentStatus === 'rejected'
                            ? 'bg-red-50 border-red-200'
                            : app.verification?.employmentStatus !== 'pending'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {app.verification?.employmentStatus === 'verified' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : app.verification?.employmentStatus === 'rejected' ? (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            ) : app.verification?.employmentStatus !== 'pending' ? (
                              <Clock className="h-4 w-4 text-blue-600" />
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
                              : app.verification?.employmentStatus !== 'pending'
                              ? 'Uploaded - Under review'
                              : 'Upload pay stubs or tax docs'}
                          </p>
                        </div>
                      </div>

                      {/* Action Button - Only show if no documents uploaded */}
                      {needsVerification && (
                        <Button 
                          onClick={() => setSelectedAppId(app.id)}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Verification Documents
                        </Button>
                      )}

                      {/* Awaiting Review Message */}
                      {awaitingReview && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-blue-700">
                            <Clock className="inline w-4 h-4 mr-1" />
                            Documents submitted - Awaiting landlord review
                          </p>
                        </div>
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

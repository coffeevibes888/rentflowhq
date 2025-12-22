'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Upload, FileCheck, CheckCircle2, Lock, Eye, AlertCircle, ArrowLeft, ArrowRight, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DocumentUploadWidget } from './document-upload-widget';

interface VerificationWizardProps {
  applicationId: string;
  onComplete?: () => void;
}

interface VerificationStatus {
  identityStatus: string;
  employmentStatus: string;
  overallStatus: string;
  canSubmit: boolean;
  requiredDocuments: {
    identity: { count: number; verified: boolean; requiredCount: number };
    employment: { count: number; verified: boolean; requiredCount: number };
  };
  monthlyIncome?: number;
}

type Step = 'welcome' | 'identity' | 'employment' | 'complete';

export function VerificationWizard({ applicationId, onComplete }: VerificationWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Fetch verification status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/verification/status`);
      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data);
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
    }
    return null;
  }, [applicationId]);

  // Initial load - determine starting step based on status
  useEffect(() => {
    const initializeWizard = async () => {
      setLoading(true);
      const status = await fetchStatus();
      
      if (status) {
        // Determine which step to show based on current status
        if (status.overallStatus === 'complete' || status.canSubmit) {
          setCurrentStep('complete');
        } else if (status.requiredDocuments.identity.verified) {
          setCurrentStep('employment');
        } else if (status.requiredDocuments.identity.count > 0) {
          // ID uploaded but not verified yet - stay on identity step
          setCurrentStep('identity');
        }
      }
      
      setLoading(false);
    };

    initializeWizard();
  }, [applicationId, fetchStatus]);

  const handleDocumentUploaded = async () => {
    setUploadSuccess(true);
    const status = await fetchStatus();
    
    // Auto-advance to next step after successful upload
    if (status) {
      if (currentStep === 'identity' && status.requiredDocuments.identity.count > 0) {
        // Wait a moment then advance to employment
        setTimeout(() => {
          setCurrentStep('employment');
          setUploadSuccess(false);
        }, 1500);
      } else if (currentStep === 'employment' && status.requiredDocuments.employment.count >= 3) {
        // All employment docs uploaded
        setTimeout(() => {
          if (status.canSubmit) {
            setCurrentStep('complete');
          }
          setUploadSuccess(false);
        }, 1500);
      } else {
        setTimeout(() => setUploadSuccess(false), 1500);
      }
    }
  };

  const getProgress = (): number => {
    if (!verificationStatus) return 0;
    
    let progress = 0;
    
    // Welcome = 0%
    // Identity uploaded = 33%
    // Identity verified = 50%
    // Employment docs uploaded = 75%
    // Complete = 100%
    
    if (verificationStatus.requiredDocuments.identity.count > 0) progress = 33;
    if (verificationStatus.requiredDocuments.identity.verified) progress = 50;
    if (verificationStatus.requiredDocuments.employment.count >= 3) progress = 75;
    if (verificationStatus.requiredDocuments.employment.verified) progress = 90;
    if (verificationStatus.canSubmit || verificationStatus.overallStatus === 'complete') progress = 100;
    
    return progress;
  };

  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'welcome': return 1;
      case 'identity': return 2;
      case 'employment': return 3;
      case 'complete': return 4;
      default: return 1;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {getStepNumber()} of 4
            </span>
            <span className="text-sm font-medium text-primary">
              {getProgress()}% Complete
            </span>
          </div>
          <Progress value={getProgress()} className="h-2" />
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            <div className={`flex flex-col items-center ${currentStep === 'welcome' ? 'text-primary' : getProgress() >= 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'welcome' ? 'bg-primary text-white' : getProgress() > 0 ? 'bg-green-600 text-white' : 'bg-muted'
              }`}>
                {getProgress() > 0 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-xs mt-1">Start</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep === 'identity' ? 'text-primary' : getProgress() >= 50 ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'identity' ? 'bg-primary text-white' : getProgress() >= 50 ? 'bg-green-600 text-white' : 'bg-muted'
              }`}>
                {getProgress() >= 50 ? <CheckCircle2 className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-xs mt-1">ID</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep === 'employment' ? 'text-primary' : getProgress() >= 90 ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'employment' ? 'bg-primary text-white' : getProgress() >= 90 ? 'bg-green-600 text-white' : 'bg-muted'
              }`}>
                {getProgress() >= 90 ? <CheckCircle2 className="w-5 h-5" /> : '3'}
              </div>
              <span className="text-xs mt-1">Income</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep === 'complete' ? 'text-primary' : getProgress() >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-muted'
              }`}>
                {getProgress() >= 100 ? <CheckCircle2 className="w-5 h-5" /> : '4'}
              </div>
              <span className="text-xs mt-1">Done</span>
            </div>
          </div>
        </div>

        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <Card className="p-8 sm:p-12">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Verify Your Identity & Income
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                To complete your rental application, we need to verify your identity and income. 
                This process is quick and secure.
              </p>

              {/* Privacy Info */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4 text-left">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Your Privacy & Security
                </h3>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p><strong className="text-foreground">Encrypted storage.</strong> All documents are stored with bank-level encryption.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p><strong className="text-foreground">Landlord access.</strong> Your landlord can view documents for lease management.</p>
                  </div>
                </div>
              </div>

              {/* What You'll Need */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  What You'll Need
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-2">Step 1: Government ID</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Driver's License</li>
                      <li>• State ID Card</li>
                      <li>• Passport</li>
                      <li>• Green Card</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-2">Step 2: Proof of Income</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• 3 recent pay stubs, OR</li>
                      <li>• 3 bank statements, OR</li>
                      <li>• W-2 / Tax return</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-6"
                onClick={() => setCurrentStep('identity')}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Identity Step */}
        {currentStep === 'identity' && (
          <Card className="p-8 sm:p-12">
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Step 1: Upload Your Government ID
                </h2>
                
                <p className="text-muted-foreground mb-4">
                  Upload a clear photo of your valid, government-issued photo ID
                </p>

                {/* Status indicator */}
                {verificationStatus && verificationStatus.requiredDocuments.identity.count > 0 && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${
                    verificationStatus.requiredDocuments.identity.verified 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {verificationStatus.requiredDocuments.identity.verified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        ID Verified
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        ID Uploaded - Processing
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Accepted Documents */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">✓ Accepted Documents:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <span>• Driver's License</span>
                  <span>• State ID Card</span>
                  <span>• U.S. Passport</span>
                  <span>• Green Card</span>
                  <span>• Military ID</span>
                  <span>• Passport Card</span>
                </div>
                <div className="mt-3 p-2 bg-red-100 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                    ⚠️ NOT accepted: Selfies, photos of yourself, screenshots, or unofficial documents
                  </p>
                </div>
              </div>

              {/* Upload Success Message */}
              {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">Document uploaded! Moving to next step...</p>
                </div>
              )}

              {/* Upload Widget */}
              {!verificationStatus?.requiredDocuments.identity.verified && (
                <DocumentUploadWidget
                  applicationId={applicationId}
                  category="identity"
                  docType="government_id"
                  onUploadComplete={handleDocumentUploaded}
                />
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setCurrentStep('welcome')}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>
                
                {(verificationStatus?.requiredDocuments.identity.count ?? 0) > 0 && (
                  <Button onClick={() => setCurrentStep('employment')}>
                    Continue to Income
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Employment Step */}
        {currentStep === 'employment' && (
          <Card className="p-8 sm:p-12">
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <FileCheck className="w-8 h-8 text-primary" />
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Step 2: Verify Your Income
                </h2>
                
                <p className="text-muted-foreground mb-4">
                  Upload 3 documents to verify your income
                </p>

                {/* Progress indicator */}
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium">
                  <FileCheck className="w-4 h-4" />
                  {verificationStatus?.requiredDocuments.employment.count || 0} of 3 documents uploaded
                </div>
              </div>

              {/* Document Options */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-semibold mb-3">Choose ONE of these options:</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                    <div>
                      <p className="font-medium">3 Recent Pay Stubs</p>
                      <p className="text-muted-foreground text-xs">From the last 90 days, showing employer and gross pay</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                    <div>
                      <p className="font-medium">3 Bank Statements</p>
                      <p className="text-muted-foreground text-xs">Consecutive months showing regular income deposits</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                    <div>
                      <p className="font-medium">Tax Documents</p>
                      <p className="text-muted-foreground text-xs">W-2, 1099, or tax return (first 2 pages)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Success Message */}
              {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-medium">Document uploaded successfully!</p>
                </div>
              )}

              {/* Upload Widget */}
              <DocumentUploadWidget
                applicationId={applicationId}
                category="employment"
                docType="income_document"
                onUploadComplete={handleDocumentUploaded}
                multiple
              />

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setCurrentStep('identity')}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to ID
                </Button>
                
                {(verificationStatus?.requiredDocuments.employment.count ?? 0) >= 3 && (
                  <Button onClick={() => setCurrentStep('complete')}>
                    Complete Verification
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <Card className="p-8 sm:p-12">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/20 mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-green-600">
                Verification Complete!
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your identity and income documents have been uploaded successfully. 
                The landlord will review your application shortly.
              </p>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ID Verification</span>
                  <span className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {verificationStatus?.identityStatus === 'verified' ? 'Verified' : 'Uploaded'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Income Documents</span>
                  <span className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {verificationStatus?.requiredDocuments.employment.count || 0} uploaded
                  </span>
                </div>
                {verificationStatus?.monthlyIncome && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Verified Monthly Income</span>
                    <span className="text-xl font-bold text-primary">
                      ${verificationStatus.monthlyIncome.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                size="lg" 
                className="w-full sm:w-auto text-lg px-8 py-6"
                onClick={onComplete}
              >
                Return to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

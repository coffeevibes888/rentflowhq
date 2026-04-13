'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Phone, Mail, Building2, Edit, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  insuranceExpiry: string | null;
  taxId: string | null;
  specialties: string[];
  status: string;
  paymentTerms: string;
  preferredPayment: string;
  notes: string | null;
  createdAt: string;
}

interface Assignment {
  id: string;
  jobId: string;
  jobTitle: string;
  jobNumber: string;
  scopeOfWork: string;
  agreedPrice: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export default function SubcontractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSubcontractor();
  }, [params.id]);

  const fetchSubcontractor = async () => {
    try {
      const res = await fetch(`/api/contractor/subcontractors/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setSubcontractor(data.subcontractor);
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching subcontractor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this subcontractor?')) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/contractor/subcontractors/${params.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({ title: 'Subcontractor deleted' });
        router.push('/contractor/subcontractors');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete subcontractor', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!subcontractor) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Subcontractor Not Found</h1>
        <p className="text-muted-foreground mb-4">The subcontractor you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/contractor/subcontractors">
          <Button>Back to Subcontractors</Button>
        </Link>
      </div>
    );
  }

  const insuranceExpiring = subcontractor.insuranceExpiry && 
    new Date(subcontractor.insuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/contractor/subcontractors">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{subcontractor.companyName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={subcontractor.status === 'active' ? 'default' : 'secondary'}>
                {subcontractor.status}
              </Badge>
              {insuranceExpiring && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Insurance Expiring Soon
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/contractor/subcontractors/${params.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Job Assignments ({assignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Contact Name</label>
                  <p className="font-medium">{subcontractor.contactName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${subcontractor.email}`} className="text-violet-600 hover:underline">
                    {subcontractor.email}
                  </a>
                </div>
                {subcontractor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${subcontractor.phone}`} className="text-violet-600 hover:underline">
                      {subcontractor.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>License & Insurance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subcontractor.licenseNumber && (
                  <div>
                    <label className="text-sm text-muted-foreground">License</label>
                    <p className="font-medium">
                      {subcontractor.licenseNumber} {subcontractor.licenseState && `(${subcontractor.licenseState})`}
                    </p>
                  </div>
                )}
                {subcontractor.insuranceExpiry && (
                  <div>
                    <label className="text-sm text-muted-foreground">Insurance Expires</label>
                    <p className={`font-medium ${insuranceExpiring ? 'text-red-600' : ''}`}>
                      {new Date(subcontractor.insuranceExpiry).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {subcontractor.taxId && (
                  <div>
                    <label className="text-sm text-muted-foreground">Tax ID</label>
                    <p className="font-medium">{subcontractor.taxId}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Payment Terms</label>
                  <p className="font-medium capitalize">{subcontractor.paymentTerms.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Preferred Payment</label>
                  <p className="font-medium capitalize">{subcontractor.preferredPayment}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {subcontractor.specialties?.map((specialty: string) => (
                    <Badge key={specialty} variant="outline">{specialty}</Badge>
                  ))}
                  {(!subcontractor.specialties || subcontractor.specialties.length === 0) && (
                    <p className="text-muted-foreground text-sm">No specialties listed</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {subcontractor.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{subcontractor.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Job Assignments</CardTitle>
              <Link href="/contractor/jobs">
                <Button size="sm" className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600">
                  Assign Crew
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No job assignments yet</p>
                  <p className="text-sm">Assign this subcontractor to jobs to track their work</p>
                </div>
              ) : (
                <div className="divide-y">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <Link href={`/contractor/jobs/${assignment.jobId}`}>
                          <h3 className="font-semibold hover:text-violet-600">{assignment.jobTitle}</h3>
                        </Link>
                        <Badge>{assignment.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{assignment.jobNumber}</p>
                      <p className="text-sm">{assignment.scopeOfWork}</p>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Price: ${assignment.agreedPrice.toLocaleString()}</span>
                        {assignment.startDate && (
                          <span>Start: {new Date(assignment.startDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

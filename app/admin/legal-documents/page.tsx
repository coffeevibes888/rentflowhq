'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Upload,
  FileText,
  Scale,
  Plus,
  Trash2,
  Eye,
  Download,
  PenTool,
  FileSignature,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LegalDocument {
  id: string;
  name: string;
  type: string;
  category: string | null;
  state: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSize: number | null;
  isTemplate: boolean;
  isActive: boolean;
  description: string | null;
  createdAt: string;
}

const DOCUMENT_TYPES = [
  { value: 'lease', label: 'Lease Agreement' },
  { value: 'addendum', label: 'Lease Addendum' },
  { value: 'disclosure', label: 'Disclosure Form' },
  { value: 'notice', label: 'Notice' },
  { value: 'move_in', label: 'Move-In Checklist' },
  { value: 'move_out', label: 'Move-Out Checklist' },
  { value: 'rules', label: 'Rules & Regulations' },
  { value: 'pet_agreement', label: 'Pet Agreement' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const STATE_TEMPLATES = [
  {
    state: 'NV',
    name: 'Nevada Standard Residential Lease',
    type: 'lease',
    description: 'Nevada-compliant residential lease agreement with all required disclosures.',
  },
  {
    state: 'NV',
    name: 'Nevada Lead-Based Paint Disclosure',
    type: 'disclosure',
    description: 'Required for properties built before 1978.',
  },
  {
    state: 'NV',
    name: 'Nevada Move-In/Move-Out Checklist',
    type: 'move_in',
    description: 'Document property condition at lease start and end.',
  },
  {
    state: 'CA',
    name: 'California Standard Residential Lease',
    type: 'lease',
    description: 'California-compliant lease with required disclosures and rent control provisions.',
  },
  {
    state: 'TX',
    name: 'Texas Standard Residential Lease',
    type: 'lease',
    description: 'Texas-compliant residential lease agreement.',
  },
  {
    state: 'AZ',
    name: 'Arizona Standard Residential Lease',
    type: 'lease',
    description: 'Arizona-compliant residential lease agreement.',
  },
];

export default function LegalDocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('');
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'lease',
    description: '',
    isTemplate: true,
    file: null as File | null,
  });

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/legal-documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
      }));
    }
  };

  const handleSeedDefaultLeaseTemplate = async () => {
    try {
      const res = await fetch('/api/legal-documents/seed-default-lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'NV' }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json?.message || 'Failed to seed default lease template');
        return;
      }

      await fetchDocuments();
      alert('Default DocuSign-ready lease template is available in My Documents.');
    } catch (error) {
      console.error('Failed to seed default lease template:', error);
      alert('Failed to seed default lease template');
    }
  };

  const handleSeedTestLease = async () => {
    try {
      const res = await fetch('/api/dev/seed-test-lease', {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json?.message || 'Failed to create test lease');
        return;
      }

      const data = json?.data;
      if (!data?.tenantEmail || !data?.tenantPassword || !data?.userLeaseUrl) {
        alert('Test lease created, but response was missing expected fields.');
        return;
      }

      alert(
        `Test tenant created!\n\nEmail: ${data.tenantEmail}\nPassword: ${data.tenantPassword}\n\nGo to: ${data.userLeaseUrl} (sign in as the tenant)\nAdmin lease: ${data.adminLeaseUrl}`
      );
    } catch (error) {
      console.error('Failed to seed test lease:', error);
      alert('Failed to create test lease');
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('name', uploadForm.name);
      formData.append('type', uploadForm.type);
      formData.append('description', uploadForm.description);
      formData.append('isTemplate', String(uploadForm.isTemplate));

      const res = await fetch('/api/legal-documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploadDialogOpen(false);
        setUploadForm({
          name: '',
          type: 'lease',
          description: '',
          isTemplate: true,
          file: null,
        });
        fetchDocuments();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/legal-documents/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleUseTemplate = async (template: typeof STATE_TEMPLATES[0]) => {
    try {
      const res = await fetch('/api/legal-documents/use-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          type: template.type,
          state: template.state,
          description: template.description,
        }),
      });

      if (res.ok) {
        fetchDocuments();
        alert('Template added to your documents!');
      }
    } catch (error) {
      console.error('Failed to use template:', error);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStateLabel = (code: string | null) => {
    if (!code) return null;
    return US_STATES.find(s => s.value === code)?.label || code;
  };

  const filteredTemplates = selectedState
    ? STATE_TEMPLATES.filter(t => t.state === selectedState)
    : STATE_TEMPLATES;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Scale className="h-6 w-6 text-violet-400" />
            Legal Documents
          </h1>
          <p className="text-black mt-1">
            Manage leases, disclosures, and legal templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {process.env.NODE_ENV !== 'production' && (
            <>
              <Button
                variant="outline"
                className="border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/10"
                onClick={handleSeedDefaultLeaseTemplate}
              >
                Add Default Lease
              </Button>
              <Button
                variant="outline"
                className="border-sky-400/30 text-sky-200 hover:bg-sky-500/10"
                onClick={handleSeedTestLease}
              >
                Create Test Lease
              </Button>
            </>
          )}

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Legal Document</DialogTitle>
              <DialogDescription className="text-slate-400">
                Upload a PDF or Word document to use as a template for leases and agreements.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Document File</Label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-violet-400/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {uploadForm.file ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{uploadForm.file.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-slate-400" />
                        <p className="text-sm text-slate-400">
                          Click to upload PDF or Word document
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Document Name</Label>
                <Input
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Standard Lease Agreement"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this document..."
                  className="bg-slate-800 border-slate-700 min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isTemplate"
                  checked={uploadForm.isTemplate}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, isTemplate: e.target.checked }))}
                  className="rounded border-slate-700"
                />
                <Label htmlFor="isTemplate" className="text-sm cursor-pointer">
                  Use as template for new leases
                </Label>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!uploadForm.file || !uploadForm.name || uploading}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Leasing defaults + legal settings (moved from Settings) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-gradient-to-r from-indigo-500 to-sky-500 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Leasing defaults</CardTitle>
            <CardDescription className="text-black">
              Set defaults you can reuse inside leases and templates.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-black">Default lease term (months)</Label>
              <Input placeholder="12" className="bg-transparent border-slate-700 hover:border-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-black">Billing day of month</Label>
              <Input placeholder="1" className="bg-transparent border-slate-700 hover:border-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-black">Late fee (%)</Label>
              <Input placeholder="5" className="bg-transparent border-slate-700 hover:border-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-black">Grace period (days)</Label>
              <Input placeholder="3" className="bg-transparent border-slate-700 hover:border-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-r from-indigo-500 to-sky-500 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Legal & notices</CardTitle>
            <CardDescription className="text-black font-semibold">
              Defaults to reuse in notices and tenant communications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-black font-semibold">Primary state / jurisdiction</Label>
              <Input placeholder="e.g. California" className="bg-transparent border-slate-700 hover:border-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-black font-semibold">Default notice footer</Label>
              <Textarea
                className="bg-transparent border-slate-700 min-h-[96px] hover:border-white"
                placeholder="Standard legal disclaimer or footer text to append to notices and communications."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DocuSign Setup Notice */}
      <Card className="border-amber-400/30 bg-amber-500/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-200">DocuSign Integration</h3>
              <p className="text-sm text-amber-200/80 mt-1">
                To enable electronic signatures, you&apos;ll need to set up DocuSign API integration.
                Once configured, tenants can sign documents directly from their dashboard or mobile device.
              </p>
              <a
                href="https://developers.docusign.com/docs/esign-rest-api/how-to/go-live/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200 mt-2"
              >
                DocuSign Setup Guide
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="my-documents" className="space-y-4">
        <TabsList className="bg-slate-800/50 border border-white/10">
          <TabsTrigger value="my-documents" className="data-[state=active]:bg-violet-600">
            My Documents
          </TabsTrigger>
          <TabsTrigger value="state-templates" className="data-[state=active]:bg-violet-600">
            State Templates
          </TabsTrigger>
        </TabsList>

        {/* My Documents Tab */}
        <TabsContent value="my-documents" className="space-y-4">
          {documents.length === 0 ? (
            <Card className="border-white/10 bg-slate-900/60">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Documents Yet</h3>
                  <p className="text-slate-400 mb-4">
                    Upload your lease agreements and legal documents to get started.
                  </p>
                  <Button
                    onClick={() => setUploadDialogOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="border-white/10 bg-slate-900/60 hover:border-violet-400/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <FileSignature className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-white">{doc.name}</CardTitle>
                          <CardDescription className="text-xs text-slate-400">
                            {getTypeLabel(doc.type)}
                            {doc.state && ` • ${getStateLabel(doc.state)}`}
                          </CardDescription>
                        </div>
                      </div>
                      {doc.isTemplate && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">
                          Template
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {doc.description && (
                      <p className="text-sm text-slate-400 line-clamp-2">{doc.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {doc.fileType && <span className="uppercase">{doc.fileType}</span>}
                      {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                      <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {doc.fileUrl && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-white/10 hover:bg-white/5"
                            onClick={() => window.open(doc.fileUrl!, '_blank')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-white/10 hover:bg-white/5"
                            asChild
                          >
                            <a href={doc.fileUrl} download>
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </a>
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-violet-400/30 text-violet-300 hover:bg-violet-500/10"
                        disabled={!doc.fileUrl}
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/leases/${doc.id}/docusign`, {
                              method: 'POST'
                            });
                            const json = await res.json();
                            if (res.ok && json.url) {
                              window.location.href = json.url;
                            } else {
                              alert(json?.message || 'Failed to initiate signing');
                            }
                          } catch (error) {
                            console.error('Signing failed:', error);
                            alert('Failed to initiate signing');
                          }
                        }}
                      >
                        <PenTool className="h-3 w-3 mr-1" />
                        E-Sign
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* State Templates Tab */}
        <TabsContent value="state-templates" className="space-y-4">
          <Card className="border-white/10 bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-400" />
                State-Specific Templates
              </CardTitle>
              <CardDescription className="text-slate-400">
                Use pre-made templates that comply with your state&apos;s landlord-tenant laws.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label className="text-slate-300 mb-2 block">Filter by State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full md:w-64 bg-slate-800 border-slate-700">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    <SelectItem value="">All States</SelectItem>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {filteredTemplates.map((template, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-lg border border-white/10 bg-slate-800/50 hover:border-violet-400/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white">{template.name}</h4>
                      <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                          {getStateLabel(template.state)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {getTypeLabel(template.type)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-violet-400/30 text-violet-300 hover:bg-violet-500/10 shrink-0"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No templates available for this state yet. More coming soon!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Upload,
  Plus,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Star,
  Building2,
  Receipt,
  Scale,
  AlertTriangle,
  FolderOpen,
  Search,
  Filter,
  Camera,
  Loader2,
  CheckCircle2,
  Clock,
  FileSignature,
  Wand2,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { LeaseBuilderModal } from '@/components/admin/lease-builder';

interface LegalDocument {
  id: string;
  name: string;
  type: string;
  category: string | null;
  state: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSize?: number;
  isTemplate: boolean;
  isActive: boolean;
  description: string | null;
  docusignTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ScannedDocument {
  id: string;
  originalFileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  ocrText: string | null;
  ocrConfidence?: number;
  ocrProcessedAt?: string;
  documentType: string | null;
  classificationStatus: string;
  classifiedAt?: string;
  extractedData: any;
  conversionStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  name: string;
  address: { city?: string; state?: string; street?: string; zipCode?: string } | null;
  amenities?: string[];
}

interface Unit {
  id: string;
  name: string;
  type: string;
  rentAmount: number;
  propertyId: string;
}

interface DocumentsClientProps {
  legalDocuments: LegalDocument[];
  scannedDocuments: ScannedDocument[];
  properties: Property[];
}

const DOCUMENT_TYPES = [
  { value: 'lease', label: 'Lease Agreement', icon: FileSignature },
  { value: 'addendum', label: 'Lease Addendum', icon: FileText },
  { value: 'eviction', label: 'Eviction Notice', icon: AlertTriangle },
  { value: 'disclosure', label: 'Disclosure Form', icon: Scale },
  { value: 'receipt', label: 'Receipt', icon: Receipt },
  { value: 'notice', label: 'Notice', icon: FileText },
  { value: 'move_in', label: 'Move-In Checklist', icon: FileText },
  { value: 'move_out', label: 'Move-Out Checklist', icon: FileText },
  { value: 'other', label: 'Other', icon: FolderOpen },
];

const SCANNED_CATEGORIES = [
  { value: 'lease', label: 'Lease' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'tax', label: 'Tax Document' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
];

export default function DocumentsClient({
  legalDocuments: initialLegalDocs,
  scannedDocuments: initialScannedDocs,
  properties,
}: DocumentsClientProps) {
  const { toast } = useToast();
  const [legalDocuments, setLegalDocuments] = useState(initialLegalDocs);
  const [scannedDocuments, setScannedDocuments] = useState(initialScannedDocs);
  const [activeTab, setActiveTab] = useState('leases');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'legal' | 'scan'>('legal');
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'lease',
    description: '',
    isTemplate: true,
    propertyId: '',
    file: null as File | null,
  });

  // Assign to property dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDocForAssign, setSelectedDocForAssign] = useState<LegalDocument | null>(null);
  const [assignPropertyId, setAssignPropertyId] = useState('');

  // Lease Builder state
  const [showLeaseBuilder, setShowLeaseBuilder] = useState(false);
  const [leaseBuilderProperty, setLeaseBuilderProperty] = useState<Property | null>(null);
  const [leaseBuilderUnit, setLeaseBuilderUnit] = useState<Unit | null>(null);
  const [selectPropertyDialogOpen, setSelectPropertyDialogOpen] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Fetch units for a property
  const fetchUnitsForProperty = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/properties?includeUnits=true`);
      if (res.ok) {
        const data = await res.json();
        const property = data.properties?.find((p: any) => p.id === propertyId);
        if (property?.units) {
          setUnits(property.units.map((u: any) => ({
            ...u,
            propertyId,
            rentAmount: Number(u.rentAmount),
          })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  };

  const handlePropertySelectForLease = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    setLeaseBuilderProperty(prop || null);
    setLeaseBuilderUnit(null);
    if (prop) {
      fetchUnitsForProperty(propertyId);
    }
  };

  const refreshDocuments = async () => {
    try {
      const res = await fetch('/api/legal-documents');
      if (res.ok) {
        const data = await res.json();
        setLegalDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTypeIcon = (type: string) => {
    const docType = DOCUMENT_TYPES.find((t) => t.value === type);
    return docType?.icon || FileText;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm((prev) => ({
        ...prev,
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
      }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);

      if (uploadType === 'legal') {
        formData.append('name', uploadForm.name);
        formData.append('type', uploadForm.type);
        formData.append('description', uploadForm.description);
        formData.append('isTemplate', String(uploadForm.isTemplate));
        if (uploadForm.propertyId) {
          formData.append('propertyId', uploadForm.propertyId);
        }

        const res = await fetch('/api/legal-documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setLegalDocuments((prev) => [data.document, ...prev]);
          toast({ title: 'Document uploaded successfully' });
        } else {
          const error = await res.json();
          toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
        }
      } else {
        // Scanned document upload
        formData.append('category', uploadForm.type);
        if (uploadForm.propertyId) {
          formData.append('propertyId', uploadForm.propertyId);
        }

        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.documents) {
            setScannedDocuments((prev) => [...data.documents, ...prev]);
          }
          toast({ title: 'Document uploaded for processing' });
        } else {
          toast({ title: 'Upload failed', variant: 'destructive' });
        }
      }

      setUploadDialogOpen(false);
      setUploadForm({
        name: '',
        type: 'lease',
        description: '',
        isTemplate: true,
        propertyId: '',
        file: null,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, type: 'legal' | 'scanned') => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const endpoint = type === 'legal' ? `/api/legal-documents/${id}` : `/api/documents/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });

      if (res.ok) {
        if (type === 'legal') {
          setLegalDocuments((prev) => prev.filter((d) => d.id !== id));
        } else {
          setScannedDocuments((prev) => prev.filter((d) => d.id !== id));
        }
        toast({ title: 'Document deleted' });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleSetDefault = async (docId: string, propertyId: string) => {
    try {
      const res = await fetch('/api/legal-documents/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, propertyId }),
      });

      if (res.ok) {
        toast({ title: 'Default lease set for property' });
        setAssignDialogOpen(false);
      } else {
        const error = await res.json();
        toast({ title: 'Failed to set default', description: error.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to set default', variant: 'destructive' });
    }
  };

  // Filter documents based on active tab and search
  const filteredLegalDocs = legalDocuments.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'leases') {
      return matchesSearch && (doc.type === 'lease' || doc.type === 'addendum');
    }
    if (activeTab === 'evictions') {
      return matchesSearch && doc.type === 'eviction';
    }
    if (activeTab === 'notices') {
      return matchesSearch && (doc.type === 'notice' || doc.type === 'disclosure');
    }
    return matchesSearch;
  });

  const filteredScannedDocs = scannedDocuments.filter((doc) => {
    const matchesSearch = doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType !== 'all') {
      return matchesSearch && doc.documentType === filterType;
    }
    return matchesSearch;
  });

  const openUploadDialog = (type: 'legal' | 'scan', docType?: string) => {
    setUploadType(type);
    if (docType) {
      setUploadForm((prev) => ({ ...prev, type: docType }));
    }
    setUploadDialogOpen(true);
  };

  return (
    <main className="w-full px-2 py-4 md:px-6 lg:px-8 md:py-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="h-5 w-5 md:h-7 md:w-7 text-violet-400" />
              Document Center
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Manage leases, evictions, receipts, and all property documents
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectPropertyDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
            >
              <Wand2 className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Create Custom Lease</span>
              <span className="sm:hidden">Create Lease</span>
            </Button>
            <Button
              onClick={() => openUploadDialog('legal')}
              className="bg-violet-600 hover:bg-violet-700 h-9 text-sm"
            >
              <Plus className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Upload Document</span>
              <span className="sm:hidden">Upload</span>
            </Button>
            <Button
              onClick={() => openUploadDialog('scan')}
              variant="outline"
              className="border-slate-700 hover:bg-slate-800 h-9 text-sm"
            >
              <Camera className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Scan & Categorize</span>
              <span className="sm:hidden">Scan</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 focus:border-violet-500 h-10"
            />
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-4">
          <TabsList className="bg-gradient-to-r from-indigo-700 to-indigo-900 border border-white/10 p-1 flex flex-wrap h-auto gap-1 w-full">
            <TabsTrigger
              value="leases"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 text-white"
            >
              <FileSignature className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Leases</span>
              <Badge variant="secondary" className="ml-0.5 md:ml-1 bg-white/10 text-[10px] md:text-xs px-1 md:px-1.5">
                {legalDocuments.filter((d) => d.type === 'lease' || d.type === 'addendum').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="evictions"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 text-white"
            >
              <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Evictions</span>
              <Badge variant="secondary" className="ml-0.5 md:ml-1 bg-white/10 text-[10px] md:text-xs px-1 md:px-1.5">
                {legalDocuments.filter((d) => d.type === 'eviction').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="notices"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 text-white"
            >
              <Scale className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Notices</span>
            </TabsTrigger>
            <TabsTrigger
              value="scanned"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 text-white"
            >
              <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Receipts & Scans</span>
              <span className="sm:hidden">Scans</span>
              <Badge variant="secondary" className="ml-0.5 md:ml-1 bg-white/10 text-[10px] md:text-xs px-1 md:px-1.5">
                {scannedDocuments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Leases Tab */}
          <TabsContent value="leases" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Upload and manage lease agreements. Set default leases per property.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openUploadDialog('legal', 'lease')}
                className="border-violet-500/50 text-violet-300 hover:bg-violet-500/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Lease
              </Button>
            </div>
            <DocumentGrid
              documents={filteredLegalDocs}
              type="legal"
              onDelete={(id) => handleDelete(id, 'legal')}
              onAssign={(doc) => {
                setSelectedDocForAssign(doc);
                setAssignDialogOpen(true);
              }}
              formatFileSize={formatFileSize}
              getTypeLabel={getTypeLabel}
              getTypeIcon={getTypeIcon}
            />
          </TabsContent>

          {/* Evictions Tab */}
          <TabsContent value="evictions" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Manage eviction notices and related legal documents.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openUploadDialog('legal', 'eviction')}
                className="border-red-500/50 text-red-300 hover:bg-red-500/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Eviction Notice
              </Button>
            </div>
            <DocumentGrid
              documents={filteredLegalDocs}
              type="legal"
              onDelete={(id) => handleDelete(id, 'legal')}
              onAssign={(doc) => {
                setSelectedDocForAssign(doc);
                setAssignDialogOpen(true);
              }}
              formatFileSize={formatFileSize}
              getTypeLabel={getTypeLabel}
              getTypeIcon={getTypeIcon}
            />
          </TabsContent>

          {/* Notices Tab */}
          <TabsContent value="notices" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Disclosures, notices, and other legal communications.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openUploadDialog('legal', 'notice')}
                className="border-slate-600 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Notice
              </Button>
            </div>
            <DocumentGrid
              documents={filteredLegalDocs}
              type="legal"
              onDelete={(id) => handleDelete(id, 'legal')}
              onAssign={(doc) => {
                setSelectedDocForAssign(doc);
                setAssignDialogOpen(true);
              }}
              formatFileSize={formatFileSize}
              getTypeLabel={getTypeLabel}
              getTypeIcon={getTypeIcon}
            />
          </TabsContent>

          {/* Scanned Documents Tab */}
          <TabsContent value="scanned" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Upload receipts, invoices, and documents for automatic categorization.
              </p>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] bg-slate-900 border-slate-700 text-slate-200">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                    <SelectItem value="all">All Types</SelectItem>
                    {SCANNED_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => openUploadDialog('scan')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Scan
                </Button>
              </div>
            </div>
            <ScannedDocumentGrid
              documents={filteredScannedDocs}
              onDelete={(id) => handleDelete(id, 'scanned')}
              formatFileSize={formatFileSize}
              properties={properties}
            />
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg mx-4">
            <DialogHeader>
              <DialogTitle>
                {uploadType === 'legal' ? 'Upload Document' : 'Scan & Categorize'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {uploadType === 'legal'
                  ? 'Upload a lease, notice, or legal document.'
                  : 'Upload a receipt or document to automatically categorize.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>Document File</Label>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-violet-500/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="doc-upload"
                  />
                  <label htmlFor="doc-upload" className="cursor-pointer">
                    {uploadForm.file ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="truncate max-w-[200px]">{uploadForm.file.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-slate-500" />
                        <p className="text-sm text-slate-400">
                          Click or drag to upload
                        </p>
                        <p className="text-xs text-slate-500">
                          PDF, Word, JPG, PNG (max 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {uploadType === 'legal' && (
                <>
                  <div className="space-y-2">
                    <Label>Document Name</Label>
                    <Input
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Standard Lease Agreement"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select
                      value={uploadForm.type}
                      onValueChange={(value) => setUploadForm((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
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
                      onChange={(e) =>
                        setUploadForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Brief description..."
                      className="bg-slate-800 border-slate-700 min-h-[80px]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isTemplate"
                      checked={uploadForm.isTemplate}
                      onChange={(e) =>
                        setUploadForm((prev) => ({ ...prev, isTemplate: e.target.checked }))
                      }
                      className="rounded border-slate-700 bg-slate-800"
                    />
                    <Label htmlFor="isTemplate" className="text-sm cursor-pointer">
                      Use as template for new leases
                    </Label>
                  </div>
                </>
              )}

              {uploadType === 'scan' && (
                <div className="space-y-2">
                  <Label>Category (Optional)</Label>
                  <Select
                    value={uploadForm.type}
                    onValueChange={(value) => setUploadForm((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                      {SCANNED_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Assign to Property (Optional)</Label>
                <Select
                  value={uploadForm.propertyId || 'none'}
                  onValueChange={(value) => setUploadForm((prev) => ({ ...prev, propertyId: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Select property..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectItem value="none">No property</SelectItem>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!uploadForm.file || uploading}
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
                    Upload
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign to Property Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Set as Default Lease</DialogTitle>
              <DialogDescription className="text-slate-400">
                Choose a property to use "{selectedDocForAssign?.name}" as the default lease template.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Property</Label>
                <Select value={assignPropertyId} onValueChange={setAssignPropertyId}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Choose property..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span>{prop.name}</span>
                          {prop.address?.city && (
                            <span className="text-slate-500 text-xs">
                              ({prop.address.city}, {prop.address.state})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAssignDialogOpen(false)}
                  className="flex-1 border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    selectedDocForAssign && handleSetDefault(selectedDocForAssign.id, assignPropertyId)
                  }
                  disabled={!assignPropertyId}
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Set as Default
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Select Property/Unit Dialog for Lease Builder */}
        <Dialog open={selectPropertyDialogOpen} onOpenChange={setSelectPropertyDialogOpen}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg !overflow-visible">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-emerald-400" />
                Create Custom Lease
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Select a property to generate a comprehensive, state-aware lease agreement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4 overflow-visible">
              <div className="space-y-2">
                <Label>Property <span className="text-red-400">*</span></Label>
                <Select
                  value={leaseBuilderProperty?.id || ''}
                  onValueChange={handlePropertySelectForLease}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select a property..." />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-slate-800 border-slate-700 text-white z-[9999]" 
                    position="popper" 
                    sideOffset={4}
                  >
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id} className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {leaseBuilderProperty && (
                <div className="space-y-2">
                  <Label>Unit <span className="text-slate-500 text-xs font-normal">(Optional)</span></Label>
                  {units.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-800 rounded-lg p-3">
                      No units found for this property. You can still create a lease template - just enter the rent amount in the next step.
                    </p>
                  ) : (
                    <Select
                      value={leaseBuilderUnit?.id || '_none'}
                      onValueChange={(value) => {
                        if (value === '_none') {
                          setLeaseBuilderUnit(null);
                        } else {
                          const unit = units.find(u => u.id === value);
                          setLeaseBuilderUnit(unit || null);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select a unit (optional)..." />
                      </SelectTrigger>
                      <SelectContent 
                        className="bg-slate-800 border-slate-700 text-white z-[9999]" 
                        position="popper" 
                        sideOffset={4}
                      >
                        <SelectItem value="_none" className="text-slate-400 hover:bg-slate-700 focus:bg-slate-700">
                          No specific unit (create template)
                        </SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id} className="text-white hover:bg-slate-700 focus:bg-slate-700 focus:text-white">
                            {unit.name} ({unit.type}) - ${Number(unit.rentAmount).toLocaleString()}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              
              <Button
                onClick={() => {
                  if (leaseBuilderProperty) {
                    setSelectPropertyDialogOpen(false);
                    setShowLeaseBuilder(true);
                  }
                }}
                disabled={!leaseBuilderProperty}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Start Lease Builder
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lease Builder Modal */}
        {leaseBuilderProperty && (
          <LeaseBuilderModal
            open={showLeaseBuilder}
            onClose={() => {
              setShowLeaseBuilder(false);
              setLeaseBuilderProperty(null);
              setLeaseBuilderUnit(null);
            }}
            property={leaseBuilderProperty}
            unit={leaseBuilderUnit}
            onLeaseGenerated={() => {
              refreshDocuments();
            }}
          />
        )}
      </div>
    </main>
  );
}


// Document Grid Component for Legal Documents
function DocumentGrid({
  documents,
  type,
  onDelete,
  onAssign,
  formatFileSize,
  getTypeLabel,
  getTypeIcon,
}: {
  documents: LegalDocument[];
  type: 'legal';
  onDelete: (id: string) => void;
  onAssign: (doc: LegalDocument) => void;
  formatFileSize: (bytes?: number) => string;
  getTypeLabel: (type: string) => string;
  getTypeIcon: (type: string) => any;
}) {
  if (documents.length === 0) {
    return (
      <Card className="border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900">
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Documents</h3>
            <p className="text-slate-300 text-sm">
              Upload your first document to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => {
        const Icon = getTypeIcon(doc.type);
        return (
          <Card
            key={doc.id}
            className="border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:border-violet-400/40 transition-all group overflow-hidden"
          >
            <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 md:h-5 md:w-5 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xs md:text-sm font-medium text-white truncate">
                      {doc.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] md:text-xs text-slate-300 mt-0.5 truncate">
                      {getTypeLabel(doc.type)}
                      {doc.state && ` • ${doc.state}`}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 md:h-8 md:w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <MoreVertical className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                    {doc.fileUrl && (
                      <>
                        <DropdownMenuItem
                          onClick={() => window.open(doc.fileUrl!, '_blank')}
                          className="cursor-pointer text-slate-200 focus:text-white focus:bg-slate-800"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer text-slate-200 focus:text-white focus:bg-slate-800">
                          <a href={doc.fileUrl} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </DropdownMenuItem>
                      </>
                    )}
                    {doc.type === 'lease' && (
                      <DropdownMenuItem onClick={() => onAssign(doc)} className="cursor-pointer text-slate-200 focus:text-white focus:bg-slate-800">
                        <Star className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(doc.id)}
                      className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-slate-800"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-3 md:p-4 md:pt-0">
              {doc.description && (
                <p className="text-[10px] md:text-xs text-slate-300 line-clamp-2 mb-2 md:mb-3">{doc.description}</p>
              )}
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-slate-400">
                  {doc.fileType && (
                    <span className="uppercase bg-white/10 px-1 md:px-1.5 py-0.5 rounded">
                      {doc.fileType}
                    </span>
                  )}
                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {doc.isTemplate && (
                    <Badge variant="outline" className="text-[10px] md:text-xs border-emerald-500/50 text-emerald-400 px-1 md:px-2">
                      Template
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 mt-2">
                {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Scanned Document Grid Component
function ScannedDocumentGrid({
  documents,
  onDelete,
  formatFileSize,
  properties,
}: {
  documents: ScannedDocument[];
  onDelete: (id: string) => void;
  formatFileSize: (bytes?: number) => string;
  properties: Property[];
}) {
  if (documents.length === 0) {
    return (
      <Card className="border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900">
        <CardContent className="py-12">
          <div className="text-center">
            <Camera className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Scanned Documents</h3>
            <p className="text-slate-300 text-sm">
              Upload receipts, invoices, or other documents to categorize them.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'classified':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] md:text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Classified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] md:text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'manual_review':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] md:text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (type: string | null) => {
    switch (type) {
      case 'receipt':
        return Receipt;
      case 'invoice':
        return FileText;
      case 'lease':
        return FileSignature;
      default:
        return FolderOpen;
    }
  };

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => {
        const Icon = getCategoryIcon(doc.documentType);
        return (
          <Card
            key={doc.id}
            className="border-white/10 bg-gradient-to-r from-indigo-700 to-indigo-900 hover:border-emerald-400/40 transition-all group overflow-hidden"
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 md:h-5 md:w-5 text-emerald-400" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 md:h-8 md:w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <MoreVertical className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                    <DropdownMenuItem
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      className="cursor-pointer text-slate-200 focus:text-white focus:bg-slate-800"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer text-slate-200 focus:text-white focus:bg-slate-800">
                      <a href={doc.fileUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(doc.id)}
                      className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-slate-800"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h4 className="text-xs md:text-sm font-medium text-white truncate mb-1">
                {doc.originalFileName}
              </h4>

              <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3 flex-wrap">
                {getStatusBadge(doc.classificationStatus)}
                {doc.documentType && (
                  <span className="text-[10px] md:text-xs text-slate-300 capitalize">{doc.documentType}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] md:text-xs text-slate-400">
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="uppercase bg-white/10 px-1 md:px-1.5 py-0.5 rounded">
                    {doc.fileType}
                  </span>
                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                </div>
              </div>

              {doc.ocrConfidence !== undefined && doc.ocrConfidence > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] md:text-xs mb-1">
                    <span className="text-slate-400">OCR Confidence</span>
                    <span className="text-slate-300">{doc.ocrConfidence.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${doc.ocrConfidence}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-[10px] md:text-xs text-slate-400 mt-2">
                {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

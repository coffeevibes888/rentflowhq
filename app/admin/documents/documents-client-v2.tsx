'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Bell,
  ScanLine,
  X,
  FileCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { LeaseBuilderModal } from '@/components/admin/lease-builder';
import { BrowserTabs, BrowserTab } from '@/components/admin/documents/browser-tabs';


// Interfaces
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

interface LeaseTemplate {
  id: string;
  name: string;
  type: string;
  isDefault: boolean;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  properties: Array<{ id: string; name: string }>;
}

interface ActiveLease {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  rentAmount: number;
  tenantSignedAt: string | null;
  landlordSignedAt: string | null;
  tenant: { id: string; name: string | null; email: string | null } | null;
  unit: {
    id: string;
    name: string;
    property: { id: string; name: string } | null;
  };
  signatureRequests: Array<{
    id: string;
    role: string;
    status: string;
    signedAt: string | null;
  }>;
}

interface DocumentsClientProps {
  legalDocuments: LegalDocument[];
  scannedDocuments: ScannedDocument[];
  properties: Property[];
  leaseTemplates?: LeaseTemplate[];
  activeLeases?: ActiveLease[];
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


export default function DocumentsClientV2({
  legalDocuments: initialLegalDocs,
  scannedDocuments: initialScannedDocs,
  properties,
  leaseTemplates: initialLeaseTemplates = [],
  activeLeases: initialActiveLeases = [],
}: DocumentsClientProps) {
  const { toast } = useToast();
  const [legalDocuments, setLegalDocuments] = useState(initialLegalDocs);
  const [scannedDocuments, setScannedDocuments] = useState(initialScannedDocs);
  const [leaseTemplates, setLeaseTemplates] = useState(initialLeaseTemplates);
  const [activeLeases, setActiveLeases] = useState(initialActiveLeases);
  const [activeTab, setActiveTab] = useState('legal');
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

  // Document viewer modal state
  const [viewingDocument, setViewingDocument] = useState<LegalDocument | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);
  const [loadingDocumentPreview, setLoadingDocumentPreview] = useState(false);

  // Define browser tabs
  const browserTabs: BrowserTab[] = [
    {
      id: 'legal',
      label: 'Legal Documents',
      shortLabel: 'Legal',
      icon: Scale,
      count: legalDocuments.filter(d => d.type === 'lease' || d.type === 'addendum' || d.type === 'disclosure').length,
    },
    {
      id: 'notices',
      label: 'Notices',
      shortLabel: 'Notices',
      icon: Bell,
      count: legalDocuments.filter(d => d.type === 'notice' || d.type === 'eviction').length,
    },
    {
      id: 'leases',
      label: 'Active Leases',
      shortLabel: 'Leases',
      icon: FileSignature,
      count: activeLeases.length,
    },
    {
      id: 'receipts',
      label: 'Receipts',
      shortLabel: 'Receipts',
      icon: Receipt,
      count: scannedDocuments.filter(d => d.documentType === 'receipt' || d.documentType === 'invoice').length,
    },
    {
      id: 'templates',
      label: 'Templates',
      shortLabel: 'Templates',
      icon: Wand2,
      count: leaseTemplates.length,
    },
    {
      id: 'scanned',
      label: 'Scanned Documents',
      shortLabel: 'Scanned',
      icon: ScanLine,
      count: scannedDocuments.length,
    },
  ];

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

  // Handle viewing a document in modal
  const handleViewDocument = async (doc: LegalDocument) => {
    setViewingDocument(doc);
    setDocumentViewerOpen(true);
    setDocumentHtml(null);
    
    // If it's a lease document, try to fetch the HTML preview
    if (doc.type === 'lease') {
      setLoadingDocumentPreview(true);
      try {
        const res = await fetch(`/api/legal-documents/${doc.id}/preview`);
        if (res.ok) {
          // The API returns raw HTML, not JSON
          const html = await res.text();
          setDocumentHtml(html || null);
        }
      } catch (error) {
        console.error('Failed to load document preview:', error);
      } finally {
        setLoadingDocumentPreview(false);
      }
    }
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

  const openUploadDialog = (type: 'legal' | 'scan', docType?: string) => {
    setUploadType(type);
    if (docType) {
      setUploadForm((prev) => ({ ...prev, type: docType }));
    }
    setUploadDialogOpen(true);
  };

  // Filter documents based on active tab and search
  const getFilteredLegalDocs = () => {
    return legalDocuments.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === 'legal') {
        return matchesSearch && (doc.type === 'lease' || doc.type === 'addendum' || doc.type === 'disclosure');
      }
      if (activeTab === 'notices') {
        return matchesSearch && (doc.type === 'notice' || doc.type === 'eviction');
      }
      return matchesSearch;
    });
  };

  const getFilteredScannedDocs = () => {
    return scannedDocuments.filter((doc) => {
      const matchesSearch = doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeTab === 'receipts') {
        return matchesSearch && (doc.documentType === 'receipt' || doc.documentType === 'invoice');
      }
      if (filterType !== 'all') {
        return matchesSearch && doc.documentType === filterType;
      }
      return matchesSearch;
    });
  };


  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'legal':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">
                Lease agreements, addendums, and disclosure forms.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openUploadDialog('legal', 'lease')}
                className="border-violet-400/50 text-violet-300 hover:bg-violet-500/20"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Document
              </Button>
            </div>
            <DocumentGrid
              documents={getFilteredLegalDocs()}
              type="legal"
              onDelete={(id) => handleDelete(id, 'legal')}
              onAssign={(doc) => {
                setSelectedDocForAssign(doc);
                setAssignDialogOpen(true);
              }}
              onView={handleViewDocument}
              formatFileSize={formatFileSize}
              getTypeLabel={getTypeLabel}
              getTypeIcon={getTypeIcon}
            />
          </div>
        );

      case 'notices':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">
                Eviction notices, legal notices, and communications.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openUploadDialog('legal', 'notice')}
                className="border-amber-400/50 text-amber-300 hover:bg-amber-500/20"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Notice
              </Button>
            </div>
            <DocumentGrid
              documents={getFilteredLegalDocs()}
              type="legal"
              onDelete={(id) => handleDelete(id, 'legal')}
              onAssign={(doc) => {
                setSelectedDocForAssign(doc);
                setAssignDialogOpen(true);
              }}
              onView={handleViewDocument}
              formatFileSize={formatFileSize}
              getTypeLabel={getTypeLabel}
              getTypeIcon={getTypeIcon}
            />
          </div>
        );

      case 'leases':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">
                Active leases and pending signatures.
              </p>
            </div>
            <ActiveLeasesGrid leases={activeLeases} />
          </div>
        );

      case 'receipts':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">
                Rent receipts, invoices, and payment records.
              </p>
              <Button
                size="sm"
                onClick={() => openUploadDialog('scan', 'receipt')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Camera className="h-4 w-4 mr-1" />
                Scan Receipt
              </Button>
            </div>
            <ScannedDocumentGrid
              documents={getFilteredScannedDocs()}
              onDelete={(id) => handleDelete(id, 'scanned')}
              formatFileSize={formatFileSize}
              properties={properties}
            />
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">
                Lease templates for automatic generation when applications are approved.
              </p>
              <Button
                size="sm"
                onClick={() => setSelectPropertyDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Template
              </Button>
            </div>
            <LeaseTemplateGrid
              templates={leaseTemplates}
              onDelete={async (id) => {
                if (!confirm('Are you sure you want to delete this template?')) return;
                try {
                  const res = await fetch(`/api/lease-templates/${id}`, { method: 'DELETE' });
                  if (res.ok) {
                    setLeaseTemplates((prev) => prev.filter((t) => t.id !== id));
                    toast({ title: 'Template deleted' });
                  }
                } catch (error) {
                  toast({ title: 'Delete failed', variant: 'destructive' });
                }
              }}
              onSetDefault={async (id) => {
                try {
                  const res = await fetch(`/api/lease-templates/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isDefault: true }),
                  });
                  if (res.ok) {
                    setLeaseTemplates((prev) =>
                      prev.map((t) => ({ ...t, isDefault: t.id === id }))
                    );
                    toast({ title: 'Default template updated' });
                  }
                } catch (error) {
                  toast({ title: 'Update failed', variant: 'destructive' });
                }
              }}
            />
          </div>
        );

      case 'scanned':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-white/70">
                All scanned and OCR-processed documents.
              </p>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-900 border-white/20 text-white">
                    <SelectItem value="all" className="text-white hover:bg-white/10 focus:bg-white/10">All Types</SelectItem>
                    {SCANNED_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/10 focus:bg-white/10">
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
              documents={getFilteredScannedDocs()}
              onDelete={(id) => handleDelete(id, 'scanned')}
              formatFileSize={formatFileSize}
              properties={properties}
            />
          </div>
        );

      default:
        return null;
    }
  };


  return (
    <main className="w-full px-2 py-4 md:px-6 lg:px-8 md:py-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-2xl p-4 md:p-6 border border-white/10">
          <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5 md:h-7 md:w-7 text-violet-300" />
                Document Center
              </h1>
              <p className="text-xs md:text-sm text-white/70 mt-1">
                Manage all your property documents in one place
              </p>
            </div>

            <Button
              onClick={() => setSelectPropertyDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 h-10 text-sm px-4"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Create Your Lease With Our Free Lease Builder
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 focus:border-violet-400 h-10 text-white placeholder:text-white/50"
          />
        </div>

        {/* Browser-Style Tabs */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-t-2xl pt-3 px-2 md:px-4">
          <BrowserTabs
            tabs={browserTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab Content Panel */}
        <div className="bg-gradient-to-b from-indigo-900/80 to-indigo-950 border border-white/10 border-t-0 rounded-b-2xl p-4 md:p-6 -mt-4 md:-mt-6">
          {renderTabContent()}
        </div>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 border-white/20 text-white max-w-lg mx-4">
            <DialogHeader>
              <DialogTitle>
                {uploadType === 'legal' ? 'Upload Document' : 'Scan & Categorize'}
              </DialogTitle>
              <DialogDescription className="text-white/70">
                {uploadType === 'legal'
                  ? 'Upload a lease, notice, or legal document.'
                  : 'Upload a receipt or document to automatically categorize.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>Document File</Label>
                <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-violet-400/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="doc-upload"
                  />
                  <label htmlFor="doc-upload" className="cursor-pointer">
                    {uploadForm.file ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="truncate max-w-[200px]">{uploadForm.file.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-white/50" />
                        <p className="text-sm text-white/70">Click or drag to upload</p>
                        <p className="text-xs text-white/50">PDF, Word, JPG, PNG (max 10MB)</p>
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
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select
                      value={uploadForm.type}
                      onValueChange={(value) => setUploadForm((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-indigo-900 border-white/20 text-white">
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10 focus:bg-white/10">
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
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isTemplate"
                      checked={uploadForm.isTemplate}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, isTemplate: e.target.checked }))}
                      className="rounded border-white/30 bg-white/10"
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
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent className="bg-indigo-900 border-white/20 text-white">
                      {SCANNED_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/10 focus:bg-white/10">
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
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select property..." />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-900 border-white/20 text-white">
                    <SelectItem value="none" className="text-white hover:bg-white/10 focus:bg-white/10">No property</SelectItem>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id} className="text-white hover:bg-white/10 focus:bg-white/10">
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
          <DialogContent className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 border-white/20 text-white max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>Set as Default Lease</DialogTitle>
              <DialogDescription className="text-white/70">
                Choose a property to use "{selectedDocForAssign?.name}" as the default lease template.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Select Property</Label>
                <Select value={assignPropertyId} onValueChange={setAssignPropertyId}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose property..." />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-900 border-white/20 text-white">
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id} className="text-white hover:bg-white/10 focus:bg-white/10">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-white/70" />
                          <span>{prop.name}</span>
                          {prop.address?.city && (
                            <span className="text-white/50 text-xs">
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
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedDocForAssign && handleSetDefault(selectedDocForAssign.id, assignPropertyId)}
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
          <DialogContent className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 border-white/20 text-white max-w-lg !overflow-visible">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-emerald-300" />
                Create Custom Lease
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Select a property to generate a comprehensive, state-aware lease agreement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4 overflow-visible">
              <div className="space-y-2">
                <Label>Property <span className="text-red-300">*</span></Label>
                <Select
                  value={leaseBuilderProperty?.id || ''}
                  onValueChange={handlePropertySelectForLease}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select a property..." />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-indigo-900 border-white/20 text-white z-[9999]" 
                    position="popper" 
                    sideOffset={4}
                  >
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id} className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {leaseBuilderProperty && (
                <div className="space-y-2">
                  <Label>Unit <span className="text-white/50 text-xs font-normal">(Optional)</span></Label>
                  {units.length === 0 ? (
                    <p className="text-xs text-white/70 bg-white/10 rounded-lg p-3 border border-white/20">
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
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select a unit (optional)..." />
                      </SelectTrigger>
                      <SelectContent 
                        className="bg-indigo-900 border-white/20 text-white z-[9999]" 
                        position="popper" 
                        sideOffset={4}
                      >
                        <SelectItem value="_none" className="text-white/70 hover:bg-white/10 focus:bg-white/10">
                          No specific unit (create template)
                        </SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id} className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
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

        {/* Document Viewer Modal */}
        {documentViewerOpen && viewingDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setDocumentViewerOpen(false);
                setViewingDocument(null);
                setDocumentHtml(null);
              }}
            />
            <div className="relative z-10 w-full max-w-5xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-violet-600 to-indigo-600">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <FileSignature className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{viewingDocument.name}</h2>
                    <p className="text-sm text-white/70">{getTypeLabel(viewingDocument.type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {viewingDocument.fileUrl && (
                    <a
                      href={viewingDocument.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setDocumentViewerOpen(false);
                      setViewingDocument(null);
                      setDocumentHtml(null);
                    }}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto bg-gray-50">
                {loadingDocumentPreview ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  </div>
                ) : documentHtml ? (
                  <div className="p-8">
                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
                      <div
                        className="prose prose-sm max-w-none text-gray-800"
                        style={{ fontSize: '14px', lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{ __html: documentHtml }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                    <FileText className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Preview Available</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      This document doesn&apos;t have a preview. You can download it to view the contents.
                    </p>
                    {viewingDocument.fileUrl && (
                      <a
                        href={viewingDocument.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                      >
                        <Download className="h-4 w-4" />
                        Download Document
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
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
  onView,
  formatFileSize,
  getTypeLabel,
  getTypeIcon,
}: {
  documents: LegalDocument[];
  type: 'legal';
  onDelete: (id: string) => void;
  onAssign: (doc: LegalDocument) => void;
  onView: (doc: LegalDocument) => void;
  formatFileSize: (bytes?: number) => string;
  getTypeLabel: (type: string) => string;
  getTypeIcon: (type: string) => any;
}) {
  if (documents.length === 0) {
    return (
      <Card className="border-white/20 bg-white/5">
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-white/40 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Documents</h3>
            <p className="text-white/70 text-sm">
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
            className="border-white/20 bg-white/5 hover:bg-white/10 hover:border-violet-400/40 transition-all group overflow-hidden cursor-pointer"
            onClick={() => onView(doc)}
          >
            <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-violet-500/30 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 md:h-5 md:w-5 text-violet-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xs md:text-sm font-medium text-white truncate">
                      {doc.name}
                    </CardTitle>
                    <CardDescription className="text-[10px] md:text-xs text-white/70 mt-0.5 truncate">
                      {getTypeLabel(doc.type)}
                      {doc.state && ` • ${doc.state}`}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 md:h-8 md:w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <MoreVertical className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-indigo-900 border-white/20 text-white">
                    <DropdownMenuItem
                      onClick={() => onView(doc)}
                      className="cursor-pointer text-white focus:text-white focus:bg-white/10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    {doc.fileUrl && (
                      <DropdownMenuItem asChild className="cursor-pointer text-white focus:text-white focus:bg-white/10" onClick={(e) => e.stopPropagation()}>
                        <a href={doc.fileUrl} download onClick={(e) => e.stopPropagation()}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </DropdownMenuItem>
                    )}
                    {doc.type === 'lease' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssign(doc); }} className="cursor-pointer text-white focus:text-white focus:bg-white/10">
                        <Star className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                      className="cursor-pointer text-red-300 focus:text-red-200 focus:bg-white/10"
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
                <p className="text-[10px] md:text-xs text-white/70 line-clamp-2 mb-2 md:mb-3">{doc.description}</p>
              )}
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-white/60">
                  {doc.fileType && (
                    <span className="uppercase bg-white/10 px-1 md:px-1.5 py-0.5 rounded">
                      {doc.fileType}
                    </span>
                  )}
                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                </div>
                <div className="flex items-center gap-1">
                  {doc.isTemplate && (
                    <Badge variant="outline" className="text-[10px] md:text-xs border-emerald-400/50 text-emerald-300 px-1 md:px-2">
                      Template
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-white/60 mt-2">
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
      <Card className="border-white/20 bg-white/5">
        <CardContent className="py-12">
          <div className="text-center">
            <Camera className="h-12 w-12 mx-auto text-white/40 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Scanned Documents</h3>
            <p className="text-white/70 text-sm">
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
          <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-400/30 text-[10px] md:text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Classified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-500/30 text-amber-300 border-amber-400/30 text-[10px] md:text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'manual_review':
        return (
          <Badge className="bg-blue-500/30 text-blue-300 border-blue-400/30 text-[10px] md:text-xs">
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
            className="border-white/20 bg-white/5 hover:bg-white/10 hover:border-emerald-400/40 transition-all group overflow-hidden"
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-emerald-500/30 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 md:h-5 md:w-5 text-emerald-300" />
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
                  <DropdownMenuContent align="end" className="bg-indigo-900 border-white/20 text-white">
                    <DropdownMenuItem
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      className="cursor-pointer text-white focus:text-white focus:bg-white/10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer text-white focus:text-white focus:bg-white/10">
                      <a href={doc.fileUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(doc.id)}
                      className="cursor-pointer text-red-300 focus:text-red-200 focus:bg-white/10"
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
                  <span className="text-[10px] md:text-xs text-white/70 capitalize">{doc.documentType}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] md:text-xs text-white/60">
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
                    <span className="text-white/60">OCR Confidence</span>
                    <span className="text-white/80">{doc.ocrConfidence.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${doc.ocrConfidence}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-[10px] md:text-xs text-white/60 mt-2">
                {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


// Lease Template Grid Component
function LeaseTemplateGrid({
  templates,
  onDelete,
  onSetDefault,
}: {
  templates: LeaseTemplate[];
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  if (templates.length === 0) {
    return (
      <Card className="border-white/20 bg-white/5">
        <CardContent className="py-12">
          <div className="text-center">
            <Wand2 className="h-12 w-12 mx-auto text-white/40 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Lease Templates</h3>
            <p className="text-white/70 text-sm">
              Create a lease template to automatically generate leases when applications are approved.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card
          key={template.id}
          className="border-white/20 bg-white/5 hover:bg-white/10 hover:border-emerald-400/40 transition-all group overflow-hidden"
        >
          <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-emerald-500/30 flex items-center justify-center shrink-0">
                  {template.type === 'builder' ? (
                    <Wand2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-300" />
                  ) : (
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-emerald-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xs md:text-sm font-medium text-white truncate">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs text-white/70 mt-0.5">
                    {template.type === 'builder' ? 'Builder Template' : 'PDF Template'}
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
                <DropdownMenuContent align="end" className="bg-indigo-900 border-white/20 text-white">
                  {template.pdfUrl && (
                    <DropdownMenuItem
                      onClick={() => window.open(template.pdfUrl!, '_blank')}
                      className="cursor-pointer text-white focus:text-white focus:bg-white/10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View PDF
                    </DropdownMenuItem>
                  )}
                  {!template.isDefault && (
                    <DropdownMenuItem
                      onClick={() => onSetDefault(template.id)}
                      className="cursor-pointer text-white focus:text-white focus:bg-white/10"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Set as Default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(template.id)}
                    className="cursor-pointer text-red-300 focus:text-red-200 focus:bg-white/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-3 md:p-4 md:pt-0">
            <div className="flex items-center gap-1 flex-wrap mb-2">
              {template.isDefault && (
                <Badge className="bg-amber-500/30 text-amber-300 border-amber-400/30 text-[10px] md:text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] md:text-xs border-white/30 text-white/80">
                {template.type === 'builder' ? 'Builder' : 'PDF'}
              </Badge>
            </div>
            {template.properties.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-white/60 mb-1">Assigned to:</p>
                <div className="flex flex-wrap gap-1">
                  {template.properties.slice(0, 3).map((prop) => (
                    <span
                      key={prop.id}
                      className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/80"
                    >
                      {prop.name}
                    </span>
                  ))}
                  {template.properties.length > 3 && (
                    <span className="text-[10px] text-white/60">
                      +{template.properties.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            <p className="text-[10px] md:text-xs text-white/60 mt-2">
              {formatDistanceToNow(new Date(template.createdAt), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Active Leases Grid Component
function ActiveLeasesGrid({ leases }: { leases: ActiveLease[] }) {
  if (leases.length === 0) {
    return (
      <Card className="border-white/20 bg-white/5">
        <CardContent className="py-12">
          <div className="text-center">
            <FileSignature className="h-12 w-12 mx-auto text-white/40 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Active Leases</h3>
            <p className="text-white/70 text-sm">
              Active leases will appear here once tenants sign their agreements.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (lease: ActiveLease) => {
    if (lease.status === 'active') {
      return (
        <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-400/30 text-[10px] md:text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (lease.tenantSignedAt && !lease.landlordSignedAt) {
      return (
        <Badge className="bg-amber-500/30 text-amber-300 border-amber-400/30 text-[10px] md:text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Landlord
        </Badge>
      );
    }
    if (!lease.tenantSignedAt) {
      return (
        <Badge className="bg-blue-500/30 text-blue-300 border-blue-400/30 text-[10px] md:text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Tenant
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {leases.map((lease) => (
        <Card
          key={lease.id}
          className="border-white/20 bg-white/5 hover:bg-white/10 hover:border-violet-400/40 transition-all group overflow-hidden"
        >
          <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-violet-500/30 flex items-center justify-center shrink-0">
                  <FileSignature className="h-4 w-4 md:h-5 md:w-5 text-violet-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xs md:text-sm font-medium text-white truncate">
                    {lease.unit.property?.name || 'Property'} - {lease.unit.name}
                  </CardTitle>
                  <CardDescription className="text-[10px] md:text-xs text-white/70 mt-0.5 truncate">
                    {lease.tenant?.name || 'Tenant'} • ${lease.rentAmount.toLocaleString()}/mo
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(lease)}
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-3 md:p-4 md:pt-0">
            <div className="space-y-2 text-[10px] md:text-xs text-white/80">
              <div className="flex justify-between">
                <span className="text-white/60">Start Date</span>
                <span>{new Date(lease.startDate).toLocaleDateString()}</span>
              </div>
              {lease.endDate && (
                <div className="flex justify-between">
                  <span className="text-white/60">End Date</span>
                  <span>{new Date(lease.endDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/60">Tenant Email</span>
                <span className="truncate max-w-[120px]">{lease.tenant?.email || 'N/A'}</span>
              </div>
            </div>
            
            {/* Signature Status */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] text-white/60 mb-2">Signatures</p>
              <div className="flex gap-2">
                <div className={`flex items-center gap-1 text-[10px] ${lease.tenantSignedAt ? 'text-emerald-300' : 'text-white/50'}`}>
                  {lease.tenantSignedAt ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  Tenant
                </div>
                <div className={`flex items-center gap-1 text-[10px] ${lease.landlordSignedAt ? 'text-emerald-300' : 'text-white/50'}`}>
                  {lease.landlordSignedAt ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  Landlord
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

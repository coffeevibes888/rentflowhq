'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, Plus, FileText, Upload, X, Send, Copy, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface LineItem {
  description: string;
  qty: number;
  unitPrice: number;
}

interface Estimate {
  id: string;
  title: string;
  description: string | null;
  lineItems: LineItem[];
  laborCost: number;
  materialsCost: number;
  totalAmount: number;
  estimatedHours: number | null;
  status: string;
  isTemplate: boolean;
  templateName: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  landlord?: { name: string; companyName: string | null } | null;
  workOrder?: { title: string; property: { name: string } } | null;
}

export default function ContractorEstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [templates, setTemplates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isTemplate, setIsTemplate] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', qty: 1, unitPrice: 0 }]);
  const [laborCost, setLaborCost] = useState(0);
  const [materialsCost, setMaterialsCost] = useState(0);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    fetchEstimates();
  }, []);

  const fetchEstimates = async () => {
    try {
      const [estRes, tempRes] = await Promise.all([
        fetch('/api/contractor/estimates'),
        fetch('/api/contractor/estimates?templates=true'),
      ]);
      
      if (estRes.ok) {
        const data = await estRes.json();
        setEstimates(data.estimates || []);
      }
      if (tempRes.ok) {
        const data = await tempRes.json();
        setTemplates(data.estimates || []);
      }
    } catch (error) {
      console.error('Error fetching estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    return lineItemsTotal + laborCost + materialsCost;
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', qty: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLineItems([{ description: '', qty: 1, unitPrice: 0 }]);
    setLaborCost(0);
    setMaterialsCost(0);
    setEstimatedHours('');
    setTemplateName('');
    setIsTemplate(false);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const res = await fetch('/api/contractor/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          lineItems: lineItems.filter(item => item.description),
          laborCost,
          materialsCost,
          estimatedHours: estimatedHours ? Number(estimatedHours) : null,
          isTemplate,
          templateName: isTemplate ? templateName : null,
        }),
      });

      if (res.ok) {
        toast.success(isTemplate ? 'Template saved!' : 'Estimate created!');
        resetForm();
        fetchEstimates();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save estimate');
    }
  };

  const useTemplate = (template: Estimate) => {
    setTitle(template.title);
    setDescription(template.description || '');
    setLineItems(template.lineItems.length > 0 ? template.lineItems : [{ description: '', qty: 1, unitPrice: 0 }]);
    setLaborCost(template.laborCost);
    setMaterialsCost(template.materialsCost);
    setEstimatedHours(template.estimatedHours?.toString() || '');
    setIsTemplate(false);
    setShowForm(true);
  };

  const deleteEstimate = async (id: string) => {
    if (!confirm('Delete this estimate?')) return;
    
    try {
      const res = await fetch(`/api/contractor/estimates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Deleted');
        fetchEstimates();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Estimates</h1>
          <p className="text-slate-600 mt-1">Create and manage job quotes</p>
        </div>
        <Button 
          onClick={() => { setShowForm(true); setIsTemplate(false); }}
          className="bg-violet-600 hover:bg-violet-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Estimate
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="bg-white/90 backdrop-blur-sm border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900">
              {isTemplate ? 'Create Template' : 'New Estimate'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!isTemplate}
                  onChange={() => setIsTemplate(false)}
                  className="text-violet-600"
                />
                <span className="text-sm text-slate-700">Estimate</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={isTemplate}
                  onChange={() => setIsTemplate(true)}
                  className="text-violet-600"
                />
                <span className="text-sm text-slate-700">Save as Template</span>
              </label>
            </div>

            {isTemplate && (
              <Input
                placeholder="Template name (e.g., 'Standard Plumbing Repair')"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            )}

            <Input
              placeholder="Estimate title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              placeholder="Description of work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            {/* Line Items */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Line Items</label>
              {lineItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => updateLineItem(index, 'qty', Number(e.target.value))}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-600">Labor Cost</label>
                <Input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Materials Cost</label>
                <Input
                  type="number"
                  value={materialsCost}
                  onChange={(e) => setMaterialsCost(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Est. Hours</label>
                <Input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xl font-bold text-slate-900">
                Total: {formatCurrency(calculateTotal())}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-500">
                  {isTemplate ? 'Save Template' : 'Create Estimate'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Section */}
      {templates.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-gray-300">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              My Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">{template.templateName || template.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">{formatCurrency(template.totalAmount)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => useTemplate(template)}
                        title="Use template"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEstimate(template.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estimates List */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-300">
        <CardHeader>
          <CardTitle className="text-slate-900">Your Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 && !showForm ? (
            <div className="text-center py-12">
              <Calculator className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No estimates yet</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Create estimates to send quotes to property managers
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => { setShowForm(true); setIsTemplate(false); }}
                  className="bg-violet-600 hover:bg-violet-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Estimate
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => { setShowForm(true); setIsTemplate(true); }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {estimates.map((estimate) => (
                <div
                  key={estimate.id}
                  className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{estimate.title}</h3>
                      <p className="text-sm text-slate-500">
                        {estimate.landlord?.companyName || estimate.landlord?.name || 'No recipient'}
                        {estimate.workOrder && ` • ${estimate.workOrder.title}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 font-bold">
                        {formatCurrency(estimate.totalAmount)}
                      </span>
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${estimate.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${estimate.status === 'sent' ? 'bg-blue-100 text-blue-700' : ''}
                        ${estimate.status === 'draft' ? 'bg-slate-100 text-slate-700' : ''}
                        ${estimate.status === 'declined' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {estimate.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-gray-300 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <FileText className="h-8 w-8 text-gray-900 shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tips for Great Estimates</h3>
              <ul className="text-sm text-gray-900/90 space-y-1">
                <li>• Be detailed about materials and labor costs</li>
                <li>• Include a timeline for completion</li>
                <li>• Save templates for common jobs to speed up quoting</li>
                <li>• Offer options at different price points when possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

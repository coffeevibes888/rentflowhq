'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={copy} className="h-8 w-8 p-0">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <div className="relative">
      <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  description,
  scopes,
  children,
}: {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  scopes: string[];
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const methodColors = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PATCH: 'bg-yellow-500',
    DELETE: 'bg-red-500',
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <Badge className={cn('font-mono', methodColors[method])}>{method}</Badge>
        <code className="text-sm font-medium">{path}</code>
        <span className="text-sm text-muted-foreground ml-auto mr-2">{description}</span>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="border-t p-4 bg-muted/30">
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Required Scopes:</p>
            <div className="flex gap-2">
              {scopes.map(scope => (
                <Badge key={scope} variant="outline">{scope}</Badge>
              ))}
            </div>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ApiReferencePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/docs" className="hover:text-foreground">Docs</Link>
        <span>/</span>
        <span className="text-foreground">API Reference</span>
      </div>

      <h1 className="text-4xl font-bold mb-4">API Reference</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Complete reference for the Property Manager Enterprise API.
      </p>

      {/* Table of Contents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">On this page</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li><a href="#authentication" className="text-primary hover:underline">Authentication</a></li>
            <li><a href="#rate-limiting" className="text-primary hover:underline">Rate Limiting</a></li>
            <li><a href="#errors" className="text-primary hover:underline">Error Handling</a></li>
            <li><a href="#pagination" className="text-primary hover:underline">Pagination</a></li>
            <li><a href="#api-endpoints" className="text-primary hover:underline">API Endpoints</a></li>
            <li><a href="#code-examples" className="text-primary hover:underline">Code Examples</a></li>
          </ul>
        </CardContent>
      </Card>

      {/* Authentication */}
      <section id="authentication" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Authentication</h2>
        <p className="text-muted-foreground mb-4">
          All API requests require authentication using an API key. Include your key in the Authorization header:
        </p>
        <CodeBlock code={`Authorization: Bearer pk_live_your_api_key_here`} />
        <p className="text-sm text-muted-foreground mt-4">
          Alternatively, use the <code className="bg-muted px-1 rounded">X-API-Key</code> header.
        </p>

        <h3 className="text-lg font-semibold mt-8 mb-4">API Key Scopes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Scope</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['properties:read', 'Read property information'],
                ['properties:write', 'Create and update properties'],
                ['units:read', 'Read unit information'],
                ['units:write', 'Create and update units'],
                ['tenants:read', 'Read tenant information'],
                ['leases:read', 'Read lease information'],
                ['leases:write', 'Create and manage leases'],
                ['payments:read', 'Read payment history'],
                ['maintenance:read', 'Read maintenance tickets'],
                ['maintenance:write', 'Create and update tickets'],
              ].map(([scope, desc]) => (
                <tr key={scope} className="border-b">
                  <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">{scope}</code></td>
                  <td className="py-2 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rate Limiting */}
      <section id="rate-limiting" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Rate Limiting</h2>
        <p className="text-muted-foreground mb-4">
          API requests are rate limited to 1,000 requests per hour by default. Rate limit headers are included in every response:
        </p>
        <CodeBlock code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200`} />
        <p className="text-sm text-muted-foreground mt-4">
          When rate limited, you&apos;ll receive a <code className="bg-muted px-1 rounded">429 Too Many Requests</code> response.
        </p>
      </section>

      {/* Errors */}
      <section id="errors" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
        <p className="text-muted-foreground mb-4">Error responses follow this format:</p>
        <CodeBlock
          language="json"
          code={`{
  "error": {
    "message": "Human-readable error message",
    "code": "error_code",
    "status": 400
  }
}`}
        />
        <h3 className="text-lg font-semibold mt-6 mb-4">Common Error Codes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Code</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['missing_api_key', '401', 'No API key provided'],
                ['invalid_api_key', '401', 'API key is invalid or expired'],
                ['insufficient_scope', '403', 'API key lacks required scope'],
                ['rate_limit_exceeded', '429', 'Too many requests'],
                ['validation_error', '400', 'Invalid request data'],
                ['not_found', '404', 'Resource not found'],
              ].map(([code, status, desc]) => (
                <tr key={code} className="border-b">
                  <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">{code}</code></td>
                  <td className="py-2 pr-4">{status}</td>
                  <td className="py-2 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}
      <section id="pagination" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Pagination</h2>
        <p className="text-muted-foreground mb-4">
          List endpoints support pagination with <code className="bg-muted px-1 rounded">page</code> and <code className="bg-muted px-1 rounded">limit</code> query parameters.
        </p>
        <CodeBlock code={`GET /api/v1/properties?page=2&limit=20`} />
        <p className="text-muted-foreground mt-4 mb-2">Response includes pagination metadata:</p>
        <CodeBlock
          language="json"
          code={`{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "pages": 8,
    "hasMore": true
  }
}`}
        />
      </section>

      {/* API Endpoints */}
      <section id="api-endpoints" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">API Endpoints</h2>

        <h3 className="text-xl font-semibold mt-8 mb-4">Properties</h3>
        <div className="space-y-2">
          <EndpointCard method="GET" path="/api/v1/properties" description="List all properties" scopes={['properties:read']}>
            <p className="text-sm mb-2">Query parameters: <code>status</code>, <code>type</code>, <code>page</code>, <code>limit</code></p>
          </EndpointCard>
          <EndpointCard method="POST" path="/api/v1/properties" description="Create a property" scopes={['properties:write']}>
            <p className="text-sm mb-2">Required fields: <code>name</code>, <code>address</code>, <code>type</code></p>
          </EndpointCard>
          <EndpointCard method="GET" path="/api/v1/properties/:id" description="Get property details" scopes={['properties:read']} />
          <EndpointCard method="PATCH" path="/api/v1/properties/:id" description="Update a property" scopes={['properties:write']} />
          <EndpointCard method="DELETE" path="/api/v1/properties/:id" description="Delete a property" scopes={['properties:write']} />
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-4">Units</h3>
        <div className="space-y-2">
          <EndpointCard method="GET" path="/api/v1/units" description="List all units" scopes={['units:read']}>
            <p className="text-sm mb-2">Query parameters: <code>propertyId</code>, <code>isAvailable</code>, <code>type</code></p>
          </EndpointCard>
          <EndpointCard method="POST" path="/api/v1/units" description="Create a unit" scopes={['units:write']}>
            <p className="text-sm mb-2">Required fields: <code>propertyId</code>, <code>name</code>, <code>type</code>, <code>rentAmount</code></p>
          </EndpointCard>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-4">Tenants</h3>
        <div className="space-y-2">
          <EndpointCard method="GET" path="/api/v1/tenants" description="List tenants with leases" scopes={['tenants:read']}>
            <p className="text-sm mb-2">Query parameters: <code>propertyId</code>, <code>unitId</code>, <code>status</code></p>
          </EndpointCard>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-4">Leases</h3>
        <div className="space-y-2">
          <EndpointCard method="GET" path="/api/v1/leases" description="List all leases" scopes={['leases:read']}>
            <p className="text-sm mb-2">Query parameters: <code>propertyId</code>, <code>unitId</code>, <code>status</code>, <code>tenantId</code></p>
          </EndpointCard>
          <EndpointCard method="POST" path="/api/v1/leases" description="Create a lease" scopes={['leases:write']}>
            <p className="text-sm mb-2">Required fields: <code>unitId</code>, <code>tenantId</code>, <code>startDate</code>, <code>rentAmount</code></p>
          </EndpointCard>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-4">Payments</h3>
        <div className="space-y-2">
          <EndpointCard method="GET" path="/api/v1/payments" description="List payment history" scopes={['payments:read']}>
            <p className="text-sm mb-2">Query parameters: <code>leaseId</code>, <code>tenantId</code>, <code>status</code>, <code>startDate</code>, <code>endDate</code></p>
          </EndpointCard>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-4">Maintenance</h3>
        <div className="space-y-2">
          <EndpointCard method="GET" path="/api/v1/maintenance" description="List maintenance tickets" scopes={['maintenance:read']}>
            <p className="text-sm mb-2">Query parameters: <code>unitId</code>, <code>status</code>, <code>priority</code></p>
          </EndpointCard>
          <EndpointCard method="POST" path="/api/v1/maintenance" description="Create a ticket" scopes={['maintenance:write']}>
            <p className="text-sm mb-2">Required fields: <code>title</code>, <code>description</code></p>
          </EndpointCard>
        </div>
      </section>

      {/* Code Examples */}
      <section id="code-examples" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Code Examples</h2>

        <Tabs defaultValue="curl" className="w-full">
          <TabsList>
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>

          <TabsContent value="curl" className="mt-4">
            <CodeBlock code={`# List properties
curl -X GET "https://your-domain.com/api/v1/properties" \\
  -H "Authorization: Bearer pk_live_your_api_key"

# Create a maintenance ticket
curl -X POST "https://your-domain.com/api/v1/maintenance" \\
  -H "Authorization: Bearer pk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "unitId": "uuid-here",
    "title": "Broken AC",
    "description": "Air conditioning not working",
    "priority": "high"
  }'`} />
          </TabsContent>

          <TabsContent value="javascript" className="mt-4">
            <CodeBlock code={`const API_KEY = 'pk_live_your_api_key';
const BASE_URL = 'https://your-domain.com/api/v1';

// List properties
async function listProperties() {
  const response = await fetch(\`\${BASE_URL}/properties\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
    },
  });
  return response.json();
}

// Create maintenance ticket
async function createTicket(unitId, title, description) {
  const response = await fetch(\`\${BASE_URL}/maintenance\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ unitId, title, description, priority: 'medium' }),
  });
  return response.json();
}`} />
          </TabsContent>

          <TabsContent value="python" className="mt-4">
            <CodeBlock code={`import requests

API_KEY = 'pk_live_your_api_key'
BASE_URL = 'https://your-domain.com/api/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
}

# List properties
def list_properties():
    response = requests.get(f'{BASE_URL}/properties', headers=headers)
    return response.json()

# Create maintenance ticket
def create_ticket(unit_id, title, description):
    data = {
        'unitId': unit_id,
        'title': title,
        'description': description,
        'priority': 'medium',
    }
    response = requests.post(f'{BASE_URL}/maintenance', headers=headers, json=data)
    return response.json()`} />
          </TabsContent>
        </Tabs>
      </section>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <Link href="/docs/webhooks">Set Up Webhooks</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/settings">Create API Key</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

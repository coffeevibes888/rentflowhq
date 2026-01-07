'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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

function CodeBlock({ code }: { code: string }) {
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

const webhookEvents = [
  { event: 'payment.completed', description: 'Rent payment completed successfully' },
  { event: 'payment.failed', description: 'Rent payment failed' },
  { event: 'payment.refunded', description: 'Payment was refunded' },
  { event: 'lease.created', description: 'New lease created' },
  { event: 'lease.signed', description: 'Lease signed by tenant' },
  { event: 'lease.renewed', description: 'Lease was renewed' },
  { event: 'lease.terminated', description: 'Lease was terminated' },
  { event: 'lease.expiring', description: 'Lease expiring soon (30 days)' },
  { event: 'tenant.created', description: 'New tenant added' },
  { event: 'tenant.updated', description: 'Tenant information updated' },
  { event: 'tenant.moved_out', description: 'Tenant moved out' },
  { event: 'application.submitted', description: 'New rental application received' },
  { event: 'application.approved', description: 'Application was approved' },
  { event: 'application.rejected', description: 'Application was rejected' },
  { event: 'maintenance.created', description: 'New maintenance ticket created' },
  { event: 'maintenance.updated', description: 'Ticket status updated' },
  { event: 'maintenance.resolved', description: 'Ticket was resolved' },
  { event: 'work_order.created', description: 'New work order created' },
  { event: 'work_order.assigned', description: 'Work order assigned to contractor' },
  { event: 'work_order.completed', description: 'Work order completed' },
  { event: 'property.created', description: 'New property added' },
  { event: 'property.updated', description: 'Property information updated' },
  { event: 'unit.created', description: 'New unit added' },
  { event: 'unit.available', description: 'Unit became available' },
  { event: 'unit.occupied', description: 'Unit is now occupied' },
];

export default function WebhooksPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/docs" className="hover:text-foreground">Docs</Link>
        <span>/</span>
        <span className="text-foreground">Webhooks</span>
      </div>

      <h1 className="text-4xl font-bold mb-4">Webhooks</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Receive real-time notifications when events occur in your account.
      </p>

      {/* Table of Contents */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">On this page</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li><a href="#setup" className="text-primary hover:underline">Setting Up Webhooks</a></li>
            <li><a href="#payload" className="text-primary hover:underline">Webhook Payload</a></li>
            <li><a href="#verification" className="text-primary hover:underline">Signature Verification</a></li>
            <li><a href="#events" className="text-primary hover:underline">Available Events</a></li>
            <li><a href="#retries" className="text-primary hover:underline">Retry Policy</a></li>
            <li><a href="#example" className="text-primary hover:underline">Example Handler</a></li>
          </ul>
        </CardContent>
      </Card>

      {/* Setup */}
      <section id="setup" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Setting Up Webhooks</h2>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium shrink-0">1</span>
            <div>
              <p className="font-medium">Navigate to Webhook Settings</p>
              <p className="text-sm text-muted-foreground">Go to Admin → Settings → Webhooks</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium shrink-0">2</span>
            <div>
              <p className="font-medium">Add Endpoint URL</p>
              <p className="text-sm text-muted-foreground">Enter your HTTPS endpoint URL (HTTP not allowed)</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium shrink-0">3</span>
            <div>
              <p className="font-medium">Select Events</p>
              <p className="text-sm text-muted-foreground">Choose which events you want to receive</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium shrink-0">4</span>
            <div>
              <p className="font-medium">Save the Secret</p>
              <p className="text-sm text-muted-foreground">Copy and securely store the webhook secret (only shown once)</p>
            </div>
          </li>
        </ol>
      </section>

      {/* Payload */}
      <section id="payload" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Webhook Payload</h2>
        <p className="text-muted-foreground mb-4">
          All webhooks are sent as POST requests with a JSON payload:
        </p>
        <CodeBlock code={`{
  "id": "evt_abc123def456",
  "type": "payment.completed",
  "created": 1704067200,
  "data": {
    "paymentId": "pay_xyz789",
    "amount": 1500.00,
    "tenantId": "usr_tenant123",
    "leaseId": "lease_456"
  },
  "landlordId": "land_789"
}`} />

        <h3 className="text-lg font-semibold mt-6 mb-3">Headers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Header</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">X-Webhook-Signature</code></td>
                <td className="py-2 text-muted-foreground">HMAC signature for verification</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">X-Webhook-Id</code></td>
                <td className="py-2 text-muted-foreground">Unique webhook delivery ID</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">X-Webhook-Event</code></td>
                <td className="py-2 text-muted-foreground">Event type</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4"><code className="bg-muted px-1 rounded">Content-Type</code></td>
                <td className="py-2 text-muted-foreground">application/json</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Verification */}
      <section id="verification" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Signature Verification</h2>
        <p className="text-muted-foreground mb-4">
          Always verify webhook signatures to ensure they&apos;re authentic. The signature header format is:
        </p>
        <CodeBlock code={`t=1704067200,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd`} />

        <p className="text-muted-foreground mt-4 mb-4">
          To verify:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li>Extract the timestamp (<code className="bg-muted px-1 rounded">t</code>) and signature (<code className="bg-muted px-1 rounded">v1</code>)</li>
          <li>Check the timestamp is within 5 minutes of current time</li>
          <li>Compute HMAC-SHA256 of <code className="bg-muted px-1 rounded">{'{timestamp}.{payload}'}</code> using your secret</li>
          <li>Compare with the provided signature</li>
        </ol>

        <Tabs defaultValue="node" className="w-full">
          <TabsList>
            <TabsTrigger value="node">Node.js</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
          </TabsList>

          <TabsContent value="node" className="mt-4">
            <CodeBlock code={`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t=')).slice(2);
  const sig = parts.find(p => p.startsWith('v1=')).slice(3);
  
  // Check timestamp (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }
  
  // Verify signature
  const signedPayload = \`\${timestamp}.\${payload}\`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return sig === expectedSig;
}`} />
          </TabsContent>

          <TabsContent value="python" className="mt-4">
            <CodeBlock code={`import hmac
import hashlib
import time

def verify_webhook_signature(payload, signature, secret):
    parts = dict(p.split('=') for p in signature.split(','))
    timestamp = int(parts.get('t', 0))
    sig = parts.get('v1', '')
    
    # Check timestamp (within 5 minutes)
    now = int(time.time())
    if abs(now - timestamp) > 300:
        return False
    
    # Verify signature
    signed_payload = f"{timestamp}.{payload}"
    expected_sig = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(sig, expected_sig)`} />
          </TabsContent>
        </Tabs>
      </section>

      {/* Events */}
      <section id="events" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Available Events</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Event</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {webhookEvents.map(({ event, description }) => (
                <tr key={event} className="border-b">
                  <td className="py-2 pr-4">
                    <code className="bg-muted px-1 rounded text-xs">{event}</code>
                  </td>
                  <td className="py-2 text-muted-foreground">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Retries */}
      <section id="retries" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Retry Policy</h2>
        <p className="text-muted-foreground mb-4">
          Failed webhooks (non-2xx response or timeout) are automatically retried with exponential backoff:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Badge variant="outline">Attempt 2</Badge>
            <span className="text-muted-foreground">1 minute after failure</span>
          </li>
          <li className="flex items-center gap-2">
            <Badge variant="outline">Attempt 3</Badge>
            <span className="text-muted-foreground">5 minutes after failure</span>
          </li>
          <li className="flex items-center gap-2">
            <Badge variant="outline">Attempt 4</Badge>
            <span className="text-muted-foreground">30 minutes after failure</span>
          </li>
          <li className="flex items-center gap-2">
            <Badge variant="outline">Attempt 5</Badge>
            <span className="text-muted-foreground">2 hours after failure</span>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          After 5 failed attempts, the webhook is marked as failed. Endpoints with 10+ consecutive failures are automatically disabled.
        </p>
      </section>

      {/* Example */}
      <section id="example" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold mb-4">Example Handler</h2>
        <p className="text-muted-foreground mb-4">
          Here&apos;s a complete example webhook handler using Express.js:
        </p>
        <CodeBlock code={`const express = require('express');
const crypto = require('crypto');

const app = express();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Use raw body for signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

app.post('/webhooks/property-manager', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();

  // Verify signature
  if (!verifySignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);
  console.log('Received:', event.type);

  // Handle event
  switch (event.type) {
    case 'payment.completed':
      // Update your records
      break;
    case 'lease.created':
      // Trigger onboarding
      break;
    case 'maintenance.created':
      // Create ticket in helpdesk
      break;
  }

  // Always respond 200 to acknowledge
  res.status(200).json({ received: true });
});

app.listen(3000);`} />
      </section>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>✓ Always verify webhook signatures</li>
            <li>✓ Respond with 200 quickly, process async if needed</li>
            <li>✓ Handle duplicate deliveries (use event ID for idempotency)</li>
            <li>✓ Log webhook payloads for debugging</li>
            <li>✓ Set up monitoring for webhook failures</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

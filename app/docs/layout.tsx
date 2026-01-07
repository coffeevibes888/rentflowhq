import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Enterprise API and Webhooks documentation for developers',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

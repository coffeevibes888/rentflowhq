import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Contractor Marketplace',
    template: '%s | PropertyFlowHQ',
  },
  description: 'Find trusted contractors for your property maintenance and repair needs.',
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {children}
    </div>
  );
}

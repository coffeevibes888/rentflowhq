import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, AlertTriangle } from 'lucide-react';

export default async function ContractorProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'contractor') {
    return redirect('/');
  }

  // For now, show a coming soon message until the migration is run
  // Once ContractorProfile table exists, this will redirect to branding
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-600">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your public profile and branding</p>
      </div>

      <Card className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 border-gray-300">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Palette className="h-6 w-6 text-gray-900" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Contractor Marketplace Profile</h2>
              <p className="text-violet-100 mb-4">
                Create your public profile to appear in the contractor marketplace. 
                Clients will be able to view your portfolio, read reviews, and request quotes.
              </p>
              <Link href="/contractor/profile/branding">
                <Button className="bg-white text-violet-600 hover:bg-violet-50">
                  Set Up My Profile
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-500/10 border-amber-400/30">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 font-medium">Database Migration Required</p>
            <p className="text-amber-200/70 text-sm mt-1">
              If you see an error when clicking &quot;Set Up My Profile&quot;, the database needs to be updated. 
              Run: <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">npx prisma migrate dev</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

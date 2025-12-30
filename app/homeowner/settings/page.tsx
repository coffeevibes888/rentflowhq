import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Bell, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function HomeownerSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'homeowner') {
    return redirect('/');
  }

  const settingsSections = [
    {
      title: 'Profile',
      description: 'Update your personal information',
      icon: User,
      href: '/homeowner/settings/profile',
    },
    {
      title: 'Notifications',
      description: 'Manage email and push notifications',
      icon: Bell,
      href: '/homeowner/settings/notifications',
    },
    {
      title: 'Privacy & Security',
      description: 'Password and security settings',
      icon: Shield,
      href: '/homeowner/settings/security',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account preferences</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {session.user.name?.charAt(0) || 'H'}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{session.user.name}</p>
                <p className="text-sm text-slate-500">{session.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="bg-white/80 backdrop-blur-sm border-white/20 hover:border-sky-300 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{section.title}</p>
                      <p className="text-sm text-slate-500">{section.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-red-200">
          <CardContent className="p-4">
            <Link href="/api/auth/signout">
              <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

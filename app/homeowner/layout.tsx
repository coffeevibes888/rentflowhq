import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { HousePlus, Briefcase, Wrench, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function HomeownerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return redirect('/sign-in');
  }

  if (session.user.role !== 'homeowner') {
    return redirect('/');
  }

  const navItems = [
    { href: '/homeowner/dashboard', label: 'Dashboard', icon: HousePlus },
    { href: '/homeowner/jobs', label: 'My Jobs', icon: Briefcase },
    { href: '/contractors', label: 'Find Contractors', icon: Wrench },
    { href: '/homeowner/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/homeowner/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 flex items-center justify-center">
                <HousePlus className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900">PropertyFlow</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 hidden sm:block">
                {session.user.name}
              </span>
              <Link href="/api/auth/signout">
                <Button variant="ghost" size="sm" className="text-slate-500">
                  <LogOut className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm" className="text-slate-600 whitespace-nowrap">
                  <Icon className="h-4 w-4 mr-1" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      {children}
    </div>
  );
}

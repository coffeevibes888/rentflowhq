import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { HousePlus, Briefcase, Wrench, Settings, LogOut, Scale } from 'lucide-react';
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
    { href: '/homeowner/disputes', label: 'Disputes', icon: Scale },
    { href: '/homeowner/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-600 via-blue-600 to-sky-700">
      {/* Top Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/homeowner/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <HousePlus className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-white">PropertyFlow</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-white/80 hidden sm:block">
                {session.user.name}
              </span>
              <Link href="/api/auth/signout">
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                  <LogOut className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-white/10 px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 whitespace-nowrap">
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

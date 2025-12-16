import { Button } from '@/components/ui/button';
import ModeToggle from './mode-toggle';
import Link from 'next/link';
import { EllipsisVertical, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import UserButton from './user-button';
import NotificationBell from './notification-bell';
import { auth } from '@/auth';

const Menu = async () => {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  const userRole = session?.user?.role;
  
  let dashboardLabel = 'Dashboard';
  let dashboardLink = '/';
  
  if (userRole === 'tenant') {
    dashboardLabel = 'Tenant Dashboard';
    dashboardLink = '/user/dashboard';
  } else if (userRole === 'landlord' || userRole === 'admin' || userRole === 'superAdmin') {
    dashboardLabel = 'Landlord Dashboard';
    dashboardLink = '/admin/overview';
  } else if (userRole === 'property_manager') {
    dashboardLabel = 'Property Manager Dashboard';
    dashboardLink = '/admin/overview';
  }
  
  return (
    <div className='flex justify-end gap-3'>
      <nav className='hidden md:flex w-full max-w-xs gap-1 items-center'>
        <ModeToggle />
        <NotificationBell isAdmin={isAdmin} />
        
        {session && (
          <Button asChild variant='ghost' className='text-white hover:text-white/70 hover:bg-white/10'>
            <Link href={dashboardLink} className='flex items-center gap-2'>
              <LayoutDashboard className='h-4 w-4' />
              {dashboardLabel}
            </Link>
          </Button>
        )}
        
        <UserButton />
      </nav>
      <nav className='md:hidden'>
        <Sheet>
          <SheetTrigger className='align-middle text-white'>
            <EllipsisVertical />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start bg-gradient-to-r from-blue-900 to-indigo-600 text-white'>
            <SheetTitle className='text-white'>Menu</SheetTitle>
            <ModeToggle />
            <NotificationBell isAdmin={isAdmin} />
            <Link href='/' className="m-2.5 px-1 hover:text-white/70 hover:underline transition-colors">Home</Link>
            <Link href='/search?category=all' className="m-2.5 px-1 hover:text-white/70 hover:underline transition-colors">Listings</Link>
            <Link href='/about' className="m-2.5 px-1 hover:text-white/70 hover:underline transition-colors">About</Link>
            <Link href='/contact' className="m-2.5 px-1 hover:text-white/70 hover:underline transition-colors">Contact</Link>
            <UserButton />
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;

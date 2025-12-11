import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import ModeToggle from './mode-toggle';
import Link from 'next/link';
import { EllipsisVertical, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription,SheetTitle,SheetTrigger,} from '@/components/ui/sheet';
import UserButton from './user-button';
import NotificationBell from './notification-bell';
import { auth } from '@/auth';

const Menu = async () => {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  const userRole = session?.user?.role;
  
  // Determine dashboard label and link based on role
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
        {/* <ModeToggle /> */}
        <NotificationBell isAdmin={isAdmin} />
        
        {/* Dashboard Link - Only on Desktop */}
        {session && (
          <Button asChild variant='ghost' className='text-slate-200 hover:text-white'>
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
          <SheetTrigger className='align-middle'>
            <EllipsisVertical />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start bg-linear-to-r from-slate-700 via-violet-600 to-stone-900'>
            <SheetTitle></SheetTitle>
            {/* <ModeToggle /> */}
            <NotificationBell isAdmin={isAdmin} />
            <Button asChild variant='ghost' className='w-full justify-start'>
              <Link href='/'>Home</Link>
            </Button>
            <Button asChild variant='ghost' className='w-full justify-start'>
              <Link href='/about'>About</Link>
            </Button>
            <Button asChild variant='ghost' className='w-full justify-start'>
              <Link href='/blog'>Blog</Link>
            </Button>
            <Button asChild variant='ghost' className='w-full justify-start'>
              <Link href='/contact'>Contact</Link>
            </Button>
            {/* Dashboard link NOT shown on mobile - only in sidebar */}
            <UserButton />
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;

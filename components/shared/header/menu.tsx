import { Button } from '@/components/ui/button';
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
  } else if (userRole === 'agent') {
    dashboardLabel = 'Agent Dashboard';
    dashboardLink = '/agent/dashboard';
  } else if (userRole === 'contractor') {
    dashboardLabel = 'Contractor Dashboard';
    dashboardLink = '/contractor/dashboard';
  } else if (userRole === 'homeowner') {
    dashboardLabel = 'Homeowner Dashboard';
    dashboardLink = '/homeowner/dashboard';
  }
  
  return (
    <div className='flex justify-end gap-3 text-black'>
      <nav className='hidden md:flex w-full max-w-xs gap-1 items-center'>
        <NotificationBell isAdmin={isAdmin} />
        
        {session && (
          <Button asChild variant='ghost' className='text-black hover:text-black/70 hover:bg-gray-100'>
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
          <SheetTrigger className='align-middle text-black'>
            <EllipsisVertical />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start bg-gradient-to-r from-sky-500 via-cyan-200 to-sky-500 text-white font-bold'>
            <SheetTitle className='text-black font-bold'>Menu</SheetTitle>
            <NotificationBell isAdmin={isAdmin} />
          <Link href='/' className="px-2.5 py-1.5 text-white hover:underline">Home</Link>
          <Link href='/listings' className="px-2.5 py-1.5 text-white hover:underline">Listings</Link>
          {/* <Link href='/about' className="px-2.5 py-1.5 text-white hover:underline">About Me</Link> */}
          <Link href='/contractors' className="px-2.5 py-1.5 text-white hover:underline">Contractor Marketplace</Link>
            
            {/* Resources Section */}
            <div className="mt-4 mb-2 px-1 text-xs uppercase tracking-wider text-black font-bold">Resources</div>
            <Link href='/faq' className="m-2.5 px-1 hover:text-white/70 hover:underline transition-colors">FAQs</Link>
            <Link href='/docs/api' className="m-2.5 px-1 hover:text-white/70 hover:underline transition-colors">API & Webhooks</Link>
            <Link href='/affiliate-program' className="m-2.5 px-1 hover:text-white/70 hover:underline transition-colors">Affiliate Program</Link>
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

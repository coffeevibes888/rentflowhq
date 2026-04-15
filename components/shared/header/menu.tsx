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
          <SheetContent className='flex flex-col items-start bg-white text-black w-[280px]'>
            <SheetTitle className='text-base font-bold text-black'>Menu</SheetTitle>
            <div className='w-full flex flex-col gap-1 mt-2'>
              <NotificationBell isAdmin={isAdmin} />
              {session && (
                <Link href={dashboardLink} className='flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-100 text-black font-semibold text-sm hover:bg-slate-200 transition-colors'>
                  <LayoutDashboard className='h-4 w-4 text-slate-600' />
                  {dashboardLabel}
                </Link>
              )}
              <div className='border-t border-slate-200 my-2' />
              <Link href='/' className='px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors'>Home</Link>
              <Link href='/listings' className='px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors'>Listings</Link>
              <Link href='/contractors' className='px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors'>Contractor Marketplace</Link>
              <div className='border-t border-slate-200 my-2' />
              <p className='px-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold'>Resources</p>
              <Link href='/faq' className='px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors'>FAQs</Link>
              <Link href='/docs/api' className='px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors'>API & Webhooks</Link>
              <Link href='/affiliate-program' className='px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors'>Affiliate Program</Link>
              <Link href='/contact' className='px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors'>Contact</Link>
              <div className='border-t border-slate-200 my-2' />
              <UserButton />
            </div>
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;

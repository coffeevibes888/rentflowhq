import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import ModeToggle from './mode-toggle';
import Link from 'next/link';
import { EllipsisVertical } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription,SheetTitle,SheetTrigger,} from '@/components/ui/sheet';
import UserButton from './user-button';
import NotificationBell from './notification-bell';
import { auth } from '@/auth';

const Menu = async () => {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  return (
    <div className='flex justify-end gap-3'>
      <nav className='hidden md:flex w-full max-w-xs gap-1'>
        {/* <ModeToggle /> */}
        <NotificationBell isAdmin={isAdmin} />
        {/* {isSuperAdmin && (
          <Button asChild variant='ghost'>
            <Link href='/super-admin'>Monitoring</Link>
          </Button>
        )} */}
        {/* <Button asChild variant='ghost' className='relative'>
          <Link href='/cart' className='relative flex items-center gap-1'>
            <div className='relative'>
              <ShoppingCart />
              {cartItemCount > 0 && (
                <Badge variant='destructive' className='absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full'>
                  {cartItemCount}
                </Badge>
              )}
            </div>
            Cart
          </Link>
        </Button> */}
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
            <UserButton />
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;

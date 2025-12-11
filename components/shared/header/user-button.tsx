import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/auth';
import SignOutButton from './sign-out-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserIcon } from 'lucide-react';

const UserButton = async () => {
  const session = await auth();

  if (!session) {
    return (
      <Button asChild>
        <Link href='/sign-in'>
          <UserIcon /> Sign In
        </Link>
      </Button>
    );
  }

  const firstInitial = session.user?.name?.charAt(0).toUpperCase() ?? 'U';
  const userImage = session.user?.image;

  return (
    <div className='flex gap-2 items-center'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className='flex items-center'>
            {userImage ? (
              <div className='relative w-8 h-8 rounded-full overflow-hidden border border-gray-300 ml-2 cursor-pointer'>
                <Image
                  src={userImage}
                  alt={session.user?.name || 'User avatar'}
                  fill
                  className='object-cover'
                  priority
                />
              </div>
            ) : (
              <Button
                variant='ghost'
                className='w-8 h-8 rounded-full ml-2 flex items-center justify-center bg-gray-200'
              >
                {firstInitial}
              </Button>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <div className='text-sm font-medium leading-none'>
                {session.user?.name}
              </div>
              <div className='text-sm text-muted-foreground leading-none'>
                {session.user?.email}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuItem asChild className='p-0 mb-1'>
            <SignOutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;

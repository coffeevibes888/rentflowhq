import { Metadata } from 'next';
import { auth } from '@/auth';
import { SessionProvider } from 'next-auth/react';
import ProfileForm from './profile-form';

export const metadata: Metadata = {
  title: 'Customer Profile',
};

const Profile = async () => {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <div className='w-full min-h-screen px-4 py-8 md:px-8'>
        <div className='max-w-7xl mx-auto space-y-8'>
          <div>
            <h1 className='text-4xl md:text-5xl font-bold text-white mb-2'>Profile Settings</h1>
            <p className='text-gray-300'>Manage your account information and preferences</p>
          </div>
          <ProfileForm />
        </div>
      </div>
    </SessionProvider>
  );
};

export default Profile;

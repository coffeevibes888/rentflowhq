import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import SessionProviderWrapper from '@/components/session-provider-wrapper';

export default function ContractorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviderWrapper>
      <div className='flex min-h-screen flex-col bg-gradient-to-r from-rose-400 via-pink-400 to-rose-600'>
        <Header />
        <main className='flex-1 px-4 md:px-8 py-6'>
          <div className='mx-auto max-w-5xl w-full'>
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </SessionProviderWrapper>
  );
}

import Header from '@/components/shared/header';
import Footer from '@/components/footer';
import SessionProviderWrapper from '@/components/session-provider-wrapper';

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SessionProviderWrapper>
  );
}

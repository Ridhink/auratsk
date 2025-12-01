import { getCurrentUser, getCurrentOrganization } from '@/lib/auth/clerk';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const org = await getCurrentOrganization();

  return (
    <div className="min-h-screen bg-gray-950 dark:bg-[#171725] text-white">
      {/* Fixed Header Only */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950 dark:bg-[#171725]">
        <Header userName={user?.name} organizationName={org?.name} />
      </div>

      {/* Scrollable Content */}
      <div className="pt-[56px] sm:pt-[64px] flex flex-col min-h-screen">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}


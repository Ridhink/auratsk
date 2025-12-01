import { getCurrentUser, getCurrentOrganization } from '@/lib/auth/clerk';
import Header from '@/components/layout/Header';

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const org = await getCurrentOrganization();

  return (
    <div className="min-h-screen bg-gray-950 dark:bg-[#171725] text-white flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950 dark:bg-[#171725]">
        <Header userName={user?.name} organizationName={org?.name} />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pt-[56px] sm:pt-[64px]">
        {children}
      </div>
    </div>
  );
}


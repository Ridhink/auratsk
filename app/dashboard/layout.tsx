import { getCurrentUser, getCurrentOrganization } from '@/lib/auth/clerk';
import { getTrialStatus } from '@/lib/db/actions';
import Header from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const org = await getCurrentOrganization();
  const trialStatus = org ? await getTrialStatus() : null;

  return (
    <div className="min-h-screen bg-gray-950 dark:bg-[#171725] text-white flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950 dark:bg-[#171725]">
        <Header userName={user?.name} organizationName={org?.name} />

        {/* Trial Banner */}
        {trialStatus && trialStatus.isActive && (
          <div className="bg-gradient-to-r from-purple-600/20 to-teal-600/20 border-b border-purple-500/30 py-2 sm:py-3">
            <div className="container mx-auto px-3 sm:px-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white font-medium text-center">
                    20-day Free Trial: Active ({trialStatus.daysRemaining} days remaining)
                  </span>
                </div>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="text-gray-300 text-center">Full access to all features</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className={`flex-1 overflow-y-auto ${trialStatus && trialStatus.isActive ? 'pt-[104px] sm:pt-[112px]' : 'pt-[56px] sm:pt-[64px]'}`}>
        {children}
      </div>
    </div>
  );
}


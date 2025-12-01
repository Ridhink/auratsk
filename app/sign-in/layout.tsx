import Header from '@/components/layout/Header';

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 dark:bg-[#171725] text-white">
      {/* Scrollable Content - No header for sign-in page */}
      <div className="flex items-center justify-center min-h-screen">
        {children}
      </div>
    </div>
  );
}


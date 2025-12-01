import Header from '@/components/layout/Header';

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 dark:bg-[#171725] text-white">
      {/* Header */}
      <Header />
      {children}
    </div>
  );
}


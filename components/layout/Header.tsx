"use client";

import { useState, useEffect } from 'react';
import { UserButton, useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from './MobileNav';

interface HeaderProps {
  userName?: string;
  organizationName?: string;
}

export default function Header({ userName: propUserName, organizationName: propOrgName }: HeaderProps) {
  const pathname = usePathname();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Use props if provided, otherwise fall back to Clerk user
  const userName = propUserName || clerkUser?.fullName || clerkUser?.firstName || undefined;
  const organizationName = propOrgName || clerkUser?.publicMetadata?.organizationName as string | undefined;

  // Fetch current user role for navigation filtering
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Base navigation items
  const allNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📋' },
    { href: '/members', label: 'Members', icon: '👥' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  // Filter navigation based on role
  // Employees cannot see Members page
  const navItems = currentUser && currentUser.role === 'EMPLOYEE'
    ? allNavItems.filter(item => item.href !== '/members')
    : allNavItems;

  const isActive = (href: string) => pathname === href;

  return (
    <header className="border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-sm z-50">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 min-h-[56px]">
          {/* Logo and Branding */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
            <Link href="/dashboard" className="flex items-center gap-1 sm:gap-2 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent truncate">
                AuraTask
              </h1>
              <span className="hidden sm:inline text-xs text-gray-400 font-normal">AI-Powered</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Navigation */}
            <MobileNav />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            {/* User Info - Desktop Only */}
            {userName && (
              <div className="hidden xl:flex items-center gap-3 text-sm">
                <div className="flex flex-col items-end max-w-[120px]">
                  <span className="text-white font-medium truncate">{userName}</span>
                  {organizationName && (
                    <span className="text-gray-400 text-xs truncate">{organizationName}</span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button - Desktop */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-2 px-3 lg:px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-700/50 hover:border-purple-500/30"
              title="Sign out"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden xl:inline">Sign Out</span>
            </button>

            {/* User Button */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border border-purple-500/20",
                  userButtonPopoverCard: "bg-gray-900 border-purple-500/20",
                  userButtonPopoverActionButton: "text-gray-300 hover:bg-gray-800",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}


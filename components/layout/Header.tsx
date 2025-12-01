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
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Hide header if user is not authenticated
  if (isLoaded && !clerkUser) {
    return null;
  }
  
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
      router.push('/');
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
    <header className="sticky top-0 border-b border-purple-800/10 bg-gray-900/95 backdrop-blur-md z-50 shadow-lg shadow-black/10">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 min-h-[56px]">
          {/* Logo and Branding */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6 lg:gap-8 min-w-0 flex-1">
            <Link href={clerkUser ? "/dashboard" : "/"} className="flex items-center gap-1.5 sm:gap-2 min-w-0 group">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent truncate transition-all duration-300 group-hover:scale-105">
                AuraTask
              </h1>
              <span className="hidden sm:inline text-[10px] sm:text-xs text-gray-400 font-normal">AI-Powered</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 lg:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${
                    isActive(item.href)
                      ? 'bg-purple-800/15 text-purple-200 border border-purple-800/20 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <span className="mr-1.5 sm:mr-2 text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Navigation */}
            <MobileNav />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-shrink-0">
            {/* User Info - Desktop Only */}
            {userName && (
              <div className="hidden xl:flex items-center gap-2 lg:gap-3 text-sm">
                <div className="flex flex-col items-end max-w-[140px] lg:max-w-[180px]">
                  <span className="text-gray-200 font-medium truncate text-xs lg:text-sm">{userName}</span>
                  {organizationName && (
                    <span className="text-gray-400 text-[10px] lg:text-xs truncate">{organizationName}</span>
                  )}
                </div>
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-purple-800 to-teal-800 flex items-center justify-center text-gray-200 text-xs font-bold flex-shrink-0 shadow-md">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ThemeToggle />
            </div>

            {/* Logout Button - Desktop */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg transition-all duration-200 border border-gray-700/50 hover:border-purple-800/20 min-h-[44px]"
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
            <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 sm:w-10 sm:h-10 border border-purple-800/15 shadow-md",
                    userButtonPopoverCard: "bg-gray-900 border-purple-800/15",
                    userButtonPopoverActionButton: "text-gray-300 hover:bg-gray-800 min-h-[44px]",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


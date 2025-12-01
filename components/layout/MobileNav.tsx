"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

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
      setIsOpen(false);
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
    <div className="md:hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-gray-900 border-b border-purple-500/20 shadow-lg z-50">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            {/* User Info in Mobile Menu */}
            {user && (
              <div className="pt-4 mt-4 border-t border-gray-700/50">
                <div className="px-4 py-2 text-sm text-gray-400">
                  <div className="font-medium text-white">{user.fullName || user.firstName}</div>
                  {user.primaryEmailAddress && (
                    <div className="text-xs text-gray-500">{user.primaryEmailAddress.emailAddress}</div>
                  )}
                </div>
              </div>
            )}

            {/* Logout Button in Mobile Menu */}
            <button
              onClick={handleLogout}
              className="w-full mt-2 px-4 py-3 rounded-lg transition-colors text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-900/30 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}


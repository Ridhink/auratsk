"use client";

import { useState } from "react";
import { createInvite } from "@/lib/db/actions";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";

interface InviteMemberProps {
  userRole: string;
  onInviteSent: () => void;
}

export default function InviteMember({ userRole, onInviteSent }: InviteMemberProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MANAGER" | "EMPLOYEE">("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  const canInviteManagers = userRole === "OWNER" || userRole === "ADMIN";
  const canInvite = canInviteManagers || userRole === "MANAGER";

  if (!canInvite) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const { inviteLink } = await createInvite(email.trim(), role);
      showNotification(`Invite sent to ${email}! Link: ${inviteLink}`, "success");
      setEmail("");
      setRole("EMPLOYEE");
      setIsOpen(false);
      onInviteSent();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : "Failed to send invite", "error");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-800 hover:bg-purple-900 rounded-lg text-gray-200 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
      >
        <span className="hidden sm:inline">Invite Member</span>
        <span className="sm:hidden">Invite</span>
      </button>
    );
  }

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] w-full max-w-md px-4">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={clearNotification}
          />
        </div>
      )}

      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-gray-900 border border-purple-800/20 rounded-xl shadow-2xl p-5 sm:p-6 lg:p-8 max-w-md w-full animate-fade-in-scale max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-200">Invite Team Member</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Send an invitation to join your team</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 focus:border-purple-500/50 min-h-[44px]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "MANAGER" | "EMPLOYEE")}
                className="w-full px-4 py-2.5 bg-gray-800 border border-purple-800/15 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-800/30 transition-all duration-200 focus:border-purple-800/25 min-h-[44px] cursor-pointer"
                disabled={!canInviteManagers && role === "MANAGER"}
              >
                <option value="EMPLOYEE">Employee</option>
                {canInviteManagers && <option value="MANAGER">Manager</option>}
              </select>
              {!canInviteManagers && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Only Admins can invite Managers
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-200 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0 min-h-[44px] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}


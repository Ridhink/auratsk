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
        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
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
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl p-6 max-w-md w-full animate-fade-in-scale">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Invite Team Member</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "MANAGER" | "EMPLOYEE")}
                className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                disabled={!canInviteManagers && role === "MANAGER"}
              >
                <option value="EMPLOYEE">Employee</option>
                {canInviteManagers && <option value="MANAGER">Manager</option>}
              </select>
              {!canInviteManagers && (
                <p className="text-xs text-gray-500 mt-1">Only Admins can invite Managers</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}


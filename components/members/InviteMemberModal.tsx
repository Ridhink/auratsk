"use client";

import { useState } from "react";
import { createInvite } from "@/lib/db/invites";
import { useToast } from "@/components/ui/ToastProvider";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: () => void;
  currentUserRole: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInviteSent,
  currentUserRole,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "EMPLOYEE">("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const { showToast } = useToast();

  // Managers can only invite employees
  const availableRoles =
    currentUserRole === "ADMIN"
      ? [
          { value: "ADMIN", label: "Administrator" },
          { value: "MANAGER", label: "Manager" },
          { value: "EMPLOYEE", label: "Employee" },
        ]
      : [{ value: "EMPLOYEE", label: "Employee" }];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await createInvite(email.trim(), role);
      setInviteLink(result.inviteLink);
      showToast("Invitation sent successfully!", "success");
      onInviteSent();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to send invitation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("EMPLOYEE");
    setInviteLink(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Invite Team Member</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {inviteLink ? (
          <div className="space-y-4">
            <div className="bg-teal-900/20 border border-teal-500/30 rounded-lg p-4">
              <p className="text-teal-400 text-sm font-medium mb-2">Invitation sent!</p>
              <p className="text-gray-300 text-sm mb-3">Share this link with {email}:</p>
              <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-transparent text-white text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    showToast("Link copied to clipboard!", "success");
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {currentUserRole === "MANAGER" && (
                <p className="text-xs text-gray-500 mt-1">Managers can only invite employees</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


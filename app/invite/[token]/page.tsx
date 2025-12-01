"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { addMemberViaInvite } from "@/lib/db/actions";

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      if (!params.token) return;
      
      try {
        const response = await fetch(`/api/invites?token=${params.token}`);
        if (!response.ok) {
          setError("Invalid or expired invite link");
          setLoading(false);
          return;
        }
        const inviteData = await response.json();
        setInvite(inviteData);
      } catch (err) {
        setError("Failed to load invite");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [params.token]);

  const handleAccept = async () => {
    if (!user || !invite) return;

    setAccepting(true);
    try {
      await addMemberViaInvite(
        invite.token,
        user.id,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'User'
      );
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
      setAccepting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="flex flex-col items-center gap-4 animate-bounce-in">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-200 animate-pulse">Loading invitation...</div>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 sm:p-8 max-w-md w-full text-center animate-fade-in-scale">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-red-400 mb-3">Invalid Invite</h2>
          <p className="text-gray-300 mb-6 text-sm sm:text-base">{error}</p>
          <a
            href="/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-800 hover:bg-purple-900 rounded-lg text-gray-200 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="bg-gray-900 border border-purple-800/20 rounded-xl p-6 sm:p-8 max-w-md w-full text-center animate-fade-in-scale">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-3">Sign In Required</h2>
          <p className="text-gray-300 mb-6 text-sm sm:text-base">Please sign in to accept this invitation.</p>
          <a
            href="/sign-in"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 rounded-lg text-gray-200 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 sm:p-8 max-w-md w-full animate-fade-in-scale">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-800 to-teal-800 flex items-center justify-center text-gray-200 text-2xl font-bold shadow-lg">
            ✉️
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-200 mb-2">Accept Invitation</h2>
          <p className="text-gray-400 text-sm">Join the team and start collaborating</p>
        </div>
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6 animate-slide-down">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        <div className="space-y-4 mb-6 bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-700/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
              <p className="text-gray-200 font-medium truncate">{invite?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-700/50">
            <div className="w-10 h-10 rounded-full bg-teal-700/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                invite?.role === 'MANAGER' ? 'bg-teal-800 text-gray-200' : 'bg-gray-600 text-gray-200'
              }`}>
                {invite?.role === 'MANAGER' ? 'Manager' : 'Employee'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-200 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-900 hover:to-purple-950 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-800/10 hover:-translate-y-0.5 active:translate-y-0 min-h-[44px] flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Accepting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept Invitation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

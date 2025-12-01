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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Invalid Invite</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Sign In Required</h2>
          <p className="text-gray-300 mb-4">Please sign in to accept this invitation.</p>
          <a
            href="/sign-in"
            className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-semibold text-white mb-4">Accept Invitation</h2>
        
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <p className="text-white">{invite?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
            <p className="text-white capitalize">{invite?.role}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {accepting ? "Accepting..." : "Accept Invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}

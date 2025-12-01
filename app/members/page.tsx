"use client";

import { useEffect, useState } from "react";
import { fetchMembers, fetchPerformanceMetrics } from "@/lib/db/actions";
import type { User, PerformanceMetric } from "@/lib/db/schema";
import InviteMember from "@/components/members/InviteMember";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";

export default function MembersPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [monitoring, setMonitoring] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  // Fetch current user via API route (client-safe)
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
    return null;
  };

  const loadData = async () => {
    try {
      const [fetchedMembers, fetchedMetrics, user] = await Promise.all([
        fetchMembers(),
        fetchPerformanceMetrics(),
        fetchCurrentUser(),
      ]);
      
      // Fetch invites via API route (client-safe)
      let fetchedInvites: any[] = [];
      try {
        const response = await fetch('/api/invites');
        if (response.ok) {
          fetchedInvites = await response.json();
        }
      } catch (err) {
        // User might not have permission
        console.log("Could not fetch invites:", err);
      }
      
      setMembers(fetchedMembers);
      setMetrics(fetchedMetrics);
      setInvites(fetchedInvites);
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricForUser = (userId: string): PerformanceMetric | undefined => {
    return metrics.find((m) => m.userId === userId);
  };

  const getWorkloadColor = (tasksCount: number): string => {
    if (tasksCount === 0) return "text-teal-400";
    if (tasksCount <= 2) return "text-green-400";
    if (tasksCount <= 4) return "text-yellow-400";
    return "text-red-400";
  };

  const handleMonitorPerformance = async () => {
    setMonitoring(true);
    try {
      const response = await fetch('/api/performance/monitor', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        showNotification(`Performance monitoring completed! Evaluated ${result.evaluated} member(s).`, "success");
        // Reload data to show updated metrics
        loadData();
      } else {
        showNotification(`Monitoring completed with some errors: ${result.errors?.join(', ') || result.error}`, "error");
        // Still reload to show what was updated
        loadData();
      }
    } catch (error) {
      console.error('Error monitoring performance:', error);
      showNotification('Failed to monitor performance. Please try again.', "error");
    } finally {
      setMonitoring(false);
    }
  };

  const canMonitor = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' || currentUser.role === 'MANAGER');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 dark:bg-[#171725] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Employees cannot view the members page
  if (currentUser && currentUser.role === 'EMPLOYEE') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">
            You do not have permission to view the members page. Employees can only view their own tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 animate-fade-in">
        {/* Notification */}
        {notification && (
          <div className="mb-4 animate-slide-down">
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={clearNotification}
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">Team Members</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {canMonitor && (
              <button
                onClick={handleMonitorPerformance}
                disabled={monitoring}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:opacity-50 rounded-lg text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
                title="Trigger AI performance monitoring for all members"
              >
                {monitoring ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Monitoring...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="hidden sm:inline">Monitor Performance</span>
                    <span className="sm:hidden">Monitor</span>
                  </>
                )}
              </button>
            )}
            {currentUser && (
              <div className="flex-shrink-0">
                <InviteMember
                  userRole={currentUser.role}
                  onInviteSent={loadData}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pending Invites */}
        {invites.filter(i => !i.used).length > 0 && (
          <div className="mb-6 bg-gray-900/50 border border-purple-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Pending Invitations</h3>
            <div className="space-y-2">
              {invites
                .filter(i => !i.used)
                .map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
                  >
                    <div>
                      <p className="text-white text-sm">{invite.email}</p>
                      <p className="text-gray-400 text-xs">
                        Role: {invite.role} • Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-yellow-400">Pending</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {members.map((member, index) => {
            const metric = getMetricForUser(member.id);
            return (
              <div
                key={member.id}
                className="bg-gray-900 border border-purple-500/20 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 animate-fade-in-scale"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Member Info */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>

                {/* Workload */}
                <div className="border-t border-purple-500/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Active Tasks</span>
                    <span className={`text-lg font-bold ${getWorkloadColor(member.tasksCount)}`}>
                      {member.tasksCount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        member.tasksCount === 0
                          ? "bg-teal-500"
                          : member.tasksCount <= 2
                          ? "bg-green-500"
                          : member.tasksCount <= 4
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min((member.tasksCount / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Performance Metrics */}
                {metric && (
                  <div className="border-t border-purple-500/20 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Completion Rate</span>
                      <span className="text-sm font-semibold text-teal-400">
                        {metric.completionRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Avg. Time</span>
                      <span className="text-sm font-semibold text-purple-400">
                        {metric.averageTimeDays.toFixed(1)} days
                      </span>
                    </div>

                    {/* AI Evaluation */}
                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">AI Evaluation</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {metric.lastAIEvaluation}
                      </p>
                    </div>
                  </div>
                )}

                {!metric && (
                  <div className="border-t border-purple-500/20 pt-4">
                    <p className="text-xs text-gray-500">No performance metrics available</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}


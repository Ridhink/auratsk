"use client";

import { useState } from "react";
import type { User } from "@/lib/db/schema";
import { useNotification } from "@/components/ui/useNotification";
import Notification from "@/components/ui/Notification";
import { formatDistanceToNow } from "date-fns";

interface ProfilePageClientProps {
  user: User;
}

export default function ProfilePageClient({ user: initialUser }: ProfilePageClientProps) {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const { notification, showNotification, clearNotification } = useNotification();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update user name via API
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        showNotification("Profile updated successfully!", "success");
      } else {
        const error = await response.json();
        showNotification(error.error || "Failed to update profile", "error");
      }
    } catch (error) {
      showNotification("Failed to update profile", "error");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
  };

  const roleColors: Record<string, string> = {
    OWNER: 'bg-purple-600',
    ADMIN: 'bg-purple-500',
    MANAGER: 'bg-teal-500',
    EMPLOYEE: 'bg-gray-600',
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl animate-fade-in">
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

      <div className="mb-6 animate-slide-in-left">
        <h2 className="text-xl sm:text-2xl font-semibold text-white">My Profile</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Manage your profile information</p>
      </div>

      <div className="bg-gray-900 border border-purple-500/20 rounded-xl p-4 sm:p-6 space-y-6 animate-fade-in-scale transition-all duration-300">
        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-purple-500/20">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Your name"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">{user.name}</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <p className="text-white">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
            <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${roleColors[user.role] || 'bg-gray-600'}`}>
              {roleLabels[user.role] || user.role}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Active Tasks</label>
            <p className="text-white text-lg font-semibold">{user.tasksCount}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Member Since</label>
            <p className="text-white">
              {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Role-specific Information */}
        {user.role === 'EMPLOYEE' && (
          <div className="pt-6 border-t border-purple-500/20">
            <p className="text-sm text-gray-400">
              As an Employee, you can view and update the status of tasks assigned to you. 
              You cannot create new tasks or view other members' tasks.
            </p>
          </div>
        )}

        {user.role === 'MANAGER' && (
          <div className="pt-6 border-t border-purple-500/20">
            <p className="text-sm text-gray-400">
              As a Manager, you can create tasks, view all members' tasks, and manage tasks assigned to employees. 
              You cannot view other managers or invite new members.
            </p>
          </div>
        )}

        {(user.role === 'ADMIN' || user.role === 'OWNER') && (
          <div className="pt-6 border-t border-purple-500/20">
            <p className="text-sm text-gray-400">
              As an Admin, you have full access to manage the organization, invite members and managers, 
              and view all tasks and users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


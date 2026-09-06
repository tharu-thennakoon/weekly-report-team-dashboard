'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Save, Check } from 'lucide-react';
import api from '../../lib/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/users/profile', {
        name,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      await refreshUser();
      setMessage('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['TEAM_MEMBER', 'MANAGER', 'ADMIN']}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal profile and security credentials
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
            <Check className="w-4 h-4" /> {message}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <Card>
            <CardHeader
              title="Personal Information"
              subtitle="Your identity in reports and reviews"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    disabled
                    value={user?.email || ''}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-500 bg-slate-100 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Email cannot be changed.</p>
                </div>
              </div>

              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-700 mb-1">Assigned Role</div>
                <div className="flex items-center gap-2">
                  <Badge status={user?.role} size="md" />
                  <span className="text-xs text-slate-500">
                    {user?.role === 'ADMIN'
                      ? 'Full system administrator access'
                      : user?.role === 'MANAGER'
                      ? 'Team management and report review access'
                      : 'Standard team member access'}
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-1">Change Password</h4>
                <p className="text-xs text-slate-500 mb-4">
                  Leave blank if you do not wish to change your password.
                </p>

                <div className="space-y-3">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="text-xs text-slate-500">
                All changes are applied immediately upon saving.
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}

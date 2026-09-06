'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus,
  History,
  CheckSquare,
  BarChart3,
  Table,
  FolderKanban,
  Users,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAiAssistant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenAiAssistant }) => {
  const pathname = usePathname();
  const { isTeamMember, isManager, isAdmin } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/manager/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
      active
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs font-bold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <span className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs">
              WR
            </span>
            WeeklyReport
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Member Section */}
          {isTeamMember && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Personal Workspace
              </div>
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className={navItemClass(isActive('/dashboard'))}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>My Dashboard</span>
                </Link>

                <Link
                  href="/reports/new"
                  onClick={onClose}
                  className={navItemClass(isActive('/reports/new'))}
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Create Weekly Report</span>
                </Link>

                <Link
                  href="/reports"
                  onClick={onClose}
                  className={navItemClass(pathname === '/reports')}
                >
                  <History className="w-4 h-4" />
                  <span>Report History</span>
                </Link>
              </div>
            </div>
          )}

          {/* Manager / Admin Section */}
          {isManager && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Team Management
              </div>
              <div className="space-y-1">
                <Link
                  href="/manager/dashboard"
                  onClick={onClose}
                  className={navItemClass(isActive('/manager/dashboard'))}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Manager Dashboard</span>
                </Link>

                <Link
                  href="/manager/reports"
                  onClick={onClose}
                  className={navItemClass(isActive('/manager/reports'))}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Review & All Reports</span>
                </Link>

                <Link
                  href="/manager/overview"
                  onClick={onClose}
                  className={navItemClass(isActive('/manager/overview'))}
                >
                  <Table className="w-4 h-4" />
                  <span>Weekly Matrix Overview</span>
                </Link>

                {onOpenAiAssistant && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAiAssistant();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-all border border-purple-100 bg-purple-50/50 cursor-pointer text-left"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>AI Team Assistant</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Organization & System Section */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace & Projects
            </div>
            <div className="space-y-1">
              <Link
                href="/projects"
                onClick={onClose}
                className={navItemClass(isActive('/projects'))}
              >
                <FolderKanban className="w-4 h-4" />
                <span>Projects / Categories</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin/users"
                  onClick={onClose}
                  className={navItemClass(isActive('/admin/users'))}
                >
                  <Users className="w-4 h-4" />
                  <span>User Management</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Footer Promo/Status */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="rounded-lg bg-indigo-50/70 border border-indigo-100 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Review Cycle Active</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Structured weekly reports with immutable version history.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

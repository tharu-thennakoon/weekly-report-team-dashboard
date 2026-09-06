'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { LogOut, User, Sparkles, Menu } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenAiAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenAiAssistant }) => {
  const { user, logout, isManager } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            WR
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">WeeklyReport</h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">Team Dashboard & Review System</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Manager AI Assistant trigger */}
        {isManager && onOpenAiAssistant && (
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Assistant</span>
          </button>
        )}

        {/* User Info & Actions */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-none">{user.name}</div>
                <div className="mt-1">
                  <Badge status={user.role} size="sm" />
                </div>
              </div>
            </Link>

            <button
              onClick={logout}
              title="Sign out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

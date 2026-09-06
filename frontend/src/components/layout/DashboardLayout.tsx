'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AiChatDrawer } from '../ai/AiChatDrawer';
import { ProtectedRoute } from './ProtectedRoute';
import { Role } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, allowedRoles }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenAiAssistant={() => setIsAiDrawerOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpenAiAssistant={() => setIsAiDrawerOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>

        {/* Manager AI Assistant Chat Drawer */}
        <AiChatDrawer isOpen={isAiDrawerOpen} onClose={() => setIsAiDrawerOpen(false)} />
      </div>
    </ProtectedRoute>
  );
};

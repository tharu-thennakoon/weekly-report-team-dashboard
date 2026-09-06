import React from 'react';
import { ReportStatus, Priority, TaskStatus, Role } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  status?: ReportStatus | TaskStatus | Priority | Role | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  className = '',
  size = 'md',
}) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (status) {
    switch (status) {
      // Report Status
      case 'DRAFT':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
      case 'SUBMITTED':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'NEEDS_CORRECTION':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
        break;
      case 'APPROVED':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;

      // Priority
      case 'LOW':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
      case 'MEDIUM':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'HIGH':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;

      // Task Status
      case 'NOT_STARTED':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
      case 'IN_PROGRESS':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'COMPLETED':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'BLOCKED':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
        break;

      // Roles
      case 'ADMIN':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'MANAGER':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'TEAM_MEMBER':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;

      default:
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    }
  } else if (variant) {
    switch (variant) {
      case 'primary':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'success':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'warning':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
      case 'danger':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'info':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
    }
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const label =
    children ||
    (status
      ? status.toString().replace(/_/g, ' ')
      : '');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-wide uppercase ${sizeClass} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
};

'use client';

import React from 'react';
import { TimeBreakdownItem, TimeCategory } from '../../types';
import { Clock } from 'lucide-react';

interface TimeBreakdownEditorProps {
  timeBreakdowns: TimeBreakdownItem[];
  onChange: (items: TimeBreakdownItem[]) => void;
}

const CATEGORIES: { key: TimeCategory; label: string; desc: string }[] = [
  { key: 'DEVELOPMENT', label: 'Development', desc: 'Coding, refactoring, PR reviews' },
  { key: 'TESTING', label: 'Testing & QA', desc: 'Unit tests, manual test, bug reproduction' },
  { key: 'MEETINGS', label: 'Meetings & Syncs', desc: 'Daily standups, 1:1s, sprint planning' },
  { key: 'DOCUMENTATION', label: 'Documentation', desc: 'Technical specs, user guides, API docs' },
  { key: 'OTHER', label: 'Other', desc: 'Onboarding, training, infrastructure setup' },
];

export const TimeBreakdownEditor: React.FC<TimeBreakdownEditorProps> = ({
  timeBreakdowns,
  onChange,
}) => {
  const getHours = (category: TimeCategory) => {
    const item = timeBreakdowns.find((t) => t.category === category);
    return item ? item.hours : 0;
  };

  const handleHourChange = (category: TimeCategory, val: number) => {
    const hours = Math.max(0, val || 0);
    const existingIdx = timeBreakdowns.findIndex((t) => t.category === category);

    if (existingIdx >= 0) {
      const updated = [...timeBreakdowns];
      updated[existingIdx] = { ...updated[existingIdx], hours };
      onChange(updated);
    } else {
      onChange([...timeBreakdowns, { category, hours }]);
    }
  };

  const totalHours = timeBreakdowns.reduce((sum, item) => sum + (item.hours || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Working Hours Breakdown
          </h4>
        </div>
        <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
          Total Logged: {totalHours.toFixed(1)} hrs
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => {
          const hours = getHours(cat.key);
          return (
            <div
              key={cat.key}
              className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
            >
              <div>
                <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                <div className="text-[11px] text-slate-400">{cat.desc}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="80"
                  step="0.5"
                  value={hours || ''}
                  placeholder="0"
                  onChange={(e) => handleHourChange(cat.key, parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <span className="text-xs text-slate-400">hrs</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

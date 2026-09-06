'use client';

import React from 'react';
import { BlockerItem } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface BlockerEditorProps {
  blockers: BlockerItem[];
  onChange: (blockers: BlockerItem[]) => void;
}

export const BlockerEditor: React.FC<BlockerEditorProps> = ({ blockers, onChange }) => {
  const addBlocker = () => {
    const newBlocker: BlockerItem = {
      description: '',
      isKeyBlocker: blockers.length === 0, // default first blocker as key
    };
    onChange([...blockers, newBlocker]);
  };

  const updateDescription = (index: number, description: string) => {
    const updated = blockers.map((b, idx) => (idx === index ? { ...b, description } : b));
    onChange(updated);
  };

  const setKeyBlocker = (index: number) => {
    // Only one key blocker allowed
    const updated = blockers.map((b, idx) => ({
      ...b,
      isKeyBlocker: idx === index,
    }));
    onChange(updated);
  };

  const removeBlocker = (index: number) => {
    const updated = blockers.filter((_, idx) => idx !== index);
    // If removed blocker was key, designate new first if available
    if (updated.length > 0 && !updated.some((b) => b.isKeyBlocker)) {
      updated[0].isKeyBlocker = true;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Blockers & Challenges
          </h4>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addBlocker}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Blocker
        </Button>
      </div>

      {blockers.length === 0 ? (
        <div className="p-4 text-center border border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-slate-500">No blockers reported this week (all clear!).</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {blockers.map((blocker, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all flex items-start gap-3 bg-white ${
                blocker.isKeyBlocker
                  ? 'border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                  : 'border-slate-200'
              }`}
            >
              <div className="pt-2">
                <input
                  type="radio"
                  id={`key-blocker-${idx}`}
                  name="key-blocker"
                  checked={blocker.isKeyBlocker}
                  onChange={() => setKeyBlocker(idx)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  title="Flag as Key Blocker"
                />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`key-blocker-${idx}`}
                    className="text-[11px] font-semibold text-slate-600 cursor-pointer"
                  >
                    {blocker.isKeyBlocker ? (
                      <span className="text-amber-800 font-bold">⚠️ Flagged as Key Blocker of the Week</span>
                    ) : (
                      'Set as Key Blocker'
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeBlocker(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Describe the issue, waiting dependency, or technical blocker..."
                  value={blocker.description}
                  onChange={(e) => updateDescription(idx, e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

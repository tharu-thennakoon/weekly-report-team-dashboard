'use client';

import React from 'react';
import { AchievementItem } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Trash2, Trophy } from 'lucide-react';

interface AchievementEditorProps {
  achievements: AchievementItem[];
  onChange: (achievements: AchievementItem[]) => void;
}

export const AchievementEditor: React.FC<AchievementEditorProps> = ({
  achievements,
  onChange,
}) => {
  const addAchievement = () => {
    const newAchievement: AchievementItem = {
      description: '',
      isKeyAchievement: achievements.length === 0,
    };
    onChange([...achievements, newAchievement]);
  };

  const updateDescription = (index: number, description: string) => {
    const updated = achievements.map((a, idx) => (idx === index ? { ...a, description } : a));
    onChange(updated);
  };

  const toggleKeyAchievement = (index: number) => {
    const isCurrentlyKey = achievements[index].isKeyAchievement;
    const updated = achievements.map((a, idx) => ({
      ...a,
      isKeyAchievement: idx === index ? !isCurrentlyKey : false,
    }));
    onChange(updated);
  };

  const removeAchievement = (index: number) => {
    const updated = achievements.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((a) => a.isKeyAchievement)) {
      updated[0].isKeyAchievement = true;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Achievements & Highlights
          </h4>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addAchievement}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Highlight
        </Button>
      </div>

      {achievements.length === 0 ? (
        <div className="p-4 text-center border border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-slate-500">No achievements recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {achievements.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all flex items-start gap-3 bg-white ${
                item.isKeyAchievement
                  ? 'border-emerald-300 ring-1 ring-emerald-200 shadow-2xs'
                  : 'border-slate-200'
              }`}
            >
              <div className="pt-2">
                <input
                  type="checkbox"
                  id={`key-achievement-${idx}`}
                  name="key-achievement"
                  checked={item.isKeyAchievement}
                  onChange={() => toggleKeyAchievement(idx)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  title="Flag as Key Achievement"
                />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`key-achievement-${idx}`}
                    className="text-[11px] font-semibold text-slate-600 cursor-pointer"
                  >
                    {item.isKeyAchievement ? (
                      <span className="text-emerald-800 font-bold">⭐ Flagged as Key Achievement of the Week</span>
                    ) : (
                      'Set as Key Achievement'
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeAchievement(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Completed release milestone ahead of schedule with 0 bugs"
                  value={item.description}
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

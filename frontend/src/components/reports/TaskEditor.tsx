'use client';

import React from 'react';
import { TaskItem, Priority, TaskStatus } from '../../types';
import { Button } from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface TaskEditorProps {
  tasks: TaskItem[];
  onChange: (tasks: TaskItem[]) => void;
  isPlannedForNextWeek?: boolean;
}

export const TaskEditor: React.FC<TaskEditorProps> = ({
  tasks,
  onChange,
  isPlannedForNextWeek = false,
}) => {
  const filteredTasks = tasks.filter((t) => !!t.isPlannedForNextWeek === isPlannedForNextWeek);

  const addTask = () => {
    const newTask: TaskItem = {
      name: '',
      priority: 'MEDIUM',
      plannedPercent: isPlannedForNextWeek ? 100 : 0,
      actualPercent: 0,
      status: 'NOT_STARTED',
      plannedHours: 8,
      actualHours: 0,
      deliverable: '',
      isPlannedForNextWeek,
    };
    onChange([...tasks, newTask]);
  };

  const updateTask = (indexInFiltered: number, field: keyof TaskItem, value: any) => {
    let currentFilteredIdx = 0;
    const newTasks = tasks.map((t) => {
      if (!!t.isPlannedForNextWeek === isPlannedForNextWeek) {
        if (currentFilteredIdx === indexInFiltered) {
          currentFilteredIdx++;
          return { ...t, [field]: value };
        }
        currentFilteredIdx++;
      }
      return t;
    });
    onChange(newTasks);
  };

  const removeTask = (indexInFiltered: number) => {
    let currentFilteredIdx = 0;
    const newTasks = tasks.filter((t) => {
      if (!!t.isPlannedForNextWeek === isPlannedForNextWeek) {
        const match = currentFilteredIdx === indexInFiltered;
        currentFilteredIdx++;
        return !match;
      }
      return true;
    });
    onChange(newTasks);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {isPlannedForNextWeek ? 'Tasks Planned for Next Week' : 'Tasks Completed / In-Progress This Week'}
        </h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addTask}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Task
        </Button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-slate-500">
            No {isPlannedForNextWeek ? 'planned next week tasks' : 'current tasks'} added yet.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={addTask}
            className="mt-2 text-xs"
          >
            + Add First Task
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse bg-white">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 min-w-[200px]">Task Name / Summary *</th>
                <th className="py-2.5 px-3 w-28">Priority</th>
                {!isPlannedForNextWeek && <th className="py-2.5 px-3 w-28">Status</th>}
                {!isPlannedForNextWeek && <th className="py-2.5 px-3 w-24">Plan / Act %</th>}
                <th className="py-2.5 px-3 w-28">Plan / Act Hrs</th>
                <th className="py-2.5 px-3 min-w-[150px]">Deliverable / Output</th>
                <th className="py-2.5 px-3 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40">
                  <td className="p-2.5">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Implement OAuth2 flow"
                      value={task.name}
                      onChange={(e) => updateTask(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2.5">
                    <select
                      value={task.priority}
                      onChange={(e) => updateTask(idx, 'priority', e.target.value as Priority)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </td>
                  {!isPlannedForNextWeek && (
                    <td className="p-2.5">
                      <select
                        value={task.status}
                        onChange={(e) => updateTask(idx, 'status', e.target.value as TaskStatus)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </td>
                  )}
                  {!isPlannedForNextWeek && (
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={task.plannedPercent}
                          onChange={(e) => updateTask(idx, 'plannedPercent', parseInt(e.target.value, 10) || 0)}
                          className="w-10 px-1.5 py-1 border border-slate-200 rounded-md text-xs text-center"
                          title="Planned Percentage"
                        />
                        <span className="text-slate-400">/</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={task.actualPercent}
                          onChange={(e) => updateTask(idx, 'actualPercent', parseInt(e.target.value, 10) || 0)}
                          className="w-10 px-1.5 py-1 border border-slate-200 rounded-md text-xs text-center font-semibold text-indigo-700"
                          title="Actual Percentage"
                        />
                      </div>
                    </td>
                  )}
                  <td className="p-2.5">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={task.plannedHours}
                        onChange={(e) => updateTask(idx, 'plannedHours', parseFloat(e.target.value) || 0)}
                        className="w-12 px-1.5 py-1 border border-slate-200 rounded-md text-xs text-center"
                        title="Planned Hours"
                      />
                      <span className="text-slate-400">/</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={task.actualHours}
                        onChange={(e) => updateTask(idx, 'actualHours', parseFloat(e.target.value) || 0)}
                        className="w-12 px-1.5 py-1 border border-slate-200 rounded-md text-xs text-center font-semibold text-slate-900"
                        title="Actual Hours"
                      />
                    </div>
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      placeholder="e.g. PR #42 merged / Docs link"
                      value={task.deliverable || ''}
                      onChange={(e) => updateTask(idx, 'deliverable', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeTask(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

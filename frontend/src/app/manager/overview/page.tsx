'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Calendar, Eye, AlertTriangle, Trophy, CheckSquare, Clock } from 'lucide-react';
import api from '../../../lib/api';

interface MatrixRow {
  memberId: number;
  memberName: string;
  email: string;
  status: string;
  reportId: number | null;
  project: string | null;
  completedTasksCount: number;
  totalTasksCount: number;
  totalHours: number;
  keyBlocker: string | null;
  keyAchievement: string | null;
  versionNumber?: number;
}

export default function WeeklyOverviewPage() {
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [data, setData] = useState<{
    week: { weekStart: string; weekEnd: string };
    matrix: MatrixRow[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverview = (dateStr: string) => {
    setIsLoading(true);
    api.get(`/dashboard/overview?date=${dateStr}`)
      .then((res) => setData(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOverview(targetDate);
  }, [targetDate]);

  return (
    <DashboardLayout allowedRoles={['MANAGER', 'ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Weekly Team Overview Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side comparative matrix of all engineers, deliverables, blockers, and achievements
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Select Week:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Matrix Card */}
        <Card>
          <CardHeader
            title={
              data
                ? `Sprint Matrix: ${new Date(data.week.weekStart).toLocaleDateString()} - ${new Date(data.week.weekEnd).toLocaleDateString()}`
                : 'Team Overview Matrix'
            }
            subtitle="Compare team members without opening each report individually"
          />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-xs text-slate-500">Loading weekly matrix...</div>
            ) : !data || data.matrix.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No team members found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 min-w-[160px]">Team Member</th>
                      <th className="py-3 px-4 w-32">Status</th>
                      <th className="py-3 px-4 min-w-[140px]">Project</th>
                      <th className="py-3 px-4 w-28">Tasks</th>
                      <th className="py-3 px-4 w-24">Hours</th>
                      <th className="py-3 px-4 min-w-[220px]">Key Blocker</th>
                      <th className="py-3 px-4 min-w-[220px]">Key Highlight / Win</th>
                      <th className="py-3 px-4 text-right w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.matrix.map((row) => (
                      <tr key={row.memberId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <Link
                            href={`/team/${row.memberId}`}
                            className="hover:text-indigo-600 hover:underline"
                          >
                            {row.memberName}
                          </Link>
                          <div className="text-[11px] text-slate-400 font-normal">{row.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={row.status} size="sm" />
                          {row.versionNumber && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              v{row.versionNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {row.project || <span className="text-slate-400 italic">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {row.reportId ? (
                            <span>
                              <b>{row.completedTasksCount}</b> / {row.totalTasksCount} done
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {row.reportId ? (
                            <span className="font-semibold text-indigo-700">{row.totalHours}h</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {row.keyBlocker ? (
                            <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{row.keyBlocker}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None reported</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {row.keyAchievement ? (
                            <div className="flex items-start gap-1.5 text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                              <Trophy className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{row.keyAchievement}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None logged</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {row.reportId ? (
                            <div className="flex justify-end gap-1">
                              <Link href={`/reports/${row.reportId}`}>
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </Link>
                              {row.status === 'SUBMITTED' && (
                                <Link href={`/manager/review/${row.reportId}`}>
                                  <Button variant="primary" size="sm">
                                    Review
                                  </Button>
                                </Link>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Not Started</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

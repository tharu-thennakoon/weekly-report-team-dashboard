'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  FolderKanban,
  CheckSquare,
  FileCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import api from '../../../lib/api';
import { Report } from '../../../types';

const PIE_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const STATUS_COLOR_MAP: Record<string, string> = {
  APPROVED: '#10b981',
  SUBMITTED: '#3b82f6',
  NEEDS_CORRECTION: '#f59e0b',
  DRAFT: '#94a3b8',
  NOT_STARTED: '#cbd5e1',
  LATE: '#ef4444',
};

export default function ManagerDashboardPage() {
  const [data, setData] = useState<{
    selectedWeek: {
      weekStart: string;
      weekEnd: string;
      isDeadlinePassed: boolean;
    };
    kpis: {
      totalMembers: number;
      totalSubmittedThisWeek: number;
      submittedThisWeek: number;
      approvedThisWeek: number;
      complianceRate: number;
      needsCorrectionCount: number;
      openBlockers: number;
      completedTasksCount: number;
      lateSubmissionsCount: number;
    };
    charts: {
      projectWorkload: { name: string; tasks: number; hours: number }[];
      timeSpentByCategory: { category: string; hours: number }[];
      statusCounts: {
        APPROVED: number;
        SUBMITTED: number;
        NEEDS_CORRECTION: number;
        DRAFT: number;
        NOT_STARTED: number;
        LATE: number;
      };
      memberStatuses: {
        memberId: number;
        memberName: string;
        email: string;
        derivedStatus: string;
        reportId: number | null;
        projectName: string | null;
        tasksCount: number;
        hoursLogged: number;
      }[];
    };
    awaitingReview: Report[];
    recentActivity: any[];
  } | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = (date?: string) => {
    setIsLoading(true);
    const params = date ? `?date=${date}` : '';
    api.get(`/dashboard/manager${params}`)
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDashboardData(selectedDate);
  }, [selectedDate]);

  if (isLoading || !data) {
    return (
      <DashboardLayout allowedRoles={['MANAGER', 'ADMIN']}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 rounded-xl"></div>
            <div className="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { selectedWeek, kpis, charts, awaitingReview, recentActivity } = data;

  const statusChartData = [
    { name: 'Approved', count: charts.statusCounts.APPROVED, color: STATUS_COLOR_MAP.APPROVED },
    { name: 'Submitted', count: charts.statusCounts.SUBMITTED, color: STATUS_COLOR_MAP.SUBMITTED },
    { name: 'Needs Correction', count: charts.statusCounts.NEEDS_CORRECTION, color: STATUS_COLOR_MAP.NEEDS_CORRECTION },
    { name: 'Draft', count: charts.statusCounts.DRAFT, color: STATUS_COLOR_MAP.DRAFT },
    { name: 'Not Started', count: charts.statusCounts.NOT_STARTED, color: STATUS_COLOR_MAP.NOT_STARTED },
    { name: 'Late', count: charts.statusCounts.LATE, color: STATUS_COLOR_MAP.LATE },
  ].filter((item) => item.count > 0);

  return (
    <DashboardLayout allowedRoles={['MANAGER', 'ADMIN']}>
      <div className="space-y-6">
        {/* Header & Date Scope Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manager Dashboard</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">
                Reporting Week: <strong className="text-indigo-600">{selectedWeek.weekStart}</strong> to{' '}
                <strong className="text-indigo-600">{selectedWeek.weekEnd}</strong>
              </span>
              {selectedWeek.isDeadlinePassed && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Deadline Passed
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 p-0 text-xs text-slate-700 focus:ring-0 cursor-pointer outline-none bg-transparent"
                title="Select week reference date"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] text-slate-400 hover:text-rose-600 ml-1"
                >
                  Reset
                </button>
              )}
            </div>
            <Link href="/manager/overview">
              <Button variant="outline" size="sm">
                Weekly Matrix
              </Button>
            </Link>
            <Link href="/manager/reports">
              <Button variant="primary" size="sm" leftIcon={<CheckSquare className="w-4 h-4" />}>
                Review Submissions
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Summary KPI Cards (Explicit KPI: Total Reports Submitted This Week) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* KPI 1: Total Reports Submitted This Week */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Submitted
                </div>
                <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                  {kpis.totalSubmittedThisWeek}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  of {kpis.totalMembers} team members
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 2: Submission Compliance */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Compliance Rate
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {kpis.complianceRate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {kpis.lateSubmissionsCount > 0 ? (
                    <span className="text-rose-600 font-semibold">{kpis.lateSubmissionsCount} late</span>
                  ) : (
                    'On schedule'
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 3: Awaiting Review */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Awaiting Review
                </div>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">
                  {kpis.submittedThisWeek}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Pending decisions</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 4: Needs Correction */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Needs Correction
                </div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">
                  {kpis.needsCorrectionCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Changes requested</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* KPI 5: Open Blockers */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Open Blockers
                </div>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">
                  {kpis.openBlockers}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Active this week</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row: Report Status by Member & Workload by Project */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Report Status by Team Member Visualization (Requirement 9) */}
          <Card>
            <CardHeader
              title="Report Submission Status by Member"
              subtitle="Weekly compliance & submission status breakdown across team"
            />
            <CardContent className="p-4">
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {charts.memberStatuses.map((m) => (
                    <div
                      key={m.memberId}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between text-xs"
                    >
                      <div className="font-semibold text-slate-800 truncate" title={m.memberName}>
                        {m.memberName}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <Badge status={m.derivedStatus} size="sm" />
                        <span className="text-[10px] text-slate-400">{m.hoursLogged}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown Bar Chart */}
              <div className="h-44 w-full pt-2 border-t border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" name="Members" radius={[0, 4, 4, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 2: Workload by Project for Selected Week */}
          <Card>
            <CardHeader
              title="Workload & Tasks by Project (Selected Week)"
              subtitle="Task and logged hours distribution across active projects"
            />
            <CardContent className="p-4">
              <div className="h-64 w-full">
                {charts.projectWorkload.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No active tasks recorded for this reporting week.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.projectWorkload}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="tasks" name="Tasks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hours" name="Hours Logged" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lower Row: Time Spent Breakdown + Reports Awaiting Review */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 3: Time Spent by Task Category */}
          <Card className="lg:col-span-1">
            <CardHeader
              title="Time Spent by Task Type"
              subtitle="Team hours breakdown for selected week"
            />
            <CardContent className="p-4 flex flex-col items-center">
              <div className="h-52 w-full">
                {charts.timeSpentByCategory.every((c) => c.hours === 0) ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No hours logged in this week.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.timeSpentByCategory.filter((c) => c.hours > 0)}
                        dataKey="hours"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                        paddingAngle={3}
                      >
                        {charts.timeSpentByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {charts.timeSpentByCategory.map((c, i) => (
                  <div key={c.category} className="flex items-center gap-1 text-[11px] text-slate-600">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span>
                      {c.category}: <b>{c.hours}h</b>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reports Awaiting Review */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Reports Awaiting Review"
              subtitle="Submissions pending manager review and approval"
              action={
                <Link href="/manager/reports?status=SUBMITTED">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View All
                  </Button>
                </Link>
              }
            />
            <CardContent className="p-0">
              {awaitingReview.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  🎉 No pending reports awaiting review for this period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-4">Member</th>
                        <th className="py-2.5 px-4">Project</th>
                        <th className="py-2.5 px-4">Tasks</th>
                        <th className="py-2.5 px-4">Submitted At</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {awaitingReview.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <Link
                              href={`/team/${rep.userId}`}
                              className="hover:text-indigo-600 hover:underline"
                            >
                              {rep.user?.name}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{rep.project?.name}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {rep.tasks?.length || rep._count?.tasks || 0} tasks
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {rep.submittedAt ? new Date(rep.submittedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/manager/review/${rep.id}`}>
                              <Button variant="primary" size="sm">
                                Review
                              </Button>
                            </Link>
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

        {/* Recent Review Activity Feed */}
        <Card>
          <CardHeader
            title="Recent Review & Approval Activity"
            subtitle="Latest manager decisions and feedback history"
          />
          <CardContent className="p-4 space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400">No review actions recorded yet.</p>
            ) : (
              recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Badge status={act.action} size="sm" />
                    <div>
                      <span className="font-bold text-slate-900">{act.reviewer?.name}</span>{' '}
                      <span className="text-slate-500">
                        {act.action === 'APPROVED' ? 'approved' : 'requested changes on'}{' '}
                      </span>
                      <span className="font-semibold text-indigo-700">
                        {act.report?.user?.name}&apos;s {act.report?.project?.name} report
                      </span>
                      <p className="text-[11px] text-slate-600 mt-0.5 italic">
                        &ldquo;{act.comment}&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0">
                    {new Date(act.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  FilePlus,
  Edit3,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import api from '../../lib/api';
import { Report } from '../../types';

export default function MemberDashboardPage() {
  const [data, setData] = useState<{
    currentWeek: { weekStart: string; weekEnd: string };
    currentReport: Report | null;
    stats: {
      totalReports: number;
      approvedCount: number;
      needsCorrectionCount: number;
      submittedCount: number;
    };
    recentReports: Report[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/member')
      .then((res) => setData(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <DashboardLayout allowedRoles={['TEAM_MEMBER', 'MANAGER', 'ADMIN']}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-48 bg-slate-200 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { currentReport, stats, recentReports, currentWeek } = data;
  const latestReview = currentReport?.reviews?.[0];

  return (
    <DashboardLayout allowedRoles={['TEAM_MEMBER', 'MANAGER', 'ADMIN']}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Personal Dashboard</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current Week Cycle: {new Date(currentWeek.weekStart).toLocaleDateString()} –{' '}
              {new Date(currentWeek.weekEnd).toLocaleDateString()}
            </p>
          </div>
          {!currentReport && (
            <Link href="/reports/new">
              <Button leftIcon={<FilePlus className="w-4 h-4" />}>
                Create Weekly Report
              </Button>
            </Link>
          )}
        </div>

        {/* NEEDS CORRECTION ALERT BANNER */}
        {currentReport?.status === 'NEEDS_CORRECTION' && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-200/70 text-amber-800 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-amber-900">
                    Changes Requested on Your Weekly Report
                  </h4>
                  <Badge status="NEEDS_CORRECTION" size="sm" />
                </div>
                {latestReview && (
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    <b>Manager comment:</b> &ldquo;{latestReview.comment}&rdquo;
                  </p>
                )}
                <p className="text-[11px] text-amber-700">
                  Please update your task percentages, descriptions, or blockers and resubmit.
                </p>
              </div>
            </div>
            <Link href={`/reports/${currentReport.id}/edit`} className="shrink-0 self-end sm:self-center">
              <Button variant="primary" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                Edit & Resubmit Report
              </Button>
            </Link>
          </div>
        )}

        {/* Current Week Status Card */}
        <Card className="border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    This Week&apos;s Submission
                  </span>
                  {currentReport ? (
                    <Badge status={currentReport.status} />
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-500 font-medium">
                      Not Started
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {currentReport
                    ? `${currentReport.project.name} (Version ${currentReport.currentVersionNumber})`
                    : 'No report created yet for this week'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  {currentReport
                    ? `Current status: ${currentReport.status}. ${
                        currentReport.status === 'SUBMITTED'
                          ? 'Awaiting manager review and approval.'
                          : currentReport.status === 'APPROVED'
                          ? 'Your report was approved by the manager.'
                          : currentReport.status === 'DRAFT'
                          ? 'You have saved a draft. Make sure to submit when ready.'
                          : 'Please address review comments.'
                      }`
                    : 'Submit your structured weekly report before the Friday cutoff to keep the team aligned.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {currentReport ? (
                  <>
                    <Link href={`/reports/${currentReport.id}`}>
                      <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        View Report
                      </Button>
                    </Link>
                    {(currentReport.status === 'DRAFT' || currentReport.status === 'NEEDS_CORRECTION') && (
                      <Link href={`/reports/${currentReport.id}/edit`}>
                        <Button variant="primary" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                          Continue Editing
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <Link href="/reports/new">
                    <Button variant="primary" size="sm" leftIcon={<FilePlus className="w-3.5 h-3.5" />}>
                      Start This Week&apos;s Report
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900">{stats.totalReports}</div>
                <div className="text-xs text-slate-500 font-medium">Total Reports</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-600">{stats.approvedCount}</div>
                <div className="text-xs text-slate-500 font-medium">Approved Reports</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-amber-600">{stats.needsCorrectionCount}</div>
                <div className="text-xs text-slate-500 font-medium">Needs Correction</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-blue-600">{stats.submittedCount}</div>
                <div className="text-xs text-slate-500 font-medium">Under Review</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Report History Table */}
        <Card>
          <CardHeader
            title="Recent Weekly Reports"
            subtitle="Your recent submission logs and approval states"
            action={
              <Link href="/reports">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All History
                </Button>
              </Link>
            }
          />
          <CardContent className="p-0">
            {recentReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No past reports found. Create your first report above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Week Range</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4">Latest Review</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(report.weekStart).toLocaleDateString()} -{' '}
                            {new Date(report.weekEnd).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{report.project.name}</td>
                        <td className="py-3.5 px-4">
                          <Badge status={report.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">v{report.currentVersionNumber}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {report.reviews?.[0]?.comment || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Link href={`/reports/${report.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          {(report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION') && (
                            <Link href={`/reports/${report.id}/edit`}>
                              <Button variant="secondary" size="sm">
                                Edit
                              </Button>
                            </Link>
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

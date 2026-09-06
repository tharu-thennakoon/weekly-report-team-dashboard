'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FilePlus, Calendar, Eye, Edit3, History } from 'lucide-react';
import api from '../../lib/api';
import { Report } from '../../types';

export default function UserReportHistoryPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/me')
      .then((res) => setReports(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout allowedRoles={['TEAM_MEMBER', 'MANAGER', 'ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Report History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review all past weekly submissions, versions, and manager reviews
            </p>
          </div>
          <Link href="/reports/new">
            <Button leftIcon={<FilePlus className="w-4 h-4" />}>
              Create New Report
            </Button>
          </Link>
        </div>

        {/* Reports List Card */}
        <Card>
          <CardHeader
            title="Weekly Reports Archive"
            subtitle={`Showing ${reports.length} report entries`}
          />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <History className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">No reports found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have not created any weekly reports yet. Click below to start your first report.
                </p>
                <Link href="/reports/new">
                  <Button variant="primary" size="sm" leftIcon={<FilePlus className="w-3.5 h-3.5" />}>
                    Create Weekly Report
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Sprint Week</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Tasks</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4">Latest Manager Review</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(report.weekStart).toLocaleDateString()} -{' '}
                            {new Date(report.weekEnd).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {report.project.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={report.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {report._count?.tasks || 0} tasks
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          v{report.currentVersionNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {report.reviews?.[0]?.comment ? (
                            <span>
                              <b>{report.reviews[0].reviewer?.name}:</b> &ldquo;
                              {report.reviews[0].comment}&rdquo;
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Link href={`/reports/${report.id}`}>
                            <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3 h-3" />}>
                              View
                            </Button>
                          </Link>
                          {(report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION') && (
                            <Link href={`/reports/${report.id}/edit`}>
                              <Button variant="secondary" size="sm" leftIcon={<Edit3 className="w-3 h-3" />}>
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

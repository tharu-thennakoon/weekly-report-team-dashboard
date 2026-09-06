'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Search, Filter, Calendar, Eye, CheckSquare, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import { Report, Project, User, PaginationMeta } from '../../../types';

export default function ManagerReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filter states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [weekStart, setWeekStart] = useState<string>('');
  const [weekEnd, setWeekEnd] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load filter options
  useEffect(() => {
    Promise.all([
      api.get('/projects'),
      api.get('/users?role=TEAM_MEMBER'),
    ])
      .then(([projRes, userRes]) => {
        setProjects(projRes.data.data);
        setUsers(userRes.data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchReports = (pageNumber = 1) => {
    // Validate date range
    if (weekStart && weekEnd && new Date(weekStart) > new Date(weekEnd)) {
      setDateError('From Date cannot be after To Date.');
      return;
    }
    setDateError('');
    setIsLoading(true);

    const params = new URLSearchParams();
    params.set('page', pageNumber.toString());
    params.set('limit', '10');
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (projectId) params.set('projectId', projectId);
    if (userId) params.set('userId', userId);
    if (weekStart) params.set('weekStart', weekStart);
    if (weekEnd) params.set('weekEnd', weekEnd);

    api.get(`/reports?${params.toString()}`)
      .then((res) => {
        setReports(res.data.data.data);
        setPagination(res.data.data.pagination);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchReports(1);
  }, [status, projectId, userId, weekStart, weekEnd]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setProjectId('');
    setUserId('');
    setWeekStart('');
    setWeekEnd('');
    setDateError('');
  };

  return (
    <DashboardLayout allowedRoles={['MANAGER', 'ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Team Weekly Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter, search, review and manage submissions across all projects and dates
            </p>
          </div>
          <Link href="/manager/overview">
            <Button variant="outline" size="sm">
              View Weekly Overview Matrix
            </Button>
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <Card className="bg-white">
          <CardContent className="p-4">
            {dateError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}

            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Search Keywords</label>
                <Input
                  placeholder="Search member, project, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Status</label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="SUBMITTED">Submitted (Needs Review)</option>
                  <option value="NEEDS_CORRECTION">Needs Correction</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DRAFT">Draft</option>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Project</label>
                <Select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="text-xs"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </form>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div>
                Showing <b>{reports.length}</b> of <b>{pagination.total}</b> total reports
              </div>
              <div className="flex items-center gap-2">
                {(search || status || projectId || userId || weekStart || weekEnd) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
                <Button type="button" size="sm" variant="secondary" onClick={() => fetchReports(1)}>
                  Apply Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-10 text-center text-xs text-slate-500">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No weekly reports match the specified filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Team Member</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Sprint Week</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4">Tasks / Blockers</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <Link
                            href={`/team/${report.userId}`}
                            className="hover:text-indigo-600 hover:underline"
                          >
                            {report.user?.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {report.user?.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {report.project.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {new Date(report.weekStart).toLocaleDateString()} -{' '}
                          {new Date(report.weekEnd).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={report.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          v{report.currentVersionNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span>{report._count?.tasks || 0} tasks</span>
                          {report._count?.blockers ? (
                            <span className="ml-2 text-rose-600 font-bold">
                              • {report._count.blockers} blocker(s)
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <Link href={`/reports/${report.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          {report.status === 'SUBMITTED' && (
                            <Link href={`/manager/review/${report.id}`}>
                              <Button variant="primary" size="sm" leftIcon={<CheckSquare className="w-3 h-3" />}>
                                Review
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                <div>
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchReports(pagination.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchReports(pagination.page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

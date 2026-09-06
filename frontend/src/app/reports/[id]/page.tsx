'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { VersionViewer } from '../../../components/reports/VersionViewer';
import { useAuth } from '../../../context/AuthContext';
import { Report } from '../../../types';
import {
  ArrowLeft,
  Calendar,
  User as UserIcon,
  FolderKanban,
  Edit3,
  Send,
  CheckSquare,
  AlertCircle,
  Clock,
  Trophy,
  AlertTriangle,
  Link as LinkIcon,
  MessageSquare,
  History,
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const { user, isManager } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'versions'>('details');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = () => {
    setIsLoading(true);
    api.get(`/reports/${reportId}`)
      .then((res) => setReport(res.data.data))
      .catch((err) => setError(err.message || 'Failed to load report.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for manager review?')) return;
    setIsSubmitting(true);
    try {
      await api.post(`/reports/${reportId}/submit`);
      fetchReport();
    } catch (err: any) {
      alert(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !report) {
    return (
      <DashboardLayout allowedRoles={['TEAM_MEMBER', 'MANAGER', 'ADMIN']}>
        <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-48 bg-slate-200 rounded-xl"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = user?.id === report.userId;
  const canEdit = isOwner && (report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION');
  const canSubmit = isOwner && (report.status === 'DRAFT' || report.status === 'NEEDS_CORRECTION');
  const canReview = isManager && report.status === 'SUBMITTED';

  const completedTasks = report.tasks?.filter((t) => !t.isPlannedForNextWeek) || [];
  const plannedTasks = report.tasks?.filter((t) => t.isPlannedForNextWeek) || [];
  const totalHours = report.timeBreakdowns?.reduce((sum, tb) => sum + tb.hours, 0) || 0;

  return (
    <DashboardLayout allowedRoles={['TEAM_MEMBER', 'MANAGER', 'ADMIN']}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {report.project.name} Weekly Report
                </h2>
                <Badge status={report.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted by {report.user?.name} • Version {report.currentVersionNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/reports/${report.id}/edit`}>
                <Button variant="outline" size="sm" leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                  Edit Report
                </Button>
              </Link>
            )}

            {canSubmit && (
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleSubmit}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {report.status === 'NEEDS_CORRECTION' ? 'Resubmit for Review' : 'Submit for Review'}
              </Button>
            )}

            {canReview && (
              <Link href={`/manager/review/${report.id}`}>
                <Button variant="primary" size="sm" leftIcon={<CheckSquare className="w-3.5 h-3.5" />}>
                  Review & Approve
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Manager Review Comments Alert Banner */}
        {report.status === 'NEEDS_CORRECTION' && report.reviews && report.reviews.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Manager Correction Feedback ({report.reviews[0].reviewer?.name}):</span>
            </div>
            <p className="text-xs bg-white/80 p-3 rounded-lg border border-amber-200 leading-relaxed font-medium">
              &ldquo;{report.reviews[0].comment}&rdquo;
            </p>
          </div>
        )}

        {/* View Mode Tabs (Current Report vs Version History Snapshots) */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Current Report Details
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'versions'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Version History ({report.versions?.length || 0})</span>
          </button>
        </div>

        {activeTab === 'versions' ? (
          <VersionViewer
            versions={report.versions || []}
            currentVersionNumber={report.currentVersionNumber}
          />
        ) : (
          <div className="space-y-6">
            {/* Meta Information Bar */}
            <Card>
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Team Member</div>
                    <div className="font-semibold text-slate-900">{report.user?.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Project Category</div>
                    <div className="font-semibold text-slate-900">{report.project.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sprint Week</div>
                    <div className="font-semibold text-slate-900">
                      {new Date(report.weekStart).toLocaleDateString()} -{' '}
                      {new Date(report.weekEnd).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Hours</div>
                    <div className="font-semibold text-indigo-700">{totalHours} hrs logged</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Completed Table */}
            <Card>
              <CardHeader
                title="Tasks Completed & In-Progress This Week"
                subtitle="Task-level table with priority, percentage, status, and output"
              />
              <CardContent className="p-0">
                {completedTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No tasks logged.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-4">Task Name</th>
                          <th className="py-2.5 px-4">Priority</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Plan / Actual %</th>
                          <th className="py-2.5 px-4">Hours (Plan/Act)</th>
                          <th className="py-2.5 px-4">Deliverable / Output</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {completedTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-800">{t.name}</td>
                            <td className="py-3 px-4">
                              <Badge status={t.priority} size="sm" />
                            </td>
                            <td className="py-3 px-4">
                              <Badge status={t.status} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {t.plannedPercent}% / <span className="font-bold text-indigo-600">{t.actualPercent}%</span>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {t.plannedHours}h / <b>{t.actualHours}h</b>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                              {t.deliverable || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks Planned for Next Week */}
            {plannedTasks.length > 0 && (
              <Card>
                <CardHeader
                  title="Tasks Planned for Next Week"
                  subtitle="Forward-looking sprint commitments"
                />
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                          <th className="py-2.5 px-4">Task Name</th>
                          <th className="py-2.5 px-4">Priority</th>
                          <th className="py-2.5 px-4">Estimated Hours</th>
                          <th className="py-2.5 px-4">Target Output</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {plannedTasks.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-semibold text-slate-800">{t.name}</td>
                            <td className="py-3 px-4">
                              <Badge status={t.priority} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-slate-700">{t.plannedHours} hrs</td>
                            <td className="py-3 px-4 text-slate-600">{t.deliverable || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blockers & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader
                  title="Blockers & Challenges"
                  subtitle="Issues requiring resolution or manager attention"
                />
                <CardContent className="space-y-2">
                  {!report.blockers || report.blockers.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No blockers reported.</p>
                  ) : (
                    report.blockers.map((b) => (
                      <div
                        key={b.id}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          b.isKeyBlocker
                            ? 'bg-amber-50/70 border-amber-300 text-amber-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            b.isKeyBlocker ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          {b.isKeyBlocker && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                              ⚠️ Key Blocker
                            </span>
                          )}
                          <p className="leading-relaxed">{b.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Achievements & Highlights"
                  subtitle="Key milestone wins accomplished this sprint"
                />
                <CardContent className="space-y-2">
                  {!report.achievements || report.achievements.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No achievements logged.</p>
                  ) : (
                    report.achievements.map((a) => (
                      <div
                        key={a.id}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          a.isKeyAchievement
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <Trophy
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            a.isKeyAchievement ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          {a.isKeyAchievement && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">
                              ⭐ Key Milestone
                            </span>
                          )}
                          <p className="leading-relaxed">{a.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Time Breakdown Cards */}
            {report.timeBreakdowns && report.timeBreakdowns.length > 0 && (
              <Card>
                <CardHeader
                  title="Working Hour Breakdown"
                  subtitle="Hours spent across task types"
                />
                <CardContent className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {report.timeBreakdowns.map((tb) => (
                    <div
                      key={tb.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center"
                    >
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {tb.category}
                      </div>
                      <div className="text-lg font-extrabold text-slate-900 mt-1">
                        {tb.hours} <span className="text-xs font-normal text-slate-400">hrs</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Notes & Links */}
            {(report.links || report.notes) && (
              <Card>
                <CardHeader title="Notes & Documentation Links" />
                <CardContent className="space-y-3 text-xs">
                  {report.links && (
                    <div className="flex items-start gap-2">
                      <LinkIcon className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-700">Links: </span>
                        <a
                          href={report.links}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline break-all"
                        >
                          {report.links}
                        </a>
                      </div>
                    </div>
                  )}

                  {report.notes && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-700 mb-1">Summary Notes:</div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {report.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Review History */}
            {report.reviews && report.reviews.length > 0 && (
              <Card>
                <CardHeader
                  title="Manager Review History"
                  subtitle="Recorded decisions and comments on this report"
                />
                <CardContent className="space-y-3">
                  {report.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                        rev.action === 'APPROVED'
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/50 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{rev.reviewer?.name || 'Reviewer'}</span>
                          <Badge status={rev.action} size="sm" />
                        </div>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">{rev.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

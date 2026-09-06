'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent, CardFooter } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Textarea } from '../../../../components/ui/Input';
import { VersionViewer } from '../../../../components/reports/VersionViewer';
import { Report, ReviewAction } from '../../../../types';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Send,
  Calendar,
  User as UserIcon,
  FolderKanban,
  Trophy,
  Clock,
  History,
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../../lib/api';

export default function ManagerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'versions'>('current');
  const [action, setAction] = useState<ReviewAction>('APPROVED');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (action === 'CHANGES_REQUESTED' && (!comment || comment.trim().length === 0)) {
      setError('Please provide a general review comment explaining what needs to be changed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/reports/${reportId}/review`, {
        action,
        comment: comment || 'Approved by manager.',
      });
      router.push('/manager/reports');
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !report) {
    return (
      <DashboardLayout allowedRoles={['MANAGER', 'ADMIN']}>
        <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  const completedTasks = report.tasks?.filter((t) => !t.isPlannedForNextWeek) || [];
  const plannedTasks = report.tasks?.filter((t) => t.isPlannedForNextWeek) || [];

  return (
    <DashboardLayout allowedRoles={['MANAGER', 'ADMIN']}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Manager Review: {report.user?.name}
                </h2>
                <Badge status={report.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {report.project.name} • Version {report.currentVersionNumber}
              </p>
            </div>
          </div>
        </div>

        {/* REVIEW DECISION ACTION BOX */}
        {report.status === 'SUBMITTED' ? (
          <Card className="border-indigo-200 bg-indigo-50/40 shadow-md">
            <CardHeader
              title="Review Decision & Feedback"
              subtitle="Choose to Approve or Send Back for Correction with notes"
            />
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setAction('APPROVED')}
                    className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      action === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
                        : 'bg-white border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="action"
                      checked={action === 'APPROVED'}
                      onChange={() => setAction('APPROVED')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Approve Report</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Status changes to APPROVED. No further edits needed.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setAction('CHANGES_REQUESTED')}
                    className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      action === 'CHANGES_REQUESTED'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-white border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="action"
                      checked={action === 'CHANGES_REQUESTED'}
                      onChange={() => setAction('CHANGES_REQUESTED')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Request Changes</span>
                      </div>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        Status changes to NEEDS CORRECTION for member editing.
                      </div>
                    </div>
                  </label>
                </div>

                <Textarea
                  label={action === 'CHANGES_REQUESTED' ? 'Correction Feedback (Required) *' : 'Review Comment (Optional)'}
                  placeholder={
                    action === 'CHANGES_REQUESTED'
                      ? 'Specify what percentages, blocker details, or deliverables need updating...'
                      : 'Add praise, general notes, or approval feedback...'
                  }
                  required={action === 'CHANGES_REQUESTED'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant={action === 'APPROVED' ? 'success' : 'primary'}
                    size="md"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    {action === 'APPROVED' ? 'Confirm Approval' : 'Send Back for Correction'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <div>
              This report is currently in <b>{report.status}</b> status. Review actions are available when a report is in SUBMITTED status.
            </div>
            <Badge status={report.status} />
          </div>
        )}

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'current'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Submitted Report Contents
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
            <span>Version History Snapshots ({report.versions?.length || 0})</span>
          </button>
        </div>

        {activeTab === 'versions' ? (
          <VersionViewer
            versions={report.versions || []}
            currentVersionNumber={report.currentVersionNumber}
          />
        ) : (
          <div className="space-y-6">
            {/* Meta summary card */}
            <Card>
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Employee</div>
                    <div className="font-semibold text-slate-900">{report.user?.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Project</div>
                    <div className="font-semibold text-slate-900">{report.project.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Sprint Range</div>
                    <div className="font-semibold text-slate-900">
                      {new Date(report.weekStart).toLocaleDateString()} -{' '}
                      {new Date(report.weekEnd).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Hours Logged</div>
                    <div className="font-semibold text-indigo-700">
                      {report.timeBreakdowns?.reduce((s, t) => s + t.hours, 0) || 0} hrs
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Tasks Table */}
            <Card>
              <CardHeader
                title="Completed & In-Progress Tasks"
                subtitle="Verify percentages and deliverables"
              />
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-4">Task Name</th>
                        <th className="py-2.5 px-4">Priority</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Plan / Actual %</th>
                        <th className="py-2.5 px-4">Hours</th>
                        <th className="py-2.5 px-4">Deliverable Link/Output</th>
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
                            {t.actualHours} hrs
                          </td>
                          <td className="py-3 px-4 text-slate-600">{t.deliverable || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Blockers & Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Blockers & Challenges" />
                <CardContent className="space-y-2">
                  {!report.blockers || report.blockers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No blockers reported.</p>
                  ) : (
                    report.blockers.map((b) => (
                      <div
                        key={b.id}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          b.isKeyBlocker
                            ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-semibold'
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
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">
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
                <CardHeader title="Achievements & Highlights" />
                <CardContent className="space-y-2">
                  {!report.achievements || report.achievements.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No achievements logged.</p>
                  ) : (
                    report.achievements.map((a) => (
                      <div
                        key={a.id}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          a.isKeyAchievement
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
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
                            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

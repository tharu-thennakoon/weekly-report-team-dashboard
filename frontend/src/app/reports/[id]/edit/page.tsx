'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '../../../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent, CardFooter } from '../../../../components/ui/Card';
import { Input, Textarea, Select } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { TaskEditor } from '../../../../components/reports/TaskEditor';
import { BlockerEditor } from '../../../../components/reports/BlockerEditor';
import { AchievementEditor } from '../../../../components/reports/AchievementEditor';
import { TimeBreakdownEditor } from '../../../../components/reports/TimeBreakdownEditor';
import { TaskItem, BlockerItem, AchievementItem, TimeBreakdownItem, Project, Report } from '../../../../types';
import { Save, Send, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '../../../../lib/api';
import { formatDateOnly } from '../../../../lib/date';

export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [projectId, setProjectId] = useState<number | ''>('');
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState('');

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [timeBreakdowns, setTimeBreakdowns] = useState<TimeBreakdownItem[]>([]);

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/reports/${reportId}`),
      api.get('/projects?active=true'),
    ])
      .then(([reportRes, projRes]) => {
        const rep: Report = reportRes.data.data;
        setReport(rep);
        setProjects(projRes.data.data);

        // Populate fields
        setProjectId(rep.projectId);
        setWeekStart(formatDateOnly(rep.weekStart));
        setWeekEnd(formatDateOnly(rep.weekEnd));
        setNotes(rep.notes || '');
        setLinks(rep.links || '');
        setTasks(rep.tasks || []);
        setBlockers(rep.blockers || []);
        setAchievements(rep.achievements || []);
        setTimeBreakdowns(rep.timeBreakdowns || []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load report.');
      })
      .finally(() => setIsLoading(false));
  }, [reportId]);

  const handleSave = async (submitAfterSave = false) => {
    setError('');
    if (!projectId) {
      setError('Please select a project category.');
      return;
    }

    if (tasks.filter((t) => !t.isPlannedForNextWeek && t.name.trim() !== '').length === 0) {
      setError('Please add at least one completed or in-progress task for this week.');
      return;
    }

    if (submitAfterSave) {
      setIsSubmitting(true);
    } else {
      setIsSaving(true);
    }

    try {
      // 1. Update report
      await api.put(`/reports/${reportId}`, {
        projectId: Number(projectId),
        weekStart,
        weekEnd,
        notes,
        links,
        tasks: tasks.filter((t) => t.name.trim() !== ''),
        blockers: blockers.filter((b) => b.description.trim() !== ''),
        achievements: achievements.filter((a) => a.description.trim() !== ''),
        timeBreakdowns,
      });

      // 2. Submit if requested
      if (submitAfterSave) {
        await api.post(`/reports/${reportId}/submit`);
      }

      router.push(`/reports/${reportId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update report.');
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  if (isLoading || !report) {
    return (
      <DashboardLayout allowedRoles={['TEAM_MEMBER']}>
        <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-48 bg-slate-200 rounded-xl"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  const latestReview = report.reviews?.[0];

  return (
    <DashboardLayout allowedRoles={['TEAM_MEMBER']}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb & Top Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/reports/${reportId}`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Weekly Report</h2>
                <Badge status={report.status} />
              </div>
              <p className="text-xs text-slate-500">
                Editing Version {report.currentVersionNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isSaving}
              onClick={() => handleSave(false)}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSave(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              {report.status === 'NEEDS_CORRECTION' ? 'Resubmit for Review' : 'Submit Report'}
            </Button>
          </div>
        </div>

        {/* Manager Review Comments Notification */}
        {report.status === 'NEEDS_CORRECTION' && latestReview && (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Manager Feedback from {latestReview.reviewer?.name || 'Reviewer'}:</span>
            </div>
            <p className="text-xs bg-white/80 p-3 rounded-lg border border-amber-200 leading-relaxed font-medium">
              &ldquo;{latestReview.comment}&rdquo;
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Section 1: Basic Report Info */}
        <Card>
          <CardHeader
            title="1. Report Information"
            subtitle="Target sprint week and assigned project category"
          />
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Project / Category *"
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Input
              label="Week Start Date *"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />

            <Input
              label="Week End Date *"
              type="date"
              value={weekEnd}
              onChange={(e) => setWeekEnd(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Section 2: Tasks Completed */}
        <Card>
          <CardHeader
            title="2. Tasks Completed & In-Progress"
            subtitle="Update task percentages, hours logged, and deliverable links"
          />
          <CardContent>
            <TaskEditor tasks={tasks} onChange={setTasks} isPlannedForNextWeek={false} />
          </CardContent>
        </Card>

        {/* Section 3: Tasks Planned for Next Week */}
        <Card>
          <CardHeader
            title="3. Tasks Planned for Next Week"
            subtitle="Update focus areas for next week's sprint"
          />
          <CardContent>
            <TaskEditor tasks={tasks} onChange={setTasks} isPlannedForNextWeek={true} />
          </CardContent>
        </Card>

        {/* Section 4: Blockers & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="4. Blockers & Challenges" subtitle="Flag or update key blockers" />
            <CardContent>
              <BlockerEditor blockers={blockers} onChange={setBlockers} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="5. Highlights & Achievements" subtitle="Record milestones and wins" />
            <CardContent>
              <AchievementEditor achievements={achievements} onChange={setAchievements} />
            </CardContent>
          </Card>
        </div>

        {/* Section 5: Working Hours Breakdown */}
        <Card>
          <CardHeader title="6. Working Hours Breakdown" subtitle="Update logged time distribution" />
          <CardContent>
            <TimeBreakdownEditor timeBreakdowns={timeBreakdowns} onChange={setTimeBreakdowns} />
          </CardContent>
        </Card>

        {/* Section 6: Notes & Links */}
        <Card>
          <CardHeader title="7. Additional Notes & Links" subtitle="Optional documentation & PR links" />
          <CardContent className="space-y-4">
            <Input
              label="Relevant Links / PRs (Optional)"
              type="text"
              placeholder="e.g. https://github.com/org/repo/pull/42"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />

            <Textarea
              label="General Notes & Summary (Optional)"
              placeholder="Notes or comments for manager review..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-slate-500">
              Resubmitting creates a new immutable version snapshot for manager review.
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isSaving}
                onClick={() => handleSave(false)}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={() => handleSave(true)}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                {report.status === 'NEEDS_CORRECTION' ? 'Resubmit for Review' : 'Submit Report'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}

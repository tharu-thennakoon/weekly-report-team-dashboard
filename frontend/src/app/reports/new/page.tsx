'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent, CardFooter } from '../../../components/ui/Card';
import { Input, Textarea, Select } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { TaskEditor } from '../../../components/reports/TaskEditor';
import { BlockerEditor } from '../../../components/reports/BlockerEditor';
import { AchievementEditor } from '../../../components/reports/AchievementEditor';
import { TimeBreakdownEditor } from '../../../components/reports/TimeBreakdownEditor';
import { TaskItem, BlockerItem, AchievementItem, TimeBreakdownItem, Project } from '../../../types';
import { Save, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';
import { getCurrentWeekRange } from '../../../lib/date';

export default function CreateReportPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  // Calculate default Monday & Friday of current week safely
  const currentWeek = getCurrentWeekRange();

  const [projectId, setProjectId] = useState<number | ''>('');
  const [weekStart, setWeekStart] = useState<string>(currentWeek.weekStart);
  const [weekEnd, setWeekEnd] = useState<string>(currentWeek.weekEnd);
  const [notes, setNotes] = useState('');
  const [links, setLinks] = useState('');

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      name: '',
      priority: 'MEDIUM',
      plannedPercent: 100,
      actualPercent: 100,
      status: 'COMPLETED',
      plannedHours: 16,
      actualHours: 16,
      deliverable: '',
      isPlannedForNextWeek: false,
    },
  ]);

  const [blockers, setBlockers] = useState<BlockerItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [timeBreakdowns, setTimeBreakdowns] = useState<TimeBreakdownItem[]>([
    { category: 'DEVELOPMENT', hours: 24 },
    { category: 'TESTING', hours: 8 },
    { category: 'MEETINGS', hours: 4 },
  ]);

  const [error, setError] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get('/projects?active=true')
      .then((res) => {
        setProjects(res.data.data);
        if (res.data.data.length > 0) {
          setProjectId(res.data.data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (submitDirectly = false) => {
    setError('');
    if (!projectId) {
      setError('Please select a project or work category.');
      return;
    }

    if (tasks.filter((t) => !t.isPlannedForNextWeek && t.name.trim() !== '').length === 0) {
      setError('Please add at least one completed or in-progress task for this week.');
      return;
    }

    if (submitDirectly) {
      setIsSubmitting(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      // 1. Create Report Draft
      const res = await api.post('/reports', {
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

      const newReport = res.data.data;

      // 2. If user clicked Submit Report, trigger the submission workflow transition
      if (submitDirectly) {
        await api.post(`/reports/${newReport.id}/submit`);
      }

      router.push(`/reports/${newReport.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save report.');
    } finally {
      setIsSavingDraft(false);
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['TEAM_MEMBER']}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Weekly Report</h2>
              <p className="text-xs text-slate-500">
                Submit standard structured report for manager review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isSavingDraft}
              onClick={() => handleSave(false)}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSave(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit Report
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Section 1: Basic Report Info */}
        <Card>
          <CardHeader
            title="1. Report Information"
            subtitle="Select the target sprint week and primary project category"
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

        {/* Section 2: Tasks Completed Table */}
        <Card>
          <CardHeader
            title="2. Tasks Completed & In-Progress"
            subtitle="Document all deliverables, planned vs actual progress, and time spent"
          />
          <CardContent>
            <TaskEditor
              tasks={tasks}
              onChange={setTasks}
              isPlannedForNextWeek={false}
            />
          </CardContent>
        </Card>

        {/* Section 3: Tasks Planned for Next Week */}
        <Card>
          <CardHeader
            title="3. Tasks Planned for Next Week"
            subtitle="Outline expected milestones and planned focus for the upcoming sprint"
          />
          <CardContent>
            <TaskEditor
              tasks={tasks}
              onChange={setTasks}
              isPlannedForNextWeek={true}
            />
          </CardContent>
        </Card>

        {/* Section 4: Blockers & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader
              title="4. Blockers & Challenges"
              subtitle="Flag critical blockers to notify your manager"
            />
            <CardContent>
              <BlockerEditor blockers={blockers} onChange={setBlockers} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="5. Highlights & Achievements"
              subtitle="Celebrate key deliverables, performance wins, or milestones"
            />
            <CardContent>
              <AchievementEditor achievements={achievements} onChange={setAchievements} />
            </CardContent>
          </Card>
        </div>

        {/* Section 5: Working Hour Breakdown */}
        <Card>
          <CardHeader
            title="6. Working Hours Breakdown"
            subtitle="Categorize hours logged across development, testing, meetings, and docs"
          />
          <CardContent>
            <TimeBreakdownEditor timeBreakdowns={timeBreakdowns} onChange={setTimeBreakdowns} />
          </CardContent>
        </Card>

        {/* Section 6: Notes & Links */}
        <Card>
          <CardHeader
            title="7. Additional Notes & Links"
            subtitle="Optional links to PRs, Jira tickets, documentation, or design files"
          />
          <CardContent className="space-y-4">
            <Input
              label="Relevant Links / PRs (Optional)"
              type="text"
              placeholder="e.g. https://github.com/org/repo/pull/42, https://jira.internal/PROJ-123"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />

            <Textarea
              label="General Notes & Summary (Optional)"
              placeholder="Any additional context or summary for your team lead..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
          <CardFooter>
            <div className="text-xs text-slate-500">
              Drafts can be edited at any time. Submitting will lock the report for manager review.
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isSavingDraft}
                onClick={() => handleSave(false)}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={() => handleSave(true)}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Submit Report
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}

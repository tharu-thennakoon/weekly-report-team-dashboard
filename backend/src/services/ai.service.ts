import prisma from '../config/prisma.js';
import { Role, ReportStatus, TaskStatus } from '@prisma/client';
import { AI_SYSTEM_PROMPT } from '../config/aiPrompt.js';
import { ChatInput } from '../validators/ai.validator.js';

export class AiService {
  /**
   * Helper to determine week date range
   */
  private getTargetWeekRange(weekStartStr?: string, weekEndStr?: string) {
    if (weekStartStr && weekEndStr) {
      return {
        weekStart: new Date(weekStartStr),
        weekEnd: new Date(weekEndStr),
      };
    }

    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    return { weekStart: monday, weekEnd: friday };
  }

  /**
   * Main AI Chat handler:
   * 1. Aggregates clean structured report context from MySQL via Prisma
   * 2. Calls LLM with strict system prompt
   * 3. Falls back gracefully to deterministic synthesis if LLM provider is unavailable
   */
  async processChat(input: ChatInput) {
    const { weekStart, weekEnd } = this.getTargetWeekRange(input.weekStart, input.weekEnd);

    // 1. Fetch relevant report data from MySQL
    const [teamMembers, activeProjects, reports] = await Promise.all([
      prisma.user.findMany({
        where: { role: Role.TEAM_MEMBER, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.project.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.report.findMany({
        where: {
          weekStart: { gte: weekStart, lte: weekEnd },
        },
        include: {
          user: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          tasks: { where: { reportVersionId: null } },
          blockers: { where: { reportVersionId: null } },
          achievements: { where: { reportVersionId: null } },
          timeBreakdowns: { where: { reportVersionId: null } },
          reviews: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { reviewer: { select: { name: true } } },
          },
        },
      }),
    ]);

    // 2. Deterministic aggregations
    const submittedUserIds = new Set(
      reports
        .filter((r) => r.status === ReportStatus.SUBMITTED || r.status === ReportStatus.APPROVED)
        .map((r) => r.userId)
    );

    const notStartedMembers = teamMembers
      .filter((m) => !reports.some((r) => r.userId === m.id))
      .map((m) => m.name);

    const needsCorrectionReports = reports
      .filter((r) => r.status === ReportStatus.NEEDS_CORRECTION)
      .map((r) => ({
        member: r.user.name,
        project: r.project.name,
        feedback: r.reviews?.[0]?.comment || 'Correction requested',
      }));

    const allBlockers = reports.flatMap((r) =>
      r.blockers.map((b) => ({
        member: r.user.name,
        project: r.project.name,
        description: b.description,
        isKeyBlocker: b.isKeyBlocker,
      }))
    );

    const allAchievements = reports.flatMap((r) =>
      r.achievements.map((a) => ({
        member: r.user.name,
        project: r.project.name,
        description: a.description,
        isKeyAchievement: a.isKeyAchievement,
      }))
    );

    const projectWorkload: Record<string, { tasksCount: number; hours: number }> = {};
    for (const proj of activeProjects) {
      projectWorkload[proj.name] = { tasksCount: 0, hours: 0 };
    }
    for (const r of reports) {
      const proj = projectWorkload[r.project.name] || { tasksCount: 0, hours: 0 };
      proj.tasksCount += r.tasks.length;
      proj.hours += r.timeBreakdowns.reduce((sum, tb) => sum + tb.hours, 0);
      projectWorkload[r.project.name] = proj;
    }

    const categoryHours: Record<string, number> = {
      DEVELOPMENT: 0,
      TESTING: 0,
      MEETINGS: 0,
      DOCUMENTATION: 0,
      OTHER: 0,
    };
    for (const r of reports) {
      for (const tb of r.timeBreakdowns) {
        categoryHours[tb.category] = (categoryHours[tb.category] || 0) + tb.hours;
      }
    }

    // 3. Build safe, privacy-preserving structured context (NO passwords, NO tokens, NO hashes)
    const structuredContext = {
      sprintWeek: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
      metrics: {
        totalTeamMembers: teamMembers.length,
        submitted: reports.filter((r) => r.status === ReportStatus.SUBMITTED).length,
        approved: reports.filter((r) => r.status === ReportStatus.APPROVED).length,
        needsCorrection: reports.filter((r) => r.status === ReportStatus.NEEDS_CORRECTION).length,
        draft: reports.filter((r) => r.status === ReportStatus.DRAFT).length,
        notStarted: notStartedMembers.length,
        notStartedMembers,
      },
      reportsNeedingCorrection: needsCorrectionReports,
      blockers: allBlockers,
      achievements: allAchievements,
      workloadByProject: projectWorkload,
      hoursByTaskCategory: categoryHours,
      completedDeliverables: reports.flatMap((r) =>
        r.tasks
          .filter((t) => t.status === TaskStatus.COMPLETED)
          .map((t) => ({
            member: r.user.name,
            project: r.project.name,
            task: t.name,
            deliverable: t.deliverable || 'Done',
          }))
      ),
    };

    // 4. Attempt calling LLM provider if configured
    let answer: string | null = null;
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

    if (provider === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY;
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      if (geminiKey) {
        try {
          answer = await this.callGemini(input.message, structuredContext, geminiKey, model);
        } catch (err) {
          console.warn('Gemini LLM API call failed, falling back to deterministic synthesis:', err);
        }
      }
    } else if (provider === 'openai') {
      const openaiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      if (openaiKey) {
        try {
          answer = await this.callOpenAi(input.message, structuredContext, openaiKey, model);
        } catch (err) {
          console.warn('OpenAI LLM API call failed, falling back to deterministic synthesis:', err);
        }
      }
    }

    // 5. Fallback to deterministic synthesis if LLM is not configured or failed
    if (!answer) {
      answer = this.deterministicFallback(input.message, structuredContext);
    }

    return {
      answer,
      week: {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Call Google Gemini API
   */
  private async callGemini(query: string, context: any, apiKey: string, model: string): Promise<string | null> {
    const prompt = `${AI_SYSTEM_PROMPT}\n\nWEEKLY REPORT CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nMANAGER QUESTION:\n${query}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 800, temperature: 0.2 },
          }),
          signal: AbortSignal.timeout(6000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      // Return null to allow deterministic fallback
    }

    return null;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAi(query: string, context: any, apiKey: string, model: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            { role: 'user', content: `CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nQUESTION: ${query}` },
          ],
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (e) {
      // Return null to allow deterministic fallback
    }

    return null;
  }

  /**
   * Deterministic grounded response generator
   * Answers manager questions accurately using calculated report metrics with 0 hallucination.
   */
  private deterministicFallback(query: string, ctx: any): string {
    const q = query.toLowerCase();

    // 1. Blockers / Challenges
    if (q.includes('blocker') || q.includes('issue') || q.includes('challenge') || q.includes('obstacle') || q.includes('stuck')) {
      if (ctx.blockers.length === 0) {
        return `✅ **No blockers reported** for the sprint week (${ctx.sprintWeek}). All team projects are progressing without impediment.`;
      }
      const keyBlockers = ctx.blockers.filter((b: any) => b.isKeyBlocker);
      let res = `⚠️ **${ctx.blockers.length} active blocker(s)** reported for this week (${keyBlockers.length} marked as key blockers):\n\n`;
      ctx.blockers.forEach((b: any) => {
        res += `• **${b.member}** (${b.project}): ${b.description} ${b.isKeyBlocker ? '🚨 **[Key Blocker]**' : ''}\n`;
      });
      if (keyBlockers.length > 0) {
        res += `\n💡 **Recommendation:** Prioritize resolving the key blockers on ${keyBlockers.map((k: any) => k.project).join(', ')} to prevent sprint delay.`;
      }
      return res;
    }

    // 2. Achievements / Highlights / Milestones
    if (q.includes('achievement') || q.includes('highlight') || q.includes('win') || q.includes('milestone') || q.includes('completed work')) {
      if (ctx.achievements.length === 0 && ctx.completedDeliverables.length === 0) {
        return `No key achievements or completed deliverables have been logged yet for the week of ${ctx.sprintWeek}.`;
      }
      let res = `⭐ **Key Team Achievements & Highlights (${ctx.sprintWeek}):**\n\n`;
      ctx.achievements.forEach((a: any) => {
        res += `• **${a.member}** (${a.project}): ${a.description} ${a.isKeyAchievement ? '🏆 **[Key Milestone]**' : ''}\n`;
      });
      if (ctx.completedDeliverables.length > 0) {
        res += `\n**Key Completed Deliverables:**\n`;
        ctx.completedDeliverables.slice(0, 5).forEach((d: any) => {
          res += `• **${d.member}** (${d.project}): ${d.task} — *${d.deliverable}*\n`;
        });
      }
      return res;
    }

    // 3. Pending Submissions / Who has not submitted
    if (q.includes('who has not') || q.includes('not submitted') || q.includes('pending') || q.includes('missing') || q.includes('compliance')) {
      const { notStarted, totalTeamMembers, submitted, approved, notStartedMembers } = ctx.metrics;
      let res = `📋 **Submission Compliance Summary (${ctx.sprintWeek}):**\n\n`;
      res += `• **Total Active Engineers:** ${totalTeamMembers}\n`;
      res += `• **Submitted / Approved:** ${submitted + approved}\n`;
      res += `• **Pending / Not Started:** ${notStarted}\n\n`;
      if (notStartedMembers.length > 0) {
        res += `**Engineers who have not submitted their report:**\n`;
        notStartedMembers.forEach((name: string) => {
          res += `• ⏳ ${name}\n`;
        });
        res += `\n💡 **Action:** Send a reminder to pending team members before the review cutoff.`;
      } else {
        res += `🎉 **100% Compliance:** All active team members have submitted their weekly reports on time!`;
      }
      return res;
    }

    // 4. Reports needing correction
    if (q.includes('correction') || q.includes('needs correction') || q.includes('changes requested') || q.includes('sent back')) {
      if (ctx.reportsNeedingCorrection.length === 0) {
        return `✅ **Zero reports in Needs Correction status.** All submitted reports have either been approved or are currently awaiting initial review.`;
      }
      let res = `✏️ **${ctx.reportsNeedingCorrection.length} report(s) currently need correction:**\n\n`;
      ctx.reportsNeedingCorrection.forEach((r: any) => {
        res += `• **${r.member}** (${r.project}):\n  ↳ Feedback: *"${r.feedback}"*\n`;
      });
      return res;
    }

    // 5. Workload distribution by project
    if (q.includes('workload') || q.includes('highest workload') || q.includes('project') || q.includes('distribution')) {
      let res = `📊 **Workload & Task Distribution by Project (${ctx.sprintWeek}):**\n\n`;
      const projectEntries = Object.entries(ctx.workloadByProject || {}) as [string, { tasksCount: number; hours: number }][];
      const sortedProjects = projectEntries.sort(([, a], [, b]) => b.tasksCount - a.tasksCount);
      sortedProjects.forEach(([name, val]) => {
        res += `• **${name}**: ${val.tasksCount} active tasks (${val.hours} logged hours)\n`;
      });
      if (sortedProjects.length > 0) {
        const [topName, topVal] = sortedProjects[0];
        res += `\n🏆 **Highest Workload:** **${topName}** with ${topVal.tasksCount} tasks.`;
      }
      return res;
    }

    // 6. Time distribution (hours by category)
    if (q.includes('time') || q.includes('hours') || q.includes('development') || q.includes('testing') || q.includes('meeting')) {
      const totalHours = Object.values(ctx.hoursByTaskCategory).reduce((a: any, b: any) => a + b, 0) as number;
      let res = `⏱️ **Working Hours Distribution Team-Wide (${ctx.sprintWeek}):**\n\n`;
      res += `• **Development:** ${ctx.hoursByTaskCategory.DEVELOPMENT} hrs\n`;
      res += `• **Testing & QA:** ${ctx.hoursByTaskCategory.TESTING} hrs\n`;
      res += `• **Meetings & Syncs:** ${ctx.hoursByTaskCategory.MEETINGS} hrs\n`;
      res += `• **Documentation:** ${ctx.hoursByTaskCategory.DOCUMENTATION} hrs\n`;
      res += `• **Other Tasks:** ${ctx.hoursByTaskCategory.OTHER} hrs\n\n`;
      res += `**Total Logged Time:** **${totalHours} hours** across all active reports.`;
      return res;
    }

    // 7. General / Executive Weekly Summary
    const { totalTeamMembers, submitted, approved, needsCorrection, notStarted } = ctx.metrics;
    let res = `📌 **Executive Management Summary (${ctx.sprintWeek}):**\n\n`;
    res += `• **Team Size:** ${totalTeamMembers} active members\n`;
    res += `• **Submission Status:** ${submitted} under review, ${approved} approved, ${needsCorrection} need correction, ${notStarted} pending\n`;
    res += `• **Open Blockers:** ${ctx.blockers.length} (${ctx.blockers.filter((b: any) => b.isKeyBlocker).length} key blockers)\n`;
    res += `• **Deliverables Completed:** ${ctx.completedDeliverables.length} tasks delivered\n\n`;
    res += `💡 **Next Steps:** Review pending submissions in the **Manager Review** tab and check in with engineers experiencing blockers.`;
    return res;
  }
}

export const aiService = new AiService();

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { User, Report } from '../../../types';
import { ArrowLeft, Mail, Calendar, Layers, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';

export default function TeamMemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [member, setMember] = useState<(User & { reports: Report[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${userId}`)
      .then((res) => setMember(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading || !member) {
    return (
      <DashboardLayout allowedRoles={['MANAGER', 'ADMIN']}>
        <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-48 bg-slate-200 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  const approvedReports = member.reports.filter((r) => r.status === 'APPROVED').length;
  const submittedReports = member.reports.filter((r) => r.status === 'SUBMITTED').length;

  return (
    <DashboardLayout allowedRoles={['MANAGER', 'ADMIN']}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{member.name}</h2>
              <Badge status={member.role} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>
          </div>
        </div>

        {/* Member Profile Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900">{member.reports.length}</div>
                <div className="text-xs text-slate-500">Total Submissions</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-emerald-600">{approvedReports}</div>
                <div className="text-xs text-slate-500">Approved Reports</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-blue-600">{submittedReports}</div>
                <div className="text-xs text-slate-500">Under Review</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Archive */}
        <Card>
          <CardHeader
            title="Weekly Submissions Log"
            subtitle={`Historical performance archive for ${member.name}`}
          />
          <CardContent className="p-0">
            {member.reports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No reports submitted yet by this team member.
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
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {member.reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(rep.weekStart).toLocaleDateString()} -{' '}
                            {new Date(rep.weekEnd).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {rep.project?.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={rep.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {rep._count?.tasks || 0} tasks
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/reports/${rep.id}`}>
                            <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3 h-3" />}>
                              View
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
    </DashboardLayout>
  );
}

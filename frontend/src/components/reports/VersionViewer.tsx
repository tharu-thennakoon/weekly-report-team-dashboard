'use client';

import React, { useState } from 'react';
import { ReportVersion } from '../../types';
import { Badge } from '../ui/Badge';
import { History, Calendar, CheckCircle, MessageSquare } from 'lucide-react';

interface VersionViewerProps {
  versions: ReportVersion[];
  currentVersionNumber: number;
}

export const VersionViewer: React.FC<VersionViewerProps> = ({
  versions,
  currentVersionNumber,
}) => {
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(
    versions.length > 0 ? versions[0].versionNumber : currentVersionNumber
  );

  if (!versions || versions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-slate-50">
        No submitted versions recorded yet. (Versions are created upon submission).
      </div>
    );
  }

  const selectedVersion =
    versions.find((v) => v.versionNumber === selectedVersionNum) || versions[0];

  let parsedSnapshot: any = null;
  try {
    parsedSnapshot = JSON.parse(selectedVersion.snapshotData);
  } catch (e) {
    parsedSnapshot = null;
  }

  return (
    <div className="space-y-4">
      {/* Version selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2 shrink-0">
          <History className="w-4 h-4 text-indigo-600" />
          <span>Version Snapshots:</span>
        </div>
        {versions.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelectedVersionNum(v.versionNumber)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
              selectedVersionNum === v.versionNumber
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Version {v.versionNumber}</span>
            {v.versionNumber === currentVersionNumber && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${selectedVersionNum === v.versionNumber ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                Latest
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected Version Card */}
      <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900">
              Snapshot: Version {selectedVersion.versionNumber}
            </span>
            <Badge status={selectedVersion.statusAtSubmission} size="sm" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Submitted: {new Date(selectedVersion.submittedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Manager Reviews against this version */}
        {selectedVersion.reviews && selectedVersion.reviews.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Manager Review on this Version</span>
            </div>
            {selectedVersion.reviews.map((rev) => (
              <div
                key={rev.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  rev.action === 'APPROVED'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <span>{rev.reviewer?.name || 'Manager'}</span>
                    <Badge status={rev.action} size="sm" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {new Date(rev.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tasks in this snapshot */}
        {parsedSnapshot?.tasks && parsedSnapshot.tasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Tasks in Version {selectedVersion.versionNumber}
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    <th className="py-2 px-3">Task</th>
                    <th className="py-2 px-3">Priority</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Plan/Act %</th>
                    <th className="py-2 px-3">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedSnapshot.tasks.map((t: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2.5 font-medium text-slate-800">{t.name}</td>
                      <td className="p-2.5">
                        <Badge status={t.priority} size="sm" />
                      </td>
                      <td className="p-2.5">
                        <Badge status={t.status || 'COMPLETED'} size="sm" />
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {t.plannedPercent}% / <span className="font-semibold text-indigo-600">{t.actualPercent}%</span>
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {t.actualHours || 0} hrs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Blockers & Highlights in snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {parsedSnapshot?.blockers && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <span>Blockers ({parsedSnapshot.blockers.length})</span>
              </div>
              {parsedSnapshot.blockers.length === 0 ? (
                <p className="text-xs text-slate-400">None</p>
              ) : (
                <ul className="space-y-1 text-xs text-slate-700">
                  {parsedSnapshot.blockers.map((b: any, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span>•</span>
                      <span>{b.description} {b.isKeyBlocker && <b className="text-amber-700">[Key]</b>}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {parsedSnapshot?.achievements && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <span>Achievements ({parsedSnapshot.achievements.length})</span>
              </div>
              {parsedSnapshot.achievements.length === 0 ? (
                <p className="text-xs text-slate-400">None</p>
              ) : (
                <ul className="space-y-1 text-xs text-slate-700">
                  {parsedSnapshot.achievements.map((a: any, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span>•</span>
                      <span>{a.description} {a.isKeyAchievement && <b className="text-emerald-700">[Key]</b>}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

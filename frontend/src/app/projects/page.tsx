'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Project } from '../../types';
import { Plus, Edit2, Trash2, FolderKanban, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/api';

export default function ProjectsPage() {
  const { isManager } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjects = () => {
    setIsLoading(true);
    api.get('/projects')
      .then((res) => setProjects(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setIsActive(project.isActive);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingProject) {
        await api.patch(`/projects/${editingProject.id}`, { name, description, isActive });
      } else {
        await api.post('/projects', { name, description, isActive });
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to save project.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete or deactivate this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  return (
    <DashboardLayout allowedRoles={['TEAM_MEMBER', 'MANAGER', 'ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Projects & Work Categories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage work streams and categories attached to weekly reporting
            </p>
          </div>
          {isManager && (
            <Button
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Project
            </Button>
          )}
        </div>

        {/* Projects List Card */}
        <Card>
          <CardHeader
            title="Active Work Streams"
            subtitle={`${projects.length} project categories configured`}
          />
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No projects found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Project Name</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reports Logged</th>
                      {isManager && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <FolderKanban className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>{proj.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-md">
                          {proj.description || <span className="text-slate-400 italic">No description</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          {proj.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {proj._count?.reports || 0} reports
                        </td>
                        {isManager && (
                          <td className="py-3.5 px-4 text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(proj)}
                              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(proj.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              Delete
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal for Add / Edit Project */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProject ? 'Edit Project' : 'Create New Project'}
          subtitle="Define project category and details for team report association"
        >
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Project Name *"
              required
              placeholder="e.g. Mobile App Modernization"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Textarea
              label="Description (Optional)"
              placeholder="Brief summary of project scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is-active-chk"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="is-active-chk" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Active project (available for weekly report selection)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                {editingProject ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

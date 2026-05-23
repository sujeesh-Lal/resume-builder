import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { Project } from '@resume-platform/shared-types';

function ProjectForm({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (data: Project) => void;
  onCancel: () => void;
  initial?: Partial<Project>;
}) {
  const { register, handleSubmit } = useForm<Omit<Project, 'technologies' | 'highlights'>>({
    defaultValues: initial,
  });
  const [tech, setTech] = useState('');
  const [technologies, setTechnologies] = useState<string[]>(initial?.technologies ?? []);
  const [highlight, setHighlight] = useState('');
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? []);

  const onSubmit = (data: Omit<Project, 'technologies' | 'highlights'>) => {
    onSave({ ...data, id: initial?.id ?? crypto.randomUUID(), technologies, highlights });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="form-label">Project Name *</label>
          <input {...register('name', { required: true })} className="form-input" placeholder="ResumeBuilder" />
        </div>
        <div>
          <label className="form-label">Project URL</label>
          <input {...register('url')} className="form-input" placeholder="https://..." />
        </div>
        <div>
          <label className="form-label">GitHub URL</label>
          <input {...register('githubUrl')} className="form-input" placeholder="https://github.com/..." />
        </div>
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea {...register('description')} rows={2} className="form-input resize-none" placeholder="What does this project do?" />
      </div>

      <div>
        <label className="form-label">Technologies</label>
        <div className="flex gap-2">
          <input
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tech.trim() && (setTechnologies((t) => [...t, tech.trim()]), setTech('')))}
            className="form-input"
            placeholder="e.g. React, NestJS"
          />
          <button type="button" onClick={() => tech.trim() && (setTechnologies((t) => [...t, tech.trim()]), setTech(''))} className="btn-secondary shrink-0">Add</button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {technologies.map((t, i) => (
            <span key={i} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {t}
              <button type="button" onClick={() => setTechnologies((ts) => ts.filter((_, j) => j !== i))}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

export function ProjectsStep() {
  const { resume, addProject, updateProject, removeProject } = useResumeStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <StepLayout title="Projects" description="Showcase your personal and professional projects.">
      <div className="space-y-3">
        {resume.projects.map((proj) =>
          editId === proj.id ? (
            <ProjectForm
              key={proj.id}
              initial={proj}
              onSave={(data) => { updateProject(proj.id, data); setEditId(null); }}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <div key={proj.id} className="flex items-start justify-between border border-gray-200 rounded-lg p-4">
              <div>
                <p className="font-medium text-gray-900">{proj.name}</p>
                <p className="text-sm text-gray-600 mt-0.5">{proj.description}</p>
                {proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.technologies.map((t) => (
                      <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditId(proj.id)} className="text-sm text-primary-600 hover:underline">Edit</button>
                <button onClick={() => removeProject(proj.id)} className="text-sm text-red-500 hover:underline">Remove</button>
              </div>
            </div>
          ),
        )}

        {showForm && !editId && (
          <ProjectForm
            onSave={(data) => { addProject(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {!showForm && !editId && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            + Add Project
          </button>
        )}
      </div>
    </StepLayout>
  );
}

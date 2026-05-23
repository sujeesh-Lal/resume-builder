import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { WorkExperience } from '@resume-platform/shared-types';

function ExperienceForm({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (data: WorkExperience) => void;
  onCancel: () => void;
  initial?: Partial<WorkExperience>;
}) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<WorkExperience>({
    defaultValues: { current: false, highlights: [], ...initial },
  });
  const isCurrent = watch('current');
  const [highlight, setHighlight] = useState('');
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? []);

  const addHighlight = () => {
    if (highlight.trim()) {
      setHighlights((h) => [...h, highlight.trim()]);
      setHighlight('');
    }
  };

  const onSubmit = (data: WorkExperience) => {
    onSave({ ...data, id: initial?.id ?? crypto.randomUUID(), highlights });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="form-label">Job Title *</label>
          <input {...register('position', { required: true })} className="form-input" placeholder="Software Engineer" />
        </div>
        <div>
          <label className="form-label">Company *</label>
          <input {...register('company', { required: true })} className="form-input" placeholder="Acme Corp" />
        </div>
        <div>
          <label className="form-label">Start Date *</label>
          <input {...register('startDate', { required: true })} type="month" className="form-input" />
        </div>
        <div>
          <label className="form-label">End Date</label>
          <input {...register('endDate')} type="month" className="form-input" disabled={isCurrent} />
          <label className="flex items-center gap-2 mt-1 text-xs text-gray-600 cursor-pointer">
            <input {...register('current')} type="checkbox" />
            Currently working here
          </label>
        </div>
        <div>
          <label className="form-label">Location</label>
          <input {...register('location')} className="form-input" placeholder="Remote / New York, NY" />
        </div>
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="form-input resize-none"
          placeholder="Describe your role and responsibilities..."
        />
      </div>

      <div>
        <label className="form-label">Key Highlights</label>
        <div className="flex gap-2">
          <input
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
            className="form-input"
            placeholder="e.g. Increased performance by 40%"
          />
          <button type="button" onClick={addHighlight} className="btn-secondary shrink-0">Add</button>
        </div>
        {highlights.length > 0 && (
          <ul className="mt-2 space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary-600 mt-0.5">•</span>
                <span className="flex-1">{h}</span>
                <button type="button" onClick={() => setHighlights((hs) => hs.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

export function ExperienceStep() {
  const { resume, addExperience, updateExperience, removeExperience } = useResumeStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <StepLayout
      title="Work Experience"
      description="Add your most recent positions first."
    >
      <div className="space-y-3">
        {resume.experience.map((exp) => (
          editId === exp.id ? (
            <ExperienceForm
              key={exp.id}
              initial={exp}
              onSave={(data) => { updateExperience(exp.id, data); setEditId(null); }}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <div key={exp.id} className="flex items-start justify-between border border-gray-200 rounded-lg p-4">
              <div>
                <p className="font-medium text-gray-900">{exp.position}</p>
                <p className="text-sm text-gray-600">{exp.company} {exp.location ? `· ${exp.location}` : ''}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {exp.startDate} – {exp.current ? 'Present' : exp.endDate ?? ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditId(exp.id)} className="text-sm text-primary-600 hover:underline">Edit</button>
                <button onClick={() => removeExperience(exp.id)} className="text-sm text-red-500 hover:underline">Remove</button>
              </div>
            </div>
          )
        ))}

        {showForm && !editId && (
          <ExperienceForm
            onSave={(data) => { addExperience(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {!showForm && !editId && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            + Add Work Experience
          </button>
        )}
      </div>
    </StepLayout>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { WorkExperience } from '@resume-platform/shared-types';

// Normalize legacy string description to string[]
function toDescArray(d: string | string[] | undefined): string[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.trim() ? [d.trim()] : [];
}

function BulletListInput({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    if (draft.trim()) {
      onChange([...items, draft.trim()]);
      setDraft('');
    }
  };

  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));

  const update = (i: number, val: string) =>
    onChange(items.map((item, j) => (j === i ? val : item)));

  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          className="form-input"
          placeholder={placeholder}
        />
        <button type="button" onClick={add} className="btn-secondary shrink-0">Add</button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-primary-500 shrink-0">•</span>
              <input
                value={item}
                onChange={(e) => update(i, e.target.value)}
                className="form-input flex-1 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-400 hover:text-red-600 shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExperienceForm({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (data: WorkExperience) => void;
  onCancel: () => void;
  initial?: Partial<WorkExperience>;
}) {
  const { register, handleSubmit, watch } = useForm<WorkExperience>({
    defaultValues: { current: false, description: [], highlights: [], ...initial },
  });
  const isCurrent = watch('current');
  const [description, setDescription] = useState<string[]>(toDescArray(initial?.description));
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? []);

  const onSubmit = (data: WorkExperience) => {
    onSave({ ...data, id: initial?.id ?? crypto.randomUUID(), description, highlights });
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
          <label className="form-label">Start Year *</label>
          <input
            {...register('startDate', { required: true })}
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            className="form-input"
            placeholder={String(new Date().getFullYear())}
          />
        </div>
        <div>
          <label className="form-label">End Year</label>
          <input
            {...register('endDate')}
            type="number"
            min="1950"
            max={new Date().getFullYear() + 5}
            className="form-input"
            placeholder={String(new Date().getFullYear())}
            disabled={isCurrent}
          />
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

      <BulletListInput
        label="Description"
        placeholder="Describe a responsibility or duty…"
        items={description}
        onChange={setDescription}
      />

      <BulletListInput
        label="Key Highlights"
        placeholder="e.g. Increased performance by 40%"
        items={highlights}
        onChange={setHighlights}
      />

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

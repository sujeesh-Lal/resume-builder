import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { Education } from '@resume-platform/shared-types';

// Normalize legacy string description to string[]
function toDescArray(d: string | string[] | undefined): string[] {
  if (!d) return [];
  if (Array.isArray(d)) return d.filter(Boolean);
  return (d as string).trim() ? [(d as string).trim()] : [];
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

function EducationForm({
  onSave,
  onCancel,
  initial,
}: {
  onSave: (data: Education) => void;
  onCancel: () => void;
  initial?: Partial<Education>;
}) {
  const { register, handleSubmit, watch } = useForm<Education>({
    defaultValues: { current: false, description: [], highlights: [], ...initial },
  });
  const isCurrent = watch('current');
  const [description, setDescription] = useState<string[]>(toDescArray(initial?.description));

  const currentYear = new Date().getFullYear();

  const onSubmit = (data: Education) => {
    onSave({ ...data, id: initial?.id ?? crypto.randomUUID(), description, highlights: [] });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="form-label">Institution *</label>
          <input {...register('institution', { required: true })} className="form-input" placeholder="MIT" />
        </div>
        <div>
          <label className="form-label">Degree *</label>
          <input {...register('degree', { required: true })} className="form-input" placeholder="Bachelor of Science" />
        </div>
        <div>
          <label className="form-label">Field of Study *</label>
          <input {...register('field', { required: true })} className="form-input" placeholder="Computer Science" />
        </div>
        <div>
          <label className="form-label">Start Year</label>
          <input
            {...register('startDate')}
            type="number"
            min="1950"
            max={currentYear}
            className="form-input"
            placeholder={String(currentYear)}
          />
        </div>
        <div>
          <label className="form-label">End Year</label>
          <input
            {...register('endDate')}
            type="number"
            min="1950"
            max={currentYear + 10}
            className="form-input"
            placeholder={String(currentYear)}
            disabled={isCurrent}
          />
          <label className="flex items-center gap-2 mt-1 text-xs text-gray-600 cursor-pointer">
            <input {...register('current')} type="checkbox" />
            Currently enrolled
          </label>
        </div>
        <div>
          <label className="form-label">GPA (optional)</label>
          <input {...register('gpa')} className="form-input" placeholder="3.8 / 4.0" />
        </div>
      </div>

      <BulletListInput
        label="Description"
        placeholder="e.g. Thesis on distributed systems…"
        items={description}
        onChange={setDescription}
      />

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

export function EducationStep() {
  const { resume, addEducation, updateEducation, removeEducation } = useResumeStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <StepLayout title="Education" description="List your degrees and academic achievements.">
      <div className="space-y-3">
        {resume.education.map((edu) =>
          editId === edu.id ? (
            <EducationForm
              key={edu.id}
              initial={edu}
              onSave={(data) => { updateEducation(edu.id, data); setEditId(null); }}
              onCancel={() => setEditId(null)}
            />
          ) : (
            <div key={edu.id} className="flex items-start justify-between border border-gray-200 rounded-lg p-4">
              <div>
                <p className="font-medium text-gray-900">{edu.degree} in {edu.field}</p>
                <p className="text-sm text-gray-600">{edu.institution}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {edu.startDate} – {edu.current ? 'Present' : edu.endDate ?? ''}
                  {edu.gpa ? ` · GPA: ${edu.gpa}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditId(edu.id)} className="text-sm text-primary-600 hover:underline">Edit</button>
                <button onClick={() => removeEducation(edu.id)} className="text-sm text-red-500 hover:underline">Remove</button>
              </div>
            </div>
          ),
        )}

        {showForm && !editId && (
          <EducationForm
            onSave={(data) => { addEducation(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {!showForm && !editId && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            + Add Education
          </button>
        )}
      </div>
    </StepLayout>
  );
}

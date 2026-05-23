import { useState } from 'react';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { Skill } from '@resume-platform/shared-types';
import clsx from 'clsx';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-gray-100 text-gray-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-green-100 text-green-700',
  expert: 'bg-purple-100 text-purple-700',
};

export function SkillsStep() {
  const { resume, addSkill, removeSkill } = useResumeStore();
  const [name, setName] = useState('');
  const [level, setLevel] = useState<Skill['level']>('intermediate');
  const [category, setCategory] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addSkill({ id: crypto.randomUUID(), name: name.trim(), level, category: category.trim() || undefined });
    setName('');
  };

  const grouped = resume.skills.reduce<Record<string, typeof resume.skills>>((acc, skill) => {
    const cat = skill.category ?? 'General';
    acc[cat] = [...(acc[cat] ?? []), skill];
    return acc;
  }, {});

  return (
    <StepLayout title="Skills" description="Add technical and soft skills.">
      <div className="space-y-4">
        {/* Add skill form */}
        <div className="flex gap-2 flex-wrap">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="form-input flex-1 min-w-40"
            placeholder="Skill name (e.g. TypeScript)"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input w-36"
            placeholder="Category (opt.)"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as Skill['level'])}
            className="form-input w-36"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          <button onClick={handleAdd} className="btn-primary shrink-0">
            + Add
          </button>
        </div>

        {/* Skill tags grouped by category */}
        {Object.entries(grouped).map(([cat, skills]) => (
          <div key={cat}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className={clsx(
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm',
                    LEVEL_COLORS[skill.level ?? 'intermediate'],
                  )}
                >
                  {skill.name}
                  {skill.level && (
                    <span className="opacity-60 text-xs">· {skill.level}</span>
                  )}
                  <button
                    onClick={() => removeSkill(skill.id)}
                    className="ml-1 hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}

        {resume.skills.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No skills added yet. Type a skill above and press Enter or click Add.
          </p>
        )}
      </div>
    </StepLayout>
  );
}

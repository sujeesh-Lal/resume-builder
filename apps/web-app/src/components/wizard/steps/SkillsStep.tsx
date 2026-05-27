import { useState } from 'react';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { Skill, Language } from '@resume-platform/shared-types';
import clsx from 'clsx';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-gray-100 text-gray-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-green-100 text-green-700',
  expert: 'bg-purple-100 text-purple-700',
};

const PROFICIENCY_OPTIONS: Language['proficiency'][] = [
  'Elementary',
  'Conversational',
  'Professional',
  'Fluent',
  'Native',
];

export function SkillsStep() {
  const {
    resume,
    addSkill, removeSkill,
    addSoftSkill, removeSoftSkill,
    addLanguage, removeLanguage,
  } = useResumeStore();

  // Technical/Professional skills state
  const [name, setName] = useState('');
  const [level, setLevel] = useState<Skill['level']>('intermediate');
  const [category, setCategory] = useState('');

  // Soft skills state
  const [softSkillInput, setSoftSkillInput] = useState('');

  // Languages state
  const [langName, setLangName] = useState('');
  const [langProficiency, setLangProficiency] = useState<Language['proficiency']>('Professional');

  const handleAddSkill = () => {
    if (!name.trim()) return;
    addSkill({ id: crypto.randomUUID(), name: name.trim(), level, category: category.trim() || undefined });
    setName('');
  };

  const handleAddSoftSkill = () => {
    const trimmed = softSkillInput.trim();
    if (!trimmed) return;
    if ((resume.softSkills ?? []).includes(trimmed)) return;
    addSoftSkill(trimmed);
    setSoftSkillInput('');
  };

  const handleAddLanguage = () => {
    if (!langName.trim()) return;
    addLanguage({ id: crypto.randomUUID(), name: langName.trim(), proficiency: langProficiency });
    setLangName('');
    setLangProficiency('Professional');
  };

  const grouped = resume.skills.reduce<Record<string, typeof resume.skills>>((acc, skill) => {
    const cat = skill.category ?? 'General';
    acc[cat] = [...(acc[cat] ?? []), skill];
    return acc;
  }, {});

  return (
    <StepLayout title="Skills" description="Add your technical skills, soft skills, and languages.">
      <div className="space-y-8">

        {/* ── Technical / Professional Skills ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Technical &amp; Professional Skills</h3>

          {/* Add skill form */}
          <div className="flex gap-2 flex-wrap">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
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
            <button onClick={handleAddSkill} className="btn-primary shrink-0">
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
            <p className="text-sm text-gray-400 text-center py-4">
              No skills added yet. Type a skill above and press Enter or click Add.
            </p>
          )}
        </div>

        {/* ── Soft Skills ── */}
        <div className="space-y-3 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Soft Skills</h3>
          <div className="flex gap-2">
            <input
              value={softSkillInput}
              onChange={(e) => setSoftSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSoftSkill())}
              className="form-input flex-1"
              placeholder="e.g. Leadership, Communication, Problem Solving"
            />
            <button onClick={handleAddSoftSkill} className="btn-primary shrink-0">
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(resume.softSkills ?? []).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800"
              >
                {skill}
                <button onClick={() => removeSoftSkill(skill)} className="ml-1 hover:opacity-70">×</button>
              </span>
            ))}
            {(resume.softSkills ?? []).length === 0 && (
              <p className="text-sm text-gray-400 py-2">No soft skills added yet.</p>
            )}
          </div>
        </div>

        {/* ── Languages ── */}
        <div className="space-y-3 border-t pt-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Languages</h3>
          <div className="flex gap-2 flex-wrap">
            <input
              value={langName}
              onChange={(e) => setLangName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
              className="form-input flex-1 min-w-40"
              placeholder="e.g. English, Spanish, French"
            />
            <select
              value={langProficiency}
              onChange={(e) => setLangProficiency(e.target.value as Language['proficiency'])}
              className="form-input w-44"
            >
              {PROFICIENCY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button onClick={handleAddLanguage} className="btn-primary shrink-0">
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(resume.languages ?? []).map((lang) => (
              <span
                key={lang.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-teal-100 text-teal-800"
              >
                {lang.name}
                {lang.proficiency && <span className="opacity-60 text-xs">· {lang.proficiency}</span>}
                <button onClick={() => removeLanguage(lang.id)} className="ml-1 hover:opacity-70">×</button>
              </span>
            ))}
            {(resume.languages ?? []).length === 0 && (
              <p className="text-sm text-gray-400 py-2">No languages added yet.</p>
            )}
          </div>
        </div>

      </div>
    </StepLayout>
  );
}

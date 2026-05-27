import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { ResumeTemplate } from '@resume-platform/shared-types';
import clsx from 'clsx';

const TEMPLATES: { id: ResumeTemplate; name: string; description: string; color: string }[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean design with a bold blue header',
    color: 'bg-blue-600',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout with centered header',
    color: 'bg-gray-800',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Light and airy with subtle typography',
    color: 'bg-gray-400',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Vibrant gradient header for creative roles',
    color: 'bg-gradient-to-r from-purple-600 to-pink-500',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Serif typography with circular photo and spaced headings',
    color: 'bg-stone-200',
  },
];

export function TemplateStep() {
  const { resume, setTemplate, nextStep } = useResumeStore();

  return (
    <StepLayout
      title="Choose a Template"
      description="Pick a style that fits your personality. You can change this anytime."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTemplate(t.id);
              nextStep();
            }}
            className={clsx(
              'border-2 rounded-xl overflow-hidden text-left transition-all hover:shadow-md focus:outline-none',
              resume.template === t.id
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300',
            )}
          >
            {/* Template preview */}
            <div className={clsx('h-32 flex flex-col', t.color)}>
              <div className="flex-1 p-3">
                <div className="w-20 h-2 bg-white/80 rounded mb-1" />
                <div className="w-12 h-1.5 bg-white/50 rounded" />
              </div>
              <div className="bg-white/10 px-3 py-2">
                <div className="w-full h-1.5 bg-white/40 rounded mb-1" />
                <div className="w-3/4 h-1.5 bg-white/30 rounded" />
              </div>
            </div>
            <div className="p-3 bg-white">
              <p className="font-medium text-sm text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
              {resume.template === t.id && (
                <span className="mt-2 inline-block text-xs text-primary-600 font-semibold">
                  ✓ Selected
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </StepLayout>
  );
}

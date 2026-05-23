import { useResumeStore, WIZARD_STEPS, STEP_LABELS } from '../../store/resume.store';
import { TemplateStep } from './steps/TemplateStep';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { SummaryStep } from './steps/SummaryStep';
import { ExperienceStep } from './steps/ExperienceStep';
import { EducationStep } from './steps/EducationStep';
import { SkillsStep } from './steps/SkillsStep';
import { ProjectsStep } from './steps/ProjectsStep';
import { CertificationsStep } from './steps/CertificationsStep';
import { PreviewStep } from './steps/PreviewStep';
import clsx from 'clsx';

export function ResumeWizard() {
  const { currentStep, setStep } = useResumeStore();
  const currentIdx = WIZARD_STEPS.indexOf(currentStep);

  const stepComponents = {
    template: <TemplateStep />,
    personalInfo: <PersonalInfoStep />,
    summary: <SummaryStep />,
    experience: <ExperienceStep />,
    education: <EducationStep />,
    skills: <SkillsStep />,
    projects: <ProjectsStep />,
    certifications: <CertificationsStep />,
    preview: <PreviewStep />,
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      {/* Step progress bar */}
      <div className="mb-8">
        <div className="flex items-center overflow-x-auto pb-2 gap-1">
          {WIZARD_STEPS.map((step, idx) => (
            <button
              key={step}
              onClick={() => setStep(step)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                idx === currentIdx
                  ? 'bg-primary-600 text-white shadow-sm'
                  : idx < currentIdx
                  ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <span
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  idx === currentIdx
                    ? 'bg-white text-primary-600'
                    : idx < currentIdx
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500',
                )}
              >
                {idx < currentIdx ? '✓' : idx + 1}
              </span>
              {STEP_LABELS[step]}
            </button>
          ))}
        </div>
        <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / WIZARD_STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div>{stepComponents[currentStep]}</div>
    </div>
  );
}

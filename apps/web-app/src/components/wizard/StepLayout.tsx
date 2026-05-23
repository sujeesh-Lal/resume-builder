import { ReactNode } from 'react';
import { useResumeStore } from '../../store/resume.store';

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  hideNavigation?: boolean;
}

export function StepLayout({
  title,
  description,
  children,
  onNext,
  onBack,
  nextLabel = 'Next →',
  hideNavigation = false,
}: Props) {
  const { nextStep, prevStep, currentStep } = useResumeStore();
  const isFirst = currentStep === 'template';
  const isLast = currentStep === 'preview';

  const handleNext = () => {
    if (onNext) onNext();
    else nextStep();
  };

  const handleBack = () => {
    if (onBack) onBack();
    else prevStep();
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {children}
      </div>

      {!hideNavigation && (
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={isFirst}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          {!isLast && (
            <button onClick={handleNext} className="btn-primary">
              {nextLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

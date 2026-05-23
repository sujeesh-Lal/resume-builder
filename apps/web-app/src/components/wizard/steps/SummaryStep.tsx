import { useState } from 'react';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';

export function SummaryStep() {
  const { resume, setSummary } = useResumeStore();
  const [value, setValue] = useState(resume.summary);

  const handleNext = () => {
    setSummary(value);
  };

  return (
    <StepLayout
      title="Professional Summary"
      description="A 2-4 sentence overview of your experience and goals."
      onNext={handleNext}
    >
      <div>
        <label className="form-label">Summary</label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={5}
          className="form-input resize-none"
          placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications..."
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-400">Recommended: 50–150 words</p>
          <p className="text-xs text-gray-400">{value.split(/\s+/).filter(Boolean).length} words</p>
        </div>
      </div>
    </StepLayout>
  );
}

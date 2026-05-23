import { useForm } from 'react-hook-form';
import { useResumeStore } from '../../../store/resume.store';
import { StepLayout } from '../StepLayout';
import type { PersonalInfo } from '@resume-platform/shared-types';

export function PersonalInfoStep() {
  const { resume, setPersonalInfo, nextStep } = useResumeStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfo>({ defaultValues: resume.personalInfo });

  const onSubmit = (data: PersonalInfo) => {
    setPersonalInfo(data);
    nextStep();
  };

  return (
    <StepLayout
      title="Personal Information"
      description="This appears at the top of your resume."
      hideNavigation
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input
              {...register('fullName', { required: 'Full name is required' })}
              className="form-input"
              placeholder="Jane Doe"
            />
            {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="form-label">Email *</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
              type="email"
              className="form-input"
              placeholder="jane@example.com"
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div>
            <label className="form-label">Phone</label>
            <input {...register('phone')} className="form-input" placeholder="+1 (555) 000-0000" />
          </div>

          <div>
            <label className="form-label">Location</label>
            <input
              {...register('location')}
              className="form-input"
              placeholder="San Francisco, CA"
            />
          </div>

          <div>
            <label className="form-label">Website</label>
            <input
              {...register('website')}
              className="form-input"
              placeholder="https://janedoe.com"
            />
          </div>

          <div>
            <label className="form-label">LinkedIn</label>
            <input
              {...register('linkedin')}
              className="form-input"
              placeholder="linkedin.com/in/janedoe"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="form-label">GitHub</label>
            <input
              {...register('github')}
              className="form-input"
              placeholder="github.com/janedoe"
            />
          </div>
        </div>

        <div className="flex justify-between pt-2">
          <button type="button" onClick={() => useResumeStore.getState().prevStep()} className="btn-secondary">
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Next →
          </button>
        </div>
      </form>
    </StepLayout>
  );
}

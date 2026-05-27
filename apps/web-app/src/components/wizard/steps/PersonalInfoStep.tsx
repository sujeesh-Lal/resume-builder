import { useRef, useState } from 'react';
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

  const [photo, setPhoto] = useState<string | undefined>(resume.personalInfo.photo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const initials = (resume.personalInfo.fullName || 'YN')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const onSubmit = (data: PersonalInfo) => {
    setPersonalInfo({ ...data, photo });
    nextStep();
  };

  return (
    <StepLayout
      title="Personal Information"
      description="This appears at the top of your resume."
      hideNavigation
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Photo uploader */}
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload photo"
          >
            {photo ? (
              <img src={photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-light text-gray-400 tracking-wide">{initials}</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-sm py-1.5 px-3"
            >
              {photo ? 'Change photo' : 'Upload photo'}
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => { setPhoto(undefined); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="text-xs text-red-400 hover:text-red-600 text-left"
              >
                Remove photo
              </button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG or WebP · Shown in Elegant template</p>
          </div>
        </div>

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
            <label className="form-label">Professional Title</label>
            <input
              {...register('professionalTitle')}
              className="form-input"
              placeholder="Senior Software Engineer"
            />
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

          <div>
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

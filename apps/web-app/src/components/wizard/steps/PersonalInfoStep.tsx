import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [photoPosition, setPhotoPosition] = useState<{ x: number; y: number }>(
    resume.personalInfo.photoPosition ?? { x: 50, y: 50 },
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state — use refs to avoid stale closures in window event listeners
  const isDraggingRef = useRef(false);
  const lastDragRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!photo) return;
    e.preventDefault();
    isDraggingRef.current = true;
    lastDragRef.current = { x: e.clientX, y: e.clientY };
  }, [photo]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !lastDragRef.current) return;
      const dx = e.clientX - lastDragRef.current.x;
      const dy = e.clientY - lastDragRef.current.y;
      lastDragRef.current = { x: e.clientX, y: e.clientY };
      // Drag right → pan image left (decrease x), drag down → pan image up (decrease y)
      setPhotoPosition((pos) => ({
        x: Math.max(0, Math.min(100, pos.x - dx * 0.5)),
        y: Math.max(0, Math.min(100, pos.y - dy * 0.5)),
      }));
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      lastDragRef.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target?.result as string);
      setPhotoPosition({ x: 50, y: 50 });
    };
    reader.readAsDataURL(file);
  };

  const initials = (resume.personalInfo.fullName || 'YN')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const onSubmit = (data: PersonalInfo) => {
    setPersonalInfo({ ...data, photo, photoPosition: photo ? photoPosition : undefined });
    nextStep();
  };

  return (
    <StepLayout
      title="Personal Information"
      description="This appears at the top of your resume."
      hideNavigation
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Photo uploader + repositioner */}
        <div className="flex items-start gap-5">
          {/* Photo circle — draggable when photo is loaded */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden select-none"
              style={{
                cursor: photo ? (isDraggingRef.current ? 'grabbing' : 'grab') : 'pointer',
                borderColor: photo ? '#a78bfa' : undefined,
              }}
              onClick={() => { if (!photo) fileInputRef.current?.click(); }}
              onMouseDown={handleMouseDown}
              title={photo ? 'Drag to reposition' : 'Click to upload photo'}
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Profile"
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${photoPosition.x}% ${photoPosition.y}%`,
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <span className="text-xl font-light text-gray-400 tracking-wide">{initials}</span>
              )}
            </div>
            {photo && (
              <p className="text-[10px] text-gray-400 text-center leading-tight">
                Drag to reposition
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-sm py-1.5 px-3"
            >
              {photo ? 'Change photo' : 'Upload photo'}
            </button>

            {photo && (
              <>
                <button
                  type="button"
                  onClick={() => setPhotoPosition({ x: 50, y: 50 })}
                  className="text-xs text-indigo-500 hover:text-indigo-700 text-left"
                >
                  Reset to center
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(undefined);
                    setPhotoPosition({ x: 50, y: 50 });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-red-400 hover:text-red-600 text-left"
                >
                  Remove photo
                </button>
              </>
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

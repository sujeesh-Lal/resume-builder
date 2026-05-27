import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ResumeData,
  ResumeTemplate,
  ResumeFont,
  PersonalInfo,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  ResumeSection,
} from '@resume-platform/shared-types';

const GUEST_ID_KEY = 'resume_platform_guest_id';

function getOrCreateGuestId(): string {
  const stored = localStorage.getItem(GUEST_ID_KEY);
  if (stored) return stored;
  const id = `guest_${crypto.randomUUID()}`;
  localStorage.setItem(GUEST_ID_KEY, id);
  return id;
}

function createEmptyResume(): ResumeData {
  return {
    id: crypto.randomUUID(),
    guestId: getOrCreateGuestId(),
    title: 'My Resume',
    template: 'modern',
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    softSkills: [],
    languages: [],
    projects: [],
    certifications: [],
    customSections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export type WizardStep =
  | 'template'
  | 'personalInfo'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'preview';

export const WIZARD_STEPS: WizardStep[] = [
  'template',
  'personalInfo',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'preview',
];

export const STEP_LABELS: Record<WizardStep, string> = {
  template: 'Template',
  personalInfo: 'Personal Info',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  preview: 'Preview & Export',
};

interface ResumeStore {
  resume: ResumeData;
  currentStep: WizardStep;
  isSaving: boolean;
  isGeneratingPdf: boolean;
  lastSavedAt: string | null;

  // Navigation
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Resume mutations
  setTemplate: (template: ResumeTemplate) => void;
  setFontFamily: (font: ResumeFont) => void;
  setPersonalInfo: (info: Partial<PersonalInfo>) => void;
  setSummary: (summary: string) => void;
  setTitle: (title: string) => void;

  // Experience
  addExperience: (exp: WorkExperience) => void;
  updateExperience: (id: string, exp: Partial<WorkExperience>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (from: number, to: number) => void;

  // Education
  addEducation: (edu: Education) => void;
  updateEducation: (id: string, edu: Partial<Education>) => void;
  removeEducation: (id: string) => void;

  // Skills
  addSkill: (skill: Skill) => void;
  updateSkill: (id: string, skill: Partial<Skill>) => void;
  removeSkill: (id: string) => void;

  // Soft Skills
  addSoftSkill: (name: string) => void;
  removeSoftSkill: (name: string) => void;

  // Languages
  addLanguage: (lang: Language) => void;
  updateLanguage: (id: string, lang: Partial<Language>) => void;
  removeLanguage: (id: string) => void;

  // Projects
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;

  // Certifications
  addCertification: (cert: Certification) => void;
  updateCertification: (id: string, cert: Partial<Certification>) => void;
  removeCertification: (id: string) => void;

  // Actions
  resetResume: () => void;
  loadResume: (resume: ResumeData) => void;
  touch: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      resume: createEmptyResume(),
      currentStep: 'template',
      isSaving: false,
      isGeneratingPdf: false,
      lastSavedAt: null,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const idx = WIZARD_STEPS.indexOf(get().currentStep);
        if (idx < WIZARD_STEPS.length - 1) {
          set({ currentStep: WIZARD_STEPS[idx + 1] });
        }
      },

      prevStep: () => {
        const idx = WIZARD_STEPS.indexOf(get().currentStep);
        if (idx > 0) {
          set({ currentStep: WIZARD_STEPS[idx - 1] });
        }
      },

      setTemplate: (template) =>
        set((s) => ({ resume: { ...s.resume, template, updatedAt: new Date().toISOString() } })),

      setFontFamily: (fontFamily) =>
        set((s) => ({ resume: { ...s.resume, fontFamily, updatedAt: new Date().toISOString() } })),

      setPersonalInfo: (info) =>
        set((s) => ({
          resume: {
            ...s.resume,
            personalInfo: { ...s.resume.personalInfo, ...info },
            updatedAt: new Date().toISOString(),
          },
        })),

      setSummary: (summary) =>
        set((s) => ({ resume: { ...s.resume, summary, updatedAt: new Date().toISOString() } })),

      setTitle: (title) =>
        set((s) => ({ resume: { ...s.resume, title, updatedAt: new Date().toISOString() } })),

      addExperience: (exp) =>
        set((s) => ({
          resume: {
            ...s.resume,
            experience: [...s.resume.experience, exp],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateExperience: (id, exp) =>
        set((s) => ({
          resume: {
            ...s.resume,
            experience: s.resume.experience.map((e) => (e.id === id ? { ...e, ...exp } : e)),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeExperience: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            experience: s.resume.experience.filter((e) => e.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      reorderExperience: (from, to) =>
        set((s) => {
          const arr = [...s.resume.experience];
          const [moved] = arr.splice(from, 1);
          arr.splice(to, 0, moved);
          return { resume: { ...s.resume, experience: arr, updatedAt: new Date().toISOString() } };
        }),

      addEducation: (edu) =>
        set((s) => ({
          resume: {
            ...s.resume,
            education: [...s.resume.education, edu],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateEducation: (id, edu) =>
        set((s) => ({
          resume: {
            ...s.resume,
            education: s.resume.education.map((e) => (e.id === id ? { ...e, ...edu } : e)),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeEducation: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            education: s.resume.education.filter((e) => e.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      addSkill: (skill) =>
        set((s) => ({
          resume: {
            ...s.resume,
            skills: [...s.resume.skills, skill],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateSkill: (id, skill) =>
        set((s) => ({
          resume: {
            ...s.resume,
            skills: s.resume.skills.map((sk) => (sk.id === id ? { ...sk, ...skill } : sk)),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeSkill: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            skills: s.resume.skills.filter((sk) => sk.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      addSoftSkill: (name) =>
        set((s) => ({
          resume: {
            ...s.resume,
            softSkills: [...(s.resume.softSkills ?? []), name],
            updatedAt: new Date().toISOString(),
          },
        })),

      removeSoftSkill: (name) =>
        set((s) => ({
          resume: {
            ...s.resume,
            softSkills: (s.resume.softSkills ?? []).filter((n) => n !== name),
            updatedAt: new Date().toISOString(),
          },
        })),

      addLanguage: (lang) =>
        set((s) => ({
          resume: {
            ...s.resume,
            languages: [...(s.resume.languages ?? []), lang],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateLanguage: (id, lang) =>
        set((s) => ({
          resume: {
            ...s.resume,
            languages: (s.resume.languages ?? []).map((l) => (l.id === id ? { ...l, ...lang } : l)),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeLanguage: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            languages: (s.resume.languages ?? []).filter((l) => l.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      addProject: (project) =>
        set((s) => ({
          resume: {
            ...s.resume,
            projects: [...s.resume.projects, project],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateProject: (id, project) =>
        set((s) => ({
          resume: {
            ...s.resume,
            projects: s.resume.projects.map((p) => (p.id === id ? { ...p, ...project } : p)),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeProject: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            projects: s.resume.projects.filter((p) => p.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      addCertification: (cert) =>
        set((s) => ({
          resume: {
            ...s.resume,
            certifications: [...s.resume.certifications, cert],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateCertification: (id, cert) =>
        set((s) => ({
          resume: {
            ...s.resume,
            certifications: s.resume.certifications.map((c) =>
              c.id === id ? { ...c, ...cert } : c,
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      removeCertification: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            certifications: s.resume.certifications.filter((c) => c.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      resetResume: () => set({ resume: createEmptyResume(), currentStep: 'template' }),

      loadResume: (resume) => set({ resume }),

      touch: () =>
        set((s) => ({
          resume: { ...s.resume, updatedAt: new Date().toISOString() },
        })),
    }),
    {
      name: 'resume-builder-store',
      partialize: (state) => ({ resume: state.resume, currentStep: state.currentStep }),
    },
  ),
);

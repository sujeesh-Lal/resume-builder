export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  location?: string;
  description: string[];
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
  highlights: string[];
}

export interface Skill {
  id: string;
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  githubUrl?: string;
  technologies: string[];
  highlights: string[];
  startDate?: string;
  endDate?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

export type ResumeTemplate = 'modern' | 'classic' | 'minimal' | 'creative' | 'elegant';

export interface ResumeData {
  id: string;
  guestId?: string;
  userId?: string;
  title: string;
  template: ResumeTemplate;
  personalInfo: PersonalInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  customSections: CustomSection[];
  createdAt: string;
  updatedAt: string;
}

export type ResumeSection =
  | 'personalInfo'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications';

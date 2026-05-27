import { IsString, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';
import { ResumeTemplate } from '@resume-platform/shared-types';

export class CreateResumeDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(['modern', 'classic', 'minimal', 'creative', 'elegant'])
  template?: ResumeTemplate;

  @IsOptional()
  @IsObject()
  personalInfo?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  experience?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  education?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  skills?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  projects?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  certifications?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  customSections?: Record<string, unknown>[];
}

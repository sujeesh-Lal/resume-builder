import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ResumeTemplate } from '@resume-platform/shared-types';

export type ResumeDocument = Resume & Document;

@Schema({ timestamps: true })
export class Resume {
  @Prop({ required: true })
  title: string;

  @Prop()
  guestId?: string;

  @Prop()
  userId?: string;

  @Prop({ type: String, default: 'modern' })
  template: ResumeTemplate;

  @Prop({ type: Object, default: {} })
  personalInfo: Record<string, unknown>;

  @Prop({ default: '' })
  summary: string;

  @Prop({ type: [Object], default: [] })
  experience: Record<string, unknown>[];

  @Prop({ type: [Object], default: [] })
  education: Record<string, unknown>[];

  @Prop({ type: [Object], default: [] })
  skills: Record<string, unknown>[];

  @Prop({ type: [Object], default: [] })
  projects: Record<string, unknown>[];

  @Prop({ type: [Object], default: [] })
  certifications: Record<string, unknown>[];

  @Prop({ type: [Object], default: [] })
  customSections: Record<string, unknown>[];
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);

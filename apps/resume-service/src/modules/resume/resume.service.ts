import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { AppLogger } from '@resume-platform/logger';

@Injectable()
export class ResumeService {
  private readonly logger = new AppLogger('ResumeService');

  constructor(
    @InjectModel(Resume.name)
    private readonly resumeModel: Model<ResumeDocument>,
  ) {}

  async create(dto: CreateResumeDto): Promise<ResumeDocument> {
    const resume = new this.resumeModel(dto);
    const saved = await resume.save();
    this.logger.info('Resume created', { resumeId: saved._id.toString() });
    return saved;
  }

  async findAll(guestId?: string): Promise<ResumeDocument[]> {
    const filter = guestId ? { guestId } : {};
    return this.resumeModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ResumeDocument> {
    const resume = await this.resumeModel.findById(id).exec();
    if (!resume) {
      throw new NotFoundException(`Resume ${id} not found`);
    }
    return resume;
  }

  async update(id: string, dto: UpdateResumeDto): Promise<ResumeDocument> {
    const updated = await this.resumeModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Resume ${id} not found`);
    }
    this.logger.info('Resume updated', { resumeId: id });
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.resumeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Resume ${id} not found`);
    }
    this.logger.info('Resume deleted', { resumeId: id });
  }
}

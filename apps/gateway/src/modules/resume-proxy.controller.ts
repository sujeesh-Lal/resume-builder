import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ResumeProxyService } from './resume-proxy.service';

@Controller('resumes')
export class ResumeProxyController {
  constructor(private readonly proxy: ResumeProxyService) {}

  @Get()
  findAll(@Query('guestId') guestId?: string) {
    return this.proxy.forwardGet('/resumes', guestId ? { guestId } : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proxy.forwardGet(`/resumes/${id}`);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.proxy.forwardPost('/resumes', body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.proxy.forwardPut(`/resumes/${id}`, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.proxy.forwardDelete(`/resumes/${id}`);
  }
}

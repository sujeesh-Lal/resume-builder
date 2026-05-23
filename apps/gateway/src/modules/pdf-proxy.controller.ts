import { Controller, Post, Get, Param, Body, Res } from '@nestjs/common';
import { PdfProxyService } from './pdf-proxy.service';
import { ResumeData } from '@resume-platform/shared-types';

@Controller('pdf')
export class PdfProxyController {
  constructor(private readonly proxy: PdfProxyService) {}

  @Post('generate')
  async generate(
    @Body() body: { resume: ResumeData; format?: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() res: any,
  ) {
    const buffer = await this.proxy.requestPdf(body.resume, body.format);
    const name = body.resume?.personalInfo?.fullName ?? 'resume';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}-resume.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get(':resumeId/status')
  status(@Param('resumeId') resumeId: string) {
    return this.proxy.getPdfStatus(resumeId);
  }
}

import { Controller, Post, Get, Param, Body, Res } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate')
  async generate(
    @Body() body: { resumeId: string; template: string; format?: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() res: any,
  ) {
    const buffer = await this.pdfService.generatePdf(
      body.resumeId,
      body.template,
      body.format,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="resume-${body.resumeId}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get(':resumeId/status')
  status(@Param('resumeId') resumeId: string) {
    return { resumeId, status: 'ready', message: 'PDF generation is available' };
  }
}

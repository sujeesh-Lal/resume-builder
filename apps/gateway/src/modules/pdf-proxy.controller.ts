import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PdfProxyService } from './pdf-proxy.service';

@Controller('pdf')
export class PdfProxyController {
  constructor(private readonly proxy: PdfProxyService) {}

  @Post('generate')
  generate(@Body() body: { resumeId: string; template: string; format?: string }) {
    return this.proxy.requestPdf(body.resumeId, body.template, body.format);
  }

  @Get(':resumeId/status')
  status(@Param('resumeId') resumeId: string) {
    return this.proxy.getPdfStatus(resumeId);
  }
}

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PdfProxyService {
  private readonly pdfServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.pdfServiceUrl =
      this.config.get<string>('PDF_SERVICE_URL') ?? 'http://localhost:3002';
  }

  async requestPdf(resumeId: string, template: string, format = 'A4') {
    const { data } = await firstValueFrom(
      this.http.post(`${this.pdfServiceUrl}/pdf/generate`, {
        resumeId,
        template,
        format,
      }),
    );
    return data;
  }

  async getPdfStatus(resumeId: string) {
    const { data } = await firstValueFrom(
      this.http.get(`${this.pdfServiceUrl}/pdf/${resumeId}/status`),
    );
    return data;
  }
}

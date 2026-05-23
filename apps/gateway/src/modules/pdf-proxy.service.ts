import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ResumeData } from '@resume-platform/shared-types';

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

  async requestPdf(resume: ResumeData, format = 'A4'): Promise<Buffer> {
    const { data } = await firstValueFrom(
      this.http.post(
        `${this.pdfServiceUrl}/pdf/generate`,
        { resume, format },
        { responseType: 'arraybuffer' },
      ),
    );
    return Buffer.from(data);
  }

  async getPdfStatus(resumeId: string) {
    const { data } = await firstValueFrom(
      this.http.get(`${this.pdfServiceUrl}/pdf/${resumeId}/status`),
    );
    return data;
  }
}

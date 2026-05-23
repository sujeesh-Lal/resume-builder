import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ResumeProxyService {
  private readonly resumeServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.resumeServiceUrl =
      this.config.get<string>('RESUME_SERVICE_URL') ?? 'http://localhost:3001';
  }

  async forwardGet(path: string, params?: Record<string, string>) {
    const { data } = await firstValueFrom(
      this.http.get(`${this.resumeServiceUrl}${path}`, { params }),
    );
    return data;
  }

  async forwardPost(path: string, body: unknown) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.resumeServiceUrl}${path}`, body),
    );
    return data;
  }

  async forwardPut(path: string, body: unknown) {
    const { data } = await firstValueFrom(
      this.http.put(`${this.resumeServiceUrl}${path}`, body),
    );
    return data;
  }

  async forwardDelete(path: string) {
    const { data } = await firstValueFrom(
      this.http.delete(`${this.resumeServiceUrl}${path}`),
    );
    return data;
  }
}

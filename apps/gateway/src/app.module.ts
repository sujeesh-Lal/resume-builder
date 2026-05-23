import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ResumeProxyModule } from './modules/resume-proxy.module';
import { PdfProxyModule } from './modules/pdf-proxy.module';
import { HealthModule } from './modules/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({ timeout: 10000 }),
    ResumeProxyModule,
    PdfProxyModule,
    HealthModule,
  ],
})
export class AppModule {}

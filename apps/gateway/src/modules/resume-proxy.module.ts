import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ResumeProxyController } from './resume-proxy.controller';
import { ResumeProxyService } from './resume-proxy.service';

@Module({
  imports: [HttpModule],
  controllers: [ResumeProxyController],
  providers: [ResumeProxyService],
})
export class ResumeProxyModule {}

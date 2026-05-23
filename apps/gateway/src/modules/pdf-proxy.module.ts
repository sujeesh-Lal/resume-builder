import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PdfProxyController } from './pdf-proxy.controller';
import { PdfProxyService } from './pdf-proxy.service';

@Module({
  imports: [HttpModule],
  controllers: [PdfProxyController],
  providers: [PdfProxyService],
})
export class PdfProxyModule {}

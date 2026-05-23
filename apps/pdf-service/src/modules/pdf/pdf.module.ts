import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [HttpModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}

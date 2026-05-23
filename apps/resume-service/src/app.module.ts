import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeModule } from './modules/resume/resume.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ??
          'mongodb://root:secret@localhost:27017/resume_platform?authSource=admin',
      }),
      inject: [ConfigService],
    }),
    ResumeModule,
  ],
})
export class AppModule {}

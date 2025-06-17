// apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadController } from './s3/upload.controller';

@Module({
  // load .env (AWS_REGION, AWS_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc)
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,      // makes process.env.* available everywhere
      envFilePath: '.env',  // adjust if your file is named differently or in another folder
    }),
  ],
  controllers: [
    AppController,
    UploadController,      // ← make sure your S3 upload controller is registered here
  ],
  providers: [AppService],
})
export class AppModule {}

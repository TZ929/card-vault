import { Controller, Post, Body } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

@Controller('s3')
export class UploadController {
  private s3 = new S3Client({ region: process.env.AWS_REGION });

  @Post('presigned')
  async getPost(@Body() dto: { filename: string; contentType: string }) {
    const { url, fields } = await createPresignedPost(this.s3, {
      Bucket: process.env.AWS_BUCKET!,
      Key: dto.filename,
      Conditions: [['content-length-range', 0, 5_000_000]], // up to 5 MB
      Fields: { 'Content-Type': dto.contentType },
      Expires: 60, // seconds until this form expires
    });
    return { url, fields };
  }
}

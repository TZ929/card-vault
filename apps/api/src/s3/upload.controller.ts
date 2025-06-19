import { Controller, Post, Body } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { PresignDto } from './presign.dto'

@Controller('s3')
export class UploadController {
  private readonly s3 = new S3Client({ region: process.env.AWS_REGION });

  @Post('presigned')
  async presign(@Body() body: PresignDto | PresignDto[]) {
    const items = Array.isArray(body) ? body : [body]

    const results = await Promise.all(
      items.map(item =>
        createPresignedPost(this.s3, {
          Bucket: process.env.AWS_BUCKET!,
          Key: item.filename,
          Fields: { 'Content-Type': item.contentType },
          Conditions: [['content-length-range', 0, 5_000_000]],
          Expires: 60,
        }),
      ),
    )

    return results          // [{url,fields}, {url,fields}]
  }
}

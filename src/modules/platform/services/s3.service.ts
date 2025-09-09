import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const s3BucketName = process.env.S3_BUCKET_NAME;

    if (!awsAccessKeyId) {
      throw new Error('AWS_ACCESS_KEY_ID environment variable is required');
    }

    if (!awsSecretAccessKey) {
      throw new Error('AWS_SECRET_ACCESS_KEY environment variable is required');
    }

    if (!s3BucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });
    this.bucketName = s3BucketName;
  }

  /**
   * Upload file to S3
   * @param key - The S3 object key (file path)
   * @param buffer - File buffer
   * @param contentType - MIME type of the file
   */
  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  /**
   * Delete file from S3
   * @param key - The S3 object key (file path)
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate signed URL for file access
   * @param key - The S3 object key (file path)
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Check if file exists in S3
   * @param key - The S3 object key (file path)
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      // If file doesn't exist, AWS SDK throws NoSuchKey error
      return false;
    }
  }
}

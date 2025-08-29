import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from '@/types';
import { MockStorage } from './storage-mock';

class S3Storage implements StorageProvider {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    if (!process.env.STORAGE_BUCKET) {
      throw new Error('STORAGE_BUCKET environment variable is required');
    }

    this.bucket = process.env.STORAGE_BUCKET;
    
    const config: any = {
      region: process.env.STORAGE_REGION || 'us-east-1',
    };

    if (process.env.STORAGE_ENDPOINT) {
      config.endpoint = process.env.STORAGE_ENDPOINT;
      config.forcePathStyle = true;
    }

    if (process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      };
    }

    this.s3Client = new S3Client(config);
  }

  async uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    });

    await this.s3Client.send(command);
    
    // For Cloudflare R2, we need to use signed URLs for reliable access
    // Direct public URLs require public bucket access which may not be configured
    console.log(`📦 File uploaded to storage: ${key}`);
    return `storage://${key}`; // Internal identifier, will be converted to signed URL when needed
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}

// Use global to persist across module reloads in development
declare global {
  var __mockStorageInstance: MockStorage | undefined;
  var __storageInstance: StorageProvider | undefined;
}

export function getStorage(): StorageProvider {
  // In development, always check global first to maintain instance across different execution contexts
  if (process.env.NODE_ENV === 'development' && global.__storageInstance) {
    console.log(`📁 Reusing global storage instance with ${(global.__storageInstance as any).files?.size || 'N/A'} files`);
    return global.__storageInstance;
  }

  // Si no hay configuración de storage, usar mock para testing
  if (!process.env.STORAGE_BUCKET || !process.env.STORAGE_ACCESS_KEY_ID) {
    console.log('⚠️ Using Mock Storage - configure real storage for production');
    
    // Use global to persist across development module reloads and API routes
    if (process.env.NODE_ENV === 'development' && global.__mockStorageInstance) {
      console.log(`📁 Reusing global MockStorage instance with ${global.__mockStorageInstance.files.size} files`);
      global.__storageInstance = global.__mockStorageInstance;
      return global.__mockStorageInstance;
    } else {
      const newInstance = new MockStorage();
      if (process.env.NODE_ENV === 'development') {
        global.__mockStorageInstance = newInstance;
        global.__storageInstance = newInstance;
      }
      console.log(`📁 Created new MockStorage instance: ${newInstance.constructor.name}-${Object.prototype.toString.call(newInstance)}`);
      return newInstance;
    }
  } else {
    const s3Instance = new S3Storage();
    if (process.env.NODE_ENV === 'development') {
      global.__storageInstance = s3Instance;
    }
    return s3Instance;
  }
}
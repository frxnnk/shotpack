import { StorageProvider } from '@/types';

export class MockStorage implements StorageProvider {
  public files = new Map<string, Buffer>();

  async uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    this.files.set(key, buffer);
    // Usar la URL de mock storage local
    const mockUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mock-storage/${encodeURIComponent(key)}`;
    console.log(`📁 Mock storage: Uploaded ${key} (${buffer.length} bytes) -> ${mockUrl}`);
    console.log(`📁 Mock storage: Total files now: ${this.files.size}`);
    console.log(`📁 Mock storage: Instance ID: ${this.constructor.name}-${Object.prototype.toString.call(this)}`);
    return mockUrl;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const mockUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mock-storage/${key}?signed=true&expires=${Date.now() + (expiresIn * 1000)}`;
    console.log(`🔗 Mock storage: Generated signed URL for ${key}`);
    return mockUrl;
  }

  async deleteFile(key: string): Promise<void> {
    this.files.delete(key);
    console.log(`🗑️ Mock storage: Deleted ${key}`);
  }

  async fileExists(key: string): Promise<boolean> {
    const exists = this.files.has(key);
    console.log(`🔍 Mock storage: File ${key} exists: ${exists}`);
    return exists;
  }

  // Método adicional para obtener archivos en el mock
  getFile(key: string): Buffer | undefined {
    return this.files.get(key);
  }
}
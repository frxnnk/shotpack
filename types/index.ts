export type StyleType = 'marble' | 'minimal_wood' | 'loft';

export type JobStatus = 'queued' | 'running' | 'done' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  style: StyleType;
  originalUrl: string;
  images: string[];
  zipUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  userId?: string; // User identifier for job ownership
}

export interface CreateJobRequest {
  file: File;
  style: StyleType;
  upscale: boolean;
}

export interface CreateJobResponse {
  jobId: string;
}

export interface JobStatusResponse {
  status: JobStatus;
  progress: number;
  images: string[];
  zipUrl?: string;
}

export interface EditRequest {
  imageUrl: string;
  prompt: string;
  size?: { width: number; height: number };
  safety?: { allowPeople?: boolean };
}

export interface EditResult {
  outputUrl: string;
}

export interface ImageProvider {
  edit(req: EditRequest): Promise<EditResult>;
  upscale?(imageUrl: string, target?: { width: number; height: number }): Promise<{ outputUrl: string }>;
}

export interface StorageProvider {
  uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
  fileExists(key: string): Promise<boolean>;
  listFiles(prefix: string): Promise<string[]>;
}

export interface GeneratePackRequest {
  originalUrl: string;
  style: StyleType;
  upscale?: boolean;
  onProgress?: (progress: number, currentImage?: string) => void;
}

export interface GeneratePackResult {
  images: string[];
  zipUrl: string;
}

export interface StyleInfo {
  id: StyleType;
  name: string;
  description: string;
  prompt: string;
}
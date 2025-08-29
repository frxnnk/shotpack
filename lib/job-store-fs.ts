import { Job } from '@/types';
import { getStorage } from '@/lib/storage';

const JOBS_PREFIX = 'jobs/metadata/';

export async function setJob(jobId: string, job: Job): Promise<void> {
  try {
    const storage = getStorage();
    const key = `${JOBS_PREFIX}${jobId}.json`;
    const buffer = Buffer.from(JSON.stringify(job), 'utf8');
    await storage.uploadFile(key, buffer, 'application/json');
    console.log(`✅ Job ${jobId} saved to persistent storage`);
  } catch (error) {
    console.error(`Error saving job ${jobId}:`, error);
  }
}

export async function getJob(jobId: string): Promise<Job | undefined> {
  try {
    const storage = getStorage();
    const key = `${JOBS_PREFIX}${jobId}.json`;
    
    // Check if file exists first
    const exists = await storage.fileExists(key);
    if (!exists) {
      return undefined;
    }

    // Get signed URL and fetch the data
    const signedUrl = await storage.getSignedUrl(key, 300); // 5 minutes
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
      return undefined;
    }

    const data = await response.text();
    const job = JSON.parse(data);
    
    // Convert dates from strings to Date objects
    job.createdAt = new Date(job.createdAt);
    job.updatedAt = new Date(job.updatedAt);
    
    console.log(`✅ Job ${jobId} loaded from persistent storage`);
    return job;
  } catch (error) {
    console.error(`Error reading job ${jobId}:`, error);
    return undefined;
  }
}

export async function getAllJobIds(): Promise<string[]> {
  try {
    // For R2/S3, we can't list files directly in a simple way
    // This function is mainly used for debugging, so we'll return empty array
    // In production, you'd want to implement proper listing or use a database
    console.log('getAllJobIds not implemented for R2 storage - consider using database for job listing');
    return [];
  } catch (error) {
    console.error('Error reading jobs directory:', error);
    return [];
  }
}
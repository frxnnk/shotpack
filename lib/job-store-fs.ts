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
    const storage = getStorage();
    const files = await storage.listFiles(JOBS_PREFIX);
    
    // Extract job IDs from file paths (remove prefix and .json extension)
    const jobIds = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filename = file.replace(JOBS_PREFIX, '').replace('.json', '');
        return filename;
      })
      .filter(id => id.length > 0);
    
    console.log(`📂 Found ${jobIds.length} jobs in persistent storage`);
    return jobIds;
  } catch (error) {
    console.error('Error reading jobs directory:', error);
    return [];
  }
}
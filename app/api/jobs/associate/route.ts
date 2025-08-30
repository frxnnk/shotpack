import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/job-store-fs';
import { getStorage } from '@/lib/storage';

const USER_HISTORY_PREFIX = 'users/history/';

// Load user's jobs from R2 storage
async function loadUserJobs(email: string): Promise<any[]> {
  const normalizedEmail = email.toLowerCase().trim();
  const storage = getStorage();
  const userHistoryKey = `${USER_HISTORY_PREFIX}${normalizedEmail}.json`;
  
  try {
    // Check if file exists
    const exists = await storage.fileExists(userHistoryKey);
    if (!exists) {
      console.log(`📂 [ASSOCIATE] No history file found for ${normalizedEmail}`);
      return [];
    }

    // Get signed URL and fetch the data
    const signedUrl = await storage.getSignedUrl(userHistoryKey, 300); // 5 minutes
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
      console.log(`⚠️ [ASSOCIATE] Failed to fetch history for ${normalizedEmail}`);
      return [];
    }

    const data = await response.text();
    const jobs = JSON.parse(data);
    
    // Convert date strings back to Date objects
    return jobs.map((job: any) => ({
      ...job,
      createdAt: new Date(job.createdAt),
      updatedAt: new Date(job.updatedAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined
    }));
  } catch (error) {
    console.error(`❌ [ASSOCIATE] Error loading jobs for ${normalizedEmail}:`, error);
    return [];
  }
}

// Save user's jobs to R2 storage
async function saveUserJobs(email: string, jobs: any[]): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const storage = getStorage();
  const userHistoryKey = `${USER_HISTORY_PREFIX}${normalizedEmail}.json`;
  
  try {
    const buffer = Buffer.from(JSON.stringify(jobs, null, 2), 'utf8');
    await storage.uploadFile(userHistoryKey, buffer, 'application/json');
    console.log(`✅ [ASSOCIATE] Saved history for ${normalizedEmail} to R2`);
  } catch (error) {
    console.error(`❌ [ASSOCIATE] Error saving jobs for ${normalizedEmail}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, email } = await request.json();
    
    if (!jobId || !email) {
      return NextResponse.json({ error: 'Job ID and email are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Load the job from persistent storage
    const job = await getJob(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Load user's existing jobs
    const userJobs = await loadUserJobs(normalizedEmail);
    
    // Check if job is already associated with this user
    const existingJob = userJobs.find(j => j.id === jobId);
    if (existingJob) {
      return NextResponse.json({ 
        message: 'Job already saved to your history',
        jobId 
      });
    }
    
    // Add the job to user's history
    const jobToSave = {
      ...job,
      associatedAt: new Date()
    };
    
    userJobs.unshift(jobToSave); // Add to beginning
    await saveUserJobs(normalizedEmail, userJobs);
    
    console.log(`✅ [JOBS] Associated job ${jobId} with ${normalizedEmail}`);
    
    return NextResponse.json({ 
      message: 'Job saved to your history successfully',
      jobId 
    });
    
  } catch (error) {
    console.error('Associate job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
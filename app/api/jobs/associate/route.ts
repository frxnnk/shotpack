import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getJob } from '@/lib/job-store-fs';

const JOBS_DIR = path.join('/tmp', 'temp-users/jobs');

// Ensure directory exists
function ensureJobsDir() {
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }
}

// Load user's jobs file
function loadUserJobs(email: string): any[] {
  const normalizedEmail = email.toLowerCase().trim();
  const userJobsFile = path.join(JOBS_DIR, `${normalizedEmail}.json`);
  
  if (!fs.existsSync(userJobsFile)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(userJobsFile, 'utf-8');
    const jobs = JSON.parse(data);
    
    // Convert date strings back to Date objects
    return jobs.map((job: any) => ({
      ...job,
      createdAt: new Date(job.createdAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined
    }));
  } catch (error) {
    console.error(`Error loading jobs for ${normalizedEmail}:`, error);
    return [];
  }
}

// Save user's jobs file
function saveUserJobs(email: string, jobs: any[]) {
  ensureJobsDir();
  const normalizedEmail = email.toLowerCase().trim();
  const userJobsFile = path.join(JOBS_DIR, `${normalizedEmail}.json`);
  
  try {
    fs.writeFileSync(userJobsFile, JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error(`Error saving jobs for ${normalizedEmail}:`, error);
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
    const userJobs = loadUserJobs(normalizedEmail);
    
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
    saveUserJobs(normalizedEmail, userJobs);
    
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
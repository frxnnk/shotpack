import { NextRequest, NextResponse } from 'next/server';
import { getAllJobIds, getJob } from '@/lib/job-store-fs';
import { canUserGenerate, getUserId } from '@/lib/user-tracking';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from fingerprint to filter jobs
    const clientFingerprint = request.headers.get('x-fingerprint');
    const userId = getUserId(request, clientFingerprint || undefined);
    
    // Get all job IDs and fetch their data
    const jobIds = await getAllJobIds();
    
    const jobPromises = jobIds.map(id => getJob(id));
    const allJobs = (await Promise.all(jobPromises))
      .filter(job => job !== undefined);
    
    // Filter jobs by current user only, but include legacy jobs without userId for now
    const userJobs = allJobs.filter(job => 
      job.userId === userId || !job.userId // Show jobs without userId as fallback
    );
    
    // Sort by creation date (newest first)
    const sortedJobs = userJobs.sort((a, b) => 
      new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
    );

    console.log(`📋 User ${userId.substring(0, 8)}... has ${userJobs.length} jobs (total in system: ${allJobs.length})`);

    return NextResponse.json({ 
      jobs: sortedJobs,
      total: sortedJobs.length 
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to list jobs' }, 
      { status: 500 }
    );
  }
}
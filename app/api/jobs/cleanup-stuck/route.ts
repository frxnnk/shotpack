import { NextRequest, NextResponse } from 'next/server';
import { getAllJobIds, getJob, setJob } from '@/lib/job-store-fs';
import { jobs } from '@/lib/job-store';
import { getUserId } from '@/lib/user-tracking';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const clientFingerprint = request.headers.get('x-fingerprint');
    const userId = getUserId(request, clientFingerprint || undefined);

    console.log(`🧹 [CLEANUP] Starting stuck jobs cleanup for user ${userId.substring(0, 8)}...`);

    // Get all jobs
    const jobIds = await getAllJobIds();
    const jobPromises = jobIds.map(id => getJob(id));
    const allJobs = (await Promise.all(jobPromises))
      .filter(job => job !== undefined);

    // Find stuck jobs (running for more than 15 minutes)
    const now = Date.now();
    const timeoutMs = 15 * 60 * 1000; // 15 minutes
    
    let cleanedCount = 0;
    const stuckJobs = allJobs.filter(job => {
      // Only clean user's own jobs or jobs without userId (legacy)
      const isOwnJob = !job.userId || job.userId === userId;
      const isStuck = job.status === 'running' && 
                     (now - new Date(job.updatedAt).getTime()) > timeoutMs;
      return isOwnJob && isStuck;
    });

    console.log(`🔍 [CLEANUP] Found ${stuckJobs.length} stuck jobs to clean`);

    for (const job of stuckJobs) {
      console.log(`❌ [CLEANUP] Marking job ${job.id} as failed (stuck for ${Math.round((now - new Date(job.updatedAt).getTime()) / 1000 / 60)} minutes)`);
      
      job.status = 'error';
      job.error = 'Job timed out - likely due to serverless function timeout';
      job.updatedAt = new Date();
      
      await setJob(job.id, job);
      jobs.set(job.id, job);
      cleanedCount++;
    }

    console.log(`✅ [CLEANUP] Cleaned ${cleanedCount} stuck jobs`);

    return NextResponse.json({ 
      message: `Cleaned ${cleanedCount} stuck jobs`,
      cleanedCount,
      details: stuckJobs.map(job => ({
        id: job.id,
        stuckFor: Math.round((now - new Date(job.updatedAt).getTime()) / 1000 / 60),
        progress: job.progress
      }))
    });

  } catch (error) {
    console.error('Cleanup stuck jobs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
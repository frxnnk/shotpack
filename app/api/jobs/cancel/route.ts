import { NextRequest, NextResponse } from 'next/server';
import { getJob, setJob } from '@/lib/job-store-fs';
import { jobs } from '@/lib/job-store';
import { getUserId } from '@/lib/user-tracking';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    const clientFingerprint = request.headers.get('x-fingerprint');
    const userId = getUserId(request, clientFingerprint || undefined);

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Get job from persistent storage or memory
    let job = await getJob(jobId);
    if (!job) {
      job = jobs.get(jobId);
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check ownership - STRICT: Only allow if job explicitly belongs to this user
    if (!job.userId || job.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow canceling running or queued jobs
    if (job.status !== 'running' && job.status !== 'queued') {
      return NextResponse.json({ 
        error: `Cannot cancel job in ${job.status} state` 
      }, { status: 400 });
    }

    // Cancel the job
    job.status = 'error';
    job.error = 'Cancelled by user';
    job.updatedAt = new Date();
    
    // Update both storage locations
    await setJob(jobId, job);
    jobs.set(jobId, job);

    console.log(`❌ Job ${jobId} cancelled by user ${userId.substring(0, 8)}...`);

    return NextResponse.json({ 
      message: 'Job cancelled successfully',
      status: job.status 
    });

  } catch (error) {
    console.error('Cancel job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
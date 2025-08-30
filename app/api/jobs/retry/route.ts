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

    // Check ownership
    if (job.userId && job.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow retrying failed jobs
    if (job.status !== 'error') {
      return NextResponse.json({ 
        error: `Cannot retry job in ${job.status} state. Only failed jobs can be retried.` 
      }, { status: 400 });
    }

    console.log(`🔄 [RETRY] Retrying job ${jobId} for user ${userId.substring(0, 8)}...`);

    // Reset job to queued state
    job.status = 'queued';
    job.progress = 0;
    job.error = undefined;
    job.updatedAt = new Date();
    
    // Update both storage locations
    await setJob(jobId, job);
    jobs.set(jobId, job);

    console.log(`✅ [RETRY] Job ${jobId} reset to queued state`);

    // Note: In a real implementation, you'd want to trigger the actual job processing here
    // For now, we just reset the state and the user can monitor it
    console.log(`⚠️ [RETRY] Job reset but automatic reprocessing not implemented yet`);

    return NextResponse.json({ 
      message: 'Job queued for retry',
      status: job.status,
      progress: job.progress,
      note: 'Job has been reset. Automatic reprocessing not yet implemented.'
    });

  } catch (error) {
    console.error('Retry job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
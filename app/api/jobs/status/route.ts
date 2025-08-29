import { NextRequest, NextResponse } from 'next/server';
import { getJob, getAllJobIds } from '@/lib/job-store-fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    console.log(`[STATUS] Checking job: ${jobId}`);
    console.log(`[STATUS] Jobs available: ${getAllJobIds().join(', ')}`);

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = getJob(jobId);
    if (!job) {
      console.log(`[STATUS] Job ${jobId} not found`);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log(`[STATUS] Found job ${jobId}: ${job.status} (${job.progress}%)`);

    return NextResponse.json({
      status: job.status,
      progress: job.progress,
      images: job.images,
      zipUrl: job.zipUrl,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
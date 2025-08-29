import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { getJob } from '@/lib/job-store-fs';
import { canUserGenerate } from '@/lib/user-tracking';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const clientFingerprint = request.headers.get('x-fingerprint');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Check if user has access (Pro users can download unlimited, free users only their free pack)
    const { canGenerate, isProUser } = canUserGenerate(request, clientFingerprint || undefined);
    
    if (!canGenerate && !isProUser) {
      return NextResponse.json({ 
        error: 'Access denied',
        type: 'LIMIT_EXCEEDED' 
      }, { status: 403 });
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'done' || !job.zipUrl) {
      return NextResponse.json({ error: 'Job not completed or ZIP not available' }, { status: 400 });
    }

    try {
      const storage = getStorage();
      let downloadUrl = job.zipUrl;
      
      // Handle storage:// URLs
      if (job.zipUrl && job.zipUrl.startsWith('storage://')) {
        const key = job.zipUrl.replace('storage://', '');
        downloadUrl = await storage.getSignedUrl(key, 300); // 5 minutes expiration
        console.log(`🔗 Generated signed download URL for: ${key}`);
      }

      return NextResponse.json({ downloadUrl });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      
      return NextResponse.json({ downloadUrl: job.zipUrl });
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
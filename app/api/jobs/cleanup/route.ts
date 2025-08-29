import { NextResponse } from 'next/server';
import { getAllJobIds, getJob } from '@/lib/job-store-fs';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const jobIds = getAllJobIds();
    let cleanedCount = 0;
    
    for (const jobId of jobIds) {
      const job = getJob(jobId);
      
      // Remove jobs older than 7 days or with broken URLs
      if (job) {
        const daysSinceCreated = (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const hasInvalidUrls = job.originalUrl?.includes('localhost') || 
                              job.images?.some(img => img.includes('localhost'));
        
        if (daysSinceCreated > 7 || hasInvalidUrls) {
          const jobPath = path.join(process.cwd(), 'temp-jobs', `${jobId}.json`);
          if (fs.existsSync(jobPath)) {
            fs.unlinkSync(jobPath);
            cleanedCount++;
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      cleanedCount,
      message: `Cleaned up ${cleanedCount} old/invalid jobs` 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup jobs' }, 
      { status: 500 }
    );
  }
}
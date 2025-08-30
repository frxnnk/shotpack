import { NextRequest, NextResponse } from 'next/server';
import { getAllJobIds, getJob } from '@/lib/job-store-fs';
import { canUserGenerate, getUserId } from '@/lib/user-tracking';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from fingerprint to filter jobs
    const clientFingerprint = request.headers.get('x-fingerprint');
    const userId = getUserId(request, clientFingerprint || undefined);
    
    // DEBUG - log user identification info
    console.log(`🔍 [LIST] Client fingerprint: ${clientFingerprint ? clientFingerprint.substring(0, 50) + '...' : 'none'}`);
    console.log(`👤 [LIST] Current user ID: ${userId}`);
    
    // Get all job IDs and fetch their data
    const jobIds = await getAllJobIds();
    console.log(`📋 [LIST] Found ${jobIds.length} total job IDs in storage`);
    
    const jobPromises = jobIds.map(id => getJob(id));
    const allJobs = (await Promise.all(jobPromises))
      .filter(job => job !== undefined);
    
    console.log(`📋 [LIST] Loaded ${allJobs.length} valid jobs from storage`);
    
    // Show distribution of job owners for debugging
    const ownerDistribution = allJobs.reduce((acc, job) => {
      const owner = job.userId || 'no-owner';
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`👥 [LIST] Job owners distribution:`, ownerDistribution);
    
    // Filter jobs by current user only - strict filtering
    const userJobs = allJobs.filter(job => job.userId === userId);
    console.log(`🔍 [LIST] After filtering: ${userJobs.length} jobs for user ${userId.substring(0, 10)}...`);
    
    // Sort by creation date (newest first)
    const sortedJobs = userJobs.sort((a, b) => 
      new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
    );

    return NextResponse.json({ 
      jobs: sortedJobs,
      total: sortedJobs.length,
      debug: {
        currentUser: userId.substring(0, 10) + '...',
        totalJobs: allJobs.length,
        userJobs: userJobs.length,
        hasFingerprint: !!clientFingerprint
      }
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to list jobs' }, 
      { status: 500 }
    );
  }
}
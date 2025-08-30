import { NextRequest, NextResponse } from 'next/server';
import { getAllJobIds, getJob } from '@/lib/job-store-fs';
import { canUserGenerate, getUserId } from '@/lib/user-tracking';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from fingerprint to filter jobs
    const clientFingerprint = request.headers.get('x-fingerprint');
    
    // EMERGENCY FIX: If no fingerprint, return empty list for security
    if (!clientFingerprint) {
      console.log('🚨 [PRIVACY] No fingerprint provided - returning empty list for security');
      return NextResponse.json({ 
        jobs: [],
        total: 0,
        error: 'Authentication required' 
      });
    }
    
    const userId = getUserId(request, clientFingerprint);
    
    // Get all job IDs and fetch their data
    const jobIds = await getAllJobIds();
    
    const jobPromises = jobIds.map(id => getJob(id));
    const allJobs = (await Promise.all(jobPromises))
      .filter(job => job !== undefined);
    
    // CRITICAL PRIVACY CHECK - Log all job owners for debugging
    console.log(`🔍 [PRIVACY] Current user: ${userId}`);
    console.log(`📋 [PRIVACY] All jobs with owners:`);
    allJobs.forEach((job, index) => {
      console.log(`  ${index + 1}. Job ${job.id}: owner="${job.userId || 'none'}" created=${job.createdAt}`);
    });
    
    // Filter jobs by current user only - ULTRA STRICT filtering
    const userJobs = allJobs.filter(job => {
      // CRITICAL: Only show jobs that explicitly belong to this user
      // Jobs without userId (legacy) should NOT be shown to anyone for security
      const hasValidOwner = job.userId && typeof job.userId === 'string';
      const isCurrentUser = hasValidOwner && job.userId === userId;
      
      if (!hasValidOwner) {
        console.log(`🚫 [PRIVACY] Filtering out legacy job ${job.id} (no owner) - SECURITY MEASURE`);
        return false;
      }
      
      if (!isCurrentUser) {
        console.log(`🚫 [PRIVACY] Filtering out job ${job.id} (owner: ${job.userId}) from user ${userId}`);
        return false;
      }
      
      console.log(`✅ [PRIVACY] Including job ${job.id} for user ${userId}`);
      return true;
    });
    
    console.log(`🔍 [PRIVACY] Final result: ${userJobs.length} jobs for user ${userId}`);
    
    // Sort by creation date (newest first)
    const sortedJobs = userJobs.sort((a, b) => 
      new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()
    );

    return NextResponse.json({ 
      jobs: sortedJobs,
      total: sortedJobs.length,
      // Add debug info to response so we can see in browser
      debug: process.env.NODE_ENV === 'development' ? {
        currentUserId: userId,
        totalJobs: allJobs.length,
        filteredJobs: userJobs.length,
        jobOwners: allJobs.map(job => ({ id: job.id, owner: job.userId || 'none' }))
      } : undefined
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to list jobs' }, 
      { status: 500 }
    );
  }
}
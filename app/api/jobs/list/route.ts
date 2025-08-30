import { NextRequest, NextResponse } from 'next/server';
import { getAllJobIds, getJob } from '@/lib/job-store-fs';
import { canUserGenerate, getUserId } from '@/lib/user-tracking';
import { getRobustUserId } from '@/lib/robust-fingerprint';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        jobs: [],
        total: 0,
        error: 'Authentication required' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Extract email from token (simple approach - in production use proper JWT)
    // For now, we'll validate the token exists in localStorage on client side
    // Here we extract the email from the token structure
    
    // Simple token validation - in production use proper JWT verification
    if (!token || token.length < 10) {
      return NextResponse.json({ 
        jobs: [],
        total: 0,
        error: 'Invalid token' 
      });
    }
    
    // For now, we'll trust the client-side token and extract email from request
    // In production, decode JWT properly
    const email = request.headers.get('x-user-email');
    if (!email) {
      return NextResponse.json({ 
        jobs: [],
        total: 0,
        error: 'User email required' 
      });
    }
    
    const userId = `email_${email.toLowerCase()}`;
    
    // Get all job IDs and fetch their data
    const jobIds = await getAllJobIds();
    
    const jobPromises = jobIds.map(id => getJob(id));
    const allJobs = (await Promise.all(jobPromises))
      .filter(job => job !== undefined);
    
    // Filter jobs by current user only - STRICT filtering
    const userJobs = allJobs.filter(job => {
      // CRITICAL: Only show jobs that explicitly belong to this user
      const hasValidOwner = job.userId && typeof job.userId === 'string';
      const isCurrentUser = hasValidOwner && job.userId === userId;
      
      return isCurrentUser;
    });
    
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
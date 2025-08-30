import { NextRequest, NextResponse } from 'next/server';
import { getAllJobIds, getJob } from '@/lib/job-store-fs';
import { canUserGenerate, getUserId } from '@/lib/user-tracking';
import { getRobustUserId } from '@/lib/robust-fingerprint';
import { getStorage } from '@/lib/storage';

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
    
    const normalizedEmail = email.toLowerCase();
    
    // Load user's jobs from R2 storage
    const storage = getStorage();
    const USER_HISTORY_PREFIX = 'users/history/';
    const userHistoryKey = `${USER_HISTORY_PREFIX}${normalizedEmail}.json`;
    
    let userJobs: any[] = [];
    
    try {
      // Check if file exists
      const exists = await storage.fileExists(userHistoryKey);
      console.log(`🔍 [LIST] History file exists for ${normalizedEmail}:`, exists);
      
      if (exists) {
        // Get signed URL and fetch the data
        const signedUrl = await storage.getSignedUrl(userHistoryKey, 300); // 5 minutes
        const response = await fetch(signedUrl);
        
        if (response.ok) {
          const data = await response.text();
          const jobs = JSON.parse(data);
          
          // Convert date strings back to Date objects and sort
          userJobs = jobs.map((job: any) => ({
            ...job,
            createdAt: new Date(job.createdAt),
            updatedAt: new Date(job.updatedAt),
            completedAt: job.completedAt ? new Date(job.completedAt) : undefined
          })).sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          console.log(`✅ [LIST] Loaded ${userJobs.length} jobs for ${normalizedEmail}`);
        } else {
          console.log(`⚠️ [LIST] Failed to fetch history for ${normalizedEmail}`);
        }
      }
    } catch (error) {
      console.error(`❌ [LIST] Error loading jobs for ${normalizedEmail}:`, error);
    }

    return NextResponse.json({ 
      jobs: userJobs,
      total: userJobs.length,
      // Add debug info to response so we can see in browser
      debug: process.env.NODE_ENV === 'development' ? {
        userEmail: normalizedEmail,
        userHistoryKey: userHistoryKey,
        storageType: 'R2',
        jobCount: userJobs.length
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
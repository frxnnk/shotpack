import { NextRequest, NextResponse } from 'next/server';
import { getAllJobIds, getJob } from '@/lib/job-store-fs';
import { canUserGenerate } from '@/lib/user-tracking';

export async function GET(request: NextRequest) {
  try {
    // For now, return all jobs since this is mainly for admin/development
    // In production, you might want to filter by user's fingerprint
    const jobIds = getAllJobIds();
    
    const jobs = jobIds
      .map(id => getJob(id))
      .filter(job => job !== undefined)
      .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime());

    return NextResponse.json({ 
      jobs,
      total: jobs.length 
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to list jobs' }, 
      { status: 500 }
    );
  }
}
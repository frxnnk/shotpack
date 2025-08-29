import { NextRequest, NextResponse } from 'next/server';
import { getAllJobIds, getJob } from '@/lib/job-store-fs';
import { canUserGenerate } from '@/lib/user-tracking';

export async function GET(request: NextRequest) {
  try {
    // For now, return empty array since getAllJobIds is not implemented for R2
    // In production, you'd want to use a database for job listing
    const jobIds = await getAllJobIds();
    
    const jobPromises = jobIds.map(id => getJob(id));
    const jobs = (await Promise.all(jobPromises))
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
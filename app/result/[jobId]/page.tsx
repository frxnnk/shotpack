'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProgressLog from '@/components/ProgressLog';

export default function ResultPage() {
  const params = useParams();
  const jobId = params?.jobId as string;

  if (!jobId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Job ID</h1>
        <Link
          href="/generate"
          className="text-blue-600 hover:text-blue-700 underline"
        >
          Start a new generation
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <Link
            href="/generate"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Generate Another
          </Link>
        </div>

        <ProgressLog
          jobId={jobId}
          onComplete={() => {
            console.log('Generation completed');
          }}
        />

        <div className="mt-6 text-center">
          <div className="text-xs text-gray-400">
            Job ID: <code className="bg-gray-100 px-2 py-1 rounded text-gray-600">{jobId}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
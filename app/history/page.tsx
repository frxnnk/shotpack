'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Job } from '@/types';
import StorageImage from '@/components/StorageImage';
import FingerprintCollector from '@/components/FingerprintCollector';

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  useEffect(() => {
    // Always try to fetch jobs after a short delay, with or without fingerprint
    const timer = setTimeout(() => {
      setDebugInfo('Attempting to fetch jobs...');
      fetchJobs();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Also fetch when we get fingerprint
    if (fingerprint) {
      setDebugInfo(`Got fingerprint: ${fingerprint.substring(0, 50)}... - Fetching jobs...`);
      fetchJobs();
    }
  }, [fingerprint]);

  const fetchJobs = async () => {
    try {
      const headers: HeadersInit = {};
      if (fingerprint) {
        headers['x-fingerprint'] = fingerprint;
        console.log('📤 Sending fingerprint to /api/jobs/list');
      } else {
        console.log('⚠️ No fingerprint available when fetching jobs');
      }
      
      const response = await fetch('/api/jobs/list', { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Jobs received:', data.jobs.length, 'jobs for current user');
        setDebugInfo(`API Success: Received ${data.jobs.length} jobs for current user`);
        setJobs(data.jobs);
      } else {
        console.error('Failed to fetch jobs - response not ok:', response.status);
        setDebugInfo(`API Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFingerprintCollected = (fp: string) => {
    console.log('🖱️ Fingerprint collected for history:', fp.substring(0, 100) + '...');
    setDebugInfo(`Fingerprint collected: ${fp.length} chars`);
    setFingerprint(fp);
  };

  const handleJobAction = async (action: 'cancel' | 'retry' | 'cleanup-stuck', jobId?: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (fingerprint) {
        headers['x-fingerprint'] = fingerprint;
      }

      let endpoint = `/api/jobs/${action}`;
      let body = {};
      
      if (jobId) {
        body = { jobId };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Action completed successfully');
        fetchJobs(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Job action failed:', error);
      alert('Action failed');
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <FingerprintCollector onFingerprintCollected={handleFingerprintCollected} />
      
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm">
          <strong>Debug:</strong> {debugInfo}
        </div>
      )}
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Job History
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => handleJobAction('cleanup-stuck')}
            className="px-3 py-2 text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 text-sm"
          >
            Fix Stuck Jobs
          </button>
          <button
            onClick={async () => {
              const headers: HeadersInit = { 'Content-Type': 'application/json' };
              if (fingerprint) {
                headers['x-fingerprint'] = fingerprint;
              }
              const response = await fetch('/api/jobs/cleanup', { 
                method: 'POST',
                headers 
              });
              if (response.ok) {
                fetchJobs(); // Refresh the list
              }
            }}
            className="px-3 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm"
          >
            Clean Up Old
          </button>
          <Link
            href="/generate"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Pack
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-3m-13 0h3m-3 0h3m-3 0h3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
          <p className="text-gray-500 mb-6">Create your first photo pack to see it here</p>
          <Link
            href="/generate"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Get Started →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg border p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {job.style?.replace('_', ' ')} style
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(job.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Job-specific actions */}
                  {job.status === 'running' && (
                    <button
                      onClick={() => handleJobAction('cancel', job.id)}
                      className="px-2 py-1 text-red-600 hover:text-red-700 text-xs border border-red-300 rounded hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  )}
                  {job.status === 'error' && (
                    <button
                      onClick={() => handleJobAction('retry', job.id)}
                      className="px-2 py-1 text-green-600 hover:text-green-700 text-xs border border-green-300 rounded hover:bg-green-50"
                    >
                      Retry
                    </button>
                  )}
                  {job.status === 'done' && (
                    <Link
                      href={`/result/${job.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Results →
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {job.originalUrl && (
                  <StorageImage
                    src={job.originalUrl}
                    alt="Original"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                
                {job.status === 'done' && job.images && (
                  <>
                    <span className="text-gray-400">→</span>
                    <div className="flex gap-2">
                      {job.images.slice(0, 3).map((image, idx) => (
                        <StorageImage
                          key={idx}
                          src={image}
                          alt={`Result ${idx + 1}`}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ))}
                      {job.images.length > 3 && (
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          +{job.images.length - 3}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {job.status === 'running' && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600">{job.progress}% complete</span>
                  </div>
                )}

                {job.status === 'error' && (
                  <span className="text-sm text-red-600">
                    {job.error || 'Generation failed'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
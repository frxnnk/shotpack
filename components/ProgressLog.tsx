'use client';

import { useState, useEffect } from 'react';
import { JobStatusResponse } from '@/types';
import StorageImage from './StorageImage';

interface ProgressLogProps {
  jobId: string;
  onComplete?: (result: JobStatusResponse) => void;
}

export default function ProgressLog({ jobId, onComplete }: ProgressLogProps) {
  const [status, setStatus] = useState<JobStatusResponse>({
    status: 'queued',
    progress: 0,
    images: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/status?jobId=${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        
        const data: JobStatusResponse = await response.json();
        setStatus(data);

        if (data.status === 'done' && onComplete && !hasCompletedOnce) {
          console.log('🎯 [PROGRESS] Job completed for first time, calling onComplete');
          setHasCompletedOnce(true);
          onComplete(data);
        } else if (data.status === 'error') {
          setError('Generation failed. Please try again.');
        }
      } catch (err) {
        setError('Failed to check status');
        console.error('Status poll error:', err);
      }
    };

    const interval = setInterval(pollStatus, 1500);
    pollStatus();

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  const getStatusMessage = () => {
    switch (status.status) {
      case 'queued':
        return 'Preparing your images...';
      case 'running':
        if (status.progress < 20) return 'Processing original image...';
        if (status.progress < 80) return 'Generating styled backgrounds...';
        if (status.progress < 95) return 'Applying upscaling...';
        return 'Creating download package...';
      case 'done':
        return 'All images ready!';
      case 'error':
        return 'Generation failed';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {status.status === 'done' ? 'Complete!' : 'Generating Your Images'}
        </h2>
        <p className="text-gray-600">{getStatusMessage()}</p>
        
        {status.status === 'done' && status.zipUrl && (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                🎉 Your {status.images.length} images are ready!
              </p>
            </div>
            <DownloadButton jobId={jobId} />
          </div>
        )}
      </div>

      {status.status !== 'done' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(status.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}

      {status.images.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center">
            Generated Images ({status.images.length}/6)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {status.images.map((imageUrl, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent hover:border-blue-300 cursor-pointer transition-all transform hover:scale-105 relative group"
                onClick={() => setExpandedImage(imageUrl)}
              >
                <StorageImage
                  src={imageUrl}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full opacity-90">
                  {index + 1}
                </div>
              </div>
            ))}
            
            {/* Show placeholders for remaining images */}
            {Array.from({ length: 6 - status.images.length }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"
              >
                <div className="text-center text-gray-400">
                  <div className="text-xl mb-1">⏳</div>
                  <div className="text-xs">#{status.images.length + index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {status.status === 'running' && (
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </div>
      )}

      {/* Lightbox Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 z-60 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <StorageImage
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DownloadButton({ jobId }: { jobId: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/jobs/download?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const { downloadUrl } = await response.json();
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `banana-backdrops-${jobId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
    >
      {downloading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Downloading...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download ZIP
        </>
      )}
    </button>
  );
}
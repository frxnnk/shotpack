'use client';

import { useState, useEffect } from 'react';

interface StorageImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function StorageImage({ src, alt, className, fallback }: StorageImageProps) {
  const [actualSrc, setActualSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    // If it's not a storage:// URL, use it directly
    if (!src.startsWith('storage://')) {
      setActualSrc(src);
      setLoading(false);
      return;
    }

    // Convert storage:// URL to signed URL
    const convertUrl = async () => {
      try {
        const response = await fetch('/api/storage/url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storageUrl: src }),
        });

        if (response.ok) {
          const { signedUrl } = await response.json();
          setActualSrc(signedUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to convert storage URL:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    convertUrl();
  }, [src]);

  if (loading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className || ''}`}>
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
          ⏳
        </div>
      </div>
    );
  }

  if (error || !actualSrc) {
    return (
      <div className={`bg-gray-100 ${className || ''}`}>
        {fallback || (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            📷
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={actualSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
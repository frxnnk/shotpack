'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface UploadBoxProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  className?: string;
}

export default function UploadBox({ onFileSelect, selectedFile, className }: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG)');
      return false;
    }
    
    if (file.size > 8 * 1024 * 1024) {
      setError('File size must be less than 8MB');
      return false;
    }
    
    return true;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          error ? 'border-red-300 bg-red-50' : '',
          selectedFile ? 'border-green-300 bg-green-50' : ''
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileInput}
        />
        
        {selectedFile ? (
          <div className="space-y-2">
            <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden bg-gray-100">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-green-700">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-20 h-20 mx-auto rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop your product image here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse • JPG, PNG • Max 8MB
              </p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
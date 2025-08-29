'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadBox from '@/components/UploadBox';
import StylePicker from '@/components/StylePicker';
import { StyleType } from '@/types';

export default function GeneratePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleType | null>(null);
  const [upscale, setUpscale] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!selectedFile || !selectedStyle) {
      alert('Please select a file and style');
      return;
    }

    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('style', selectedStyle);
      formData.append('upscale', upscale.toString());
      
      // Add fingerprint data if available
      const fingerprint = sessionStorage.getItem('shotpack_fp');
      if (fingerprint) {
        formData.append('fingerprint', fingerprint);
      }

      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle limit exceeded specifically
        if (error.type === 'LIMIT_EXCEEDED') {
          // Redirect to pricing page
          const shouldUpgrade = confirm(
            `You've used your free pack (${error.packsUsed}/1). Upgrade to Pro for unlimited packs at $7/month?`
          );
          if (shouldUpgrade) {
            window.location.href = '/pricing';
          }
          return;
        }
        
        throw new Error(error.error || 'Generation failed');
      }

      const { jobId } = await response.json();
      router.push(`/result/${jobId}`);
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : 'Generation failed');
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Create your photo pack
          </h1>
          <p className="text-gray-600">
            Upload your product → Choose style → Download 6 shots
          </p>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">1</span>
              <h3 className="font-medium text-gray-900">Upload your product photo</h3>
            </div>
            <UploadBox
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
            />
          </div>

          <div className={`transition-all duration-300 ${!selectedFile ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">2</span>
              <h3 className="font-medium text-gray-900">Choose background style</h3>
            </div>
            <StylePicker
              selectedStyle={selectedStyle}
              onStyleSelect={setSelectedStyle}
            />
          </div>

          {selectedFile && selectedStyle && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">3</span>
                  <div>
                    <h3 className="font-medium text-gray-900">High-res quality</h3>
                    <p className="text-xs text-gray-500">2048px resolution (recommended)</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={upscale}
                    onChange={(e) => setUpscale(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating your pack...
                  </>
                ) : (
                  <>
                    Generate 6-pack →
                  </>
                )}
              </button>
              {!isGenerating && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  Usually takes 30-60 seconds
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
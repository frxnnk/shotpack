'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SaveToHistoryModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveToHistoryModal({ jobId, isOpen, onClose, onSaved }: SaveToHistoryModalProps) {
  const { isAuthenticated, email: userEmail, authenticate } = useAuth();
  const [step, setStep] = useState<'prompt' | 'email' | 'code' | 'success'>('prompt');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const hasTriedAutoSaveRef = useRef(false);

  const handleSaveDirectly = async () => {
    if (!userEmail || isLoading) return;
    
    console.log('🔄 [MODAL] Starting auto-save for job:', jobId, 'email:', userEmail);
    setIsLoading(true);
    setError('');

    try {
      const saveResponse = await fetch('/api/jobs/associate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, email: userEmail }),
      });

      const responseData = await saveResponse.json();
      console.log('📦 [MODAL] API response:', responseData);

      if (!saveResponse.ok) {
        throw new Error(responseData.error || 'Failed to save to history');
      }

      console.log('✅ [MODAL] Successfully saved, changing to success step');
      setStep('success');
      onSaved();
    } catch (error) {
      console.error('❌ [MODAL] Save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save');
      setStep('prompt'); // Reset to prompt on error
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already authenticated, auto-save when modal opens (ONLY ONCE)
  useEffect(() => {
    console.log('🔍 [MODAL] useEffect triggered - isOpen:', isOpen, 'isAuthenticated:', isAuthenticated, 'userEmail:', userEmail, 'hasTriedAutoSave:', hasTriedAutoSaveRef.current, 'step:', step);
    
    if (isOpen && isAuthenticated && userEmail && !hasTriedAutoSaveRef.current && step === 'prompt') {
      console.log('🚀 [MODAL] Triggering auto-save for authenticated user');
      hasTriedAutoSaveRef.current = true;
      // Use setTimeout to ensure state is properly set
      setTimeout(() => {
        handleSaveDirectly();
      }, 100);
    }
  }, [isOpen, isAuthenticated, userEmail, step]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send code');
      }

      setStep('code');
    } catch (error) {
      console.error('Send code error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndSave = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First verify the code and get authenticated
      const verifyResponse = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.error || 'Invalid code');
      }

      const { token, email: verifiedEmail } = await verifyResponse.json();

      // Store authentication in local storage
      authenticate(verifiedEmail, token);

      // Now associate the job with this email
      const saveResponse = await fetch('/api/jobs/associate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, email: verifiedEmail }),
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || 'Failed to save to history');
      }

      setStep('success');
      onSaved();
    } catch (error) {
      console.error('Verify and save error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('prompt');
    setEmail('');
    setCode('');
    setError('');
    setIsLoading(false);
    hasTriedAutoSaveRef.current = false;
    onClose();
  };

  // Reset state when modal opens (but DON'T reset auto-save if already successful)
  useEffect(() => {
    if (isOpen) {
      // Only reset to prompt if we haven't already saved successfully
      if (step !== 'success') {
        setStep('prompt');
      }
      setEmail('');
      setCode('');
      setError('');
      setIsLoading(false);
      // Don't reset hasTriedAutoSave if we're already in success state
      if (step !== 'success') {
        hasTriedAutoSaveRef.current = false;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
        {step === 'prompt' && !isAuthenticated && (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Save to History?
              </h2>
              <p className="text-gray-600 text-sm">
                Keep track of your photo packs and access them anytime by saving to your history.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => setStep('email')}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save to History
              </button>
            </div>
          </>
        )}

        {step === 'prompt' && isAuthenticated && (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Saving to History...
              </h2>
              <p className="text-gray-600 text-sm">
                Adding this pack to your history for <strong>{userEmail}</strong>
              </p>
              {isLoading && (
                <div className="flex items-center justify-center mt-4">
                  <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'email' && (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Enter your email
              </h2>
              <p className="text-gray-600 text-sm">
                We'll send you a verification code to save this pack to your history.
              </p>
            </div>
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('prompt')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleSendCode}
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          </>
        )}

        {step === 'code' && (
          <>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Enter verification code
              </h2>
              <p className="text-gray-600 text-sm">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg tracking-widest"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('email')}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleVerifyAndSave}
                disabled={isLoading || code.length !== 6}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save to History'}
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Saved to History!
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Your photo pack has been saved. You can access it anytime from your history.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
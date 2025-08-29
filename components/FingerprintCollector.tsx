'use client';

import { useEffect } from 'react';

interface FingerprintCollectorProps {
  onFingerprintCollected?: (fingerprint: string) => void;
}

export default function FingerprintCollector({ onFingerprintCollected }: FingerprintCollectorProps = {}) {
  useEffect(() => {
    const collectFingerprint = async () => {
      try {
        // Wait for page to load completely
        await new Promise(resolve => {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
          } else {
            resolve(null);
          }
        });

        // Small delay to ensure everything is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('ShotPack fingerprint 🎨', 2, 2);
        }

        // Get audio context info safely
        let audioInfo = { sampleRate: 0, state: 'unavailable' };
        try {
          if (window.AudioContext || (window as any).webkitAudioContext) {
            const audioContext = new ((window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext)();
            audioInfo = {
              sampleRate: audioContext.sampleRate,
              state: audioContext.state
            };
            // Close audio context to prevent memory leaks
            audioContext.close();
          }
        } catch (e) {
          // Audio context not available
        }

        // Get WebGL info safely
        let webglInfo = 'none';
        try {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const renderer = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).RENDERER);
            const vendor = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).VENDOR);
            webglInfo = `${renderer}|${vendor}`;
          }
        } catch (e) {
          webglInfo = 'error';
        }

        // Test available fonts
        const testFonts = ['Arial', 'Times', 'Courier', 'Helvetica', 'Comic Sans MS', 'Georgia', 'Verdana'];
        let fontsAvailable = 0;
        try {
          const testCanvas = document.createElement('canvas');
          const testCtx = testCanvas.getContext('2d');
          if (testCtx) {
            testCtx.font = '12px monospace';
            const baseWidth = testCtx.measureText('mmmmmmmmmmlli').width;
            
            fontsAvailable = testFonts.filter(font => {
              testCtx.font = `12px ${font}, monospace`;
              return testCtx.measureText('mmmmmmmmmmlli').width !== baseWidth;
            }).length;
          }
        } catch (e) {
          fontsAvailable = 0;
        }

        const fingerprint = {
          // Screen & Display
          screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          pixelRatio: window.devicePixelRatio || 1,
          
          // Browser & System
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages ? navigator.languages.slice(0, 3) : [],
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack || 'unspecified',
          
          // Timezone & Location
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timezoneOffset: new Date().getTimezoneOffset(),
          
          // Hardware
          hardwareConcurrency: navigator.hardwareConcurrency || 0,
          maxTouchPoints: navigator.maxTouchPoints || 0,
          
          // Canvas Fingerprint
          canvas: ctx ? canvas.toDataURL() : 'unavailable',
          
          // Audio Context
          audio: audioInfo,
          
          // WebGL
          webgl: webglInfo,
          
          // Fonts
          fontsAvailable,
          
          // Storage & Capabilities
          localStorage: typeof Storage !== 'undefined',
          sessionStorage: typeof Storage !== 'undefined',
          indexedDB: !!window.indexedDB,
          
          // Media Devices
          mediaDevices: navigator.mediaDevices ? 'available' : 'none',
          
          // Additional factors
          cpuClass: (navigator as any).cpuClass || 'unknown',
          connection: (navigator as any).connection?.effectiveType || 'unknown',
          memory: (navigator as any).deviceMemory || 0,
          
          timestamp: Date.now()
        };

        const fingerprintString = JSON.stringify(fingerprint);
        
        // Store fingerprint in sessionStorage for consistency during session
        sessionStorage.setItem('shotpack_fp', fingerprintString);
        
        // Send to server
        if (onFingerprintCollected) {
          onFingerprintCollected(fingerprintString);
        }

      } catch (error) {
        console.error('Fingerprint collection failed:', error);
        
        // Fallback minimal fingerprint
        const fallbackFingerprint = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timestamp: Date.now()
        };
        
        const fallbackString = JSON.stringify(fallbackFingerprint);
        sessionStorage.setItem('shotpack_fp', fallbackString);
        
        if (onFingerprintCollected) {
          onFingerprintCollected(fallbackString);
        }
      }
    };

    // Check if we already have a fingerprint for this session
    const existingFingerprint = sessionStorage.getItem('shotpack_fp');
    if (existingFingerprint && onFingerprintCollected) {
      onFingerprintCollected(existingFingerprint);
    } else {
      collectFingerprint();
    }
  }, [onFingerprintCollected]);

  // This component doesn't render anything visible
  return null;
}
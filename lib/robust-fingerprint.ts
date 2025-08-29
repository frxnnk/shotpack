import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Client-side fingerprinting (to be called from browser)
export const generateClientFingerprint = () => `
(function() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('ShotPack fingerprint 🎨', 2, 2);
  
  const audio = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audio.createOscillator();
  const analyser = audio.createAnalyser();
  oscillator.connect(analyser);
  
  return JSON.stringify({
    // Screen & Display
    screen: screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
    viewport: window.innerWidth + 'x' + window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    
    // Browser & System
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: JSON.stringify(navigator.languages || []),
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
    canvas: canvas.toDataURL(),
    
    // Audio Context
    audioSampleRate: audio.sampleRate,
    audioState: audio.state,
    
    // WebGL
    webgl: (function() {
      try {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return gl ? gl.getParameter(gl.RENDERER) + '|' + gl.getParameter(gl.VENDOR) : 'none';
      } catch(e) { return 'error'; }
    })(),
    
    // Fonts (approximate)
    fonts: (function() {
      const testFonts = ['Arial', 'Times', 'Courier', 'Helvetica', 'Comic Sans MS'];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = '12px monospace';
      const baseWidth = ctx.measureText('test').width;
      
      return testFonts.filter(font => {
        ctx.font = '12px ' + font + ', monospace';
        return ctx.measureText('test').width !== baseWidth;
      }).length;
    })(),
    
    // Storage & Capabilities
    localStorage: typeof(Storage) !== 'undefined',
    sessionStorage: typeof(Storage) !== 'undefined',
    indexedDB: !!window.indexedDB,
    addBehavior: !!document.body.addBehavior,
    openDatabase: !!window.openDatabase,
    cpuClass: navigator.cpuClass || 'unknown',
    
    // Media Devices
    mediaDevices: navigator.mediaDevices ? 'available' : 'none',
    
    timestamp: Date.now()
  });
})();
`;

// Server-side factors
function getServerFingerprint(req: NextRequest): string {
  const ip = req.ip || 
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') || 
    'unknown';
    
  const headers = {
    userAgent: req.headers.get('user-agent') || '',
    acceptLanguage: req.headers.get('accept-language') || '',
    acceptEncoding: req.headers.get('accept-encoding') || '',
    accept: req.headers.get('accept') || '',
    dnt: req.headers.get('dnt') || '',
    connection: req.headers.get('connection') || '',
    upgradeInsecureRequests: req.headers.get('upgrade-insecure-requests') || '',
    secFetchSite: req.headers.get('sec-fetch-site') || '',
    secFetchMode: req.headers.get('sec-fetch-mode') || '',
    secFetchDest: req.headers.get('sec-fetch-dest') || '',
  };
  
  return JSON.stringify({
    ip: hashIP(ip), // Hash IP for privacy but keep consistency
    headers,
    timestamp: Date.now()
  });
}

// Hash IP to maintain privacy but keep consistency
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'shotpack-salt').digest('hex').substring(0, 8);
}

// Generate composite fingerprint ID
export function generateRobustFingerprint(req: NextRequest, clientData?: string): string {
  const serverData = getServerFingerprint(req);
  
  // If we have client data, combine both
  let combinedData = serverData;
  if (clientData) {
    try {
      const parsed = JSON.parse(clientData);
      combinedData = JSON.stringify({
        server: JSON.parse(serverData),
        client: parsed
      });
    } catch (e) {
      // If client data is malformed, use server data only
    }
  }
  
  // Generate multiple hash variants for resilience
  const primary = crypto.createHash('sha256').update(combinedData).digest('hex').substring(0, 16);
  
  // Fallback fingerprints with reduced data (in case some factors change)
  const fallbacks = [];
  
  try {
    const data = JSON.parse(combinedData);
    
    // Fallback 1: Without timestamp
    if (data.client) {
      const withoutTimestamp = { ...data };
      delete withoutTimestamp.client.timestamp;
      fallbacks.push(
        crypto.createHash('sha256').update(JSON.stringify(withoutTimestamp)).digest('hex').substring(0, 16)
      );
    }
    
    // Fallback 2: Core factors only
    const coreFactors = {
      screen: data.client?.screen,
      userAgent: data.client?.userAgent || data.server?.headers?.userAgent,
      language: data.client?.language,
      timezone: data.client?.timezone,
      canvas: data.client?.canvas,
      ip: data.server?.headers ? hashIP(data.server.ip || 'unknown') : 'unknown'
    };
    
    fallbacks.push(
      crypto.createHash('sha256').update(JSON.stringify(coreFactors)).digest('hex').substring(0, 16)
    );
    
  } catch (e) {
    // If parsing fails, create a simple fallback
    fallbacks.push(
      crypto.createHash('sha256').update(serverData.substring(0, 100)).digest('hex').substring(0, 16)
    );
  }
  
  return JSON.stringify({
    primary,
    fallbacks,
    generated: Date.now()
  });
}

// Check if fingerprint matches (including fallbacks)
export function fingerprintMatches(stored: string, current: string): boolean {
  try {
    const storedData = JSON.parse(stored);
    const currentData = JSON.parse(current);
    
    // Direct primary match
    if (storedData.primary === currentData.primary) {
      return true;
    }
    
    // Check if current primary matches any stored fallbacks
    if (storedData.fallbacks?.includes(currentData.primary)) {
      return true;
    }
    
    // Check if stored primary matches any current fallbacks
    if (currentData.fallbacks?.includes(storedData.primary)) {
      return true;
    }
    
    // Cross-check fallbacks
    for (const storedFallback of storedData.fallbacks || []) {
      if (currentData.fallbacks?.includes(storedFallback)) {
        return true;
      }
    }
    
    return false;
    
  } catch (e) {
    // If JSON parsing fails, do simple string comparison
    return stored === current;
  }
}

// Get user ID using robust fingerprinting
export function getRobustUserId(req: NextRequest, clientData?: string): string {
  const fingerprint = generateRobustFingerprint(req, clientData);
  
  // Return a shorter, cleaner user ID
  return crypto.createHash('sha256')
    .update(fingerprint)
    .digest('hex')
    .substring(0, 16);
}
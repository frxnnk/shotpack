import { NextRequest } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { generateRobustFingerprint, fingerprintMatches, getRobustUserId } from './robust-fingerprint';

interface UserUsage {
  userId: string;
  fingerprint: string;
  packsUsed: number;
  isPro: boolean;
  proExpiresAt?: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

const USAGE_FILE = path.join('/tmp', 'temp-users/usage.json');
const FREE_PACK_LIMIT = 1;

// Ensure directory exists
function ensureUsageDir() {
  const dir = path.dirname(USAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Generate user ID using persistent ID from client or fallback to fingerprinting
export function getUserId(req: NextRequest, clientData?: string): string {
  console.log(`🔍 [USER-ID] Generating user ID...`);
  console.log(`🔍 [USER-ID] Client data: ${clientData ? clientData.substring(0, 100) + '...' : 'none'}`);
  
  if (clientData) {
    try {
      const parsed = JSON.parse(clientData);
      console.log(`🔍 [USER-ID] Parsed data:`, { 
        hasPersistentId: !!parsed.persistentId,
        persistentIdPreview: parsed.persistentId ? parsed.persistentId.substring(0, 10) + '...' : 'none'
      });
      
      if (parsed.persistentId) {
        const userId = `pid_${parsed.persistentId}`;
        console.log(`🔍 [USER-ID] Using persistent ID: ${userId.substring(0, 20)}...`);
        return userId;
      }
    } catch (e) {
      console.log(`⚠️ [USER-ID] JSON parse failed, falling back to robust fingerprinting`);
    }
  }
  
  const robustId = getRobustUserId(req, clientData);
  console.log(`🔍 [USER-ID] Using robust fingerprint ID: ${robustId.substring(0, 20)}...`);
  return robustId;
}

// Load all usage data
function loadUsageData(): Record<string, UserUsage> {
  ensureUsageDir();
  
  if (!fs.existsSync(USAGE_FILE)) {
    return {};
  }
  
  try {
    const data = fs.readFileSync(USAGE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Convert date strings back to Date objects
    Object.keys(parsed).forEach(userId => {
      parsed[userId].createdAt = new Date(parsed[userId].createdAt);
      parsed[userId].lastUsedAt = new Date(parsed[userId].lastUsedAt);
      if (parsed[userId].proExpiresAt) {
        parsed[userId].proExpiresAt = new Date(parsed[userId].proExpiresAt);
      }
    });
    
    return parsed;
  } catch (error) {
    console.error('Error loading usage data:', error);
    return {};
  }
}

// Save usage data
function saveUsageData(data: Record<string, UserUsage>) {
  ensureUsageDir();
  
  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving usage data:', error);
  }
}

// Get user usage info with fingerprint matching
export function getUserUsage(req: NextRequest, clientData?: string): UserUsage {
  const currentFingerprint = generateRobustFingerprint(req, clientData);
  const userId = getUserId(req, clientData);
  const allData = loadUsageData();
  const now = new Date();
  
  // Try to find existing user by fingerprint matching
  let existingUser: UserUsage | null = null;
  for (const userData of Object.values(allData)) {
    if (fingerprintMatches(userData.fingerprint, currentFingerprint)) {
      existingUser = userData;
      break;
    }
  }
  
  if (existingUser) {
    // Update fingerprint and userId to latest
    existingUser.fingerprint = currentFingerprint;
    existingUser.userId = userId;
    existingUser.lastUsedAt = now;
    
    // Check if Pro expired
    if (existingUser.isPro && existingUser.proExpiresAt && existingUser.proExpiresAt < now) {
      existingUser.isPro = false;
      existingUser.proExpiresAt = undefined;
    }
    
    // Save under new userId if it changed
    delete allData[Object.keys(allData).find(key => allData[key] === existingUser)!];
    allData[userId] = existingUser;
    saveUsageData(allData);
    
    return existingUser;
  }
  
  // Create new user
  if (!allData[userId]) {
    allData[userId] = {
      userId,
      fingerprint: currentFingerprint,
      packsUsed: 0,
      isPro: false,
      createdAt: now,
      lastUsedAt: now,
    };
    saveUsageData(allData);
  }
  
  return allData[userId];
}

// Check if user can generate (free limit or Pro)
export function canUserGenerate(req: NextRequest, clientData?: string): {
  canGenerate: boolean;
  reason: string;
  packsUsed: number;
  isProUser: boolean;
} {
  const usage = getUserUsage(req, clientData);
  
  if (usage.isPro) {
    return {
      canGenerate: true,
      reason: 'pro_user',
      packsUsed: usage.packsUsed,
      isProUser: true,
    };
  }
  
  if (usage.packsUsed < FREE_PACK_LIMIT) {
    return {
      canGenerate: true,
      reason: 'free_limit',
      packsUsed: usage.packsUsed,
      isProUser: false,
    };
  }
  
  return {
    canGenerate: false,
    reason: 'limit_exceeded',
    packsUsed: usage.packsUsed,
    isProUser: false,
  };
}

// Record pack usage
export function recordPackUsage(req: NextRequest, clientData?: string): void {
  const usage = getUserUsage(req, clientData);
  const allData = loadUsageData();
  
  usage.packsUsed += 1;
  usage.lastUsedAt = new Date();
  
  allData[usage.userId] = usage;
  saveUsageData(allData);
}

// Upgrade user to Pro by fingerprint
export function upgradeUserToPro(fingerprint: string, durationMonths: number = 1): void {
  const allData = loadUsageData();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
  
  // Find user by fingerprint matching
  let targetUser: UserUsage | null = null;
  for (const userData of Object.values(allData)) {
    if (fingerprintMatches(userData.fingerprint, fingerprint)) {
      targetUser = userData;
      break;
    }
  }
  
  if (targetUser) {
    targetUser.isPro = true;
    targetUser.proExpiresAt = expiresAt;
    targetUser.lastUsedAt = now;
    
    allData[targetUser.userId] = targetUser;
    saveUsageData(allData);
  }
}

// Get user stats (for dashboard)
export function getUserStats(): {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  totalPacks: number;
} {
  const allData = loadUsageData();
  const users = Object.values(allData);
  const now = new Date();
  
  let proUsers = 0;
  let totalPacks = 0;
  
  users.forEach(user => {
    totalPacks += user.packsUsed;
    
    // Check if still Pro (not expired)
    if (user.isPro && (!user.proExpiresAt || user.proExpiresAt > now)) {
      proUsers++;
    }
  });
  
  return {
    totalUsers: users.length,
    freeUsers: users.length - proUsers,
    proUsers,
    totalPacks,
  };
}
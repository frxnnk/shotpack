import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface AuthCode {
  email: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
}

const CODES_FILE = path.join('/tmp', 'temp-users/auth-codes.json');

// Load auth codes (same as send-code)
function loadAuthCodes(): Record<string, AuthCode> {
  if (!fs.existsSync(CODES_FILE)) {
    return {};
  }
  
  try {
    const data = fs.readFileSync(CODES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Convert date strings back to Date objects
    Object.keys(parsed).forEach(email => {
      parsed[email].createdAt = new Date(parsed[email].createdAt);
      parsed[email].expiresAt = new Date(parsed[email].expiresAt);
    });
    
    return parsed;
  } catch (error) {
    console.error('Error loading auth codes:', error);
    return {};
  }
}

// Save auth codes
function saveAuthCodes(codes: Record<string, AuthCode>) {
  try {
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
  } catch (error) {
    console.error('Error saving auth codes:', error);
  }
}

// Generate authentication token
function generateAuthToken(email: string): string {
  const payload = {
    email,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex')
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Load codes
    const codes = loadAuthCodes();
    const storedCode = codes[normalizedEmail];
    
    if (!storedCode) {
      return NextResponse.json({ error: 'No code found for this email' }, { status: 400 });
    }
    
    // Check if code is expired
    if (Date.now() > storedCode.expiresAt.getTime()) {
      // Remove expired code
      delete codes[normalizedEmail];
      saveAuthCodes(codes);
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
    }
    
    // Check if code matches
    if (storedCode.code !== code) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
    
    // Code is valid! Generate auth token
    const token = generateAuthToken(normalizedEmail);
    
    // Remove used code
    delete codes[normalizedEmail];
    saveAuthCodes(codes);
    
    console.log(`✅ [AUTH] User ${normalizedEmail} authenticated successfully`);
    
    return NextResponse.json({
      message: 'Authentication successful',
      token,
      email: normalizedEmail
    });
    
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
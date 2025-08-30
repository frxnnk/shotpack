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

// Ensure directory exists
function ensureCodesDir() {
  const dir = path.dirname(CODES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load auth codes
function loadAuthCodes(): Record<string, AuthCode> {
  ensureCodesDir();
  
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
  ensureCodesDir();
  
  try {
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
  } catch (error) {
    console.error('Error saving auth codes:', error);
  }
}

// Generate 6-digit code
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Simple email sending (in production, use a real email service)
async function sendEmail(email: string, code: string): Promise<boolean> {
  // For development, just log the code
  console.log(`📧 [AUTH] Sending code ${code} to ${email}`);
  console.log(`🔗 [AUTH] In production, this would be sent via email service`);
  
  // TODO: In production, integrate with email service like:
  // - Resend
  // - SendGrid
  // - AWS SES
  // - Nodemailer
  
  return true; // Simulate success
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Load existing codes
    const codes = loadAuthCodes();
    
    // Check rate limiting (max 1 code per minute per email)
    const existing = codes[normalizedEmail];
    if (existing && (Date.now() - existing.createdAt.getTime()) < 60000) {
      return NextResponse.json({ 
        error: 'Please wait before requesting another code' 
      }, { status: 429 });
    }
    
    // Generate new code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Store code
    codes[normalizedEmail] = {
      email: normalizedEmail,
      code,
      expiresAt,
      createdAt: new Date()
    };
    
    saveAuthCodes(codes);
    
    // Send email
    const sent = await sendEmail(normalizedEmail, code);
    
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
    
    console.log(`✅ [AUTH] Code sent to ${normalizedEmail}`);
    
    return NextResponse.json({ 
      message: 'Code sent successfully',
      // In development, include the code in response for testing
      ...(process.env.NODE_ENV === 'development' && { devCode: code })
    });
    
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
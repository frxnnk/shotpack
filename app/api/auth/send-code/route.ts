import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';

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

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit code
function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Send email with Resend
async function sendEmail(email: string, code: string): Promise<boolean> {
  try {
    console.log(`📧 [AUTH] Sending verification code to ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: 'ShotPack <noreply@resend.dev>', // Using Resend's default domain for testing
      to: [email],
      subject: 'Your ShotPack verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ShotPack</h1>
            <p style="color: #666; margin: 5px 0;">AI-Powered Background Generator</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Your verification code</h2>
            <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${code}</div>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 15px 0;">
              Enter this code to access your photo pack history.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
              This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 ShotPack. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ [AUTH] Resend error:', error);
      return false;
    }

    console.log('✅ [AUTH] Email sent successfully:', data?.id);
    return true;
    
  } catch (error) {
    console.error('❌ [AUTH] Failed to send email:', error);
    return false;
  }
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
      message: 'Verification code sent to your email'
    });
    
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
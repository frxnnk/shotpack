import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { storageUrl } = await request.json();
    
    if (!storageUrl || !storageUrl.startsWith('storage://')) {
      return NextResponse.json({ error: 'Invalid storage URL' }, { status: 400 });
    }

    const key = storageUrl.replace('storage://', '');
    const storage = getStorage();
    
    const signedUrl = await storage.getSignedUrl(key, 3600); // 1 hour expiry
    
    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error('Storage URL conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert storage URL' },
      { status: 500 }
    );
  }
}
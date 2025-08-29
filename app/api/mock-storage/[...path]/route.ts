import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { MockStorage } from '@/lib/storage-mock';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const storage = getStorage();
    
    // Solo funciona con MockStorage
    if (storage.constructor.name !== 'MockStorage') {
      console.log(`❌ Mock storage: Wrong storage type: ${storage.constructor.name}`);
      return NextResponse.json({ error: 'Mock storage endpoint only available in development' }, { status: 404 });
    }

    const path = params.path.map(decodeURIComponent).join('/');
    const mockStorage = storage as MockStorage;
    
    console.log(`📁 Mock storage: Looking for file with path: "${path}"`);
    console.log(`📁 Mock storage: Available files:`, Array.from(mockStorage.files?.keys() || []));
    console.log(`📁 Mock storage: Storage instance ID: ${storage.constructor.name}-${Object.prototype.toString.call(storage)}`);
    
    const file = mockStorage.getFile(path);

    if (!file) {
      console.log(`❌ Mock storage: File not found at path: "${path}"`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Determinar content-type basado en la extensión
    let contentType = 'application/octet-stream';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (path.endsWith('.png')) {
      contentType = 'image/png';
    } else if (path.endsWith('.zip')) {
      contentType = 'application/zip';
    }

    return new NextResponse(file as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Mock storage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
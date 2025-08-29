import { ImageProvider, EditRequest, EditResult } from '@/types';

export class MockProvider implements ImageProvider {
  async edit(req: EditRequest): Promise<EditResult> {
    console.log(`🎨 Mock edit: ${req.prompt.substring(0, 50)}...`);
    
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Crear una imagen mock local
    const mockImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mock-storage/mock-generated-${Date.now()}.jpg`;
    
    console.log(`✅ Mock edit complete: ${mockImageUrl}`);
    
    return {
      outputUrl: mockImageUrl
    };
  }

  async upscale(imageUrl: string, target?: { width: number; height: number }): Promise<{ outputUrl: string }> {
    console.log(`🔍 Mock upscale: ${imageUrl}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular upscaling devolviendo una imagen de mayor resolución
    const upscaledUrl = imageUrl.replace('1024/1024', '2048/2048');
    
    console.log(`✅ Mock upscale complete: ${upscaledUrl}`);
    
    return {
      outputUrl: upscaledUrl
    };
  }
}
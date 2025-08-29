import { ImageProvider, EditRequest, EditResult } from '@/types';
import { GeminiProvider } from './providers/gemini';
import { FalProvider } from './providers/fal';
import { MockProvider } from './providers/mock';

export type { EditRequest, EditResult, ImageProvider } from '@/types';

let providerInstance: ImageProvider | null = null;

export function getImageProvider(): ImageProvider {
  if (!providerInstance) {
    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Using Gemini provider');
      providerInstance = new GeminiProvider();
    } else if (process.env.FAL_API_KEY) {
      console.log('🤖 Using FAL provider');
      providerInstance = new FalProvider();
    } else {
      console.log('🎭 Using Mock provider (no API keys configured)');
      providerInstance = new MockProvider();
    }
  }
  return providerInstance;
}
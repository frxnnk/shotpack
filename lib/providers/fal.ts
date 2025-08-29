import { ImageProvider, EditRequest, EditResult } from '@/types';
import axios from 'axios';

export class FalProvider implements ImageProvider {
  private apiKey: string;
  private baseUrl = 'https://fal.run/fal-ai';

  constructor() {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      throw new Error('FAL_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  async edit(req: EditRequest): Promise<EditResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/flux/dev/image-to-image`,
        {
          image_url: req.imageUrl,
          prompt: req.prompt,
          strength: 0.75,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          seed: Math.floor(Math.random() * 1000000),
          enable_safety_checker: req.safety?.allowPeople !== false,
        },
        {
          headers: {
            'Authorization': `Key ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      if (!response.data.images?.[0]?.url) {
        throw new Error('Invalid response from FAL API');
      }

      return { outputUrl: response.data.images[0].url };
    } catch (error) {
      console.error('FAL edit error:', error);
      throw new Error(`FAL edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async upscale(imageUrl: string, target?: { width: number; height: number }): Promise<{ outputUrl: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/clarity-upscaler`,
        {
          image_url: imageUrl,
          scale_factor: target ? Math.min(target.width / 1024, target.height / 1024) : 2,
        },
        {
          headers: {
            'Authorization': `Key ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      if (!response.data.image?.url) {
        throw new Error('Invalid response from FAL upscale API');
      }

      return { outputUrl: response.data.image.url };
    } catch (error) {
      console.error('FAL upscale error:', error);
      
      const upscalePrompt = `Upscale this image to high resolution while preserving all details and edges. Maintain the original quality and sharpness without over-processing.`;
      const result = await this.edit({
        imageUrl,
        prompt: upscalePrompt,
        size: target,
      });
      
      return { outputUrl: result.outputUrl };
    }
  }
}
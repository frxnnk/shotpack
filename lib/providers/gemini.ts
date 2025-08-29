import { ImageProvider, EditRequest, EditResult } from '@/types';
import axios from 'axios';
import { getStorage } from '../storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements ImageProvider {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    console.log('🍌 Nano Banana (Gemini 2.5 Flash Image) provider initialized');
  }

  async edit(req: EditRequest): Promise<EditResult> {
    try {
      console.log('🍌 Nano Banana: Starting image generation/editing...');
      
      // Usar la librería oficial de Google
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
      
      let prompt: string;
      let parts: any[];

      if (req.imageUrl && req.imageUrl !== '') {
        // Si hay imagen, es edición
        console.log('🖼️ Image editing mode');
        const imageBuffer = await this.fetchImage(req.imageUrl);
        const base64Image = imageBuffer.toString('base64');

        prompt = `Edit this image: ${req.prompt}. Maintain the original subject's identity while applying the requested changes. Generate a high-quality edited image.`;
        
        parts = [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg'
            }
          }
        ];
      } else {
        // Si no hay imagen, es generación desde texto
        console.log('🎨 Text-to-image generation mode');
        prompt = `Generate a high-quality image: ${req.prompt}. Create a photorealistic, detailed image that matches the description perfectly.`;
        parts = [{ text: prompt }];
      }

      console.log('📤 Nano Banana: Sending request using official Google AI library...');
      const response = await model.generateContent(parts);
      
      console.log('📥 Nano Banana: Received response');
      console.log('🔍 Response structure:', JSON.stringify(response, null, 2));

      if (!response.response?.candidates?.[0]?.content?.parts) {
        console.error('❌ Invalid response structure from Nano Banana API');
        throw new Error('Invalid response structure from Nano Banana API');
      }

      // Buscar imagen en la respuesta
      const responseParts = response.response.candidates[0].content.parts;
      console.log('🔍 Parts found:', responseParts.length);
      
      for (let i = 0; i < responseParts.length; i++) {
        const part = responseParts[i];
        console.log(`🔍 Part ${i}:`, JSON.stringify(part, null, 2));
        
        // Verificar si hay inlineData con una imagen
        if (part.inlineData) {
          console.log('🔍 Found inline data:', Object.keys(part.inlineData));
          
          if (part.inlineData.data) {
            console.log('✅ Nano Banana: Found generated image in response');
            
            // Determinar el tipo MIME de la imagen
            const mimeType = part.inlineData.mimeType || 'image/jpeg';
            const extension = mimeType.includes('png') ? 'png' : 'jpg';
            
            // Guardar la imagen generada
            const generatedBuffer = Buffer.from(part.inlineData.data, 'base64');
            const storage = getStorage();
            const imageKey = `nano-banana/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
            const imageUrl = await storage.uploadFile(imageKey, generatedBuffer, mimeType);
            
            return { outputUrl: imageUrl };
          }
        }

        // Si hay texto, loguearlo para debug
        if (part.text) {
          console.log('📝 Part text:', part.text.substring(0, 200));
        }
      }

      console.log('❌ No image data found in any part');
      throw new Error('No image found in Nano Banana response');

    } catch (error) {
      console.error('❌ Nano Banana generation error:', error);
      throw new Error(`Nano Banana generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async upscale(imageUrl: string, target?: { width: number; height: number }): Promise<{ outputUrl: string }> {
    const upscalePrompt = `Upscale this image to ${target?.width || 2048}x${target?.height || 2048} pixels with enhanced detail and sharpness. Maintain all original features and improve quality.`;
    
    const result = await this.edit({
      imageUrl,
      prompt: upscalePrompt,
      size: target,
    });

    return { outputUrl: result.outputUrl };
  }

  // Nueva función específica para generación de imágenes desde texto
  async generate(prompt: string, options?: { 
    aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
    style?: string;
  }): Promise<{ outputUrl: string }> {
    const enhancedPrompt = `${prompt}${options?.style ? ` in ${options.style} style` : ''}. High quality, photorealistic, detailed image.${options?.aspectRatio ? ` Aspect ratio: ${options.aspectRatio}.` : ''}`;
    
    console.log('🎨 Nano Banana: Generating image from text...');
    
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
      const response = await model.generateContent([{ text: enhancedPrompt }]);
      
      const responseParts = response.response.candidates?.[0]?.content?.parts;
      
      if (responseParts) {
        for (const part of responseParts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/jpeg';
            const extension = mimeType.includes('png') ? 'png' : 'jpg';
            
            const generatedBuffer = Buffer.from(part.inlineData.data, 'base64');
            const storage = getStorage();
            const imageKey = `nano-banana-generated/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;
            const imageUrl = await storage.uploadFile(imageKey, generatedBuffer, mimeType);
            
            return { outputUrl: imageUrl };
          }
        }
      }
      
      throw new Error('No image found in generation response');
    } catch (error) {
      console.error('❌ Nano Banana generation error:', error);
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchImage(url: string): Promise<Buffer> {
    console.log(`📡 Fetching image from: ${url.substring(0, 50)}...`);
    
    try {
      let actualUrl = url;
      
      // Handle internal storage URLs
      if (url.startsWith('storage://')) {
        const key = url.replace('storage://', '');
        console.log(`🔑 Converting storage URL to signed URL for key: ${key}`);
        actualUrl = await getStorage().getSignedUrl(key, 3600);
        console.log(`🔗 Generated signed URL: ${actualUrl.substring(0, 100)}...`);
      }
      
      const response = await axios.get(actualUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000,
      });
      console.log(`✅ Image fetched: ${response.data.byteLength} bytes`);
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error(`❌ Failed to fetch image from URL: ${url}`);
      console.error(`❌ Error details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        message: error.message,
        code: error.code
      });
      
      if (error.response?.data) {
        const errorText = Buffer.from(error.response.data).toString('utf8');
        console.error(`❌ Response body: ${errorText.substring(0, 500)}`);
      }
      
      throw new Error(`Failed to fetch image from storage: ${error.response?.status || error.message}`);
    }
  }
}
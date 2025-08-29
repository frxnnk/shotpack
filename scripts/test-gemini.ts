#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

import { getImageProvider } from '../lib/provider';
import { getStorage } from '../lib/storage';
import { readFileSync } from 'fs';
import { join } from 'path';

async function testGeminiIntegration() {
  console.log('🤖 Testing Gemini Image Generation Integration...');
  console.log('='.repeat(50));
  
  try {
    const provider = getImageProvider();
    console.log(`🎨 Image provider: ${provider.constructor.name}`);
    
    const storage = getStorage();
    console.log(`📦 Storage provider: ${storage.constructor.name}`);
    
    // Step 1: Upload a test image
    console.log('\n1. 📤 Uploading test image...');
    const testImagePath = join(process.cwd(), 'public', 'examples', 'sample-shoe.jpg');
    let testImageBuffer: Buffer;
    
    try {
      testImageBuffer = readFileSync(testImagePath);
      console.log(`✅ Test image loaded: ${testImageBuffer.length} bytes`);
    } catch {
      console.log('⚠️  Using placeholder image data');
      testImageBuffer = Buffer.from('fake-image-data-for-testing');
    }
    
    const testJobId = `test-${Date.now()}`;
    const originalKey = `uploads/${testJobId}/original.jpg`;
    const originalUrl = await storage.uploadFile(originalKey, testImageBuffer, 'image/jpeg');
    console.log(`✅ Image uploaded: ${originalUrl}`);
    
    // Step 2: Test image generation with Gemini
    console.log('\n2. 🎨 Testing image generation with Gemini...');
    const testPrompt = `You are an e-commerce product photo editor.
Keep the product IDENTICAL: same shape, proportions, logo, color, texture and material. 
Do NOT change or repaint the product itself. 
Replace ONLY the background and scene according to the style. 
Add realistic contact shadows/reflections consistent with tabletop studio photography. 
Maintain photorealism, no AI artifacts, no text, no extra logos. 
Framing: hero product shot centered, 3:2 aspect if possible. 
Lighting: soft, diffused; avoid harsh highlights or blown whites.
Color fidelity is critical: do not shift the product's hue or saturation.

Background: premium white marble slab with subtle grey veining. 
Soft daylight coming from the left at ~45°, gentle falloff, shallow depth-of-field look (f/2.8 feel).
Slight soft shadow below the product; subtle reflection on polished marble.

Generate 1 variation for the marble style, keeping identical product identity.`;
    
    console.log(`🔄 Generating image with prompt: "${testPrompt.substring(0, 100)}..."`);
    
    const startTime = Date.now();
    const result = await provider.edit({
      imageUrl: originalUrl,
      prompt: testPrompt,
      size: { width: 1024, height: 1024 }
    });
    const endTime = Date.now();
    
    console.log(`✅ Image generation successful!`);
    console.log(`🖼️  Generated image URL: ${result.outputUrl}`);
    console.log(`⏱️  Generation time: ${endTime - startTime}ms`);
    
    // Step 3: Test upscaling (if available)
    if (provider.upscale) {
      console.log('\n3. 🔍 Testing upscaling...');
      const upscaleStart = Date.now();
      const upscaled = await provider.upscale(result.outputUrl);
      const upscaleEnd = Date.now();
      
      console.log(`✅ Upscaling successful!`);
      console.log(`🔍 Upscaled image URL: ${upscaled.outputUrl}`);
      console.log(`⏱️  Upscaling time: ${upscaleEnd - upscaleStart}ms`);
    } else {
      console.log('\n3. ⚠️  Upscaling not available for this provider');
    }
    
    console.log('\n🎉 All Gemini integration tests passed!');
    console.log('=' .repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Image upload: WORKING`);
    console.log(`   ✅ Gemini generation: WORKING`);
    console.log(`   ✅ Storage integration: WORKING`);
    console.log(`   ${provider.upscale ? '✅' : '⚠️'} Upscaling: ${provider.upscale ? 'WORKING' : 'NOT AVAILABLE'}`);
    
  } catch (error) {
    console.error('\n❌ Gemini integration test failed:', error);
    if (error instanceof Error) {
      console.error(`❌ Error message: ${error.message}`);
      console.error(`❌ Error stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  testGeminiIntegration().catch(console.error);
}
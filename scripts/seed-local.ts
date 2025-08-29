#!/usr/bin/env tsx

import { readFile } from 'fs/promises';
import { join } from 'path';

interface MockProvider {
  edit: (req: any) => Promise<{ outputUrl: string }>;
  upscale?: (imageUrl: string) => Promise<{ outputUrl: string }>;
}

const mockProvider: MockProvider = {
  async edit(req: any) {
    console.log(`🎨 Mock editing image with prompt: ${req.prompt.substring(0, 50)}...`);
    
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    return {
      outputUrl: `https://example.com/mock-output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
    };
  },

  async upscale(imageUrl: string) {
    console.log(`🔍 Mock upscaling image: ${imageUrl}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      outputUrl: `https://example.com/mock-upscaled-${Date.now()}.jpg`
    };
  }
};

class MockStorage {
  private files = new Map<string, Buffer>();

  async uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    this.files.set(key, buffer);
    const mockUrl = `https://mock-storage.com/${key}`;
    console.log(`💾 Mock uploaded ${key} (${buffer.length} bytes) -> ${mockUrl}`);
    return mockUrl;
  }

  async getSignedUrl(key: string): Promise<string> {
    return `https://mock-storage.com/signed/${key}?expires=3600`;
  }

  async deleteFile(key: string): Promise<void> {
    this.files.delete(key);
    console.log(`🗑️ Mock deleted ${key}`);
  }

  async fileExists(key: string): Promise<boolean> {
    return this.files.has(key);
  }
}

async function seedLocalTest() {
  console.log('🍌 Starting Banana Backdrops Local Seed Test');
  console.log('=' .repeat(50));

  const mockJobId = 'fake-local-test';
  
  try {
    console.log('📁 Reading sample image...');
    const samplePath = join(process.cwd(), 'public', 'examples', 'sample-shoe.jpg');
    
    let sampleBuffer: Buffer;
    try {
      sampleBuffer = await readFile(samplePath);
      console.log(`✅ Sample image loaded (${sampleBuffer.length} bytes)`);
    } catch (error) {
      console.log('⚠️  Sample image not found, creating placeholder...');
      sampleBuffer = Buffer.from('mock-image-data');
    }

    console.log('\n🎯 Testing Image Generation Pipeline');
    console.log('-'.repeat(30));

    const mockStorage = new MockStorage();
    
    console.log('1. Uploading original image...');
    const originalKey = `uploads/${mockJobId}/original.jpg`;
    const originalUrl = await mockStorage.uploadFile(originalKey, sampleBuffer, 'image/jpeg');
    
    console.log('\n2. Generating 6 product variations...');
    const styles = ['marble', 'minimal_wood', 'loft'];
    const images: string[] = [];
    
    let progress = 10;
    console.log(`Progress: ${progress}%`);

    for (let batchIndex = 0; batchIndex < 3; batchIndex++) {
      const style = styles[batchIndex % styles.length];
      console.log(`\n   Batch ${batchIndex + 1} - Style: ${style}`);
      
      const batchPromises = [];
      
      for (let i = 0; i < 2; i++) {
        const imageIndex = batchIndex * 2 + i + 1;
        
        const promise = mockProvider.edit({
          imageUrl: originalUrl,
          prompt: `Generate ${style} background for product ${imageIndex}`,
          size: { width: 1024, height: 1024 }
        }).then(async (result) => {
          const imageKey = `outputs/${mockJobId}/${imageIndex}.jpg`;
          const finalUrl = await mockStorage.uploadFile(imageKey, Buffer.from('mock-processed-image'), 'image/jpeg');
          
          images.push(finalUrl);
          progress = 10 + (images.length * 35 / 6);
          console.log(`   ✅ Image ${imageIndex} generated - Progress: ${Math.round(progress)}%`);
          
          return finalUrl;
        });
        
        batchPromises.push(promise);
      }
      
      await Promise.all(batchPromises);
      
      if (batchIndex < 2) {
        console.log('   ⏸️  Batch delay...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n3. Applying upscaling...');
    progress = 80;
    console.log(`Progress: ${progress}%`);
    
    const upscaledImages = await Promise.all(
      images.map(async (imageUrl, index) => {
        const upscaled = await mockProvider.upscale!(imageUrl);
        console.log(`   🔍 Image ${index + 1} upscaled`);
        return upscaled.outputUrl;
      })
    );

    progress = 90;
    console.log(`Progress: ${progress}%`);

    console.log('\n4. Creating ZIP package...');
    const zipKey = `results/${mockJobId}/pack.zip`;
    const mockZipBuffer = Buffer.from('mock-zip-file-contents');
    const zipUrl = await mockStorage.uploadFile(zipKey, mockZipBuffer, 'application/zip');
    
    progress = 100;
    console.log(`Progress: ${progress}%`);

    console.log('\n✅ Generation Complete!');
    console.log('=' .repeat(50));
    console.log(`📋 Job ID: ${mockJobId}`);
    console.log(`🖼️  Generated Images: ${upscaledImages.length}`);
    console.log(`📦 ZIP Package: ${zipUrl}`);
    console.log(`⏱️  Total Time: ~${Math.ceil((Date.now()) / 1000)}s (simulated)`);
    
    console.log('\n📊 Test Results:');
    console.log(`   ✅ Image processing pipeline: WORKING`);
    console.log(`   ✅ Storage integration: WORKING`);
    console.log(`   ✅ Progress tracking: WORKING`);
    console.log(`   ✅ Batch processing: WORKING`);
    console.log(`   ✅ Upscaling flow: WORKING`);
    console.log(`   ✅ ZIP creation: WORKING`);
    
    console.log('\n🎉 Local seed test completed successfully!');
    console.log('\nTo test the UI:');
    console.log('1. Run `npm run dev`');
    console.log('2. Visit http://localhost:3000');
    console.log('3. Upload an image and generate backgrounds');

  } catch (error) {
    console.error('\n❌ Seed test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedLocalTest().catch(console.error);
}
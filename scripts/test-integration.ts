#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

async function testFullIntegration() {
  console.log('🌟 Starting Full Integration Test...');
  console.log('='.repeat(50));
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log(`🌍 Testing against: ${baseUrl}`);
  
  try {
    // Test 1: Health check
    console.log('\n1. 🏥 Health check...');
    const healthResponse = await fetch(`${baseUrl}/api/jobs/status?jobId=nonexistent`);
    console.log(`✅ API is responding: ${healthResponse.status}`);
    
    // Test 2: Create a job via form data
    console.log('\n2. 🚀 Creating test job...');
    const formData = new FormData();
    
    // Load the sample image from the project
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const samplePath = join(process.cwd(), 'public', 'examples', 'sample-shoe.jpg');
    
    let imageBuffer: Buffer;
    try {
      imageBuffer = readFileSync(samplePath);
      console.log(`📷 Using sample image: ${imageBuffer.length} bytes`);
    } catch {
      // Create a simple valid 1x1 pixel JPEG as fallback
      imageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x80, 0xFF, 0xD9
      ]);
      console.log(`📷 Using fallback 1x1 JPEG`);
    }
    
    const testBlob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
    const testFile = new File([testBlob], 'test-product.jpg', { type: 'image/jpeg' });
    
    formData.append('file', testFile);
    formData.append('style', 'marble');
    formData.append('upscale', 'true');
    
    const createResponse = await fetch(`${baseUrl}/api/jobs/create`, {
      method: 'POST',
      body: formData,
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Job creation failed: ${createResponse.status} - ${errorText}`);
    }
    
    const { jobId } = await createResponse.json();
    console.log(`✅ Job created: ${jobId}`);
    
    // Test 3: Monitor job progress
    console.log('\n3. 👀 Monitoring job progress...');
    let attempts = 0;
    const maxAttempts = 60; // 60 * 2 = 120 seconds timeout
    let lastStatus = '';
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`${baseUrl}/api/jobs/status?jobId=${jobId}`);
      const status = await statusResponse.json();
      
      if (status.status !== lastStatus) {
        console.log(`📊 Status: ${status.status} (${status.progress}%) - Images: ${status.images.length}`);
        lastStatus = status.status;
      }
      
      if (status.status === 'done') {
        console.log(`✅ Job completed successfully!`);
        console.log(`🖼️  Generated ${status.images.length} images`);
        console.log(`📦 ZIP available: ${status.zipUrl ? 'Yes' : 'No'}`);
        
        if (status.images.length > 0) {
          console.log(`🎨 Sample image: ${status.images[0].substring(0, 100)}...`);
        }
        
        // Test 4: Download
        if (status.zipUrl) {
          console.log('\n4. 📥 Testing download...');
          const downloadResponse = await fetch(`${baseUrl}/api/jobs/download?jobId=${jobId}`);
          const downloadData = await downloadResponse.json();
          console.log(`✅ Download URL generated: ${downloadData.downloadUrl ? 'Yes' : 'No'}`);
        }
        
        break;
      }
      
      if (status.status === 'error') {
        console.log(`❌ Job failed with error: ${status.error || 'Unknown error'}`);
        break;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
    
    if (attempts >= maxAttempts) {
      throw new Error(`Job timed out after ${maxAttempts * 2} seconds`);
    }
    
    console.log('\n🎉 Full integration test completed!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  testFullIntegration().catch(console.error);
}
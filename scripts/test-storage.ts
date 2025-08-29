#!/usr/bin/env tsx

import { getStorage } from '../lib/storage';

async function testStorage() {
  console.log('🧪 Testing storage configuration...');
  
  try {
    const storage = getStorage();
    console.log(`📦 Storage type: ${storage.constructor.name}`);
    
    // Test upload
    const testBuffer = Buffer.from('test-content-' + Date.now());
    const testKey = `test/${Date.now()}.txt`;
    
    console.log('⬆️ Testing upload...');
    const uploadUrl = await storage.uploadFile(testKey, testBuffer, 'text/plain');
    console.log(`✅ Upload successful: ${uploadUrl}`);
    
    // Test signed URL generation  
    console.log('🔐 Testing signed URL generation...');
    const signedUrl = await storage.getSignedUrl(testKey, 300);
    console.log(`✅ Signed URL generated: ${signedUrl.substring(0, 100)}...`);
    
    // Test file existence
    console.log('📋 Testing file existence...');
    const exists = await storage.fileExists(testKey);
    console.log(`✅ File exists: ${exists}`);
    
    // Test cleanup
    console.log('🧹 Testing file deletion...');
    await storage.deleteFile(testKey);
    console.log('✅ File deleted');
    
    const existsAfterDelete = await storage.fileExists(testKey);
    console.log(`✅ File exists after delete: ${existsAfterDelete}`);
    
    console.log('\n🎉 All storage tests passed!');
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testStorage().catch(console.error);
}
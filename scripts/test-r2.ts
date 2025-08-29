import { getStorage } from '@/lib/storage';

async function testR2() {
  console.log('🧪 Testing R2 Storage...');
  
  try {
    const storage = getStorage();
    console.log(`📦 Storage provider: ${storage.constructor.name}`);
    
    // Test upload
    const testData = Buffer.from('Hello ShotPack R2!');
    const testKey = `test/shotpack-test-${Date.now()}.txt`;
    
    console.log(`⬆️  Uploading test file: ${testKey}`);
    const uploadUrl = await storage.uploadFile(testKey, testData, 'text/plain');
    console.log(`✅ Upload successful: ${uploadUrl}`);
    
    // Test download
    console.log(`⬇️  Downloading test file...`);
    const downloadUrl = await storage.getSignedUrl(testKey);
    console.log(`✅ Download URL: ${downloadUrl}`);
    
    // Test cleanup
    console.log(`🗑️  Cleaning up test file...`);
    await storage.deleteFile(testKey);
    console.log(`✅ Cleanup successful`);
    
    console.log('🎉 R2 Storage test PASSED!');
    
  } catch (error) {
    console.error('❌ R2 Storage test FAILED:', error);
    process.exit(1);
  }
}

testR2();
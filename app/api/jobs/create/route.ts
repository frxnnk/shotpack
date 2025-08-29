import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getStorage } from '@/lib/storage';
import { getImageProvider } from '@/lib/provider';
import { Job, StyleType } from '@/types';
import { logger } from '@/lib/logger';
import { STYLES } from '@/lib/images';
import { setJob, getJob } from '@/lib/job-store-fs';
import { buildPrompts } from '@/lib/variations';
import { getUserId, canUserGenerate, recordPackUsage } from '@/lib/user-tracking';

export async function POST(request: NextRequest) {
  try {
    // Get client fingerprint data if provided
    const formData = await request.formData();
    const clientFingerprint = formData.get('fingerprint') as string;
    
    // Check user limits first
    const { canGenerate, reason, packsUsed, isProUser } = canUserGenerate(request, clientFingerprint);
    
    console.log(`🔍 User limit check: canGenerate=${canGenerate}, reason=${reason}, packsUsed=${packsUsed}, isProUser=${isProUser}`);
    
    if (!canGenerate) {
      console.log(`❌ Blocking generation: User has used ${packsUsed} packs`);
      return NextResponse.json({ 
        error: 'Free limit exceeded',
        type: 'LIMIT_EXCEEDED',
        packsUsed,
        isProUser: false
      }, { status: 402 }); // 402 Payment Required
    }
    
    console.log(`✅ Allowing generation: User has ${packsUsed} packs used`);

    const file = formData.get('file') as File;
    const style = formData.get('style') as StyleType;
    const upscale = formData.get('upscale') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!style || !['marble', 'minimal_wood', 'loft'].includes(style)) {
      return NextResponse.json({ error: 'Valid style is required' }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 8MB' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      status: 'queued',
      progress: 0,
      style,
      originalUrl: '',
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setJob(jobId, job);

    // Record pack usage immediately when job is accepted (not when completed)
    console.log(`📊 Recording pack usage for job ${jobId} at start`);
    recordPackUsage(request, clientFingerprint);
    console.log(`✅ Pack usage recorded for job ${jobId}`);

    processJob(jobId, file, style, upscale, request, clientFingerprint).catch((error) => {
      logger.error(jobId, 'Job processing failed', error);
      const job = getJob(jobId);
      if (job) {
        job.status = 'error';
        job.error = error.message;
        job.updatedAt = new Date();
        setJob(jobId, job);
      }
    });

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processJob(jobId: string, file: File, style: StyleType, upscale: boolean, request: NextRequest, clientFingerprint: string) {
  const job = getJob(jobId)!;
  
  try {
    job.status = 'running';
    job.progress = 5;
    job.updatedAt = new Date();
    setJob(jobId, job);

    const storage = getStorage();
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    const processedBuffer = await sharp(buffer)
      .resize(1024, 1024, { 
        fit: 'inside', 
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    buffer = Buffer.from(processedBuffer);

    const originalKey = `uploads/${jobId}/original.jpg`;
    const originalUrl = await storage.uploadFile(originalKey, buffer, 'image/jpeg');
    
    job.originalUrl = originalUrl;
    job.progress = 10;
    job.updatedAt = new Date();
    setJob(jobId, job);

    const result = await generatePackServer(jobId, {
      originalUrl,
      style,
      upscale,
      onProgress: (progress, currentImage) => {
        const updatedJob = getJob(jobId)!;
        updatedJob.progress = progress;
        updatedJob.updatedAt = new Date();
        if (currentImage && !updatedJob.images.includes(currentImage)) {
          updatedJob.images.push(currentImage);
        }
        setJob(jobId, updatedJob);
      }
    });

    const finalJob = getJob(jobId)!;
    finalJob.status = 'done';
    finalJob.progress = 100;
    finalJob.images = result.images;
    finalJob.zipUrl = result.zipUrl;
    finalJob.updatedAt = new Date();
    setJob(jobId, finalJob);

    logger.info(jobId, 'Job completed successfully');

  } catch (error) {
    throw error;
  }
}

// Jobs ahora se exportan desde job-store.ts

// Lógica de generación movida del lado del servidor
interface GeneratePackServerRequest {
  originalUrl: string;
  style: StyleType;
  upscale?: boolean;
  onProgress?: (progress: number, currentImage?: string) => void;
}

async function generatePackServer(jobId: string, request: GeneratePackServerRequest) {
  const { originalUrl, style, upscale = true, onProgress } = request;
  
  logger.info(jobId, 'Starting image pack generation', { originalUrl, style, upscale });
  
  const styleInfo = STYLES.find(s => s.id === style);
  if (!styleInfo) {
    throw new Error(`Invalid style: ${style}`);
  }

  const provider = getImageProvider();
  const storage = getStorage();
  const images: string[] = [];

  try {
    onProgress?.(10);

    const batchSize = 2;
    const totalImages = 6;
    
    // Build unique prompts for each of the 6 images
    const basePrompt = styleInfo.prompt;
    const prompts = buildPrompts(style, basePrompt);
    
    logger.info(jobId, 'Built variation prompts', { count: prompts.length, style });

    // Process images in batches, but use unique prompts for each
    for (let i = 0; i < totalImages; i += batchSize) {
      const batchPromises: Promise<void>[] = [];
      const batchEnd = Math.min(i + batchSize, totalImages);

      for (let idx = i; idx < batchEnd; idx++) {
        const imageIndex = idx + 1;
        const promptForThisImage = prompts[idx];
        
        logger.info(jobId, `Image ${imageIndex} using variation prompt ${idx + 1}`);
        
        const promise = processImageServer(provider, storage, jobId, originalUrl, promptForThisImage, imageIndex)
          .then(async (imageUrl) => {
            images[idx] = imageUrl;
            logger.info(jobId, `Image ${imageIndex} generated`, { imageUrl });
            
            const progress = 10 + (idx + 1) * (upscale ? 35 : 70) / totalImages;
            onProgress?.(progress, imageUrl);
          })
          .catch((error) => {
            logger.error(jobId, `Failed to generate image ${imageIndex}`, error);
            images[idx] = '';
          });
        
        batchPromises.push(promise);
      }

      await Promise.all(batchPromises);
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < totalImages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const validImages = images.filter(url => url);
    
    if (validImages.length === 0) {
      throw new Error('No images were generated successfully');
    }

    let finalImages = validImages;

    if (upscale && provider.upscale) {
      logger.info(jobId, 'Starting upscaling process');
      onProgress?.(80);
      
      const upscalePromises = validImages.map(async (imageUrl, index) => {
        try {
          // Convert storage:// URLs to signed URLs for upscaling
          let actualImageUrl = imageUrl;
          if (imageUrl.startsWith('storage://')) {
            const key = imageUrl.replace('storage://', '');
            actualImageUrl = await storage.getSignedUrl(key, 3600);
            logger.info(jobId, `Converting storage URL for upscaling: ${key}`);
          }
          
          const upscaled = await provider.upscale!(actualImageUrl, { width: 2048, height: 2048 });
          logger.info(jobId, `Image ${index + 1} upscaled`);
          return upscaled.outputUrl;
        } catch (error) {
          logger.warn(jobId, `Failed to upscale image ${index + 1}, using original`, error);
          return imageUrl;
        }
      });

      finalImages = await Promise.all(upscalePromises);
      onProgress?.(90);
    }

    logger.info(jobId, 'Creating ZIP file');
    const zipUrl = await createZipFromImagesServer(jobId, finalImages);
    
    onProgress?.(100);
    logger.info(jobId, 'Pack generation completed', { zipUrl, imageCount: finalImages.length });

    return {
      images: finalImages,
      zipUrl
    };

  } catch (error) {
    logger.error(jobId, 'Pack generation failed', error);
    throw error;
  }
}

async function processImageServer(
  provider: any,
  storage: any,
  jobId: string,
  originalUrl: string,
  prompt: string,
  imageIndex: number,
  retries: number = 1
): Promise<string> {
  const maxRetries = retries;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.info(jobId, `Processing image ${imageIndex}, attempt ${attempt + 1}`);
      
      const result = await provider.edit({
        imageUrl: originalUrl,
        prompt,
        size: { width: 1024, height: 1024 }
      });

      const imageKey = `outputs/${jobId}/${imageIndex}.jpg`;
      
      // Handle both direct URLs and storage:// URLs from provider
      let actualOutputUrl = result.outputUrl;
      if (result.outputUrl.startsWith('storage://')) {
        const key = result.outputUrl.replace('storage://', '');
        actualOutputUrl = await storage.getSignedUrl(key, 3600);
        logger.info(jobId, `Converting provider storage URL for fetching: ${key}`);
      }
      
      const imageBuffer = await fetchImageBufferServer(actualOutputUrl);
      const storageUrl = await storage.uploadFile(imageKey, imageBuffer, 'image/jpeg');
      
      // For display purposes, convert storage:// URLs to signed URLs with longer expiration
      let finalUrl = storageUrl;
      if (storageUrl.startsWith('storage://')) {
        const key = storageUrl.replace('storage://', '');
        finalUrl = await storage.getSignedUrl(key, 7200); // 2 hours expiration for preview
        console.log(`🖼️ Generated preview URL for ${imageKey}: ${finalUrl.substring(0, 100)}...`);
      }
      
      return finalUrl;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(jobId, `Image ${imageIndex} attempt ${attempt + 1} failed`, lastError);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`Failed to process image ${imageIndex} after ${maxRetries + 1} attempts`);
}

async function fetchImageBufferServer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function createZipFromImagesServer(jobId: string, imageUrls: string[]): Promise<string> {
  const archiver = require('archiver');
  const storage = getStorage();
  
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });
  
  const buffers: Buffer[] = [];
  
  return new Promise(async (resolve, reject) => {
    archive.on('error', reject);
    archive.on('data', (chunk: Buffer) => buffers.push(chunk));
    archive.on('end', async () => {
      try {
        const zipBuffer = Buffer.concat(buffers);
        const zipKey = `results/${jobId}/pack.zip`;
        
        const zipUrl = await storage.uploadFile(zipKey, zipBuffer, 'application/zip');
        resolve(zipUrl);
      } catch (error) {
        reject(error);
      }
    });

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      try {
        let actualUrl = imageUrl;
        
        // Handle storage:// URLs by converting to signed URLs
        if (imageUrl.startsWith('storage://')) {
          const key = imageUrl.replace('storage://', '');
          actualUrl = await storage.getSignedUrl(key, 3600);
          console.log(`🔗 Converting storage URL to signed URL for ZIP: ${key}`);
        }
        
        const imageBuffer = await fetchImageBufferServer(actualUrl);
        const filename = `image_${i + 1}.jpg`;
        archive.append(imageBuffer, { name: filename });
      } catch (error) {
        console.error(`Failed to add image ${i + 1} to ZIP:`, error);
      }
    }

    archive.finalize();
  });
}
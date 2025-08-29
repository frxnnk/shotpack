# Cloudflare R2 Setup Guide

This guide helps you configure Cloudflare R2 storage for Banana Backdrops.

## 1. Create R2 Bucket

1. Log into Cloudflare Dashboard
2. Go to R2 Object Storage
3. Create a new bucket (e.g., `banana-backdrops`)
4. **Important**: Don't enable public access at bucket level

## 2. Get API Credentials

1. Go to R2 → Manage R2 API tokens
2. Create a new token with these permissions:
   - **Object Read**: Allow
   - **Object Write**: Allow  
   - **Bucket List**: Allow (optional)
3. Copy the Access Key ID and Secret Access Key

## 3. Configure Environment Variables

Update your `.env` file:

```bash
# Cloudflare R2 Configuration
STORAGE_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY_ID=your_access_key_id
STORAGE_SECRET_ACCESS_KEY=your_secret_access_key
```

**Finding your Account ID:**
- In Cloudflare Dashboard, go to the right sidebar
- Copy the Account ID

## 4. Bucket CORS Configuration (Optional)

If you want to enable direct browser access to images, configure CORS:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 5. Test Configuration

Run the storage test to verify everything works:

```bash
npm run test-storage
```

## 6. Common Issues & Solutions

### Issue: "Access Denied" errors
**Solution**: Verify API token has correct permissions for the bucket.

### Issue: "Invalid bucket name" 
**Solution**: Ensure STORAGE_BUCKET matches exact bucket name in R2.

### Issue: "Endpoint not found"
**Solution**: Check STORAGE_ENDPOINT uses correct Account ID format.

### Issue: CORS errors in browser
**Solution**: Either configure bucket CORS or use signed URLs (default behavior).

## 7. Why We Use Signed URLs

The current implementation uses signed URLs instead of public bucket access because:

1. **Security**: No public read access required
2. **Cost Control**: Better control over bandwidth usage  
3. **Reliability**: Works regardless of bucket public access settings
4. **Flexibility**: Easy to add authentication later

## 8. Production Deployment

For Vercel deployment:

1. Add all environment variables to Vercel project settings
2. Ensure Account ID, bucket name, and credentials are correct
3. Test with a small upload first
4. Monitor R2 usage in Cloudflare Dashboard

## 9. Alternative: AWS S3 Configuration

If you prefer AWS S3, update your `.env`:

```bash
# AWS S3 Configuration (instead of R2)
STORAGE_ENDPOINT=  # Leave empty for standard S3
STORAGE_REGION=us-east-1
STORAGE_BUCKET=your-s3-bucket
STORAGE_ACCESS_KEY_ID=your_aws_access_key
STORAGE_SECRET_ACCESS_KEY=your_aws_secret_key
```

## 10. Mock Storage for Development

For local testing without R2/S3 setup, simply omit the storage environment variables and the system will automatically use mock storage.

Mock storage features:
- Stores files in memory
- Provides local URLs via `/api/mock-storage/*`
- Perfect for development and testing
- Automatically cleans up on restart
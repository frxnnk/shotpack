# 🍌 Banana Backdrops

**AI-Powered Product Photography Backgrounds**

Transform your product photos with professional AI-generated backgrounds. Upload one product image, choose a style, and get 6 high-quality variations instantly.

## ✨ Features

- **Professional Backgrounds**: Premium marble, minimal wood, and urban loft styles
- **Product Preservation**: AI maintains identical product shape, colors, and branding
- **Batch Generation**: 6 variations per style for maximum choice
- **High Resolution**: Optional upscaling to 2048px for print quality
- **Fast Processing**: Complete packs in 30-60 seconds
- **Easy Download**: Get all images in a convenient ZIP file

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Image provider API key (Gemini or FAL)
- S3/R2 compatible storage

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd banana-backdrops

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and storage config

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Environment Setup

Required environment variables in `.env`:

```bash
# Image Provider (choose one)
GEMINI_API_KEY=your_gemini_key_here
# OR
FAL_API_KEY=your_fal_key_here

# Storage (S3/R2 compatible)
STORAGE_ENDPOINT=your_storage_endpoint
STORAGE_REGION=your_region
STORAGE_BUCKET=your_bucket_name
STORAGE_ACCESS_KEY_ID=your_access_key
STORAGE_SECRET_ACCESS_KEY=your_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Storage**: S3/Cloudflare R2 compatible
- **Image AI**: Gemini 2.5 Flash or FAL.ai (with fallback)
- **Deployment**: Vercel-ready

### Project Structure

```
/app
  /(marketing)/page.tsx     # Landing page
  /generate/page.tsx        # Upload and style selection  
  /result/[jobId]/page.tsx  # Progress and download
/components
  UploadBox.tsx            # Drag & drop file upload
  StylePicker.tsx          # Background style selection
  ProgressLog.tsx          # Real-time progress tracking
/lib
  images.ts               # Core image processing pipeline
  provider.ts             # Image provider abstraction
  providers/
    gemini.ts            # Gemini API adapter
    fal.ts               # FAL.ai API adapter
  storage.ts             # Storage abstraction layer
  zip.ts                 # ZIP file creation
  logger.ts              # Job logging system
/pages/api
  /jobs
    /create.ts           # Start new generation job
    /status.ts           # Get job progress
    /download.ts         # Download ZIP file
```

## 🎨 Supported Styles

### Premium Marble
- White marble with subtle grey veining
- Soft diffused lighting from 45° angle
- Perfect for luxury and cosmetic products

### Minimal Wood  
- Warm light wood surface with pale backdrop
- Morning window light aesthetic
- Great for lifestyle and organic products

### Urban Loft
- Industrial grey concrete background
- Moody studio lighting
- Ideal for tech and modern products

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run seed-local   # Test generation pipeline locally
npm run test-storage # Test storage configuration
```

### Testing

Run the local test to verify everything works:

```bash
npm run seed-local
```

This simulates the full image generation pipeline without making API calls.

For full testing, see [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md).

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Environment Variables for Production

```bash
GEMINI_API_KEY=your_production_gemini_key
STORAGE_ENDPOINT=your_production_storage_endpoint
STORAGE_BUCKET=your_production_bucket
# ... other variables
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Storage Setup (Cloudflare R2 Example)

```bash
STORAGE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_BUCKET=banana-backdrops
STORAGE_ACCESS_KEY_ID=your_r2_access_key
STORAGE_SECRET_ACCESS_KEY=your_r2_secret_key
```

## 🔌 API Reference

### Create Job
```http
POST /api/jobs/create
Content-Type: multipart/form-data

file: <image file>
style: "marble" | "minimal_wood" | "loft"
upscale: "true" | "false"
```

### Check Status
```http
GET /api/jobs/status?jobId=<job_id>

Response:
{
  "status": "queued" | "running" | "done" | "error",
  "progress": 0-100,
  "images": ["url1", "url2", ...],
  "zipUrl": "download_url"
}
```

### Download ZIP
```http
GET /api/jobs/download?jobId=<job_id>

Response:
{
  "downloadUrl": "signed_url"
}
```

## 💰 Future: Stripe Integration

Payment system is planned for v2. See [`docs/STRIPE_TODO.md`](docs/STRIPE_TODO.md) for implementation details.

**Planned Pricing:**
- Free: 5 images per day
- Paid: 50 images for $9.99

## 📋 Acceptance Criteria

✅ **Core Functionality**
- Upload product image → select style → get 6 variations → download ZIP
- Product identity preserved (shape, colors, branding unchanged)
- Professional background replacement with realistic lighting
- Provider fallback system (Gemini → FAL)
- Error handling with partial pack delivery

✅ **Performance Standards**  
- First image in <15 seconds
- Complete pack in <60 seconds
- High-resolution upscaling available
- Mobile-responsive interface

✅ **Quality Requirements**
- Photorealistic results matching style descriptions
- No AI artifacts or unwanted text overlays
- Consistent product presentation across variations
- Professional studio lighting and shadows

## 🛠️ Customization

### Adding New Styles

1. Add style definition to `lib/images.ts`:
```typescript
{
  id: 'new_style',
  name: 'Display Name', 
  description: 'Brief description',
  prompt: 'Detailed prompt for AI...'
}
```

2. Update TypeScript types in `types/index.ts`
3. Add style preview in `StylePicker.tsx`

### Switching Image Providers

The system supports multiple image providers through a common interface. To add a new provider:

1. Create adapter in `lib/providers/new-provider.ts`
2. Implement `ImageProvider` interface
3. Update provider selection logic in `lib/provider.ts`

## 📚 Documentation

- [`docs/PROMPTS.md`](docs/PROMPTS.md) - AI prompt templates
- [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) - Comprehensive testing checklist  
- [`docs/STRIPE_TODO.md`](docs/STRIPE_TODO.md) - Payment integration plan

## 🐛 Troubleshooting

### Common Issues

**"No image provider configured"**
- Ensure either `GEMINI_API_KEY` or `FAL_API_KEY` is set

**Storage upload fails**
- Verify S3/R2 credentials and bucket configuration
- Run `npm run test-storage` to diagnose issues
- See [`docs/R2_SETUP.md`](docs/R2_SETUP.md) for detailed setup guide
- Check CORS settings if using direct public access

**Generation timeouts**  
- Increase timeout values in provider adapters
- Check image size (resize large images before processing)

**Poor quality results**
- Ensure high-contrast product images
- Use white/transparent backgrounds for best results
- Verify prompts in `docs/PROMPTS.md`

### Debug Mode

Set `NODE_ENV=development` for detailed logging.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm run seed-local`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with Next.js and TypeScript
- UI components styled with Tailwind CSS  
- Image processing powered by Gemini/FAL APIs
- Storage via AWS S3/Cloudflare R2

---

**Made with 🍌 by the Banana Backdrops Team**

*Images edited with AI; product identity preserved by prompt constraints.*
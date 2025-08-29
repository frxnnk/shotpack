# Test Plan - Banana Backdrops

This document outlines the manual testing checklist for the Banana Backdrops MVP.

## Pre-Test Setup

### Environment Configuration
- [ ] `.env` file configured with valid API keys
- [ ] Storage bucket configured and accessible
- [ ] Dependencies installed (`npm install`)
- [ ] Development server running (`npm run dev`)

### Test Assets
- [ ] Sample product images ready (various sizes, formats)
- [ ] Invalid test files ready (non-images, oversized files)

## Core Functionality Tests

### 1. File Upload Tests

#### Valid Uploads
- [ ] Upload JPG file (< 8MB) ✓ Expected: Success
- [ ] Upload PNG file (< 8MB) ✓ Expected: Success
- [ ] Upload WEBP file (< 8MB) ✓ Expected: Success
- [ ] Drag and drop image ✓ Expected: Success
- [ ] File preview displays correctly ✓ Expected: Success

#### Invalid Uploads  
- [ ] Upload non-image file ✗ Expected: Error message
- [ ] Upload file > 8MB ✗ Expected: Error message
- [ ] Upload without selecting file ✗ Expected: Error message

### 2. Style Selection Tests

- [ ] Select "Premium Marble" style ✓ Expected: Visual feedback
- [ ] Select "Minimal Wood" style ✓ Expected: Visual feedback  
- [ ] Select "Urban Loft" style ✓ Expected: Visual feedback
- [ ] Switch between styles ✓ Expected: Selection updates
- [ ] Generate without selecting style ✗ Expected: Error message

### 3. Generation Process Tests

#### Successful Generation
- [ ] Start generation with valid file + style ✓ Expected: Redirect to result page
- [ ] Progress bar displays and updates ✓ Expected: 0% → 100%
- [ ] Status messages update correctly ✓ Expected: Queued → Running → Done
- [ ] Images appear as they're generated ✓ Expected: 6 images total
- [ ] Download button appears when complete ✓ Expected: Clickable download

#### Performance Tests
- [ ] First image appears in < 20 seconds ✓ Expected: Reasonable speed
- [ ] Complete pack in < 90 seconds ✓ Expected: Total completion time
- [ ] Multiple concurrent generations ✓ Expected: No conflicts

#### Error Handling
- [ ] Network disconnection during generation ✗ Expected: Graceful handling
- [ ] API timeout scenarios ✗ Expected: Retry mechanism
- [ ] Partial failure (some images fail) ⚠️ Expected: Partial pack delivery

### 4. Download Tests

- [ ] Click download button ✓ Expected: ZIP file downloads
- [ ] ZIP contains all generated images ✓ Expected: 6 JPG files
- [ ] Images are high quality and named correctly ✓ Expected: image_1.jpg etc.
- [ ] ZIP file size reasonable ✓ Expected: < 50MB typically
- [ ] Download works multiple times ✓ Expected: Consistent results

### 5. Image Quality Tests

#### Product Preservation
- [ ] Product shape unchanged ✓ Expected: Identical geometry
- [ ] Product colors unchanged ✓ Expected: No color shifting  
- [ ] Product logos/text preserved ✓ Expected: No alterations
- [ ] Product texture/material unchanged ✓ Expected: Identical appearance

#### Background Quality
- [ ] Marble style: white marble with veining ✓ Expected: Matches description
- [ ] Wood style: warm wood surface ✓ Expected: Matches description
- [ ] Loft style: concrete/industrial look ✓ Expected: Matches description
- [ ] Professional lighting and shadows ✓ Expected: Studio quality
- [ ] No AI artifacts visible ✓ Expected: Photorealistic results

#### Variations
- [ ] 6 distinct variations generated ✓ Expected: Not identical images
- [ ] Product identity consistent across all ✓ Expected: Same product
- [ ] Subtle camera angle differences ✓ Expected: Natural variations
- [ ] Lighting variations appropriate ✓ Expected: Professional look

### 6. Upscaling Tests

- [ ] Upscaling enabled: higher resolution output ✓ Expected: ~2048px images
- [ ] Upscaling disabled: standard resolution ✓ Expected: ~1024px images  
- [ ] Image quality preserved during upscaling ✓ Expected: No degradation
- [ ] Processing time reasonable with upscaling ✓ Expected: < 2x slower

## Browser Compatibility Tests

### Desktop Browsers
- [ ] Chrome (latest) ✓ Expected: Full functionality
- [ ] Firefox (latest) ✓ Expected: Full functionality  
- [ ] Safari (latest) ✓ Expected: Full functionality
- [ ] Edge (latest) ✓ Expected: Full functionality

### Mobile Browsers
- [ ] Mobile Chrome ✓ Expected: Responsive design
- [ ] Mobile Safari ✓ Expected: Responsive design
- [ ] File upload works on mobile ✓ Expected: Camera/gallery access

## UI/UX Tests

### Navigation
- [ ] Landing page → Generate page ✓ Expected: Smooth transition
- [ ] Generate → Result page ✓ Expected: Correct job ID passed
- [ ] Result page → Generate again ✓ Expected: Back navigation works

### Responsive Design  
- [ ] Desktop layout (1920px) ✓ Expected: Full-width design
- [ ] Tablet layout (768px) ✓ Expected: Stacked components
- [ ] Mobile layout (375px) ✓ Expected: Single column
- [ ] Image previews scale correctly ✓ Expected: Aspect ratios maintained

### Loading States
- [ ] Upload progress indication ✓ Expected: Visual feedback
- [ ] Generation loading animation ✓ Expected: Spinner/progress
- [ ] Download button loading state ✓ Expected: Disabled during download

## Error Recovery Tests

### Network Issues
- [ ] Offline during upload ✗ Expected: Error message + retry option
- [ ] Slow network handling ⚠️ Expected: Appropriate timeouts
- [ ] API server down ✗ Expected: Graceful error handling

### Edge Cases
- [ ] Very large image files ⚠️ Expected: Reasonable processing time
- [ ] Images with transparency ✓ Expected: White background fill
- [ ] Very small images ⚠️ Expected: Appropriate upscaling
- [ ] Unusual aspect ratios ⚠️ Expected: Proper cropping/padding

## Data Persistence Tests

- [ ] Job ID generates correctly ✓ Expected: Unique IDs
- [ ] Job status persists across page reloads ✓ Expected: State maintained
- [ ] Images remain accessible after completion ✓ Expected: Permanent URLs
- [ ] ZIP files persist and remain downloadable ✓ Expected: Stable downloads

## Security Tests

### Input Validation
- [ ] File type validation working ✓ Expected: Only images accepted
- [ ] File size limits enforced ✓ Expected: 8MB limit respected
- [ ] Malicious file handling ✓ Expected: Rejected safely

### API Security  
- [ ] Rate limiting in place ⚠️ Expected: Prevents abuse
- [ ] No sensitive data in client ✓ Expected: API keys server-side
- [ ] CORS properly configured ✓ Expected: Same-origin requests

## Performance Benchmarks

### Target Metrics
- [ ] Page load time < 3 seconds ✓ Expected: Fast loading
- [ ] First image < 15 seconds ✓ Expected: Quick feedback
- [ ] Complete pack < 60 seconds ✓ Expected: Reasonable total time
- [ ] Download starts < 2 seconds ✓ Expected: Immediate response

### Resource Usage
- [ ] Memory usage reasonable ✓ Expected: < 500MB typically
- [ ] Network usage efficient ✓ Expected: Minimal redundant requests
- [ ] Storage cleanup working ⚠️ Expected: Temp files removed

## Success Criteria

### Must Pass (MVP Requirements)
- ✅ Can upload image → select style → get 6 results → download ZIP
- ✅ Product identity preserved in all outputs
- ✅ Professional background replacement quality
- ✅ Fallback provider works if primary fails
- ✅ Basic error handling and user feedback

### Should Pass (Quality Standards)  
- ⚠️ Generation time < 60 seconds for complete pack
- ⚠️ High-quality results matching style descriptions
- ⚠️ Mobile-responsive interface
- ⚠️ Graceful handling of edge cases

### Could Pass (Nice to Have)
- 💡 Sub-15 second first image generation
- 💡 Perfect upscaling quality
- 💡 Advanced error recovery mechanisms
- 💡 Optimized mobile performance

## Test Execution Notes

**Date**: ____________  
**Tester**: ____________  
**Environment**: ____________  
**Provider Used**: ____________  

**Critical Issues Found**:
- 

**Performance Notes**:
- 

**Recommended Fixes**:
- 

**Overall Assessment**: ✅ Ready for deployment / ⚠️ Minor issues / ❌ Major issues found
# Image Generation Prompts

This document contains the prompt templates used for generating product backgrounds in Banana Backdrops.

## Base Prompt

This prompt is **always included** for every image generation to ensure product consistency:

```
You are an e-commerce product photo editor.
Keep the product IDENTICAL: same shape, proportions, logo, color, texture and material. 
Do NOT change or repaint the product itself. 
Replace ONLY the background and scene according to the style. 
Add realistic contact shadows/reflections consistent with tabletop studio photography. 
Maintain photorealism, no AI artifacts, no text, no extra logos. 
Framing: hero product shot centered, 3:2 aspect if possible. 
Lighting: soft, diffused; avoid harsh highlights or blown whites.
Color fidelity is critical: do not shift the product's hue or saturation.
```

## Style-Specific Prompts

### Premium Marble
```
Background: premium white marble slab with subtle grey veining. 
Soft daylight coming from the left at ~45°, gentle falloff, shallow depth-of-field look (f/2.8 feel).
Slight soft shadow below the product; subtle reflection on polished marble.
```

### Minimal Wood  
```
Background: warm light wood tabletop with minimal visible grain, pale beige wall behind. 
Morning diffused window light from right, soft shadow under product.
No props. Clean, minimal, cozy aesthetic.
```

### Urban Loft
```
Background: grey concrete wall, matte texture; surface is neutral mid-grey tabletop. 
Diffuse studio light from top-left, soft shadowing; slightly moody, high-contrast but realistic.
```

## Variation Instructions

For each style, we generate 2 variations using this additional instruction:

```
Generate 2 variations for the selected style, keeping identical product identity. 
Variation should only affect camera angle (slight shift) and micro-lighting nuances.
```

## Upscaling Prompt

When upscaling is enabled, we use this prompt:

```
Upscale this image to high resolution (~2048px on the longest side) preserving detail and edges. 
Avoid plastic smoothing or over-processing. Maintain the original quality and sharpness.
```

## Implementation Notes

- The base prompt is always prepended to style-specific prompts
- Each generation creates 6 total images (2 variations × 3 batches)
- Prompts are designed to be provider-agnostic (work with Gemini, FAL, etc.)
- Critical constraint: **NEVER alter the product itself**
- All prompts emphasize photorealism and professional studio quality

## Editing Constraints

1. **Product Identity**: Shape, proportions, logos, colors must remain identical
2. **Background Only**: Only replace the background and scene
3. **Studio Quality**: Professional lighting and shadows
4. **No Artifacts**: Avoid AI artifacts, text overlays, or extra logos
5. **Color Fidelity**: Maintain original product colors exactly
import { StyleType, GeneratePackRequest, GeneratePackResult, StyleInfo } from '@/types';
import { logger } from './logger';

export const STYLES: StyleInfo[] = [
  {
    id: 'marble',
    name: 'Premium Marble',
    description: 'Elegant white marble background with subtle grey veining',
    prompt: `You are an e-commerce product photo editor.
Keep the product IDENTICAL: same shape, proportions, logo, color, texture and material. 
Do NOT change or repaint the product itself. 
Replace ONLY the background and scene according to the style. 
Add realistic contact shadows/reflections consistent with tabletop studio photography. 
Maintain photorealism, no AI artifacts, no text, no extra logos. 
Framing: hero product shot centered, 3:2 aspect if possible. 
Lighting: soft, diffused; avoid harsh highlights or blown whites.
Color fidelity is critical: do not shift the product's hue or saturation.
Color lock: preserve exact product hue, saturation and value; do not shift white balance on the product.

Background: premium white marble slab with subtle grey veining. 
Soft daylight coming from the left at ~45°, gentle falloff, shallow depth-of-field look (f/2.8 feel).
Slight soft shadow below the product; subtle reflection on polished marble.`
  },
  {
    id: 'minimal_wood',
    name: 'Minimal Wood',
    description: 'Warm light wood tabletop with clean, minimal aesthetic',
    prompt: `You are an e-commerce product photo editor.
Keep the product IDENTICAL: same shape, proportions, logo, color, texture and material. 
Do NOT change or repaint the product itself. 
Replace ONLY the background and scene according to the style. 
Add realistic contact shadows/reflections consistent with tabletop studio photography. 
Maintain photorealism, no AI artifacts, no text, no extra logos. 
Framing: hero product shot centered, 3:2 aspect if possible. 
Lighting: soft, diffused; avoid harsh highlights or blown whites.
Color fidelity is critical: do not shift the product's hue or saturation.
Color lock: preserve exact product hue, saturation and value; do not shift white balance on the product.

Background: warm light wood tabletop with minimal visible grain, pale beige wall behind. 
Morning diffused window light from right, soft shadow under product.
No props. Clean, minimal, cozy aesthetic.`
  },
  {
    id: 'loft',
    name: 'Urban Loft',
    description: 'Industrial grey concrete with moody, high-contrast lighting',
    prompt: `You are an e-commerce product photo editor.
Keep the product IDENTICAL: same shape, proportions, logo, color, texture and material. 
Do NOT change or repaint the product itself. 
Replace ONLY the background and scene according to the style. 
Add realistic contact shadows/reflections consistent with tabletop studio photography. 
Maintain photorealism, no AI artifacts, no text, no extra logos. 
Framing: hero product shot centered, 3:2 aspect if possible. 
Lighting: soft, diffused; avoid harsh highlights or blown whites.
Color fidelity is critical: do not shift the product's hue or saturation.
Color lock: preserve exact product hue, saturation and value; do not shift white balance on the product.

Background: grey concrete wall, matte texture; surface is neutral mid-grey tabletop. 
Diffuse studio light from top-left, soft shadowing; slightly moody, high-contrast but realistic.`
  }
];

// Solo exportamos los estilos y tipos, la lógica se mueve al API
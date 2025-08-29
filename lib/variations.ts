export type VariationSpec = {
  id: number;
  suffix: string;
};

// Universal e-commerce photography variations that work with any style
const ECOMMERCE_VARIATIONS: VariationSpec[] = [
  { 
    id: 1, 
    suffix: "Camera: centered hero shot, straight-on eye level. Background: clean neutral studio (use style background). Lighting: balanced, soft shadows. Classic catalog look." 
  },
  { 
    id: 2, 
    suffix: "Camera: ~30° right yaw, slight downward tilt. Background: style background. Lighting: daylight key from left. Soft reflection/shadow." 
  },
  { 
    id: 3, 
    suffix: "Camera: top-down flat lay (~90°). Product perfectly centered. Background: style surface texture only (marble/wood/concrete). Even diffuse light." 
  },
  { 
    id: 4, 
    suffix: "Camera: ~20° low angle (looking up). Product appears more imposing. Background: style background. Lighting: studio diffuse, gentle contrast." 
  },
  { 
    id: 5, 
    suffix: "Camera: tighter crop on the product, ~10% closer. Frontal perspective. Background: blurred style background. Lighting: soft, product texture sharp." 
  },
  { 
    id: 6, 
    suffix: "Camera: wider framing (include more background surface around product). Eye-level. Background: style background extended. Lighting: diffused daylight. Product remains central focus." 
  },
];

export function buildPrompts(styleId: string, basePrompt: string): string[] {
  return ECOMMERCE_VARIATIONS.map((variation, idx) =>
    [
      basePrompt.trim(),
      "CRITICAL: Keep the product IDENTICAL (shape, proportions, color, logo, texture, material). Do not repaint or deform.",
      "ABSOLUTE BAN: Do not add people, pets, animals, hands, text, logos, or props of any kind.",
      "Maintain photorealism, clean edges, color fidelity.",
      "Add realistic contact shadows/reflections consistent with the described scene.",
      `VARIATION ${idx + 1} OF 6: ${variation.suffix}`,
      "STRICT BAN: Do not add people, pets, hands, phones, text, logos, screens or props of any kind. Only the product itself must be visible.",
    ].join("\n\n")
  );
}
import { TEXT_VARIANTS, TextVariant, TextColor, TextWeight } from '../constants/textVariants';
import { typography } from '../constants/themes';

interface FontFamilySet {
  regular: string;
  medium: string;
  semibold: string;
  bold?: string;
}

interface FontFamiliesMap {
  heading: FontFamilySet;
  body: FontFamilySet;
  ui: FontFamilySet;
  display: FontFamilySet;
}

interface ResolveTextStyleOptions {
  variant: TextVariant;
  color?: TextColor;
  size?: keyof typeof typography.sizes;
  weight?: TextWeight;
  families?: FontFamiliesMap;
}

interface ResolvedTextStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  maxFontSizeMultiplier: number;
  fontStyle?: 'italic';
}

interface ColorTokens {
  text: string;
  textSecondary: string;
  textInverse: string;
  accent: string;
  success: string;
}

function resolveColor(color: TextColor, colors: ColorTokens): string {
  switch (color) {
    case 'primary':
      return colors.text;
    case 'secondary':
      return colors.textSecondary;
    case 'inverse':
      return colors.textInverse;
    case 'accent':
      return colors.accent;
    case 'success':
      return colors.success;
  }
}

function resolveFontFamily(
  variant: TextVariant,
  weight: TextWeight | undefined,
  families?: FontFamiliesMap
): string {
  const tokens = TEXT_VARIANTS[variant];
  const familiesSource = families ?? typography.families;
  const effectiveWeight = weight ?? tokens.defaultWeight;
  const family = familiesSource[tokens.family] as Record<string, string>;
  return family[effectiveWeight] ?? family['semibold'] ?? family['medium'] ?? family['regular'] ?? tokens.fontFamily;
}

export function resolveTextStyle(
  options: ResolveTextStyleOptions,
  colors: ColorTokens
): ResolvedTextStyle {
  const tokens = TEXT_VARIANTS[options.variant];
  const effectiveColor = options.color ?? tokens.defaultColor;
  const effectiveFontSize = options.size ? typography.sizes[options.size] : tokens.fontSize;
  const effectiveFontFamily = resolveFontFamily(options.variant, options.weight, options.families);
  const effectiveLineHeight = options.size
    ? effectiveFontSize *
      (tokens.family === 'heading' || tokens.family === 'display'
        ? typography.lineHeights.tight
        : typography.lineHeights.normal)
    : tokens.lineHeight;

  const result: ResolvedTextStyle = {
    fontFamily: effectiveFontFamily,
    fontSize: effectiveFontSize,
    lineHeight: effectiveLineHeight,
    color: resolveColor(effectiveColor, colors),
    maxFontSizeMultiplier: tokens.maxFontSizeMultiplier,
  };

  if (tokens.fontStyle) {
    result.fontStyle = tokens.fontStyle;
  }

  return result;
}

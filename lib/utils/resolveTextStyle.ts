import { TEXT_VARIANTS, TextVariant, TextColor, TextWeight } from '../constants/textVariants';
import { typography } from '../constants/themes';

interface ResolveTextStyleOptions {
  variant: TextVariant;
  color?: TextColor;
  size?: keyof typeof typography.sizes;
  weight?: TextWeight;
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

function resolveFontFamily(variant: TextVariant, weight: TextWeight | undefined): string {
  const tokens = TEXT_VARIANTS[variant];
  if (!weight) return tokens.fontFamily;
  return typography.families[tokens.family][weight];
}

export function resolveTextStyle(
  options: ResolveTextStyleOptions,
  colors: ColorTokens
): ResolvedTextStyle {
  const tokens = TEXT_VARIANTS[options.variant];
  const effectiveColor = options.color ?? tokens.defaultColor;
  const effectiveFontSize = options.size ? typography.sizes[options.size] : tokens.fontSize;
  const effectiveFontFamily = resolveFontFamily(options.variant, options.weight);
  const effectiveLineHeight = options.size
    ? effectiveFontSize *
      (tokens.family === 'heading' ? typography.lineHeights.tight : typography.lineHeights.normal)
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

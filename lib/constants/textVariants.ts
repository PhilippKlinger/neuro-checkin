import { typography } from './themes';

export type TextVariant = 'title' | 'display' | 'displaySerif' | 'body' | 'hint' | 'label';
export type TextColor = 'primary' | 'secondary' | 'inverse' | 'accent' | 'success';
export type TextFamily = keyof typeof typography.families;
export type TextWeight = keyof typeof typography.families.body;

export interface TextVariantTokens {
  family: TextFamily;
  fontFamily: string;
  defaultWeight: TextWeight;
  fontSize: number;
  lineHeight: number;
  fontStyle?: 'italic';
  maxFontSizeMultiplier: number;
  defaultColor: TextColor;
}

// maxFontSizeMultiplier values are calibrated conservatively here.
// Fine-tuned after Wave 1 device check (ARY-02 FS-01/FS-02) via /nd-ux pass.
export const TEXT_VARIANTS: Record<TextVariant, TextVariantTokens> = {
  title: {
    family: 'heading',
    fontFamily: typography.families.heading.semibold,
    defaultWeight: 'semibold',
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * typography.lineHeights.tight,
    maxFontSizeMultiplier: 1.3,
    defaultColor: 'primary',
  },
  display: {
    family: 'heading',
    fontFamily: typography.families.heading.bold,
    defaultWeight: 'bold',
    fontSize: typography.sizes.xl,
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
    maxFontSizeMultiplier: 1.2,
    defaultColor: 'primary',
  },
  displaySerif: {
    family: 'display',
    fontFamily: typography.families.display.medium,
    defaultWeight: 'medium',
    fontSize: typography.sizes.xl,
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
    maxFontSizeMultiplier: 1.2,
    defaultColor: 'primary',
  },
  body: {
    family: 'body',
    fontFamily: typography.families.body.regular,
    defaultWeight: 'regular',
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
    maxFontSizeMultiplier: 1.6,
    defaultColor: 'primary',
  },
  hint: {
    family: 'body',
    fontFamily: typography.families.body.regular,
    defaultWeight: 'regular',
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    // No italic: no italic font is bundled, so faux italic gets synthesized and
    // Android/Fabric clips the last word (prod v1.11.1 hint truncation). The hint
    // stays de-emphasized via smaller size + secondary color. Bundle a real
    // italic font before reintroducing fontStyle here. See fauxItalicGuard.test.ts.
    maxFontSizeMultiplier: 1.4,
    defaultColor: 'secondary',
  },
  label: {
    family: 'ui',
    fontFamily: typography.families.ui.medium,
    defaultWeight: 'medium',
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
    maxFontSizeMultiplier: 1.3,
    defaultColor: 'primary',
  },
};

import { resolveTextStyle } from '../lib/utils/resolveTextStyle';
import { TEXT_VARIANTS } from '../lib/constants/textVariants';
import { typography } from '../lib/constants/themes';

const MOCK_COLORS = {
  text: '#2D2A26',
  textSecondary: '#6B6358',
  textInverse: '#FFFFFF',
  accent: '#7A6344',
  success: '#6B8F71',
};

describe('resolveTextStyle — variant resolution', () => {
  it('resolves title variant tokens', () => {
    const result = resolveTextStyle({ variant: 'title' }, MOCK_COLORS);
    expect(result.fontFamily).toBe(TEXT_VARIANTS.title.fontFamily);
    expect(result.fontSize).toBe(TEXT_VARIANTS.title.fontSize);
    expect(result.lineHeight).toBe(TEXT_VARIANTS.title.lineHeight);
    expect(result.maxFontSizeMultiplier).toBe(TEXT_VARIANTS.title.maxFontSizeMultiplier);
  });

  it('resolves body variant tokens', () => {
    const result = resolveTextStyle({ variant: 'body' }, MOCK_COLORS);
    expect(result.fontFamily).toBe(TEXT_VARIANTS.body.fontFamily);
    expect(result.fontSize).toBe(TEXT_VARIANTS.body.fontSize);
    expect(result.maxFontSizeMultiplier).toBe(TEXT_VARIANTS.body.maxFontSizeMultiplier);
  });

  it('resolves hint variant with italic fontStyle', () => {
    const result = resolveTextStyle({ variant: 'hint' }, MOCK_COLORS);
    expect(result.fontStyle).toBe('italic');
    expect(result.fontFamily).toBe(TEXT_VARIANTS.hint.fontFamily);
  });

  it('resolves label variant tokens', () => {
    const result = resolveTextStyle({ variant: 'label' }, MOCK_COLORS);
    expect(result.fontFamily).toBe(typography.families.ui.medium);
  });

  it('resolves display variant tokens', () => {
    const result = resolveTextStyle({ variant: 'display' }, MOCK_COLORS);
    expect(result.fontFamily).toBe(typography.families.heading.bold);
    expect(result.maxFontSizeMultiplier).toBe(TEXT_VARIANTS.display.maxFontSizeMultiplier);
  });
});

describe('resolveTextStyle — color resolution', () => {
  it('uses text color for primary (default for title)', () => {
    const result = resolveTextStyle({ variant: 'title' }, MOCK_COLORS);
    expect(result.color).toBe(MOCK_COLORS.text);
  });

  it('uses textSecondary for secondary color', () => {
    const result = resolveTextStyle({ variant: 'body', color: 'secondary' }, MOCK_COLORS);
    expect(result.color).toBe(MOCK_COLORS.textSecondary);
  });

  it('uses textInverse for inverse color', () => {
    const result = resolveTextStyle({ variant: 'label', color: 'inverse' }, MOCK_COLORS);
    expect(result.color).toBe(MOCK_COLORS.textInverse);
  });

  it('uses accent color for accent', () => {
    const result = resolveTextStyle({ variant: 'body', color: 'accent' }, MOCK_COLORS);
    expect(result.color).toBe(MOCK_COLORS.accent);
  });

  it('uses success color for success', () => {
    const result = resolveTextStyle({ variant: 'body', color: 'success' }, MOCK_COLORS);
    expect(result.color).toBe(MOCK_COLORS.success);
  });

  it('applies hint variant default color (secondary)', () => {
    const result = resolveTextStyle({ variant: 'hint' }, MOCK_COLORS);
    expect(result.color).toBe(MOCK_COLORS.textSecondary);
  });
});

describe('resolveTextStyle — size override', () => {
  it('overrides fontSize when size prop is given', () => {
    const result = resolveTextStyle({ variant: 'body', size: 'sm' }, MOCK_COLORS);
    expect(result.fontSize).toBe(typography.sizes.sm);
  });

  it('keeps variant fontSize when no size override', () => {
    const result = resolveTextStyle({ variant: 'body' }, MOCK_COLORS);
    expect(result.fontSize).toBe(typography.sizes.md);
  });

  it('overrides to xl size', () => {
    const result = resolveTextStyle({ variant: 'title', size: 'xl' }, MOCK_COLORS);
    expect(result.fontSize).toBe(typography.sizes.xl);
  });
});

describe('resolveTextStyle — weight override', () => {
  it('overrides fontFamily when weight is given for body variant', () => {
    const result = resolveTextStyle({ variant: 'body', weight: 'semibold' }, MOCK_COLORS);
    expect(result.fontFamily).toBe(typography.families.body.semibold);
  });

  it('keeps variant fontFamily when no weight override', () => {
    const result = resolveTextStyle({ variant: 'body' }, MOCK_COLORS);
    expect(result.fontFamily).toBe(typography.families.body.regular);
  });
});

describe('resolveTextStyle — output shape', () => {
  it('returns a flat style object (no nested objects)', () => {
    const result = resolveTextStyle({ variant: 'body' }, MOCK_COLORS);
    expect(typeof result.fontFamily).toBe('string');
    expect(typeof result.fontSize).toBe('number');
    expect(typeof result.color).toBe('string');
    expect(typeof result.maxFontSizeMultiplier).toBe('number');
  });

  it('does not include fontStyle for non-italic variants', () => {
    const result = resolveTextStyle({ variant: 'body' }, MOCK_COLORS);
    expect(result.fontStyle).toBeUndefined();
  });
});

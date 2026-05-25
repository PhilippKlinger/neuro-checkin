import { Text, TextProps } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { resolveTextStyle } from '../../lib/utils/resolveTextStyle';
import type { TextVariant, TextColor, TextWeight } from '../../lib/constants/textVariants';
import type { typography } from '../../lib/constants/themes';

interface AppTextProps extends Omit<TextProps, 'maxFontSizeMultiplier'> {
  variant: TextVariant;
  color?: TextColor;
  size?: keyof typeof typography.sizes;
  weight?: TextWeight;
}

export function AppText({ variant, color, size, weight, style, ...rest }: AppTextProps) {
  const { theme } = useTheme();

  const resolved = resolveTextStyle(
    { variant, color, size, weight },
    {
      text: theme.colors.text,
      textSecondary: theme.colors.textSecondary,
      textInverse: theme.colors.textInverse,
      accent: theme.colors.accent,
      success: theme.colors.success,
    }
  );

  return (
    <Text
      maxFontSizeMultiplier={resolved.maxFontSizeMultiplier}
      style={[resolved, style]}
      {...rest}
    />
  );
}

import { TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';
import { resolveTextStyle } from '../../lib/utils/resolveTextStyle';
import type { TextVariant, TextColor } from '../../lib/constants/textVariants';
import type { typography } from '../../lib/constants/themes';

interface AppTextInputProps extends Omit<TextInputProps, 'maxFontSizeMultiplier'> {
  variant?: TextVariant;
  color?: TextColor;
  size?: keyof typeof typography.sizes;
}

export function AppTextInput({ variant = 'body', color, size, style, ...rest }: AppTextInputProps) {
  const { theme, typography } = useTheme();

  const resolved = resolveTextStyle(
    { variant, color, size, families: typography.families },
    {
      text: theme.colors.text,
      textSecondary: theme.colors.textSecondary,
      textInverse: theme.colors.textInverse,
      accent: theme.colors.accent,
      success: theme.colors.success,
    }
  );

  return (
    <TextInput
      maxFontSizeMultiplier={resolved.maxFontSizeMultiplier}
      style={[resolved, style]}
      {...rest}
    />
  );
}

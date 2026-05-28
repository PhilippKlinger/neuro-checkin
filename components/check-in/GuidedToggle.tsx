import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';

interface GuidedToggleProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

export function GuidedToggle({ enabled, onToggle }: GuidedToggleProps) {
  const { theme, touchTarget } = useTheme();

  return (
    <Pressable
      onPress={() => onToggle(!enabled)}
      style={({ pressed }) => [
        styles.button,
        { minWidth: touchTarget.min, minHeight: touchTarget.min },
        pressed && { opacity: 0.6 },
      ]}
      accessibilityRole="switch"
      accessibilityLabel="Hilfe ein- oder ausschalten"
      accessibilityState={{ checked: enabled }}
      hitSlop={8}
    >
      <Ionicons
        name={enabled ? 'bulb' : 'bulb-outline'}
        size={18}
        color={enabled ? theme.colors.accent : theme.colors.border}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

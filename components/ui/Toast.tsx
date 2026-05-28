import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, StyleSheet, AccessibilityInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/hooks/useTheme';
import { AppText } from './AppText';

interface ToastState {
  message: string;
  key: number;
}

let showToastGlobal: ((message: string) => void) | null = null;

export function showToast(message: string): void {
  showToastGlobal?.(message);
}

const DURATION = 2500;
const FADE_MS = 200;

export function ToastProvider() {
  const { theme, spacing, radii, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, key: Date.now() });
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start();
      AccessibilityInfo.announceForAccessibility(message);
      timerRef.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, DURATION);
    },
    [opacity]
  );

  useEffect(() => {
    showToastGlobal = show;
    return () => {
      showToastGlobal = null;
    };
  }, [show]);

  if (!toast) return null;

  return (
    <Animated.View
      key={toast.key}
      style={[
        styles.container,
        {
          bottom: insets.bottom + spacing.xl,
          backgroundColor: theme.colors.card,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...shadows.md,
          opacity,
        },
      ]}
      pointerEvents="none"
      accessibilityRole="alert"
    >
      <AppText variant="body" size="sm" style={{ textAlign: 'center' }}>
        {toast.message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    left: 32,
    right: 32,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 9999,
  },
});

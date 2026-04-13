import { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';
import { useReducedMotion } from '../../lib/hooks/useReducedMotion';

interface FadeViewProps extends ViewProps {
  /** Unique key that triggers re-animation when changed */
  triggerKey: string | number;
  duration?: number;
}

export function FadeView({
  triggerKey,
  duration = 250,
  style,
  children,
  ...props
}: FadeViewProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }

    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey, reducedMotion]); // opacity is a stable Animated.Value ref; duration is design-time constant

  return (
    <Animated.View style={[style, { opacity }]} {...props}>
      {children}
    </Animated.View>
  );
}

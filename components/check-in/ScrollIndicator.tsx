import { useRef, useState, useCallback } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

const THUMB_MIN_HEIGHT = 18;
const FADE_DURATION = 300;

interface ScrollIndicatorProps {
  visible: boolean;
  thumbRatio: number;
  scrollRatio: number;
}

export function ScrollIndicator({ visible, thumbRatio, scrollRatio }: ScrollIndicatorProps) {
  const { theme, spacing, radii } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const wasVisible = useRef(false);

  if (visible && !wasVisible.current) {
    wasVisible.current = true;
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start();
  } else if (!visible && wasVisible.current) {
    wasVisible.current = false;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start();
  }

  const thumbHeight = Math.max(thumbRatio * 100 * 0.75, THUMB_MIN_HEIGHT);
  const trackAvailable = 100 - thumbHeight;
  const thumbTop = scrollRatio * trackAvailable;

  return (
    <Animated.View
      style={[
        styles.track,
        {
          right: -(spacing.lg - 4),
          opacity,
          backgroundColor: theme.colors.border,
          borderRadius: radii.sm,
        },
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: theme.colors.textSecondary,
            borderRadius: radii.sm,
            height: `${thumbHeight}%`,
            top: `${thumbTop}%`,
          },
        ]}
      />
    </Animated.View>
  );
}

export function useScrollIndicator() {
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const isScrollable = contentHeight > containerHeight + 1;
  const thumbRatio = containerHeight > 0 ? containerHeight / contentHeight : 1;
  const maxOffset = contentHeight - containerHeight;
  const scrollRatio = maxOffset > 0 ? scrollOffset / maxOffset : 0;

  const onContentSizeChange = useCallback((_w: number, h: number) => {
    setContentHeight(h);
  }, []);

  const onLayout = useCallback((e: { nativeEvent: { layout: { height: number } } }) => {
    setContainerHeight(e.nativeEvent.layout.height);
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollOffset(e.nativeEvent.contentOffset.y);
  }, []);

  return {
    isScrollable,
    thumbRatio,
    scrollRatio,
    scrollViewProps: {
      onContentSizeChange,
      onLayout,
      onScroll,
      scrollEventThrottle: 16,
    },
  };
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
  },
  thumb: {
    position: 'absolute',
    width: '100%',
  },
});

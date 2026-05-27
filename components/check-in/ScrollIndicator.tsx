import { useRef, useState, useCallback } from 'react';
import { View, Animated, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTheme } from '../../lib/hooks/useTheme';

const TRACK_HEIGHT_RATIO = 0.5;
const THUMB_MIN_HEIGHT = 24;
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
    Animated.timing(opacity, { toValue: 1, duration: FADE_DURATION, useNativeDriver: true }).start();
  } else if (!visible && wasVisible.current) {
    wasVisible.current = false;
    Animated.timing(opacity, { toValue: 0, duration: FADE_DURATION, useNativeDriver: true }).start();
  }

  const thumbHeight = Math.max(thumbRatio * 100, THUMB_MIN_HEIGHT);
  const trackAvailable = 100 - thumbHeight;
  const thumbTop = scrollRatio * trackAvailable;

  return (
    <Animated.View
      style={[
        styles.column,
        { width: spacing.sm + 4, opacity },
      ]}
      pointerEvents="none"
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.colors.border,
            borderRadius: radii.sm,
          },
        ]}
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
      </View>
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
  column: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: 4,
    height: '50%',
  },
  thumb: {
    position: 'absolute',
    width: '100%',
  },
});

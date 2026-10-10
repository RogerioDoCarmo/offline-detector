import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  indicatorName,
  type IndicatorPosition,
} from '@rogeriodocarmo/offline-detector-react';
import { dismissAccessibilityProps, splitRootProps } from './a11y';
import type { PieceProps } from './piece-types';
import { StatusDot } from './glyphs';
import { usePieceTransition } from './hooks';
import { inlineInsets, resolveInsets } from './insets';
import { lightTheme } from './theme';
import { useSwipeDismiss } from './use-swipe-dismiss';

/** How long the label of a pressed dot stays visible. */
export const DOT_LABEL_MS = 2000;

export interface IndicatorProps extends PieceProps {
  /** `chip` (default) shows the label; `dot` is the 14 dp mark with a 44 dp hit area. */
  variant?: 'chip' | 'dot';
  /** Default `top-end`. `start` and `end` follow the layout direction. */
  position?: IndicatorPosition;
  /** Extra space on the top edge, for example the banner height or a host app bar. */
  offsetTop?: number;
  /** Extra space on the bottom edge, for example the snackbar height or a tab bar. */
  offsetBottom?: number;
}

const STATUS = { offline: 'offline', checking: 'checking', recovered: 'online' } as const;

/**
 * The glanceable status marker. Always labelled: the chip shows the label, the dot carries it as
 * its accessible name and shows it briefly when pressed. It never owns a live region.
 */
export function Indicator({
  phase,
  strings,
  actions,
  variant = 'chip',
  position = 'top-end',
  visible = true,
  rootProps,
  theme = lightTheme,
  reduceMotion = false,
  insets: insetsProp,
  offsetTop = 0,
  offsetBottom = 0,
  style,
  testID,
}: IndicatorProps) {
  const onDismiss = actions?.dismiss;
  const dismissible = typeof onDismiss === 'function';
  // The indicator never owns a live region; the provider's choice only matters for the root.
  const { root } = splitRootProps(rootProps, false);
  const transition = usePieceTransition({ visible, reduceMotion, theme });
  const swipe = useSwipeDismiss({
    enabled: dismissible,
    onDismiss: () => onDismiss?.(),
    reducedMotion: reduceMotion,
    theme,
    visible,
  });
  const [labelShown, setLabelShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!transition.mounted) return null;

  const status = STATUS[phase];
  const label = {
    offline: strings.indicatorLabelOffline,
    checking: strings.indicatorLabelChecking,
    online: strings.indicatorLabelOnline,
  }[status];
  const name = indicatorName(strings, label);
  const insets = resolveInsets(insetsProp);
  const inline = inlineInsets(insets);
  const [vertical, horizontal] = position.split('-') as [
    'top' | 'bottom',
    'start' | 'end',
  ];
  const edge =
    vertical === 'top'
      ? { top: theme.spaceLg + insets.top + offsetTop }
      : { bottom: theme.spaceLg + insets.bottom + offsetBottom };
  const side =
    horizontal === 'start'
      ? { start: theme.spaceLg + inline.start }
      : { end: theme.spaceLg + inline.end };
  const hit = (theme.sizeTouchTarget - theme.sizeIndicatorDot) / 2;

  const showLabelBriefly = () => {
    clearTimeout(timer.current);
    setLabelShown(true);
    timer.current = setTimeout(() => setLabelShown(false), DOT_LABEL_MS);
  };

  const dismissProps = dismissAccessibilityProps(strings, onDismiss);

  return (
    <Animated.View
      testID={testID}
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.container,
        edge,
        side,
        { zIndex: theme.zIndicator },
        transition.style,
        style,
      ]}
      {...root}
    >
      <Animated.View {...swipe.panHandlers} onLayout={swipe.onLayout} style={swipe.style}>
        {variant === 'dot' ? (
          <View style={styles.dotRow}>
            <Pressable
              testID={testID ? `${testID}-body` : undefined}
              accessibilityRole="image"
              accessibilityLabel={name}
              hitSlop={hit}
              onPress={showLabelBriefly}
              {...dismissProps}
            >
              <StatusDot status={status} theme={theme} reduceMotion={reduceMotion} />
            </Pressable>
            {labelShown ? (
              <Text
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
                maxFontSizeMultiplier={2}
                style={[
                  styles.tooltip,
                  theme.shadowChip,
                  {
                    marginStart: theme.spaceSm,
                    paddingVertical: theme.spaceXs,
                    paddingHorizontal: theme.spaceSm,
                    borderRadius: theme.radiusFull,
                    backgroundColor: theme.colorSurfaceRaised,
                    color: theme.colorText,
                    fontFamily: theme.fontFamily,
                    fontSize: theme.fontSizeLabel,
                    lineHeight: theme.lineHeightLabel,
                    fontWeight: theme.fontWeightSemibold,
                  },
                ]}
              >
                {label}
              </Text>
            ) : null}
          </View>
        ) : (
          <View
            accessible
            testID={testID ? `${testID}-body` : undefined}
            accessibilityRole="image"
            accessibilityLabel={name}
            {...dismissProps}
            style={[
              styles.chip,
              theme.shadowChip,
              {
                backgroundColor: theme.colorSurfaceRaised,
                borderColor: theme.colorBorder,
                borderWidth: 1,
                borderRadius: theme.radiusFull,
                minHeight: 28,
                paddingVertical: theme.spaceXs,
                paddingHorizontal: theme.spaceMd,
              },
            ]}
          >
            <StatusDot status={status} theme={theme} reduceMotion={reduceMotion} />
            <Text
              maxFontSizeMultiplier={2}
              style={{
                marginStart: theme.spaceSm,
                color: theme.colorText,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSizeLabel,
                lineHeight: theme.lineHeightLabel,
                fontWeight: theme.fontWeightSemibold,
                letterSpacing: theme.fontSizeLabel * 0.02,
              }}
            >
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute' },
  chip: { flexDirection: 'row', alignItems: 'center' },
  dotRow: { flexDirection: 'row', alignItems: 'center' },
  tooltip: { overflow: 'hidden' },
});

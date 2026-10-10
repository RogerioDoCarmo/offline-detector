import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { dismissAccessibilityProps, splitRootProps } from './a11y';
import type { PieceProps } from './piece-types';
import { Glyph, Spinner } from './glyphs';
import { useIosAnnouncement, usePieceTransition } from './hooks';
import { inlineInsets, resolveInsets } from './insets';
import { lightTheme } from './theme';
import { useSwipeDismiss } from './use-swipe-dismiss';

const HIDDEN = {
  accessible: false,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
} as const;

export interface BannerProps extends PieceProps {
  /** `top` (default) or `bottom` edge. */
  position?: 'top' | 'bottom';
  /** True floats over the content; the default sits in the layout and pushes content. */
  overlay?: boolean;
  /** Adds a Retry text button, for hosts that turn the snackbar off. Needs `actions.retry`. */
  showRetry?: boolean;
  /** Extra space on the anchored edge, for example a host app bar. Default 0. */
  offset?: number;
}

/** The persistent strip shown while offline. Square, flat, in the layout by default. */
export function Banner({
  phase,
  message,
  strings,
  actions,
  showRetry: showRetryProp = false,
  position = 'top',
  overlay = false,
  visible = true,
  rootProps,
  theme = lightTheme,
  reduceMotion = false,
  insets: insetsProp,
  offset = 0,
  announce = true,
  icons,
  style,
  testID,
}: BannerProps) {
  const onRetry = actions?.retry;
  const onDismiss = actions?.dismiss;
  const dismissible = typeof onDismiss === 'function';
  const { root, announces } = splitRootProps(rootProps, announce);
  // The height tween of the design needs the JS driver; opacity alone keeps everything native.
  const transition = usePieceTransition({ visible, reduceMotion, theme });
  const swipe = useSwipeDismiss({
    enabled: dismissible,
    onDismiss: () => onDismiss?.(),
    reducedMotion: reduceMotion,
    theme,
    visible,
  });
  useIosAnnouncement(message, announces && visible);

  if (!transition.mounted) return null;

  const insets = resolveInsets(insetsProp);
  const inline = inlineInsets(insets);
  const atTop = position === 'top';
  const edgeInset = (atTop ? insets.top : insets.bottom) + offset;
  const checking = phase === 'checking';
  const showRetry = showRetryProp && typeof onRetry === 'function';
  const retryLabel = checking ? strings.checking : strings.retry;

  return (
    <Animated.View
      testID={testID}
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        overlay ? styles.overlay : styles.flow,
        overlay ? (atTop ? { top: 0 } : { bottom: 0 }) : null,
        { zIndex: theme.zBanner },
        transition.style,
        style,
      ]}
      {...root}
    >
      <Animated.View
        {...swipe.panHandlers}
        onLayout={swipe.onLayout}
        style={[
          styles.strip,
          {
            backgroundColor: theme.colorStatusOfflineSubtle,
            borderColor: theme.colorBorderSubtle,
            borderTopWidth: atTop ? 0 : StyleSheet.hairlineWidth,
            borderBottomWidth: atTop ? StyleSheet.hairlineWidth : 0,
            minHeight: 40 + edgeInset,
            paddingTop: theme.spaceSm + (atTop ? edgeInset : 0),
            paddingBottom: theme.spaceSm + (atTop ? 0 : edgeInset),
            paddingStart: theme.spaceLg + inline.start,
            paddingEnd: theme.spaceLg + inline.end,
          },
          swipe.style,
        ]}
      >
        <View
          accessible
          testID={testID ? `${testID}-message` : undefined}
          {...(announces
            ? { accessibilityLiveRegion: 'polite' as const }
            : { accessibilityLabel: message })}
          {...dismissAccessibilityProps(strings, onDismiss)}
          style={styles.message}
        >
          <View style={{ marginEnd: theme.spaceSm }}>
            {phase === 'recovered'
              ? (icons?.online ?? (
                  <Glyph
                    name="online"
                    color={theme.colorStatusOnline}
                    size={theme.sizeIcon}
                  />
                ))
              : checking
                ? (icons?.checking ??
                  (reduceMotion ? (
                    <Text
                      {...HIDDEN}
                      style={{
                        color: theme.colorStatusOffline,
                        fontSize: theme.sizeIcon,
                      }}
                    >
                      {'…'}
                    </Text>
                  ) : (
                    <Spinner
                      color={theme.colorStatusOffline}
                      reduceMotion={reduceMotion}
                    />
                  )))
                : (icons?.offline ?? (
                    <Glyph
                      name="offline"
                      color={theme.colorStatusOffline}
                      size={theme.sizeIcon}
                    />
                  ))}
          </View>
          <Text
            maxFontSizeMultiplier={2}
            style={{
              flex: 1,
              color: theme.colorText,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSizeBody,
              lineHeight: theme.lineHeightBody,
              fontWeight: theme.fontWeightMedium,
            }}
          >
            {message}
          </Text>
        </View>
        {showRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            accessibilityState={{ busy: checking, disabled: checking }}
            onPress={checking ? undefined : () => void onRetry?.()}
            style={[
              styles.action,
              {
                minHeight: theme.sizeTouchTarget,
                minWidth: theme.sizeTouchTarget,
                marginStart: theme.spaceSm,
                paddingHorizontal: theme.spaceSm,
              },
            ]}
          >
            <Text
              maxFontSizeMultiplier={2}
              style={{
                color: theme.colorAction,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSizeLabel,
                lineHeight: theme.lineHeightLabel,
                fontWeight: theme.fontWeightSemibold,
              }}
            >
              {retryLabel}
            </Text>
          </Pressable>
        ) : null}
        {dismissible ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.dismiss}
            onPress={() => onDismiss?.()}
            style={[
              styles.action,
              {
                width: theme.sizeTouchTarget,
                height: theme.sizeTouchTarget,
                marginStart: theme.spaceSm,
              },
            ]}
          >
            <Glyph
              name="dismiss"
              color={theme.colorTextMuted}
              size={theme.fontSizeTitle}
            />
          </Pressable>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flow: { alignSelf: 'stretch' },
  overlay: { position: 'absolute', start: 0, end: 0 },
  strip: { flexDirection: 'row', alignItems: 'center' },
  message: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  action: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
});

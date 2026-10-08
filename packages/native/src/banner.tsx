import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { dismissAccessibilityProps, isDismissible } from './a11y';
import type { OfflineStrings, PiecePhase } from './contract-types';
import { Glyph, Spinner, type PieceIcons } from './glyphs';
import { useIosAnnouncement, usePieceTransition } from './hooks';
import { inlineInsets, resolveInsets, type Insets } from './insets';
import { lightTheme, type OfflineTheme } from './theme';
import { useSwipeDismiss } from './use-swipe-dismiss';

const HIDDEN = {
  accessible: false,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
} as const;

export interface BannerProps {
  /** `checking` swaps the icon for a spinner (nothing moves under reduced motion). */
  phase: Exclude<PiecePhase, 'recovered'>;
  /** Already localised and reason-aware. */
  message: string;
  strings: OfflineStrings;
  /** With `action`, shows a Retry text button (for hosts that turn the snackbar off). */
  onRetry?: () => void;
  action?: boolean;
  onDismiss?: () => void;
  dismissible?: boolean;
  /** `top` (default) or `bottom` edge. */
  position?: 'top' | 'bottom';
  /** True floats over the content; the default sits in the layout and pushes content. */
  overlay?: boolean;
  /** False plays the exit fade and then renders nothing. Default true. */
  visible?: boolean;
  theme?: OfflineTheme;
  reduceMotion?: boolean;
  insets?: Partial<Insets>;
  /** Extra space on the anchored edge, for example a host app bar. Default 0. */
  offset?: number;
  /** True when this piece owns the announcement; otherwise it is a labelled, silent view. */
  announce?: boolean;
  icons?: PieceIcons;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The persistent strip shown while offline. Square, flat, in the layout by default. */
export function Banner({
  phase,
  message,
  strings,
  onRetry,
  action = false,
  onDismiss,
  dismissible: dismissibleProp,
  position = 'top',
  overlay = false,
  visible = true,
  theme = lightTheme,
  reduceMotion = false,
  insets: insetsProp,
  offset = 0,
  announce = true,
  icons,
  style,
  testID,
}: BannerProps) {
  const dismissible = isDismissible(dismissibleProp, onDismiss);
  // The height tween of the design needs the JS driver; opacity alone keeps everything native.
  const transition = usePieceTransition({ visible, reduceMotion, theme });
  const swipe = useSwipeDismiss({
    enabled: dismissible,
    onDismiss: () => onDismiss?.(),
    reducedMotion: reduceMotion,
    theme,
  });
  useIosAnnouncement(message, announce && visible);

  if (!transition.mounted) return null;

  const insets = resolveInsets(insetsProp);
  const inline = inlineInsets(insets);
  const atTop = position === 'top';
  const edgeInset = (atTop ? insets.top : insets.bottom) + offset;
  const checking = phase === 'checking';
  const showRetry = action && typeof onRetry === 'function';
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
          {...(announce
            ? { accessibilityLiveRegion: 'polite' as const }
            : { accessibilityLabel: message })}
          {...dismissAccessibilityProps(strings, dismissible, onDismiss)}
          style={styles.message}
        >
          <View style={{ marginEnd: theme.spaceSm }}>
            {checking
              ? (icons?.checking ??
                (reduceMotion ? (
                  <Text
                    {...HIDDEN}
                    style={{ color: theme.colorStatusOffline, fontSize: theme.sizeIcon }}
                  >
                    {'…'}
                  </Text>
                ) : (
                  <Spinner color={theme.colorStatusOffline} reduceMotion={reduceMotion} />
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
            onPress={checking ? undefined : onRetry}
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
            onPress={onDismiss}
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

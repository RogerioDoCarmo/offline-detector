import type { ReactNode } from 'react';
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
import type { OfflineStrings } from '@rogeriodocarmo/offline-detector-react';
import type { PiecePhase } from './phase';
import { Glyph, Spinner, type PieceIcons } from './glyphs';
import { useIosAnnouncement, usePieceTransition } from './hooks';
import { inlineInsets, resolveInsets, type Insets } from './insets';
import { lightTheme, type OfflineTheme } from './theme';
import { useSwipeDismiss } from './use-swipe-dismiss';

export interface SnackbarProps {
  phase: PiecePhase;
  /** Already localised and reason-aware. */
  message: string;
  strings: OfflineStrings;
  /** Shows the Retry action (hidden on the recovery message). */
  onRetry?: () => void;
  /** Present and `dismissible` not false: swipe, dismiss button and `dismiss` action work. */
  onDismiss?: () => void;
  dismissible?: boolean;
  /** False plays the exit animation and then renders nothing. Default true. */
  visible?: boolean;
  theme?: OfflineTheme;
  reduceMotion?: boolean;
  insets?: Partial<Insets>;
  /** Extra space under the snackbar, for example a tab bar. Default 0. */
  offsetBottom?: number;
  /** True when this piece owns the announcement for the transition. Default true. */
  announce?: boolean;
  icons?: PieceIcons;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** The bottom-anchored message surface. Offline persists; recovery is timed by the provider. */
export function Snackbar({
  phase,
  message,
  strings,
  onRetry,
  onDismiss,
  dismissible: dismissibleProp,
  visible = true,
  theme = lightTheme,
  reduceMotion = false,
  insets: insetsProp,
  offsetBottom = 0,
  announce = true,
  icons,
  style,
  testID,
}: SnackbarProps) {
  const dismissible = isDismissible(dismissibleProp, onDismiss);
  const transition = usePieceTransition({
    visible,
    reduceMotion,
    theme,
    translateFrom: theme.spaceLg,
  });
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
  const checking = phase === 'checking';
  const showRetry = phase !== 'recovered' && typeof onRetry === 'function';
  const retryLabel = checking ? strings.checking : strings.retry;
  const icon: ReactNode =
    phase === 'recovered'
      ? (icons?.online ?? (
          <Glyph name="online" color={theme.colorTextInverse} size={theme.sizeIcon} />
        ))
      : (icons?.offline ?? (
          <Glyph name="offline" color={theme.colorTextInverse} size={theme.sizeIcon} />
        ));

  return (
    <Animated.View
      testID={testID}
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.container,
        {
          bottom: theme.spaceLg + insets.bottom + offsetBottom,
          paddingStart: theme.spaceLg + inline.start,
          paddingEnd: theme.spaceLg + inline.end,
          zIndex: theme.zSnackbar,
        },
        transition.style,
        style,
      ]}
    >
      <Animated.View
        {...swipe.panHandlers}
        onLayout={swipe.onLayout}
        style={[
          styles.surface,
          theme.shadowSnackbar,
          {
            backgroundColor: theme.colorSurfaceInverse,
            borderRadius: theme.radiusMd,
            minHeight: theme.sizeSnackbarMinHeight,
            maxWidth: theme.sizeSnackbarMaxWidth,
            paddingVertical: theme.spaceMd,
            paddingHorizontal: theme.spaceLg,
          },
          swipe.style,
        ]}
      >
        <View
          accessible
          testID={testID ? `${testID}-message` : undefined}
          accessibilityLiveRegion={announce ? 'polite' : 'none'}
          {...dismissAccessibilityProps(strings, dismissible, onDismiss)}
          style={styles.message}
        >
          <View style={{ marginEnd: theme.spaceMd }}>{icon}</View>
          <Text
            maxFontSizeMultiplier={2}
            style={{
              flex: 1,
              color: theme.colorTextInverse,
              fontFamily: theme.fontFamily,
              fontSize: theme.fontSizeBody,
              lineHeight: theme.lineHeightBody,
              fontWeight: theme.fontWeightRegular,
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
            style={({ pressed }) => [
              styles.action,
              {
                minHeight: theme.sizeTouchTarget,
                minWidth: theme.sizeTouchTarget,
                marginStart: theme.spaceSm,
                paddingHorizontal: theme.spaceSm,
                borderRadius: theme.radiusSm,
                backgroundColor: pressed ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              },
            ]}
          >
            <Spinner color={theme.colorActionInverse} reduceMotion={reduceMotion} />
            <Text
              maxFontSizeMultiplier={2}
              style={{
                marginStart: checking && !reduceMotion ? theme.spaceSm : 0,
                color: theme.colorActionInverse,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSizeLabel,
                lineHeight: theme.lineHeightLabel,
                fontWeight: theme.fontWeightSemibold,
                letterSpacing: theme.fontSizeLabel * 0.02,
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
              color={theme.colorTextMutedInverse}
              size={theme.fontSizeTitle}
            />
          </Pressable>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', start: 0, end: 0, alignItems: 'center' },
  surface: { width: '100%', flexDirection: 'row', alignItems: 'center' },
  message: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  action: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
});

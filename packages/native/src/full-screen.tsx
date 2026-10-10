import { useEffect, useRef, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  findNodeHandle,
} from 'react-native';
import type { PieceProps } from './piece-types';
import { Glyph, Spinner } from './glyphs';
import { usePieceTransition } from './hooks';
import { inlineInsets, resolveInsets } from './insets';
import { lightTheme } from './theme';

export interface FullScreenProps extends PieceProps {
  /** Called when the state leaves the screen, so the host can restore its previous focus. */
  onRestoreFocus?: () => void;
}

/**
 * Accessibility props for the host content that sits under the full-screen state, so it is
 * unreachable while the state is visible: `no-hide-descendants` on Android,
 * `accessibilityElementsHidden` on iOS. Spread them on the host's root view.
 */
export function hostContentAccessibilityProps(fullScreenVisible: boolean) {
  return fullScreenVisible
    ? ({
        importantForAccessibility: 'no-hide-descendants',
        accessibilityElementsHidden: true,
      } as const)
    : ({
        importantForAccessibility: 'auto',
        accessibilityElementsHidden: false,
      } as const);
}

/**
 * The opt-in page-level replacement. An opaque overlay, not a Modal, so the host's navigation
 * stays underneath. It moves screen reader focus to the title instead of using a live region.
 */
export function FullScreen({
  phase,
  message,
  strings,
  actions,
  onRestoreFocus,
  visible = true,
  rootProps,
  theme = lightTheme,
  reduceMotion = false,
  insets: insetsProp,
  icons,
  style,
  testID,
}: FullScreenProps) {
  const onRetry = actions?.retry;
  const onContinueOffline = actions?.continueOffline;
  const transition = usePieceTransition({
    visible,
    reduceMotion,
    theme,
    enterDuration: theme.durationSlow,
  });
  const titleRef = useRef<ComponentRef<typeof Text>>(null);
  const restoreFocus = useRef(onRestoreFocus);
  restoreFocus.current = onRestoreFocus;
  const continueOffline = useRef(onContinueOffline);
  continueOffline.current = onContinueOffline;
  const hasContinue = typeof onContinueOffline === 'function';

  // Focus the title once the entrance has had a frame to settle; give focus back on the way out.
  useEffect(() => {
    if (!visible) return undefined;
    const frame = requestAnimationFrame(() => {
      const handle = findNodeHandle(titleRef.current);
      if (typeof handle === 'number') AccessibilityInfo.setAccessibilityFocus(handle);
    });
    return () => {
      cancelAnimationFrame(frame);
      restoreFocus.current?.();
    };
  }, [visible]);

  // With "Continue offline" the Android back button acts as that action; otherwise it is the host's.
  useEffect(() => {
    if (!visible || !hasContinue) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      continueOffline.current?.();
      return true;
    });
    return () => subscription.remove();
  }, [visible, hasContinue]);

  if (!transition.mounted) return null;

  const insets = resolveInsets(insetsProp);
  const inline = inlineInsets(insets);
  const checking = phase === 'checking';
  const retryLabel = checking
    ? strings.checking
    : strings.fullScreenRetry || strings.retry;

  return (
    <Animated.View
      testID={testID}
      accessibilityViewIsModal
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.root,
        { backgroundColor: theme.colorSurface, zIndex: theme.zFullscreen },
        transition.style,
        style,
      ]}
      {...rootProps}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          testID={testID ? `${testID}-content` : undefined}
          style={[
            styles.content,
            {
              paddingTop: theme.spaceXl + insets.top,
              paddingBottom: theme.spaceXl + insets.bottom,
              paddingStart: theme.spaceXl + inline.start,
              paddingEnd: theme.spaceXl + inline.end,
            },
          ]}
        >
          <View
            style={[
              styles.column,
              { maxWidth: theme.sizeFullscreenMeasure, gap: theme.spaceXl },
            ]}
          >
            {icons?.offline ?? (
              <Glyph name="offline" color={theme.colorStatusOffline} size={48} />
            )}
            <View style={{ gap: theme.spaceSm }}>
              <Text
                ref={titleRef}
                accessibilityRole="header"
                style={{
                  textAlign: 'center',
                  color: theme.colorText,
                  fontFamily: theme.fontFamily,
                  fontSize: theme.fontSizeHeadline,
                  lineHeight: theme.lineHeightHeadline,
                  fontWeight: theme.fontWeightSemibold,
                }}
              >
                {message}
              </Text>
              <Text
                style={{
                  textAlign: 'center',
                  color: theme.colorTextMuted,
                  fontFamily: theme.fontFamily,
                  fontSize: theme.fontSizeTitle,
                  lineHeight: theme.lineHeightTitle,
                  fontWeight: theme.fontWeightRegular,
                }}
              >
                {strings.fullScreenBody}
              </Text>
            </View>
            <View style={{ alignSelf: 'stretch', gap: theme.spaceSm }}>
              {onRetry ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={retryLabel}
                  accessibilityState={{ busy: checking, disabled: checking }}
                  onPress={checking ? undefined : () => void onRetry()}
                  style={[
                    styles.button,
                    {
                      minHeight: theme.sizeTouchTarget,
                      borderRadius: theme.radiusMd,
                      backgroundColor: theme.colorAction,
                      paddingHorizontal: theme.spaceLg,
                    },
                  ]}
                >
                  <Spinner color={theme.colorOnAction} reduceMotion={reduceMotion} />
                  <Text
                    style={{
                      marginStart: checking && !reduceMotion ? theme.spaceSm : 0,
                      color: theme.colorOnAction,
                      fontFamily: theme.fontFamily,
                      fontSize: theme.fontSizeTitle,
                      lineHeight: theme.lineHeightTitle,
                      fontWeight: theme.fontWeightSemibold,
                    }}
                  >
                    {retryLabel}
                  </Text>
                </Pressable>
              ) : null}
              {hasContinue ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={strings.continueOffline}
                  onPress={() => onContinueOffline?.()}
                  style={[styles.button, { minHeight: theme.sizeTouchTarget }]}
                >
                  <Text
                    style={{
                      color: theme.colorAction,
                      fontFamily: theme.fontFamily,
                      fontSize: theme.fontSizeTitle,
                      lineHeight: theme.lineHeightTitle,
                      fontWeight: theme.fontWeightSemibold,
                    }}
                  >
                    {strings.continueOffline}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0 },
  scroll: { flexGrow: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  column: { width: '100%', alignItems: 'center' },
  button: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
});

import type { ReactNode } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { usePulse } from './hooks';
import type { OfflineTheme } from './theme';

/** Replacement icons a host can pass to a piece. */
export interface PieceIcons {
  offline?: ReactNode;
  online?: ReactNode;
  checking?: ReactNode;
}

const HIDDEN_FROM_ACCESSIBILITY = {
  accessible: false,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
} as const;

const GLYPHS = { offline: '⊘', online: '✓', dismiss: '✕' } as const;

/** A decorative icon drawn as text. The adjacent text carries the meaning, so it is hidden. */
export function Glyph({
  name,
  color,
  size,
}: {
  name: keyof typeof GLYPHS;
  color: string;
  size: number;
}) {
  return (
    <Text
      {...HIDDEN_FROM_ACCESSIBILITY}
      allowFontScaling={false}
      style={{ color, fontSize: size, lineHeight: size + 4, textAlign: 'center' }}
    >
      {GLYPHS[name]}
    </Text>
  );
}

/** The spinner shown while checking. Under reduced motion nothing rotates, so it renders nothing. */
export function Spinner({
  color,
  reduceMotion,
}: {
  color: string;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return null;
  return (
    <ActivityIndicator
      {...HIDDEN_FROM_ACCESSIBILITY}
      testID="od-spinner"
      size="small"
      color={color}
    />
  );
}

/**
 * The 14 dp status dot with its 1 dp surface ring. The glyph inside differs per state (slash,
 * ring, tick), so colour is never the only signal. The checking ring pulses, or stays still
 * under reduced motion.
 */
export function StatusDot({
  status,
  theme,
  reduceMotion,
}: {
  status: 'offline' | 'checking' | 'online';
  theme: OfflineTheme;
  reduceMotion: boolean;
}) {
  const pulse = usePulse(status === 'checking', reduceMotion, theme.durationPulse);
  const color = {
    offline: theme.colorStatusOffline,
    checking: theme.colorStatusChecking,
    online: theme.colorStatusOnline,
  }[status];
  const glyph = { offline: '/', checking: 'o', online: '✓' }[status];
  return (
    <Animated.View
      {...HIDDEN_FROM_ACCESSIBILITY}
      style={[
        styles.dot,
        {
          width: theme.sizeIndicatorDot,
          height: theme.sizeIndicatorDot,
          borderRadius: theme.radiusFull,
          backgroundColor: color,
          borderColor: theme.colorSurface,
          opacity: pulse,
        },
      ]}
    >
      <View style={styles.glyphBox}>
        <Text
          allowFontScaling={false}
          style={{
            color: theme.colorSurface,
            fontSize: 9,
            lineHeight: 11,
            fontWeight: '700',
          }}
        >
          {glyph}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dot: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  glyphBox: { alignItems: 'center', justifyContent: 'center' },
});

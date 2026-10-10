import type { AccessibilityActionEvent } from 'react-native';
import type { OfflineStrings } from '@rogeriodocarmo/offline-detector-react';

/**
 * The non-gesture path for the swipe (WCAG 2.5.1): a custom `dismiss` accessibility action
 * (TalkBack and VoiceOver actions menu) described by the `dismissHint` string. Spread it on an
 * `accessible` element only. A piece is dismissible exactly when `onDismiss` is given.
 */
export function dismissAccessibilityProps(
  strings: OfflineStrings,
  onDismiss: (() => void) | undefined,
) {
  if (!onDismiss) return {};
  return {
    accessibilityHint: strings.dismissHint,
    accessibilityActions: [{ name: 'dismiss', label: strings.dismiss }],
    onAccessibilityAction: (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'dismiss') onDismiss();
    },
  };
}

/**
 * Splits the provider's `rootProps`: the live region it asks for decides whether the piece owns
 * the announcement (it lives on the message view, not on the container), and the rest is spread
 * on the piece's root.
 */
export function splitRootProps(
  rootProps: Record<string, unknown> | undefined,
  announce: boolean,
): { root: Record<string, unknown>; announces: boolean } {
  const { accessibilityLiveRegion, ...root } = rootProps ?? {};
  return {
    root,
    announces:
      accessibilityLiveRegion === undefined
        ? announce
        : accessibilityLiveRegion !== 'none',
  };
}

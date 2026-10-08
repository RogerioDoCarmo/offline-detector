import type { AccessibilityActionEvent } from 'react-native';
import type { OfflineStrings } from './contract-types';

/** A piece is dismissible unless turned off, and only when there is something to call. */
export function isDismissible(
  dismissible: boolean | undefined,
  onDismiss: (() => void) | undefined,
): boolean {
  return (dismissible ?? true) && typeof onDismiss === 'function';
}

/**
 * The non-gesture path for the swipe (WCAG 2.5.1): a custom `dismiss` accessibility action
 * (TalkBack and VoiceOver actions menu) described by the `dismissHint` string. Spread it on an
 * `accessible` element only.
 */
export function dismissAccessibilityProps(
  strings: OfflineStrings,
  dismissible: boolean,
  onDismiss: (() => void) | undefined,
) {
  if (!dismissible) return {};
  return {
    accessibilityHint: strings.dismissHint,
    accessibilityActions: [{ name: 'dismiss', label: strings.dismiss }],
    onAccessibilityAction: (event: AccessibilityActionEvent) => {
      if (event.nativeEvent.actionName === 'dismiss') onDismiss?.();
    },
  };
}

/** Replaces the `{status}` token of `indicatorAccessibleName` with the matching label. */
export function fillStatus(template: string, status: string): string {
  return template.split('{status}').join(status);
}

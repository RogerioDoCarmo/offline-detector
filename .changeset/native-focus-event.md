---
'@rogeriodocarmo/offline-detector-native': patch
---

Move the full-screen title focus to `AccessibilityInfo.sendAccessibilityEvent`, because
`setAccessibilityFocus` is deprecated in React Native.

import { Animated } from 'react-native';

export type TimingCall = {
  value: Animated.Value;
  config: Animated.TimingAnimationConfig;
  from: number;
};

/**
 * Replaces `Animated.timing` with an instant version that records every call and jumps the value
 * to its target. Lets tests assert the literal durations and the native-driver flag without
 * driving real animation frames. `Animated.parallel` and `.start` keep their real behaviour.
 */
export function mockTiming(options: { defer?: boolean } = {}): {
  calls: TimingCall[];
  spy: jest.SpyInstance;
  flush: () => void;
} {
  const calls: TimingCall[] = [];
  const pending: (() => void)[] = [];
  const spy = jest.spyOn(Animated, 'timing').mockImplementation(((
    value: Animated.Value,
    config: Animated.TimingAnimationConfig,
  ) => {
    calls.push({ value, config, from: valueOf(value) });
    return {
      start(callback?: (result: { finished: boolean }) => void) {
        const finish = () => {
          value.setValue(config.toValue as number);
          callback?.({ finished: true });
        };
        if (options.defer) pending.push(finish);
        else finish();
      },
      stop() {},
      reset() {},
    };
  }) as unknown as typeof Animated.timing);
  return {
    calls,
    spy,
    /** With `defer`: finishes every started animation. */
    flush: () => pending.splice(0).forEach((finish) => finish()),
  };
}

/** The numeric value an Animated.Value currently holds. */
export function valueOf(value: Animated.Value): number {
  return (value as unknown as { __getValue(): number }).__getValue();
}

/** Flattens an Animated style (as rendered into props) into a plain object. */
export function flatStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (s: unknown): void => {
    if (Array.isArray(s)) s.forEach(walk);
    else if (s && typeof s === 'object') Object.assign(out, s);
  };
  walk(style);
  return out;
}

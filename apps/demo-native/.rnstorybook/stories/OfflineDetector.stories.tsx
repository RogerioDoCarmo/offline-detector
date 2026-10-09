import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-native';
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-native';
import { createFakeNetwork, STORY_PROBE } from '../fakes';
import type { FakeNetwork } from '../fakes';
import { sharedArgs, sharedArgTypes, Stage, STAGE_INSETS } from '../helpers';
import type { Locale, Scheme } from '../helpers';

/**
 * How the fake network starts. `recovering` starts offline and comes back by itself after a
 * moment; `checking` starts offline and holds the probe after a moment, so a press on Retry
 * stays on "Checking…". The buttons in the host drive the same network by hand.
 */
type Scenario =
  'online' | 'offline' | 'connected-no-internet' | 'recovering' | 'checking';

interface DetectorArgs {
  scenario: Scenario;
  locale: Locale;
  colorScheme: Scheme;
  reduceMotion: boolean;
  dismissible: boolean;
  distinguishReason: boolean;
  recoveryMs: number;
  fullScreen: boolean;
  continueOffline: boolean;
  note: string;
  onDismiss?: () => void;
}

function startOf(scenario: Scenario): Parameters<typeof createFakeNetwork>[0] {
  if (scenario === 'online') return { reachable: true };
  if (scenario === 'offline') return { reachable: false, interfaceUp: false };
  // The interface is up and the probe fails: the "Connected, but no internet" case.
  return { reachable: false, interfaceUp: true };
}

function useScenario(scenario: Scenario): FakeNetwork {
  const [network] = useState(() => createFakeNetwork(startOf(scenario)));
  useEffect(() => {
    if (scenario !== 'recovering' && scenario !== 'checking') return undefined;
    const timer = setTimeout(
      () => {
        if (scenario === 'recovering') network.setReachable(true);
        else network.fetch.hold();
      },
      scenario === 'recovering' ? 2500 : 1500,
    );
    return () => clearTimeout(timer);
  }, [network, scenario]);
  return network;
}

function Button(props: { label: string; onPress: () => void; color: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={[styles.button, { borderColor: props.color }]}
    >
      <Text style={{ color: props.color, fontWeight: '600' }}>{props.label}</Text>
    </Pressable>
  );
}

function Host(props: { network: FakeNetwork; scheme: Scheme; note: string }) {
  const color = props.scheme === 'dark' ? '#F2F3F5' : '#14171C';
  return (
    <View style={styles.host}>
      <Text style={[styles.title, { color }]}>Checkout</Text>
      <Text style={{ color }}>
        The host app. The probe is a fake, nothing here leaves the device. Use the
        buttons, or the controls below.
      </Text>
      {props.note === '' ? null : (
        <Text style={{ color, fontWeight: '600' }}>{props.note}</Text>
      )}
      <View style={styles.row}>
        <Button
          label="Simulate offline"
          color={color}
          onPress={() => props.network.setReachable(false)}
        />
        <Button
          label="Simulate online"
          color={color}
          onPress={() => props.network.setReachable(true)}
        />
        <Button
          label="Hold the probe"
          color={color}
          onPress={() => props.network.fetch.hold()}
        />
      </View>
    </View>
  );
}

function Scene(args: DetectorArgs) {
  const network = useScenario(args.scenario);
  return (
    <OfflineDetector
      adapter={network.adapter}
      fetch={network.fetch}
      probe={STORY_PROBE}
      locale={args.locale}
      motion={args.reduceMotion ? 'reduced' : 'auto'}
      colorScheme={args.colorScheme}
      dismissible={args.dismissible}
      distinguishReason={args.distinguishReason}
      recoveryMs={args.recoveryMs}
      fullScreen={args.fullScreen ? { continueOffline: args.continueOffline } : undefined}
      insets={STAGE_INSETS}
      onDismiss={args.onDismiss}
    >
      <Host network={network} scheme={args.colorScheme} note={args.note} />
    </OfflineDetector>
  );
}

const meta = {
  title: 'OfflineDetector/States',
  argTypes: {
    scenario: {
      control: 'select',
      options: ['online', 'offline', 'connected-no-internet', 'recovering', 'checking'],
    },
    locale: sharedArgTypes.locale,
    colorScheme: sharedArgTypes.colorScheme,
    reduceMotion: sharedArgTypes.reduceMotion,
    dismissible: sharedArgTypes.dismissible,
    distinguishReason: { control: 'boolean' },
    recoveryMs: { control: 'number' },
    fullScreen: { control: 'boolean' },
    continueOffline: { control: 'boolean' },
    note: { control: 'text' },
    onDismiss: sharedArgTypes.onDismiss,
  },
  args: {
    scenario: 'connected-no-internet',
    ...sharedArgs,
    distinguishReason: false,
    recoveryMs: 4000,
    fullScreen: false,
    continueOffline: false,
    note: '',
  },
  // A new scenario or setting that the detector reads once starts a fresh scene.
  render: (args) => (
    <Stage colorScheme={args.colorScheme} height={560}>
      <Scene
        key={`${args.scenario}-${args.distinguishReason}-${args.recoveryMs}-${args.fullScreen}`}
        {...args}
      />
    </Stage>
  ),
} satisfies Meta<DetectorArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reachable from the start: the app shows nothing. */
export const Online: Story = { args: { scenario: 'online' } };

/** The interface is down: snackbar, banner and indicator say "No internet". */
export const Offline: Story = { args: { scenario: 'offline' } };

/** The interface is up but the probe fails; with `distinguishReason` the copy says so. */
export const OfflineDistinguishingTheReason: Story = {
  args: { scenario: 'connected-no-internet', distinguishReason: true },
};

/** Goes online after a moment: "Back online" shows (here for ten minutes). */
export const Recovering: Story = {
  args: { scenario: 'recovering', recoveryMs: 600_000 },
};

/** Holds the probe after a moment, so a press on Retry stays on "Checking…". */
export const Checking: Story = {
  args: {
    scenario: 'checking',
    note: 'Press Retry: the probe is held, so it stays on Checking.',
  },
};

/** Opt-in full-screen state, with the escape hatch. */
export const FullScreen: Story = {
  args: { scenario: 'offline', fullScreen: true, continueOffline: true },
};

/** Swipe each piece away (or press Dismiss): the app is quiet until the next change. */
export const Dismissed: Story = {
  args: {
    scenario: 'offline',
    note: 'Swipe the snackbar, the banner and the indicator away. Each one reports to the Actions panel.',
  },
};

/** `dismissible` off: no Dismiss buttons and swiping does nothing. */
export const NotDismissible: Story = {
  args: { scenario: 'offline', dismissible: false },
};

export const Dark: Story = { args: { scenario: 'offline', colorScheme: 'dark' } };

export const Portuguese: Story = { args: { scenario: 'offline', locale: 'pt-BR' } };

export const SpanishReducedMotion: Story = {
  args: { scenario: 'offline', locale: 'es', reduceMotion: true },
};

const styles = StyleSheet.create({
  host: { flex: 1, padding: 16, paddingTop: 72, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
});

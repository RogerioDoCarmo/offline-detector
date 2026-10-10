import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useNetworkStatus,
  useRecheckOnReturn,
  type OfflineTheme,
  type PieceRenderProps,
} from '@rogeriodocarmo/offline-detector-native';
import { Button, Field, Section, Segmented, Toggle, colors } from './controls';
import {
  INTERVALS,
  RECOVERY_CHOICES,
  type CheckingFeedback,
  type ColorScheme,
  type FullScreenMode,
  type Locale,
  type Motion,
  type Settings,
} from './options';

/** A slot replaces the snackbar entirely and receives the render-props contract. */
export function CustomSnackbar({
  message,
  visible,
  actions,
  rootProps,
}: PieceRenderProps<OfflineTheme>) {
  if (!visible) return null;
  return (
    <Pressable
      {...rootProps}
      testID="custom-snackbar"
      onPress={actions.retry}
      style={styles.slot}
    >
      <Text style={styles.slotText}>Custom slot: {message} (tap to retry)</Text>
    </Pressable>
  );
}

export function StatusBox({
  onToggleSimulation,
  simulating,
}: {
  onToggleSimulation: () => void;
  simulating: boolean;
}) {
  const { status, reason, checkNow } = useNetworkStatus();
  return (
    <Section title="Status">
      <Text testID="status-text" style={styles.status}>
        {`status: ${status}${reason ? ` (${reason})` : ''}`}
      </Text>
      <View style={styles.buttons}>
        <Button
          id="simulate-offline"
          label={simulating ? 'Go back online' : 'Simulate offline'}
          primary
          onPress={onToggleSimulation}
        />
        <Button id="check-now" label="Check now" onPress={() => void checkNow()} />
      </View>
      <Text style={styles.note}>
        Simulate offline drives a stub probe, so it works without touching the network.
        Real airplane mode works too (NetInfo reports the interface dropping). The only
        network traffic this app can make is the reachability probe, and the stub is on by
        default.
      </Text>
    </Section>
  );
}

export function RecheckScreen({
  checkingFeedback,
}: {
  checkingFeedback: CheckingFeedback;
}) {
  const online = useRecheckOnReturn({ checkingFeedback });
  return (
    <Section title="useRecheckOnReturn screen">
      <Text testID="recheck-state" style={styles.status}>
        {`Known state: ${online ? 'online' : 'offline'}`}
      </Text>
      <Text style={styles.note}>
        {`While this screen is mounted, returning to the app triggers a background check. With checkingFeedback "${checkingFeedback}" the checking state ${
          checkingFeedback === 'brief' ? 'shows briefly' : 'stays hidden'
        }. Send the app to the background and bring it back to see it.`}
      </Text>
    </Section>
  );
}

export interface PanelProps {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function Panel({ settings, update }: PanelProps) {
  return (
    <>
      <Section title="Language">
        <Segmented<Locale>
          id="locale"
          label="locale"
          value={settings.locale}
          options={['en', 'pt-BR', 'es']}
          onChange={(value) => update('locale', value)}
        />
      </Section>
      <Section title="Behaviour">
        <Toggle
          id="distinguish-reason"
          label="distinguishReason"
          value={settings.distinguishReason}
          onChange={(value) => update('distinguishReason', value)}
        />
        <Toggle
          id="dismissible"
          label="dismissible"
          value={settings.dismissible}
          onChange={(value) => update('dismissible', value)}
        />
        <Segmented<FullScreenMode>
          id="full-screen"
          label="fullScreen"
          value={settings.fullScreen}
          options={['off', 'on', 'continue']}
          onChange={(value) => update('fullScreen', value)}
        />
        <Segmented<number>
          id="recovery-ms"
          label="recoveryMs"
          value={settings.recoveryMs}
          options={RECOVERY_CHOICES}
          onChange={(value) => update('recoveryMs', value)}
        />
      </Section>
      <Section title="Look">
        <Segmented<ColorScheme>
          id="color-scheme"
          label="colorScheme"
          value={settings.colorScheme}
          options={['auto', 'light', 'dark']}
          onChange={(value) => update('colorScheme', value)}
        />
        <Segmented<Motion>
          id="motion"
          label="motion"
          value={settings.motion}
          options={['auto', 'reduced', 'full']}
          onChange={(value) => update('motion', value)}
        />
        <Toggle
          id="use-slots"
          label="slots: custom snackbar"
          value={settings.useSlots}
          onChange={(value) => update('useSlots', value)}
        />
      </Section>
      <Section title="Probe (read once per mount, the detector remounts)">
        <Field
          id="probe-urls"
          label="probe.urls (comma or newline separated)"
          value={settings.probeUrls}
          onChange={(value) => update('probeUrls', value)}
        />
        <Segmented<number>
          id="interval-ms"
          label="probe.intervalMs"
          value={settings.intervalMs}
          options={INTERVALS}
          onChange={(value) => update('intervalMs', value)}
        />
        <Toggle
          id="use-stub-probe"
          label="stub probe (no network)"
          value={settings.useStubProbe}
          onChange={(value) => update('useStubProbe', value)}
        />
        <Toggle
          id="pass-netinfo"
          label="pass NetInfo from the host"
          value={settings.passNetInfo}
          onChange={(value) => update('passNetInfo', value)}
        />
      </Section>
      <Section title="Checking feedback">
        <Segmented<CheckingFeedback>
          id="checking-feedback"
          label="checkingFeedback"
          value={settings.checkingFeedback}
          options={['brief', 'none']}
          onChange={(value) => update('checkingFeedback', value)}
        />
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  status: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  note: { fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 18 },
  buttons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  slot: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#7c2d12',
  },
  slotText: { color: '#ffffff', fontSize: 15 },
});

import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  OfflineDetector,
  useNetworkStatus,
} from '@rogeriodocarmo/offline-detector-native';
import { Segmented, colors } from './src/controls';
import {
  buildProbeOptions,
  defaultSettings,
  detectorKey,
  type Settings,
} from './src/options';
import { CustomSnackbar, Panel, RecheckScreen, StatusBox } from './src/screens';
import { createStubProbe } from './src/stub-probe';

type Screen = 'panel' | 'recheck';

function Content(props: {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onToggleSimulation: () => void;
  simulating: boolean;
}) {
  const [screen, setScreen] = useState<Screen>('panel');
  return (
    <>
      <Segmented<Screen>
        id="screen"
        label="screen"
        value={screen}
        options={['panel', 'recheck']}
        onChange={setScreen}
      />
      <StatusBox
        simulating={props.simulating}
        onToggleSimulation={props.onToggleSimulation}
      />
      {screen === 'panel' ? (
        <Panel settings={props.settings} update={props.update} />
      ) : (
        <RecheckScreen checkingFeedback={props.settings.checkingFeedback} />
      )}
    </>
  );
}

/** Lives inside the detector so the simulate button can ask for an immediate re-check. */
function SimulationBridge(props: {
  stub: ReturnType<typeof createStubProbe>;
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}) {
  const { checkNow } = useNetworkStatus();
  const [simulating, setSimulating] = useState(props.stub.isOffline());
  const toggle = useCallback(() => {
    const next = !props.stub.isOffline();
    props.stub.setOffline(next);
    setSimulating(next);
    void checkNow();
  }, [props.stub, checkNow]);
  return (
    <Content
      settings={props.settings}
      update={props.update}
      onToggleSimulation={toggle}
      simulating={simulating}
    />
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const stub = useRef(createStubProbe()).current;

  const update = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) =>
      setSettings((current) => ({ ...current, [key]: value })),
    [],
  );

  const probe = useMemo(() => buildProbeOptions(settings), [settings]);
  const fullScreen =
    settings.fullScreen === 'off'
      ? false
      : settings.fullScreen === 'on'
        ? true
        : { continueOffline: true };

  return (
    <OfflineDetector
      key={detectorKey(settings)}
      netInfo={settings.passNetInfo ? NetInfo : undefined}
      insets={insets}
      probe={probe}
      fetch={settings.useStubProbe ? stub.fetch : undefined}
      locale={settings.locale}
      distinguishReason={settings.distinguishReason}
      dismissible={settings.dismissible}
      fullScreen={fullScreen}
      colorScheme={settings.colorScheme}
      motion={settings.motion}
      recoveryMs={settings.recoveryMs}
      slots={settings.useSlots ? { snackbar: CustomSnackbar } : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 96 },
        ]}
      >
        <Text accessibilityRole="header" style={styles.title}>
          offline-detector demo
        </Text>
        <View>
          <SimulationBridge stub={stub} settings={settings} update={update} />
        </View>
      </ScrollView>
    </OfflineDetector>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12 },
});

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const colors = {
  text: '#14213d',
  muted: '#4a5568',
  border: '#c5cdd8',
  accent: '#1d4ed8',
  onAccent: '#ffffff',
  surface: '#f4f6fa',
};

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function Segmented<T extends string | number>(props: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.segments}>
        {props.options.map((option) => {
          const selected = option === props.value;
          return (
            <Pressable
              key={String(option)}
              testID={`${props.id}-${String(option)}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => props.onChange(option)}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {String(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Toggle(props: {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      testID={props.id}
      accessibilityRole="switch"
      accessibilityState={{ checked: props.value }}
      accessibilityLabel={props.label}
      onPress={() => props.onChange(!props.value)}
      style={styles.row}
    >
      <Text style={styles.label}>{props.label}</Text>
      <Text style={[styles.pill, props.value && styles.pillOn]}>
        {props.value ? 'ON' : 'OFF'}
      </Text>
    </Pressable>
  );
}

export function Field(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        testID={props.id}
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChange}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        style={styles.input}
      />
    </View>
  );
}

export function Button(props: {
  id: string;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      testID={props.id}
      accessibilityRole="button"
      onPress={props.onPress}
      style={[styles.button, props.primary && styles.buttonPrimary]}
    >
      <Text style={[styles.buttonText, props.primary && styles.buttonTextPrimary]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    minHeight: 44,
    gap: 8,
  },
  label: { fontSize: 15, color: colors.text },
  segments: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  segment: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  segmentText: { fontSize: 14, color: colors.text },
  segmentTextSelected: { color: colors.onAccent, fontWeight: '700' },
  pill: {
    minWidth: 52,
    textAlign: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    color: colors.muted,
    fontWeight: '700',
  },
  pillOn: { backgroundColor: colors.accent, color: colors.onAccent },
  field: { marginVertical: 6 },
  input: {
    marginTop: 4,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    color: colors.text,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.accent },
  buttonTextPrimary: { color: colors.onAccent },
});

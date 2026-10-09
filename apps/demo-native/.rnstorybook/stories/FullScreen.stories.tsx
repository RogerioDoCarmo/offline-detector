import type { Meta, StoryObj } from '@storybook/react-native';
import { FullScreen } from '@rogeriodocarmo/offline-detector-native';
import { resolveStrings } from '@rogeriodocarmo/offline-detector-react';
import { sharedArgs, sharedArgTypes, Stage, STAGE_INSETS, themeFor } from '../helpers';
import type { PieceArgs } from '../helpers';

const noop = () => undefined;

/** Full-screen has no recovered phase and no dismiss: "Continue offline" is its way out. */
type FullScreenArgs = Pick<
  PieceArgs,
  'locale' | 'colorScheme' | 'reduceMotion' | 'onRetry'
> & {
  phase: 'offline' | 'checking';
  continueOffline: boolean;
  onContinueOffline?: () => void;
};

const meta = {
  title: 'Pieces/FullScreen',
  argTypes: {
    phase: { control: 'radio', options: ['offline', 'checking'] },
    continueOffline: { control: 'boolean' },
    locale: sharedArgTypes.locale,
    colorScheme: sharedArgTypes.colorScheme,
    reduceMotion: sharedArgTypes.reduceMotion,
    onRetry: sharedArgTypes.onRetry,
    onContinueOffline: { action: 'continue offline' },
  },
  args: {
    phase: 'offline',
    continueOffline: true,
    locale: sharedArgs.locale,
    colorScheme: sharedArgs.colorScheme,
    reduceMotion: sharedArgs.reduceMotion,
  },
  render: (args) => {
    const strings = resolveStrings(args.locale);
    return (
      <Stage colorScheme={args.colorScheme} height={520}>
        <FullScreen
          phase={args.phase}
          title={strings.fullScreenTitle}
          strings={strings}
          theme={themeFor(args.colorScheme)}
          reduceMotion={args.reduceMotion}
          insets={STAGE_INSETS}
          onRetry={args.onRetry ?? noop}
          onContinueOffline={args.continueOffline ? args.onContinueOffline : undefined}
        />
      </Stage>
    );
  },
} satisfies Meta<FullScreenArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {};

export const Checking: Story = { args: { phase: 'checking' } };

export const WithoutContinueOffline: Story = { args: { continueOffline: false } };

export const Dark: Story = { args: { colorScheme: 'dark' } };

export const Portuguese: Story = { args: { locale: 'pt-BR' } };

export const SpanishReducedMotion: Story = {
  args: { locale: 'es', reduceMotion: true },
};

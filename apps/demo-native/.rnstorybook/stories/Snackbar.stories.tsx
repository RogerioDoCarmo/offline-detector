import type { Meta, StoryObj } from '@storybook/react-native';
import { Snackbar } from '@rogeriodocarmo/offline-detector-native';
import { phaseArgType, pieceProps, sharedArgs, sharedArgTypes, Stage } from '../helpers';
import type { PieceArgs } from '../helpers';

const meta = {
  title: 'Pieces/Snackbar',
  argTypes: { ...phaseArgType, ...sharedArgTypes },
  args: { phase: 'offline', ...sharedArgs },
  render: (args) => (
    <Stage colorScheme={args.colorScheme}>
      <Snackbar {...pieceProps(args)} />
    </Stage>
  ),
} satisfies Meta<PieceArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {};

/** A pressed Retry shows the spinner and "Checking…" at once. */
export const Checking: Story = { args: { phase: 'checking' } };

export const Recovered: Story = { args: { phase: 'recovered' } };

/** No swipe, no dismiss: `dismissible` off. */
export const NotDismissible: Story = { args: { dismissible: false } };

export const Dark: Story = { args: { colorScheme: 'dark' } };

export const Portuguese: Story = { args: { locale: 'pt-BR' } };

export const SpanishReducedMotion: Story = {
  args: { locale: 'es', reduceMotion: true },
};

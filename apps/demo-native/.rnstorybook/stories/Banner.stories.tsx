import type { Meta, StoryObj } from '@storybook/react-native';
import { Banner } from '@rogeriodocarmo/offline-detector-native';
import { pieceProps, sharedArgs, sharedArgTypes, Stage } from '../helpers';
import type { PieceArgs } from '../helpers';

/** The banner has no "recovered" phase: it leaves the screen when the network returns. */
type BannerArgs = Omit<PieceArgs, 'phase'> & {
  phase: 'offline' | 'checking';
  position: 'top' | 'bottom';
};

const meta = {
  title: 'Pieces/Banner',
  argTypes: {
    phase: { control: 'radio', options: ['offline', 'checking'] },
    position: { control: 'radio', options: ['top', 'bottom'] },
    ...sharedArgTypes,
  },
  args: { phase: 'offline', position: 'top', ...sharedArgs },
  render: ({ position, phase, ...args }) => {
    const props = pieceProps({ ...args, phase });
    return (
      <Stage colorScheme={args.colorScheme}>
        <Banner {...props} phase={phase} position={position} overlay action />
      </Stage>
    );
  },
} satisfies Meta<BannerArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {};

export const Checking: Story = { args: { phase: 'checking' } };

export const AtTheBottom: Story = { args: { position: 'bottom' } };

export const NotDismissible: Story = { args: { dismissible: false } };

export const Dark: Story = { args: { colorScheme: 'dark' } };

export const Portuguese: Story = { args: { locale: 'pt-BR' } };

export const SpanishReducedMotion: Story = {
  args: { locale: 'es', reduceMotion: true },
};

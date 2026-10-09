import type { Meta, StoryObj } from '@storybook/react-native';
import { Indicator } from '@rogeriodocarmo/offline-detector-native';
import { phaseArgType, pieceProps, sharedArgs, sharedArgTypes, Stage } from '../helpers';
import type { PieceArgs } from '../helpers';

type IndicatorArgs = PieceArgs & { variant: 'chip' | 'dot' };

const meta = {
  title: 'Pieces/Indicator',
  argTypes: {
    ...phaseArgType,
    variant: { control: 'radio', options: ['chip', 'dot'] },
    ...sharedArgTypes,
  },
  args: { phase: 'offline', variant: 'chip', ...sharedArgs },
  render: ({ variant, ...args }) => {
    const { phase, message, strings, theme, reduceMotion, insets, actions } =
      pieceProps(args);
    return (
      <Stage colorScheme={args.colorScheme}>
        <Indicator
          phase={phase}
          message={message}
          strings={strings}
          theme={theme}
          reduceMotion={reduceMotion}
          insets={insets}
          actions={{ dismiss: actions.dismiss }}
          variant={variant}
        />
      </Stage>
    );
  },
} satisfies Meta<IndicatorArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {};

export const Checking: Story = { args: { phase: 'checking' } };

export const Recovered: Story = { args: { phase: 'recovered' } };

export const Dot: Story = { args: { variant: 'dot' } };

export const NotDismissible: Story = { args: { dismissible: false } };

export const Dark: Story = { args: { colorScheme: 'dark' } };

export const Portuguese: Story = { args: { locale: 'pt-BR' } };

export const SpanishReducedMotion: Story = {
  args: { locale: 'es', reduceMotion: true },
};

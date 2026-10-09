import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Indicator } from '@rogeriodocarmo/offline-detector-web';
import { swipe } from './gestures';
import { phaseControl, pieceProps } from './helpers';
import type { PieceArgs } from './helpers';

type IndicatorArgs = PieceArgs & {
  variant: 'chip' | 'dot';
  position: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
};

const meta = {
  title: 'Pieces/Indicator',
  argTypes: {
    phase: phaseControl,
    variant: { control: 'inline-radio', options: ['chip', 'dot'] },
    position: {
      control: 'select',
      options: ['top-start', 'top-end', 'bottom-start', 'bottom-end'],
    },
  },
  args: {
    phase: 'offline',
    variant: 'chip',
    position: 'top-end',
    dismissible: true,
    onRetry: fn(),
    onDismiss: fn(),
  },
  render: (args, { globals }) => (
    <Indicator
      {...pieceProps(args, globals)}
      variant={args.variant}
      position={args.position}
    />
  ),
} satisfies Meta<IndicatorArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getByRole('img', {
          name: 'Connection status: No internet',
        }),
      ).toBeVisible(),
    );
  },
};

export const Checking: Story = {
  args: { phase: 'checking' },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getByRole('img', {
          name: 'Connection status: Checking connection',
        }),
      ).toBeVisible(),
    );
  },
};

export const Recovered: Story = {
  args: { phase: 'recovered' },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getByRole('img', { name: 'Connection status: Online' }),
      ).toBeVisible(),
    );
  },
};

/** The dot variant is what the detector uses while the banner is showing. */
export const Dot: Story = { args: { variant: 'dot' } };

export const NotDismissible: Story = {
  args: { dismissible: false },
  play: async ({ canvasElement }) => {
    const mark = within(canvasElement).getByRole('img');
    await expect(mark).not.toHaveAttribute('tabindex');
  },
};

export const DismissBySwipe: Story = {
  play: async ({ canvasElement, args }) => {
    await swipe(within(canvasElement).getByRole('img'), 0.8);
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1));
  },
};

/** The indicator is not a live region, so Delete as well as Escape dismisses it. */
export const DismissWithDelete: Story = {
  play: async ({ canvasElement, args }) => {
    within(canvasElement).getByRole('img').focus();
    await userEvent.keyboard('{Delete}');
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1));
  },
};

/** The toolbar globals, pinned per story so the visual snapshots cover them. */
export const Dark: Story = { globals: { scheme: 'dark' } };

export const PortugueseRtl: Story = { globals: { locale: 'pt-BR', direction: 'rtl' } };

export const SpanishReducedMotion: Story = {
  globals: { locale: 'es', motion: 'reduced' },
};

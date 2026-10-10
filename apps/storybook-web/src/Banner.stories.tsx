import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Banner } from '@rogeriodocarmo/offline-detector-web';
import { pause, swipe } from './gestures';
import { phaseControl, pieceProps } from './helpers';
import type { PieceArgs } from './helpers';

type BannerArgs = PieceArgs & { overlay: boolean; showRetry: boolean };

const meta = {
  title: 'Pieces/Banner',
  argTypes: { phase: phaseControl },
  args: {
    phase: 'offline',
    dismissible: true,
    overlay: false,
    showRetry: true,
    onRetry: fn(),
    onDismiss: fn(),
  },
  render: (args, { globals }) => (
    <>
      <Banner
        {...pieceProps(args, globals)}
        overlay={args.overlay}
        showRetry={args.showRetry}
      />
      <p>
        The page content sits below the banner and is pushed down unless it is an overlay.
      </p>
    </>
  ),
} satisfies Meta<BannerArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('status')).toHaveTextContent('No internet'),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const Checking: Story = {
  args: { phase: 'checking' },
  play: async ({ canvasElement }) => {
    const button = await within(canvasElement).findByRole('button', {
      name: 'Checking…',
    });
    await expect(button).toHaveAttribute('aria-busy', 'true');
  },
};

export const Recovered: Story = {
  args: { phase: 'recovered' },
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByRole('status')).toHaveTextContent('Back online'),
    );
  },
};

export const Overlay: Story = { args: { overlay: true } };

export const NotDismissible: Story = {
  args: { dismissible: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    await swipe(canvas.getByRole('status'), -0.8);
    await pause(400);
    await expect(args.onDismiss).not.toHaveBeenCalled();
  },
};

export const DismissBySwipe: Story = {
  play: async ({ canvasElement, args }) => {
    await swipe(within(canvasElement).getByRole('status'), -0.8);
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1));
  },
};

export const DismissWithEscape: Story = {
  play: async ({ canvasElement, args }) => {
    within(canvasElement).getByRole('button', { name: 'Dismiss' }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1));
  },
};

/** The toolbar globals, pinned per story so the visual snapshots cover them. */
export const Dark: Story = { globals: { scheme: 'dark' } };

export const PortugueseRtl: Story = { globals: { locale: 'pt-BR', direction: 'rtl' } };

export const SpanishReducedMotion: Story = {
  globals: { locale: 'es', motion: 'reduced' },
};

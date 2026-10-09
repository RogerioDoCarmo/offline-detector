import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Snackbar } from '@rogeriodocarmo/offline-detector-web';
import { swipe, pause } from './gestures';
import { phaseControl, pieceProps } from './helpers';
import type { PieceArgs } from './helpers';

const meta = {
  title: 'Pieces/Snackbar',
  argTypes: { phase: phaseControl },
  args: { phase: 'offline', dismissible: true, onRetry: fn(), onDismiss: fn() },
  render: (args, { globals }) => <Snackbar {...pieceProps(args, globals)} />,
} satisfies Meta<PieceArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('No internet');
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

/** A pressed Retry shows the spinner and "Checking…" at once, disabled and busy. */
export const Checking: Story = {
  args: { phase: 'checking' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole('button', { name: 'Checking…' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
  },
};

export const Recovered: Story = {
  args: { phase: 'recovered' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('Back online');
    await expect(canvas.queryByRole('button', { name: 'Retry' })).toBeNull();
  },
};

export const NotDismissible: Story = {
  args: { dismissible: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    await swipe(canvas.getByRole('status'), 0.8);
    await pause(400);
    await expect(args.onDismiss).not.toHaveBeenCalled();
  },
};

export const DismissBySwipe: Story = {
  play: async ({ canvasElement, args }) => {
    await swipe(within(canvasElement).getByRole('status'), 0.8);
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1));
  },
};

/** A short drag stays under 30% of the width and slow enough: it springs back. */
export const ShortSwipeSpringsBack: Story = {
  play: async ({ canvasElement, args }) => {
    await swipe(within(canvasElement).getByRole('status'), 0.1, 400);
    await pause(400);
    await expect(args.onDismiss).not.toHaveBeenCalled();
  },
};

export const DismissWithEscape: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Dismiss' }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1));
  },
};

export const DismissButton: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1));
  },
};

/** The toolbar globals, pinned per story so the visual snapshots cover them. */
export const Dark: Story = { globals: { scheme: 'dark' } };

export const PortugueseRtl: Story = { globals: { locale: 'pt-BR', direction: 'rtl' } };

export const SpanishReducedMotion: Story = {
  globals: { locale: 'es', motion: 'reduced' },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { FullScreen } from '@rogeriodocarmo/offline-detector-web';
import { phaseControl, pieceProps } from './helpers';
import type { PieceArgs } from './helpers';

type FullScreenArgs = Pick<PieceArgs, 'phase' | 'onRetry'> & {
  continueOffline: boolean;
  onContinue: () => void;
};

const meta = {
  title: 'Pieces/FullScreen',
  argTypes: { phase: { ...phaseControl, options: ['offline', 'checking'] } },
  args: { phase: 'offline', continueOffline: false, onRetry: fn(), onContinue: fn() },
  render: (args, { globals }) => {
    const base = pieceProps(
      { phase: args.phase, dismissible: false, onRetry: args.onRetry, onDismiss: fn() },
      globals,
    );
    return (
      <FullScreen
        {...base}
        actions={{
          retry: args.onRetry,
          continueOffline: args.continueOffline ? args.onContinue : undefined,
        }}
      />
    );
  },
} satisfies Meta<FullScreenArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Offline: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole('heading', { name: 'No internet' });
    await waitFor(() => expect(title).toHaveFocus());
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
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

/** With `continueOffline` there is an escape hatch, by button or by Escape. */
export const ContinueOffline: Story = {
  args: { continueOffline: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Continue offline' }));
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
  },
};

export const ContinueWithEscape: Story = {
  args: { continueOffline: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'No internet' })).toHaveFocus(),
    );
    await userEvent.keyboard('{Escape}');
    await expect(args.onContinue).toHaveBeenCalledTimes(1);
  },
};

export const WithoutEscapeHatch: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole('button', { name: 'Continue offline' }),
    ).toBeNull();
  },
};

/** The toolbar globals, pinned per story so the visual snapshots cover them. */
export const Dark: Story = { globals: { scheme: 'dark' } };

export const PortugueseRtl: Story = { globals: { locale: 'pt-BR', direction: 'rtl' } };

export const SpanishReducedMotion: Story = {
  globals: { locale: 'es', motion: 'reduced' },
};

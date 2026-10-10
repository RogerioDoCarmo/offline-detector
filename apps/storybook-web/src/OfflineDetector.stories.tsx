import type { Meta, StoryContext, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { OfflineDetector } from '@rogeriodocarmo/offline-detector-web';
import { createFakeNetwork, STORY_PROBE } from '../.storybook/fakes';
import type { FakeNetwork } from '../.storybook/fakes';
import { environment } from './helpers';

interface DetectorArgs {
  dismissible: boolean;
  distinguishReason: boolean;
  recoveryMs: number;
  fullScreen: boolean;
  continueOffline: boolean;
  onDismiss: (piece: string) => void;
}

/** The fake network is made once per story run by a loader, so a play function can drive it. */
const networkOf = (context: { loaded: Record<string, unknown> }): FakeNetwork =>
  context.loaded.network as FakeNetwork;

const startingAt = (initial: Parameters<typeof createFakeNetwork>[0]) => ({
  loaders: [() => ({ network: createFakeNetwork(initial) })],
});

function Host({ network }: { network: FakeNetwork }) {
  return (
    <main>
      <h2>Checkout</h2>
      <p>
        The host app. The probe is a fake: nothing here leaves the page. Real offline in
        DevTools does nothing in this story, use the buttons.
      </p>
      <p>
        <button type="button" onClick={() => network.setReachable(false)}>
          Simulate offline
        </button>{' '}
        <button type="button" onClick={() => network.setReachable(true)}>
          Simulate online
        </button>{' '}
        <button type="button" onClick={() => network.fetch.hold()}>
          Hold the probe
        </button>
      </p>
    </main>
  );
}

function render(args: DetectorArgs, context: StoryContext<DetectorArgs>) {
  const { locale, motion } = environment(context.globals);
  const scheme = context.globals.scheme === 'dark' ? 'dark' : 'light';
  const network = networkOf(context);
  return (
    <OfflineDetector
      adapter={network.adapter}
      fetch={network.fetch}
      probe={STORY_PROBE}
      locale={locale}
      motion={motion}
      colorScheme={scheme}
      dismissible={args.dismissible}
      distinguishReason={args.distinguishReason}
      recoveryMs={args.recoveryMs}
      fullScreen={args.fullScreen ? { continueOffline: args.continueOffline } : undefined}
      onDismiss={args.onDismiss}
    >
      <Host network={network} />
    </OfflineDetector>
  );
}

const meta = {
  title: 'OfflineDetector/States',
  args: {
    dismissible: true,
    distinguishReason: false,
    recoveryMs: 4000,
    fullScreen: false,
    continueOffline: false,
    onDismiss: fn(),
  },
  render,
} satisfies Meta<DetectorArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Reachable from the start: the app shows nothing. */
export const Online: Story = {
  ...startingAt({ reachable: true }),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(loaded.network.fetch.calls.length).toBeGreaterThan(0));
    await expect(canvas.queryByRole('status')).toBeNull();
    await expect(canvas.queryByRole('img')).toBeNull();
  },
};

/** The interface is up but the probe fails, so the copy can say so with distinguishReason. */
export const Offline: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () =>
      expect(await canvas.findByRole('status')).toHaveTextContent('No internet'),
    );
    await waitFor(() =>
      expect(canvas.getByRole('region', { name: 'No internet' })).toBeVisible(),
    );
    await waitFor(() =>
      expect(
        canvas.getByRole('img', { name: 'Connection status: No internet' }),
      ).toBeVisible(),
    );
  },
};

export const OfflineDistinguishingTheReason: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  args: { distinguishReason: true },
  play: async ({ canvasElement }) => {
    await waitFor(async () =>
      expect(await within(canvasElement).findByRole('status')).toHaveTextContent(
        'Connected, but no internet',
      ),
    );
  },
};

/** Comes back online: "Back online" shows (here for ten minutes, so a snapshot can see it). */
export const Recovering: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  args: { recoveryMs: 600_000 },
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('region', { name: 'No internet' });
    loaded.network.setReachable(true);
    await waitFor(async () =>
      expect(await canvas.findByText('Back online')).toBeVisible(),
    );
    await waitFor(() => expect(canvas.queryByRole('region')).toBeNull());
    await expect(canvas.queryByRole('button', { name: 'Retry' })).toBeNull();
  },
};

/** Retry with the probe held shows "Checking…" at once and keeps it until the probe answers. */
export const Checking: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('region', { name: 'No internet' });
    loaded.network.fetch.hold();
    const callsBefore = loaded.network.fetch.calls.length;
    // Only the snackbar has Retry while it shows; the banner leaves it to the snackbar.
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    const busy = await canvas.findByRole('button', { name: 'Checking…' });
    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(loaded.network.fetch.calls.length).toBe(callsBefore + 1);
  },
};

/** Retry that finds the network recovers the app. */
export const RetryRecovers: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  play: async ({ canvasElement, loaded }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('region', { name: 'No internet' });
    loaded.network.fetch.setOk(true);
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await waitFor(async () =>
      expect(await canvas.findByText('Back online')).toBeVisible(),
    );
  },
};

/** Opt-in full-screen state, with the escape hatch. */
export const FullScreen: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  args: { fullScreen: true, continueOffline: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = await canvas.findByRole('heading', { name: 'No internet' });
    await waitFor(() => expect(title).toHaveFocus());
    await expect(canvas.queryByRole('region')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Continue offline' }));
    await waitFor(() =>
      expect(canvas.queryByRole('heading', { name: 'No internet' })).toBeNull(),
    );
    await waitFor(async () =>
      expect(await canvas.findByRole('status')).toHaveTextContent('No internet'),
    );
  },
};

/** Every piece dismissed (Dismiss, Escape, Delete): the app is quiet until the next change. */
export const Dismissed: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const snackbar = await canvas.findByRole('status');
    await userEvent.click(within(snackbar).getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledWith('snackbar'));

    const banner = await canvas.findByRole('status');
    await waitFor(() => expect(banner).toHaveTextContent('No internet'));
    within(banner).getByRole('button', { name: 'Dismiss' }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledWith('banner'));

    const indicator = canvas.getByRole('img', { name: 'Connection status: No internet' });
    indicator.focus();
    await userEvent.keyboard('{Delete}');
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledWith('indicator'));

    await waitFor(() => expect(canvas.queryByRole('status')).toBeNull());
    await expect(canvas.queryByRole('img')).toBeNull();
  },
};

/** `dismissible` off: no Dismiss buttons anywhere, and Escape does nothing. */
export const NotDismissible: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  args: { dismissible: false },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('status');
    await expect(canvas.queryByRole('button', { name: 'Dismiss' })).toBeNull();
    await userEvent.keyboard('{Escape}');
    await expect(args.onDismiss).not.toHaveBeenCalled();
  },
};

/** The toolbar globals, pinned per story so the visual snapshots cover them. */
export const Dark: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  globals: { scheme: 'dark' },
};

export const PortugueseRtl: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  globals: { locale: 'pt-BR', direction: 'rtl' },
};

export const SpanishReducedMotion: Story = {
  ...startingAt({ reachable: false, interfaceUp: true }),
  globals: { locale: 'es', motion: 'reduced' },
};

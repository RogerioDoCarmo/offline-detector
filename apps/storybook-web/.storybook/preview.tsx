import type { Decorator, Preview } from '@storybook/react-vite';
import { OfflineTokens } from '@rogeriodocarmo/offline-detector-web';

/**
 * The toolbar globals every story reads. `data-od-theme` on the wrapper is how the library
 * forces a colour scheme (see the web README, "Theming"); `dir` and `lang` give the pieces the
 * writing direction and language they would inherit from a real page.
 */
const withEnvironment: Decorator = (Story, context) => {
  const { locale, scheme, direction } = context.globals as {
    locale: string;
    scheme: 'light' | 'dark';
    direction: 'ltr' | 'rtl';
  };
  return (
    <div
      data-od-root=""
      data-od-theme={scheme}
      dir={direction}
      lang={locale}
      style={{
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: 24,
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        background: scheme === 'dark' ? '#121316' : '#ffffff',
        color: scheme === 'dark' ? '#f2f3f5' : '#1a1c20',
      }}
    >
      <OfflineTokens />
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withEnvironment],
  initialGlobals: {
    locale: 'en',
    scheme: 'light',
    direction: 'ltr',
    motion: 'auto',
  },
  globalTypes: {
    locale: {
      description: 'Language of the bundled copy',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        dynamicTitle: true,
        items: [
          { value: 'en', title: 'English' },
          { value: 'pt-BR', title: 'Português (Brasil)' },
          { value: 'es', title: 'Español' },
        ],
      },
    },
    scheme: {
      description: 'Colour scheme (data-od-theme)',
      toolbar: {
        title: 'Colour scheme',
        icon: 'circlehollow',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
      },
    },
    direction: {
      description: 'Writing direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        dynamicTitle: true,
        items: [
          { value: 'ltr', title: 'Left to right' },
          { value: 'rtl', title: 'Right to left' },
        ],
      },
    },
    motion: {
      description: 'Motion preference passed to the pieces',
      toolbar: {
        title: 'Motion',
        icon: 'play',
        dynamicTitle: true,
        items: [
          { value: 'auto', title: 'Motion: follow the system' },
          { value: 'reduced', title: 'Motion: reduced' },
        ],
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    a11y: {
      // 'error' makes a violation fail the story in the Vitest run (and CI).
      test: 'error',
    },
  },
};

export default preview;

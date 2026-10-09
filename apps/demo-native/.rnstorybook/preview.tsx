import type { Preview } from '@storybook/react-native';

// Stories bring their own stage (see helpers.tsx), so the preview adds nothing global.
const preview: Preview = {
  parameters: {
    controls: { expanded: true },
  },
};

export default preview;

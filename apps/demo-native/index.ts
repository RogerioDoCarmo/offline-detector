import { registerRootComponent } from 'expo';
import App from './App';
import StorybookRoot from './.rnstorybook';

// A build-time switch: `EXPO_PUBLIC_STORYBOOK=true` starts Storybook instead of the demo. Metro
// inlines the value and, with the flag off, stubs every Storybook module (metro.config.js), so
// the demo bundle carries no Storybook code.
const storybook = process.env.EXPO_PUBLIC_STORYBOOK === 'true';

registerRootComponent(storybook ? StorybookRoot : App);

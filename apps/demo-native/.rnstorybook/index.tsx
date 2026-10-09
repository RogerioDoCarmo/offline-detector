import { LiteUI } from '@storybook/react-native-ui-lite';
import { view } from './storybook.requires';

// The lite UI keeps Reanimated, gesture-handler and bottom-sheet out of the app. Controls and
// actions still work: the controls addon falls back to plain inputs without bottom-sheet.
const StorybookUIRoot = view.getStorybookUI({
  CustomUIComponent: LiteUI,
  shouldPersistSelection: false,
});

export default StorybookUIRoot;

// Loading react-native's Animated modules in the first test can exceed Jest's 5 s default.
jest.setTimeout(30000);

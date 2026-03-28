// Workaround for Prettier ESM issue
// TypeError: A dynamic import callback was invoked without --experimental-vm-modules
jest.mock('prettier', () => ({
  __esModule: true,
  default: jest.fn()
}));

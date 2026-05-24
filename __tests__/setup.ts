import '@testing-library/jest-dom';

// Polyfill fetch for Jest environment when running Supabase auth-related tests
if (typeof globalThis.fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.fetch = require('cross-fetch');
}

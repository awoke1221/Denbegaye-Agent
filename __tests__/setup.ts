import '@testing-library/jest-dom';
import crossFetch from 'cross-fetch';

// Polyfill fetch for Jest environment when running Supabase auth-related tests
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = crossFetch;
}

import type { Walk } from '../../types/discovery.js';

/**
 * Harness smoke check and first screen read: load the sign-in page and dump it.
 * No credentials are entered here - this walk only reads the screen.
 */
export const walk: Walk = {
  id: 'PROBE',
  title: 'Read the sign-in page (harness check)',
  tenant: 'a',
  login: 'none',
  steps: [
    {
      screen: 'home-anonymous',
      why: 'Start at the base URL to see what an anonymous visitor gets.',
      do: (page) => page.goto('/'),
    },
    {
      screen: 'login',
      why: 'The sign-in page is the only door into the workflow.',
      do: (page) => page.goto('/login'),
    },
  ],
};

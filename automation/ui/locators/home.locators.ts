/**
 * Selectors read off the home screen, both signed-out and signed-in
 * (SEQ-001 #1,4,5 — `automation/discovery/artifacts/login-admin/screens.json`).
 * `signInLink` and the exact alert classes were confirmed live while
 * building this page object — the DOM dump recorded the text/role but not
 * the `data-cy`/class; see the generator's report.
 */
export const homeLocators = {
  accountMenu: '#account-menu',
  /** "Sign in" inside the Account dropdown on an anonymous page. */
  signInLink: '[data-cy="login"]',
  entityMenu: '#entity-menu',
  adminMenu: '#admin-menu',
  bankAccountMenuLink: 'a[href="/bank-account"]',
  labelMenuLink: 'a[href="/label"]',
  operationMenuLink: 'a[href="/operation"]',
  /** "You are logged in as user ..." banner, signed in. */
  signedInAlert: '.alert-success',
  /** The two default-account credentials, printed in clear text (Q-001). */
  credentialsAlert: '.alert-warning',
} as const;

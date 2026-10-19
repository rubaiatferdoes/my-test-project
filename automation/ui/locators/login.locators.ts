/**
 * Selectors read off the live `/login` screen (SEQ-001 #2,
 * `automation/discovery/artifacts/login-admin/screens.json`, and
 * `automation/discovery/artifacts/val-login-form/`). `loginError` was
 * confirmed live while building this page object — the DOM dump only
 * recorded the generic `.alert`/`.text-danger` sweep, not the precise
 * `data-cy`; see the generator's report.
 */
export const loginLocators = {
  username: '[data-cy="username"]',
  password: '[data-cy="password"]',
  submit: '[data-cy="submit"]',
  loginError: '[data-cy="loginError"]',
} as const;

/**
 * Selectors read off the bank-account list/create/detail screens
 * (SEQ-002, `automation/discovery/artifacts/create-bank-account/`,
 * reused from `automation/discovery/walks/create-bank-account.walk.ts`).
 * `nameErrors`/`balanceErrors` were confirmed live while building this
 * page object — the validation walk recorded the messages with a generic
 * sweep (`form .invalid-feedback, form .form-text, form .text-danger,
 * form small, .alert`), not scoped per field; see the generator's report.
 */
export const bankAccountLocators = {
  createButton: '[data-cy="entityCreateButton"]',
  nameInput: '[data-cy="name"]',
  /** The `<small>` validation messages right after the Name input. */
  nameErrors: '[data-cy="name"] + div small',
  balanceInput: '[data-cy="balance"]',
  /** The `<small>` validation messages right after the Balance input. */
  balanceErrors: '[data-cy="balance"] + div small',
  userSelect: '[data-cy="user"]',
  saveButton: '[data-cy="entityCreateSaveButton"]',
  cancelButton: '[data-cy="entityCreateCancelButton"]',
  /** "A new Bank Account is created with identifier ..." banner. */
  successAlert: '.alert-success',
  rows: 'tbody tr',
  rowDetailLink: '[data-cy="entityDetailsButton"]',
} as const;

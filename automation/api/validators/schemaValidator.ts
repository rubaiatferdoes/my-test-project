import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const compiled = new Map<string, ValidateFunction>();

/** Compiles (once) and validates `data` against a schema object. Returns
 * ajv's own error list — the test decides what to do with it (fail,
 * or report as a contract finding per `api-contract-check`). */
export function validateAgainstSchema(
  schemaName: string,
  schema: object,
  data: unknown,
): { valid: boolean; errors: string[] } {
  let validate = compiled.get(schemaName);
  if (!validate) {
    validate = ajv.compile(schema);
    compiled.set(schemaName, validate);
  }
  const valid = validate(data) as boolean;
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '(root)'} ${e.message ?? ''}`.trim(),
  );
  return { valid, errors };
}

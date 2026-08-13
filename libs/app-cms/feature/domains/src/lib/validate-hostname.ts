import { customT } from '@codeware/app-cms/util/i18n';
import type { TextFieldSingleValidation } from 'payload';

import { type HostnameProblem, parseHostname } from './parse-hostname';

/**
 * Which message explains a problem to the person typing it.
 *
 * The three most common mistakes get their own wording, because "not a valid
 * domain name" is useless advice when what you did was paste a browser url.
 * Everything else shares one message - by then the value is malformed in a way
 * no short sentence improves on.
 */
const messageKey = (problem: HostnameProblem) => {
  switch (problem) {
    case 'hasScheme':
      return 'validation:domainNoScheme' as const;
    case 'hasPath':
    case 'hasPort':
      return 'validation:domainNoPathOrPort' as const;
    case 'isWildcard':
      return 'validation:domainNoWildcard' as const;
    default:
      return 'validation:domainMalformed' as const;
  }
};

/**
 * Field validation for a custom domain hostname.
 *
 * Catches the mistake where it was made, next to the input, rather than letting
 * it reach Fly and come back as a certificate that can never validate.
 */
export const validateHostname: TextFieldSingleValidation = (value, { req }) => {
  // Presence is the `required` flag's job; saying it twice reads as two faults
  if (!value) {
    return true;
  }

  const result = parseHostname(value);

  if (result.valid) {
    return true;
  }

  return customT(req.t)(messageKey(result.problem), { hostname: value });
};

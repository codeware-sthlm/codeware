import { createLowercaseSchema } from '@codeware/core/zod';
import { z } from 'zod';

export const SignatureSchema = z.object({
  'X-Device-Id': z
    .string({
      description: `Device identifier that won't change`
    })
    .uuid({ message: `Must be a valid UUID` }),
  'X-Request-Id': z
    .string({
      description: `Request identifier unique for each request to prevent replay attacks`
    })
    .uuid({ message: `Must be a valid UUID` }),
  'X-Signature': z
    .string({
      description: `The actual signature to be verified by the server`,
      message: `Must be a 64 character hexadecimal string`
    })
    .regex(/^[0-9a-fA-F]+$/)
    .length(64),
  'X-Timestamp': z
    .string({
      description: `The timestamp of the request to set a TTL on the signature`
    })
    .regex(/^\d{13}$/, 'Must be a 13-digit timestamp string'),
  'X-User-Agent': z.string({
    description: `Client user agent details to make it possible to identify request patterns`
  })
});

export const SignatureLowercaseSchema = createLowercaseSchema(SignatureSchema);

/**
 * The signature headers in their canonical form
 * that are used when generating the request headers.
 */
export type Signature = z.infer<typeof SignatureSchema>;

/**
 * The signature headers in their lowercase form
 * that are used when parsing the request headers.
 */
export type SignatureLowercase = z.infer<typeof SignatureLowercaseSchema>;

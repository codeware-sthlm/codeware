import { describe, expect, it } from 'vitest';

import {
  CertificateApiResponseSchema,
  HostnameCheckApiResponseSchema
} from './schemas/certificate.schema';

/**
 * Does Fly's schema still match what we parse?
 *
 * The fixtures beside this file prove the schemas against a captured response,
 * which is worth having but freezes a moment in time: a fixture cannot notice
 * that Fly has since renamed a field. That failure is not hypothetical — this
 * client was first written against `configured`, and the api calls it
 * `isConfigured`, so every call would have thrown on parse.
 *
 * Introspection is read-only and cheap, so it can answer the question directly:
 * for every field we parse, does Fly still have it?
 *
 * Skipped without a token, which keeps CI green wherever the secret is absent.
 * Run it deliberately with:
 *
 * ```sh
 * FLY_API_TOKEN=$(fly auth token) nx test fly-node
 * ```
 */

const token = process.env['FLY_API_TOKEN'];

/** One introspection query — no app is named, nothing is mutated */
const fieldsOf = async (typeName: string): Promise<Array<string>> => {
  const response = await fetch('https://api.fly.io/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `query TypeFields($name: String!) {
        __type(name: $name) { fields { name } }
      }`,
      variables: { name: typeName }
    })
  });

  const body = (await response.json()) as {
    data?: { __type?: { fields: Array<{ name: string }> } };
    errors?: Array<{ message: string }>;
  };

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join('; '));
  }

  return (body.data?.__type?.fields ?? []).map((field) => field.name);
};

describe.skipIf(!token)('Fly GraphQL schema drift', () => {
  it('still exposes every certificate field we parse', async () => {
    const actual = await fieldsOf('AppCertificate');
    const parsed = Object.keys(CertificateApiResponseSchema.shape);

    expect(actual.length).toBeGreaterThan(0);
    expect(parsed.filter((field) => !actual.includes(field))).toEqual([]);
  }, 30_000);

  it('still exposes every hostname check field we parse', async () => {
    const actual = await fieldsOf('HostnameCheck');
    const parsed = Object.keys(HostnameCheckApiResponseSchema.shape);

    expect(actual.length).toBeGreaterThan(0);
    expect(parsed.filter((field) => !actual.includes(field))).toEqual([]);
  }, 30_000);
});

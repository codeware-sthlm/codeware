/**
 * Mocks for `@actions/github` module for Vitest.
 *
 * TODO: Needs to be properly setup in Vitest configuration.
 */

import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import type { PartialDeep } from 'type-fest';
import { vi } from 'vitest';

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type ResponseType<
  K extends keyof RestEndpointMethodTypes,
  M extends keyof RestEndpointMethodTypes[K]
> = RestEndpointMethodTypes[K][M] extends (...args: any[]) => any
  ? UnwrapPromise<ReturnType<RestEndpointMethodTypes[K][M]>>
  : UnwrapPromise<RestEndpointMethodTypes[K][M]>;

type ViMockFunction<TArgs extends any[] = any[], TReturn = any> = {
  (...args: TArgs): TReturn;
} & ReturnType<typeof vi.fn>;

type ToVitestMock<T> = T extends (...args: infer P) => infer R
  ? ViMockFunction<P, Promise<UnwrapPromise<R>>>
  : never;

type DeepMockFunction<T> = {
  [P in keyof T]?: T[P] extends (...args: any[]) => any
    ? ToVitestMock<T[P]>
    : T[P] extends object
      ? DeepMockFunction<T[P]>
      : T[P];
};

type MockRestEndpointMethodTypes = DeepMockFunction<RestEndpointMethodTypes>;

interface MockOctokit {
  rest: MockRestEndpointMethodTypes;
  request: ViMockFunction;
  paginate: ViMockFunction;
}

function createMockResponse<
  K extends keyof RestEndpointMethodTypes,
  M extends keyof RestEndpointMethodTypes[K],
  R extends ResponseType<K, M>
>(
  _namespace: K,
  _method: M,
  response: PartialDeep<
    R extends { response: any } ? R['response'] : R,
    { recurseIntoArrays: true }
  >
) {
  type Mock = ToVitestMock<RestEndpointMethodTypes[K][M]>;
  return vi.fn().mockResolvedValue(response) as Mock;
}

/// ^^^ End of mock types and functions for `Octokit` instance. ^^^

///
/// Mock Octokit instance with default values for all methods used by tests.
///

const mockOctokit: MockOctokit = {
  rest: {
    issues: {
      addAssignees: createMockResponse('issues', 'addAssignees', {
        data: { id: 1, number: 1 }
      }),
      addLabels: createMockResponse('issues', 'addLabels', {
        data: [{ id: 1 }]
      }),
      createComment: createMockResponse('issues', 'createComment', {
        data: { id: 1 }
      }),
      list: createMockResponse('issues', 'list', { data: [] })
    },
    pulls: {
      create: createMockResponse('pulls', 'create', {
        data: {
          id: 1,
          number: 1
        }
      }),
      list: createMockResponse('pulls', 'list', {
        data: [{ labels: [], number: 1 }]
      }),
      update: createMockResponse('pulls', 'update', { data: { number: 1 } })
    },
    repos: {
      get: createMockResponse('repos', 'get', {
        data: { id: 1, allow_auto_merge: true, default_branch: 'main' }
      }),
      listForAuthenticatedUser: createMockResponse(
        'repos',
        'listForAuthenticatedUser',
        { data: [{ name: 'repo', permissions: {} }] }
      )
    },
    users: {
      getAuthenticated: createMockResponse('users', 'getAuthenticated', {
        data: { login: 'username' },
        headers: {
          'x-oauth-scopes': 'pull_request,repo,workflow',
          'github-authentication-token-expiration': '2999-01-01T00:00:00Z'
        }
      }),
      getByUsername: createMockResponse('users', 'getByUsername', {
        data: { id: 1 }
      })
    }
  },
  request: vi.fn().mockResolvedValue({}),
  paginate: vi.fn()
};

const mockContext = {
  repo: {
    owner: 'owner',
    repo: 'repo'
  },
  payload: {
    pull_request: {
      number: 123,
      head: {
        ref: 'feature-branch',
        sha: 'abc123'
      },
      base: {
        ref: 'main'
      }
    }
  },
  sha: 'abc123',
  ref: 'refs/heads/feature-branch',
  workflow: 'workflow',
  action: 'action',
  actor: 'actor',
  eventName: 'pull_request'
};

const getOctokit = vi.fn(() => mockOctokit);

export type { MockRestEndpointMethodTypes, MockOctokit, ResponseType };
export { createMockResponse, getOctokit, mockContext as context };

export default {
  getOctokit,
  context: mockContext
};

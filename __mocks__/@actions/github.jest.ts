/**
 * Mocks for `@actions/github` module for Jest.
 */

import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import type { PartialDeep } from 'type-fest';

// Utility type to convert a promise return type to its resolved value
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Helper type for creating mock implementations
type ResponseType<
  K extends keyof RestEndpointMethodTypes,
  M extends keyof RestEndpointMethodTypes[K]
> = RestEndpointMethodTypes[K][M] extends (...args: any[]) => any
  ? UnwrapPromise<ReturnType<RestEndpointMethodTypes[K][M]>>
  : UnwrapPromise<RestEndpointMethodTypes[K][M]>;

// Utility type to convert a function type to jest.Mock
type ToJestMock<T> = T extends (...args: infer P) => infer R
  ? jest.Mock<Promise<UnwrapPromise<R>>, P>
  : never;

// Recursively converts all function properties to jest.Mock types
type DeepMockFunction<T> = {
  [P in keyof T]?: T[P] extends (...args: any[]) => any
    ? ToJestMock<T[P]>
    : T[P] extends object
      ? DeepMockFunction<T[P]>
      : T[P];
};

// Type to convert RestEndpointMethodTypes to mocked version
type MockRestEndpointMethodTypes = DeepMockFunction<RestEndpointMethodTypes>;

// Usage example type
interface MockOctokit {
  rest: MockRestEndpointMethodTypes;
  graphql: jest.Mock;
  request: jest.Mock;
  paginate: jest.Mock;
}

// Helper function to create typed mock responses
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
  type Mock = ToJestMock<RestEndpointMethodTypes[K][M]>;
  return jest.fn().mockResolvedValue(response) as Mock;
}

/// ^^^ End of mock types and functions for `Octokit` instance. ^^^

/**
 * Mock Octokit instance with default values for all methods used by tests.
 *
 * Add more mocked methods and responses as needed.
 */
const mockOctokit: MockOctokit = {
  rest: {
    git: {
      deleteRef: createMockResponse('git', 'deleteRef', {
        data: undefined
      })
    },
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
      get: createMockResponse('pulls', 'get', {
        data: { node_id: 'ID1', number: 1 }
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
      getCommit: createMockResponse('repos', 'getCommit', {
        data: {
          commit: {
            verification: { verified: false, reason: 'test' }
          },
          committer: { email: 'committer-email', name: 'committer-name' },
          sha: 'SHA'
        }
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
  graphql: jest.fn(),
  request: jest.fn().mockResolvedValue({}),
  paginate: jest.fn()
};

// Mock context with default dummy values
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

// Mock the getOctokit function
const getOctokit: jest.Mock<MockOctokit> = jest
  .fn()
  .mockReturnValue(mockOctokit);

// Export everything needed by tests
export { getOctokit, mockContext as context };

// Also export default for cases where default import is used
export default {
  getOctokit,
  context: mockContext
};

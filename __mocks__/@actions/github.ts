// __mocks__/@actions/github.ts

import { type MockOctokit, createMockResponse } from './types';

/**
 * Mock Octokit instance with default values for all methods used by tests.
 *
 * Add more mocked methods and responses as needed.
 */
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
      list: createMockResponse('pulls', 'list', { data: [] }),
      update: createMockResponse('pulls', 'update', { data: { number: 1 } })
    },
    repos: {
      get: createMockResponse('repos', 'get', {
        data: { id: 1, allow_auto_merge: true, default_branch: 'main' }
      })
    }
  },
  request: jest.fn().mockResolvedValue({}),
  paginate: jest.fn()
};

// Mock context with default dummy values
const mockContext = {
  repo: {
    owner: 'test-owner',
    repo: 'test-repo'
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
  workflow: 'test-workflow',
  action: 'test-action',
  actor: 'test-user',
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

// Helper function to reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();

  // Reset any mock implementations
  getOctokit.mockReturnValue(mockOctokit);
};

// Helper function to update context values
export const setMockContext = (newContext: Partial<typeof mockContext>) => {
  Object.assign(mockContext, newContext);
};

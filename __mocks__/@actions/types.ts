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

export type { MockRestEndpointMethodTypes, MockOctokit, ResponseType };

export { createMockResponse };

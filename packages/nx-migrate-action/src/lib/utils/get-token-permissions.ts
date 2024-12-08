import * as core from '@actions/core';
import * as github from '@actions/github';
import { withGitHub } from '@codeware/core/actions';

interface RepositoryPermissions {
  admin: boolean;
  maintain: boolean;
  push: boolean;
  triage: boolean;
  pull: boolean;
  // Fine-grained specific permissions
  contents?: 'read' | 'write' | 'none';
  issues?: 'read' | 'write' | 'none';
  pull_requests?: 'read' | 'write' | 'none';
  workflows?: 'read' | 'write' | 'none';
}

export type TokenInfo = {
  type: 'classic' | 'fine-grained';
  isValid: boolean;
  username: string;
  expiration: Date | null;
  scopes: Array<string> | undefined;
  repoPermissions: RepositoryPermissions;
  resolvedPermissions: {
    pullRequest: boolean;
    repo: boolean;
    workflow: boolean;
  };
};

/**
 * Get token permissions.
 *
 * @param token GitHub token
 * @returns Token permissions
 */
export const getTokenPermissions = async (
  token: string
): Promise<TokenInfo> => {
  const octokit = github.getOctokit(token);

  core.debug('Get token permissions');

  const {
    data: { login: username },
    headers
  } = await withGitHub(async () => await octokit.rest.users.getAuthenticated());

  // Get token expiration if available (for fine-grained tokens)
  const expirationHeader = headers['github-authentication-token-expiration'];
  const expiration = expirationHeader ? new Date(expirationHeader) : null;
  const isValid = expiration ? expiration > new Date() : true;

  // Get repositories the token has access to
  const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser();

  const permissions = repos.find(
    (repo) => repo.name === github.context.repo.repo
  )?.permissions as RepositoryPermissions | undefined;

  if (!permissions) {
    throw new Error('Repository permissions not found');
  }

  // Classic token scopes are returned in the response headers
  const scopesHeader = headers['x-oauth-scopes'];
  const scopes = scopesHeader
    ? scopesHeader
        .split(',')
        .map((scope) => scope.trim())
        .filter(Boolean)
    : undefined;

  return {
    type: 'x-oauth-scopes' in headers ? 'classic' : 'fine-grained',
    isValid,
    username,
    expiration,
    scopes,
    repoPermissions: permissions,
    resolvedPermissions: {
      pullRequest:
        scopes?.includes('repo') ?? permissions.pull_requests === 'write',
      repo: scopes?.includes('repo') ?? permissions.contents === 'write',
      workflow:
        scopes?.includes('workflow') ?? permissions.workflows === 'write'
    }
  };
};

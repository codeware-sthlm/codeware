import * as core from '@actions/core';

import type { TokenInfo } from './get-token-permissions';

export const printTokenPermissions = (token: TokenInfo) => {
  core.startGroup('Token permissions');

  core.info(`- type: ${token.type}`);
  core.info(`- isValid: ${token.isValid}`);
  core.info(`- username: ${token.username}`);
  core.info(`- expiration: ${token.expiration}`);
  core.info(`- scopes: ${token.scopes?.join(', ')}`);

  core.info('== Repo permissions ==');
  for (const [key, value] of Object.entries(token.repoPermissions)) {
    core.info(`- ${key}: ${value}`);
  }

  core.info('== Resolved permissions ==');
  for (const [key, value] of Object.entries(token.resolvedPermissions)) {
    core.info(`- ${key}: ${value}`);
  }
  core.endGroup();
};

const { execSync } = require('child_process');

const { defaultConfig, RuleConfigSeverity } = require('cz-git');

// Resolve scopes from Nx projects, except e2e
const projects = JSON.parse(
  execSync('nx show projects --exclude="*-e2e" | jq -R | jq -cs', {
    encoding: 'utf-8'
  })
);
// Allow some custom scopes
projects.push('deps', 'release', 'repo', 'workflow');

/** @type {import('cz-git').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-angular'],
  rules: {
    'scope-enum': [RuleConfigSeverity.Error, 'always', projects],
    'type-enum': [
      RuleConfigSeverity.Error,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
        'release'
      ]
    ]
  },
  prompt: {
    allowBreakingChanges: ['feat', 'fix'],
    allowCustomScopes: false,
    allowEmptyScopes: false,
    allowCustomIssuePrefix: false,
    allowEmptyIssuePrefix: false
  },
  messages: {
    ...defaultConfig.messages,
    footer: defaultConfig.messages?.footer?.replace(/#/g, 'COD-')
  }
};

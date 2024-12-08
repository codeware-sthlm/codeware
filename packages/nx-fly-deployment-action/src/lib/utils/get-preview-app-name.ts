/**
 * Get the name of the preview app for a given project and pull request number
 *
 * Pattern: `<project-name>-pr-<pull-request-number>`
 *
 * @param projectName - The name of the project
 * @param pullRequest - The pull request number
 * @returns The name of the preview app
 */
export const getPreviewAppName = (projectName: string, pullRequest: number) => {
  return `${projectName}-pr-${pullRequest}`;
};

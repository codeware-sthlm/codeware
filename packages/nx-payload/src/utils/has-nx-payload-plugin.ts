import { type Tree, readNxJson } from '@nx/devkit';

export function hasNxPayloadPlugin(tree: Tree) {
  const nxJson = readNxJson(tree);
  if (!nxJson?.plugins) {
    return false;
  }
  return !!nxJson.plugins.some((p) =>
    typeof p === 'string'
      ? p === '@cdwr/nx-payload/plugin'
      : p.plugin === '@cdwr/nx-payload/plugin'
  );
}

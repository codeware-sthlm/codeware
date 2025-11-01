import { updateDependencies } from './update-dependencies';

describe('updateDependencies', () => {
  const pkg = `
{
  "name": "repo",
  "dependencies": {
    "@nx/devkit": "^21.0.0",
    "@nx/js": "^20.0.0 || ^21.0.0",
    "nx": "21.3.2",
    "create-nx-workspace": "21.x",
    "@nx/webpack": "~21.0.0",
    "react": "18.2.0"
  },
  "devDependencies": {
    "@nx/linter": "^21.0.0",
    "@nx/vite": "^20.0.0 || ^21.0.0",
    "@nx/not-matched": "file:../local"
  },
  "peerDependencies": {
    "@nx/eslint": "21.0.0"
  }
}
`;

  it('updates all targeted specs across sections', () => {
    const out = updateDependencies(pkg, '22.0.0');

    // caret bumped
    expect(out).toContain(`"@nx/devkit": "^22.0.0"`);
    expect(out).toContain(`"@nx/linter": "^22.0.0"`);

    // multi-range extended
    expect(out).toContain(`"@nx/js": "^20.0.0 || ^21.0.0 || ^22.0.0"`);
    expect(out).toContain(`"@nx/vite": "^20.0.0 || ^21.0.0 || ^22.0.0"`);

    // plain semver bumped
    expect(out).toContain(`"nx": "22.0.0"`);
    expect(out).toContain(`"@nx/eslint": "22.0.0"`);

    // major.x bumped
    expect(out).toContain(`"create-nx-workspace": "22.x"`);

    // ~ left alone, unrelated packages left alone
    expect(out).toContain(`"@nx/webpack": "~21.0.0"`);
    expect(out).toContain(`"react": "18.2.0"`);
    expect(out).toContain(`"@nx/not-matched": "file:../local"`);
  });
});

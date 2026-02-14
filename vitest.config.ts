import { defineConfig } from 'vitest/config';

const nrgyPackages = [
  'core',
  'ditox',
  'ditox-react',
  'react',
  'rx-effects',
  'rxjs',
];

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    alias: {
      ...getNrgyPackageAliases(nrgyPackages),
    },
  },
});

function getNrgyPackageAliases(packageNames: string[]): Record<string, string> {
  return Object.fromEntries(
    packageNames.map((name) => [
      `@nrgyjs/${name}`,
      new URL(`./packages/${name}/src/`, import.meta.url).pathname,
    ]),
  );
}

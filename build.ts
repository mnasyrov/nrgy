import fs from 'node:fs';
import tsup from 'tsup';

import pkg from './package.json';

const entries = [
  { entry: 'index', source: 'src/core' },
  { entry: 'mvc', source: 'src/mvc' },
  { entry: 'mvc-react', source: 'src/mvc-react' },
  { entry: 'react', source: 'src/react' },
  { entry: 'ditox', source: 'src/ditox' },
  { entry: 'ditox-react', source: 'src/ditox-react' },
  { entry: 'rx-effects', source: 'src/rx-effects' },
  { entry: 'rxjs', source: 'src/rxjs' },
  { entry: 'rxjs-react', source: 'src/rxjs-react' },
];

main();

async function main() {
  // Compile
  await compile();

  const compiledFiles = fs.readdirSync('dist');

  // Copy package files
  console.log('Copy files to the dist folder...');

  pkg.files
    .filter((name) => name !== 'dist')
    .map((localPath) => {
      console.log(`- ${localPath} ...`);

      fs.cpSync(localPath, `dist/${localPath}`, { recursive: true });
    });

  // Write public package.json
  pkg.private = false;
  pkg.files = [...new Set([...pkg.files, ...compiledFiles])];
  pkg.scripts = undefined as any;
  pkg.devDependencies = undefined as any;

  fs.writeFileSync(`dist/package.json`, JSON.stringify(pkg, undefined, 2));
}

async function compile() {
  await tsup.build({
    splitting: true,
    entry: entries.reduce(
      (obj, { entry, source }) => ({ ...obj, [entry]: `${source}/index.ts` }),
      {},
    ),
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    external: Object.keys(pkg.optionalDependencies),
  });
}

import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(websiteRoot, '..');
const docsRoot = path.join(websiteRoot, 'docs');
const englishContentRoot = path.join(docsRoot, 'content');
const russianDocsRoot = path.join(docsRoot, 'ru');
const russianContentRoot = path.join(russianDocsRoot, 'content');
const publicRoot = path.join(docsRoot, 'public');

await rm(englishContentRoot, { force: true, recursive: true });
await rm(russianContentRoot, { force: true, recursive: true });
await rm(publicRoot, { force: true, recursive: true });

await mkdir(englishContentRoot, { recursive: true });
await mkdir(russianContentRoot, { recursive: true });
await mkdir(publicRoot, { recursive: true });

await copyProjectFiles();
await copyDocsMarkdown();
await copyPackagesMarkdown();
await copyPublicAsset('docs/assets', 'assets');
await copyPublicAsset('energy.svg', 'energy.svg');
await copyPublicAsset('CNAME', 'CNAME');

async function copyProjectFiles() {
  await copyLocalizedMarkdown(
    path.join(repoRoot, 'README.md'),
    path.join(englishContentRoot, 'project', 'README.md'),
  );
  await copyLocalizedMarkdown(
    path.join(repoRoot, 'README.ru.md'),
    path.join(russianContentRoot, 'project', 'README.md'),
  );
  await copySharedMarkdown(
    path.join(repoRoot, 'CHANGELOG.md'),
    path.join(englishContentRoot, 'project', 'CHANGELOG.md'),
    path.join(russianContentRoot, 'project', 'CHANGELOG.md'),
  );
}

async function copyDocsMarkdown() {
  const sourceRoot = path.join(repoRoot, 'docs');
  const files = await collectFiles(sourceRoot);

  for (const file of files) {
    if (!isMarkdown(file)) {
      continue;
    }

    const relativePath = path.relative(sourceRoot, file);
    await copyLocalizedFile(file, relativePath, 'docs');
  }
}

async function copyPackagesMarkdown() {
  const sourceRoot = path.join(repoRoot, 'packages');
  const packageDirs = await readdir(sourceRoot, { withFileTypes: true });

  for (const entry of packageDirs) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageRoot = path.join(sourceRoot, entry.name);
    const files = await collectFiles(packageRoot);

    for (const file of files) {
      const relativePath = path.relative(packageRoot, file);
      const isPackageReadme =
        relativePath === 'README.md' || relativePath === 'README.ru.md';
      const isSourceDoc =
        relativePath.startsWith(`src${path.sep}`) && isMarkdown(relativePath);

      if (!isPackageReadme && !isSourceDoc) {
        continue;
      }

      await copyLocalizedFile(
        file,
        relativePath,
        path.join('packages', entry.name),
      );
    }
  }
}

async function copyPublicAsset(sourceRelativePath, targetRelativePath) {
  const source = path.join(repoRoot, sourceRelativePath);
  if (!(await exists(source))) {
    return;
  }

  await copyPath(source, path.join(publicRoot, targetRelativePath));
}

async function copyPath(source, target) {
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true });
}

async function copyLocalizedFile(source, relativePath, section) {
  if (source.endsWith('.ru.md')) {
    await copyLocalizedMarkdown(
      source,
      path.join(
        russianContentRoot,
        section,
        toLocalizedRelativePath(relativePath),
      ),
    );
    return;
  }

  await copyLocalizedMarkdown(
    source,
    path.join(
      englishContentRoot,
      section,
      toLocalizedRelativePath(relativePath),
    ),
  );
}

async function copySharedMarkdown(source, ...targets) {
  if (!(await exists(source))) {
    return;
  }

  const original = await readFile(source, 'utf8');
  const normalized = normalizeMarkdown(original);

  for (const target of targets) {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, normalized);
  }
}

async function copyLocalizedMarkdown(source, target) {
  if (!(await exists(source))) {
    return;
  }

  const original = await readFile(source, 'utf8');
  const normalized = normalizeMarkdown(original);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, normalized);
}

function normalizeMarkdown(content) {
  return content.replaceAll('src="energy.svg"', 'src="/energy.svg"');
}

function toLocalizedRelativePath(relativePath) {
  return relativePath.replace(/\.ru\.md$/, '.md');
}

function isMarkdown(filePath) {
  return filePath.endsWith('.md');
}

async function collectFiles(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

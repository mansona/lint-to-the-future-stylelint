import { readFileSync, writeFileSync } from 'fs';
import importCwd from 'import-cwd';
import { join } from 'path';
import { globbySync } from 'globby';

const stylelintRegex = /stylelint-disable (.*) \*\//;

function getFiles(cwd) {
  const globs = ['**/*.css', '**/*.scss',

  // globby's ignore functionality works by getting all glob matches and _then_ filtering them.
  // We always ignore node_modules here since we'll never want it and it can be a huge performance hit
  // to include it.
    '!**/node_modules'
  ];

  return globbySync(globs, {
    cwd,
    ignoreFiles: ['**/.gitignore', '**/.stylelintignore'],
  });
}

function ignoreError(errors, filePath) {
  const ruleIds = errors
    .filter(error => error.severity === 'error')
    .map(error => error.rule);

  let uniqueIds = [...new Set(ruleIds)];

  const file = readFileSync(filePath, 'utf8');

  const firstLine = file.split('\n')[0];

  if (firstLine.match(stylelintRegex)) {
    const matched = firstLine.match(stylelintRegex);
    const existing = matched[1].split(',')
      .map(item => item.trim())
      .filter(item => item.length);

    uniqueIds = [...new Set([...ruleIds, ...existing])];
    uniqueIds.sort((a, b) => a.localeCompare(b));

    const replacement = uniqueIds.length ? `/* stylelint-disable ${uniqueIds.join(', ')} */\n` : '';
    writeFileSync(filePath, file.replace(/^.*\n/, replacement));
  } else if (uniqueIds.length) {
    uniqueIds.sort((a, b) => a.localeCompare(b));
    writeFileSync(filePath, `/* stylelint-disable ${uniqueIds.join(', ')} */\n${file}`);
  }
}

export async function ignoreAll(directory) {
  // this is only used for internal testing, lint-to-the-future never passes a
  // directory
  const cwd = directory || process.cwd();

  const stylelint = importCwd('stylelint');

  const files = getFiles(cwd);

  const result = await stylelint.lint({
    globbyOptions: {
      cwd,
    },
    files,
    cwd,
  });

  const erroredResults = result.results.filter(err => err.errored);

  erroredResults.forEach((err) => {
    ignoreError(
      err.warnings,
      err.source,
    );
  });
}

export function list(directory) {
  // this is only used for internal testing, lint-to-the-future never passes a
  // directory
  const cwd = directory || process.cwd();

  const files = getFiles(cwd);

  const output = {};

  files.forEach((filePath) => {
    const file = readFileSync(join(cwd, filePath), 'utf8');
    const firstLine = file.split('\n')[0];

    if (!firstLine.match(stylelintRegex)) {
      return;
    }

    const matched = firstLine.match(stylelintRegex);

    const ignoreRules = matched[1].split(',')
      .map(item => item.trim())
      .filter(item => item.length);

    ignoreRules.forEach((rule) => {
      if (output[rule]) {
        output[rule].push(filePath);
      } else {
        output[rule] = [filePath];
      }
    });
  });

  return output;
}

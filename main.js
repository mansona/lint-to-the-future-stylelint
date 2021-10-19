import { readFileSync, writeFileSync } from 'fs';
import importCwd from 'import-cwd';
import walkSync from 'walk-sync';
import { join } from 'path';

const fileGlobs = [
  'app/**/*.css',
  'addon/**/*.css',
  'tests/**/*.css',
  'vendor/**/*.css',
  'app/**/*.scss',
  'addon/**/*.scss',
  'tests/**/*.scss',
  'vendor/**/*.scss',
];

function ignoreError(errors, filePath) {
  const ruleIds = errors
    .filter(error => error.severity === 'error')
    .map(error => error.rule);

  let uniqueIds = [...new Set(ruleIds)];

  if (!uniqueIds.length) {
    // no errors to ignore
    return;
  }

  const file = readFileSync(filePath, 'utf8');

  const firstLine = file.split('\n')[0];

  if (firstLine.includes('stylelint-disable')) {
    const matched = firstLine.match(/stylelint-disable (.*) \*\//);
    const existing = matched[1].split(',')
      .map(item => item.trim())
      .filter(item => item.length);

    uniqueIds = [...new Set([...ruleIds, ...existing])];

    writeFileSync(filePath, file.replace(/^.*\n/, `/* stylelint-disable ${uniqueIds.join(', ')} */\n`));
  } else {
    writeFileSync(filePath, `/* stylelint-disable ${uniqueIds.join(', ')} */\n${file}`);
  }
}

export async function ignoreAll() {
  const stylelint = importCwd('stylelint');

  const result = await stylelint.lint({
    files: fileGlobs,
  });

  const erroredResults = result.results.filter(err => err.errored);

  erroredResults.forEach((err) => {
    ignoreError(
      err.warnings,
      err.source,
    );
  });
}

export function list() {
  const cwd = process.cwd();

  const files = walkSync(cwd, {
    globs: fileGlobs,
  });

  const output = {};

  files.forEach((filePath) => {
    const file = readFileSync(join(cwd, filePath), 'utf8');
    const firstLine = file.split('\n')[0];
    if (!firstLine.includes('stylelint-disable')) {
      return;
    }

    const matched = firstLine.match(/stylelint-disable (.*) \*\//);

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

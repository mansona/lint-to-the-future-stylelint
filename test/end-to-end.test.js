
import { Project } from 'fixturify-project';
import { execa } from 'execa';

import {
  expect, describe, beforeEach, it,
} from 'vitest';

describe('end-to-end test', () => {
  let project;

  beforeEach(async () => {
    project = new Project({
      files: {
        app: {
          styles: {
            'app.css': `/* stylelint-disable block-no-empty */
            .an-awesome-class {
}
`,
          },
        },
        'index.js': null,
      },
    });

    project.linkDevDependency('lint-to-the-future', { baseDir: process.cwd() });
    project.linkDevDependency('lint-to-the-future-stylelint', { baseDir: process.cwd(), resolveName: '.' });
    await project.write();
  });

  it('should be able to list', async () => {
    await execa({
      cwd: project.baseDir,
    })`lttf list -o outList.json`;

    project.readSync(project.baseDir);

    const parsedOutput = JSON.parse(project.files['outList.json']);

    expect(Object.entries(parsedOutput)[0][1]).to.deep.equal({
      'lint-to-the-future-stylelint': {
        'block-no-empty': [
          'app/styles/app.css',
        ],
      },
    });
  });
});

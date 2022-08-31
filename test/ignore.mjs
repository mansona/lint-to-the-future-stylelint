import { expect } from 'chai';
import fixturify from 'fixturify';
import tmp from 'tmp';

import { ignoreAll } from '../main.mjs';

const configFile = `{
  "rules": {
    "block-no-empty": true
  }
}`;

describe('ignore function', function () {
  it('should add file based ignores', async function () {
    const tmpobj = tmp.dirSync();
    fixturify.writeSync(tmpobj.name, {
      '.stylelintrc': configFile,
      app: {
        'thing.css': '.an-awesome-class {}',
        'existing.css': '/* stylelint-disable color-no-invalid-hex */\n .an-awesome-class {}',
      },
    });

    await ignoreAll(tmpobj.name);

    const result = fixturify.readSync(tmpobj.name);

    expect(result).to.deep.equal({
      '.stylelintrc': configFile,
      app: {
        'thing.css': '/* stylelint-disable block-no-empty */\n.an-awesome-class {}',
        'existing.css': '/* stylelint-disable block-no-empty, color-no-invalid-hex */\n .an-awesome-class {}',
      },
    });
  });
});

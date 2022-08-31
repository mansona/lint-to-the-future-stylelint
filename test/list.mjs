import { expect } from 'chai';
import { list } from '../main.mjs';

describe('list function', function () {
  it('should output object with rules and files', function () {
    const result = list('./test/fixtures/list');
    expect(result).to.deep.equal({
      'block-no-empty': [
        'app/styles/thing.css',
      ],
      'color-no-invalid-hex': [
        'addon/styles/thing.css',
        'addon/styles/thing.scss',
        'app/styles/thing.css',
        'app/styles/thing.scss',
        'tests/styles/thing.css',
        'tests/styles/thing.scss',
        'vendor/styles/thing.css',
        'vendor/styles/thing.scss',
      ],
    });
  });
});

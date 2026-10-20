import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isBlankRichText, richTextOrUndefined } from './rich-text';

test('an empty editor is blank, text or an image is not', () => {
  for (const blank of [undefined, null, '', '<p></p>', '<p> </p>', '<p>&nbsp;</p>', '<p><br></p>']) {
    assert.equal(isBlankRichText(blank), true, String(blank));
  }
  assert.equal(isBlankRichText('<p>Good</p>'), false);
  assert.equal(isBlankRichText('<p><img src="a.png"></p>'), false);
  assert.equal(richTextOrUndefined('<p></p>'), undefined);
  assert.equal(richTextOrUndefined('<p>Good</p>'), '<p>Good</p>');
});

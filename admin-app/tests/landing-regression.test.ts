import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const expectedLandingHash = '94a3f282cba8117c42f6363e0db36ffa07edb4643237b79cf70cb55a0c6ecbb3';

test('keeps the current landing page unchanged (atualize o hash ao editar o site de proposito)', () => {
  const landing = readFileSync(resolve(process.cwd(), '..', 'index.html'));
  const hash = createHash('sha256').update(landing).digest('hex');
  expect(hash).toBe(expectedLandingHash);
});

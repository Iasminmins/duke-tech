import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const expectedLandingHash = '2086eed35317dc15a34d4062117a9384b019433ffc9cee4e8cd1fce509304e2d';

test('keeps the current landing page unchanged (atualize o hash ao editar o site de proposito)', () => {
  const landing = readFileSync(resolve(process.cwd(), '..', 'index.html'));
  const hash = createHash('sha256').update(landing).digest('hex');
  expect(hash).toBe(expectedLandingHash);
});

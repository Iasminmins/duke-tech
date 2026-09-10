import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const expectedLandingHash = 'f47c53ec418d70455afd71db47137a1bcd3b31b19a81a2937077116ebcf0e7a8';

test('keeps the original landing page unchanged', () => {
  const landing = readFileSync(resolve(process.cwd(), '..', 'index.html'));
  const hash = createHash('sha256').update(landing).digest('hex');
  expect(hash).toBe(expectedLandingHash);
});

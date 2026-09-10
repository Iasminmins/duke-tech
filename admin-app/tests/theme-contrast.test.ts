import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

describe('light theme table contrast', () => {
  test('keeps hovered table rows readable', async () => {
    const css = await readFile('src/styles/admin-fixes.css', 'utf8');

    expect(css).toContain("html[data-theme='light'] .table tbody tr:hover{background:#f3f8fc;color:#17283d}");
    expect(css).toContain("html[data-theme='light'] .table th,html[data-theme='light'] .table td{border-bottom-color:#d7e0ea}");
  });
});

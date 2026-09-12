import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

describe('light theme table contrast', () => {
  test('keeps hovered table rows readable', async () => {
    const fixes = await readFile('src/styles/admin-fixes.css', 'utf8');
    const enhancements = await readFile('src/styles/admin-enhancements.css', 'utf8');
    const tokens = await readFile('src/styles/tokens.css', 'utf8');

    // Light is the default theme: hover background and text contrast apply with no [data-theme] prefix.
    expect(enhancements).toContain('.table tbody tr:hover{background:var(--panel-soft)}');
    expect(fixes).toContain('.table tbody tr:hover td,.table tbody tr:hover .muted{color:#17283d}');
    // Dark mode keeps its own hover treatment so contrast holds in both themes.
    expect(enhancements).toContain("html[data-theme='dark'] .table tbody tr:hover{background:#10243a}");
    expect(tokens).toContain('.table th,.table td{text-align:left;padding:15px 20px;border-bottom:1px solid var(--line);white-space:nowrap}');
  });
});

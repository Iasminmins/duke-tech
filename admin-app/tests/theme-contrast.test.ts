import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

type Tokens = Record<string, string>;

function parseTokens(block: string): Tokens {
  const tokens: Tokens = {};
  for (const match of block.matchAll(/--([a-z0-9-]+):([^;]+);/g)) tokens[match[1]] = match[2].trim();
  return tokens;
}

function resolve(tokens: Tokens, name: string): string {
  let value = tokens[name];
  for (let depth = 0; value?.startsWith('var(') && depth < 5; depth++) value = tokens[value.slice(6, -1)];
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`token --${name} nao resolve para hex: ${value}`);
  return value;
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Pares texto/fundo usados de fato na interface: todos precisam de WCAG AA (4.5:1).
const pairs: Array<[string, string]> = [
  ['text', 'bg'], ['text', 'panel'], ['text', 'panel-soft'], ['muted', 'panel'], ['muted', 'panel-soft'], ['muted', 'bg'],
  ['primary', 'panel'], ['primary', 'primary-soft'], ['on-accent', 'primary'], ['on-accent', 'primary-hover'], ['gold-text', 'gold-soft'], ['gold-text', 'panel'],
  ['info', 'info-soft'], ['green', 'green-soft'], ['amber', 'amber-soft'], ['red', 'red-soft'], ['red', 'panel'],
  ['sidebar-text', 'sidebar'], ['sidebar-label', 'sidebar'], ['sidebar-strong', 'sidebar-soft'], ['sidebar-text', 'sidebar-soft'], ['gold', 'sidebar'],
];

describe('tokens de cor', () => {
  test('mantem contraste WCAG AA nos dois temas', async () => {
    const css = await readFile('src/styles/tokens.css', 'utf8');
    const light = parseTokens(css.slice(css.indexOf(':root{'), css.indexOf("html[data-theme='dark']{")));
    const darkBlock = css.slice(css.indexOf("html[data-theme='dark']{"));
    const dark = { ...light, ...parseTokens(darkBlock.slice(0, darkBlock.indexOf('}'))) };

    for (const [theme, tokens] of [['claro', light], ['escuro', dark]] as const) {
      for (const [fg, bg] of pairs) {
        const ratio = contrast(resolve(tokens, fg), resolve(tokens, bg));
        expect(ratio, `${theme}: --${fg} sobre --${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test('usa a paleta da fachada como base', async () => {
    const css = await readFile('src/styles/tokens.css', 'utf8');
    expect(css).toContain('--wine:#501B2C;');
    expect(css).toContain('--gold:#D4A547;');
    expect(css).toContain('--graphite:#17191D;');
    expect(css).toContain('--bg:#F8F7F5;');
    expect(css).toContain('--panel:#FFFFFF;');
  });

  test('regras de estilo nao usam cores fixas fora do bloco de tokens', async () => {
    for (const file of ['tokens.css', 'admin-enhancements.css', 'admin-fixes.css', 'design-system.css', 'premium.css']) {
      const css = (await readFile(`src/styles/${file}`, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
      const rules = css.split('\n').filter(line => !/^\s*--[a-z0-9-]+:/.test(line));
      const hex = rules.join('\n').match(/#[0-9a-f]{3,8}\b/gi) || [];
      expect(hex, `${file} contem cores fixas`).toEqual([]);
    }
  });

  test('linha de tabela em hover continua legivel', async () => {
    const fixes = await readFile('src/styles/admin-fixes.css', 'utf8');
    const enhancements = await readFile('src/styles/admin-enhancements.css', 'utf8');
    expect(enhancements).toContain('.table tbody tr:hover{background:var(--panel-soft)}');
    expect(fixes).toContain('.table tbody tr:hover td,.table tbody tr:hover .muted{color:var(--text)}');
  });
});

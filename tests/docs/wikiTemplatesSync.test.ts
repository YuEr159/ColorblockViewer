// wiki 模板页与 library.ts 的同步闸。
//
// docs/wiki/templates.md 开头写着「本页与代码逐字对齐」，但没有机制保证——
// 2026-10-29 就出现了 library.ts 修好 4 条模板、wiki 仍躺着旧命令的情况
// （旧命令是坏的：polar 族写 x/z 会被忽略）。这个测试把承诺变成可执行检查。

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TEMPLATES } from '../../src/templates/library';

const WIKI = resolve(process.cwd(), 'docs/wiki/templates.md');

/** 从 wiki 的 ``` 代码块里抽出所有 /particleex 命令行 */
function wikiCommands(mdRaw: string): string[] {
  const md = mdRaw.replace(/\r\n/g, '\n'); // 仓库文件是 CRLF，先归一
  const out: string[] = [];
  for (const m of md.matchAll(/^```[a-z]*[ \t]*$\n([\s\S]*?)^```[ \t]*$/gm)) {
    for (const line of m[1].split('\n')) {
      const t = line.trim();
      if (t.startsWith('/particleex')) out.push(t);
    }
  }
  return out;
}

describe('wiki 模板页 ↔ library.ts 同步', () => {
  const md = readFileSync(WIKI, 'utf8');
  const cmds = wikiCommands(md);
  const libCmds = new Set(TEMPLATES.flatMap((t) => t.cmds));

  it('解析自检：确实从 wiki 抽到了命令（防正则失效后空跑通过）', () => {
    expect(cmds.length, 'wiki 模板页没抽出任何 /particleex 命令——解析规则或文件格式变了')
      .toBeGreaterThanOrEqual(TEMPLATES.length);
  });

  it('wiki 里的每条模板命令都存在于 library.ts（逐字一致）', () => {
    const stale = cmds.filter((c) => !libCmds.has(c));
    expect(stale, `wiki 有 ${stale.length} 条命令在 library.ts 中不存在（命令已改，文档未同步）：\n`
      + stale.map((c) => `  ${c.slice(0, 100)}…`).join('\n')).toEqual([]);
  });

  it('library.ts 的每条模板命令都在 wiki 里出现（没有漏记的模板）', () => {
    const wikiSet = new Set(cmds);
    const missing = TEMPLATES.filter((t) => t.cmds.some((c) => !wikiSet.has(c)));
    expect(missing.map((t) => t.id), '这些模板的命令未出现在 wiki 模板页').toEqual([]);
  });

  it('wiki 每个模板标题为 `### <id> · …`，与 library.ts 的 id 对得上', () => {
    const ids = [...md.matchAll(/^### ([a-z0-9_-]+) · /gm)].map((m) => m[1]);
    expect(ids.sort()).toEqual(TEMPLATES.map((t) => t.id).sort());
  });
});

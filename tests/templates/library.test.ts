// 模板库守护测试：每条模板都必须「能解析 + 游戏内格式合法 + 引擎实跑零错误」。
//
// 这条测试是模板页面的质量闸门：模板是直接给用户复制进游戏的东西，一旦有人
// 加了 `(` 未加引号的表达式、写错参数个数、或用了不存在的类型，这里立刻红。

import { describe, it, expect } from 'vitest';
import { TEMPLATES, templateById, templateText } from '../../src/templates/library';
import { parseCommands } from '../../src/command/parser';
import { serialize } from '../../src/command/serialize';
import { checkCommandsFormat } from '../../src/command/gameFormat';
import { SimEngine } from '../../src/sim/engine';
import { getState } from '../../src/store/appState';

function engine(): SimEngine {
  // 用站点默认配置（playerPos 等齐全；`~` 坐标解析需要）
  return new SimEngine({ ...getState().sim, seed: 1, mcVersion: '26.2' });
}

describe('模板库：结构', () => {
  it('非空、id 唯一、字段齐全', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(2);
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TEMPLATES) {
      expect(t.name.trim(), t.id).not.toBe('');
      expect(t.desc.trim(), t.id).not.toBe('');
      expect(t.tags.length, t.id).toBeGreaterThan(0);
      expect(t.cmds.length, t.id).toBeGreaterThan(0);
      for (const c of t.cmds) expect(c.trim(), t.id).not.toBe('');
    }
    expect(templateById('ripple')?.name).toBeTruthy();
    expect(templateById('nope')).toBeUndefined();
  });

  it('模板命令文本 = 逐行拼接（复制按钮的内容）', () => {
    const t = TEMPLATES[0];
    expect(templateText(t)).toBe(t.cmds.join('\n'));
  });
});

describe('模板库：格式与解析（质量闸门）', () => {
  for (const t of TEMPLATES) {
    it(`${t.id}：游戏内格式合法（引号按 brigadier 规则）`, () => {
      expect(checkCommandsFormat(templateText(t))).toEqual([]);
    });

    it(`${t.id}：可被解析器结构化 + 回显稳定（parse→serialize→parse 不变）`, () => {
      const cmds = parseCommands(templateText(t));
      expect(cmds).toHaveLength(t.cmds.length);
      const round = parseCommands(cmds.map(serialize).join('\n'));
      expect(round).toEqual(cmds);
    });

    it(`${t.id}：引擎实跑零错误、有粒子生成`, () => {
      const en = engine();
      let spawned = 0;
      for (const c of parseCommands(templateText(t))) {
        const r = en.runCommand(c);
        expect(r.errors, `${t.id}: ${r.errors.join(' / ')}`).toEqual([]);
        spawned += r.spawned;
      }
      expect(spawned, t.id).toBeGreaterThan(0);
      for (let i = 0; i < 10; i++) en.tickOnce();
      expect(en.tickErrors, t.id).toEqual([]);
      expect(en.aliveCount, t.id).toBeGreaterThan(0);
    });

    it(`${t.id}：表达式写的字段与命令族读取的字段匹配`, () => {
      // 根因闸门：polar 族只读 s1/s2/dis（模组 ClientNetworkHandler.java:159-162），
      // 非 polar 族只读 x/y/z。表达式写了对方那套字段会被静默忽略 →
      // 粒子全堆在原点（2026-10-29 体检：hypotrochoid/superformula/breathing 三条
      // 中招，且都通过了原有的「spawned>0」闸门）。
      // 位置表达式 = 第一个赋值块（含 s1/s2/dis/x/y/z 的那段）。
      const ASSIGN = /\b([a-zA-Z_][\w]*)\s*=/g;
      const POS_FIELDS = new Set(['x', 'y', 'z', 's1', 's2', 'dis']);
      for (const c of parseCommands(templateText(t))) {
        if (c.kind !== 'parameter') continue;
        const written = new Set<string>();
        for (const m of c.expression.matchAll(ASSIGN)) {
          if (POS_FIELDS.has(m[1])) written.add(m[1]);
        }
        // 逗号多赋值 `(vx,vy,vz)=...` / `x,y,z=...` 的左值组也要收（matchAll 只抓最后一个）
        for (const m of c.expression.matchAll(/\(?\s*([xyz],\s*[xyz],\s*[xyz])\s*\)?\s*=/g)) {
          for (const f of m[1].split(',')) if (POS_FIELDS.has(f.trim())) written.add(f.trim());
        }
        if (written.size === 0) continue; // 位置全省略 = 用上次残留，不判
        const cart = written.has('x') || written.has('y') || written.has('z');
        const sph = written.has('s1') || written.has('s2') || written.has('dis');
        if (c.polar) {
          expect(cart && !sph, `${t.id}: polar 族却写直角坐标 [${[...written]}]——`
            + 'polar 只读 s1/s2/dis，x/y/z 会被忽略（改用非 polar 族或改写成 s1/s2/dis）').toBe(false);
        } else {
          expect(sph && !cart, `${t.id}: 非 polar 族却写球坐标 [${[...written]}]——`
            + '非 polar 只读 x/y/z，s1/s2/dis 会被忽略').toBe(false);
        }
      }
    });

    it(`${t.id}：粒子真的散开（不是全堆在原点）`, () => {
      // 兜底闸门：出生点 + 运动后两个时刻都要求空间跨度 > 0.5 格。
      // 「出生在一点、靠速度炸开」的合法设计（fireworkball/ring）由运动后时刻覆盖。
      const measure = (en: SimEngine): number => {
        const parts = en.snapshot();
        if (parts.length === 0) return 0;
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const p of parts) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
          if (p.z < minZ) minZ = p.z;
          if (p.z > maxZ) maxZ = p.z;
        }
        return (maxX - minX) + (maxY - minY) + (maxZ - minZ);
      };
      const en = engine();
      for (const c of parseCommands(templateText(t))) en.runCommand(c);
      const birth = measure(en);
      for (let i = 0; i < 10; i++) en.tickOnce();
      const moved = measure(en);
      expect(Math.max(birth, moved),
        `${t.id}: 出生跨度 ${birth.toFixed(2)} / 10t 后跨度 ${moved.toFixed(2)}（疑似粒子全堆在一点）`)
        .toBeGreaterThan(0.5);
    });
  }
});

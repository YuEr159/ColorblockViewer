// curve-lab 纯函数测试：选族规则 + 数值快筛。
//
// 选族规则防的是真实缺陷（2026-10-29 体检）：polar 族只读 s1/s2/dis，
// 写 x/y/z 会被静默忽略 → 粒子全堆在原点，且原三闸测试抓不到。

import { describe, it, expect } from 'vitest';
import { pickFamily, buildCommand, scanCandidate } from '../../scripts/curve-lab';

describe('curve-lab：片段 → 命令族自动选择', () => {
  it('写 x/y/z → parameter（直角坐标族）', () => {
    expect(pickFamily('x=cos(t);z=sin(t)').family).toBe('parameter');
    expect(pickFamily('x=cos(t);z=sin(t)').polar).toBe(false);
  });

  it('写 s1/s2/dis → polarparameter', () => {
    expect(pickFamily('s1=t;dis=2').family).toBe('polarparameter');
    expect(pickFamily('s1=t;dis=2').polar).toBe(true);
    expect(pickFamily('s2=0;dis=1').polar).toBe(true);
  });

  it('逗号多赋值 x,y,z=... 也识别为直角坐标', () => {
    expect(pickFamily('x,y,z=cos(t),0,sin(t)').family).toBe('parameter');
  });

  it('混写两套坐标 → 明确报错（不猜）', () => {
    expect(() => pickFamily('x=cos(t);s1=t;dis=2')).toThrow(/同时写了/);
  });

  it('未写位置字段 → 默认 parameter', () => {
    expect(pickFamily('vx=0.1').family).toBe('parameter');
  });
});

describe('curve-lab：命令拼接槽位', () => {
  it('polar 族槽位与直角族一致（颜色/速度/begin/end 位置正确）', () => {
    const a = buildCommand({ expr: 's1=t;dis=2', tmax: 6.2832, step: 0.05 });
    const b = buildCommand({ expr: 'x=cos(t);z=sin(t)', tmax: 6.2832, step: 0.05 });
    expect(a.cmd).toContain('polarparameter');
    expect(b.cmd).toContain(' parameter ');
    // tmax 必须落在 end 槽位、step 紧随表达式之后
    expect(a.cmd).toContain('6.2832 \'s1=t;dis=2\' 0.05 200');
    expect(b.cmd).toContain('6.2832 \'x=cos(t);z=sin(t)\' 0.05 200');
  });

  it('生成的命令能被仓库解析器接受（槽位无错位）', async () => {
    const { parseCommands } = await import('../../src/command/parser');
    for (const expr of ['s1=t;s2=0;dis=2', 'x=cos(t);z=sin(t);y=0']) {
      const { cmd } = buildCommand({ expr, tmax: 6.2832 });
      expect(() => parseCommands(cmd.replace(/^\//, '')), expr).not.toThrow();
    }
  });
});

describe('curve-lab：数值快筛', () => {
  it('健康曲线：零 NaN、正跨度、闭环判定', () => {
    const r = scanCandidate({ expr: 'x=2*cos(t)+5*cos(2*t/3);z=2*sin(t)-5*sin(2*t/3)', tmax: 6 * Math.PI });
    expect(r.ok).toBe(true);
    expect(r.bad).toBe(0);
    expect(r.spread).toBeGreaterThan(5);
    expect(r.closure).toBeLessThan(0.01); // 闭合曲线
  });

  it('非闭合曲线给出大 close 值（如螺旋）', () => {
    const r = scanCandidate({ expr: 's1=t;dis=0.2*t', tmax: 6 * Math.PI });
    expect(r.ok).toBe(true);
    expect(r.closure).toBeGreaterThan(0.1);
  });

  it('表达式不写位置 → 判为不健康', () => {
    const r = scanCandidate({ expr: 'vx=1' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/毫无跨度/);
  });

  it('解析失败的片段返回错误而不是抛异常', () => {
    const r = scanCandidate({ expr: 'x=cos(' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/解析失败/);
  });

  it('polar 族的 dis 换算进位置值域', () => {
    const r = scanCandidate({ expr: 's1=t;s2=0;dis=2', tmax: Math.PI * 2 });
    expect(r.family).toBe('polarparameter');
    expect(r.range.x[1]).toBeCloseTo(2, 3);
    expect(r.range.z[1]).toBeCloseTo(2, 3);
  });
});

// curve-lab：数学曲线探索实验台（CBV-Math 专用）。
//
// 设计目标：把「想到一条曲线 → 验证它能变成好看的粒子效果」的循环做短。
// 输入刻意选**表达式片段**而不是完整命令：探索时只关心位置表达式，
// 命令族/槽位由本脚本补全（历史上多次在槽位错位上栽跟头）。
//
// 三个子命令：
//   scan <片段>            数值快筛：NaN/值域/闭环/建议 step（秒级，不渲染）
//   shot <片段> [--out p]  视觉快照：跑引擎 N tick → 等距投影 → PNG（我亲自看图）
//   sheet <片段...>        批量联系表：一次输出 2×N 网格，一张图对比全部候选
//
// 用法：
//   npx tsx scripts/curve-lab.ts scan "x=2*cos(t)+5*cos(2*t/3);z=2*sin(t)-5*sin(2*t/3)"
//   npx tsx scripts/curve-lab.ts shot "s1=t;dis=2+0.5*cos(5*t)" --tmax 12.56
//   npx tsx scripts/curve-lab.ts sheet "x=cos(t)" "x=cos(3*t)" --out .tmp/sheet.png
//
// 产物一律写 .tmp/（已 gitignore）；本文件本身入库（长期资产，见 wiki 方法论）。

import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { SimEngine } from '../src/sim/engine.ts';
import { parseCommands } from '../src/command/parser.ts';
import { ParticleStruct } from '../src/engine/struct.ts';
import { parse } from '../src/engine/index.ts';
import { particleProjection, fit } from '../src/render/iso2d.ts';

const SIM = {
  playerPos: { x: 0, y: 0, z: 0 },
  defaultLifetime: 20,
  maxParticles: 1000000,
  seed: 1,
  mcVersion: '26.2',
  gridSize: 10,
  gridVisible: true,
  renderMode: 'full',
  reference: 'none',
} as const;
const PARTICLE = 'minecraft:end_rod';

// ---------- 表达式片段 → 完整命令 ----------

/** 片段里出现的位置字段（用于判定该用哪一族命令） */
const POS_FIELDS = new Set(['x', 'y', 'z', 's1', 's2', 'dis']);

/** 片段写了哪些位置字段（含逗号多赋值 `x,y,z=...`） */
function writtenPosFields(expr: string): Set<string> {
  const out = new Set<string>();
  for (const m of expr.matchAll(/\b([a-zA-Z_][\w]*)\s*=/g)) {
    if (POS_FIELDS.has(m[1])) out.add(m[1]);
  }
  for (const m of expr.matchAll(/\(?\s*([xyz](?:\s*,\s*[xyz]){2})\s*\)?\s*=/g)) {
    for (const f of m[1].split(',')) if (POS_FIELDS.has(f.trim())) out.add(f.trim());
  }
  return out;
}

/** 自动选命令族：写 s1/s2/dis → polar 族；写 x/y/z → 直角族。
 *  这条规则来自模组源码（polar 分支只读 s1/s2/dis，ClientNetworkHandler.java:
 *  159-162）——选错族会让表达式被静默忽略、粒子全堆一点。 */
export function pickFamily(expr: string): { family: string; polar: boolean; note: string } {
  const w = writtenPosFields(expr);
  const cart = w.has('x') || w.has('y') || w.has('z');
  const sph = w.has('s1') || w.has('s2') || w.has('dis');
  if (cart && sph) {
    throw new Error(
      `片段同时写了直角坐标 [${[...w].filter((f) => 'xyz'.includes(f))}] 和球坐标 `
      + `[${[...w].filter((f) => !'xyz'.includes(f))}]——命令族只能读其中一套，`
      + '请拆成两条命令或统一到一套。',
    );
  }
  if (sph) return { family: 'polarparameter', polar: true, note: '球坐标 → polar 族' };
  if (cart) return { family: 'parameter', polar: false, note: '直角坐标 → parameter 族' };
  return { family: 'parameter', polar: false, note: '未写位置字段（沿用上次残留）' };
}

export interface LabCandidate {
  /** 位置表达式片段 */
  expr: string;
  /** t 起点（默认 0） */
  tmin?: number;
  /** t 终点（默认 2π） */
  tmax?: number;
  /** t 步长（不传 = scan 自动建议） */
  step?: number;
  /** 粒子寿命 tick（默认 200） */
  age?: number;
}

/** 片段 → 完整可执行命令文本 */
export function buildCommand(c: LabCandidate): { cmd: string; family: string; polar: boolean; note: string } {
  const { family, polar, note } = pickFamily(c.expr);
  const tmin = c.tmin ?? 0;
  const tmax = c.tmax ?? Math.PI * 2;
  const step = c.step ?? 0.03;
  const age = c.age ?? 200;
  // 槽位：<粒子> <位置> <颜色> <速度> <begin> <end> <表达式> [step] [age] [速度表达式] [speedStep] [group]
  const cmd = `/particleex ${family} ${PARTICLE} ~ ~2 ~ 1 0.95 0.89 1 0 0 0 `
    + `${num(tmin)} ${num(tmax)} '${c.expr}' ${num(step)} ${age} 'null' 1 null`;
  return { cmd, family, polar, note };
}

function num(v: number): string {
  // 去掉浮点尾巴（6.283185307179586 → 6.2832 太粗，保留 10 位有效数字）
  return Number(v.toPrecision(10)).toString();
}

// ---------- 数值快筛 ----------

export interface ScanReport {
  family: string;
  ok: boolean;
  /** 采样点总数 */
  samples: number;
  /** 产出 NaN/Inf 的采样点数 */
  bad: number;
  /** 位置值域（polar 族换算后） */
  range: { x: [number, number]; y: [number, number]; z: [number, number] };
  /** 首尾闭合（欧氏距离，相对尺度） */
  closure: number;
  /** 建议 step（按弧长均匀度） */
  suggestStep: number;
  /** 位置是否真的散开（跨度之和） */
  spread: number;
  error?: string;
}

/** t 全域扫描表达式，读出位置（不渲染）。polar 族按引擎公式换算。 */
export function scanCandidate(c: LabCandidate): ScanReport {
  const tmin = c.tmin ?? 0;
  const tmax = c.tmax ?? Math.PI * 2;
  const N = 2000;
  const dt = (tmax - tmin) / (N - 1);
  const { family, polar, note } = pickFamily(c.expr);
  const report: ScanReport = {
    family,
    ok: true,
    samples: 0,
    bad: 0,
    range: { x: [Infinity, -Infinity], y: [Infinity, -Infinity], z: [Infinity, -Infinity] },
    closure: NaN,
    suggestStep: c.step ?? 0.03,
    spread: 0,
  };
  let block: ReturnType<typeof parse>;
  try {
    block = parse(c.expr);
  } catch (e) {
    report.ok = false;
    report.error = `解析失败：${(e as Error).message}（${note}）`;
    return report;
  }
  const s = new ParticleStruct();
  let first: [number, number, number] | null = null;
  let last: [number, number, number] | null = null;
  let arc = 0;
  let prev: [number, number, number] | null = null;
  for (let i = 0; i < N; i++) {
    const t = tmin + i * dt;
    s.t = t;
    s.s1 = t; // polar 族的常用默认：极角跟着 t 走
    s.s2 = 0;
    s.x = 0; s.y = 0; s.z = 0;
    try {
      block.run(s);
    } catch (e) {
      report.ok = false;
      report.error = `求值失败（t=${t.toFixed(4)}）：${(e as Error).message}`;
      return report;
    }
    let x: number, y: number, z: number;
    if (polar) {
      x = s.dis * Math.cos(s.s2) * Math.cos(s.s1);
      y = s.dis * Math.sin(s.s2);
      z = s.dis * Math.cos(s.s2) * Math.sin(s.s1);
    } else {
      x = s.x; y = s.y; z = s.z;
    }
    report.samples++;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      report.bad++;
      continue;
    }
    report.range.x[0] = Math.min(report.range.x[0], x);
    report.range.x[1] = Math.max(report.range.x[1], x);
    report.range.y[0] = Math.min(report.range.y[0], y);
    report.range.y[1] = Math.max(report.range.y[1], y);
    report.range.z[0] = Math.min(report.range.z[0], z);
    report.range.z[1] = Math.max(report.range.z[1], z);
    const cur: [number, number, number] = [x, y, z];
    if (!first) first = cur;
    if (prev) arc += Math.hypot(x - prev[0], y - prev[1], z - prev[2]);
    prev = cur;
    last = cur;
  }
  if (first && last) {
    const diag = Math.hypot(
      report.range.x[1] - report.range.x[0],
      report.range.y[1] - report.range.y[0],
      report.range.z[1] - report.range.z[0],
    ) || 1;
    report.closure = Math.hypot(last[0] - first[0], last[1] - first[1], last[2] - first[2]) / diag;
  }
  report.spread = (report.range.x[1] - report.range.x[0])
    + (report.range.y[1] - report.range.y[0])
    + (report.range.z[1] - report.range.z[0]);
  // 建议 step：固定弧长密度（约 4000 个粒子铺满整条曲线）
  const target = 4000;
  if (arc > 0) report.suggestStep = (tmax - tmin) / target;
  if (!(report.spread > 0.01)) {
    report.ok = false;
    report.error = '位置毫无跨度（片段没有真正写位置变量）';
  }
  if (report.bad > 0) report.ok = false;
  return report;
}

// ---------- 视觉快照 ----------

const W = 420;
const H = 420;
const BG = '#0b0e14';
const GLYPH = 'rgba(210,225,255,0.9)';

function drawScene(
  ctx: import('@napi-rs/canvas').CanvasRenderingContext2D,
  engine: SimEngine,
  label: string,
  w: number,
  h: number,
  view: 'iso' | 'top' = 'iso',
): void {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  const parts = engine.snapshot();

  // 平面曲线（y 恒为常数）在等距投影下会被压成一条线——y=0 平面的水平方向
  // 只有一个自由度。探索形状用俯视（x→横、z→纵），看游戏内观感用等距。
  let map: (x: number, y: number, z: number) => { sx: number; sy: number };
  if (view === 'top') {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of parts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    if (!Number.isFinite(minX)) { minX = -5; maxX = 5; minZ = -5; maxZ = 5; }
    const sc = Math.max(1, Math.min((w * 0.82) / Math.max(maxX - minX, 1e-6),
      (h * 0.82) / Math.max(maxZ - minZ, 1e-6)));
    const ox = w / 2 - ((minX + maxX) / 2) * sc;
    const oy = h / 2 - ((minZ + maxZ) / 2) * sc;
    map = (x, _y, z) => ({ sx: ox + x * sc, sy: oy + z * sc });
  } else {
    const f = fit(parts as never, SIM.gridSize, w, h);
    map = (x, y, z) => particleProjection(x, y, z, f.scale, f.ox, f.oy);
  }

  // 坐标轴（暗色基准线，便于判断尺度与朝向）
  ctx.strokeStyle = '#1c2130';
  ctx.lineWidth = 1;
  for (const [ax, ay, az, bx, by, bz] of [
    [-5, 0, 0, 5, 0, 0], [0, -5, 0, 0, 5, 0], [0, 0, -5, 0, 0, 5],
  ]) {
    const a = map(ax, ay, az);
    const b = map(bx, by, bz);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = GLYPH;
  for (const p of parts) {
    const pr = map(p.x, p.y, p.z);
    ctx.beginPath();
    ctx.arc(pr.sx, pr.sy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#8fa0c0';
  ctx.font = '13px monospace';
  ctx.fillText(label, 10, 20);
  ctx.fillText(`n=${parts.length} · ${view === 'top' ? '俯视 x-z' : '等距'}`, 10, 38);
}

/** 跑一条候选，输出 PNG。返回粒子数与截图路径。 */
export async function shotCandidate(
  c: LabCandidate,
  outPath: string,
  view: 'iso' | 'top' = 'iso',
): Promise<{ path: string; spawned: number; errors: string[]; parts: number }> {
  const { cmd } = buildCommand(c);
  const en = new SimEngine(SIM as never);
  let spawned = 0;
  const errors: string[] = [];
  for (const parsed of parseCommands(cmd.replace(/^\//, ''))) {
    const r = en.runCommand(parsed);
    spawned += r.spawned;
    errors.push(...r.errors);
  }
  for (let i = 0; i < 6; i++) en.tickOnce();
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawScene(ctx, en, shortLabel(c.expr), W, H, view);
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  writeFileSync(resolve(outPath), canvas.toBuffer('image/png'));
  return { path: resolve(outPath), spawned, errors, parts: en.snapshot().length };
}

/** 批量联系表：2 列网格 */
export async function sheetCandidate(
  cands: LabCandidate[],
  outPath: string,
  view: 'iso' | 'top' = 'top',
): Promise<{ path: string; cells: number }> {
  const cols = Math.min(2, cands.length);
  const rows = Math.ceil(cands.length / cols);
  const canvas = createCanvas(W * cols, H * rows);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#05070b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < cands.length; i++) {
    const { cmd } = buildCommand(cands[i]);
    const en = new SimEngine(SIM as never);
    for (const parsed of parseCommands(cmd.replace(/^\//, ''))) en.runCommand(parsed);
    for (let k = 0; k < 6; k++) en.tickOnce();
    ctx.save();
    ctx.translate((i % cols) * W, Math.floor(i / cols) * H);
    drawScene(ctx, en, shortLabel(cands[i].expr), W, H, view);
    ctx.restore();
  }
  mkdirSync(dirname(resolve(outPath)), { recursive: true });
  writeFileSync(resolve(outPath), canvas.toBuffer('image/png'));
  return { path: resolve(outPath), cells: cands.length };
}

function shortLabel(expr: string): string {
  return expr.length > 52 ? expr.slice(0, 49) + '…' : expr;
}

// ---------- CLI ----------

function fmtRange(r: [number, number]): string {
  if (!Number.isFinite(r[0])) return '[—]';
  return `[${r[0].toFixed(2)}, ${r[1].toFixed(2)}]`;
}

function printReport(c: LabCandidate, r: ScanReport): void {
  const tag = r.ok ? '✓' : '✗';
  console.log(`${tag} ${shortLabel(c.expr)}`);
  console.log(`  族: ${r.family}`);
  console.log(`  采样: ${r.samples}  异常(NaN/Inf): ${r.bad}`);
  console.log(`  值域: x${fmtRange(r.range.x)} y${fmtRange(r.range.y)} z${fmtRange(r.range.z)}`
    + `  跨度=${r.spread.toFixed(2)}`);
  console.log(`  闭环: ${Number.isNaN(r.closure) ? '—' : r.closure.toFixed(4)}`
    + `（<0.01 视为闭合，适合无限循环）`);
  console.log(`  建议 step: ${r.suggestStep.toPrecision(3)}`);
  if (r.error) console.log(`  ! ${r.error}`);
}

async function main(): Promise<void> {
  const [sub, ...rest] = process.argv.slice(2);
  const flags = new Map<string, string>();
  const exprs: string[] = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) flags.set(a.slice(2), rest[++i] ?? '');
    else exprs.push(a);
  }
  const numFlag = (k: string): number | undefined => {
    const v = flags.get(k);
    return v === undefined ? undefined : Number(v);
  };
  const opts = (expr: string): LabCandidate => ({
    expr,
    tmin: numFlag('tmin'),
    tmax: numFlag('tmax'),
    step: numFlag('step'),
    age: numFlag('age'),
  });

  if (sub === 'scan') {
    if (!exprs.length) throw new Error('用法: scan <片段>');
    let allOk = true;
    for (const e of exprs) {
      const r = scanCandidate(opts(e));
      printReport(opts(e), r);
      if (!r.ok) allOk = false;
    }
    process.exitCode = allOk ? 0 : 1;
    return;
  }
  if (sub === 'shot') {
    if (!exprs.length) throw new Error('用法: shot <片段> [--out 路径] [--view iso|top]');
    const out = flags.get('out') ?? '.tmp/lab-shot.png';
    const view = (flags.get('view') === 'top' ? 'top' : 'iso') as 'iso' | 'top';
    const r = await shotCandidate(opts(exprs[0]), out, view);
    console.log(`✓ ${r.path}  粒子 ${r.parts}  生成 ${r.spawned}`
      + (r.errors.length ? `  错误: ${r.errors.join(' / ')}` : ''));
    return;
  }
  if (sub === 'sheet') {
    if (!exprs.length) throw new Error('用法: sheet <片段...> [--out 路径] [--view iso|top]');
    const out = flags.get('out') ?? '.tmp/lab-sheet.png';
    const view = (flags.get('view') === 'iso' ? 'iso' : 'top') as 'iso' | 'top';
    const r = await sheetCandidate(exprs.map(opts), out, view);
    console.log(`✓ ${r.path}  ${r.cells} 格`);
    return;
  }
  console.log(`curve-lab —— 数学曲线探索实验台

  scan  <片段...>           数值快筛（NaN/值域/闭环/建议 step）
  shot  <片段> [--out p]    视觉快照 PNG
  sheet <片段...> [--out p] 批量联系表（2 列）

通用参数：--tmin --tmax --step --age --view iso|top
  shot 默认 iso（游戏内观感）；sheet 默认 top（平面曲线看形状，等距会压成线）

示例：
  npx tsx scripts/curve-lab.ts scan "x=2*cos(t)+5*cos(2*t/3);z=2*sin(t)-5*sin(2*t/3)" --tmax 18.85
  npx tsx scripts/curve-lab.ts shot "s1=t;dis=2+0.5*cos(5*t)" --tmax 12.56 --out .tmp/rose.png
`);
}

// 直接执行时跑 CLI（被 import 时不跑）
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`
  || process.argv[1]?.endsWith('curve-lab.ts')) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}

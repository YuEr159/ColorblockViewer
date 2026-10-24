// 等距正交投影与静态参考绘制（快速 2D 口径）：世界 (x,y,z) → 屏幕 (x−z,
// y 向上) 的斜 45° 俯视，视角按粒子云包围盒自动适配。
//
// 纯函数模块、**不依赖 three**。分出来是为了让运行时 GIF 导出
// （exportCapture.ts）与快速模式视口（render2d.ts）共用同一份投影/网格/三轴
// 绘制，同时**不把 render2d 静态拉进首屏静态图**——exportCapture 被 App 静态
// 引入，若它直接 import render2d，会破坏 render2d 的按需分包（技术路线 §8）。

import type { RenderParticle } from './color';

// 等距投影系数（30° 等轴测）：sx = (x−z)·√3/2，sy = (x+z)·√3/4 − y
const KX = Math.sqrt(3) / 2;
const KY = Math.sqrt(3) / 4;

/** 世界坐标 → 视口内坐标（CSS px，y 向下；scale = px/世界块，ox/oy = 中心偏移）。
 *  纯函数，直测。 */
export function particleProjection(
  x: number,
  y: number,
  z: number,
  scale: number,
  ox: number,
  oy: number,
): { sx: number; sy: number } {
  return { sx: ox + (x - z) * KX * scale, sy: oy + (KY * (x + z) - y) * scale };
}

export interface ViewFit {
  scale: number; // 像素 / 世界块
  ox: number; // 云中心 → 视口中心 的 x 偏移（px）
  oy: number; // …y 偏移（px，向下为正）
}

/** 视角自动适配：云在 y=0 平面的投影包围盒 → 居中 + 等比缩放填满视口
 *  （上限 60px/block 防止稀疏粒子被放大成巨圆；下限 1）。
 *  无粒子（n=0）时按 grid 边长定框。纯函数，直测。 */
export function fit(parts: RenderParticle[], grid: number, w: number, h: number): ViewFit {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let n = 0;
  for (const p of parts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    n++;
  }
  if (n === 0) {
    const r = Math.max(grid, 10) / 2;
    minX = -r;
    maxX = r;
    minZ = -r;
    maxZ = r;
    minY = -r;
    maxY = r;
  }
  // 等距投影下云的投影包围盒
  const xMin = (minX - maxZ) * KX;
  const xMax = (maxX - minZ) * KX;
  const yMin = KY * (minX + minZ) - maxY;
  const yMax = KY * (maxX + maxZ) - minY;
  const spanX = Math.max(xMax - xMin, 4);
  const spanY = Math.max(yMax - yMin, 4);
  const scale = Math.max(1, Math.min(60, Math.min((w * 0.82) / spanX, (h * 0.82) / spanY)));
  return {
    scale,
    ox: w / 2 - ((xMin + xMax) / 2) * scale,
    oy: h / 2 - ((yMin + yMax) / 2) * scale,
  };
}

/** y=0 平面网格（内部细线 + 外框）：实况（Render2DViewport）与运行时
 *  GIF 导出（exportCapture.drawGifFrame）共用同一份绘制，保证导出画面与
 *  快速模式所见状一致。 */
export function drawIsoGrid(ctx: CanvasRenderingContext2D, f: ViewFit, gridSize: number): void {
  const n = gridSize;
  const lo = Math.floor(-n / 2);
  const hi = Math.floor(n / 2);
  ctx.strokeStyle = '#1c2130';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = lo; i <= hi; i++) {
    // x 线（沿 x 轴）/ z 线（沿 z 轴），y=0 平面
    let a = particleProjection(i, 0, lo, f.scale, f.ox, f.oy);
    let b = particleProjection(i, 0, hi, f.scale, f.ox, f.oy);
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    a = particleProjection(lo, 0, i, f.scale, f.ox, f.oy);
    b = particleProjection(hi, 0, i, f.scale, f.ox, f.oy);
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
  }
  ctx.stroke();
  ctx.strokeStyle = '#3a4150'; // 外框，与 3D GridHelper 主色一致
  ctx.beginPath();
  const c0 = particleProjection(lo, 0, lo, f.scale, f.ox, f.oy);
  const c1 = particleProjection(hi, 0, lo, f.scale, f.ox, f.oy);
  const c2 = particleProjection(hi, 0, hi, f.scale, f.ox, f.oy);
  const c3 = particleProjection(lo, 0, hi, f.scale, f.ox, f.oy);
  ctx.moveTo(c0.sx, c0.sy);
  ctx.lineTo(c1.sx, c1.sy);
  ctx.lineTo(c2.sx, c2.sy);
  ctx.lineTo(c3.sx, c3.sy);
  ctx.closePath();
  ctx.stroke();
}

/** 三轴（与 3D AxesHelper(2) 同长同色）：实况与 GIF 导出共用。 */
export function drawIsoAxes(ctx: CanvasRenderingContext2D, f: ViewFit): void {
  const L = 2; // 与 3D AxesHelper(2) 一致
  const axis = (dx: number, dy: number, dz: number, color: string) => {
    const a = particleProjection(0, 0, 0, f.scale, f.ox, f.oy);
    const b = particleProjection(dx, dy, dz, f.scale, f.ox, f.oy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  };
  axis(L, 0, 0, '#c0392b'); // x 红
  axis(0, L, 0, '#27ae60'); // y 绿
  axis(0, 0, L, '#2980b9'); // z 蓝
}

// 快速模式渲染层：Canvas 2D 点云（无 WebGL、**不加载 three**）。
// 与 SimViewport（完整模式）接口对齐（update/setGrid/resize/start/stop/dispose/
// setAtlasKey/setPointScale），App 按 sim.renderMode 条件加载二选一。
//
// 仿真引擎在两种模式下 1:1 照常运行（位置/颜色/寿命完全保留）；快速模式只丢
// 贴图外观——粒子画成颜色圆点（色值口径与完整模式同一份：color.ts particleVisual，
// 含类型微调/多帧淡出/end_rod 颜色插值），以 `lighter`（加色）近似 3D 的
// AdditiveBlending，软边缘径向渐变近似圆点着色器的 smoothstep 光晕。
//
// 等距正交投影（无透视）：世界 (x,y,z) → 屏幕 (x−z, y 向上) 的斜 45° 俯视
// （与完整模式 OrbitControls 缺省视角观感一致，y 仍为竖直轴）。视角自动适配：
// 每帧按粒子云包围盒（无粒子时按网格尺寸）居中 + 缩放，粒子云飘出视野不会
// 丢失。rAF 带脏检查：仅 update()（tick 后）标记的帧重绘，空闲不消耗 GPU/CPU。

import { particleVisual, type RenderParticle } from './color';
import { particleProjection, fit, drawIsoGrid, drawIsoAxes, type ViewFit } from './iso2d';
import type { SnapshotSource } from './sync';
import type { ReferenceType } from './reference';

// 投影/适配/参考绘制在 iso2d.ts（纯函数、无 three）——运行时 GIF 导出与快速
// 模式共用同一份；此处再导出，保持既有调用点（exportCapture/tests）与
// 历史导入路径不变。
export { particleProjection, fit, drawIsoGrid, drawIsoAxes, type ViewFit };

/** 快速模式视口。接口与 SimViewport 对齐（App 侧统一按 ViewportApi 调用）。
 *  setPointScale 为空操作（2D 无透视换算）；setAtlasKey 记录版本供帧表查询。 */
export class Render2DViewport {
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private parts: RenderParticle[] = [];
  private raf = 0;
  private running = false;
  private dirty = false;
  private max: number;
  private gridSize = 10;
  private gridVisible = true;
  /** 游戏版本（帧表按它分区；与完整模式一致） */
  private atlasKey = '26.2';

  sizeMul = 1;
  alphaMul = 1;

  /** 与 SimViewport 对齐的空操作字段（快速模式无预热阶段；App 无条件安装回调，
   *  本类从不调用 → 无进度上报，进度条不出现）。 */
  onProgress: ((stage: 'atlas' | 'ready', frac: number, label?: string) => void) | null = null;

  constructor(container: HTMLElement, maxParticles: number, atlasKey = '26.2') {
    this.max = maxParticles;
    this.atlasKey = atlasKey;
    const cv = document.createElement('canvas');
    cv.style.display = 'block';
    cv.style.width = '100%';
    cv.style.height = '100%';
    container.appendChild(cv);
    this.canvas = cv;
    this.ctx = cv.getContext('2d');
    this.resize();
  }

  /** 运行时导出（截图/GIF 帧源）：快速模式 2D 画布 */
  get exportCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  get size(): number {
    return this.canvas ? this.canvas.clientHeight : 0;
  }

  /** 与 SimViewport 对齐：记录版本（2D 无贴图加载，色值口径的帧表查询按它分区）。 */
  setAtlasKey(key: string): void {
    if (key !== this.atlasKey) {
      this.atlasKey = key;
      this.dirty = true;
    }
  }

  /** 与 SimViewport 对齐的空操作（2D 无透视换算，pxPerBlock 由 fit 自适应）。 */
  setPointScale(_heightPx: number, _fovDeg: number): void {}

  setGrid(size: number, visible: boolean): void {
    if (size !== this.gridSize || visible !== this.gridVisible) {
      this.gridSize = size;
      this.gridVisible = visible;
      this.dirty = true;
    }
  }

  /** 参照物：2D 等距视图无 3D 道具，空操作（接口对齐 SimViewport） */
  setReference(_type: ReferenceType): void {}

  setSizeMul(v: number): void {
    this.sizeMul = v;
    this.dirty = true;
  }

  setAlphaMul(v: number): void {
    this.alphaMul = v;
    this.dirty = true;
  }

  /** tick/命令后调用：记录粒子快照并标脏。返回可见粒子数（截断到容量上限）。 */
  update(source: SnapshotSource): number {
    this.parts = source.snapshot().slice(0, this.max);
    this.dirty = true;
    return this.parts.length;
  }

  resize(): void {
    if (!this.canvas) return;
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.dirty = true;
  }

  /** 渲染循环（脏检查：仅 update/setGrid/resize 标脏的帧重绘）。 */
  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      if (this.dirty) {
        this.dirty = false;
        this.draw();
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose(): void {
    this.stop();
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }

  private draw(): void {
    const ctx = this.ctx;
    const cv = this.canvas;
    if (!ctx || !cv) return;
    const w = cv.width;
    const h = cv.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0e14'; // 与完整模式 scene 背景一致
    ctx.fillRect(0, 0, w, h);
    const f = fit(this.parts, this.gridSize, w, h);
    if (this.gridVisible) this.drawGrid(ctx, f);
    this.drawAxes(ctx, f);
    const comp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter'; // 近似 AdditiveBlending
    for (const p of this.parts) {
      const v = particleVisual(p, 1, this.atlasKey, this.sizeMul, this.alphaMul);
      if (v.a <= 0.004) continue; // 与 3D 着色器 discard 阈值一致
      const pr = particleProjection(p.x, p.y, p.z, f.scale, f.ox, f.oy);
      const radius = Math.max(v.radius * f.scale, 0.5);
      ctx.globalAlpha = Math.min(1, v.a);
      if (radius < 1.5) {
        ctx.fillStyle = `rgb(${Math.round(v.r * 255)},${Math.round(v.g * 255)},${Math.round(v.b * 255)})`;
        ctx.beginPath();
        ctx.arc(pr.sx, pr.sy, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 软光晕（近似 3D 圆点着色器 smoothstep(1, 0.2, d) 的衰减）
        const g = ctx.createRadialGradient(pr.sx, pr.sy, 0, pr.sx, pr.sy, radius);
        const rgb = (a: number) =>
          `rgba(${Math.round(v.r * 255)},${Math.round(v.g * 255)},${Math.round(v.b * 255)},${a})`;
        g.addColorStop(0, rgb(1));
        g.addColorStop(0.2, rgb(1));
        g.addColorStop(1, rgb(0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pr.sx, pr.sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = comp;
  }

  private drawGrid(ctx: CanvasRenderingContext2D, f: ViewFit): void {
    drawIsoGrid(ctx, f, this.gridSize);
  }

  private drawAxes(ctx: CanvasRenderingContext2D, f: ViewFit): void {
    drawIsoAxes(ctx, f);
  }
}

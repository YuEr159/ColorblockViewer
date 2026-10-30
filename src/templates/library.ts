// 模板库：精编粒子效果模板（中文名 + 说明 + 标签 + 游戏内可直接使用的命令文本）。
//
// 硬性约定（tests/templates/library.test.ts 逐条守护）：
//  ① 每条模板都能被本仓库解析器结构化（parseCommands 成功）；
//  ② 通过**游戏内格式检查**（checkCommandsFormat）—— 表达式一律带单引号，
//     复制出去就是 brigadier 合法格式，可直接粘进游戏；
//  ③ 预览引擎实跑零错误、spawned > 0（不会出现「看着有模板、一点就报错」）；
//  ④ 粒子必须真的散开（空间包围盒跨度 > 0.5 格）——只查 spawned>0 抓不到
//     「polar 族写了 x/z 导致粒子全堆在原点」这类静默失败。
//
// ⚠️ polar 族（polarparameter/rgbapolarparameter/tickpolarparameter…）的表达式
// **只读 s1/s2/dis**，写了 x/y/z 会被完全忽略（模组 ClientNetworkHandler.java:
// 159-162 逐字如此）。平面/直角坐标曲线必须用非 polar 族（parameter/rgbaparameter）。
//
// 约定：多行模板 = 多条命令（同一模板内的命令一起载入）；`vel` 提示用于说明
// 为什么要给非零命令速度（模组零速命令会触发 stop 回滚，粒子被钉住不动）。

export interface Template {
  id: string;
  /** 中文名（列表主标题） */
  name: string;
  /** 一句话说明：效果 + 命令要点 */
  desc: string;
  /** 标签：子命令 / 类型 / 原版运动学亮点 */
  tags: string[];
  /** 命令文本（含 `/` 前缀，可直接复制进游戏；多行按顺序载入） */
  cmds: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'ripple',
    name: '涟漪波面（conditional 表达式）',
    desc: '用条件表达式筛出「水面波形」的网格点，再让每个粒子沿法向做波动 —— 用户实战范例，随 t 向外扩散。',
    tags: ['conditional', '表达式', 'end_rod'],
    cmds: [
      "/particleex conditional minecraft:end_rod ~ ~ ~ 1 0.95 0.89 1 0 0 0 8 0.6 8 '(abs(y-0.5*exp(0-(x^2+z^2)/3.24)*cos(5.236*sqrt(x^2+z^2)))<0.05)&(sqrt(x^2+z^2)<8)' 0.1 200 'vy=0.5*exp(0-(sqrt(dx^2+dz^2)-0.06*t-0.03)*(sqrt(dx^2+dz^2)-0.06*t-0.03)/3.24)*(0.3142*sin(5.236*(sqrt(dx^2+dz^2)-0.06*t-0.03))+0.03704*(sqrt(dx^2+dz^2)-0.06*t-0.03)*cos(5.236*(sqrt(dx^2+dz^2)-0.06*t-0.03)))' 1 null",
    ],
  },
  {
    id: 'ring',
    name: '圆周环（polarparameter 环形速度）',
    desc: '极坐标参数命令摆出一个圆环，切向速度表达式随 t 指数衰减 → 粒子绕圈流动渐趋静止。',
    tags: ['polarparameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex polarparameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 6.2832 'dis=0.05;s1=t;s2=0' 0.0628 20 '(vx,vy,vz)=(0.25*exp(0-(t+0.5)/8)*cos(s1),0,0.25*exp(0-(t+0.5)/8)*sin(s1))' 1 null",
    ],
  },
  {
    id: 'chladni',
    name: '克拉德尼节线纹（conditional 模态筛点）',
    desc: '方形板驻波模态 cos(nπx/L)cos(mπz/L)+cos(mπx/L)cos(nπz/L) 的零值等值线筛点 —— 金属板撒沙振动后的花纹，静态零时间项。',
    tags: ['conditional', '表达式', 'end_rod'],
    cmds: [
      "/particleex conditional minecraft:end_rod ~ ~ ~ 1 0.95 0.89 1 0 0 0 8 0 8 'abs(cos(0.6283185307179587*x)*cos(0.9424777960769379*z)+cos(0.9424777960769379*x)*cos(0.6283185307179587*z))<0.07' 0.05 200 null 1 null",
    ],
  },
  {
    id: 'hypotrochoid',
    name: '万花尺繁花（hypotrochoid 内旋线）',
    desc: '小圆在定圆内滚动：x=(R−r)cos(t)+d·cos((R−r)t/r)，z=(R−r)sin(t)−d·sin((R−r)t/r) —— R=5 r=3 d=5 转五圈闭合，三旋钮调出万花筒图案。',
    tags: ['parameter', '表达式', 'end_rod'],
    cmds: [
      // 平面曲线用 parameter 族（读 x/y/z）；polar 族只认 s1/s2/dis，写 x/z 会被忽略
      "/particleex parameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 18.84955592153876 'x=2*cos(t)+5*cos(2*t/3);z=2*sin(t)-5*sin(2*t/3);y=0' 0.03 200 'null' 1 null",
    ],
  },
  {
    id: 'superformula',
    name: '超级公式五瓣花（Gielis 极坐标轮廓）',
    desc: 'r=[|cos(mφ/4)|^n+|sin(mφ/4)|^n]^(−1/n1) 的五瓣星花（m=5, n=1.7）—— 一条公式从圆到多边形到花瓣的形态变换器，随方位角转色相。',
    tags: ['rgbapolarparameter', '表达式', 'end_rod'],
    cmds: [
      // polar 族写法：s1=极角(取 t)、s2=0(水平面)、dis=r(s1) 即极坐标半径
      "/particleex rgbapolarparameter minecraft:end_rod ~ ~2 ~ 0 0 0 0 18.84955592153876 's1=t;s2=0;dis=(abs(cos(5*s1/4))^1.7+abs(sin(5*s1/4))^1.7)^(-0.5882352941176471)*1.8;cr=0.5+0.5*cos(s1);cg=0.5+0.5*cos(s1+2.0943951023931953);cb=0.5+0.5*cos(s1+4.1887902047863905);alpha=1' 0.03 200 'null' 1 null",
    ],
  },
  {
    id: 'breathing',
    name: '呼吸圆环（社区最高频·正弦径向速度）',
    desc: 'polarparameter 摆出半径 2 的圆环，速度 = 当前位置 × 正弦呼吸系数 i=0.1*sin(t/5) —— 整个构型周期性胀缩（周期 ≈31 tick），B 站社区最高频用法，改 0.1/5 调幅度与快慢。',
    tags: ['polarparameter', '表达式', 'vel'],
    cmds: [
      // polar 族：s1=t 扫极角、s2=0 水平面、dis=2 定半径；速度表达式里 x/y/z 由引擎按球坐标反算
      "/particleex polarparameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 6.2832 's1=t;s2=0;dis=2' 0.3 200 'i=0.1*sin(t/5);(vx,vy,vz)=(x*i,y*i,z*i)' 1 null",
    ],
  },
  {
    id: 'fireworkball',
    name: '烟花球（球面枚举 144 粒一次炸开）',
    desc: '一维 t 锯齿扫球面：s2=0.35*floorMod(floor(t/16),9)-1.4（9 层仰角）× s1=0.4*t（每层 16 点一圈），粒子生成在球心，速度沿径向 0.3 —— 原版摩擦 0.96 自然减速，扩散渐近约 7.5 格后下垂。',
    tags: ['tickpolarparameter', '表达式', 'vel'],
    cmds: [
      "/particleex tickpolarparameter minecraft:end_rod ~ ~8 ~ 1 0.95 0.89 1 0 0 0 0 143 's2=0.35*floorMod(floor(t/16),9)-1.4;s1=0.4*t;dis=0.01' 1 144 200 '(vx,vy,vz)=(x/dis*0.3,y/dis*0.3,z/dis*0.3)' 1 null",
    ],
  },
  {
    id: 'nebula',
    name: '星云（球内随机分布 + 密度衰减 + 颜色渐变）',
    desc: '每 tick 5 粒随机撒在球内：方向全向随机（s1/s2 各配一个 random），dis=4*pow(random(),2) 使中心浓外缘稀（密度∝1/r），颜色随半径蓝白→深紫渐变，带微随机漂移 —— DynFirework nebula 型的引擎落法。',
    tags: ['rgbatickpolarparameter', '表达式', 'vel'],
    cmds: [
      "/particleex rgbatickpolarparameter minecraft:end_rod ~ ~5 ~ 0 0 0 0 200 's1=6.2832*random();s2=3.14159*random()-1.5708;dis=4*pow(random(),2);cr=0.6+0.4*(1-dis/4);cg=0.5+0.3*(1-dis/4);cb=1;alpha=1;vx=0.01*random()-0.005;vy=0.01*random()-0.005;vz=0.01*random()-0.005' 1 5 200 'null' 1 null",
    ],
  },
  {
    id: 'butterfly',
    name: '蝴蝶曲线（Fay 1989，极坐标精细结构）',
    desc: 'r=e^sinθ−2cos4θ+sin⁵((2θ−π)/24)，θ∈[0,24π]——Temple Fay 1989 年的经典蝴蝶。第三项是翅膀倾斜修正（少了它两翼不对称）；24π 的扫描范围是曲线闭合的必要条件，缩到 2π 只能画出一个小瓣。',
    tags: ['polarparameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex polarparameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 75.39822368615504 's1=t;s2=0;dis=exp(sin(t))-2*cos(4*t)+pow(sin((2*t-PI)/24),5)' 0.02 200 'null' 1 null",
    ],
  },
  {
    id: 'spherespiral',
    name: '球面螺旋（等角缠绕，一维 t 扫两个角）',
    desc: 's1=t 转方位、s2=0.05*t 稳步抬仰角、dis=4 定半径——一条参数同时扫两个角，得到球面上等角间距的螺旋。取 s2 上限 1.25 rad（8π×0.05）停在北半球，要绕满全球把 0.05 改小。求值只要 30ns，是库里最省的 3D 模板。',
    tags: ['polarparameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex polarparameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 25.132741228718345 's1=t;s2=0.05*t;dis=4' 0.03 200 'null' 1 null",
    ],
  },
  {
    id: 'torusknot',
    name: '环面结 (5,2)（3D 拓扑曲线）',
    desc: 'x=(R+r·cos qt)cos pt 一组参数方程绕环面两圈，p=5 绕主轴、q=2 绕管——(p,q) 互质才是不打结的单一闭合曲线，改这组数就换一种结法。y=r·sin qt 让它离开水平面，是库里第一条真正意义上的 3D 曲线。',
    tags: ['parameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex parameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 6.283185307179586 'x=(2+0.8*cos(2*t))*cos(5*t);z=(2+0.8*cos(2*t))*sin(5*t);y=0.8*sin(2*t)' 0.02 200 'null' 1 null",
    ],
  },
  {
    id: 'thomas',
    name: 'Thomas 环（混沌吸引子 · 速度场积分）',
    desc: 'vx=sin(y)−bx, vy=sin(z)−by, vz=sin(x)−bz (b=0.208186) —— 速度场每 tick 积分一次，粒子被吸引到环面状吸引子并在其上混沌游走。sin 的天然有界性让它成为唯一不数值发散的经典吸引子（洛伦兹/罗斯勒/Aizawa/Halvorsen 在 20TPS 显式欧拉下全部爆掉，实测记录见 wiki）。范围 0.6 让出生点散开——所有粒子完全同点会沿同一条轨迹重合。',
    tags: ['normal', '表达式', 'vel'],
    cmds: [
      "/particleex normal minecraft:end_rod 0 1 0 1 0.95 0.89 1 0 0 0 0.6 0.6 0.6 1000 900 'u=0.15*sin(y)-0.0312279*x;v=0.15*sin(z)-0.0312279*y;w=0.15*sin(x)-0.0312279*z;(vx,vy,vz)=(u*0.45,v*0.45,w*0.45)' 1 null",
    ],
  },
];

/** 按 id 查模板（分享链接/测试用） */
export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** 模板命令文本（多行用 \n 连接），即「复制」按钮写进剪贴板的内容 */
export function templateText(t: Template): string {
  return t.cmds.join('\n');
}

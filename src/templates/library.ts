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
  {
    id: 'torus',
    name: '环面（一维 t 拆双参数）',
    desc: 'x=(R+r·cos v)cos u、z=(R+r·cos v)sin u、y=r·sin v —— 经典甜甜圈。引擎只有一维 t，这里用两个互质频率造双参数：u=t 快转、v=0.058824·t 慢抬（≈1/17，非整数比才遍历整张面）。把 0.058824 改成 1/7 会看到明显的螺旋条纹而不是均匀铺面。',
    tags: ['parameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex parameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 251.32741228718345 'u=t;v=t*0.058824;x=(2+0.8*cos(v))*cos(u);z=(2+0.8*cos(v))*sin(u);y=0.8*sin(v)' 0.12 200 'null' 1 null",
    ],
  },
  {
    id: 'mobius',
    name: 'Möbius 带（单侧曲面）',
    desc: 'x=(2+v·cos(u/2))cos u、z=(2+v·cos(u/2))sin u、y=v·sin(u/2) —— 半扭转的纸带，只有一个面。u/2 是关键：扭转率取一半，走完一圈 (u=2π) 只转 180°，带子首尾相接时正好翻面。v 用 sin 限幅（±1.5）保持带宽不随 t 无限增长。',
    tags: ['parameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex parameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 314.1592653589793 'u=t;v=1.5*sin(t*0.043478);x=(2+v*cos(u/2))*cos(u);z=(2+v*cos(u/2))*sin(u);y=v*sin(u/2)' 0.1 200 'null' 1 null",
    ],
  },
  {
    id: 'gyroid',
    name: 'Gyroid 极小曲面（隐式等值面）',
    desc: 'sin x·cos y + sin y·cos z + sin z·cos x ≈ 0 的三周期极小曲面——肥皂膜在周期性边界下的自然形状，化学里做模板材料的结构。用 conditional 在 6×6×6 立方里筛等值面（带宽 0.15）：每三个轴各跑一次 sin/cos，命中率约 10%。代价是空扫 30 万点、生成近 8 千粒——这是本库最重的一条，想轻量就把范围或带宽调小。',
    tags: ['conditional', '表达式', 'vel'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 3 0 1 0.95 0.89 1 0 0 0 6 6 6 'abs(sin(x)*cos(y)+sin(y)*cos(z)+sin(z)*cos(x))<0.15' 0.28 200 null 1 null",
    ],
  },
  {
    id: 'mandelbrot',
    name: '曼德博集合（20 次迭代展开）',
    desc: 'z←z²+c 迭代 20 次不逃逸（|z|²<4）的点构成——分形几何的图腾。引擎没有循环，迭代靠**顺序赋值展开**：每次迭代结果写进新变量（zr1/zi1 → zr2/zi2…），长度线性增长且括号深度只有 1。注意不能用符号展开（把 zr1 的式子内联进 zr2），那会指数膨胀直接卡死解析器。改次数只需增减 zrN/ziN 两行。',
    tags: ['conditional', '表达式', '分形'],
    cmds: [
      "/particleex conditional minecraft:end_rod -1 0 0 1 0.95 0.89 1 0 0 0 1.5 1.5 0 'zr0=0;zi0=0;zr1=zr0*zr0-zi0*zi0+x;zi1=2*zr0*zi0+y;zr2=zr1*zr1-zi1*zi1+x;zi2=2*zr1*zi1+y;zr3=zr2*zr2-zi2*zi2+x;zi3=2*zr2*zi2+y;zr4=zr3*zr3-zi3*zi3+x;zi4=2*zr3*zi3+y;zr5=zr4*zr4-zi4*zi4+x;zi5=2*zr4*zi4+y;zr6=zr5*zr5-zi5*zi5+x;zi6=2*zr5*zi5+y;zr7=zr6*zr6-zi6*zi6+x;zi7=2*zr6*zi6+y;zr8=zr7*zr7-zi7*zi7+x;zi8=2*zr7*zi7+y;zr9=zr8*zr8-zi8*zi8+x;zi9=2*zr8*zi8+y;zr10=zr9*zr9-zi9*zi9+x;zi10=2*zr9*zi9+y;zr11=zr10*zr10-zi10*zi10+x;zi11=2*zr10*zi10+y;zr12=zr11*zr11-zi11*zi11+x;zi12=2*zr11*zi11+y;zr13=zr12*zr12-zi12*zi12+x;zi13=2*zr12*zi12+y;zr14=zr13*zr13-zi13*zi13+x;zi14=2*zr13*zi13+y;zr15=zr14*zr14-zi14*zi14+x;zi15=2*zr14*zi14+y;zr16=zr15*zr15-zi15*zi15+x;zi16=2*zr15*zi15+y;zr17=zr16*zr16-zi16*zi16+x;zi17=2*zr16*zi16+y;zr18=zr17*zr17-zi17*zi17+x;zi18=2*zr17*zi17+y;zr19=zr18*zr18-zi18*zi18+x;zi19=2*zr18*zi18+y;zr20=zr19*zr19-zi19*zi19+x;zi20=2*zr19*zi19+y;abs(zr20*zr20+zi20*zi20)<4' 0.035 200 null 1 null",
    ],
  },
  {
    id: 'julia',
    name: 'Julia 集 c=−0.8+0.156i（16 次迭代）',
    desc: '同样是 z←z²+c 迭代，但 c 固定、初值取采样点 (x,y)——得到的是Julia 集而非曼德博集。换 c 就换一朵花：−0.8+0.156i 是经典的「兔耳」形，0.285+0.01i 更接近圆形，−0.4+0.6i 是细长的旋臂。改这两个常数即可探索整个 c 平面。',
    tags: ['conditional', '表达式', '分形'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 1.5 1.5 0 'zr0=x;zi0=y;zr1=zr0*zr0-zi0*zi0+(0-0.8);zi1=2*zr0*zi0+0.156;zr2=zr1*zr1-zi1*zi1+(0-0.8);zi2=2*zr1*zi1+0.156;zr3=zr2*zr2-zi2*zi2+(0-0.8);zi3=2*zr2*zi2+0.156;zr4=zr3*zr3-zi3*zi3+(0-0.8);zi4=2*zr3*zi3+0.156;zr5=zr4*zr4-zi4*zi4+(0-0.8);zi5=2*zr4*zi4+0.156;zr6=zr5*zr5-zi5*zi5+(0-0.8);zi6=2*zr5*zi5+0.156;zr7=zr6*zr6-zi6*zi6+(0-0.8);zi7=2*zr6*zi6+0.156;zr8=zr7*zr7-zi7*zi7+(0-0.8);zi8=2*zr7*zi7+0.156;zr9=zr8*zr8-zi8*zi8+(0-0.8);zi9=2*zr8*zi8+0.156;zr10=zr9*zr9-zi9*zi9+(0-0.8);zi10=2*zr9*zi9+0.156;zr11=zr10*zr10-zi10*zi10+(0-0.8);zi11=2*zr10*zi10+0.156;zr12=zr11*zr11-zi11*zi11+(0-0.8);zi12=2*zr11*zi11+0.156;zr13=zr12*zr12-zi12*zi12+(0-0.8);zi13=2*zr12*zi12+0.156;zr14=zr13*zr13-zi13*zi13+(0-0.8);zi14=2*zr13*zi13+0.156;zr15=zr14*zr14-zi14*zi14+(0-0.8);zi15=2*zr14*zi14+0.156;zr16=zr15*zr15-zi15*zi15+(0-0.8);zi16=2*zr15*zi15+0.156;abs(zr16*zr16+zi16*zi16)<4' 0.035 200 null 1 null",
    ],
  },
  {
    id: 'quasicrystal',
    name: '五重准晶（Dekking 构造）',
    desc: '五个方向的余弦波叠加取等值线——每对方向夹角 72°，叠加出的花纹有**五重旋转对称**，这是普通晶体（只能 2/3/4/6 重）做不到的，准晶因此直到 1982 年才被承认（2011 年诺贝尔化学奖）。改五条 cos 的角度常数可换成 7 重、8 重；表达式只有 87 字符，却比 880 字符的分形还密。',
    tags: ['conditional', '表达式', '准晶'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 5 5 0 'abs(cos(x)+cos(0.309*x+0.951*z)+cos(-x)+cos(-0.309*x-0.951*z)+cos(0.809*x+0.588*z))<0.6' 0.1 200 null 1 null",
    ],
  },
  {
    id: 'hyperbolic',
    name: '双曲镶嵌（庞加莱圆盘的环族）',
    desc: 'sin(log(1−0.95·dis)·5)≈0 的等值环——环间距按对数增长，正是庞加莱圆盘上双曲距离 r=2·atanh(|z|) 的等距环。欧氏距离上越靠边越密、越靠中心越疏，这个「越边越挤」的视觉就是双曲几何的特征。⚠️ 扫描范围必须是 `3 0 3`（x-z 平面）——写成 `3 3 0` 会让 s1 只取 0/π 两个值（y 恒为 0 时 atan2(y-height, x) 退化），所有角度相关的条件都失效。',
    tags: ['conditional', '表达式', '非欧几何'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 0 3 'abs(sin(log(1-dis*0.95)*5))<0.5 & dis<0.93' 0.015 200 null 1 null",
    ],
  },
  {
    id: 'chirikov',
    name: 'Chirikov 标准映射（KAM 岛与混沌海）',
    desc: 'sin(3πx+z)−0.5sin(z)≈0 的等值线——Chirikov 标准映射 p′ = p+(K/2π)sin(2πθ)、θ′ = θ+p′ 的相空间结构。这是动力系统里最经典的「有序与混沌共存」模型：岛状区域（KAM 环）里轨道规则，海里的轨道混沌。K 取 3（表达式里 3*x*PI 的系数）已经越过 KAM 破裂阈值。',
    tags: ['conditional', '表达式', '动力系统'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 0 'abs(sin(3*x*3.14159+z)-sin(z)*0.5)<0.15' 0.03 200 null 1 null",
    ],
  },
  {
    id: 'tubeknot',
    name: '管状纽结（绕轴扭动的实体管）',
    desc: '在环面结的路径上加一个绕轴的旋转角 v+3t —— 中心线走 (3,2) 结，每个点上再画一个半径 0.5 的管截面。与 torusknot 的区别：那条是线，这条是**有粗细的管**，v+3t 的相位让管身沿路径扭转（扭转率 3，改这个数看管身缠绕疏密）。y=2sin(3t) 让整条结离开水平面成为真 3D。',
    tags: ['parameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 37.69911184307752 'u=t;v=6.2832*sin(t*0.05);x=(2+0.5*cos(v+3*t))*cos(2*t);z=(2+0.5*cos(v+3*t))*sin(2*t);y=2*sin(3*t)+0.5*sin(v+3*t)' 0.06 200 'null' 1 null",
    ],
  },
  {
    id: 'klein',
    name: 'Klein 瓶（8 字形嵌入 R³）',
    desc: 'r=3+cos(u/2)sin v−sin(u/2)sin 2v 的「8 字形」嵌入——Klein 瓶是不可定向闭曲面（没有内外之分），在三维空间里只能自交，这个经典参数化让瓶颈穿过瓶身。注意 cos(u/2)、sin(u/2) 用的是**半角**：走完一圈 u=2π 时半角只转 π，正是这个半扭转让两端能「反向」接上。占格 862，是本库覆盖面最广的参数曲面。',
    tags: ['parameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 502.6548245743669 'u=t;v=6.2832*sin(t*0.02);c=cos(u*0.5);s=sin(u*0.5);r=3+c*sin(v)-s*sin(2*v);x=r*cos(u);z=r*sin(u);y=s*sin(v)+c*sin(2*v)' 0.06 200 'null' 1 null",
    ],
  },
  {
    id: 'dipole',
    name: '磁偶极场线（r=r₀sin²θ 族）',
    desc: 'r=3sin²θ、绕 y 轴旋转——这是理想偶极子磁场线的极坐标方程（地球辐射带、太阳磁场、条形磁铁的铁屑图案都是这个形状）。θ 用 abs(sin) 在 0.35..1.55 之间来回扫，ph=t 让每条线绕轴转一圈，于是同一族场线被涂成一整个回转面。改 3 是磁矩强度（场线尺度的立方根），改 0.35 是最近点距离（太接近原点会钻进「磁铁」内部）。',
    tags: ['parameter', '表达式', 'end_rod'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 188.4955592153876 'th=0.35+1.2*abs(sin(t*0.0159));r=3*sin(th)*sin(th);ph=t;x=r*sin(th)*cos(ph);z=r*sin(th)*sin(ph);y=r*cos(th)' 0.05 200 'null' 1 null",
    ],
  },
  {
    id: 'interference',
    name: '双源干涉（3D 驻波干涉面）',
    desc: '两点源球面波之差 |cos(r₁−r₂)|>0.9 的等值面——两波同相加强处结成双曲面族，正是杨氏双缝的 3D 推广。r₁/r₂ 用 sqrt((x∓2)²+y²+z²) 手写（hypot 只有 2 参重载，3 参在模组里报 not found），在 4³ 立方里筛，2843 粒、命令耗时 6ms、占格 318/576 是本库覆盖率最高的 3D 体模板。把带宽 0.9√ 调低面会变厚成「云」。',
    tags: ['conditional', '表达式', '干涉'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4 4 4 'r1=sqrt((x-2)*(x-2)+y*y+z*z);r2=sqrt((x+2)*(x+2)+y*y+z*z);abs(cos(r1-r2))>0.9' 0.4 200 null 1 null",
    ],
  },
  {
    id: 'threesource',
    name: '三源干涉（120° 三角阵）',
    desc: '三个点源两两干涉：|cos(r₁−r₂)+cos(r₂−r₃)|>1.4 —— 比双源多一层拍频，交叠处出现三重对称的花瓣状腔体。三源摆在 (±2,0,0) 与 (0,2,0) 构成正三角形，改成 120° 三角阵对称性最完整。4391 粒、24ms，是库里条件扫描最重的一条（每次采样要算三次 sqrt）。',
    tags: ['conditional', '表达式', '干涉'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4 4 4 'r1=sqrt((x-2)*(x-2)+y*y+z*z);r2=sqrt((x+2)*(x+2)+y*y+z*z);r3=sqrt(x*x+(y-2)*(y-2)+z*z);abs(cos(r1-r2)+cos(r2-r3))>1.4' 0.3 200 null 1 null",
    ],
  },
  {
    id: 'schwarzp',
    name: 'Schwarz P 极小曲面（原始型）',
    desc: 'cos x + cos y + cos z ≈ 0 —— 三大极小曲面里最简单的「原始型」（P 代表 Primitive）。用 conditional 在一整个周期（范围 3.14159 = cos 的半周期，跨度为 2π）里筛等值面，带宽 0.3、步长 0.3 → 1652 粒 / 11ms。与 gyroid 是同一族（三周期极小曲面 TPMS），但 P 面没有手性、上下两半互为镜像，gyroid 有手性——这正是化学里用 gyroid 做模板而不用 P 面的原因。',
    tags: ['conditional', '表达式', '极小曲面'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.14159 3.14159 3.14159 'abs(cos(x)+cos(y)+cos(z))<0.3' 0.3 200 null 1 null",
    ],
  },
  {
    id: 'schwarzd',
    name: 'Schwarz D 极小曲面（钻石型）',
    desc: 'sin x·sin y·sin z + sin x·cos y·cos z + cos x·sin y·cos z + cos x·cos y·sin z ≈ 0 —— 三大极小曲面里的「钻石型」（D = Diamond），四项相乘再相加是全库里算式最长的一条曲面条件。比 P 面多一层交叉项，孔隙沿体对角线方向排列成钻石骨架。1546 粒 / 22ms（每采样点要算 8 次三角 + 3 次乘），比 P 面贵一倍。',
    tags: ['conditional', '表达式', '极小曲面'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.14159 3.14159 3.14159 'abs(sin(x)*sin(y)*sin(z)+sin(x)*cos(y)*cos(z)+cos(x)*sin(y)*cos(z)+cos(x)*cos(y)*sin(z))<0.2' 0.3 200 null 1 null",
    ],
  },
  {
    id: 'neovius',
    name: 'Neovius 极小曲面（多孔骨架）',
    desc: '3(cos x+cos y+cos z) + 4 cos x·cos y·cos z ≈ 0 —— 在 Schwarz P 的基础上加一个三次交叉项，把 P 面的连续孔道打断成互不相连的空腔，外观更像海绵骨架而不是膜。1695 粒 / 13ms，比 P 面只多一次乘法。想调孔道连通性就改两个系数（3 和 4）的比值：4/3 是 Neovius 原式，把 4 调小会逐渐退回 Schwarz P。',
    tags: ['conditional', '表达式', '极小曲面'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.14159 3.14159 3.14159 'abs(3*(cos(x)+cos(y)+cos(z))+4*cos(x)*cos(y)*cos(z))<0.4' 0.3 200 null 1 null",
    ],
  },
  {
    id: 'fouriersquare',
    name: '傅里叶方波（五阶逐层逼近）',
    desc: '五条曲线自下而上叠放，每条比下面多一项奇次谐波：sin t → +sin3t/3 → +sin5t/5 → +sin7t/7 → +sin9t/9，系数 4/π 归一化。少项时圆滑的正弦两侧长出平台，到第九阶已经很像方波，但边角仍有 9% 的过冲——这就是**吉布斯现象**：无论叠加多少有限项都消不掉，只会把振荡挤到更窄的范围里。y 偏移用「位置参数」而非表达式（每条命令自己的出生高度），是引擎里做多子图对照最省的做法。',
    tags: ['parameter', '表达式', '傅里叶'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*sin(t);z=0' 0.02 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 1.2 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*(sin(t)+sin(3*t)/3);z=0' 0.02 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 2.4 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*(sin(t)+sin(3*t)/3+sin(5*t)/5);z=0' 0.02 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 3.6 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*(sin(t)+sin(3*t)/3+sin(5*t)/5+sin(7*t)/7);z=0' 0.02 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 4.8 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*(sin(t)+sin(3*t)/3+sin(5*t)/5+sin(7*t)/7+sin(9*t)/9);z=0' 0.01 200 'null' 1 null",
    ],
  },
  {
    id: 'superellipsoid',
    name: '超椭球（指数 n 的形态谱）',
    desc: '八条命令并排，n 取 0.5 / 0.7 / 1 / 1.5 / 2 / 3 / 6 / 10 —— 方程 |x/a|ⁿ+|y/a|ⁿ+|z/a|ⁿ=1 只换一个指数，形状就从八角星（n<1，凹面）经过球（n=2）连续过渡到圆角立方、再到近立方（n→∞）。这是最适合用一条模板讲清「参数即形状」的例子：立方和球在超椭球族里只差一个数。每条命令在 x 轴错开 8 格排成一列。注意 |x|ⁿ 的幂运算对负数是 NaN，必须先 abs（引擎语义同 JDK Math.pow）。',
    tags: ['conditional', '表达式', '形态谱'],
    cmds: [
      "/particleex conditional minecraft:end_rod -28 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^0.5+abs(y/3)^0.5+abs(z/3)^0.5-1)<0.12' 0.25 200 null 1 null",
      "/particleex conditional minecraft:end_rod -20 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^0.7+abs(y/3)^0.7+abs(z/3)^0.7-1)<0.12' 0.22 200 null 1 null",
      "/particleex conditional minecraft:end_rod -12 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)+abs(y/3)+abs(z/3)-1)<0.12' 0.3 200 null 1 null",
      "/particleex conditional minecraft:end_rod -4 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^1.5+abs(y/3)^1.5+abs(z/3)^1.5-1)<0.12' 0.4 200 null 1 null",
      "/particleex conditional minecraft:end_rod 4 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(x*x+y*y+z*z-9)<1' 0.32 200 null 1 null",
      "/particleex conditional minecraft:end_rod 12 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^3+abs(y/3)^3+abs(z/3)^3-1)<0.12' 0.4 200 null 1 null",
      "/particleex conditional minecraft:end_rod 20 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^6+abs(y/3)^6+abs(z/3)^6-1)<0.12' 0.28 200 null 1 null",
      "/particleex conditional minecraft:end_rod 28 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^10+abs(y/3)^10+abs(z/3)^10-1)<0.12' 0.28 200 null 1 null",
    ],
  },
  {
    id: 'sphericalharmonics',
    name: '球谐函数（Y20 / Y30 / Y40 三阶对照）',
    desc: '三条命令并排，各自画一个 l 阶球谐的径向调制：r = 3 + 0.8·Y_l0(θ)。Y20 ∝ 3cos²θ−1 是经典的「哑铃 + 腰环」，Y30 在赤道多一圈瓣，Y40 再多一圈——每升一阶就多一对纬向瓣，正是球谐函数「节纬线数 = l」的可视化。**必须归一化**：Y40 未归一化时 35c⁴−30c²+3 ∈ [3,8]，dis 会跨到 0.03..12.6（实测），画面炸成一片；除以 8 后统一落在 2.5..4.2。θ 用 PI*(t−floor(t)) 扫、φ 用 2π*floor(t)/rows 阶梯扫——这是引擎里唯一的「双角度栅格」写法（一维 t 只有小数/整数两位可拆）。',
    tags: ['polarparameter', '表达式', '球谐'],
    cmds: [
      "/particleex polarparameter minecraft:end_rod -8 0 0 1 0.95 0.89 1 0 0 0 0 48 's1=PI*(t-floor(t));s2=2*PI*floor(t)/48;dis=3+0.8*(1.5*cos(s1)*cos(s1)-0.5)' 0.02 200 'null' 1 null",
      "/particleex polarparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 48 's1=PI*(t-floor(t));s2=2*PI*floor(t)/48;dis=3+0.8*(2.5*cos(s1)*cos(s1)*cos(s1)-1.5*cos(s1))' 0.02 200 'null' 1 null",
      "/particleex polarparameter minecraft:end_rod 8 0 0 1 0.95 0.89 1 0 0 0 0 48 's1=PI*(t-floor(t));s2=2*PI*floor(t)/48;dis=3+0.8*((35*cos(s1)^4-30*cos(s1)*cos(s1)+3)/8)' 0.02 200 'null' 1 null",
    ],
  },
  {
    id: 'juliaescape',
    name: 'Julia 逃逸高度场（迭代次数成山）',
    desc: '同样是 z←z²+(−0.8) 迭代 16 次，但这里**不是筛点、是把逃逸轮数画成高度**：z = floor(log|z₁₆|²/ln2)·0.4。落在集合内的点 z 恒 0（贴地），越早逃逸的点越高——于是 Julia 集从一张平面图变成了「地形」。实测 z 分 19 层、最高 7.6 格。关键技巧：集合内的点 |z₁₆|² 会下溢到 0，log(0) = −Inf 把整条命令毁掉，必须 `mm=min(m,1000000)` 先钳住下溢（上钳 1e6 同时把 z 压到 19.9 层上限）。**注意这是 parameter 族而非 conditional**：conditional 的位置只取网格坐标，表达式里写 x/y/z 只参与条件求值、不改变落点。',
    tags: ['parameter', '表达式', '分形', '高度场'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 150 'px=-1.5+3*(t-floor(t));py=-1.5+3*floor(t)/150;zr0=px;zi0=py;zr1=zr0*zr0-zi0*zi0+(0-0.8);zi1=2*zr0*zi0;zr2=zr1*zr1-zi1*zi1+(0-0.8);zi2=2*zr1*zi1;zr3=zr2*zr2-zi2*zi2+(0-0.8);zi3=2*zr2*zi2;zr4=zr3*zr3-zi3*zi3+(0-0.8);zi4=2*zr3*zi3;zr5=zr4*zr4-zi4*zi4+(0-0.8);zi5=2*zr4*zi4;zr6=zr5*zr5-zi5*zi5+(0-0.8);zi6=2*zr5*zi5;zr7=zr6*zr6-zi6*zi6+(0-0.8);zi7=2*zr6*zi6;zr8=zr7*zr7-zi7*zi7+(0-0.8);zi8=2*zr7*zi7;zr9=zr8*zr8-zi8*zi8+(0-0.8);zi9=2*zr8*zi8;zr10=zr9*zr9-zi9*zi9+(0-0.8);zi10=2*zr9*zi9;zr11=zr10*zr10-zi10*zi10+(0-0.8);zi11=2*zr10*zi10;zr12=zr11*zr11-zi11*zi11+(0-0.8);zi12=2*zr11*zi11;zr13=zr12*zr12-zi12*zi12+(0-0.8);zi13=2*zr12*zi12;zr14=zr13*zr13-zi13*zi13+(0-0.8);zi14=2*zr13*zi13;zr15=zr14*zr14-zi14*zi14+(0-0.8);zi15=2*zr14*zi14;zr16=zr15*zr15-zi15*zi15+(0-0.8);zi16=2*zr15*zi15;mm=min(zr16*zr16+zi16*zi16,1000000);x=px;y=py;z=floor(log(mm)/0.6931)*0.4' 0.01 200 'null' 1 null",
    ],
  },
  {
    id: 'vortexstreet',
    name: '涡街晶格（sin·cos 驻波零线）',
    desc: 'sin(2x)·cos(y) ≈ 0.3 的等值线——两个正交驻波相乘，零线在平面上织成规则方格，正是卡门涡街在稳定区间的周期性排列。改 0.3 只平移等值线（0 时退化为完整方格网），改 2 和 1 的比值改变横竖格距比。条件写成 abs(F−0.3)<0.05 而不是 abs(F)<0.05：**等值线可以取非零值**，这是本库其余 condition 模板没用过的写法。4171 粒 / 32ms。',
    tags: ['conditional', '表达式', '流场'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 8 6 0 'abs(sin(2*x)*cos(y)-0.3)<0.05' 0.05 200 null 1 null",
    ],
  },
  {
    id: 'vortexdistort',
    name: '扭曲涡场（交叉项打破晶格）',
    desc: '在涡街晶格上加一个乘积交叉项 0.2·sin(0.7xy)：±xy 的反对称让格子的一半顺时针扭、另一半逆时针扭，规则方格被打散成螺旋状涡胞。这是「加一项就从有序走向局部混沌」的最小例子——把 0.2 调到 0 就退回 vortexstreet 的正方晶格，调到 0.5 以上涡胞互相吞并成乱流。4800 粒 / 32ms。',
    tags: ['conditional', '表达式', '流场'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 8 6 0 'abs(sin(1.5*x)*cos(1.2*y)+0.2*sin(0.7*x*y)-0.3)<0.06' 0.05 200 null 1 null",
    ],
  },
  {
    id: 'catenoid',
    name: '悬链面→螺旋面（等距变形族）',
    desc: 'r(α,u,v) 是极小曲面里最漂亮的等距变形：α=0 是螺旋面（helicoid），α=π/2 是悬链面（catenoid），中间值是整族**既保长度又保面积的弯曲**——这就是 1776 年 Meusnier 证明的那对曲面。写法 x=cosα·sinh v·sin u + sinα·cosh v·cos u，四条命令取 α=0、π/4、π/2 中的三档并排（左→右逐渐从螺旋变号角）。注意 sinh/cosh 在引擎里可用，v 限在 ±1.5 防止 cosh 爆炸。',
    tags: ['parameter', '表达式', '极小曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -7 0 0 1 0.95 0.89 1 0 0 0 0 60 'u=2*PI*(t-floor(t));v=1.5*(floor(t)/60-0.5);x=sinh(v)*sin(u);z=(0-sinh(v))*cos(u);y=u' 0.03 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 60 'u=2*PI*(t-floor(t));v=1.5*(floor(t)/60-0.5);x=0.707107*sinh(v)*sin(u)+0.707107*cosh(v)*cos(u);z=(0-0.707107)*sinh(v)*cos(u)+0.707107*cosh(v)*sin(u);y=0.707107*u+0.707107*v' 0.03 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 7 0 0 1 0.95 0.89 1 0 0 0 0 60 'u=2*PI*(t-floor(t));v=1.5*(floor(t)/60-0.5);x=cosh(v)*cos(u);z=cosh(v)*sin(u);y=v' 0.03 200 'null' 1 null",
    ],
  },
  {
    id: 'crystal',
    name: '晶体点阵三型（SC / BCC / FCC）',
    desc: '三条命令并排各画一种布拉维格子：简单立方、体心立方、面心立方。判定用三角函数的零点：sin(πx/a)=0 ⇔ x 是 a 的整数倍。**SC 用「到最近格点的球距」**——sin 三轴同时过零会随阈值放宽而暴增（bw 0.06→0.2 从 7 粒涨到 129 粒，还没到可用密度），改成圆球体积判定后稳定在 9 千粒。BCC 是 sin 之和趋零（整数三重与半整数三重都满足），FCC 换成 cos 之和。改 a（表达式里的 1.5）整体缩放，改阈值调点的大小。这三型是金属晶体的全部基本格子（Fe 是 BCC、Cu 是 FCC、Po 是 SC）。',
    tags: ['conditional', '表达式', '晶体'],
    cmds: [
      "/particleex conditional minecraft:end_rod -7 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(x-1.5*round(x/1.5))^2+abs(y-1.5*round(y/1.5))^2+abs(z-1.5*round(z/1.5))^2<0.1024' 0.1 200 null 1 null",
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(sin(PI*x/1.5)+sin(PI*y/1.5)+sin(PI*z/1.5))<0.02' 0.1 200 null 1 null",
      "/particleex conditional minecraft:end_rod 7 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(cos(PI*x/1.5)+cos(PI*y/1.5)+cos(PI*z/1.5))<0.02' 0.1 200 null 1 null",
    ],
  },
  {
    id: 'pendulum',
    name: '单摆相空间（三能级等能线）',
    desc: '相平面 (θ, ω) 上的三条等能线：E = ω²/2 − cos θ。左边 E=0.2 是小振幅的**闭合椭圆**（摆在小角度来回摆，永不越顶），中间 E=0.95 逼近**分界线**（摆恰好快要翻过去，周期趋于无穷），右边 E=1.6 越过顶点变成**开放轨道**（摆一路单向转圈）。分界线 E=1 是相空间拓扑的临界点——这是动力系统里最干净的分岔例子，也是混沌教材的第一张图。三条并排、各错开 7 格。11064 粒 / 52ms。',
    tags: ['conditional', '表达式', '动力系统'],
    cmds: [
      "/particleex conditional minecraft:end_rod -7 0 0 1 0.95 0.89 1 0 0 0 3 3 0 'abs(y*y/2-cos(x)-0.2)<0.08' 0.02 200 null 1 null",
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 0 'abs(y*y/2-cos(x)-0.95)<0.08' 0.02 200 null 1 null",
      "/particleex conditional minecraft:end_rod 7 0 0 1 0.95 0.89 1 0 0 0 3 3 0 'abs(y*y/2-cos(x)-1.6)<0.08' 0.02 200 null 1 null",
    ],
  },
  {
    id: 'fibonaccisphere',
    name: '斐波那契球（黄金角均匀分布）',
    desc: '球面上最均匀的点分布：k 从 1 到 N，纬线 y=R(1−2k/N) 等间距下降，方位角每次转**黄金角** 2π(1−1/φ)=2.399963 rad。黄金角的好处是任何前缀都是准均匀的——只画前 100 个点也不会挤成一团，这是向日葵种子排列的同一原理。与随机撒点（nebula）区别：随机撒点会有疏有密，斐波那契是**真正等间距**。N=3000、R=5 时 3001 粒 / 6ms，N 直接改 tmax。',
    tags: ['parameter', '表达式', '球面分布'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3000 'k=floor(t);th=2.399963229728653*k;y=5*(1-2*k/3000);rr=sqrt(max(0,25-y*y));x=rr*cos(th);z=rr*sin(th)' 1 200 'null' 1 null",
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

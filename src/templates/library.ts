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
  {
    id: 'foamcube',
    name: '立方泡沫（sin x·sin y·sin z 零面）',
    desc: 'sin x·sin y·sin z ≈ 0 的等值面——三个方向的驻波同时过零，结果是**三族互相垂直的平面网格**，把空间切成整齐的小立方体。这是泡沫结构里最简单的一型：每个气泡都是立方体，所有面都平。12581 粒 / 33ms、占格 7262，是本库覆盖率最高的 3D 体模板之一（接近 Schwarz P 的两倍）。改带宽 0.06 调泡壁厚度，改 sin 的系数调泡径。',
    tags: ['conditional', '表达式', '泡沫'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4.5 4.5 4.5 'abs(sin(x)*sin(y)*sin(z))<0.06' 0.25 200 null 1 null",
    ],
  },
  {
    id: 'foamcavity',
    name: 'BCC 泡沫（球形空腔阵列）',
    desc: 'sin x·sin y + sin y·sin z + sin z·sin x ≈ 0.3 的等值面——与立方泡沫不同，这里的壁不是平面而是**曲面**，围出上下两层各四个球形空腔（体心立方排布）。整条命令形成的是一整个「气泡堆」，正面能看到 4 个洞、侧面看是双层结构。这是 Kelvin 泡沫问题的近似解之一。1362 粒 / 56ms（比 cube 版稀疏是因为等值面更窄）。',
    tags: ['conditional', '表达式', '泡沫'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4.5 4.5 4.5 'abs(sin(x)*sin(y)+sin(y)*sin(z)+sin(z)*sin(x)-0.3)<0.05' 0.25 200 null 1 null",
    ],
  },
  {
    id: 'foamthin',
    name: '薄壁泡沫（三向余弦零线）',
    desc: 'sin x + sin y + sin z ≈ 0 的等值面——三个方向的平面波相加，零面形成**互相穿插的薄壁**，比立方泡沫更像肥皂泡的连通膜（立方泡沫是直角相交，这里是斜交）。占格 1976、2305 粒 / 27ms。把它与 foamcube 对照看：立方泡沫的壁是「所有面都平」，这一型的壁是「所有面都斜」——同一族公式、两种拓扑。',
    tags: ['conditional', '表达式', '泡沫'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4.5 4.5 4.5 'abs(sin(x)+sin(y)+sin(z))<0.08' 0.25 200 null 1 null",
    ],
  },
  {
    id: 'thomasslow',
    name: 'Thomas 环·低阻尼（b=0.1 大环）',
    desc: '与已收录的 `thomas`（b=0.208186，标准值）同一组方程 vx=sin(y)−bx, vy=sin(z)−by, vz=sin(x)−bz，但 b 取 0.1。**b 是阻尼系数**：b 越小，粒子被注入的能量越难耗散，轨道越外扩——b=0.1 时吸引子直径约 13 格（标准 b 值只有约 7 格）；b=0.3 时反而缩成 6 格的小球。所以这一对模板可以直接对照「阻尼越小、吸引子越大」的规律。3000 粒 / 315ms（300 tick 后统计）。注意：只有 Thomas 系统在 20 TPS 显式欧拉下不发散（sin 项的天然有界性），Lorenz/Rössler 等在这一积分器下都会爆掉。',
    tags: ['normal', '表达式', 'vel', '混沌'],
    cmds: [
      "/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0.5 0.5 0.5 3000 900 'u=sin(y)-0.1*x;v=sin(z)-0.1*y;w=sin(x)-0.1*z;(vx,vy,vz)=(u*0.3,v*0.3,w*0.3)' 1 null",
    ],
  },
  {
    id: 'tesseract',
    name: 'Tesseract 4D 超立方体投影',
    desc: '4 维超立方体的 3D 透视投影：16 个顶点由 t 的低 4 位编码，每个顶点延伸 4 条边（翻转一个位），32 条边各细分 120 点。4D 旋转在 x-w 平面上（角度 0.6 rad），再按 w 坐标做透视缩放 `2.6+wr` —— 这是「内立方套外立方 + 跨接线」的来源：内立方是 w 坐标更远的那个立方体，透视让它变小。同一条命令就是完整的 4D→3D 降维演示。3841 粒 / 14ms。改 PER 调边长密度、改 0.6 调 4D 旋转相位。',
    tags: ['parameter', '表达式', '4D'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3840 'k=floor(t/120);s=floorMod(t,120)/120;d=floor(k/16);base=k-16*d;b0=floorMod(base,2);b1=floorMod(floor(base/2),2);b2=floorMod(floor(base/4),2);b3=floorMod(floor(base/8),2);c0=2*b0-1;c1=2*b1-1;c2=2*b2-1;c3=2*b3-1;w0=max(0,1-abs(d-0));w1=max(0,1-abs(d-1));w2=max(0,1-abs(d-2));w3=max(0,1-abs(d-3));c0=c0+(0-c0-c0)*s*w0;c1=c1+(0-c1-c1)*s*w1;c2=c2+(0-c2-c2)*s*w2;c3=c3+(0-c3-c3)*s*w3;xr=c0*0.825336-c3*0.564642;wr=c0*0.564642+c3*0.825336;sc=7/(2.6+wr);x=xr*sc;y=c1*sc;z=c2*sc' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'octahedron',
    name: '八面体（|x|+|y|+|z|=R 面族）',
    desc: '|x|+|y|+|z| = 4 的等值面就是**正八面体**（六个顶点在坐标轴上）——这是 L1 范数的等值面。三轴绝对值相加写起来最简单，却得到最经典的柏拉图立体之一。4455 粒 / 100ms。四个「象限」面在等距投影下拼成完整菱形，中心空腔是八面体的内部。对比同族的立方体（L∞ 范数 `max(|x|,|y|,|z|)=R`）：两者是同一族「p-范数等值面」的 p=1 与 p=∞ 两端。',
    tags: ['conditional', '表达式', '多面体'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4 4 4 'abs(abs(x)+abs(y)+abs(z)-4)<0.06' 0.12 200 null 1 null",
    ],
  },
  {
    id: 'cube',
    name: '立方体（max|x| 面族）',
    desc: 'max(|x|,|y|,|z|) = 3 的等值面——L∞ 范数的等值面就是立方体。与八面体是同一族「p-范数等值面」的两端：p=1 是八面体、p=∞ 是立方体、p=2 是球。7351 粒 / 28ms，绘制最快的一条（max 比 abs 三联快）。等距投影下能看到三个面 + 棱线，是库里唯一能直接看到「立体感」的多面体。',
    tags: ['conditional', '表达式', '多面体'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(max(max(abs(x),abs(y)),abs(z))-3)<0.05' 0.12 200 null 1 null",
    ],
  },
  {
    id: 'heatsphere',
    name: '球面高度热图（颜色承载物理量）',
    desc: '球面上的高度 h=(y/R+1)/2 映射成色相：南极 h=0 纯蓝 → 赤道 h=0.5 绿 → 北极 h=1 纯红，是一条完整的色相环。这是**用颜色维度承载物理量**的范式——位置只负责形状，颜色负责读数。三条颜色通道写成 `cr=h; cg=1−|2h−1|; cb=1−h`（红-绿-蓝三段线性插值），比用 cos 绕色相环更直观、颜色过渡也更平滑。6401 粒 / 26ms、占格 1256。把 h 换成温度、压力、速度模长都是同一个写法。',
    tags: ['rgbaparameter', '表达式', '颜色场'],
    cmds: [
      "/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 32 'u=t;k=floor(u/0.1);v=floorMod(u,0.1)/0.1;th=k*0.1;ph=v*6.2832;x=5*sin(th)*cos(ph);z=5*sin(th)*sin(ph);y=5*cos(th);h=(y/5+1)/2;cr=h;cg=1-abs(2*h-1);cb=1-h;alpha=1' 0.005 200 'null' 1 null",
    ],
  },
  {
    id: 'toruscolor',
    name: '环面色带（主参数绕色相环）',
    desc: '环面上按主轴角度 th 绕一整圈色相：`hh=th/2π`，三分量 `cr=0.5+0.5cos(2π·hh)` 等相隔 2π/3。绕环面走一圈颜色也走一圈，于是「颜色 = 位置沿主环的进度」变得可读——这是给闭合曲线/环面加时间或进度指示的标准做法。12600 粒 / 31ms、占格 749（环面是薄壳，占格/粒子比低）。与 `superformula` 的极角度着色对照：那条是平面极坐标，这条是 3D 环面的主参数。',
    tags: ['rgbaparameter', '表达式', '颜色场'],
    cmds: [
      "/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 63 'u=t;k=floor(u/0.05);v=floorMod(u,0.05)/0.05;th=k*0.05;ph=v*6.2832;x=(3+0.8*cos(ph))*cos(th);z=(3+0.8*cos(ph))*sin(th);y=0.8*sin(ph);hh=th/6.2832;cr=0.5+0.5*cos(hh*6.2832);cg=0.5+0.5*cos(hh*6.2832-2.0944);cb=0.5+0.5*cos(hh*6.2832+2.0944);alpha=1' 0.005 200 'null' 1 null",
    ],
  },
  {
    id: 'rose3d',
    name: '3D 玫瑰螺旋（极坐标玫瑰绕轴上升）',
    desc: '经典玫瑰线 r=|cos(kθ)|（k=5 出五瓣）绕 y 轴高速旋转 60 圈，同时缓慢上升——2D 玫瑰变成一条 3D 螺旋带。**关键是转速 60 远大于上升速率 0.05**：每转一圈只升 0.05·(2π/60)≈0.005 格，60 圈形成均匀的螺旋薄壳。俯视是完美的五瓣玫瑰，侧视是斜纹螺旋带，等距视角下立体感最强。6667 粒 / 14ms、占格 3377。改 k 换瓣数（k=3/4/6），改 60 换螺旋密度。',
    tags: ['parameter', '表达式', '曲线 3D 化'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 100 'u=t;k=5;r=3*abs(cos(k*u));th=u*60;x=r*cos(th);z=r*sin(th);y=u*0.05-2.5' 0.015 200 'null' 1 null",
    ],
  },
  {
    id: 'rose3ddual',
    name: '双层玫瑰（正反镜像对）',
    desc: '同一条 3D 玫瑰螺旋，但 y 坐标乘一个 `sg=floorMod(u,2)*2−1` 的正负交替因子：奇数段向上、偶数段向下，于是同一条命令画出**上下镜像的两层**。侧视能看到两层中间夹着空隙，等距视角像一朵立体的花。与原版（`rose3d`）的差别只在 y 的那一个因子——一个 `*sg` 就把单层薄壳变成了双层对称结构，是本库最省的「对称化」写法。6667 粒 / 17ms、占格 2641。',
    tags: ['parameter', '表达式', '曲线 3D 化'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 100 'u=t;k=5;r=3*abs(cos(k*u));th=u*60;sg=floorMod(u,2)*2-1;x=r*cos(th);z=r*sin(th);y=sg*(u*0.025-1.25)' 0.015 200 'null' 1 null",
    ],
  },
  {
    id: 'dnahelix',
    name: 'DNA 双螺旋（主链双色的完整模型）',
    desc: '三条命令拼出一条完整的 DNA：两条主链各 40 圈螺旋（y 从 −4 到 4，半径 1.5），相位差 π 让它们处于直径两端；第三条画 26 根横档，把两条链在同一高度连起来。**横档是这里唯一的难点**——它需要「同一 y、两端各落在两条链上」，写法是先把 t 归一化成 0..1，`k=floor(u*N)` 取横档编号、`s=floorMod(u*N,1)` 取档内位置，角度 `th=40πk/N` 只由编号决定（同一根档上的所有点角度相同），再用 `(2s−1)` 从 −1 线性拉到 +1，于是每个点都落在这根档的连线上。俯视是标准圆环（双链在直径两端 + 径向横档），等距视角是清晰的螺旋柱。21201 粒 / 60ms、占格 1525。改 `40*PI` 换圈数，改 N 换横档数，改 1.5 换半径。',
    tags: ['parameter', '表达式', '多命令组合'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 0.2 0.6 1 1 0 0 0 0 40 'u=t/40;th=u*40*PI;r=1.5;x=r*cos(th);z=r*sin(th);y=u*8-4' 0.005 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.35 0.3 1 0 0 0 0 40 'u=t/40;th=u*40*PI+PI;r=1.5;x=r*cos(th);z=r*sin(th);y=u*8-4' 0.005 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 0.9 0.9 1 1 0 0 0 0 26 'u=t/26;N=26;k=floor(u*N);s=floorMod(u*N,1);th=40*PI*k/N;x=1.5*cos(th)*(2*s-1);z=1.5*sin(th)*(2*s-1);y=8*k/N-4' 0.005 200 'null' 1 null",
    ],
  },
  {
    id: 'helicoid',
    name: '螺旋面（极小曲面的经典代表）',
    desc: 'Helicoid：`(v·cos u, v·sin u, c·u)`——一条水平直线一边绕轴旋转一边匀速上升，扫出的曲面。它与悬链面（本库 `catenoid`）是同一张曲面在等距变形下的两端，是极小曲面里最基础的一对。采样用**两层索引**：`k=floor(u/N)` 选螺旋的第几圈（共 40 圈），`s` 在圈内取角度；半径 v 由 k 决定，所以每一圈是一条半径固定的水平线——这正是它的生成方式。按 45° 侧滚看最像螺旋楼梯；等距视角下能看到半透明的层叠丝带。24000 粒 / 27ms、占格 1002。把 `0.6` 调大让螺距更大（看起来更「转得开」）。',
    tags: ['parameter', '表达式', '极小曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 23999 'u=t;N=600;R2=40;k=floor(u/N);s=floorMod(u,N)/N;ug=s*4*PI;v=k/R2*4-2;x=v*cos(ug);y=v*sin(ug);z=0.6*ug-3.8' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'dini',
    name: 'Dini 螺旋面（常平均曲率的扭曲喇叭）',
    desc: 'Dini 曲面：`z = a·(cos v + ln tan(v/2)) + b·u`，x/y 是半径为 `a·sin v` 的圆。它是**常平均曲率曲面**（不同于极小曲面），形状像一只被拧过的喇叭筒——下部敞开成漏斗、上部收成螺旋尖。v 取 0.35..π−0.35 避开 `log(tan(0))` 的奇点，u 扫 4π 让上下端各拧两圈。**采样分层**：k 决定 v（40 层），s 在层内扫 u。等距视角呈现典型的「螺旋楼梯筒」轮廓。24000 粒 / 57ms、占格 927。改 `b` 调扭转强度（b 越大越像拧毛巾）。',
    tags: ['parameter', '表达式', '极小曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 23999 'u=t;N=600;R2=40;k=floor(u/N);s=floorMod(u,N)/N;ug=s*4*PI;vv=0.35+(PI-0.7)*k/R2;a=2;b=0.25;x=a*cos(ug)*sin(vv);y=a*sin(ug)*sin(vv);z=a*(cos(vv)+log(tan(vv/2)))+b*ug' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'supertoroid',
    name: '超环面（|cos|^n 控制环管截面）',
    desc: '环面的超椭圆推广：把截面半径换成 `R + a·sign(cos v)·|cos v|^n`、高度换成 `a·sign(sin v)·|sin v|^n`。n=1 是标准环面（圆管），n→0 时截面趋近方管（像一个带孔的立方块），n<1 出「胖方环」，n>1 出「瘦星环」。**这里必须用 `signum(x)*pow(abs(x),n)`**——直接 `x^n` 对负底数返回 NaN（JDK Math.pow 语义）。与本库 `superellipsoid`（2D 超椭圆旋转）互补：那个改的是轮廓，这个改的是环管截面。20000 粒 / 26ms、占格 2016。俯视是一个带方角特征的圆环带，截面形状一眼可辨。',
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 19999 'u=t;N=200;R2=100;k=floor(u/N);s=floorMod(u,N)/N;n=0.6;RR=3;aa=1.2;ug=k/R2*2*PI;vv=s*2*PI;cv=cos(vv);sv=sin(vv);r=RR+aa*signum(cv)*pow(abs(cv),n);x=r*cos(ug);y=r*sin(ug);z=aa*signum(sv)*pow(abs(sv),n)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'stereosphere',
    name: '球极投影网格球（正交网格贴在球面）',
    desc: '球极投影之逆：把平面上的**正交网格**（u 族竖线 × v 族横线）映回球面。写法是逆变换 `(X,Y) → (2X/(1+r²), 2Y/(1+r²), (r²−1)/(1+r²))`——平面上的无穷远点映到北极，原点映到南极，所以**网格在北极处被压得极密、在南极处被拉得极疏**（这正是球极投影保角的代价，也是它视觉上最有辨识度的地方）。俯视看是一张规整的经纬网球；等距视角能看到极点附近的密集堆积。**采样用两层索引**：`k=floor(u/P)` 选第几条线，`s=floorMod(u,P)/(P-1)` 取线上位置。7320 粒 / 22ms、占格 700。改 `2.5` 换球半径，改 NL/P 换网格疏密。',
    tags: ['parameter', '表达式', '球面'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 7319 'u=t;NL=61;P=120;k=floor(u/P);s=floorMod(u,P)/(P-1);a=2*k/(NL-1)-1;b=2*s-1;X=a;Y=b;rr=X*X+Y*Y;den=1+rr;x=2*X/den*2.5;y=2*Y/den*2.5;z=(rr-1)/den*2.5' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'tickgrow',
    name: '随时间画出的螺旋（tickparameter 逐帧生长）',
    desc: '用 **tickparameter** 族：命令注册后不是一次性生成全部粒子，而是**每个游戏 tick 吐 `cpt` 个点**，t 按 step 递进——于是曲线是「随时间一笔画出来」的。这条画的是半径 3 的圆螺旋（`th=u*0.02` 每 tick 转一点、`y=u*0.002` 缓慢上升），20 个点/tick 持续 150 tick，最终 2961 粒。播放时能看到螺旋一圈圈长出来的动态过程，这是 parameter 族做不到的（后者是瞬时全部生成）。**命令槽位与众不同**：`<begin> <end> <表达式> <step> <cpt>`，注意此处 **cpt 在 age 之前**（非 tick 族没有 cpt 槽）。2961 粒 / 14ms、占格 657、跨度 10.3。',
    tags: ['tickparameter', '表达式', '时间驱动'],
    cmds: [
      "/particleex tickparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3000 'u=t;th=u*0.02;r=3;x=r*cos(th);z=r*sin(th);y=u*0.002' 1 20 200 'null' 1 null",
    ],
  },
  {
    id: 'tkspiralband',
    name: '逐 tick 盘绕的螺旋带（tickparameter 扫描）',
    desc: 'tickparameter 的 `t` 按 step 递进、每 tick 吐 `cpt` 个点——**这正是「用 t 当扫描索引」的天然场景**。这条把 t 拆成两段：整数部分 `n = floor(u/8)` 决定转过的总角度（每 8 个点转 0.5 弧度），小数部分 `s0` 在一圈内扫过完整 2π；半径再叠 `0.4·sin(0.3n)` 的起伏、高度 `0.04n` 缓慢下移。于是**每个 tick 吐出一条 8 点的短弧，弧推进的角度整体向前滚**，播放时看到一条螺旋带绕着轴一圈圈缠上去再慢慢下沉——俯视是一个不断生长的同心螺旋。808 粒 / 9ms、占格 565。改 8 换每圈点数（越小越像虚线），改 0.5 换每步转过的角。',
    tags: ['tickparameter', '表达式', '时间驱动'],
    cmds: [
      "/particleex tickparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 1600 'u=t;n=floor(u/8);s0=floorMod(u,8)/8;th=n*0.5;s1=s0*2*PI;r=3+0.4*sin(n*0.3);x=r*cos(th+s1*0.2);z=r*sin(th+s1*0.2);y=(n*0.04)-2' 1 8 500 'null' 1 null",
    ],
  },
  {
    id: 'tkrings',
    name: '逐圈外扩的同心环（tickpolarparameter）',
    desc: '用 **tickpolarparameter**：`dis` 随圈号 `n` 线性增长（`0.8 + 0.14n`），每 20 个点正好铺满一圈（`s1 = 2πs0`、`s2 = 0` 让所有点落在同一水平面）。播放时一圈圈同心圆从内向外依次出现，**像水面上一圈圈荡开的波纹**——但这里是「一次一圈、圆整地铺」而非连续扩散，节奏感比 `tkspiralband` 更强。1601 粒 / 5ms、占格 865。改 20 换每圈点数（越小圈越稀），改 0.14 换环间距。',
    tags: ['tickpolarparameter', '表达式', '时间驱动'],
    cmds: [
      "/particleex tickpolarparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 1600 'u=t;n=floor(u/20);s0=floorMod(u,20)/20;s1=s0*2*PI;s2=0;dis=0.8+n*0.14' 1 20 500 'null' 1 null",
    ],
  },
  {
    id: 'tickpulse',
    name: '阶梯扩散脉冲环（tickparameter）',
    desc: '同样是 tickparameter，但半径按 `r=1+floor(u/100)*0.25` **阶梯式跳变**：每 100 个采样点（5 个 tick）半径跳 0.25 格，于是每帧画面是一圈固定半径的圆，跳变瞬间同时存在两圈——形成同心环逐层向外扩散的脉冲感。俯视能看到从内到外的多层圆环。**阶梯与 tick 节拍要对齐**：一圈 100 点 = 5 tick（cpt=25），改 cpt 要同步改阶梯长度，否则阶梯与圆环错位成斜纹。2951 粒 / 16ms、占格 1066、跨度 22.8。',
    tags: ['tickparameter', '表达式', '时间驱动'],
    cmds: [
      "/particleex tickparameter minecraft:end_rod 0 0 0 1 0.9 0.5 1 0 0 0 0 3000 'u=t;th=u*0.02;r=1+floor(u/100)*0.25;x=r*cos(th);z=r*sin(th);y=0' 1 25 200 'null' 1 null",
    ],
  },
  {
    id: 'rgbaspiral',
    name: '彩虹阿基米德螺线（rgbapolarparameter 颜色表达式）',
    desc: '用 **rgbapolarparameter** 族：它**没有颜色槽**，颜色完全由表达式里的 `cr/cg/cb` 给出——这是本库唯一直写颜色字段的模板。画 6 圈阿基米德螺线（`s1=u*0.0047` 方位角、`dis=0.3+u*0.0009` 半径同步线性增长），同时 `cr/cg/cb = 0.5+0.5*cos(φ) / cos(φ−2π/3) / cos(φ+2π/3)` 让颜色沿径向绕色相环一圈——于是同一条螺线上能同时看到 577 种颜色，从内到外是彩虹渐变。**注意 polar 族只读 `s1/s2/dis`**：写 `x/y/z` 会静默失效（全落原点）。8000 粒 / 22ms、占格 631、跨度 20.0。改 `0.0047` 换圈数，改 `0.0009` 换圈间距。',
    tags: ['rgbapolarparameter', '表达式', '颜色'],
    cmds: [
      "/particleex rgbapolarparameter minecraft:end_rod 0 0 0 0 0 0 0 7999 'u=t;s2=0;s1=u*0.0047;dis=0.3+u*0.0009;cr=0.5+0.5*cos(u*0.03);cg=0.5+0.5*cos(u*0.03-2.0944);cb=0.5+0.5*cos(u*0.03+2.0944)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'groupcube',
    name: '球壳后处理成立方体（group change 形变）',
    desc: '先用 parameter 画一个标准球壳（100 层纬线 × 60 经线），再用 **group change parameter** 逐粒子改写坐标：`x=sgn(x)·|x|^0.4·1.2`（三轴同式）。指数 0.4 < 1 把「接近 0 的分量」抬起来、把大分量压下去——球面的平滑分布被推成**接近立方体的面包形**，六个面清晰可辨，棱角柔和。这正是 group change 的独特价值：**它能做「先铺满、再变形」的两阶段效果**，而 parameter 族必须一步到位写出目标形状。**注意 group 表达式的 `s1/s2` 是每粒子自身的球坐标（atan2 反解），不是命令参数**——用它做旋转会让整体塌缩成一条线（实测占格 102），要用 `atan2(z,x)` 现算。6000 粒 / 24ms、占格 616。改指数 0.4→0.2 更方、→0.7 更圆。',
    tags: ['group change', '表达式', '后处理形变'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 5999 'u=t;s2=(u/60)/(100-1)*PI-0.5*PI;s1=floorMod(u,60)/60*2*PI;dis=3;x=dis*cos(s2)*cos(s1);y=dis*sin(s2);z=dis*cos(s2)*sin(s1)' 1 200 'null' 1 g1",
      "/particleex group change parameter g1 'x=signum(x)*pow(abs(x),0.4)*1.2;y=signum(y)*pow(abs(y),0.4)*1.2;z=signum(z)*pow(abs(z),0.4)*1.2'",
    ],
  },
  {
    id: 'groupfish',
    name: '球壳起皱（group change 径向波纹）',
    desc: '同一条球壳，group change 把每点的半径乘 `k=1+0.18·sin(7d)`（d=到原点距离）。球面变成**一层细密的起伏皱褶**，像鱼鳞或皱皮气球。要点是把倍数作用在 `x/y/z` 三轴而不是 `dis`——group 表达式里没有 `dis` 这个输入变量（只有 x/y/z/s1/s2/dis 中的 dis 是算出来的），直接改三轴是唯一稳妥写法。振幅 0.18 不能再大：超过 0.3 后相邻皱褶会互相穿插，视觉上糊成一团。6000 粒 / 32ms、占格 1797。改 `sin(7d)` 的频率换皱褶密度。',
    tags: ['group change', '表达式', '后处理形变'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 5999 'u=t;s2=(u/60)/(100-1)*PI-0.5*PI;s1=floorMod(u,60)/60*2*PI;dis=3;x=dis*cos(s2)*cos(s1);y=dis*sin(s2);z=dis*cos(s2)*sin(s1)' 1 200 'null' 1 g1",
      "/particleex group change parameter g1 'd=sqrt(x*x+y*y+z*z);k=1+0.18*sin(d*7);x=x*k;y=y*k;z=z*k'",
    ],
  },
  {
    id: 'groupshear',
    name: '球体斜切（group change 剪切变换）',
    desc: '剪切变换：`x += 0.7y, z += 0.4y`——同一高度的点整体沿两个方向平移，球被**斜切成一个倾斜的椭球壳**，中段最宽、两端收窄，像被压扁的果冻。剪切矩阵行列式为 1，体积不变，所以粒子密度分布与原球一致（不出现拉伸稀疏）。这是线性代数里最朴素的一种「变形但不缩体积」的演示，也是 group change 里最容易一次写对的形变。**两条平移量不能相等**——相等就退化成沿 (1,1)/√2 方向的纯倾斜，立体感消失。6000 粒 / 23ms、占格 1609。',
    tags: ['group change', '表达式', '后处理形变'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 5999 'u=t;s2=(u/60)/(100-1)*PI-0.5*PI;s1=floorMod(u,60)/60*2*PI;dis=3;x=dis*cos(s2)*cos(s1);y=dis*sin(s2);z=dis*cos(s2)*sin(s1)' 1 200 'null' 1 g1",
      "/particleex group change parameter g1 'x=x+y*0.7;y=y;z=z+y*0.4'",
    ],
  },
  {
    id: 'gccone',
    name: '条件尖顶（group change 只改上半球）',
    desc: '前半段先铺标准球壳，后半段用 **group change 带条件表达式** `y>0` 只挑上半球，按高度把水平半径从 1.4 倍（赤道）线性收到 0.15 倍（顶点）——下半球原封不动保持球面。结果是一个**下半球圆、上半球收成尖顶**的锥台，像倒扣的漏斗或陀螺上半身。这是本库第一条**条件 group change**：不加条件时整球一起变形，加了条件才能做出「一半保留、一半改造」的不对称造型，这是 parameter 族一步到位写不出来的。3600 粒 / 40ms、占格 1410。改 `1.4`/`0.15` 换锥顶的宽窄，改条件为 `y<-1` 只改底部。',
    tags: ['group change', '表达式', '条件形变'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;P=60;k=floor(u/P);s0=floorMod(u,P)/(P-1);eta=k/(NL-1)*PI-PI/2;phi=s0*2*PI;x=3*cos(eta)*cos(phi);y=3*sin(eta);z=3*cos(eta)*sin(phi)' 1 200 'null' 1 g1",
      "/particleex group change parameter g1 'y2=max(y,0);r=sqrt(x*x+z*z);f=y2/3;s=(1-f)*1.4+0.15;x=x*s;z=z*s;y=y' 'y>0'",
    ],
  },
  {
    id: 'gcdrop',
    name: '球顶喇叭裙（group change 条件膨胀成蘑菇）',
    desc: '与上一条同一思路的互补用法：条件 `y<0` 只挑**下半球**，`s = 1 + 1.8·f²` 按深度 f 做**二次加速**的放大——越往底越猛地向外张开，于是下半球被拉成一圈**向外翻卷的喇叭裙**，上半球保持球冠。二次项是关键：换成线性 `s=1+1.8f` 裙边会变成平直的锥台，二次才做出「越到底越松」的蘑菇裙摆。3600 粒 / 18ms、占格 1746。改 1.8 换裙摆张开幅度，改 f² 为 f³ 裙边更贴轴。',
    tags: ['group change', '表达式', '条件形变'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;P=60;k=floor(u/P);s0=floorMod(u,P)/(P-1);eta=k/(NL-1)*PI-PI/2;phi=s0*2*PI;x=3*cos(eta)*cos(phi);y=3*sin(eta);z=3*cos(eta)*sin(phi)' 1 200 'null' 1 g2",
      "/particleex group change parameter g2 'y2=-min(y,0);r=sqrt(x*x+z*z);f=y2/3;s=1+f*f*1.8;x=x*s;z=z*s' 'y<0'",
    ],
  },
  {
    id: 'orbitswarm',
    name: '绕轴轨道群（速度表达式做动力学）',
    desc: '用 **normal 族的速度表达式**做真正的动力学：每 tick 给每粒子算一次速度，`vx=-z/r·0.15, vz=x/r·0.15` 是**垂直于半径的切向速度**——于是每粒子都绕着 y 轴做近似圆轨道（半径由初始位置决定，永不衰减），同时 `vy=0.03` 缓慢上升形成螺旋上升的柱状轨道群。这是本库第一次用「速度场」而非「位置公式」生成形态：**形态是涌现的，不是写死的**。初始位置由 `范围 4 4 4` 的随机分布给出。3000 粒 / 94ms（每 tick 算 3000 次表达式，40 tick 后仍活跃）。改 0.15 换公转速度，改 vy 换上升速率。',
    tags: ['normal', '速度表达式', '动力学'],
    cmds: [
      "/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4 4 4 3000 2000 'r=sqrt(x*x+z*z)+0.001;vx=-z/r*0.15;vy=0.03;vz=x/r*0.15' 1 g1",
    ],
  },
  {
    id: 'torusflow',
    name: '环面流场（切向公转 + 纵向波）',
    desc: '速度场版「环面流」：切向速度 `(-z/r, x/r)·0.18` 让粒子绕 y 轴公转，纵向速度 `vy=0.08·sin(3θ)` 按方位角做正弦起伏——上行的粒子被压下来、下行的被抬上去，于是粒子群整体在**一个环面的管壁上流动**，并随时间演化出波浪状的密度脊线。**关键是 vy 依赖 θ 而不是 y**：依赖 y 只会得到整齐的上下分层，依赖 θ 才有沿环流动的波。3000 粒 / 146ms、占格 2951。改 `sin(3θ)` 的系数换波数，改 0.18 换流速。',
    tags: ['normal', '速度表达式', '动力学'],
    cmds: [
      "/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4 4 4 3000 2000 'rr=sqrt(x*x+z*z)+0.001;th=atan2(z,x);vx=-(z/rr)*0.18;vz=(x/rr)*0.18;vy=0.08*sin(th*3)' 1 g1",
    ],
  },
  {
    id: 'gvspin',
    name: '静止球换速自旋（group change speedexpression）',
    desc: '**两阶段动力学的标准写法**：先用 normal 铺一团**完全静止**的球（速度表达式 `null`），再用 **group change speedexpression** 把速度表达式整体替换成切向场 `(-z/r, 0, x/r)·0.06`。与 group change parameter 不同，这个分支**不改坐标、只换 exe**——粒子从「静止」切到「绕 y 轴公转」，形成一片绕轴涡旋的圆盘。要点是**新速度表达式用了 `x/z`，它们在 group change 时刻取的是粒子当时的绝对位置**（相对参考点），所以每个半径上的转速不同（角速度恒定、线速度随半径增长），外层转得快、内层慢，自然形成螺旋拖尾。2500 粒 / 52ms（含 40 tick 演进）、占格 1102。改 0.06 换转速，改 40 tick 为更长看它是否维持。',
    tags: ['group change', '速度表达式', '两阶段动力学'],
    cmds: [
      "/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0.8 0.8 0.8 2500 300 'null' 1 g1",
      "/particleex group change speedexpression g1 'r=sqrt(x*x+z*z)+0.001;vx=-z/r*0.06;vy=0;vz=x/r*0.06'",
    ],
  },
  {
    id: 'gvhalf',
    name: '上下分层飞离（条件速度表达式）',
    desc: '同一个 group change speedexpression，但带上条件 `y>0`——**只有上半球被换上速度表达式**，下半球保留原 `null` 速度（继续静止）。上半球获得 `(-sinθ, 0, cosθ)·0.10` 的切向速度并 `vy=0.04` 匀速上升，于是**球从中间裂成两层**：下半球原地不动，上半球边转边升，越飘越远（实测 y 跨度 40 tick 5.71 → 80 tick 8.91 → 120 tick 10.51，线性发散）。这是条件 group change 里最有观赏性的一种：**它同时演示了「按空间位置筛选粒子」与「分阶段替换动力学」**，两条能力叠在一条命令里。2500 粒 / 38ms、占格 1123。改条件为 `y<0` 让下半球飞出，改 `0.04` 换上升速度。',
    tags: ['group change', '速度表达式', '条件动力学'],
    cmds: [
      "/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0.8 0.8 0.8 2500 300 'null' 1 g1",
      "/particleex group change speedexpression g1 'th=atan2(z,x);vx=-sin(th)*0.10;vy=0.04;vz=cos(th)*0.10' 'y>0'",
    ],
  },
  {
    id: 'updownsplit',
    name: '单命令条件分流（速度表达式内的比较）',
    desc: '**速度表达式里可以直接写比较运算**——`up=(y>0)` 得到 0 或 1，`vy=up·0.03` 就实现了「上半球上升、下半球不动」，效果与上一条的条件 group change 等价，但**只要一条命令**、不需要先铺再改。这是本库第一次把布尔比较塞进速度表达式：比较结果参与算术时直接当 0/1 用（`(y>0)*0.04` 与 `t2=(y>0);vy=t2*0.04` 两种写法等价，实测 y 跨度都是 7.31）。相比 group change 方案它更短、更实时（每 tick 都重判，粒子飞过 y=0 会自动换挡），但也因此**不能锁住初始分类**——想「一次分类、长期保持」还得用 group change。2500 粒 / 49ms、占格 1118。',
    tags: ['normal', '速度表达式', '条件动力学'],
    cmds: [
      "/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0.8 0.8 0.8 2500 300 'r=sqrt(x*x+z*z)+0.001;up=(y>0);vt=-(z/r)*0.06;vz2=(x/r)*0.06;vx=vt;vz=vz2;vy=up*0.03' 1 g1",
    ],
  },
  {
    id: 'dusttri',
    name: '三色粉团（dust NBT 颜色 + 尺寸）',
    desc: '用**原版 /particle 命令**的 `dust{color:[...],scale:...}` NBT：颜色和点尺寸由 NBT 直接给定，不经过表达式。三条命令在不同位置各放一团，形成蓝/绿/橙三色并置。**关键：NBT 颜色只在原版 `/particle` 路径生效**——模组的 parameter/normal/conditional 族完全不消费 NBT（取证 `src/sim/spawn.ts`：`nbtVisuals` 只在 `execVanilla` 里被调用），用 mod 命令写 dust{color} 会静默变白。**delta 三轴是高斯散布的标准差，不是半径**——写 2.6 会让粒子扩散到 30 格外，1.0–1.4 才是紧凑的一团。`scale` 取值 0.01–4（构造器 Mth.clamp）。2700 粒 / 24ms、占格 2240。',
    tags: ['particle', 'type{NBT}', '颜色'],
    cmds: [
      "/particle minecraft:dust{color:[0.15,0.7,1.0],scale:2.2} -4 0 0 1.0 1.4 1.0 0 900",
      "/particle minecraft:dust{color:[0.4,1.0,0.5],scale:2.2} 4 0 0 1.0 1.4 1.0 0 900",
      "/particle minecraft:dust{color:[1.0,0.55,0.15],scale:2.2} 0 0 0 1.0 1.4 1.0 0 900",
    ],
  },
  {
    id: 'argbtrio',
    name: 'ARGB 三色层（alpha 在首位的字段序陷阱）',
    desc: '`entity_effect` / `tinted_leaves` / `flash` 这类粒子的 NBT `color` 是 **ARGB 序 `[a, r, g, b]`**，不是 RGB——**alpha 排第一位**。写 `[1.0,1.0,0.25,0.25]` 得到的是「不透明 + RGB(1.0,0.25,0.25)」的**红色**；若按 RGB 直觉写 `[1.0,0.25,0.25,1.0]` 会被解成 a=1.0、rgb=(0.25,0.25,1.0)，得到**蓝色**。这是它与 `dust` 的 `color:[r,g,b]` 最本质的区别（dust 是 3 分量 RGB，无 alpha）。三条命令竖直堆叠，实测渲染色分别是 (1.00,0.25,0.25)/(0.25,1.00,0.30)/(0.30,0.40,1.00)——**解码正确性可以直接用渲染色验证**。2100 粒 / 15ms、占格 1842。delta 的 y 轴收到 0.8 让每团压成扁盘。',
    tags: ['particle', 'type{NBT}', 'ARGB'],
    cmds: [
      "/particle minecraft:entity_effect{color:[1.0,1.0,0.25,0.25]} 0 -5 0 1.4 0.8 1.4 0 700",
      "/particle minecraft:tinted_leaves{color:[1.0,0.25,1.0,0.3]} 0 0 0 1.4 0.8 1.4 0 700",
      "/particle minecraft:flash{color:[1.0,0.3,0.4,1.0]} 0 5 0 1.4 0.8 1.4 0 700",
    ],
  },
  {
    id: 'dustfire',
    name: '蓝转金渐变云（dust_color_transition 寿命渐变）',
    desc: '`dust_color_transition{from_color:[...],to_color:[...],scale:...}` 让**每个粒子的渲染色随自身寿命进度从 from 线性插到 to**（`frac = age/(lifetime+1)`，取证 `DustColorTransitionParticle.lerpColors`）。所以同一时刻场上不同年龄的粒子呈现不同颜色——新生的偏蓝、将死的偏金，整团云内部是一张平滑的色彩梯度，播放时整体从蓝缓慢烧成金色。**字段名必须用下划线**（`from_color`/`to_color`），写成驼峰 `fromColor` 会被解析器以「缺字段」拒绝——这和同一 wiki 里其它 NBT 教程的写法不一致，是最容易踩的坑。2500 粒、寿命 40 tick、渲染色种随 age 从 1 涨到 30。',
    tags: ['particle', 'type{NBT}', '颜色'],
    cmds: [
      "/particle minecraft:dust_color_transition{from_color:[0.1,0.35,1.0],to_color:[1.0,0.92,0.3],scale:3.5} 0 0 0 1.3 1.3 1.3 0 2500",
    ],
  },
  {
    id: 'dustshells',
    name: '三层渐变嵌套（尺寸差构成深度）',
    desc: '三条 dust_color_transition 同中心、只差 `scale` 与扩散半径：外层 scale 4.0（粉紫→洋红）、中层 2.5（青→黄绿）、内层 1.2（金→红）。**尺寸差是深度线索**——外圈粒子大、内圈粒子小，等距视角下自动分出前后层，比同尺寸多层叠放清楚得多。配合各自的颜色对，共 6 种颜色在 3 个尺度上同时渐变，渲染层实测渲染色种从 3 涨到 67。3600 粒 / 15ms、占格 2446。',
    tags: ['particle', 'type{NBT}', '颜色'],
    cmds: [
      "/particle minecraft:dust_color_transition{from_color:[0.5,0.1,1.0],to_color:[1.0,0.3,0.5],scale:4.0} 0 0 0 2.1 2.1 2.1 0 1200",
      "/particle minecraft:dust_color_transition{from_color:[0.1,0.8,1.0],to_color:[0.9,1.0,0.3],scale:2.5} 0 0 0 1.4 1.4 1.4 0 1200",
      "/particle minecraft:dust_color_transition{from_color:[1.0,0.85,0.2],to_color:[1.0,0.2,0.2],scale:1.2} 0 0 0 0.75 0.75 0.75 0 1200",
    ],
  },
  {
    id: 'trailconverge',
    name: '星尘汇聚（trail NBT 定向飞行）',
    desc: '`trail{target:[...],duration:N,color:[...]}` 让粒子在一生中**从出生点均匀 lerp 到目标点**（`x += (target−x)/(lifetime−age)`，末 tick 恰好落点）。这里目标设成原点，散布半径 6 格的 1500 粒星尘在 60 tick 内收束成一点——跨度从 68 格压到 4.6 格，占格 1495 降到 224。播放时是最直观的「粒子被吸过来」特效。**必须先给非零 speed**：`/particle` 的 speed 写 0 会让引擎置 `stop=true`，模组 customTick 会把 lerp 位移整个回滚，粒子钉死在出生点（实测速度 0 时位置完全不变）。写 0.001 即可解锁。**duration 就是寿命**——写 40 粒子只活 40 tick。1500 粒 / 14ms、跨度 68.3→4.6。',
    tags: ['particle', 'type{NBT}', '定向飞行'],
    cmds: [
      "/particle minecraft:trail{target:[0.0,0.0,0.0],duration:60,color:[0.55,0.85,1.0]} 0 0 0 6 4 6 0.001 1500",
    ],
  },
  {
    id: 'trailtri',
    name: '三向分流（trail 多目标）',
    desc: '三条 trail 命令共用同一出生点、各指向不同目标（左/中/右），颜色也各不相同：一团混杂的星尘在飞行途中**按颜色分成三股**，分别收束到三个方向，形成 Y 形分流。**这是「空间分组」的最省写法**——不需要 group 或条件表达式，只要给每条命令不同的 target，同源粒子自会按命令各自飞散。duration 70 让三股都有足够时间拉开。2100 粒 / 12ms、跨度 39.5→21.4。',
    tags: ['particle', 'type{NBT}', '定向飞行'],
    cmds: [
      "/particle minecraft:trail{target:[-6.0,0.0,10.0],duration:70,color:[0.35,0.8,1.0]} 0 0 0 3.5 3.5 2 0.001 700",
      "/particle minecraft:trail{target:[0.0,0.0,13.0],duration:70,color:[0.95,0.9,0.4]} 0 0 0 3.5 3.5 2 0.001 700",
      "/particle minecraft:trail{target:[6.0,0.0,10.0],duration:70,color:[1.0,0.5,0.25]} 0 0 0 3.5 3.5 2 0.001 700",
    ],
  },
  {
    id: 'vibconverge',
    name: '振动汇聚（vibration NBT 落点）',
    desc: '`vibration{destination:{block:{pos:[x,y,z]}},arrival_in_ticks:N}` 是原版的「振动信号」粒子：寿命 = `arrival_in_ticks`，每 tick 朝**方块中心（+0.5 各轴）**做 lerp，末 tick 恰好抵达。这里 1200 粒从 5×3×4 格高斯散布出发，24 tick 内汇聚到 (0.5, 3.5, 8.5) 那一点。与 trail 的区别：**目标是方块整数坐标、引擎自动 +0.5 对齐到方块中心**，不用手算；`arrival_in_ticks` 同时决定寿命和飞行时长。同样需要非零 speed 解锁。1200 粒 / 8ms、跨度 48.7→27.5。',
    tags: ['particle', 'type{NBT}', '定向飞行'],
    cmds: [
      "/particle minecraft:vibration{destination:{block:{pos:[0,3,8]}},arrival_in_ticks:24} 0 0 0 5 3 4 0.001 1200",
    ],
  },
  {
    id: 'clifford',
    name: 'Clifford 吸引子（迭代映射的落点云）',
    desc: '教科书级的二维混沌吸引子：`x\' = sin(a·y) + c·cos(a·x)`，`y\' = sin(b·x) + d·cos(b·y)`（a=−1.4, b=1.6, c=−1.0, d=0.9）。做法是**每个粒子先取一个初始点，再在表达式里顺序展开 20 次迭代**，最终画迭代后的位置——所以 8000 个粒子画的是 8000 条不同初始轨道的第 20 步，整体轮廓就是该参数下的吸引子。**迭代必须顺序展开**（`nx=...;x=nx;ny=...;y=ny;` 重复），不能符号代入——符号展开会指数爆炸（n=12 就卡死），顺序展开是线性增长（20 次迭代约 1400 字符）。**吸引子天然落在 [−2,2]² 内，要乘 5 倍缩放**才有 26 格的观感；不缩放时占格只有 149。8000 粒 / 61ms、占格 2362。改 a/b/c/d 换形态（每个参数组出一种「花」）。',
    tags: ['parameter', '表达式', '迭代映射'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 7999 'u=t;NL=100;P=80;k=floor(u/P);s0=floorMod(u,P)/(P-1);x=4*k/(NL-1)-2;y=4*s0-2;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;nx=sin(-1.4*y)+-1.0*cos(-1.4*x);ny=sin(1.6*x)+0.9*cos(1.6*y);x=nx;y=ny;x=x*5;y=y*5;z=0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'dejong',
    name: 'de Jong 吸引子（细丝缠绕的落点云）',
    desc: '与 Clifford 同一族（Peter de Jong 映射），参数换成 a=1.6411, b=1.9021, c=−2.0574, d=−1.3456——这四个参数让轨道形成**大量互相缠绕的细丝**而不是团块，是 Clifford 参数里结构最丰富的一组。同样顺序展开 25 次迭代、乘 4 倍缩放（这个参数组的吸引子本身落点更密集，缩放比要小）。**与 `clifford` 模板的差别只在参数与缩放**——四个系数就是四个旋钮，每换一组都是一朵新花；`a/b/c/d` 全部落在 [−2.1, 2.1] 内通常有界。8000 粒 / 79ms、占格 3323（全库迭代类最高）。',
    tags: ['parameter', '表达式', '迭代映射'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 7999 'u=t;NL=100;P=80;k=floor(u/P);s0=floorMod(u,P)/(P-1);x=4*k/(NL-1)-2;y=4*s0-2;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;nx=sin(1.6411*y)+-2.0574*cos(1.6411*x);ny=sin(1.9021*x)+-1.3456*cos(1.9021*y);x=nx;y=ny;x=x*4;y=y*4;z=0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'checkersphere',
    name: '经纬棋盘球（颜色 = 经纬格交替）',
    desc: '球面的极坐标网格，**颜色按经纬格 (k+i) 的奇偶交替**：亮银 / 暗灰 两色，形成经典的「棋盘球」外观——这是地理课本上演示经纬度的标准画法。写法上关键是 `floorMod(k+s0*48,2)`：k 是纬线序号、s0*48 是经线序号，两者相加取模 2，所以每换一行或换一列颜色都翻转，自然拼出棋盘。**必须用 rgba 变体（rgbaparameter）**——带颜色槽的 parameter 族会直接用命令色，表达式里的 cr/cg/cb 被完全忽略（取证 src/sim/spawn.ts:409，只有 color=null 的 rgba 分支才读 s.cr）。3840 粒 / 20ms、占格 1272、渲染色种 94（明暗梯度与原版纹理叠加）。改 48/80 换网格密度。',
    tags: ['rgbaparameter', '表达式', '球面'],
    cmds: [
      "/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 3839 'u=t;NL=80;P=48;k=floor(u/P);s0=floorMod(u,P)/(P-1);s2=k/(NL-1)*PI-PI/2;s1=s0*2*PI;dis=3;x=dis*cos(s2)*cos(s1);y=dis*sin(s2);z=dis*cos(s2)*sin(s1);chk=floorMod(k+s0*48,2);v=0.15+0.85*chk;cr=v;cg=v;cb=v' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'lifesync',
    name: '寿命分层退场（三层接力消隐）',
    desc: '三条命令画三个同心的球壳（半径 3 / 2 / 4），但 **age 槽分别给 8 / 24 / 48**：粒子数在 t=8 / 24 / 48 三个时刻依次归零，于是画面从「三层套球」逐级剥落到只剩最外层，再整体消失。**这是唯一能用「寿命」做动画节奏的手法**——不改位置、不改颜色，只让不同层的粒子在不同时刻死掉。注意 age 是**绝对寿命**（tick），不是相对延迟：写成 8 的粒子从出生起就只活 8 tick。播放时能看到 11520→7680→3840 的阶梯式粒子数下降，占格 3871→2577→1869。',
    tags: ['parameter', '表达式', '时间节奏'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3839 'u=t;s2=(u/48)/(80-1)*PI-0.5*PI;s1=floorMod(u,48)/48*2*PI;dis=3;x=dis*cos(s2)*cos(s1);y=dis*sin(s2);z=dis*cos(s2)*sin(s1)' 1 8 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3839 'u=t;s2=(u/48)/(80-1)*PI-0.5*PI;s1=floorMod(u,48)/48*2*PI;dis=2;x=dis*cos(s2)*cos(s1);y=dis*sin(s2);z=dis*cos(s2)*sin(s1)' 1 24 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3839 'u=t;s2=(u/48)/(80-1)*PI-0.5*PI;s1=floorMod(u,48)/48*2*PI;dis=4;x=dis*cos(s2)*cos(s1);y=dis*sin(s2);z=dis*cos(s2)*sin(s1)' 1 48 'null' 1 null",
    ],
  },
  {
    id: 'sdfdiff',
    name: 'SDF 差集（打洞的球）',
    desc: '**构造实体几何（CSG）**的差集运算：大球半径 2.4 **减去**沿 z 轴的圆柱（半径 1）。写法是三个符号距离函数合成——球 `d1=|p|−2.4`、圆柱 `d2=1−√(x²+z²)`（取负号表示「内部」），差集取 `max(d1, −d2)`，等值面 `|m|<0.06` 就是边界。等距视角下是一个清晰的**贯穿孔圆管**，俯视能看到完整的环形截面。**SDF 的价值在于可组合**：并集 = `min`、交集 = `max`、差集 = `max(a,−b)`，任何实体都能由这几个算子拼出来，而不必硬推一个合并后的方程。5584 粒 / 75ms、占格 496。改 2.4/1.0 换球径与孔径。',
    tags: ['conditional', '表达式', 'SDF 实体造型'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'd1=sqrt(x*x+y*y+z*z)-2.4;d2=1.0-sqrt(x*x+z*z);m=max(d1,-d2);abs(m)<0.06' 0.09 200 null 1 null",
    ],
  },
  {
    id: 'sdfisect',
    name: 'SDF 交集（球切立方）',
    desc: '交集运算：球（半径 2.2）∩ 立方体（半宽 1.5），取 `max(d1, d2)`。结果是**一个带棱角的「圆角立方」**——六个面朝内的部分被球面削圆，八个角保留立方体的轮廓。等距视角下棱线清晰、面微鼓，比纯球或纯立方都更有辨识度。**交集是三个 SDF 算子里视觉对比最强的**：并集把两个形体粘连（轮廓变复杂），差集挖洞（拓扑改变），交集则同时保留双方的特征。9437 粒 / 45ms、占格 938。调 2.2/1.5 的比例换「方」与「圆」的比重。',
    tags: ['conditional', '表达式', 'SDF 实体造型'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 2.6 2.6 2.6 'd1=sqrt(x*x+y*y+z*z)-2.2;d2=max(max(abs(x),abs(y)),abs(z))-1.5;m=max(d1,d2);abs(m)<0.06' 0.09 200 null 1 null",
    ],
  },
  {
    id: 'truchet',
    name: 'Truchet 瓷砖（随机定向弧线）',
    desc: '每块 2×2 的瓷砖里画两段四分之一圆弧，**圆弧的朝向按格号 (U+V) 的奇偶交替**——于是相邻瓷砖的弧线首尾相接，自然连成一张缠绕的曲线网，这是计算几何里著名的 Truchet 瓷砖。写法要点：`U=floor(x/2)` 取格号、`fx=(x−2U+2)*0.5` 把格内坐标归一到 [0,1]，`p=floorMod(U+V,2)` 是奇偶标志，圆心 `c1x=p` 让偶数格圆心在左、奇数格圆心在右。**格内归一化务必用 `(x−2U+2)*0.5` 而不是 `x−2U`**：`floor` 对负数向下取整，直接相减会落进 (−2,0]，图案会错位甚至零命中（本模板第一版就是这样全空的）。8406 粒 / 42ms、占格 354。改 2 换瓷砖尺寸。',
    tags: ['conditional', '表达式', '瓷砖图案'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 6 0 6 'U=floor(x/2);V=floor(z/2);fx=(x-U*2+2)*0.5;fz=(z-V*2+2)*0.5;p=floorMod(U+V,2);c1x=p*1;c1z=0;c2x=(1-p)*1;c2z=1;d1=sqrt((fx-c1x)*(fx-c1x)+(fz-c1z)*(fz-c1z));d2=sqrt((fx-c2x)*(fx-c2x)+(fz-c2z)*(fz-c2z));m=min(abs(d1-1),abs(d2-1));m<0.06' 0.04 200 null 1 null",
    ],
  },
  {
    id: 'polardens',
    name: '黄金角密度花瓣（极坐标径向调制）',
    desc: '把**黄金角**（2.399963 rad，斐波那契球用的同一个常数）用在平面极坐标上：每粒子的方位角按黄金角递增，半径则由 `0.6 + 0.05√u + 0.5·|cos(3θ)|` 给出——前两项让粒子向中心聚拢，最后一项**在径向上按方位角做三次余弦调制**，于是密度沿六个方向堆积，形成六瓣的花形密度带。与 `fibonaccisphere`（球面均匀铺）互补：那条求均匀，这条用同一个角求**非均匀**。俯视是清晰的六瓣花，正视压成一条带（因为 s2=0）。5000 粒 / 12ms、占格 716。改 3 换瓣数，改 0.5 换瓣的深浅。',
    tags: ['polarparameter', '表达式', '密度场'],
    cmds: [
      "/particleex polarparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 4999 'u=t;s1=u*2.399963;s2=0;dis=0.6+0.05*sqrt(u)+0.5*abs(cos(s1*3))' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'matrixtrio',
    name: '矩阵变换三态（剪切 / 缩放 / 旋转）',
    desc: '同一个球壳，用**矩阵乘法**分别做三种线性变换并排展示：左剪切（`x += 0.8y`，球被斜切成倾斜椭球）、中缩放（对角阵 `(1.6, 0.6, 1.2)`，压成扁椭球）、右旋转（绕 z 轴 45°）。**这是本库唯一使用矩阵语法的模板**，也是三种写法的直接对照。矩阵语法要点：字面量用**双逗号分行** `(1,0,0,,0,1,0,,0,0,1)`，乘向量后**元组解构赋值** `(x,,y,,z)=M*(px,,py,,pz)`；**维度必须严格匹配**（3×3 只能乘 3×1、结果 3 分量），否则整条表达式抛 `need matrix, function call...` 且零粒子。取单个元素 `M[i]` 不支持（`[` 是未识别字符）。3840 粒 × 3、每条 10–16ms、占格 1292–1424。**矩阵路线不需要先建后改**：比 group change 少一条命令。',
    tags: ['parameter', '表达式', '矩阵'],
    cmds: [
      "/particleex parameter minecraft:end_rod -4.5 0 0 1 0.95 0.89 1 0 0 0 0 3839 'u=t;NL=80;P=48;k=floor(u/P);s0=floorMod(u,P)/(P-1);s2=k/(NL-1)*PI-PI/2;s1=s0*2*PI;R=3;px=R*cos(s2)*cos(s1);py=R*sin(s2);pz=R*cos(s2)*sin(s1);sh=0.8;(x,,y,,z)=(1,sh,0,,0,1,0,,0,0,1)*(px,,py,,pz)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3839 'u=t;NL=80;P=48;k=floor(u/P);s0=floorMod(u,P)/(P-1);s2=k/(NL-1)*PI-PI/2;s1=s0*2*PI;R=3;px=R*cos(s2)*cos(s1);py=R*sin(s2);pz=R*cos(s2)*sin(s1);(x,,y,,z)=(1.6,0,0,,0,0.6,0,,0,0,1.2)*(px,,py,,pz)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 4.5 0 0 1 0.95 0.89 1 0 0 0 0 3839 'u=t;NL=80;P=48;k=floor(u/P);s0=floorMod(u,P)/(P-1);s2=k/(NL-1)*PI-PI/2;s1=s0*2*PI;R=3;px=R*cos(s2)*cos(s1);py=R*sin(s2);pz=R*cos(s2)*sin(s1);a=0.7854;c=cos(a);s=sin(a);(x,,y,,z)=(c,-s,0,,s,c,0,,0,0,1)*(px,,py,,pz)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'cospockets',
    name: '三轴余弦等值面（对称嵌套泡）',
    desc: '等值面 `cos(kx)·cos(ky)·cos(kz) = c` ——三个方向各取一次余弦再相乘。这个函数**沿每个坐标轴都是偶函数、且三轴等价**，所以等值面在八个卦限里完全对称，形成一组**嵌套的球状泡**：外层大泡、内层小泡，泡之间由细颈相连（系数 c=0.35 恰好切在「泡与颈的分界」附近，c 取 0 附近会连成整片网、取 ±0.9 附近只剩孤立的球）。与同库的 gyroid（sin 之和）对照：gyroid 是单一连通的极小曲面，这条是**离散的泡状等值面**，视觉上更「块」。6673 粒 / 60ms、占格 1837。改 1.2 换泡的个数，改 0.35 在「网」与「孤立球」之间过渡。',
    tags: ['conditional', '表达式', '等值面'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.2 3.2 3.2 'abs(cos(1.2*x)*cos(1.2*y)*cos(1.2*z)-0.35)<0.07' 0.14 200 null 1 null",
    ],
  },
  {
    id: 'coshtube',
    name: '双曲余弦管（两端翻开的喇叭）',
    desc: '半径按 `r = 1.2·cosh(0.9y) + 0.4` 随高度增长——cosh 在中段近似抛物线、两端指数上扬，所以管子**中间收腰、上下端急剧外翻成喇叭口**，侧视是一个「沙漏」的镜像（两头大、中间细）。这是悬链面（catenoid，本库已有 `catenoid` 模板用 1/u 形式的精确极小曲面）的**参数化近似版**：不用解微分方程，直接把 cosh 当半径函数就得到近乎等价的轮廓，代价低得多（5ms vs 15ms+）。2400 粒 / 5ms、占格 1556。改 0.9 换喇叭张开的快慢，改 1.2 换整体粗细。',
    tags: ['parameter', '表达式', '双曲函数'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;NL=60;P=40;k=floor(u/P);s0=floorMod(u,P)/(P-1);y0=(k/(NL-1)-0.5)*5;rr=1.2*cosh(y0*0.9)+0.4;x=rr*cos(s0*2*PI);z=rr*sin(s0*2*PI);y=y0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'cbrttube',
    name: '立方根扭曲管（奇对称扭曲）',
    desc: '用 `cbrt(y)` 做扭曲相位：`r = 2.4 + 0.55·sin(4·cbrt(2y))`，`φ = 2πs + 3·cbrt(2y)`。立方根是**奇函数且在中段平缓、两端陡峭**——所以管子在中部扭转慢、靠近两端扭得又快又密，侧视呈现「上下密、中间疏」的鼓胀-收腰交替轮廓，与等速扭转（螺旋线）观感完全不同。**cbrt 对负数有定义**（不像 pow(x,1/3) 会返回 NaN），这是它相对 pow 的关键优势。2400 粒 / 7ms、占格 1402。改 0.55 换鼓胀幅度，改 3 换扭转角速度。',
    tags: ['parameter', '表达式', '非线性扭曲'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;NL=60;P=40;k=floor(u/P);s0=floorMod(u,P)/(P-1);y0=(k/(NL-1)-0.5)*6;tw=cbrt(y0*2);r=2.4+0.55*sin(tw*4);x=r*cos(s0*2*PI+tw*3);z=r*sin(s0*2*PI+tw*3);y=y0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'hypertorus',
    name: '4D 超环面（穿在四维空间里的甜甜圈）',
    desc: '先用两个独立角 `a`（绕主轴）和 `b`（绕副轴）搭出标准 3D 环面，再把副轴上的圆抬进第四维 `w = 0.9·R2·sin(b)`，随后在 x-w 平面旋转 1.3a 角、最后做透视 `sc = 2.6/(2.6+w)` 投影回三维。这样内外表面会**互相穿过**——近处（w 大）的段被透视放大、远处被缩小，出现普通 3D 环面绝不可能有的「管壁自交」层次感。4000 粒 / 16ms、占格 2013。改 1.3 换 x-w 旋转速度（越大缠绕越紧），改 0.9 换抬升幅度（0 退化为普通环面）。',
    tags: ['parameter', '表达式', '4D 投影'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3999 'u=t;NL=80;P=50;i=floor(u/P);j=floorMod(u,P);a=i/(NL-1)*2*PI;b=j/(P-1)*2*PI;R1=3;R2=1.1;px=(R1+R2*cos(b))*cos(a);py=R2*sin(b);pz=(R1+R2*cos(b))*sin(a);w=R2*sin(b)*0.9;ca=cos(a*1.3);sa=sin(a*1.3);xr=px*ca-pz*sa;zr=px*sa+pz*ca;sc=2.6/(2.6+w);x=xr*sc;y=py*sc;z=zr*sc' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'superquad',
    name: '超二次曲面（指数控制形状的星形环）',
    desc: '超二次曲面的两条指数 `e1`（纬度方向）与 `e2`（经度方向）分别控制两个方向的「方/圆」程度：`e = 1` 是圆，`e < 1` 趋方，`e > 1` 趋尖。用 `signum(u)·|u|^e` 保留符号地做幂运算（直接 `pow` 遇负数会 NaN）。这条取 `e1 = 0.35`（纬度趋方、赤道处形成平直带）、`e2 = 1.7`（经度趋尖、周向形成尖脊），得到一个**带棱的星形环**，看上去像 8 个尖角向外顶出的实体环。2000 粒 / 9ms、占格 784。改 `e1=e2=0.4` 得圆角立方、改 `e1=1.6;e2=0.5` 得双锥（同一公式整条形态谱）。',
    tags: ['parameter', '表达式', '超二次曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 1999 'u=t;NL=50;P=40;k=floor(u/P);s0=floorMod(u,P)/(P-1);e1=0.35;e2=1.7;ct=cos(k/(NL-1)*PI-PI/2);st=sin(k/(NL-1)*PI-PI/2);cp=cos(s0*2*PI);sp=sin(s0*2*PI);x=3*signum(ct)*pow(abs(ct),e1)*signum(cp)*pow(abs(cp),e2);y=3*signum(st)*pow(abs(st),e1);z=3*signum(ct)*pow(abs(ct),e1)*signum(sp)*pow(abs(sp),e2)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'borromean',
    name: '博罗米恩三环（两两不套、三环互锁）',
    desc: '拓扑学里最著名的链环：**任意两个环单独看都不套在一起，但三个环合起来拆不开**。做法是三条相同的圆环命令（管半径 0.30，比单环粗得多），各自平移错开后**在管截面的相位 `ang` 上错开 0° / 120° / 240°**——`rr·cos(ang)` 决定管壁的横向偏移、`rr·sin(ang)` 决定纵向，于是三环在空间里互相穿过对方管腔，正是 Borromean 的几何。8400 粒 / 63ms、占格 976。改 `rr=0.30` 换管的粗细（太细看不出互锁、太粗变成一团），改 ±1.1/±1.2 的平移换三环展开程度。',
    tags: ['parameter', '表达式', '链环'],
    cmds: [
      "/particleex parameter minecraft:end_rod -1.1 1.2 0 1 0.95 0.89 1 0 0 0 0 2799 'u=t;NR=140;NL=20;k=floor(u/NL);s=floorMod(u,NL)/NL;a=k/(NR-1)*2*PI;th=a;ang=s*2*PI;R=2.2;rr=0.30;x=(R+rr*cos(ang))*cos(th)+(-1.1);z=(R+rr*cos(ang))*sin(th);y=rr*sin(ang)+(1.2)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 1.1 1.2 0 1 0.95 0.89 1 0 0 0 0 2799 'u=t;NR=140;NL=20;k=floor(u/NL);s=floorMod(u,NL)/NL;a=k/(NR-1)*2*PI;th=a;ang=s*2*PI;R=2.2;rr=0.30;x=(R+rr*cos(ang))*cos(th)+(1.1);z=(R+rr*cos(ang))*sin(th);y=rr*sin(ang)+(1.2)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 -1.2 0 1 0.95 0.89 1 0 0 0 0 2799 'u=t;NR=140;NL=20;k=floor(u/NL);s=floorMod(u,NL)/NL;a=k/(NR-1)*2*PI;th=a;ang=s*2*PI;R=2.2;rr=0.30;x=(R+rr*cos(ang))*cos(th)+(0);z=(R+rr*cos(ang))*sin(th);y=rr*sin(ang)+(-1.2)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'lissajous',
    name: '李萨如结 3:4:5（三轴异频正弦）',
    desc: '三个坐标轴各自按**不同频率**做正弦：x 用 3 倍、y 用 4 倍、z 用 5 倍（y 再补 90° 相位），于是这条曲线在盒子里绕来绕去、**既不闭合自交也不重复**，形成立体编织花纹。频率全取整数才让曲线在 2π 内闭合（3:4:5 是最小的三整数互质组）；再叠一层管半径 `0.22` 的圆截面把线变成细管，否则太细看不清。**这是与 `torusknot` 相对的另一条 3D 曲线路线**：环面结缠在一个环面上，李萨如结填满整个长方体。6000 粒 / 24ms、占格 805。改 3/4/5 换频率比（相同频率会退化成平面椭圆）。',
    tags: ['parameter', '表达式', '3D 曲线'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 5999 'u=t;NR=250;NL=24;k=floor(u/NL);s=floorMod(u,NL)/NL;a=k/(NR-1)*2*PI;t2=s*2*PI;x=3*sin(3*a)+0.22*cos(t2);y=3*sin(4*a+1.5708)+0.22*sin(t2);z=3*sin(5*a)+0.22*cos(t2+1.0)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'trefoil2',
    name: '(2,3) 环面结加厚管（互反参数）',
    desc: '与库里 `torusknot` 的 (5,2) 是同一族公式、**参数互反**：(p,q) = (2,3) 而不是 (5,2)。p 绕主轴、q 绕管，互质才不打结；(2,3) 给出的是经典**三叶结**的对称形态——三个花瓣状回环均匀分布。管半径 0.25 的圆截面沿曲线扫过，让这条结有了实体管的样子。注意 p/q 互换**不是同一条曲线**（(2,3) 与 (3,2) 互为镜像，缠绕方向和花瓣数都不同），这是参数化写法里最容易忽略的一点。4000 粒 / 19ms、占格 640。改 p/q 换结型：(2,5) 是五叶星、(3,4) 更繁复。',
    tags: ['parameter', '表达式', '环面结'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3999 'u=t;NR=200;NL=20;k=floor(u/NL);s=floorMod(u,NL)/NL;a=k/(NR-1)*2*PI;t2=s*2*PI;R1=2.4;x=(R1+0.5*cos(3*a))*cos(2*a)+0.25*cos(t2);y=0.5*sin(3*a)+0.25*sin(t2);z=(R1+0.5*cos(3*a))*sin(2*a)+0.25*cos(t2+1.5708)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'pitchspiral',
    name: '音高螺旋（音乐理论的 pitch helix）',
    desc: '音乐理论里描述音高的经典几何：**音高轴的每一圈是一个八度**——绕一圈回到同名音（如 C 到 C），但升高了一个八度，所以螺旋整体向上。公式 `a = 八度号·2π + 半音/12·2π` 让 12 个半音均匀分布在一圈上，同名的 C 在相邻两圈的正上方对齐。半径随八度缓慢增大（`0.8 + 0.09·八度号`），侧视就成了一个**向上张开的锥形螺线**。这是把「音阶的循环性 + 音高的单调性」同时画出来的一条曲线，也是把乐理概念直接转成粒子形态的少用例。1152 粒 / 11ms、占格 273（细线）。改 0.20 换每八度升多少，改 0.09 换锥的张开速度。',
    tags: ['parameter', '表达式', '音乐几何'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 1151 'u=t;NO=48;NL=24;o=floor(u/NL);s=floorMod(u,NL)/NL;a=o*2*PI+s*2*PI/12;ang=s*2*PI;r=0.8+o*0.09+0.12*cos(ang);x=r*cos(a);z=r*sin(a);y=(o-24)*0.20+0.12*sin(ang)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'tonnetz',
    name: '音网 Tonnetz（六边形点阵 + 球节点）',
    desc: 'Tonnetz（音网）是音乐理论里的另一种音高几何：**它把和声关系摆成一张二维三角网**——相邻格点代表纯五度、斜向代表大三度，在网上的移动对应和声进行。这条用三角格点阵实现（行距 = 列距×0.866 才是等边三角网，**行内每隔一行错位半格**），每个格点再撒 6 个点围成小球，让节点有实体感。4608 粒 / 12ms、占格 4226——是音高类模板里视觉密度最高的。改 `NB=6` 换球节点密度，改 0.6 换格距。',
    tags: ['parameter', '表达式', '音乐几何'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 4607 'u=t;NX=32;NZ=24;NB=6;k=floor(u/(NZ*NB));rem=floorMod(u,NZ*NB);j=floor(rem/NB);b=floorMod(rem,NB);fx=k-(NX-1)/2;fz=j-(NZ-1)/2;off=floorMod(j,2)*0.5;ba=b/NB*2*PI;x=fx*0.6+off*0.6+0.14*cos(ba);z=fz*0.6*0.866+0.14*sin(ba);y=0.14*cos(ba*2)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'archimedean',
    name: '阿基米德立体族（一个权重走完全谱）',
    desc: '球面单位方向 `(cx,cy,cz)` 乘上半径 `r = 3/(w·n₁ + (1−w)·n∞)`，其中 `n₁ = |x|+|y|+|z|`（八面体范数）、`n∞ = max(|x|,|y|,|z|)`（立方体范数）。**w 从 0 扫到 1，形状连续地在「八面体 ↔ 立方八面体 ↔ 立方体」之间变形**——w=0 是正八面体、w=0.35 是截角八面体、w=0.5 是立方八面体（六个正方形 + 八个三角形，阿基米德立体）、w=0.75 是截角立方体、w=1 是立方体。**一条公式换一个权重就得到整族**，是本库密度最高的几何参数化写法。命令并发三条对照 w=0.35 / 0.5 / 0.75，各 2000 粒。改 w 换立体类型。',
    tags: ['parameter', '表达式', '多面体'],
    cmds: [
      "/particleex parameter minecraft:end_rod -5 0 0 1 0.95 0.89 1 0 0 0 0 1999 'u=t;N=2000;NL=40;P2=50;k=floor(u/P2);p=floorMod(u,P2)/(P2-1);la=k/(NL-1)*PI-PI/2;lo=p*2*PI;cx=cos(la)*cos(lo);cy=sin(la);cz=cos(la)*sin(lo);a=abs(cx);b=abs(cy);c=abs(cz);n1=a+b+c;ninf=max(max(a,b),c);r=3/(0.35*n1+0.65*ninf);x=cx*r;y=cy*r;z=cz*r' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 1999 'u=t;N=2000;NL=40;P2=50;k=floor(u/P2);p=floorMod(u,P2)/(P2-1);la=k/(NL-1)*PI-PI/2;lo=p*2*PI;cx=cos(la)*cos(lo);cy=sin(la);cz=cos(la)*sin(lo);a=abs(cx);b=abs(cy);c=abs(cz);n1=a+b+c;ninf=max(max(a,b),c);r=3/(0.5*n1+0.5*ninf);x=cx*r;y=cy*r;z=cz*r' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 5 0 0 1 0.95 0.89 1 0 0 0 0 1999 'u=t;N=2000;NL=40;P2=50;k=floor(u/P2);p=floorMod(u,P2)/(P2-1);la=k/(NL-1)*PI-PI/2;lo=p*2*PI;cx=cos(la)*cos(lo);cy=sin(la);cz=cos(la)*sin(lo);a=abs(cx);b=abs(cy);c=abs(cz);n1=a+b+c;ninf=max(max(a,b),c);r=3/(0.75*n1+0.25*ninf);x=cx*r;y=cy*r;z=cz*r' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'paraboloid',
    name: '旋转抛物面（开口朝上的碗）',
    desc: '`y = 0.28·r² − 2.4`，`r` 从 0 到 3.2——一个**开口朝上、底面平滑的旋转抛物面**。与库里已有的椭球/超环面不同，抛物面是**唯一一个「曲率沿半径均匀变化」的曲面**：顶点处曲率最大、边缘趋于平坦，所以碗底反光最集中、边缘散开。这也正是卫星天线和车灯反射面的几何形状（平行光从焦点射出会变成平行光）。60×60 网格、3600 粒 / 12ms、占格 734。改 0.28 换碗的深浅（越大越深越陡），改 −2.4 换整体高度。',
    tags: ['parameter', '表达式', '二次曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NR=60;NL=60;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);rr=k/(NR-1)*3.2;th=s*2*PI;x=rr*cos(th);z=rr*sin(th);y=rr*rr*0.28-2.4' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'saddle',
    name: '双曲抛物面（马鞍形）',
    desc: '`y = 0.16·(x² − z²)`——沿 x 方向向上弯、沿 z 方向向下弯，是一个**马鞍**。这是唯一同时具备**正负两种曲率**的二次曲面：从中心任一点出发，一个方向是「谷」、垂直方向是「脊」，所以从上方看是交叉的双曲线，从侧面看是两条反向抛物线。鞍点（原点）处两个主曲率大小相等、符号相反（高斯曲率为负），这也是它区别于抛物面（处处正曲率）的本质。60×60 网格、3600 粒 / 8ms、占格 682。改 0.16 换鞍的陡峭程度。',
    tags: ['parameter', '表达式', '二次曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NR=60;NL=60;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);xx=(k/(NR-1)-0.5)*6;zz=(s-0.5)*6;x=xx;z=zz;y=(xx*xx-zz*zz)*0.16' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'potentialflow',
    name: '圆柱绕流（势流场可视化）',
    desc: '理想流体的**势流绕过圆柱**的解析解：速度场按极坐标分解为径向 `v_r = U·cosθ·(1−a²/r²)` 与切向 `v_θ = −U·sinθ·(1+a²/r²)`，其中 `a=1.4` 是圆柱半径。把**切向速度映射成高度 `y = v_θ·0.5`**，就得到一张立体「流线高度图」——圆柱内部（r 接近 a）速度被压缩、贴壁处流速最快（y 峰值），远离圆柱时流场趋于均匀。这是势流理论最经典的定解问题，也是**唯一能用闭式解画出来的流体力学场**（真实黏性流需要数值求解）。4200 粒 / 16ms、占格 494。改 1.4 换圆柱半径，改 0.5 换高度夸张倍数。',
    tags: ['parameter', '表达式', '物理场'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 4199 'u=t;NR=60;NL=70;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);r=1.4+k/(NR-1)*2.2;th=s*2*PI;u0=1;aa=1.4;vr=u0*cos(th)*(1-aa*aa/(r*r));vt=-u0*sin(th)*(1+aa*aa/(r*r));x=r*cos(th);z=r*sin(th);y=vt*0.5' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'vortexpair',
    name: '涡对（双点涡流线俯视图）',
    desc: '两个**旋向相反**的点涡放在 (±0.9, 0)：左涡逆时针、右涡顺时针。势流理论里「一对反向点涡」的流线可以用双中心角差 `y = 0.6·(atan2(z−d, x+0.9) − atan2(z+d, x−0.9))` 精确表示——**两条角坐标之差在每一点都刻画了「绕两个涡心的相位差」**，于是等值线就是环绕双涡的封闭环。俯视看不到这个双瓣结构（高度信息在 y 轴上）。等距视角下呈现**上下对称的双峰鞍谷**，与 `saddle` 的几何鞍点形状相似、成因完全不同（一个是二次曲面，一个是流场奇点）。4000 粒 / 8ms、占格 450。改 0.9 换涡间距，改 0.6 换相位差幅度。',
    tags: ['parameter', '表达式', '物理场'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3999 'u=t;NR=50;NL=80;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);d=0.4+k/(NR-1)*2.6;th=s*2*PI;c1=0.9;c2=-0.9;x=c1+d*cos(th);z=d*sin(th);p1=atan2(z-d, x+c1);p2=atan2(z+d, x-c2);y=0.6*(p1-p2)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'menger',
    name: '门格海绵两级递归（分形实体）',
    desc: '门格海绵：把一个立方体分成 3³ 个小块、**挖掉中心块和六个面心块**（保留 20 个角/棱块），然后对每个保留的小块递归重复。判定式写成「三个轴向坐标里有几个落在中带 `floorMod(n,3)==1`」——**中带数 ≤ 1 才保留**（=1 是棱块、=0 是角块），中带数 ≥ 2 的（面心块和中心块）全部挖掉。这条做了**两级递归**：第一级在 9×9×9 的大网格上、第二级在每个 3×3×3 单元内部再分 3 层，用同一个 `floorMod(...,3)==1` 判据。8789 粒 / 23ms、占格 4736。改 `0.7` 换单元尺度，删掉第二级的 `ok2` 就退化成一级海绵（3872 粒、占格 3872）。',
    tags: ['conditional', '表达式', '分形'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'a=floor((x+3)/0.7);b=floor((y+3)/0.7);c=floor((z+3)/0.7);a0=floor(a/3);b0=floor(b/3);c0=floor(c/3);ai=floorMod(a0,3)==1;bi=floorMod(b0,3)==1;ci=floorMod(c0,3)==1;cnt=ai+bi+ci;ok1=cnt<=1;ar=floorMod(a,3)==1;br=floorMod(b,3)==1;cr=floorMod(c,3)==1;cnt2=ar+br+cr;ok2=cnt2<=1;ok1*ok2==1' 0.25 200 null 1 null",
    ],
  },
  {
    id: 'helixflow',
    name: '径向驻波分层（速度场把粒子困在柱面）',
    desc: '切向速度 `(-z/r, x/r)·0.09` 让粒子绕 y 轴公转，纵向速度 `vy = 0.008 + 0.015·sin(2r)` **只依赖到轴的距离 r**。关键在于 `sin(2r)` 在 `r ≈ 0.785, 2.36, 3.93…` 处过零——**过零点两侧的 vy 符号相反**，粒子被推回零点所在的半径，形成一圈圈**径向驻波**。于是原本均匀的粒子团被「挤」进若干个同心圆柱壳里，俯视看是同心圆环、侧视看是竖直条纹。**这与 `torusflow` 的关键区别**：那里的 vy 依赖方位角 θ（沿环流动的波），这里依赖半径 r（把粒子按半径分选）。3000 粒 / 121ms（150 tick 后）、占格 2134。改 `sin(2r)` 的 2 换波数，改 0.015 换分层的锐利程度（越大分层越紧）。',
    tags: ['normal', '速度表达式', '动力学'],
    cmds: [
      "/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 1.8 0.6 1.8 3000 500 'r=sqrt(x*x+z*z)+0.001;vx=-z/r*0.09;vy=0.008+0.015*sin(r*2);vz=x/r*0.09' 1 g1",
    ],
  },
  {
    id: 'gaussdist',
    name: '高斯整数模长地貌（数论曲面）',
    desc: '在整数格点 `(a,b)` 上取高度 `y = ((a²+b²) mod 11)/10 − 0.5`——**每个格点的高度由「该点到原点的距离平方对 11 取余」决定**。高斯整数 `a+bi` 的模长平方正好是 `a²+b²`，所以这张表面画的是「高斯整数到原点的距离（取模后）」在整数格上的分布。因为距离平方是半径的二次函数，取余后在每个半径环上给出相同的值，于是**沿半径方向形成一圈圈阶梯状的环带**，环带在 11 的倍数处骤然落回最低点，形成辐射状的分界。这是数论里「模长分布」最直观的三维可视化。4900 粒 / 12ms、占格 3708。改 11 换模数（越大环带越密），改 0.19 换格距。',
    tags: ['parameter', '表达式', '数论'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 4899 'u=t;NL=70;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);a=k-(NL-1)/2;b=floor(s*70)-(NL-1)/2;n2=a*a+b*b;m=floorMod(n2,11);x=a*0.19;z=b*0.19;y=(m/10-0.5)*2.4' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'sizespectrum',
    name: 'dust 尺度谱（scale 0.1 → 4.0 五级）',
    desc: '`dust{color,scale}` 的 `scale` 是**唯一直接控制单个粒子视觉尺寸的参数**（构造器 Mth.clamp 到 0.01–4.0）。五条命令排成一列，scale 取 0.1 / 0.4 / 1.0 / 2.0 / 4.0，渲染色由红到蓝标示档位。**实测渲染尺寸从 0.9 到 36.0（40 倍）**——注意这不是线性：`scale` 同时参与贴图缩放和 alpha 衰减，小 scale 的点在远处几乎不可见、4.0 的大点会盖住整片画面。同一条命令里改 `scale` 就能做「远近层次」或「大小渐变」的视觉分组，不需要多命令。1000 粒 / 4ms、占格 518。改 4.0 换上限（超过会被 clamp 到 4）。',
    tags: ['particle', 'type{NBT}', '视觉参数'],
    cmds: [
      "/particle minecraft:dust{color:[1.0,0.3,0.3],scale:0.1} -3 0 0 0.4 0.4 0.4 0 200",
      "/particle minecraft:dust{color:[1.0,0.6,0.3],scale:0.4} -1.5 0 0 0.4 0.4 0.4 0 200",
      "/particle minecraft:dust{color:[0.9,1.0,0.4],scale:1.0} 0 0 0 0.4 0.4 0.4 0 200",
      "/particle minecraft:dust{color:[0.4,1.0,0.6],scale:2.0} 1.5 0 0 0.4 0.4 0.4 0 200",
      "/particle minecraft:dust{color:[0.4,0.7,1.0],scale:4.0} 3 0 0 0.4 0.4 0.4 0 200",
    ],
  },
  {
    id: 'lifespectrum',
    name: 'trail 寿命谱（duration 决定飞行时长与寿命）',
    desc: '五条 `trail{target,duration,color}` 命令，**共用同一出生散布、只改 duration（20/40/60/80/100）**。trail 的 duration 同时决定两件事：**粒子活多少 tick** 和 **用多少 tick 飞到 target**——所以 duration 短的粒子飞得快、早死，duration 长的飞得慢、活得久。五层在竖直方向排开，播放时能看到**从下往上逐层消散**：tick 15 时五层都在（4000 粒），tick 35 只剩四层（3200 粒），tick 60 只剩最上面两层（1600 粒）。与库里 `lifesync` 的区别：那条用 `age` 槽做绝对寿命阶梯（三球壳），这条用 trail 的 duration **同时控制寿命和飞行速度**，且都能在同一条命令族里换档。4000 粒 / 17ms、占格 3683。',
    tags: ['particle', 'type{NBT}', '时间节奏'],
    cmds: [
      "/particle minecraft:trail{target:[0.0,-3.0,0.0],duration:20,color:[1.0,0.3,0.3]} 0 -3 0 2.5 0.6 2.5 0.001 800",
      "/particle minecraft:trail{target:[0.0,-1.5,0.0],duration:40,color:[1.0,0.7,0.3]} 0 -1.5 0 2.5 0.6 2.5 0.001 800",
      "/particle minecraft:trail{target:[0.0,0.0,0.0],duration:60,color:[0.9,1.0,0.4]} 0 0 0 2.5 0.6 2.5 0.001 800",
      "/particle minecraft:trail{target:[0.0,1.5,0.0],duration:80,color:[0.4,1.0,0.6]} 0 1.5 0 2.5 0.6 2.5 0.001 800",
      "/particle minecraft:trail{target:[0.0,3.0,0.0],duration:100,color:[0.4,0.7,1.0]} 0 3 0 2.5 0.6 2.5 0.001 800",
    ],
  },
  {
    id: 'dualtone',
    name: '双通道颜色调制（色相随高度、饱和度随半径）',
    desc: '把两个独立的空间量**分别接到颜色的两个独立自由度**上：高度 `h = k/(NL−1)` 控制**色相**（`cr=h·k2`, `cb=(1−h)·k2`，从蓝到红），半径 `s` 控制**饱和度**（`k2 = 0.4 + 0.6s`，轴上颜色灰暗、外圈饱和）。于是同一张螺旋面上同时编码了两个信息——**看颜色就能读出高度和半径**。这是 rgbaparameter 族的核心价值：**它有一个完整的颜色空间可以自由支配**，而普通 parameter 族只能用一个命令色。5000 粒 / 12ms、占格 1204、**渲染色种 173**（全库最多，普通的 hue 环只有 30–50 种）。改 `2*PI*3` 的 3 换螺旋圈数。',
    tags: ['rgbaparameter', '表达式', '颜色场'],
    cmds: [
      "/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 4999 'u=t;NL=50;P=100;k=floor(u/P);s=floorMod(u,P)/(P-1);hh=(k/(NL-1));r=0.4+s*2.6;th=s*2*PI*3;x=r*cos(th);z=r*sin(th);y=(k/(NL-1)-0.5)*4;cr=hh*(0.4+0.6*s);cg=1-abs(2*hh-1);cb=(1-hh)*(0.4+0.6*s);alpha=1' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'heathue',
    name: '距离场热力图球（颜色编码到热源的距离）',
    desc: '球壳上每个点的颜色由**它到偏置热源 `(2,0,2)` 的距离**决定：`h = min(d/5, 1)` 走三段线性热图 `cr=h, cg=1−|2h−1|, cb=1−h`（蓝 → 绿 → 黄 → 红）。于是球面上现出一个**以 (2,0,2) 为「热点」的温度场**——靠近热点的区域是红黄、远离的是蓝色，而且因为热点不在球心，热图在球面上呈**偏心的一侧偏热**分布，而不是同心环。这是把「标量场」直接映射到颜色的标准做法（科学可视化的 colormap），也是 `rgbaparameter` 与普通 parameter 族最本质的能力差异。6000 粒 / 20ms、占格 1396。改分母 5 换热区范围，改热点坐标换偏置方向。',
    tags: ['rgbaparameter', '表达式', '颜色场'],
    cmds: [
      "/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 5999 'u=t;NL=60;P=100;k=floor(u/P);s=floorMod(u,P)/(P-1);eta=k/(NL-1)*PI-PI/2;phi=s*2*PI;x=3*cos(eta)*cos(phi);y=3*sin(eta);z=3*cos(eta)*sin(phi);d=sqrt((x-2)*(x-2)+y*y+(z-2)*(z-2));hh=min(d/5,1);cr=hh;cg=1-abs(2*hh-1);cb=1-hh;alpha=1' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'cliffordtorus',
    name: 'Clifford 环面（4D 平坦环面的投影）',
    desc: 'Clifford 环面是 S³ 里唯一一个**平坦**的环面：它的两个圆参数化写成 `x4=cosα, y4=sinα, z4=0.7cosβ, w4=0.7sinβ`——两个圆各自独立绕自己的平面转，**四维里它没有曲率**（高斯曲率处处为 0），这和高维里的普通环面完全不同。投影到三维时 `w4` 只负责透视缩放 `sc=2.6/(2.8+w4)`，于是四维里「两个圆」的规整结构在三维变成**两层嵌套的环带**（正视看是同心环、等距看是内外两圈）。这是库里除 `hypertorus`（4D 环面）之外的第二个四维曲面——区别在于 `hypertorus` 的 `w` 来自副圆的正弦（有曲率），`cliffordtorus` 的 `w` 来自第二个圆本身（平坦）。4800 粒 / 12ms、占格 2330。改 0.7 换第二个圆的半径（1.0 时两圆等大、退化成更对称的形状）。',
    tags: ['parameter', '表达式', '4D 投影'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 4799 'u=t;NU=80;NV=60;k=floor(u/NV);s=floorMod(u,NV)/(NV-1);a=k/(NU-1)*2*PI;b=s*2*PI;x4=cos(a);y4=sin(a);z4=cos(b)*0.7;w4=sin(b)*0.7;sc=2.6/(2.8+w4);x=x4*3.2*sc;y=y4*3.2*sc;z=z4*3.2*sc' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'hcp',
    name: '密排六方点阵（HCP 的 ABAB 堆垛）',
    desc: '金属三种基本格子（SC/BCC/FCC）之外最常见的第四种：**密排六方**。做法是先按六方格子求出每个原子最近的格点，再判「到该格点的距离 < 0.42」；关键在于 `oy = floorMod(hy,2)·0.5a`——**奇数层整体沿 x 平移半个晶格**，这正是 ABAB 堆垛：第二层原子正好落在第一层的三角空隙里，这才是「密排」（空间利用率 74%，与 FCC 并列最高）。侧视能看到层间明显错位、正视是交替的锯齿排列。这三向视图合起来是 HCP 与 FCC 最本质的区别：**FCC 是 ABCABC、HCP 是 ABAB，周期不同**。18480 粒 / 121ms、占格 3060。改 1.2 换晶格常数，改 0.42 换原子球半径。',
    tags: ['conditional', '表达式', '晶体'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.6 3.6 3.6 'a=1.2;hx=floor((x+a*0.5)/a);hz=floor((z+a*0.866)/a);hy=floor((y+a*0.4)/(a*0.8165));oy=floorMod(hy,2)*0.5*a;dx=x-hx*a;dz=z-hz*a*0.866-oy;dy=y-hy*a*0.8165;d=sqrt(dx*dx+dz*dz+dy*dy);d<0.42' 0.12 200 null 1 null",
    ],
  },
  {
    id: 'duallissa',
    name: '双参数李萨如曲面（t 同时编码两个参数）',
    desc: '**一个 `t` 装两个独立参数**：`u = floor(t/80)/79·2π`（整数位扫第一参数）、`v = (t mod 80)/79·2π`（小数位扫第二参数）。于是原本的一维李萨如曲线被「扫」成一张**二维曲面**——`x=sin(3u)cos(v), y=sin(4u+½π)sin(v), z=sin(5u)cos(u+1)`，三个坐标各自对 (u,v) 有不同的依赖，曲面在盒子里反复折叠。**这是 parameter 族最重要的复用手法**：`t` 是唯一的迭代变量，想加第二个参数就把它拆成整数位 + 小数位。库里 `sphericalharmonics`、`tonnetz` 用的都是同一招。6400 粒 / 11ms、占格 1694。改 80 换每行点数（越大 v 越密），改 3/4/5 换频率比。',
    tags: ['parameter', '表达式', '参数曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 6399 'u=floor(t/80)/79*2*PI;v=floorMod(t,80)/79*2*PI;x=2.4*sin(3*u)*cos(v);y=2.4*sin(4*u+1.5708)*sin(v);z=2.4*sin(5*u)*cos(u+1.0)' 1 500 'null' 1 null",
    ],
  },
  {
    id: 'lamepolar',
    name: '超椭圆旋转体（Lamé 曲线的球面化）',
    desc: '把二维的超椭圆（Lamé 曲线）`(|x|/a)^n + (|y|/b)^n = 1` 改写成极坐标形式 `r = 1/(|cosθ|^n + |sinθ|^n)^(1/n)`，再让 `θ` 走**极角**、方位角绕轴旋转。当 `n = 2.6` 时**截面已经明显方于圆、但又不到直角**——旋转得到的实体是一个**四角略钝的柱状体**，侧视是规则矩形轮廓、俯视是带圆角的方形。`n → ∞` 趋正方体、`n → 2` 退化为球，`n < 2` 则是**星形**（内凹，与超二次曲面的 `e > 1` 同一族但走的是极坐标路线）。2000 粒 / 6ms、占格 752。改 2.6 换方/圆程度，改 2.6 的分母换整体尺寸。',
    tags: ['polarparameter', '表达式', '超椭圆'],
    cmds: [
      "/particleex polarparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 1999 'u=t;NS=20;NP=100;m=floor(u/NP);p=floorMod(u,NP)/NP;eta=m/(NS-1)*PI-PI/2;s2=eta;s1=p*2*PI;n=2.6;c=abs(cos(eta));s=abs(sin(eta));rr=2.6/pow(pow(c,n)+pow(s,n),1/n);dis=rr' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'lemnisphere',
    name: '双纽线旋转体（上下对合的双叶）',
    desc: '双纽线（lemniscate）的极坐标式 `r² = cos(2θ)` 只在 `|θ| < 45°` 与 `|θ| > 135°` 有实解——这两个区间正好是**赤道两侧的两片扇形**，绕轴旋转后各成一个「碗」。两片碗在赤道处收窄、在极点处张开，合起来是**上下对称、中间掐腰的双叶**，形似沙漏或两个对扣的半球。这是极坐标方程天然带「定义域断裂」的例子：`sqrt(cos 2θ)` 在 `cos 2θ < 0` 处是虚数，我们取 `abs` 后得到镜像的两叶——**真正的双纽线没有腰，只有两个分开的环**，而旋转后它们被赤道连在一起。2000 粒 / 7ms、占格 584。改 2.8 换整体尺寸。',
    tags: ['polarparameter', '表达式', '极坐标曲线'],
    cmds: [
      "/particleex polarparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 1999 'u=t;NS=20;NP=100;m=floor(u/NP);p=floorMod(u,NP)/NP;eta=m/(NS-1)*PI-PI/2;s2=eta;s1=p*2*PI;c=cos(2*eta);rr=2.8*sqrt(abs(c));dis=rr' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'riemannlog',
    name: '对数黎曼面（无限层的螺旋楼梯）',
    desc: '复对数 `w = log(z)` 是**多值函数**：`log(z) = ln|z| + i(θ + 2kπ)`，同一个 `z` 有无穷多个值，差 `2πi`。它的黎曼面是把这些层「摊开」后的曲面——**每绕原点一圈，就升上一层**，永远不闭合。这条模板用极坐标画它：`x = r·cosθ, z = r·sinθ` 给复平面，`y = θ·0.75` **把虚部当高度**，θ 从 −2.5π 扫到 +2.5π（**故意越过 ±2π，展示 5 层重叠**）。侧视就是一条**螺旋楼梯**，每圈升 1.5π·0.75。`sqrt(z)` 的黎曼面只有 2 层、会闭合，`log(z)` 则永不闭合——这是它们最本质的区别。2500 粒 / 6ms、占格 579。改 2.5 换扫过的圈数（≥3 才能看出多层），改 0.75 换每层的升高量。',
    tags: ['parameter', '表达式', '复变函数'],
    cmds: [
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;NR=50;NL=50;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);r=0.2+k/(NR-1)*2.8;th=(s-0.5)*2*PI*2.5;x=r*cos(th);z=r*sin(th);y=th*0.75' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'wavetrio',
    name: '三层波次退场（同心环依次消失）',
    desc: '三条 `conditional` 命令各画一个同心环，**只改两个数字**：环半径（1.5 / 2.2 / 2.9）和命令末尾的 `age` 槽（60 / 120 / 180）。`age` 是**绝对寿命**——内环的粒子从出生起只活 60 tick，中环 120、外环 180。于是播放时**从内到外逐圈消失**：tick 0 三环都在（2660 粒）、tick 70 内环已死只剩两环（2072 粒）、tick 130 只剩外环（1260 粒）、tick 190 全空。**这是唯一只靠寿命就能做出「波」的手法**——不改位置、不改速度，纯靠死亡节奏。与 `lifesync` 的区别：那条是三层球壳（径向套嵌），这条是同一平面上的三个同心环（共面并列），视觉上更像水波一圈圈荡开。改 60/120/180 的间隔换节奏快慢。',
    tags: ['conditional', '表达式', '时间节奏'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 2 2 2 'r=sqrt(x*x+z*z);abs(r-1.5)<0.2' 0.3 60 null 1 null",
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 2 3 'r=sqrt(x*x+z*z);abs(r-2.2)<0.2' 0.3 120 null 1 null",
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.6 2 3.6 'r=sqrt(x*x+z*z);abs(r-2.9)<0.2' 0.3 180 null 1 null",
    ],
  },
  {
    id: 'sdfrepeat',
    name: 'SDF 域重复（无限球阵列）',
    desc: '**域重复（domain repetition）**是 SDF 里最省力的一招：把坐标先折叠回一个周期格子 `p = x − a·round(x/a)`（三轴同做），再算球距离——**一个球的距离场就被复制成了无限阵列**，而计算量只多 3 个 `round`。渲染出来是整齐的 3×3×3 球阵，俯视和等距视角都能看到完美排列。**这是 `round` 在几何里最有用的地方**：`round(x/a)·a` 给出「最近的格点」，相减就是「到最近格点中心的相对坐标」。库里 `crystal` 用 `sin(πx/a)=0` 判格点、`lattice` 用球距，这条用 `round` 折叠——三种判格点手法里它最直接。8526 粒 / 71ms、占格 2640。改 2.4 换阵列周期，改 0.7 换球半径（0.7 时球刚好相切，再大就并成一块）。',
    tags: ['conditional', '表达式', 'SDF 实体造型'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.6 3.6 3.6 'a=2.4;px=x-a*round(x/a);py=y-a*round(y/a);pz=z-a*round(z/a);d=sqrt(px*px+py*py+pz*pz)-0.7;abs(d)<0.07' 0.14 200 null 1 null",
    ],
  },
  {
    id: 'sdfsmooth',
    name: 'SDF 平滑并集（球与圆柱的圆角焊接）',
    desc: '**平滑并集（smooth min / smin）**：普通并集 `min(d1,d2)` 会在两实体交界处留下**尖锐的折痕**，而 smin 在两者的距离差小于 `k` 时插入一段平滑过渡——`h = max(k−|d1−d2|,0)/k`，`m = min(d1,d2) − h²k/4`。这条把半径 2.0 的球与半径 0.9 的圆柱焊在一起，`k = 0.8` 让交界面形成**一圈圆润的焊缝**，整块实体看起来像铸件而不是拼装件。俯视能看到贯穿的圆孔（圆柱被球吃掉后留下的通道）。**smin 是 SDF 造型相对传统 CSG 最大的优势**：它让「焊接」变成可调参数，而不是布尔运算的二值结果。3065 粒 / 48ms、占格 811。改 0.8 换焊缝宽度（0.1 趋普通并集、1.5 糊成一团）。',
    tags: ['conditional', '表达式', 'SDF 实体造型'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'd1=sqrt(x*x+y*y+z*z)-2.0;d2=sqrt(x*x+z*z)-0.9;k=0.8;h=max(k-abs(d1-d2),0)/k;m=min(d1,d2)-h*h*k*0.25;abs(m)<0.07' 0.14 200 null 1 null",
    ],
  },
  {
    id: 'sierptetra',
    name: '谢尔宾斯基四面体（二进制位判据）',
    desc: '三维分形的经典构造：把立方体 2×2×2 剖分后**挖掉四个偶块、只留四个奇块**，然后对每个保留块递归——极限就是谢尔宾斯基四面体。判据非常干净：**三个整数坐标的二进制位中，任意两位不能同时为 1**（`bx·by + by·bz + bz·bx = 0`）。这条做了**三级递归**：每级各自检查一遍二进制的对应位，三级都通过才算命中（`b0+b1+b2 < 0.5`）。它和 `menger` 是同一族「盒计数分形」的不同规则——Menger 用三进制挖中心十字（保留 20/27），谢尔宾斯基四面体用二进制挖对角块（保留 4/8 = 一半）。**两条放在一起就是「不同进制 → 不同分形」的对照**。28000 粒 / 72ms、占格 1598。改 `N=10` 换递归分辨率（N 越大细节越多），改 `b0+b1+b2 < 0.5` 的级数换递归深度。',
    tags: ['conditional', '表达式', '分形'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 2 2 2 'N=10;ix=floor((x+2)*N);iy=floor((y+2)*N);iz=floor((z+2)*N);bx0=floorMod(ix,2);by0=floorMod(iy,2);bz0=floorMod(iz,2);b0=bx0*by0+by0*bz0+bz0*bx0;x1=floor(ix/2);y1=floor(iy/2);z1=floor(iz/2);bx1=floorMod(x1,2);by1=floorMod(y1,2);bz1=floorMod(z1,2);b1=bx1*by1+by1*bz1+bz1*bx1;x2=floor(x1/2);y2=floor(y1/2);z2=floor(z1/2);bx2=floorMod(x2,2);by2=floorMod(y2,2);bz2=floorMod(z2,2);b2=bx2*by2+by2*bz2+bz2*bx2;b0+b1+b2<0.5' 0.08 200 null 1 null",
    ],
  },
  {
    id: 'hexsym',
    name: '六方壁纸群（p6m 对称的三角格）',
    desc: '**六方晶格的距离函数** `u = |x| + |x/2 + z·√3/2| + |x/2 − z·√3/2|`——这是「到最近六方格点距离」的闭式表达：三个绝对值项分别对应三条相隔 120° 的法向，取和后得到的等值线正是**正六边形**。再用 `floorMod(u/a,1)` 折叠到单个晶胞、取 `min(|·−½|, |·−½|)` 得到**六边形环带**。整层约束在 `|y| < 0.12` 上，得到一片**六方密的三角格点阵**——这正是 p6m 壁纸群的几何（六重旋转 + 镜像）。**六方密排在二维的对应物是三轴 60° 的格线**，`|x|+|x/2±z·√3/2|` 就是它的范数。22188 粒 / 53ms、占格 800。改 1.2 换格子大小，改 0.1 换环带宽度。',
    tags: ['conditional', '表达式', '对称群'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 0.2 3 'a=1.2;u=abs(x)+abs(x*0.5+z*0.866)+abs(x*0.5-z*0.866);v=abs(floorMod(u/a,1)-0.5);w=abs(floorMod((x*0.866+z*0.5)/a,1)-0.5);abs(min(v,w)-0.25)<0.1;abs(y)<0.12' 0.07 200 null 1 null",
    ],
  },
  {
    id: 'besseldrum',
    name: '贝塞尔鼓面模态（J₀ 级数曲面）',
    desc: '**圆鼓被敲响时的振动模态**：半径方向由零阶贝塞尔函数 `J₀(k·r)` 描述、角向由 `cos(m·θ)` 描述，位移 `y = 1.5·J₀(2.2r)·cos(mθ)` 直接就是鼓面的瞬时形状。**J₀ 用 14 项泰勒级数实现**（`J₀(x) = Σ (−1)ⁱ (x/2)²ⁱ / (i!)²`，x ≤ 7 时误差小于 1e-4）——引擎没有内置贝塞尔函数，但幂级数足够收敛，这也说明任何特殊函数只要能展开幂级数就能用。m=0 是**轴对称模态**：中心一个峰、外面一圈反向的谷、边缘再翻回向上——鼓皮振动的经典「呼吸」形；m=2 是**四瓣模态**，四个峰与四个谷交替（节线是两条互相垂直的直径）。两条命令左右并排，各 3200 粒。改 2.2 换径向波数（越大节圆越多），改 m 换角向瓣数（m=1 哑铃、m=3 六瓣）。',
    tags: ['parameter', '表达式', '特殊函数'],
    cmds: [
      "/particleex parameter minecraft:end_rod -4 0 0 1 0.95 0.89 1 0 0 0 0 3199 'u=t;NL=64;NR=50;k=floor(u/NL);sa=floorMod(u,NL)/(NL-1);rr=k/(NR-1)*3.0;th=sa*2*PI;x=rr*cos(th);z=rr*sin(th);jq=(rr*2.2)*(rr*2.2)*(-0.25);term=1.0;j0=1.0;term=term*jq/1;j0=j0+term;term=term*jq/4;j0=j0+term;term=term*jq/9;j0=j0+term;term=term*jq/16;j0=j0+term;term=term*jq/25;j0=j0+term;term=term*jq/36;j0=j0+term;term=term*jq/49;j0=j0+term;term=term*jq/64;j0=j0+term;term=term*jq/81;j0=j0+term;term=term*jq/100;j0=j0+term;term=term*jq/121;j0=j0+term;term=term*jq/144;j0=j0+term;term=term*jq/169;j0=j0+term;term=term*jq/196;j0=j0+term;j0;y=1.5*j0*cos(0*th)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 4 0 0 1 0.95 0.89 1 0 0 0 0 3199 'u=t;NL=64;NR=50;k=floor(u/NL);sa=floorMod(u,NL)/(NL-1);rr=k/(NR-1)*3.0;th=sa*2*PI;x=rr*cos(th);z=rr*sin(th);jq=(rr*2.2)*(rr*2.2)*(-0.25);term=1.0;j0=1.0;term=term*jq/1;j0=j0+term;term=term*jq/4;j0=j0+term;term=term*jq/9;j0=j0+term;term=term*jq/16;j0=j0+term;term=term*jq/25;j0=j0+term;term=term*jq/36;j0=j0+term;term=term*jq/49;j0=j0+term;term=term*jq/64;j0=j0+term;term=term*jq/81;j0=j0+term;term=term*jq/100;j0=j0+term;term=term*jq/121;j0=j0+term;term=term*jq/144;j0=j0+term;term=term*jq/169;j0=j0+term;term=term*jq/196;j0=j0+term;j0;y=1.5*j0*cos(2*th)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'zoneplate',
    name: '菲涅尔波带片（内疏外密的同心环）',
    desc: '`floor(r²/λf)` 取整再按奇偶分带——**环带的边界在 `r²` 上等间距**，换算到半径就是 `r ∝ √n`，于是**越往外环越密、最内圈反倒最宽**。这正是菲涅尔波带片的构造（也是牛顿环的条纹间距规律），和等间距同心环的观感完全不同：靠近中心是一大片空白，外圈密集到几乎连成一片。**用平方项做判据而不是线性项，就是「衍射结构」与「装饰花纹」的分界**。只保留奇数带（`floorMod(n,2)<1`），6909 粒 / 11ms、占格 968。改 0.28 换第一带的半径（也就是焦距），改 2 换保留奇带/偶带。',
    tags: ['conditional', '表达式', '光学'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.2 0.15 3.2 'rr=sqrt(x*x+z*z);n=floor(rr*rr/0.28);floorMod(n,2)<1' 0.1 200 null 1 null",
    ],
  },
  {
    id: 'orbital',
    name: '氢原子电子云（3s / 3p / 3d 轨道等值面）',
    desc: '**波函数 `ψ = R(r)·Y(θ,φ)` 的等概率密度面**，`|ψ|² > 阈值` 的地方就长粒子。三条命令从左到右是 3s（球对称）、3p（哑铃）、3d（四叶），都取 n=3 主量子数——**同一族里径向节点数逐级递增**。径向部分用拉盖尔多项式（3s 是 `(27−18p+2p²)e^(−p/2)`，含**两个径向节点**，所以剖面上能看到「球壳里套球壳」的双层结构；3p 是 `p(6−p)e^(−p/2)`，一个节点；3d 是 `p²e^(−p/2)`，无节点），角向部分依次是常数、`cosθ`、`(3cos²θ−1)` 和 `sin²θ·cos2φ`。**库仑势里的球谐阶数决定了角向叶瓣数**，这是量子力学最直观的一张图。三条各 4–8 千粒 / 共 23k 粒 150ms。**阈值越高壳层越薄**（3s 改 4→10 只剩内壳），`p=2r/3` 里的 3 是主量子数，改成 2 或 4 就换成 2s / 4s 轨道。',
    tags: ['conditional', '表达式', '量子力学'],
    cmds: [
      "/particleex conditional minecraft:end_rod -18 0 0 1 0.95 0.89 1 0 0 0 9 9 9 'rr=sqrt(x*x+y*y+z*z)+0.001;ct=y/rr;p=2.0*rr/3.0;st=sqrt(max(1.0-ct*ct,0.0));rad=(27.0-18.0*p+2.0*p*p)*exp(-p*0.5);ang=1.0;psi=rad*ang;d=psi*psi;d>4' 0.4 200 null 1 null",
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 9 9 9 'rr=sqrt(x*x+y*y+z*z)+0.001;ct=y/rr;p=2.0*rr/3.0;st=sqrt(max(1.0-ct*ct,0.0));rad=p*(6.0-p)*exp(-p*0.5);ang=ct;psi=rad*ang;d=psi*psi;d>2' 0.4 200 null 1 null",
      "/particleex conditional minecraft:end_rod 18 0 0 1 0.95 0.89 1 0 0 0 9 9 9 'rr=sqrt(x*x+y*y+z*z)+0.001;ct=y/rr;p=2.0*rr/3.0;st=sqrt(max(1.0-ct*ct,0.0));rad=p*p*exp(-p*0.5);ang=(st*st*cos(2.0*atan2(z,x)));psi=rad*ang;d=psi*psi;d>1.5' 0.4 200 null 1 null",
    ],
  },
  {
    id: 'enneper',
    name: 'Enneper 极小曲面（自交的鞍形薄片）',
    desc: '**Enneper 曲面**：\`x = u − u³/3 + uv²\`、\`y = v − v³/3 + vu²\`、\`z = u² − v²\`。它是极小曲面（平均曲率处处为零）里**参数式最简单的一个**——不像 Scherk 或 Catalan 要解超越方程，三个式子全是三次多项式，却给出了一个带自交的、向四个方向无限展开的鞍形薄片。**极小曲面的本质是「每一点两个主曲率大小相等、符号相反」**，所以它处处像马鞍：一个方向向上弯、垂直方向就向下弯。这里取 \`u,v ∈ [−2.2, 2.2]\` 截一段，中心是平的、四周翘起四个尖角、主对角线上还能看到自交的折痕。70×70 网格、4900 粒 / 13ms、占格 3440——**是本库占格最高的单曲面之一**（薄片本身处处倾斜，投影下来几乎铺满）。改 2.2 换截取范围（越大越展开也越乱），改 1.1 换整体尺度。',
    tags: ['parameter', '表达式', '极小曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 4899 'u=t;N=70;i=floor(u/N);j=floorMod(u,N);uu=(i/(N-1)*2.0-1.0)*2.2;vv=(j/(N-1)*2.0-1.0)*2.2;x=1.1*(uu-uu*uu*uu/3.0+uu*vv*vv);y=1.1*(vv-vv*vv*vv/3.0+vv*uu*uu);z=1.1*(uu*uu-vv*vv)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'kepler',
    name: '开普勒椭圆轨道（偏心率三档对照）',
    desc: '**\`r = a(1 − e·cos E)\`、\`θ = E + 2e·sin E\`**，\`E\` 叫**偏近点角**（从 0 扫到 2π 走完一整圈），这一对式子就是开普勒方程的几何解。**注意 r 用的是 cos E 而不是 cos θ**——如果直接写 \`r = a(1 − e·cos θ)\`，得到的是以焦点为极点的圆锥曲线，但**粒子沿轨道分布会不均匀**：近拱点会挤成一团、远拱点稀稀拉拉。加上 \`θ = E + 2e·sin E\` 这一步换算，粒子才沿椭圆弧长均匀铺开，这正是**开普勒第二定律（等面积定律）的正确可视化**——近拱点走得快、远拱点走得慢，颗粒间距处处相等。三条椭圆同排对照 e=0.2（近乎圆）、e=0.6（明显扁）、e=0.85（极扁，近拱点在 a(1−e)=0.75、远拱点在 9.25，差 12 倍）。改 a 换轨道大小，改 e 换扁度（e→1 退化成抛物线）。',
    tags: ['parameter', '表达式', '轨道力学'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 399 'u=t;N=400;ec=u/(N-1)*2.0*PI;r=3*(1.0-0.2*cos(ec));th=ec+2.0*0.2*sin(ec);x=r*cos(th);z=r*sin(th);y=0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 399 'u=t;N=400;ec=u/(N-1)*2.0*PI;r=4*(1.0-0.6*cos(ec));th=ec+2.0*0.6*sin(ec);x=r*cos(th);z=r*sin(th);y=0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 399 'u=t;N=400;ec=u/(N-1)*2.0*PI;r=5*(1.0-0.85*cos(ec));th=ec+2.0*0.85*sin(ec);x=r*cos(th);z=r*sin(th);y=0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'mapproj',
    name: '地图投影三态（墨卡托 / 正弦 / 摩尔威德）',
    desc: '同一个球面经纬网，用三种经典地图投影摊平到地面——**这是"把球摊成平面必然要付出某种代价"的三份账单**。**墨卡托**：\`z ∝ ln(tan(π/4 + φ/2))\`，把纬度做成对数——换来的是「航向角不变就直线航行」的等角性质（所以大航海时代的航海图都用它），代价是**高纬度面积被极度放大**，画面上下两端被拉成竖直长条。**正弦投影**：\`x = λ·cos φ\`，让每条纬线长度正比于真实周长——**面积严格保真**，代价是形状失真，两极压成点、整体像个橄榄。**摩尔威德**：用三次近似解 \`θ + sin θ = π sin φ\` 的伪圆柱投影，是前两者的折中——**面积保真且形状失真被压到可接受的程度**，教科书常用的世界地图就是它。三条并排各 4000 粒 / 共 12000 粒 26ms、占格 1909。改 1.4 换纬度截取范围（墨卡托必须限幅，否则极点发散到无穷）。',
    tags: ['parameter', '表达式', '地图投影'],
    cmds: [
      "/particleex parameter minecraft:end_rod -7 0 0 1 0.95 0.89 1 0 0 0 0 3999 'u=t;NC=80;NRv=50;kk=floor(u/NC);j=floorMod(u,NC);la=(j/(NC-1)*2.0-1.0)*PI;ph=(kk/(NRv-1)*2.0-1.0)*1.4;x=2*la*0.75;z=-2*1.9*log(max(tan(PI/4.0+ph*0.5),0.001))*0.42;y=0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3999 'u=t;NC=80;NRv=50;kk=floor(u/NC);j=floorMod(u,NC);la=(j/(NC-1)*2.0-1.0)*PI;ph=(kk/(NRv-1)*2.0-1.0)*1.4;x=2*la*cos(ph)*0.75;z=-2*ph*1.05;y=0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 7 0 0 1 0.95 0.89 1 0 0 0 0 3999 'u=t;NC=80;NRv=50;kk=floor(u/NC);j=floorMod(u,NC);la=(j/(NC-1)*2.0-1.0)*PI;ph=(kk/(NRv-1)*2.0-1.0)*1.4;th=ph;cc=ph+(ph*ph*ph)/3.0;x=2*la*cos(cc*0.5)*0.75;z=-2*cc*0.95;y=0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'zernike',
    name: '泽尼克像差四模式（离焦 / 散光 / 彗差 / 球差）',
    desc: '**圆形光瞳上的正交多项式基**，每一项对应一种光学像差，把系数做成高度就是一张像差地形图。四条从左到右：**离焦** `2ρ²−1`（碗形，就是近视/远视）、**散光** `ρ²cos2θ`（马鞍，一个方向对焦另一个方向虚）、**彗差** `(3ρ³−2ρ)cosθ`（单侧翘起像彗星尾巴，所以得名）、**球差** `6ρ⁴−6ρ²+1`（中心与边缘焦点不重合，中心下凹边缘翘起）。**这四个式子恰好是 Zernike 多项式的低阶全部成员**，任何光学系统的波前误差都能展开成它们的线性组合——所以选镜片时验光单上的球镜、柱镜、轴位，本质上就是这几个系数。三条约束：`ρ < 1` 裁出圆形光瞳、`θ = atan2(z,x)` 给角向、`y = 1.8·val` 把相位做成高度。四条各 2500 粒 / 共 1 万粒 60ms。改 1.8 换起伏幅度；把 y 改成 0 就得到纯平面的「像差色块」。',
    tags: ['parameter', '表达式', '光学'],
    cmds: [
      "/particleex parameter minecraft:end_rod -14 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;N=50;ii=floor(u/N);jj=floorMod(u,N);px=(jj/(N-1)*2.0-1.0);pz=(ii/(N-1)*2.0-1.0);rho=sqrt(px*px+pz*pz);th=atan2(pz,px);inside=rho<1.0;val=(2.0*rho*rho-1.0)*inside;y=1.8*val;x=px*3.6;z=pz*3.6' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod -4.7 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;N=50;ii=floor(u/N);jj=floorMod(u,N);px=(jj/(N-1)*2.0-1.0);pz=(ii/(N-1)*2.0-1.0);rho=sqrt(px*px+pz*pz);th=atan2(pz,px);inside=rho<1.0;val=rho*rho*cos(2.0*th)*inside;y=1.8*val;x=px*3.6;z=pz*3.6' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 4.7 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;N=50;ii=floor(u/N);jj=floorMod(u,N);px=(jj/(N-1)*2.0-1.0);pz=(ii/(N-1)*2.0-1.0);rho=sqrt(px*px+pz*pz);th=atan2(pz,px);inside=rho<1.0;val=(3.0*rho*rho*rho-2.0*rho)*cos(th)*inside;y=1.8*val;x=px*3.6;z=pz*3.6' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 14 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;N=50;ii=floor(u/N);jj=floorMod(u,N);px=(jj/(N-1)*2.0-1.0);pz=(ii/(N-1)*2.0-1.0);rho=sqrt(px*px+pz*pz);th=atan2(pz,px);inside=rho<1.0;val=(6.0*rho*rho*rho*rho-6.0*rho*rho+1.0)*inside;y=1.8*val;x=px*3.6;z=pz*3.6' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'modcircle',
    name: '模乘圆（弦的密度即数论）',
    desc: '圆上均匀放 N 个点，把第 i 个点用直线连到第 **i·k mod N** 个点——**乘一个数、取一次余数，就得到一张万花尺式的花纹**。三条分别是 k=2（N=150）、k=51（N=151）、k=76（N=152），**同样的构造换一个乘数就是完全不同的图案**：k 接近 N/2 时弦几乎都穿过圆心附近（聚成密集的星芒），k 与 N 互质且比接近黄金分割时弦均匀铺开成玫瑰花结。这不是巧合——弦 i↔i·k 的包络线是一条**内摆线（epicycloid）**，其尖角数由 k 与 N 的最大公约数决定：gcd 越小花瓣越多越细，gcd 越大越像粗大的星形。**这是数论里"模乘映射的轨道结构"最直接的可视化**，也是数学科普里著名的「乘法圆」（times tables on a circle）。三条各约 5400 粒 / 共 16308 粒 32ms、占格 1642。改 36 换弦的采样密度（越大线条越实），改 k 换乘数。',
    tags: ['parameter', '表达式', '数论'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 5399 'u=t;S=36;Nv=150;k=floor(u/S);s=floorMod(u,S)/(S-1);a=2.0*PI*k/Nv;b=2.0*PI*floorMod(k*2,Nv)/Nv;px=cos(a)*(1.0-s)+cos(b)*s;pz=sin(a)*(1.0-s)+sin(b)*s;x=px*3.8;z=pz*3.8;y=0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 5435 'u=t;S=36;Nv=151;k=floor(u/S);s=floorMod(u,S)/(S-1);a=2.0*PI*k/Nv;b=2.0*PI*floorMod(k*51,Nv)/Nv;px=cos(a)*(1.0-s)+cos(b)*s;pz=sin(a)*(1.0-s)+sin(b)*s;x=px*3.8;z=pz*3.8;y=0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 5471 'u=t;S=36;Nv=152;k=floor(u/S);s=floorMod(u,S)/(S-1);a=2.0*PI*k/Nv;b=2.0*PI*floorMod(k*76,Nv)/Nv;px=cos(a)*(1.0-s)+cos(b)*s;pz=sin(a)*(1.0-s)+sin(b)*s;x=px*3.8;z=pz*3.8;y=0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'dupinfamily',
    name: 'Dupin 圆纹曲面三态（环面 / 角环面 / 纺锤环面）',
    desc: '**同一条公式 \`(R + r·cos v)·(cos u, sin u)\`，R 与 r 的比值一变，曲面就跨越三种拓扑**。R > r 是普通**环面**（甜甜圈，中间有个真正的洞）；R = r 是**角环面**（horn torus）——洞收缩到只剩下中心一个相切点，整张面在那里自己碰到自己；R < r 是**纺锤环面**（spindle torus）——洞已经消失并翻了出来，管子在中轴附近自交，形成一片「双层壳」。**这不是三张不同的曲面，而是同一族曲面的三个参数区间**，Dupin 圆纹曲面因此是拓扑学教科书里「参数连续变动导致拓扑突变」的标准例子。左侧内径 R−r = 2（有洞）、中间内径 0（相切）、右侧内径为负（自交）。三条各 2500 粒 / 共 7500 粒 24ms、占格 3840。改 R/r 比值扫过整个族；把 cos(ph)、sin(ph) 换成 cos(k·ph) 得到花瓣状的广义圆纹曲面。',
    tags: ['parameter', '表达式', '拓扑'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;NL=50;NRv=50;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);th=k/(NRv-1)*2.0*PI;ph=s*2.0*PI;rr=3+1*cos(ph);x=rr*cos(th);z=rr*sin(th);y=1*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;NL=50;NRv=50;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);th=k/(NRv-1)*2.0*PI;ph=s*2.0*PI;rr=2+2*cos(ph);x=rr*cos(th);z=rr*sin(th);y=2*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;NL=50;NRv=50;k=floor(u/NL);s=floorMod(u,NL)/(NL-1);th=k/(NRv-1)*2.0*PI;ph=s*2.0*PI;rr=1+2*cos(ph);x=rr*cos(th);z=rr*sin(th);y=2*sin(ph)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'colorspace',
    name: '色彩空间三态（RGB 立方体 / HLS 双锥 / HSV 球）',
    desc: '把**颜色本身当成几何**：位置坐标就是色彩坐标，粒子颜色就是它所在位置的那一点色彩。左边是 **RGB 立方体**——三个轴分别是红、绿、蓝的强度，八个角对应黑/红/绿/蓝/黄/品红/青/白，所以**立方体主对角线就是灰度轴**（从黑到白）。中间是 **HLS 双锥**——竖直方向是亮度（0 黑、1 白），水平半径是饱和度，绕一圈是色相；因为亮度趋近 0 或 1 时饱和度必然趋零，形状自然收成两个尖锥。右边是 **HSV 球**——色相绕赤道、明度走南北极，是「色相环 × 明度」的球面摆法。**RGB 立方是最容易误解的颜色模型**：它本质上是一个正方体而不是色轮，两色之间的插值走直线穿过立方体内部（这就是为什么 RGB 渐变经常出现发灰的中间色）。三态共 6844 粒 / 2788 色种 / 28ms、占格 4330。改 14 换立方体分辨率（14³=2744 点），改 2.5 换尺寸。',
    tags: ['rgbaparameter', '表达式', '颜色场'],
    cmds: [
      "/particleex rgbaparameter minecraft:end_rod -7 0 0 0 0 0 0 2743 'u=t;N=14;a=floor(u/(N*N));rem=floorMod(u,N*N);b=floor(rem/N);c=floorMod(rem,N);x=(a/(N-1)-0.5)*5.0;y=(b/(N-1)-0.5)*5.0;z=(c/(N-1)-0.5)*5.0;cr=a/(N-1);cg=b/(N-1);cb=c/(N-1)' 1 200 'null' 1 null",
      "/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 2499 'u=t;N=50;kk=floor(u/N);j=floorMod(u,N);hh=j/(N-1);ll=kk/(N-1);ss=1.0-abs(2.0*ll-1.0);ang=2.0*PI*hh;x=ss*cos(ang)*2.5;z=ss*sin(ang)*2.5;y=(ll-0.5)*5.0;hv=hh*6.0;cr=max(0.0,min(1.0,abs(hv-3.0)-1.0));cg=max(0.0,min(1.0,2.0-abs(hv-2.0)));cb=max(0.0,min(1.0,2.0-abs(hv-4.0)))' 1 200 'null' 1 null",
      "/particleex rgbaparameter minecraft:end_rod 7 0 0 0 0 0 0 1599 'u=t;N=40;kk=floor(u/N);j=floorMod(u,N);th=j/(N-1)*2.0*PI;ph=kk/(N-1)*PI;ss=sin(ph);x=ss*cos(th)*2.5;z=ss*sin(th)*2.5;y=cos(ph)*2.5;hh=th/(2.0*PI);hv=hh*6.0;cr=max(0.0,min(1.0,abs(hv-3.0)-1.0));cg=max(0.0,min(1.0,2.0-abs(hv-2.0)));cb=max(0.0,min(1.0,2.0-abs(hv-4.0)))' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'associate',
    name: '螺旋面 ⇄ 悬链面关联族（极小曲面连续形变）',
    desc: '**螺旋面与悬链面是同一族曲面里的两个成员**——把两者的参数式做线性组合 \`cos t · helicoid + sin t · catenoid\`，让 t 从 0 走到 π/2，螺旋面就会连续弯折成悬链面。这不是插值动画的花招，而是极小曲面理论里的 **associated family（伴随族）**：族里每一个成员的平均曲率都恒为零，**弯曲过程中曲面始终是极小曲面**，这正是肥皂膜在两个边界条件下的两种稳定形态。三条：左 t=0（螺旋面，甲板状螺旋楼梯）、中 t=π/4（中间过渡态，最奇特的样子——螺旋与悬链的混合）、右 t=π/2（悬链面，两环之间的最小面积肥皂膜）。三条各 2400 粒 / 共 7200 粒 31ms、占格 1296。改 t 扫过整族；改 1.4 换螺旋的圈数（越大转越多圈）。',
    tags: ['parameter', '表达式', '极小曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -8 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;NL=60;NRv=40;kk=floor(u/NL);s=floorMod(u,NL)/(NL-1);uu=(kk/(NRv-1)*2.0-1.0)*1.4;vv=s*2.0*PI;ct=cos(0);st=sin(0);hx=uu*cos(vv);hy=uu*sin(vv);hz=vv;cx=cosh(uu)*cos(vv);cy=uu;cz=cosh(uu)*sin(vv);x=ct*hx+st*cx;y=ct*hz+st*cy;z=ct*hy+st*cz' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;NL=60;NRv=40;kk=floor(u/NL);s=floorMod(u,NL)/(NL-1);uu=(kk/(NRv-1)*2.0-1.0)*1.4;vv=s*2.0*PI;ct=cos(0.7854);st=sin(0.7854);hx=uu*cos(vv);hy=uu*sin(vv);hz=vv;cx=cosh(uu)*cos(vv);cy=uu;cz=cosh(uu)*sin(vv);x=ct*hx+st*cx;y=ct*hz+st*cy;z=ct*hy+st*cz' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 8 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;NL=60;NRv=40;kk=floor(u/NL);s=floorMod(u,NL)/(NL-1);uu=(kk/(NRv-1)*2.0-1.0)*1.4;vv=s*2.0*PI;ct=cos(1.5708);st=sin(1.5708);hx=uu*cos(vv);hy=uu*sin(vv);hz=vv;cx=cosh(uu)*cos(vv);cy=uu;cz=cosh(uu)*sin(vv);x=ct*hx+st*cx;y=ct*hz+st*cy;z=ct*hy+st*cz' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'beammodes',
    name: '简支梁振型（3 / 4 / 6 阶弯曲模态）',
    desc: '**结构力学里最基础的一张图**：一根两端简支的梁，第 n 阶弯曲振型的挠曲线就是 \`y(x) = sin(nπx/L)\`——正弦曲线本身就是梁的自由振型。**节点数 = n − 1 是这条曲线的全部信息**：三阶有两个不动点、四阶三个、六阶五个，这些节点位置永远不动（节点处振幅恒为零），所以敲击一根梁时，**位置就在节点上时无论怎么敲都激发不出那个模态**——这是模态测试找节点、避免共振的物理依据。每条做成 z 方向 2.4 格宽的薄板而不是单根线，才能看出「梁」是一整片而不是一根筋。三条 3/4/6 阶各 3000 粒 / 共 9000 粒 21ms、占格 1502。改 n 换阶数（n 越大节点越密，三阶变七阶就是 6 个节点）；把 2.4 改成 0 就退化成单根线（占格会掉到 1/8）。',
    tags: ['parameter', '表达式', '力学'],
    cmds: [
      "/particleex parameter minecraft:end_rod -2 0 0 1 0.95 0.89 1 0 0 0 0 2999 'u=t;NZ=30;NXv=100;kk=floor(u/NZ);s=floorMod(u,NZ)/(NZ-1);xx=(kk/(NXv-1));amp=sin(3*PI*xx);x=(xx-0.5)*11.0;y=amp*1.3;z=(s-0.5)*2.4+-0.8' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2999 'u=t;NZ=30;NXv=100;kk=floor(u/NZ);s=floorMod(u,NZ)/(NZ-1);xx=(kk/(NXv-1));amp=sin(4*PI*xx);x=(xx-0.5)*11.0;y=amp*1.3;z=(s-0.5)*2.4+0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 2 0 0 1 0.95 0.89 1 0 0 0 0 2999 'u=t;NZ=30;NXv=100;kk=floor(u/NZ);s=floorMod(u,NZ)/(NZ-1);xx=(kk/(NXv-1));amp=sin(6*PI*xx);x=(xx-0.5)*11.0;y=amp*1.3;z=(s-0.5)*2.4+0.8' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'cantordust',
    name: 'Cantor 尘（三轴同时挖中段的三维分形）',
    desc: '把立方体每边三等分、挖掉中间那一段——**三个轴同时挖，做三级**，剩下的就是 Cantor 尘。判据只有一行：**该坐标的三进制表示里，每一位都不能是 1**。三级就是 \`floorMod(floor(p·27),3)\`、\`(p·9)\`、\`(p·3)\` 三次取位，全不等于 1 才保留。这样得到的是一个**维度为 log2/log3 ≈ 0.631 的三维尘埃**：它的体积为零（Lebesgue 测度是 0），却又不比一个点——**比线更稀、比点更密**，是「分数维」最纯粹的例子。观感上是一堆立方体的八个角反复复制：每个大立方体的八个角各有一个小立方体，小立方体的八个角又各有一个更小的。10648 粒 / 166ms、占格 1728（**代价主要来自三轴 12 次 floorMod，不是粒子数**）。改 0.07 换步长（决定能否分辨最小的块），改三级为两级就变成 8×8×8 的稀疏角阵。⚠️ 范围 5³ 配 0.07 步长要扫描 12.7 万个点，预览约 0.17 秒，游戏内同理。',
    tags: ['conditional', '表达式', '分形'],
    cmds: [
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 2.5 2.5 2.5 'px=(x+2.5)/5;py=(y+2.5)/5;pz=(z+2.5)/5;x1=floorMod(floor(px*27.0),3);x2=floorMod(floor(px*9.0),3);x3=floorMod(floor(px*3.0),3);y1=floorMod(floor(py*27.0),3);y2=floorMod(floor(py*9.0),3);y3=floorMod(floor(py*3.0),3);z1=floorMod(floor(pz*27.0),3);z2=floorMod(floor(pz*9.0),3);z3=floorMod(floor(pz*3.0),3);x1!=1 & x2!=1 & x3!=1 & y1!=1 & y2!=1 & y3!=1 & z1!=1 & z2!=1 & z3!=1' 0.07 200 null 1 null",
    ],
  },
  {
    id: 'growth3',
    name: '三种时间生长（螺旋 / 喷泉 / 斐波那契球）',
    desc: '**\`tickparameter\` 的 t 是全局迭代计数——每 tick 从 t 继续往上吐 cpt 个点，所以「t 的函数」自动变成「随时间的动画」**。三条并排演示三种生长逻辑：左侧**阿基米德螺旋**（\`r ∝ t\`、\`θ ∝ t\`，半径与转角同步增长，画出一条越转越开、始终不闭合的螺线）；中间**抛物线喷泉**（\`y = 1.2·sin(πs)\` 让 t 从 0 走到 1 时高度先升后落，同时方位角按 **黄金角 0.618 圈** ∝ t 递增——于是每一「滴」都落在上一滴的黄金分割处，铺出来的不是均匀圆盘而是**向日葵花盘式的等角分布**）；右侧**斐波那契球**（球面从北到南逐点铺开，方位角每点转 2.399963 弧度，任意时刻看到的都是「已铺开的那一顶帽子」）。**三条的关键差异在 t 的用法**：螺旋是 t 同时进半径与角度（连续曲线），喷泉是 t 的线性分母（进度条式），斐波那契球是 t 的整数序号（离散序列）。三条各约 1600 粒 / 共 5003 粒、跑 90 tick 19ms、占格 3230。改 cpt（第 9 槽）换生长速度——20 是每秒 400 点的节奏。',
    tags: ['tickparameter', '表达式', '时间驱动'],
    cmds: [
      "/particleex tickparameter minecraft:end_rod -12 0 0 1 0.95 0.89 1 0 0 0 0 1600 'th=t*0.04;rr=0.3+t*0.0022;x=rr*cos(th);z=rr*sin(th);y=sin(th*1.7)*0.9' 1 20 3000 'null' 1 null",
      "/particleex tickparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 1600 's=t/1600;ang=2.0*PI*(t*0.618);rr=3.6*s;x=rr*cos(ang);z=rr*sin(ang);y=1.2*sin(s*PI)*3.2' 1 20 3000 'null' 1 null",
      "/particleex tickparameter minecraft:end_rod 12 0 0 1 0.95 0.89 1 0 0 0 0 1800 'kk=t+1;zz=1.0-2.0*kk/1800;rr=sqrt(max(1.0-zz*zz,0.0));ph=kk*2.399963;x=4.0*rr*cos(ph);y=4.0*zz;z=4.0*rr*sin(ph)' 1 20 3000 'null' 1 null",
    ],
  },
  {
    id: 'groupshape3',
    name: '球的三态后处理形变（花 / 螺旋 / 波纹）',
    desc: '**\`group change\` 是把已经生成的粒子再算一遍坐标——同一次「铺球」用它掰成三种完全不同的形状**。左边**六瓣花**：把径向乘 \`1 + 0.55·cos(6θ)\`，球在赤道方向被拉出六个花瓣（θ 是绕 y 轴的方位角，所以花瓣沿赤道排成一圈）。中间**螺旋壳**：把方位角换成 \`θ + 2.6y\`——**高度越高转得越多**，球面被拧成一条缠绕的螺旋带，这正是「纬度即相位」的经典写法。右边**波纹球**：径向乘 \`1 + 0.5·sin(8·仰角)\`，沿南北方向压出八道环状波纹，看起来像一个被拍打过的水球。**三条命令的铺球部分逐字节相同**（只是位置偏移不同），差异全在后面那一条 \`group change\`——这是这个族最省事的用法：**先付一次生成成本，再免费试各种形变**。三条各 2400 粒 / 共 7200 粒 68ms、占格 4116。改 0.55 / 2.6 / 0.5 分别换花瓣深度、扭转率、波纹幅度。⚠️ 组名必须写在第一条命令末尾（第 10 槽），且 \`group change\` 的表达式要加引号。',
    tags: ['group change', '表达式', '后处理形变'],
    cmds: [
      "/particleex parameter minecraft:end_rod -14 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;LON=40;LATv=60;kk=floor(u/LON);j=floorMod(u,LON);la=(kk/(LATv-1)-0.5)*PI;lo=j/(LON-1)*2.0*PI;x=2.2*cos(la)*cos(lo);y=2.2*sin(la);z=2.2*cos(la)*sin(lo)' 1 200 'null' 1 g1",
      "/particleex group change parameter g1 'rr=sqrt(x*x+z*z);gg=1.0+0.55*cos(6.0*atan2(z,x));x=x*gg;z=z*gg'",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;LON=40;LATv=60;kk=floor(u/LON);j=floorMod(u,LON);la=(kk/(LATv-1)-0.5)*PI;lo=j/(LON-1)*2.0*PI;x=2.2*cos(la)*cos(lo);y=2.2*sin(la);z=2.2*cos(la)*sin(lo)' 1 200 'null' 1 g1",
      "/particleex group change parameter g1 'th=atan2(z,x)+2.6*y;rr=sqrt(x*x+z*z);x=rr*cos(th);z=rr*sin(th)'",
      "/particleex parameter minecraft:end_rod 14 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;LON=40;LATv=60;kk=floor(u/LON);j=floorMod(u,LON);la=(kk/(LATv-1)-0.5)*PI;lo=j/(LON-1)*2.0*PI;x=2.2*cos(la)*cos(lo);y=2.2*sin(la);z=2.2*cos(la)*sin(lo)' 1 200 'null' 1 g1",
      "/particleex group change parameter g1 'yy=y*1.0;rr=sqrt(x*x+z*z);gg=1.0+0.5*sin(8.0*atan2(y,rr));x=x*gg;z=z*gg;y=y*1.0'",
    ],
  },
  {
    id: 'polarfill3',
    name: '极坐标三重填充（实心球 / 圆锥 / 厚壳）',
    desc: '**\`polarparameter\` 只认 s1（方位角）、s2（仰角）、dis（半径）三个字段——写 x/y/z 会静默失效**。这一族的关键是 **dis 必须跟着变**：如果只让 s1/s2 转、dis 固定，粒子全落在一个球面上，占格只有 400 出头；一旦让 dis 也在 [0, R] 里扫，就变成了**实心体**——同样的 6000 粒子，占格从 465 涨到 3519。三条演示三种 dis 策略：左**实心球**（dis 用 \`|sin|\` 快速扫描全半径，s1/s2 快速旋转铺满方向）；中**圆锥**（\`s2 = 1.2 − 0.8|sin|\` 把仰角限制在 0.4..1.2 弧度，所以只铺出顶角约 46° 的锥体）；右**厚壳**（dis 只在 2.6..4.5 之间振荡，中间空掉，得到一层有厚度的球壳）。三条各 6000 粒 / 共 18000 粒 34ms、占格 10000。**这里 \`s2 = asin(sin(...))\` 那一步是必须的**：s2 的物理含义是仰角，直接喂 sin 会得到超范围值，asin 才把它映射回 [−π/2, π/2]。改 dis 的系数换三种形态（实心/壳/锥）。',
    tags: ['polarparameter', '表达式', '体积填充'],
    cmds: [
      "/particleex polarparameter minecraft:end_rod -12 0 0 1 0.95 0.89 1 0 0 0 0 5999 'a=t*0.05;s1=a*7.0;s2=asin(max(-1.0,min(1.0,sin(a*3.0))));dis=0.2+4.3*abs(sin(t*0.00049))' 1 200 'null' 1 null",
      "/particleex polarparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 5999 'a=t*0.02;s1=a*10.0;s2=1.2-abs(sin(a*1.5))*0.8;dis=0.1+3.6*abs(sin(t*0.00053))' 1 200 'null' 1 null",
      "/particleex polarparameter minecraft:end_rod 12 0 0 1 0.95 0.89 1 0 0 0 0 5999 'a=t*0.03;s1=a*9.0;s2=(a*0.7)-floor(a*0.7/2.0)*2.0-1.0;s2=s2*1.4;dis=2.6+1.9*abs(sin(t*0.0012))' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'rgbtick3',
    name: '颜色随时间演化三态（色相旋转 / 高度热图 / 明度脉动）',
    desc: '**\`rgbatickparameter\` 是「表达式既写位置也写颜色」的时间驱动族**——每 tick 吐 cpt 个点，每个点的 \`cr/cg/cb\` 都能用当次的 t 算出来，于是**颜色本身成了第四维**。三条演示三种把时间接进颜色的写法：左**色相随转角旋转**（\`h = θ·0.35\`，粒子绕轴转的同时色相也转，画出一条螺旋形的彩虹，像时钟指针扫过）；中**高度热图**（\`cr=h, cg=1−|2h−1|, cb=1−h\` 的三段线性色标，把喷泉的高度直接读成蓝→绿→红，喷到顶是红、落回地面是蓝）；右**明度脉动**（\`h = 0.5+0.5sin(0.01t)\` 让整颗球的色相随时间整体呼吸，同一时刻球上所有点的颜色一致，但不同时刻生成的点分层保留各自的相位）。**663 种颜色**说明这三条不是几档离散色而是连续谱。三条各 3000 粒 / 共 9000 粒跑 160 tick、41ms、占格 3471。⚠️ 槽位是 \`<位置3> <速度3> <begin> <end> <表达式>\`——**没有单独的颜色槽**，颜色必须写在表达式的 cr/cg/cb 里（与 \`parameter\` 族相反）；写 r/g/b 会被静默忽略。',
    tags: ['rgbatickparameter', '表达式', '时间驱动'],
    cmds: [
      "/particleex rgbatickparameter minecraft:end_rod -10 0 0 0 0 0 0 2999 'th=t*0.05;rr=0.5+t*0.0013;x=rr*cos(th);z=rr*sin(th);y=sin(th*2.0)*1.2;h=th*0.35;cr=0.5+0.5*cos(h*6.2832);cg=0.5+0.5*cos(h*6.2832-2.0944);cb=0.5+0.5*cos(h*6.2832-4.1888)' 1 20 3000 'null' 1 null",
      "/particleex rgbatickparameter minecraft:end_rod 0 0 0 0 0 0 0 2999 's=t/3000;ang=2.0*PI*(t*0.618);rr=3.4*s;x=rr*cos(ang);z=rr*sin(ang);y=1.4*sin(s*PI)*3.0;hv=(y+0.01)/4.4;cr=hv;cg=1.0-abs(2.0*hv-1.0);cb=1.0-hv' 1 20 3000 'null' 1 null",
      "/particleex rgbatickparameter minecraft:end_rod 10 0 0 0 0 0 0 2999 'a=t*0.04;la=asin(max(-1.0,min(1.0,sin(a*2.3))));lo=a*4.7;x=3.4*cos(la)*cos(lo);y=3.4*sin(la);z=3.4*cos(la)*sin(lo);h=0.5+0.5*sin(t*0.01);cr=h;cg=1.0-abs(2.0*h-1.0);cb=1.0-h' 1 20 3000 'null' 1 null",
    ],
  },
  {
    id: 'flow3',
    name: '三种速度场（单涡 / 涡对 / 周期驻波流）',
    desc: '**\`normal\` 族的精髓是「速度表达式每 tick 算一次」，于是形态是解出来的而不是画出来的**。三条各给一个经典二维流场：左**Lamb-Oseen 涡**（\`v_θ = (1−e^(−r²/σ²))/r\`——高斯型涡核，中心附近近似刚体旋转（速度 ∝ r）、远处衰减成 1/r 的势涡，这正是真实黏性涡的剖面）；中**涡对**（两个反旋涡叠加速度场，粒子被夹在两涡之间来回卷绕，是二维湍流里最基本的自推进结构，飞机翼尖涡就是一对）；右**周期驻波流**（\`vx = 0.35·sin(1.2z)\`、\`vz = 0.35·sin(1.2x)\`——正弦互相正交，形成一圈圈的胞状环流，类似于瑞利-贝纳尔对流的简化平面版）。**这三条的跨度都会自己长大**：20TPS 显式积分下任何非零速度都把粒子推开，70 tick 后边长约 22 格，所以三条并排放在 ±20 格。共 6000 粒、180ms、占格 4012。改 0.30 / 0.22 / 0.35 换流速（越大扩散越快）。',
    tags: ['normal', '速度表达式', '流场'],
    cmds: [
      "/particleex normal minecraft:end_rod -20 0 0 1 0.95 0.89 1 0 0 0 3.0 0.35 3.0 2000 3000 'rr=sqrt(x*x+z*z)+0.001;rc=rr/1.2;sp=0.30*(1.0-exp(-rc*rc*3.0))/rc;vx=-z/rr*sp;vy=0.0;vz=x/rr*sp' 1 null",
      "/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.0 0.35 3.0 2000 3000 'dx1=x-1.3;dz1=z;rr1=sqrt(dx1*dx1+dz1*dz1)+0.001;dx2=x+1.3;dz2=z;rr2=sqrt(dx2*dx2+dz2*dz2)+0.001;sp1=0.22*(1.0-exp(-rr1*rr1*0.7))/rr1;sp2=0.22*(1.0-exp(-rr2*rr2*0.7))/rr2;vx=-dz1/rr1*sp1+dz2/rr2*sp2;vy=0.0;vz=dx1/rr1*sp1-dx2/rr2*sp2' 1 null",
      "/particleex normal minecraft:end_rod 20 0 0 1 0.95 0.89 1 0 0 0 3.0 0.35 3.0 2000 3000 'vx=0.35*sin(z*1.2);vy=0.0;vz=0.35*sin(x*1.2)' 1 null",
    ],
  },
  {
    id: 'nbttypes',
    name: '三种贴图粒子球（item / block / block_crumble）',
    desc: '**\`type{NBT}\` 让粒子带上真实贴图**——这是 ColorBlock 里唯一能画出「不是小圆点」的粒子的方式。三条各用一种贴图类型：\`item{item:"minecraft:diamond"}\` 画出**物品图标**（钻石的菱形贴图）、\`block{block_state:"minecraft:gold_block"}\` 画出**方块贴图**（金块那张 16×16 的方脸）、\`block_crumble{block_state:"minecraft:dirt"}\` 画出**方块碎屑**（泥土的小碎块，原版破坏方块时的那个）。**三种的语义差别很关键**：\`item\` 是整张图标平铺、\`block\` 是按方块模型的朝向贴、\`block_crumble\` 是破碎的小片——同一个 \`block_state\` 字段，换外层类型观感完全不同。**注意 NBT 字段名必须带下划线**（\`block_state\` 不是 blockState），写错会被静默忽略变成默认贴图。三条各铺一颗球壳（\`|r−3| < 0.08\`）、共 12966 粒 50ms、占格 4884。改 0.08 换壳厚、改 \`minecraft:diamond\` 换任意物品（含模组物品）、改 \`gold_block\` 换任意方块。',
    tags: ['particle', 'type{NBT}', '贴图'],
    cmds: [
      "/particleex conditional minecraft:item{item:\"minecraft:diamond\"} -12 0 0 1 0.95 0.89 1 0 0 0 3.2 3.2 3.2 'rr=sqrt(x*x+y*y+z*z);abs(rr-3.0)<0.08' 0.16 400 null 1 null",
      "/particleex conditional minecraft:block{block_state:\"minecraft:gold_block\"} 0 0 0 1 0.95 0.89 1 0 0 0 3.2 3.2 3.2 'rr=sqrt(x*x+y*y+z*z);abs(rr-3.0)<0.08' 0.16 400 null 1 null",
      "/particleex conditional minecraft:block_crumble{block_state:\"minecraft:dirt\"} 12 0 0 1 0.95 0.89 1 0 0 0 3.2 3.2 3.2 'rr=sqrt(x*x+y*y+z*z);abs(rr-3.0)<0.08' 0.16 400 null 1 null",
    ],
  },
  {
    id: 'twistcolumn',
    name: '扭转柱面三态（螺旋带 / 多圈扭转 / 锥形螺旋）',
    desc: '**同一条公式 \`θ = 2π·v + T·π·u\`，只改扭转率 T，圆的扫掠面就变成三种完全不同的柱体**。左 T=2：每上升一个高度层只转半圈，得到一片**宽缓的螺旋带**（像一条拧过的纸带）；中 T=6：每层转三整圈，**扭转极快**，从侧面看是一叠紧贴的斜纹片，几乎糊成实心楔；右除了 T=4 还把半径随高度放大（\`r = 1.8(1+2.6u)\`），于是变成**越往上越开的锥形螺旋**，表面能看到螺旋条纹。**这三条解释了「直纹面」的直觉**：柱面本质上就是一条直线（母线）沿螺旋运动扫出来的，扭转率决定了母线转得多快——所以从侧面看，T 小的时候能看见母线的方向，T 大了就只剩下一片模糊。三条 3200 粒 / 共 9600 粒 24ms、占格 4611。改 T 换扭转率（T=0 退化成普通柱面），改 2.6 换锥角。',
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -10 0 0 1 0.95 0.89 1 0 0 0 0 3199 'u=t;NL=40;NA=80;kk=floor(u/NL);ss=floorMod(u,NL)/(NL-1);ax=kk/(NA-1);th=ss*2.0*PI+ax*2*PI;rr=1*(1.0+2.6*ax);x=rr*cos(th);y=(ax-0.5)*8.0;z=rr*sin(th)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3199 'u=t;NL=40;NA=80;kk=floor(u/NL);ss=floorMod(u,NL)/(NL-1);ax=kk/(NA-1);th=ss*2.0*PI+ax*6*PI;rr=1*(1.0+2.6*ax);x=rr*cos(th);y=(ax-0.5)*8.0;z=rr*sin(th)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 10 0 0 1 0.95 0.89 1 0 0 0 0 3199 'u=t;NL=40;NA=80;kk=floor(u/NL);ss=floorMod(u,NL)/(NL-1);ax=kk/(NA-1);th=ss*2.0*PI+ax*4*PI;rr=1.8*(1.0+2.6*ax);x=rr*cos(th);y=(ax-0.5)*8.0;z=rr*sin(th)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'wigner',
    name: 'Wigner-Seitz 胞三态（立方 / 截角八面体 / 菱形十二面体）',
    desc: '**三种布拉维格子的第一布里渊区（= Wigner-Seitz 胞）**——固体物理里决定能带结构的那个几何体。左**简单立方 SC**：\`max(|x|,|y|,|z|) = a/2\`，就是一个立方体（L∞ 范数的等值面）。中**体心立方 BCC**：\`d = ½·max(|x±y±z|)\` 取四个对角线，得到**截角八面体**（8 个正六边形 + 6 个正方形）——因为 BCC 的最近邻是 8 个体对角方向 + 6 个轴向次近邻，Wigner-Seitz 胞被这 14 个邻点切成 14 个面。右**面心立方 FCC**：\`d = ½·max(|x±y|)、max(|y±z|)、max(|z±x|)\` 三组取大，得到**菱形十二面体**（12 个菱形面）——FCC 有 12 个最近邻，正好对应 12 个面。**这不是三个随手挑的形状：面数 = 最近邻数**，这是 Wigner-Seitz 构造的定义性质。三条各约 5600 粒 / 共 16794 粒 65ms、占格 3464。改 0.065 换壳层厚度（越小越接近理想的多面体表面）。',
    tags: ['conditional', '表达式', '晶体学'],
    cmds: [
      "/particleex conditional minecraft:end_rod -8 0 0 1 0.95 0.89 1 0 0 0 2.6 2.6 2.6 'd=max(max(abs(x),abs(y)),abs(z))-2.0;abs(d)<0.065' 0.13 300 null 1 null",
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 2.6 2.6 2.6 'd=max(max(abs(x+y+z),abs(x+y-z)),max(abs(x-y+z),abs(-x+y+z)))*0.5-2.0;abs(d)<0.065' 0.13 300 null 1 null",
      "/particleex conditional minecraft:end_rod 8 0 0 1 0.95 0.89 1 0 0 0 2.6 2.6 2.6 'd=max(max(max(abs(x+y),abs(x-y)),max(abs(y+z),abs(y-z))),max(abs(z+x),abs(z-x)))*0.5-2.0;abs(d)<0.065' 0.13 300 null 1 null",
    ],
  },
  {
    id: 'gausselipsoid',
    name: '协方差椭球三态（球 / 扁椭球 / 相关斜椭球）',
    desc: '**多元正态分布 \`exp(−Q/2)\` 的等密度面就是二次型 \`Q(x) = c\` 的等值面**——而 \`Q\` 的矩阵就是这个分布的协方差逆矩阵。所以「画正态分布的等密度面」和「画二次型等值面」是同一件事，三条分别演示三种协方差矩阵：左**各向同性**（\`Q = x²+y²+z²\`，协方差是单位阵，等值面是球）；中**对角但不等**（\`Q = 0.25x²+y²+0.25z²\`，三个特征值不同，等值面是**扁椭球**——x、z 方向方差大所以拉长）；右**非对角**（\`Q = 0.5(x−y)²+0.5z²\`，协方差矩阵有非零的非对角元，等值面是**绕 z 轴转 45° 的斜椭球**）。**非对角元就是「相关性」**：x 与 y 正相关时椭球主轴沿 x=y 方向倾斜，这正是主成分分析（PCA）要旋转掉的东西——PCA 做的就是把协方差矩阵对角化，让椭球重新对齐坐标轴。三条各约 3900 粒 / 共 11632 粒 65ms、占格 2873。把 \`0.5\` 改成别的主轴倾斜角就跟着变。',
    tags: ['conditional', '表达式', '概率'],
    cmds: [
      "/particleex conditional minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'Q=x*x+y*y+z*z;d=(Q-4.0)*0.25;abs(d)<0.06' 0.14 300 null 1 null",
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'Q=x*x*0.25+y*y+z*z*0.25;d=(Q-2.0)*0.3;abs(d)<0.06' 0.14 300 null 1 null",
      "/particleex conditional minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'Q=(x-y)*(x-y)*0.5+z*z*0.5;d=(Q-2.0)*0.3;abs(d)<0.06' 0.14 300 null 1 null",
    ],
  },
  {
    id: 'corrugated',
    name: '波纹环面三态（管半径按方位角调制）',
    desc: '**管半径本身随方位角起伏** \`r(θ) = 1.3 + A·sin(kθ)\`——于是环面不再是均匀的甜甜圈，而是**沿周向鼓起 k 处**的波浪管。这看似简单的一步改变了曲面的几何性质：普通环面只有两个主曲率方向（沿管、绕轴），波纹管的**外侧弯曲最剧烈的地方（波峰）与最平缓的地方（波谷）交替出现**，高斯曲率沿周向周期性起伏——这正是波纹管（corrugated tube）在工程上容易在波峰处疲劳开裂的原因。三条 k=3 / 5 / 8 对照：k=3 时波峰只有三处、间隔很宽；k=8 时波密到几乎看不出是个环。**注意这是「一个参数走完全谱」的又一例**：k 就是整数，从 1 数到 8 就能看到从「略变形的环」到「花边环」的全部过渡。三条各 3500 粒 / 共 10500 粒 26ms、占格 5840（是本批占格最高的曲面之一）。改 0.5 换起伏幅度（≥1.3 会自交，环面穿孔）。',
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -10 0 0 1 0.95 0.89 1 0 0 0 0 3499 'u=t;NL=50;NRv=70;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*2.0*PI;ph=ss*2.0*PI;rr=1.3+0.5*sin(3*th);x=(3.2+rr*cos(ph))*cos(th);z=(3.2+rr*cos(ph))*sin(th);y=rr*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3499 'u=t;NL=50;NRv=70;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*2.0*PI;ph=ss*2.0*PI;rr=1.3+0.5*sin(5*th);x=(3.2+rr*cos(ph))*cos(th);z=(3.2+rr*cos(ph))*sin(th);y=rr*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 10 0 0 1 0.95 0.89 1 0 0 0 0 3499 'u=t;NL=50;NRv=70;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*2.0*PI;ph=ss*2.0*PI;rr=1.3+0.5*sin(8*th);x=(3.2+rr*cos(ph))*cos(th);z=(3.2+rr*cos(ph))*sin(th);y=rr*sin(ph)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'blochball',
    name: '布洛赫球三重球壳（量子态空间）',
    desc: '**一个量子比特的所有纯态都住在这个球的表面上**——北极是 |0⟩、南极是 |1⟩、赤道是 |+⟩/|−⟩ 这些等权叠加态。球面上的每一点 (θ, φ) 对应一个纯态，而**球内**的点对应混合态：半径就是纯度，越靠球心越混。三条由外到内是三个纯度层（R=3.5 / 2.2 / 1.1），各自都是一整张球面。**颜色用了双参数色相** \`h = θ/π·0.5 + φ/2π·0.5\`——极角与方位角各占一半权重，于是球面上**处处不同色**（1942 种），比单用纬度只能出 70 条离散色带好一个数量级，这是「两个角度都要编码进一条色带」时的标准折中写法。三层共 10944 粒 35ms、占格 2792。改三个半径换纯度分层；把 h 的权重倒过来（φ 占大头）会得到纵向条纹而不是斜向过渡。',
    tags: ['rgbaparameter', '表达式', '量子'],
    cmds: [
      "/particleex rgbaparameter minecraft:end_rod -8 0 0 0 0 0 0 3647 'u=t;NL=76;NRv=48;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;rr=3.5;x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph);h=th/PI*0.5+ss*0.5;cr=h;cg=1.0-abs(2.0*h-1.0);cb=1.0-h' 1 200 'null' 1 null",
      "/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 3647 'u=t;NL=76;NRv=48;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;rr=2.2;x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph);h=th/PI*0.5+ss*0.5;cr=h;cg=1.0-abs(2.0*h-1.0);cb=1.0-h' 1 200 'null' 1 null",
      "/particleex rgbaparameter minecraft:end_rod 8 0 0 0 0 0 0 3647 'u=t;NL=76;NRv=48;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;rr=1.1;x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph);h=th/PI*0.5+ss*0.5;cr=h;cg=1.0-abs(2.0*h-1.0);cb=1.0-h' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'hypergeo',
    name: '庞加莱圆盘测地线族（双曲直线）',
    desc: '**双曲几何里的「直线」在庞加莱圆盘里画成与边界正交的圆弧**——这是这个模型的全部含义。一条这样的弧就是一个「双曲直线」，两条不同的弧之间满足双曲公理：过直线外一点有**无穷多条**平行线（欧氏几何只有一条）。三条命令各画一组：**每条弧的圆心在圆外距 a 处、半径 sqrt(a²−1)**，这样它与单位圆严格正交，才是合法的双曲直线。la 从 0 到 9 让 a 按 1.15 的几何级数递增（1.08 → 4.2），于是有 10 层疏密不同的弧，ii 让每层绕 20 个方向旋转。**中点那个空洞不是 bug**：所有与边界正交的弧都不经过圆心，所以圆心附近必然是空的——这正是双曲几何里「中心到任何测地线的距离都为正」的视觉体现。三条各 11000 粒 / 共 33000 粒 67ms、占格 1938。改正交条件 \`lim=acos((1/a−a)/sqrt(a²−1))\` 会改变弧落在圆盘内的哪一段，改 1.15 换层的疏密梯度。',
    tags: ['parameter', '表达式', '非欧几何'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 10999 'u=t;NP=55;MM=20;LL=10;per=MM*NP;la=floor(u/per);rem=floorMod(u,per);ii=floor(rem/NP);ss=floorMod(rem,NP)/(NP-1);aa=1.08*pow(1.15,la);rad=sqrt(aa*aa-1.0);lim=acos((1.0/aa-aa)/rad);th0=lim+(2.0*PI-2.0*lim)*ss;px=aa+rad*cos(th0);pz=rad*sin(th0);ang=ii/(MM-1)*2.0*PI;qx=px*cos(ang)-pz*sin(ang);qz=px*sin(ang)+pz*cos(ang);x=qx*4.2;y=0.0;z=qz*4.2' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 10999 'u=t;NP=55;MM=20;LL=10;per=MM*NP;la=floor(u/per);rem=floorMod(u,per);ii=floor(rem/NP);ss=floorMod(rem,NP)/(NP-1);aa=1.08*pow(1.15,la);rad=sqrt(aa*aa-1.0);lim=acos((1.0/aa-aa)/rad);th0=lim+(2.0*PI-2.0*lim)*ss;px=aa+rad*cos(th0);pz=rad*sin(th0);ang=ii/(MM-1)*2.0*PI;qx=px*cos(ang)-pz*sin(ang);qz=px*sin(ang)+pz*cos(ang);x=qx*4.2;y=0.0;z=qz*4.2' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 10999 'u=t;NP=55;MM=20;LL=10;per=MM*NP;la=floor(u/per);rem=floorMod(u,per);ii=floor(rem/NP);ss=floorMod(rem,NP)/(NP-1);aa=1.08*pow(1.15,la);rad=sqrt(aa*aa-1.0);lim=acos((1.0/aa-aa)/rad);th0=lim+(2.0*PI-2.0*lim)*ss;px=aa+rad*cos(th0);pz=rad*sin(th0);ang=ii/(MM-1)*2.0*PI;qx=px*cos(ang)-pz*sin(ang);qz=px*sin(ang)+pz*cos(ang);x=qx*4.2;y=0.0;z=qz*4.2' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'bezier3',
    name: '双三次贝塞尔曲面三态（16 控制点）',
    desc: "**双三次 Bezier 曲面是 CAD 里所有自由曲面的始祖**——16 个控制点排成 4×4，横向、纵向各做一次三次 Bezier 插值，就得到一张光滑曲面。表达式把 16 个高度值直接写成字面量 h00…h33，先沿 t 方向三次插值出 4 个中间值 r0…r3，再沿 s 方向插值出最终高度。**三条的区别只在控制点**：单峰把中间 4 点抬到 4.2 得到圆润的丘；鞍形只抬两个对角点得到马鞍（一升一降，正是 z=xy 的形状）；双峰把四个角交替抬高抬出棋盘式起伏。**Bezier 的关键性质在这里看得很清楚**：曲面一定落在控制点的凸包内、且只在角点处穿过控制点——所以单峰的边缘始终归零、鞍形能保持四个角贴地。三条各 2500 粒 / 共 7500 粒 42ms、占格 3361。改 (s-0.5)*9.0 的系数换平面尺度，改 h 矩阵换任何形状——这就是「16 个数字生成一张曲面」的通用模板。",
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;NL=50;NRv=50;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);s=ii/(NRv-1);tt=ss;b0s=(1.0-s)*(1.0-s)*(1.0-s);b1s=3.0*s*(1.0-s)*(1.0-s);b2s=3.0*s*s*(1.0-s);b3s=s*s*s;b0t=(1.0-tt)*(1.0-tt)*(1.0-tt);b1t=3.0*tt*(1.0-tt)*(1.0-tt);b2t=3.0*tt*tt*(1.0-tt);b3t=tt*tt*tt;h00=0.00;h01=1.20;h02=1.20;h03=0.00;h10=1.20;h11=4.20;h12=4.20;h13=1.20;h20=1.20;h21=4.20;h22=4.20;h23=1.20;h30=0.00;h31=1.20;h32=1.20;h33=0.00;r0=h00*b0t+h01*b1t+h02*b2t+h03*b3t;r1=h10*b0t+h11*b1t+h12*b2t+h13*b3t;r2=h20*b0t+h21*b1t+h22*b2t+h23*b3t;r3=h30*b0t+h31*b1t+h32*b2t+h33*b3t;yy=b0s*r0+b1s*r1+b2s*r2+b3s*r3;x=(s-0.5)*9.0;y=yy;z=(tt-0.5)*9.0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;NL=50;NRv=50;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);s=ii/(NRv-1);tt=ss;b0s=(1.0-s)*(1.0-s)*(1.0-s);b1s=3.0*s*(1.0-s)*(1.0-s);b2s=3.0*s*s*(1.0-s);b3s=s*s*s;b0t=(1.0-tt)*(1.0-tt)*(1.0-tt);b1t=3.0*tt*(1.0-tt)*(1.0-tt);b2t=3.0*tt*tt*(1.0-tt);b3t=tt*tt*tt;h00=0.00;h01=3.00;h02=0.00;h03=0.00;h10=0.00;h11=0.00;h12=0.00;h13=0.00;h20=0.00;h21=0.00;h22=0.00;h23=0.00;h30=0.00;h31=0.00;h32=3.00;h33=0.00;r0=h00*b0t+h01*b1t+h02*b2t+h03*b3t;r1=h10*b0t+h11*b1t+h12*b2t+h13*b3t;r2=h20*b0t+h21*b1t+h22*b2t+h23*b3t;r3=h30*b0t+h31*b1t+h32*b2t+h33*b3t;yy=b0s*r0+b1s*r1+b2s*r2+b3s*r3;x=(s-0.5)*9.0;y=yy;z=(tt-0.5)*9.0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 2499 'u=t;NL=50;NRv=50;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);s=ii/(NRv-1);tt=ss;b0s=(1.0-s)*(1.0-s)*(1.0-s);b1s=3.0*s*(1.0-s)*(1.0-s);b2s=3.0*s*s*(1.0-s);b3s=s*s*s;b0t=(1.0-tt)*(1.0-tt)*(1.0-tt);b1t=3.0*tt*(1.0-tt)*(1.0-tt);b2t=3.0*tt*tt*(1.0-tt);b3t=tt*tt*tt;h00=0.00;h01=3.50;h02=0.00;h03=3.50;h10=0.00;h11=0.00;h12=0.00;h13=0.00;h20=3.50;h21=0.00;h22=3.50;h23=0.00;h30=0.00;h31=3.50;h32=0.00;h33=3.50;r0=h00*b0t+h01*b1t+h02*b2t+h03*b3t;r1=h10*b0t+h11*b1t+h12*b2t+h13*b3t;r2=h20*b0t+h21*b1t+h22*b2t+h23*b3t;r3=h30*b0t+h31*b1t+h32*b2t+h33*b3t;yy=b0s*r0+b1s*r1+b2s*r2+b3s*r3;x=(s-0.5)*9.0;y=yy;z=(tt-0.5)*9.0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'saddlen',
    name: 'n 阶调和鞍面族（花瓣鞍点）',
    desc: "**这是一个调和多项式的实部**——把复数 (x+iz)ⁿ 展开，虚部就是 ρⁿ·sin(nφ)。它是拉普拉斯方程的解（Δf=0），所以这族曲面在数学物理里有个正式名字：**球谐函数在赤道面的截面**，也叫「鞍点族」。n=2 就是普通马鞍 z=xy 的形状，n 越大花瓣越多。**颜色深浅在这里就是高度**：三条各 3600 粒 / 共 10800 粒 25ms、占格 3656。ρ=hypot(x,z)/6.4 把平面半径归一化到 [0,1] 再取 n 次幂，这个归一化不能省——否则高次幂会让边缘的峰值把中心压成一片平地。改 2.8 换起伏幅度，改 6.4 换花瓣的收拢速度。",
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);xx=(ii/(NRv-1)-0.5)*9.0;zz=(ss-0.5)*9.0;rr=hypot(xx,zz)/6.4;ph=atan2(zz,xx);x=xx;z=zz;y=pow(rr,3.0)*sin(3.0*ph)*2.8' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);xx=(ii/(NRv-1)-0.5)*9.0;zz=(ss-0.5)*9.0;rr=hypot(xx,zz)/6.4;ph=atan2(zz,xx);x=xx;z=zz;y=pow(rr,5.0)*sin(5.0*ph)*2.8' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);xx=(ii/(NRv-1)-0.5)*9.0;zz=(ss-0.5)*9.0;rr=hypot(xx,zz)/6.4;ph=atan2(zz,xx);x=xx;z=zz;y=pow(rr,7.0)*sin(7.0*ph)*2.8' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'arrayfactor',
    name: '均匀直线阵天线方向图三态（余弦和式）',
    desc: "**这是相控阵雷达天线方向图的标准公式画成三维极坐标**——N 个等间距天线阵元，相邻两元之间的相位差 ψ = π·cosθ（阵元间距取半波长 λ/2），总辐射强度就是「阵列因子」AF(ψ)。教科书写作 sin(Nψ/2)/sin(ψ/2)，但它有个**分母为零**的病态点（ψ→0 时 0/0），所以这里改写成**余弦和式**：偶数 N 时 AF = 2[cos(ψ/2) + cos(3ψ/2) + … + cos((N−1)ψ/2)]，恒等变形、没有任何除零风险。极坐标绘制：半径 = |AF|/N，方向 = (θ, φ)。**N 越大，主瓣越窄、侧瓣越多**：N=4 时主瓣宽厚只有一圈侧瓣；N=10 时主瓣收成细针、侧瓣密布成环——这正是阵列天线「阵元越多指向性越好」的直接图像。主瓣沿 z 轴两端射出（端射，未加相位扫描），中间的横纹就是各个侧瓣环。三条各 3600 粒 / 共 10800 粒 29ms、占格 1528。把 psi 改成 PI*cos(th)+扫描相移 即可让主瓣偏转（相位扫描）。",
    tags: ['parameter', '表达式', '电磁'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;psi=PI*cos(th);AF=2.0*cos(1.0*psi*0.5)+2.0*cos(3.0*psi*0.5);rr=3.0*abs(AF)/4.0;x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;psi=PI*cos(th);AF=2.0*cos(1.0*psi*0.5)+2.0*cos(3.0*psi*0.5)+2.0*cos(5.0*psi*0.5);rr=3.0*abs(AF)/6.0;x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;psi=PI*cos(th);AF=2.0*cos(1.0*psi*0.5)+2.0*cos(3.0*psi*0.5)+2.0*cos(5.0*psi*0.5)+2.0*cos(7.0*psi*0.5)+2.0*cos(9.0*psi*0.5);rr=3.0*abs(AF)/10.0;x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'gibbs2d',
    name: '二维傅里叶方波曲面三态（Gibbs 现象）',
    desc: "**这张曲面上每一个「台阶」都在告诉你：用光滑的正弦波拼方形，边角永远拼不干净**。一维方波的傅里叶级数只含奇次谐波 sin(kx)/k（k=1,3,5…），把两条一维的级数相乘就得到二维棋盘方波——正负交替的方形平台，平台之间是陡峭的过渡带。**三条只差级数项数（3 / 9 / 25 项）**，看上去只是台阶边缘越来越陡，但真正要盯的是**过渡带的高度**：N=3 时峰谷是 ±1.741，N=9 时 ±1.696, N=25 时 ±1.642——几乎没降。这就是 **Gibbs 现象**：无论加多少项，间断点附近的过冲只能收敛到理论端值 ≈1.39×平台高度，永远不会消失。项数增加只是把过冲**挤窄**，不能把它压平。三条各 3600 粒 / 共 10800 粒 52ms、占格 10800（满格）。改 PI/4.5 换格子尺寸，改 2.0 换高差。",
    tags: ['parameter', '表达式', '傅里叶'],
    cmds: [
      "/particleex parameter minecraft:end_rod -19 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);xx=(ii/(NRv-1)-0.5)*18.0;zz=(ss-0.5)*18.0;tx=xx*PI/4.5;tz=zz*PI/4.5;fx=sin(1.0*tx)+sin(3.0*tx)/3.0+sin(5.0*tx)/5.0;fz=sin(1.0*tz)+sin(3.0*tz)/3.0+sin(5.0*tz)/5.0;x=xx;y=2.0*fx*fz;z=zz' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);xx=(ii/(NRv-1)-0.5)*18.0;zz=(ss-0.5)*18.0;tx=xx*PI/4.5;tz=zz*PI/4.5;fx=sin(1.0*tx)+sin(3.0*tx)/3.0+sin(5.0*tx)/5.0+sin(7.0*tx)/7.0+sin(9.0*tx)/9.0+sin(11.0*tx)/11.0+sin(13.0*tx)/13.0+sin(15.0*tx)/15.0+sin(17.0*tx)/17.0;fz=sin(1.0*tz)+sin(3.0*tz)/3.0+sin(5.0*tz)/5.0+sin(7.0*tz)/7.0+sin(9.0*tz)/9.0+sin(11.0*tz)/11.0+sin(13.0*tz)/13.0+sin(15.0*tz)/15.0+sin(17.0*tz)/17.0;x=xx;y=2.0*fx*fz;z=zz' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 19 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);xx=(ii/(NRv-1)-0.5)*18.0;zz=(ss-0.5)*18.0;tx=xx*PI/4.5;tz=zz*PI/4.5;fx=sin(1.0*tx)+sin(3.0*tx)/3.0+sin(5.0*tx)/5.0+sin(7.0*tx)/7.0+sin(9.0*tx)/9.0+sin(11.0*tx)/11.0+sin(13.0*tx)/13.0+sin(15.0*tx)/15.0+sin(17.0*tx)/17.0+sin(19.0*tx)/19.0+sin(21.0*tx)/21.0+sin(23.0*tx)/23.0+sin(25.0*tx)/25.0+sin(27.0*tx)/27.0+sin(29.0*tx)/29.0+sin(31.0*tx)/31.0+sin(33.0*tx)/33.0+sin(35.0*tx)/35.0+sin(37.0*tx)/37.0+sin(39.0*tx)/39.0+sin(41.0*tx)/41.0+sin(43.0*tx)/43.0+sin(45.0*tx)/45.0+sin(47.0*tx)/47.0+sin(49.0*tx)/49.0;fz=sin(1.0*tz)+sin(3.0*tz)/3.0+sin(5.0*tz)/5.0+sin(7.0*tz)/7.0+sin(9.0*tz)/9.0+sin(11.0*tz)/11.0+sin(13.0*tz)/13.0+sin(15.0*tz)/15.0+sin(17.0*tz)/17.0+sin(19.0*tz)/19.0+sin(21.0*tz)/21.0+sin(23.0*tz)/23.0+sin(25.0*tz)/25.0+sin(27.0*tz)/27.0+sin(29.0*tz)/29.0+sin(31.0*tz)/31.0+sin(33.0*tz)/33.0+sin(35.0*tz)/35.0+sin(37.0*tz)/37.0+sin(39.0*tz)/39.0+sin(41.0*tz)/41.0+sin(43.0*tz)/43.0+sin(45.0*tz)/45.0+sin(47.0*tz)/47.0+sin(49.0*tz)/49.0;x=xx;y=2.0*fx*fz;z=zz' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'springtube',
    name: '螺旋弹簧管三态（疏密与粗细对照）',
    desc: "**这是一根真正有粗细的弹簧，不是一条螺旋线**——中心线是半径 1.6 的圆柱螺旋，再沿每一点的**局部法平面**铺一个半径 0.35~0.55 的圆截面，于是得到一根实体管。关键在于截面方向的取法：必须用切向的垂直方向（cos φ, 0, sin φ）与竖直方向 (0,1,0) 张成，**不能直接写 (cos sg, sin sg, 0)**——后者在螺旋扭转时会变成一根扁带，而不是圆管。三条的区别在**匝数 / 螺距 / 管径的比例**：5 匝配 5.0 螺距是疏绕的粗弹簧，12 匝配 9.0 螺距是密绕的细弹簧，8 匝居中。匝数上升时弹簧被拉长，但正因为**管径同步变细**，相邻两圈的间隙才始终保持可见，不会糊成一根柱。三条各 6300 / 9000 / 12600 粒，共 27900 粒 66ms、占格 1728。改 R 换弹簧圈的半径，改 pitch 换疏密，改 tube 换粗细。",
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 6299 'u=t;NL=140;NRv=45;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1);ph=tt*5*2.0*PI;R=1.6;cy=(tt-0.5)*5;cx=R*cos(ph);cz=R*sin(ph);sg=ss*2.0*PI;x=cx+0.55*cos(sg)*cos(ph);y=cy+0.55*sin(sg);z=cz+0.55*cos(sg)*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 8999 'u=t;NL=200;NRv=45;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1);ph=tt*8*2.0*PI;R=1.6;cy=(tt-0.5)*7;cx=R*cos(ph);cz=R*sin(ph);sg=ss*2.0*PI;x=cx+0.45*cos(sg)*cos(ph);y=cy+0.45*sin(sg);z=cz+0.45*cos(sg)*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 12599 'u=t;NL=280;NRv=45;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1);ph=tt*12*2.0*PI;R=1.6;cy=(tt-0.5)*9;cx=R*cos(ph);cz=R*sin(ph);sg=ss*2.0*PI;x=cx+0.35*cos(sg)*cos(ph);y=cy+0.35*sin(sg);z=cz+0.35*cos(sg)*sin(ph)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'limaconrev',
    name: '利马松旋转体三态（蚶线绕轴）',
    desc: "**利马松（蚶线）r = b + a·cosθ 绕轴旋转成三维实体**——这条曲线的形状全靠 b/a 的比值：b > a 时是外凸的心形（无内环），b = a 时是**心形线**，b < a 时内侧凹进去、出现一个套着的小环。三条正好跨过这个分界点，于是旋转之后：第一个像**带浅坑的陀螺**，第二个是标准的**心形旋转体**（顶部有心尖），第三个的内环放大成了**贯通的内腔**——剖面图里能直接看到中心那片空白。**截面圆被压扁到 0.55 倍**是必要的：不压扁就是正球面旋转体，压扁之后这个曲面才有「厚盘」的体积感，占格也因此从一千多涨到三千多。三条各 3200 粒 / 共 9600 粒 26ms、占格 3172。把 0.55 改回 1.0 可直接看正圆柱对称的版本，改 2.4 换整体尺寸。",
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 3199 'u=t;NL=80;NRv=40;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1)*2.0*PI;rr=(0.55+1*cos(tt))*2.4;px=rr*cos(tt);sg=ss*2.0*PI;x=px*cos(sg);z=px*sin(sg);y=rr*sin(tt)*0.55' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3199 'u=t;NL=80;NRv=40;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1)*2.0*PI;rr=(0.85+1*cos(tt))*2.4;px=rr*cos(tt);sg=ss*2.0*PI;x=px*cos(sg);z=px*sin(sg);y=rr*sin(tt)*0.55' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 3199 'u=t;NL=80;NRv=40;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1)*2.0*PI;rr=(0.75+0.75*cos(tt))*2.4;px=rr*cos(tt);sg=ss*2.0*PI;x=px*cos(sg);z=px*sin(sg);y=rr*sin(tt)*0.55' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'rectdrum',
    name: '矩形鼓驻波模态三态（振幅着色）',
    desc: "**矩形的鼓面上，每一阶驻波都是 (m,n) 两个整数决定的鼓包图案**——y = sin(mπu)·sin(nπv)，四条边始终钉在 0（这就是「边缘固定的边界条件」），中间冒出 m×n 个鼓包，鼓包之间是节线。这条正好补上库里 `besseldrum` 留的空白：那个是**圆形**鼓，模态由贝塞尔函数零点决定、鼓包是环状且不对称；矩形鼓的模态是**纯正弦乘积**，鼓包成整齐的棋盘，代价也低得多。三条 (m,n) = (1,2) / (2,2) / (3,3)：第一个是一条横着的波浪，第二个是四鼓包的棋盘，第三个是九鼓包。**颜色不是装饰，它就是振幅**：cr = |amp| 让波峰波谷都点亮成红，cg = 1−amp² 在零振幅处（节线）最绿、在鼓包顶最暗，于是节线在成片上就是一道道绿色的网。三条各 3600 粒 / 共 10800 粒 29ms、占格 3446、共 155 种颜色。改 m/n 换模态，改 0.9 换鼓包高度。",
    tags: ['rgbaparameter', '表达式', '波动'],
    cmds: [
      "/particleex rgbaparameter minecraft:end_rod -9 0 0 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=ii/(NRv-1);vv=ss;amp=sin(1.0*PI*uu)*sin(2.0*PI*vv);x=(uu-0.5)*9.0;y=0.9*amp;z=(vv-0.5)*9.0;hh=abs(amp);cr=hh;cg=1.0-hh*hh;cb=1.0-hh' 1 200 'null' 1 null",
      "/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=ii/(NRv-1);vv=ss;amp=sin(2.0*PI*uu)*sin(2.0*PI*vv);x=(uu-0.5)*9.0;y=0.9*amp;z=(vv-0.5)*9.0;hh=abs(amp);cr=hh;cg=1.0-hh*hh;cb=1.0-hh' 1 200 'null' 1 null",
      "/particleex rgbaparameter minecraft:end_rod 9 0 0 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=ii/(NRv-1);vv=ss;amp=sin(3.0*PI*uu)*sin(3.0*PI*vv);x=(uu-0.5)*9.0;y=0.9*amp;z=(vv-0.5)*9.0;hh=abs(amp);cr=hh;cg=1.0-hh*hh;cb=1.0-hh' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'hyperboloid',
    name: '单叶双曲面三态（冷却塔曲面）',
    desc: "**单叶双曲面是唯一一种能由两条直线族完全铺满的曲面**——这个性质让它成了直纹面（ruled surface）的教科书主角，也解释了为什么冷却塔会做成这个形状：混凝土是直的，把它斜着排一圈就能围出曲面。方程 x²+z² = a²(1+y²/c²)，半径按 **cosh** 膨胀，所以在腰部最细、上下两端向外张开。**三条控制两个参数**：喉部半径 a（1.0 / 0.6 / 2.0）与张开率（0.35 / 0.8 / 0.9）。左条张得很慢，几乎是根直筒；中条腰细且张开急促，是标准冷却塔；右条腰粗同时张开快，像一只旋开的碗。**注意它和单叶双曲面上的「直纹」不是一回事**：曲面上真实的直线（母线）在粒子渲染里会表现为表面上的斜向纹理，而正确参数化（cosh）给出的是光滑回转面——把 sin/cos 换成 (t·cosθ ± sinθ) 那组线性式就能直接画出母线。三条各 3600 粒 / 共 10800 粒 38ms、占格 1996。改 2.2 换高度范围，改 a 换腰径。",
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=ii/(NRv-1)*2.0*PI;vv=(ss-0.5)*2.2;rr=1*cosh(0.35*vv);x=rr*cos(uu);z=rr*sin(uu);y=2.2*vv' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=ii/(NRv-1)*2.0*PI;vv=(ss-0.5)*2.2;rr=0.6*cosh(0.8*vv);x=rr*cos(uu);z=rr*sin(uu);y=2.2*vv' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=60;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=ii/(NRv-1)*2.0*PI;vv=(ss-0.5)*2.2;rr=2*cosh(0.9*vv);x=rr*cos(uu);z=rr*sin(uu);y=2.2*vv' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'bumpsphere',
    name: '球面格窗隆起三态（双方向调制）',
    desc: "**把球面的半径按两个独立方向同时调制，球就变成了布满格窗的灯笼**——r = R·(1 + A·cos(mθ)·cos(nφ))。这里 θ 是纬度角、φ 是经度角，**两个余弦一个管南北、一个管东西**，所以隆起既沿子午线排、又沿纬线排，交叉出来是棋盘状的鼓包阵列，而不是简单的一圈圈环形波。这正是球谐函数 Y_lm 的实部结构在几何上的直接呈现：l 阶球谐在球面上恰好有 l 条节线（其中 m 条经向、l−m 条纬向），本模板的 m 与 n 就是这两类节线的条数。**三条走的是「密度谱」**：(4,4) 是稀疏的大鼓包、能一眼数清；(8,6) 已经密到像蜂巢；(12,10) 干脆糊成一层带细密凹凸的壳——**A 随密度同步加到 0.26 是必须的**，否则鼓包越小越看不出来。nl+1 行 × nl 列（61×60）保证极点到极点的均匀覆盖。三条各 3660 粒 / 共 10980 粒 29ms、占格 7328（本库最高之一）。改 A 换起伏幅度（>0.6 会自交），改 m/n 换南北与东西的节线条数。",
    tags: ['parameter', '表达式', '球谐'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 3659 'u=t;NL=61;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;rr=3.6*(1.0+0.18*cos(4.0*th)*cos(4.0*ph));x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3659 'u=t;NL=61;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;rr=3.6*(1.0+0.22*cos(8.0*th)*cos(6.0*ph));x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 3659 'u=t;NL=61;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*PI;ph=ss*2.0*PI;rr=3.6*(1.0+0.26*cos(12.0*th)*cos(10.0*ph));x=rr*sin(th)*cos(ph);y=rr*cos(th);z=rr*sin(th)*sin(ph)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'wraptorus',
    name: '缠绕环面三态（截面随主环拧转）',
    desc: "**这不是普通环面，而是把管截面沿主环方向「拧」过的环面**——普通环面的截面角 φ 与主环角 θ 独立，截面一圈一圈平行地铺过去；这里写成 tw = φ + k·θ，**截面角跟着主环角同步旋转**，于是原本平行的截面变成了一组螺旋盘绕的截面，环面被拧成一根绕了 k 圈的粗绳。k 就是**缠绕圈数**：k=3 时管子自己绕了 3 圈、表面上的螺旋条纹疏而清晰；k=9 时绕 9 圈，条纹密到糊成一片带细纹的管壁。**这个概念在数学上叫环面上的螺旋线缠绕**（torus knot 的「绕管方向」分量），(p,q) 环面结就是取 1 维的曲线版本；这里保留整个截面，所以得到的是**有体积的缠绕管**，占格比单条结线高得多。**注意与库里 `corrugated` 的区别**：那个是把管半径按方位角调制成波浪（r 随 θ 起伏），**半径变**；这条是完全拧转相位（tw 里加 k·θ），**半径不变、截面方向变**。三条各 3600 / 5600 / 8000 粒，共 17200 粒 34ms、占格 4174。改 k 换缠绕圈数（k=0 退化成普通环面）。",
    tags: ['parameter', '表达式', '曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=90;NRv=40;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*2.0*PI;ph=ss*2.0*PI;tw=ph+3.0*th;rr=3.2+(1.2+0.5*cos(tw))*cos(tw);yy=(1.2+0.5*cos(tw))*sin(tw);x=rr*cos(th);z=rr*sin(th);y=yy' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 5599 'u=t;NL=140;NRv=40;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*2.0*PI;ph=ss*2.0*PI;tw=ph+6.0*th;rr=3.2+(1.2+0.45*cos(tw))*cos(tw);yy=(1.2+0.45*cos(tw))*sin(tw);x=rr*cos(th);z=rr*sin(th);y=yy' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 7999 'u=t;NL=200;NRv=40;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);th=ii/(NRv-1)*2.0*PI;ph=ss*2.0*PI;tw=ph+9.0*th;rr=3.2+(1.2+0.4*cos(tw))*cos(tw);yy=(1.2+0.4*cos(tw))*sin(tw);x=rr*cos(th);z=rr*sin(th);y=yy' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'ruledsaddle',
    name: '双曲抛物面两族直母线（菱形网）',
    desc: "**双曲抛物面 y=(x²−z²)/a 是少数几种能由两族直线完全铺成的曲面**——马鞍不是弯的船帆，它是**无数根笔直的木条斜着交叉搭出来的**。这一点用普通曲面参数化（直接填网格）看不出来：填出来的只是光滑曲面，母线的存在完全被抹掉。这条改成**沿母线采样**：x=u+v、z=±(u−v)、y 由曲面方程定，u 固定时 v 扫一根直线，u 取 40 个值就得到 40 根平行母线。**两条命令只差 sg=±1，得到的是两族方向相反的母线**：一族斜向 (+45°)，一族斜向 (−45°)，两族交叉就织成菱形的网——**这正是「双曲抛物面」实际建造时的做法**（薄壳屋顶就是按这套母线布钢筋的）。**第三条把 u 采样密度减半（NL 从 60 到 20），母线变稀**，菱形网格放大，能一眼看出每根母线的走向。与库里 `saddle` 的区别：那条 3600 粒铺满曲面、占格 682；这条只沿母线打点、网格之间是空的，**同一张曲面、两种截然不同的视觉与数学含义**。三条各 2400 / 2400 / 1200 粒，共 6000 粒 18ms、占格 2178。改 sg 换族方向，改 0.28 换鞍的陡峭度。",
    tags: ['parameter', '表达式', '直纹面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;NL=60;NRv=40;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=(ii/(NRv-1)-0.5)*4.0;vv=(ss-0.5)*4.0;sg=1.0;x=uu+vv;z=sg*(uu-vv);y=(x*x-z*z)*0.28' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;NL=60;NRv=40;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=(ii/(NRv-1)-0.5)*4.0;vv=(ss-0.5)*4.0;sg=-1.0;x=uu+vv;z=sg*(uu-vv);y=(x*x-z*z)*0.28' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 1199 'u=t;NL=20;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);uu=(ii/(NRv-1)-0.5)*4.0;vv=(ss-0.5)*4.0;sg=1.0;x=uu+vv;z=sg*(uu-vv);y=(x*x-z*z)*0.28' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'geonet',
    name: '球面大圆网两态（共轴测地线族）',
    desc: "**这十几圈线其实是「同一个圆」被绕了不同角度**——x=cos t、y=sin t·cos α、z=sin t·sin α 这条公式里，t 让点绕一圈，α 决定这一圈所在的**大圆平面**倾斜多少。α 取满 [−π/2, π/2] 就得到一族共轴的球面大圆，它们两两相交于球面的两个对极点，把球面切成一片片**月牙形的球面二角形**（lune）。这正是球面几何里最基础的剖分方式：每条大圆都是球面上的「直线」（测地线），任意两条必相交于两点——**球面上没有平行线**，这是球面几何与欧氏几何最大的分歧。三条的区别只在**条数**：24 条大圆时每个二角形宽 7.5°，一眼能数清；96 条时密到像编织的网。**每条大圆用 150/300 个点采样**是必需的——点太少就会在视觉上断成虚线段。两条各 3600 / 14400 粒，共 18000 粒 26ms、占格 4114。改条数换疏密，改 3.5 换球半径。",
    tags: ['parameter', '表达式', '球面几何'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 3599 'u=t;NL=150;NRv=24;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1)*2.0*PI;al=(ss-0.5)*PI;x=3.5*cos(tt);y=3.5*sin(tt)*cos(al);z=3.5*sin(tt)*sin(al)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 47999 'u=t;NL=500;NRv=96;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1)*2.0*PI;al=(ss-0.5)*PI;x=3.5*cos(tt);y=3.5*sin(tt)*cos(al);z=3.5*sin(tt)*sin(al)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'multileaf',
    name: '多叶螺旋面三态（多线螺纹几何）',
    desc: "**同一根轴，k 张螺旋面同时旋转——它们在轴心处相接，向外分成 k 片刀锋般的叶片**。这跟单片 helicoid（库里 `helicoid`）的关键区别不在形状，而在于**层与层之间的相位**：单片螺旋面每转一圈上升高度 h，k 叶螺旋面在**同一高度截面**上同时穿出 k 片，相邻叶片在高度方向错开 h/k 的相位。所以从轴心往外看，你看到的是 k 条从中心辐射出去、边转边升的曲线族；从上往下看，k 片叶子把圆周等分成 k 份，每一份里叶片都在扭转。**这正是多线螺纹（multi-start thread）的几何**：一根螺栓上的 k 条独立螺纹螺旋，就是这 k 片叶子。三条把叶数从 3 / 5 到 8：3 叶时叶片厚实、每片看得清走向；5 叶是最常见的「多头螺纹」观感；8 叶密到快糊成一张蜂巢。**注意片数必须整除采样密度**（NRv = leaves × 20），否则相位会错位、叶片断裂——这就是为什么模板里把 NRv 写成 `leaves·20` 而不是固定值。三条各 2400 / 4000 / 6400 粒，共 12800 粒 31ms、占格 2017。改 turns 换螺旋上升的圈数（大于 1 叶片会绕轴卷回）。",
    tags: ['parameter', '表达式', '螺旋面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 2399 'u=t;NL=40;NRv=60;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);leaf=floor(ii/20.0);base=floorMod(ii,20.0);u0=base/19.0;ang=leaf*2.0*PI/3.0+u0*2.0*2.0*PI;vv=(ss-0.5)*2.4;x=vv*cos(ang);z=vv*sin(ang);y=(u0-0.5)*7.0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3999 'u=t;NL=40;NRv=100;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);leaf=floor(ii/20.0);base=floorMod(ii,20.0);u0=base/19.0;ang=leaf*2.0*PI/5.0+u0*2.0*2.0*PI;vv=(ss-0.5)*2.4;x=vv*cos(ang);z=vv*sin(ang);y=(u0-0.5)*7.0' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 6399 'u=t;NL=40;NRv=160;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);leaf=floor(ii/20.0);base=floorMod(ii,20.0);u0=base/19.0;ang=leaf*2.0*PI/8.0+u0*3.0*2.0*PI;vv=(ss-0.5)*2.4;x=vv*cos(ang);z=vv*sin(ang);y=(u0-0.5)*7.0' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'revsector',
    name: '旋转体切片三态（扫掠角 90/180/360）',
    desc: "**同一条轮廓曲线，转过的角度决定你看到的是一个「切片」还是完整的回转体**——轮廓取 rr = 3·sign(t)·|sin(πt)|^0.55（超椭圆截面，比圆更饱满、两端收得更陡），沿 y 轴从下到上走一遍，同时绕轴扫过 span 角度。**span 是唯一变化的量**：90° 只转四分之一圈，得到的是一片**有厚度的扇形瓣**（能看到轮廓的内侧）；180° 是半片壳、从侧面看像一个剖开的碗；360° 转满整圈，各个角度上完全闭合，成为**一个实心的胖陀螺/糖果形**——这时它跟普通的超椭球已经没有区别了。**这三条连起来看，就是「旋转体如何从曲线生成」的全过程**：轮廓是自变量、扫掠角是因变量、曲面是它们的像。**注意 y 项里那个 rr·0.4·sin(πt)** 是让轮廓的上下两端略微内收（不是纯圆柱），去掉它之后 360° 那条会变成一个正椭球，反而失去辨识度。三条各 3000 / 4500 / 7000 粒，共 14500 粒 35ms、占格 2749。改 e 换超椭圆的方正程度（e=1 是正圆），改 span 换切片角度。",
    tags: ['parameter', '表达式', '回转体'],
    cmds: [
      "/particleex parameter minecraft:end_rod -9 0 0 1 0.95 0.89 1 0 0 0 0 2999 'u=t;NL=60;NRv=50;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1);ph=ss*90*PI/180.0;yy=(tt-0.5)*7.0;ct=cos(tt*PI);st=sin(tt*PI);rr=3.0*signum(st)*pow(abs(st),0.55);x=rr*cos(ph);z=rr*sin(ph);y=yy+rr*0.4*sin(tt*PI)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 4499 'u=t;NL=90;NRv=50;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1);ph=ss*180*PI/180.0;yy=(tt-0.5)*7.0;ct=cos(tt*PI);st=sin(tt*PI);rr=3.0*signum(st)*pow(abs(st),0.55);x=rr*cos(ph);z=rr*sin(ph);y=yy+rr*0.4*sin(tt*PI)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 9 0 0 1 0.95 0.89 1 0 0 0 0 6999 'u=t;NL=140;NRv=50;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1);ph=ss*360*PI/180.0;yy=(tt-0.5)*7.0;ct=cos(tt*PI);st=sin(tt*PI);rr=3.0*signum(st)*pow(abs(st),0.55);x=rr*cos(ph);z=rr*sin(ph);y=yy+rr*0.4*sin(tt*PI)' 1 200 'null' 1 null",
    ],
  },
  {
    id: 'nodalnet',
    name: '球谐节线网络三态（经纬网格球壳）',
    desc: "**球谐函数 Y_lm 在球面上最本质的东西不是起伏，而是「哪里等于零」**——那些零值曲线把球面切成一块块符号交替的格子，叫**节线（nodal lines）**。角度部分可分离成 cos(lθ)·cos(mφ) 的形式：cos(lθ)=0 给出 l 条**纬向**节线（平行圈），cos(mφ)=0 给出 m 对**经向**节线（子午面），两组正交，织成球面经纬网。这条没有做径向调制（不像库里 `sphericalharmonics` 把 Y_l0 加成半径起伏），而是**用 conditional 直接筛选球壳上满足 |cos(lθ)·cos(mφ)| < 0.1 的点**：`abs(rr−3.6)<0.35` 先把采样限定在一层球壳上，第二个条件挑出节线附近，于是得到一张布满经纬网格的空心球壳。**l 与 m 是两个独立整数**：l 管南北方向切多少刀，m 管东西方向切多少刀，两者互不干涉——这就是球谐函数「分离变量」在视觉上的直接证据。三条 (l,m) = (3,2) / (4,4) / (5,3)：第一个南北三刀、东西四刀，格子的长短比明显；第二个横竖都是四刀，接近立方格；第三个南北五刀最密。**代价集中在条件求值上**：球壳范围内 60³ = 216000 次网格采样、每次算一次 acos 与两次 cos，实测 207ms；缩小范围到 3.0 或放大带宽到 0.15 都能降下来。三条共 35887 粒、占格 5216。改 bw 换网格粗细（0.05 是细线，0.2 是宽带），改 3.6 换球半径。",
    tags: ['conditional', '表达式', '球谐'],
    cmds: [
      "/particleex conditional minecraft:end_rod -8 0 0 1 0.95 0.89 1 0 0 0 3.6 3.6 3.6 'rr=sqrt(x*x+y*y+z*z);ct=y/rr;th=acos(ct);ph=atan2(z,x);a=cos(3.0*th);b=cos(2.0*ph);v=a*b;abs(rr-3.6)<0.35&abs(v)<0.1' 0.12 200 'null' 1 null",
      "/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.6 3.6 3.6 'rr=sqrt(x*x+y*y+z*z);ct=y/rr;th=acos(ct);ph=atan2(z,x);a=cos(4.0*th);b=cos(4.0*ph);v=a*b;abs(rr-3.6)<0.35&abs(v)<0.1' 0.12 200 'null' 1 null",
      "/particleex conditional minecraft:end_rod 8 0 0 1 0.95 0.89 1 0 0 0 3.6 3.6 3.6 'rr=sqrt(x*x+y*y+z*z);ct=y/rr;th=acos(ct);ph=atan2(z,x);a=cos(5.0*th);b=cos(3.0*ph);v=a*b;abs(rr-3.6)<0.35&abs(v)<0.1' 0.12 200 'null' 1 null",
    ],
  },
  {
    id: 'tubetrochoid',
    name: '管状内旋线三态（万花尺实体管）',
    desc: "**内旋线（hypotrochoid）是万花尺画出的花——但库里那条是「线」，这条把它做成了有体积的管**。曲线公式 cx=(R−r)cos t + d·cos((R−r)t/r)、cz=(R−r)sin t − d·sin((R−r)t/r)，R 是定圆半径、r 是滚动圆半径、d 是笔尖到滚动圆心的距离；三个数一改，花的瓣数、内凹深度全都跟着变。**加厚成管的关键在于截面方向**：不能简单用 (0,1,0) 做副法向（曲线在 xz 平面里，那样得到的管会是扁的），必须用切线的垂直方向 cos(tt), 0, sin(tt) 与竖直方向张成圆截面，管子才是圆的。**三条走的是「R/r 比」**：(4,1) 是 4 瓣的星形内旋线，(5,2) 是 5 瓣带内凹的重瓣，(6,5) 两圆几乎等大、d 又大，曲线被压成几乎没有自交的大圆——**分母 r 越大、比值越接近 1，花瓣越少越圆**，这是参数化最直观的一条规律。三条各 2520 / 2520 / 3080 粒，共 8120 粒 26ms、占格 1544。改 d 换花瓣的尖钝（d 越大越尖），改 tubeR 换管粗细（0.8 以上相邻瓣会粘连）。",
    tags: ['parameter', '表达式', '管状曲面'],
    cmds: [
      "/particleex parameter minecraft:end_rod -8 0 0 1 0.95 0.89 1 0 0 0 0 2519 'u=t;NL=14;NRv=180;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1)*2.0*PI;kk=(4-1)/1;w1=4-1;cx=w1*cos(tt)+1.6*cos(kk*tt);cz=w1*sin(tt)-1.6*sin(kk*tt);sg=ss*2.0*PI;x=cx+0.35*cos(sg)*cos(tt);y=0.0+0.35*sin(sg);z=cz+0.35*cos(sg)*sin(tt)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 2519 'u=t;NL=14;NRv=180;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1)*2.0*PI;kk=(5-2)/2;w1=5-2;cx=w1*cos(tt)+2.2*cos(kk*tt);cz=w1*sin(tt)-2.2*sin(kk*tt);sg=ss*2.0*PI;x=cx+0.4*cos(sg)*cos(tt);y=0.0+0.4*sin(sg);z=cz+0.4*cos(sg)*sin(tt)' 1 200 'null' 1 null",
      "/particleex parameter minecraft:end_rod 8 0 0 1 0.95 0.89 1 0 0 0 0 3079 'u=t;NL=14;NRv=220;ii=floor(u/NL);ss=floorMod(u,NL)/(NL-1);tt=ii/(NRv-1)*2.0*PI;kk=(6-5)/5;w1=6-5;cx=w1*cos(tt)+2.5*cos(kk*tt);cz=w1*sin(tt)-2.5*sin(kk*tt);sg=ss*2.0*PI;x=cx+0.45*cos(sg)*cos(tt);y=0.0+0.45*sin(sg);z=cz+0.45*cos(sg)*sin(tt)' 1 200 'null' 1 null",
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

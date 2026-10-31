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
];

/** 按 id 查模板（分享链接/测试用） */
export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** 模板命令文本（多行用 \n 连接），即「复制」按钮写进剪贴板的内容 */
export function templateText(t: Template): string {
  return t.cmds.join('\n');
}

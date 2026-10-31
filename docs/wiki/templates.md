# 07 · 预览模板库（权威清单）

> 预览工具内置「📚 模板库」的权威清单（侧栏 📚 按钮 → 模板画廊，支持
> 复制命令 / 载入预览 / 一键直达 `https://yuer159.github.io/ColorblockViewer/?t=<id>`）。
> 本页与代码 [src/templates/library.ts](../../src/templates/library.ts) **逐字对齐**
> （命令文本、标签、说明），代码侧是执行来源，本页是文档来源；代码模板变更时本页同步。
> 模板的详细效果解读见 [05-examples](examples.md)。

## 硬性约定（每条模板都过四道闸，测试守护）

1. **可被预览解析器结构化**（parseCommands 成功）；
2. **通过游戏内格式检查**（checkCommandsFormat）——表达式一律带单引号，
   复制出去就是 brigadier 合法格式，可直接粘进游戏；
3. **预览引擎实跑零错误、spawned > 0**——不会出现「看着有模板、一点就报错」；
4. **粒子真的散开**（空间跨度 > 0.5 格）且**表达式写的字段与命令族读取的
   字段匹配**——只查「有粒子生成」抓不到静默失效：polar 族
   （polarparameter 等）的位置表达式**只读 `s1`/`s2`/`dis`**，写 `x`/`y`/`z`
   会被完全忽略，粒子全堆在原点却仍能通过前三道闸（2026-10-29 体检时
   hypotrochoid / superformula / breathing 三条即因此中招）。

> 命令要点：`vel` 非零命令速度是刻意的——模组零速命令会触发 stop 回滚，
> 粒子被钉住不动；多行模板 = 多条命令一起载入。
>
> **命令族怎么选**：平面/直角坐标曲线用 `parameter` / `rgbaparameter`
> （写 `x`/`y`/`z`）；极坐标曲线用 polar 族（写 `s1=t;s2=0;dis=r(t)`）。
> 混写两套字段是错误，探索脚本 `scripts/curve-lab.ts` 会自动判定并拒绝。

## 已收录模板（当前 57 条）

### ripple · 涟漪波面（conditional 表达式）

- **标签**：`conditional` `表达式` `end_rod`
- **说明**：用条件表达式筛出「水面波形」的网格点，再让每个粒子沿法向做波动
  ——用户实战范例，随 t 向外扩散。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod ~ ~ ~ 1 0.95 0.89 1 0 0 0 8 0.6 8 '(abs(y-0.5*exp(0-(x^2+z^2)/3.24)*cos(5.236*sqrt(x^2+z^2)))<0.05)&(sqrt(x^2+z^2)<8)' 0.1 200 'vy=0.5*exp(0-(sqrt(dx^2+dz^2)-0.06*t-0.03)*(sqrt(dx^2+dz^2)-0.06*t-0.03)/3.24)*(0.3142*sin(5.236*(sqrt(dx^2+dz^2)-0.06*t-0.03))+0.03704*(sqrt(dx^2+dz^2)-0.06*t-0.03)*cos(5.236*(sqrt(dx^2+dz^2)-0.06*t-0.03)))' 1 null
```

### ring · 圆周环（polarparameter 环形速度）

- **标签**：`polarparameter` `表达式` `end_rod`
- **说明**：极坐标参数命令摆出一个圆环，切向速度表达式随 t 指数衰减 →
  粒子绕圈流动渐趋静止。
- **命令**（复制即用）：

```
/particleex polarparameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 6.2832 'dis=0.05;s1=t;s2=0' 0.0628 20 '(vx,vy,vz)=(0.25*exp(0-(t+0.5)/8)*cos(s1),0,0.25*exp(0-(t+0.5)/8)*sin(s1))' 1 null
```

### chladni · 克拉德尼节线纹（conditional 模态筛点）

- **标签**：`conditional` `表达式` `end_rod`
- **说明**：方形板驻波模态 cos(nπx/L)cos(mπz/L)+cos(mπx/L)cos(nπz/L) 的零值
  等值线筛点——金属板撒沙振动后的花纹，静态零时间项（n=2, m=3, L=10，
  阈值 0.07 实测命中约 6000 粒）。范围 `8 0 8` = **x-z 平面**（dx dy dz
  顺序；写 `8 8 0` 会让 z 恒为 0，图案退化成一维）。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod ~ ~ ~ 1 0.95 0.89 1 0 0 0 8 0 8 'abs(cos(0.6283185307179587*x)*cos(0.9424777960769379*z)+cos(0.9424777960769379*x)*cos(0.6283185307179587*z))<0.07' 0.05 200 null 1 null
```

### hypotrochoid · 万花尺繁花（hypotrochoid 内旋线）

- **标签**：`parameter` `表达式` `end_rod`
- **说明**：小圆在定圆内滚动：x=(R−r)cos(t)+d·cos((R−r)t/r)，
  z=(R−r)sin(t)−d·sin((R−r)t/r)——R=5 r=3 d=5，**闭合条件是
  t 上界 = 2π·q**（q 为 k=(R−r)/r 的最简分母；此处 k=2/3 → q=3 →
  t∈[0,6π]），三旋钮（R, r, d）调出万花筒图案。
  平面曲线用 `parameter` 族——**polar 族只读 s1/s2/dis，写 x/z 会被忽略**。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 18.84955592153876 'x=2*cos(t)+5*cos(2*t/3);z=2*sin(t)-5*sin(2*t/3);y=0' 0.03 200 'null' 1 null
```

### superformula · 超级公式五瓣花（Gielis 极坐标轮廓）

- **标签**：`rgbapolarparameter` `表达式` `end_rod`
- **说明**：r=[|cos(mφ/4)|^n+|sin(mφ/4)|^n]^(−1/n1) 的五瓣星花（m=5, n=1.7）
  ——一条公式从圆到多边形到花瓣的形态变换器。polar 族写法：
  `s1` 取极角 t、`s2=0` 落在水平面、`dis` 即 r(s1)；随 s1 转色相
  （cr/cg/cb 相位差 2π/3）。
- **命令**（复制即用）：

```
/particleex rgbapolarparameter minecraft:end_rod ~ ~2 ~ 0 0 0 0 18.84955592153876 's1=t;s2=0;dis=(abs(cos(5*s1/4))^1.7+abs(sin(5*s1/4))^1.7)^(-0.5882352941176471)*1.8;cr=0.5+0.5*cos(s1);cg=0.5+0.5*cos(s1+2.0943951023931953);cb=0.5+0.5*cos(s1+4.1887902047863905);alpha=1' 0.03 200 'null' 1 null
```

### breathing · 呼吸圆环（社区最高频·正弦径向速度）

- **标签**：`polarparameter` `表达式` `vel`
- **说明**：polar 族写法——s1=t 扫极角、s2=0 水平面、dis=2 定半径，摆出
  半径 2 的圆环（12 粒，step 0.3），每帧速度 = 当前位置 × i，
  i=0.1·sin(t/5)——乘性递推使构型整体胀缩（周期 2π×5≈31 tick）；
  r=2 环 200 tick（寿命）实测半径 0.62→2.62 呼吸 6 个周期。B 站社区
  最高频用法，改 0.1（幅度）/5（周期倒数）调观感。`vel` 标签提示：
  速度表达式自带非零初速意义，但命令速度槽仍须非 0（零速触发模组
  stop 回滚钉住粒子）。
- **命令**（复制即用）：

```
/particleex polarparameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 6.2832 's1=t;s2=0;dis=2' 0.3 200 'i=0.1*sin(t/5);(vx,vy,vz)=(x*i,y*i,z*i)' 1 null
```

### fireworkball · 烟花球（球面枚举 144 粒一次炸开）

- **标签**：`tickpolarparameter` `表达式` `vel`
- **说明**：一维 t 锯齿扫球面（DynFirework 球面枚举模型的引擎落法）：
  `s2=0.35*floorMod(floor(t/16),9)-1.4`（9 层仰角，floorMod double 版
  引擎有注册、communityMath 批次已锁语义）× `s1=0.4*t`（每层 16 点，
  跨度 6.4 rad 覆盖一圈；s1 不取模，cos/sin 周期性自动回绕且各层相位
  错开更自然）。粒子生成在球心（dis=0.01 防 0），速度沿径向 0.3
  （x/dis 即单位方向向量）——end_rod 原版摩擦 0.96 自然减速，扩散渐近
  ≈v0/(1−f)=7.5 格后受重力下垂，即烟花球形。`cpt=144` 一次 tick 全出
  （曾写 143 少一粒——cpt 是每 tick 条数上限，end=143 时须 144）。
- **命令**（复制即用）：

```
/particleex tickpolarparameter minecraft:end_rod ~ ~8 ~ 1 0.95 0.89 1 0 0 0 0 143 's2=0.35*floorMod(floor(t/16),9)-1.4;s1=0.4*t;dis=0.01' 1 144 200 '(vx,vy,vz)=(x/dis*0.3,y/dis*0.3,z/dis*0.3)' 1 null
```

### nebula · 星云（球内随机分布 + 密度衰减 + 颜色渐变）

- **标签**：`rgbatickpolarparameter` `表达式` `vel`
- **说明**：DynFirework nebula 型的引擎落法——每 tick 5 粒随机撒在半径 4
  球内，持续 200 tick 共 1000 粒。三个 random() 各司其职：s1=6.2832·u₁
  （方位全向）、s2=3.14159·u₂−π/2（仰角全向）、dis=4·u₃²（**密度衰减**：
  dis∝u² → 内壳 45%/外壳 11%，中心浓外缘稀，星云感）。颜色随半径蓝白→
  深紫（cr/cg 随 dis/4 递减、cb 恒 1），各粒带 ±0.005 格/tick 微随机漂移
  （vx/vy/vz 也在主表达式赋值——rgba 系速度取 data）。
- ⚠️ **引擎语义注记**：random() 是 0 参函数，CBV 曾漏 0 参特判致预览器
  误报 function not found（游戏内一直可用）——已修并有回归测试
  （randomZeroArg）。另 random() 值域 [0,1)，**不要裸作整条表达式的顶层
  返回值**（顶层 int 收口会截成恒 0）；一律用局部变量/字段承载（本模板
  即此形态）。
- **命令**（复制即用）：

```
/particleex rgbatickpolarparameter minecraft:end_rod ~ ~5 ~ 0 0 0 0 200 's1=6.2832*random();s2=3.14159*random()-1.5708;dis=4*pow(random(),2);cr=0.6+0.4*(1-dis/4);cg=0.5+0.3*(1-dis/4);cb=1;alpha=1;vx=0.01*random()-0.005;vy=0.01*random()-0.005;vz=0.01*random()-0.005' 1 5 200 'null' 1 null
```

### butterfly · 蝴蝶曲线（Fay 1989，极坐标精细结构）

- **标签**：`polarparameter` `表达式` `end_rod`
- **说明**：r = e^sinθ − 2cos4θ + sin⁵((2θ−π)/24)，θ∈[0, 24π] —— Temple Fay
  1989 年的经典蝴蝶曲线。第三项 sin⁵((2θ−π)/24) 是翅膀倾斜修正；少了它
  两翼不对齐。**24π 的扫描范围是曲线闭合的必要条件**，缩到 2π 只能得到
  一个小瓣。实测总转角 359 rad（是普通曲线的 10–20 倍），结构极精细。
- **命令**（复制即用）：

```
/particleex polarparameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 75.39822368615504 's1=t;s2=0;dis=exp(sin(t))-2*cos(4*t)+pow(sin((2*t-PI)/24),5)' 0.02 200 'null' 1 null
```

### spherespiral · 球面螺旋（等角缠绕，一维 t 扫两个角）

- **标签**：`polarparameter` `表达式` `end_rod`
- **说明**：`s1=t` 转方位、`s2=0.05*t` 稳步抬仰角、`dis=4` 定半径——**一条
  参数同时扫两个角**，得到球面上等角间距的螺旋。s2 上限 1.25 rad
  （8π×0.05）停在北半球；要绕满全球把 0.05 调小（如 0.0125 走完 π）。
  单选 30ns/次，是库里最省的 3D 模板。
- **命令**（复制即用）：

```
/particleex polarparameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 25.132741228718345 's1=t;s2=0.05*t;dis=4' 0.03 200 'null' 1 null
```

### torusknot · 环面结 (5,2)（3D 拓扑曲线）

- **标签**：`parameter` `表达式` `end_rod`
- **说明**：`x=(R+r·cos qt)cos pt`、`z=(R+r·cos qt)sin pt`、`y=r·sin qt`——
  **p=5 绕主轴、q=2 绕管**，(p,q) 互质才能得到不打结的单一闭合曲线；
  改这组数就换一种结法（(3,2) 是三叶结、(3,4) 更密）。y 项让它离开水平面，
  是库里第一条真正意义上的 3D 曲线（此前 8 条全在 y 为常数的平面内）。
  注意 cos 要算两次，求值 179ns，偏贵但可接受（只用在生成路径）。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 6.283185307179586 'x=(2+0.8*cos(2*t))*cos(5*t);z=(2+0.8*cos(2*t))*sin(5*t);y=0.8*sin(2*t)' 0.02 200 'null' 1 null
```

### thomas · Thomas 环（混沌吸引子 · 速度场积分）

- **标签**：`normal` `表达式` `vel`
- **说明**：`vx=sin(y)−bx`、`vy=sin(z)−by`、`vz=sin(x)−bz`（b=0.208186）——
  **速度场每 tick 积分一次**，粒子被吸引到环面状吸引子并在其上混沌游走。
  这跟其他模板的「位置 = f(t)」完全不同：轨道不是写出来的，是微分方程解出来的。
- **为什么是 Thomas 而不是洛伦兹**：引擎用显式欧拉积分（每 tick 一步），
  20 TPS 对大多数吸引子来说步长太大。实测六种经典系统：
  **只有 Thomas 环不数值发散**——因为它的 `sin()` 项天然有界。洛伦兹
  （k=0.005 仍甩飞到 y=−25..30）、Aizawa（116/300 粒子 NaN）、Halvorsen
  （217/300 NaN）、Sprott-B（6 NaN 且飞到 1e270）全部爆掉；罗斯勒勉强稳定
  但 z 轴几乎不动（0..0.3），立体感差。
- **范围 0.6 是关键**：所有粒子从同一点出发会沿**同一条**轨迹完全重合
  （实测两两距 0.000）。范围给高斯标准差让出生点散开，粒子才能铺满吸引子。
  演化过程：t=60 挤在几处（占格 38/400）→ t=300 铺满（123/400）。
- **性能**：6 个 sin + 12 次乘法 = 235ns/次，但每粒子每 tick 只算一次。
  实测 1000 粒子 0.29 ms/tick、10000 粒子 3.07 ms/tick，远在 16ms 门槛内。
- **命令**（复制即用）：

```
/particleex normal minecraft:end_rod 0 1 0 1 0.95 0.89 1 0 0 0 0.6 0.6 0.6 1000 900 'u=0.15*sin(y)-0.0312279*x;v=0.15*sin(z)-0.0312279*y;w=0.15*sin(x)-0.0312279*z;(vx,vy,vz)=(u*0.45,v*0.45,w*0.45)' 1 null
```

### torus · 环面（一维 t 拆双参数）

- **标签**：`parameter` `表达式` `end_rod`
- **说明**：`x=(R+r·cos v)cos u`、`z=(R+r·cos v)sin u`、`y=r·sin v` —— 经典
  甜甜圈。引擎只有一维 `t`，这里用**两个互质频率造双参数**：`u=t` 快速转
  一圈、`v=0.058824·t` 慢慢抬（≈1/17，非整数比才能遍历整张面）。
  把 0.058824 改成 1/7 会看到明显的螺旋条纹而不是均匀铺面——**频率比
  必须是无理数或大分母有理数**，否则 `(u,v)` 只走有限的几条线。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 251.32741228718345 'u=t;v=t*0.058824;x=(2+0.8*cos(v))*cos(u);z=(2+0.8*cos(v))*sin(u);y=0.8*sin(v)' 0.12 200 'null' 1 null
```

### mobius · Möbius 带（单侧曲面）

- **标签**：`parameter` `表达式` `end_rod`
- **说明**：`x=(2+v·cos(u/2))cos u`、`z=(2+v·cos(u/2))sin u`、`y=v·sin(u/2)`
  —— 半扭转的纸带，只有一个面。**`u/2` 是拓扑关键**：扭转率取一半，走完
  一圈（u=2π）只转 180°，带子首尾相接时正好翻面。v 用 sin 限幅（±1.5）
  保持带宽不随 t 无限增长——直接写 `v=t*0.02` 会变成越绕越宽的螺旋。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod ~ ~2 ~ 1 0.95 0.89 1 0 0 0 0 314.1592653589793 'u=t;v=1.5*sin(t*0.043478);x=(2+v*cos(u/2))*cos(u);z=(2+v*cos(u/2))*sin(u);y=v*sin(u/2)' 0.1 200 'null' 1 null
```

### gyroid · Gyroid 极小曲面（隐式等值面）

- **标签**：`conditional` `表达式` `vel`
- **说明**：`sin x·cos y + sin y·cos z + sin z·cos x ≈ 0` 的三周期极小曲面
  ——肥皂膜在周期性边界下的自然形状，化学里做模板材料的结构。用
  `conditional` 在 6×6×6 立方里筛等值面（带宽 0.15），命中率约 10%。
  **这是库里最重的一条**：空扫 30 万候选点、生成近 8 千粒，命令解析约
  67ms。想轻量就把范围从 6 缩到 4 或把带宽 0.15 收紧到 0.08。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 3 0 1 0.95 0.89 1 0 0 0 6 6 6 'abs(sin(x)*cos(y)+sin(y)*cos(z)+sin(z)*cos(x))<0.15' 0.28 200 null 1 null
```

### mandelbrot · 曼德博集合（20 次迭代展开）

- **标签**：`conditional` `表达式` `分形`
- **说明**：z←z²+c 迭代 20 次不逃逸（|z|²<4）的点构成——分形几何的图腾。
  **引擎没有循环，迭代靠顺序赋值展开**：每次迭代结果写进新变量
  （zr1/zi1 → zr2/zi2…），长度线性增长且**括号深度只有 1**。
  ⚠️ 不能用符号展开（把 zr1 的式子内联进 zr2）——那会指数膨胀，
  实测 n=12 就卡死解析器。改迭代次数只需增减一对 zrN/ziN。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod -1 0 0 1 0.95 0.89 1 0 0 0 1.5 1.5 0 'zr0=0;zi0=0;zr1=zr0*zr0-zi0*zi0+x;zi1=2*zr0*zi0+y;zr2=zr1*zr1-zi1*zi1+x;zi2=2*zr1*zi1+y;zr3=zr2*zr2-zi2*zi2+x;zi3=2*zr2*zi2+y;zr4=zr3*zr3-zi3*zi3+x;zi4=2*zr3*zi3+y;zr5=zr4*zr4-zi4*zi4+x;zi5=2*zr4*zi4+y;zr6=zr5*zr5-zi5*zi5+x;zi6=2*zr5*zi5+y;zr7=zr6*zr6-zi6*zi6+x;zi7=2*zr6*zi6+y;zr8=zr7*zr7-zi7*zi7+x;zi8=2*zr7*zi7+y;zr9=zr8*zr8-zi8*zi8+x;zi9=2*zr8*zi8+y;zr10=zr9*zr9-zi9*zi9+x;zi10=2*zr9*zi9+y;zr11=zr10*zr10-zi10*zi10+x;zi11=2*zr10*zi10+y;zr12=zr11*zr11-zi11*zi11+x;zi12=2*zr11*zi11+y;zr13=zr12*zr12-zi12*zi12+x;zi13=2*zr12*zi12+y;zr14=zr13*zr13-zi13*zi13+x;zi14=2*zr13*zi13+y;zr15=zr14*zr14-zi14*zi14+x;zi15=2*zr14*zi14+y;zr16=zr15*zr15-zi15*zi15+x;zi16=2*zr15*zi15+y;zr17=zr16*zr16-zi16*zi16+x;zi17=2*zr16*zi16+y;zr18=zr17*zr17-zi17*zi17+x;zi18=2*zr17*zi17+y;zr19=zr18*zr18-zi18*zi18+x;zi19=2*zr18*zi18+y;zr20=zr19*zr19-zi19*zi19+x;zi20=2*zr19*zi19+y;abs(zr20*zr20+zi20*zi20)<4' 0.035 200 null 1 null
```

### julia · Julia 集 c=−0.8+0.156i（16 次迭代）

- **标签**：`conditional` `表达式` `分形`
- **说明**：同样 z←z²+c 迭代，但 c 固定、初值取采样点 (x,y)——得到 Julia 集
  而非曼德博集。**换 c 就换一朵花**：−0.8+0.156i 是经典「兔耳」形，
  0.285+0.01i 接近圆形，−0.4+0.6i 是细长旋臂。表达式里的
  `(0-0.8)` 是负常数的写法——`+-0.8` 虽然引擎接受但可读性差。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 1.5 1.5 0 'zr0=x;zi0=y;zr1=zr0*zr0-zi0*zi0+(0-0.8);zi1=2*zr0*zi0+0.156;zr2=zr1*zr1-zi1*zi1+(0-0.8);zi2=2*zr1*zi1+0.156;zr3=zr2*zr2-zi2*zi2+(0-0.8);zi3=2*zr2*zi2+0.156;zr4=zr3*zr3-zi3*zi3+(0-0.8);zi4=2*zr3*zi3+0.156;zr5=zr4*zr4-zi4*zi4+(0-0.8);zi5=2*zr4*zi4+0.156;zr6=zr5*zr5-zi5*zi5+(0-0.8);zi6=2*zr5*zi5+0.156;zr7=zr6*zr6-zi6*zi6+(0-0.8);zi7=2*zr6*zi6+0.156;zr8=zr7*zr7-zi7*zi7+(0-0.8);zi8=2*zr7*zi7+0.156;zr9=zr8*zr8-zi8*zi8+(0-0.8);zi9=2*zr8*zi8+0.156;zr10=zr9*zr9-zi9*zi9+(0-0.8);zi10=2*zr9*zi9+0.156;zr11=zr10*zr10-zi10*zi10+(0-0.8);zi11=2*zr10*zi10+0.156;zr12=zr11*zr11-zi11*zi11+(0-0.8);zi12=2*zr11*zi11+0.156;zr13=zr12*zr12-zi12*zi12+(0-0.8);zi13=2*zr12*zi12+0.156;zr14=zr13*zr13-zi13*zi13+(0-0.8);zi14=2*zr13*zi13+0.156;zr15=zr14*zr14-zi14*zi14+(0-0.8);zi15=2*zr14*zi14+0.156;zr16=zr15*zr15-zi15*zi15+(0-0.8);zi16=2*zr15*zi15+0.156;abs(zr16*zr16+zi16*zi16)<4' 0.035 200 null 1 null
```

### quasicrystal · 五重准晶（Dekking 构造）

- **标签**：`conditional` `表达式` `准晶`
- **说明**：五个方向的余弦波叠加取等值线——每对方向夹角 72°，叠加出的花纹有
  **五重旋转对称**，普通晶体（只能 2/3/4/6 重）做不到，准晶因此到 1982 年
  才被承认（2011 年诺贝尔化学奖）。改五条 cos 的角度常数可换 7 重、8 重。
  **只有 87 字符，却比 880 字符的分形还密**（1616 粒 vs 1416 粒）。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 5 5 0 'abs(cos(x)+cos(0.309*x+0.951*z)+cos(-x)+cos(-0.309*x-0.951*z)+cos(0.809*x+0.588*z))<0.6' 0.1 200 null 1 null
```

### hyperbolic · 双曲镶嵌（庞加莱圆盘的环族）

- **标签**：`conditional` `表达式` `非欧几何`
- **说明**：`sin(log(1−0.95·dis)·5)≈0` 的等值环——环间距按**对数**增长，
  正是庞加莱圆盘上双曲距离 `r=2·atanh(|z|)` 的等距环。欧氏距离上
  越靠边越密、越靠中心越疏，这个「越边越挤」就是双曲几何的视觉特征。
- ⚠️ **扫描范围必须是 `3 0 3`（x-z 平面）**：写成 `3 3 0` 时 y 恒为 0，
  `s1=atan2(z,x)` 仍正常但 `s2` 恒 0，凡是靠 s2 或 y 的判据全失效。
  本轮排障时误以为 `abs()`/比较符有 bug，实际是范围写错了。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 0 3 'abs(sin(log(1-dis*0.95)*5))<0.5 & dis<0.93' 0.015 200 null 1 null
```

### chirikov · Chirikov 标准映射（KAM 岛与混沌海）

- **标签**：`conditional` `表达式` `动力系统`
- **说明**：`sin(3πx+z)−0.5sin(z)≈0` 的等值线——Chirikov 标准映射
  `p′ = p+(K/2π)sin(2πθ)`、`θ′ = θ+p′` 的相空间结构。这是动力系统里最经典的
  **有序与混沌共存**模型：岛状区域（KAM 环）轨道规则，海里的轨道混沌。
  系数 3 对应扰动强度 K=3，已越过 KAM 环破裂阈值。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 0 'abs(sin(3*x*3.14159+z)-sin(z)*0.5)<0.15' 0.03 200 null 1 null
```

### tubeknot · 管状纽结（绕轴扭动的实体管）

- **标签**：`parameter` `表达式` `end_rod`
- **说明**：在环面结路径上加一个绕轴旋转角 `v+3t`——中心线走 (3,2) 结，
  每个点上再画半径 0.5 的管截面。与 torusknot 的区别：那条是**线**，
  这条是**有粗细的管**。`v+3t` 的相位让管身沿路径扭转（扭转率 3，
  改这个数看缠绕疏密）。`y=2sin(3t)` 让整条结离开水平面成为真 3D。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 37.69911184307752 'u=t;v=6.2832*sin(t*0.05);x=(2+0.5*cos(v+3*t))*cos(2*t);z=(2+0.5*cos(v+3*t))*sin(2*t);y=2*sin(3*t)+0.5*sin(v+3*t)' 0.06 200 'null' 1 null
```

### klein · Klein 瓶（8 字形嵌入 R³）

- **标签**：`parameter` `表达式` `end_rod`
- **说明**：`r=3+cos(u/2)sin v−sin(u/2)sin 2v` 的「8 字形」嵌入——Klein 瓶是
  不可定向闭曲面（没有内外之分），在三维空间里只能自交，这个经典参数化
  让瓶颈穿过瓶身。**`cos(u/2)`/`sin(u/2)` 用的是半角**：走完一圈 u=2π
  时半角只转 π，正是这个半扭转让两端能「反向」接上。
  占格 862，是本库覆盖面最广的参数曲面之一。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 502.6548245743669 'u=t;v=6.2832*sin(t*0.02);c=cos(u*0.5);s=sin(u*0.5);r=3+c*sin(v)-s*sin(2*v);x=r*cos(u);z=r*sin(u);y=s*sin(v)+c*sin(2*v)' 0.06 200 'null' 1 null
```

### dipole · 磁偶极场线（r=r₀sin²θ 族）

- **标签**：`parameter` `表达式` `end_rod`
- **说明**：`r=3sin²θ`、绕 y 轴旋转——这是理想偶极子磁场线的极坐标方程
  （地球辐射带、太阳磁场、条形磁铁的铁屑图案都是这个形状）。θ 用
  `abs(sin)` 在 0.35..1.55 之间来回扫，`ph=t` 让每条线绕轴转一圈，
  于是同一族场线被涂成一整个回转面。改 3 是磁矩强度，改 0.35 是最近点
  距离（太接近原点会钻进「磁铁」内部）。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 188.4955592153876 'th=0.35+1.2*abs(sin(t*0.0159));r=3*sin(th)*sin(th);ph=t;x=r*sin(th)*cos(ph);z=r*sin(th)*sin(ph);y=r*cos(th)' 0.05 200 'null' 1 null
```

### interference · 双源干涉（3D 驻波干涉面）

- **标签**：`conditional` `表达式` `干涉`
- **说明**：两点源球面波之差 `|cos(r₁−r₂)|>0.9` 的等值面——两波同相加强处
  结成双曲面族，正是杨氏双缝的 3D 推广。`r₁`/`r₂` 用
  `sqrt((x∓2)²+y²+z²)` 手写（`hypot` 只有 2 参重载，3 参在模组里报
  function not found），在 4³ 立方里筛。2843 粒、命令耗时 6ms、
  **占格 318/576 是本库覆盖率最高的 3D 体模板**（峰均比 3.2，分布也最均匀）。
  把阈值 0.9 调低面会变厚成「云」，调高则只剩细丝。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4 4 4 'r1=sqrt((x-2)*(x-2)+y*y+z*z);r2=sqrt((x+2)*(x+2)+y*y+z*z);abs(cos(r1-r2))>0.9' 0.4 200 null 1 null
```

### threesource · 三源干涉（120° 三角阵）

- **标签**：`conditional` `表达式` `干涉`
- **说明**：三个点源两两干涉：`|cos(r₁−r₂)+cos(r₂−r₃)|>1.4` —— 比双源多
  一层拍频，交叠处出现三重对称的花瓣状腔体。三源摆在 (±2,0,0) 与
  (0,2,0) 构成正三角形，对称性最完整。4391 粒、24ms，是库里条件扫描最重的
  一条（每次采样要算三次 sqrt）。两项余弦可以互换正负号
  （`cos(r₁−r₂)−cos(r₂−r₃)`）得到另一种破缺方向的花纹。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4 4 4 'r1=sqrt((x-2)*(x-2)+y*y+z*z);r2=sqrt((x+2)*(x+2)+y*y+z*z);r3=sqrt(x*x+(y-2)*(y-2)+z*z);abs(cos(r1-r2)+cos(r2-r3))>1.4' 0.3 200 null 1 null
```

### schwarzp · Schwarz P 极小曲面（原始型）

- **标签**：`conditional` `表达式` `极小曲面`
- **说明**：`cos x + cos y + cos z ≈ 0` —— 三大极小曲面里最简单的「原始型」
  （P = Primitive）。用 conditional 在一整个周期（范围 3.14159 = cos 的半周期，
  跨度为 2π）里筛等值面，带宽 0.3、步长 0.3 → 1652 粒 / 11ms。与 gyroid
  同属三周期极小曲面（TPMS），但 **P 面没有手性**（上下两半互为镜像），
  gyroid 有手性——这正是化学里拿 gyroid 做模板材料而不用 P 面的原因。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.14159 3.14159 3.14159 'abs(cos(x)+cos(y)+cos(z))<0.3' 0.3 200 null 1 null
```

### schwarzd · Schwarz D 极小曲面（钻石型）

- **标签**：`conditional` `表达式` `极小曲面`
- **说明**：`sin x·sin y·sin z + sin x·cos y·cos z + cos x·sin y·cos z + cos x·cos y·sin z ≈ 0`
  —— 「钻石型」（D = Diamond），四项相乘再相加，是全库算式最长的一条曲面条件。
  比 P 面多一层交叉项，孔隙沿体对角线排列成钻石骨架。1546 粒 / 22ms
  （每采样点 8 次三角 + 3 次乘），比 P 面贵一倍。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.14159 3.14159 3.14159 'abs(sin(x)*sin(y)*sin(z)+sin(x)*cos(y)*cos(z)+cos(x)*sin(y)*cos(z)+cos(x)*cos(y)*sin(z))<0.2' 0.3 200 null 1 null
```

### neovius · Neovius 极小曲面（多孔骨架）

- **标签**：`conditional` `表达式` `极小曲面`
- **说明**：`3(cos x+cos y+cos z) + 4 cos x·cos y·cos z ≈ 0` —— 在 Schwarz P
  基础上加一个三次交叉项，把 P 面的连续孔道打断成互不相连的空腔，外观更像
  海绵骨架而非膜。1695 粒 / 13ms，只比 P 面多一次乘法。调孔道连通性就改
  两个系数的比值：4/3 是 Neovius 原式，把 4 调小会逐渐退回 Schwarz P。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3.14159 3.14159 3.14159 'abs(3*(cos(x)+cos(y)+cos(z))+4*cos(x)*cos(y)*cos(z))<0.4' 0.3 200 null 1 null
```

### fouriersquare · 傅里叶方波（五阶逐层逼近）

- **标签**：`parameter` `表达式` `傅里叶`
- **说明**：五条曲线自下而上叠放，每条比下面多一项奇次谐波：
  `sin t` → `+sin3t/3` → `+sin5t/5` → `+sin7t/7` → `+sin9t/9`，系数 4/π 归一化。
  少项时圆滑的正弦两侧长出平台，到第九阶已很像方波，但边角仍有约 9% 的
  过冲——这就是**吉布斯现象**：有限项叠加消不掉，只会把振荡挤进更窄的范围。
  y 偏移走「位置参数」而不是表达式（每条命令自己的出生高度），是做多子图
  对照最省的做法。
- **命令**（复制即用，五条一起载入）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*sin(t);z=0' 0.02 200 'null' 1 null
/particleex parameter minecraft:end_rod 0 1.2 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*(sin(t)+sin(3*t)/3);z=0' 0.02 200 'null' 1 null
/particleex parameter minecraft:end_rod 0 2.4 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*(sin(t)+sin(3*t)/3+sin(5*t)/5);z=0' 0.02 200 'null' 1 null
/particleex parameter minecraft:end_rod 0 3.6 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*(sin(t)+sin(3*t)/3+sin(5*t)/5+sin(7*t)/7);z=0' 0.02 200 'null' 1 null
/particleex parameter minecraft:end_rod 0 4.8 0 1 0.95 0.89 1 0 0 0 0 12.566370614359172 'x=t;y=1.27324*(sin(t)+sin(3*t)/3+sin(5*t)/5+sin(7*t)/7+sin(9*t)/9);z=0' 0.01 200 'null' 1 null
```

### superellipsoid · 超椭球（指数 n 的形态谱）

- **标签**：`conditional` `表达式` `形态谱`
- **说明**：八条命令并排，n 取 0.5 / 0.7 / 1 / 1.5 / 2 / 3 / 6 / 10 —— 方程
  `|x/a|ⁿ+|y/a|ⁿ+|z/a|ⁿ=1` 只换一个指数，形状就从八角星（n<1，凹面）
  经球（n=2）连续过渡到圆角立方、再到近立方（n→∞）。这是最适合讲
  「参数即形状」的例子：**立方和球在超椭球族里只差一个数**。
  共 7255 粒 / 84ms。注意 `|x|ⁿ` 的幂运算对负数是 NaN，必须先 `abs`
  （引擎语义同 JDK `Math.pow`），所以写法是 `abs(x/3)^n` 而不是 `(x/3)^n`。
- **命令**（复制即用，八条一起载入）：

```
/particleex conditional minecraft:end_rod -28 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^0.5+abs(y/3)^0.5+abs(z/3)^0.5-1)<0.12' 0.25 200 null 1 null
/particleex conditional minecraft:end_rod -20 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^0.7+abs(y/3)^0.7+abs(z/3)^0.7-1)<0.12' 0.22 200 null 1 null
/particleex conditional minecraft:end_rod -12 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)+abs(y/3)+abs(z/3)-1)<0.12' 0.3 200 null 1 null
/particleex conditional minecraft:end_rod -4 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^1.5+abs(y/3)^1.5+abs(z/3)^1.5-1)<0.12' 0.4 200 null 1 null
/particleex conditional minecraft:end_rod 4 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(x*x+y*y+z*z-9)<1' 0.32 200 null 1 null
/particleex conditional minecraft:end_rod 12 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^3+abs(y/3)^3+abs(z/3)^3-1)<0.12' 0.4 200 null 1 null
/particleex conditional minecraft:end_rod 20 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^6+abs(y/3)^6+abs(z/3)^6-1)<0.12' 0.28 200 null 1 null
/particleex conditional minecraft:end_rod 28 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(abs(x/3)^10+abs(y/3)^10+abs(z/3)^10-1)<0.12' 0.28 200 null 1 null
```

### sphericalharmonics · 球谐函数（Y20 / Y30 / Y40 三阶对照）

- **标签**：`polarparameter` `表达式` `球谐`
- **说明**：三条命令并排，各自画一个 l 阶球谐的径向调制：`r = 3 + 0.8·Y_l0(θ)`。
  Y20 ∝ `3cos²θ−1` 是经典的「哑铃 + 腰环」，Y30 在赤道多一圈瓣，Y40
  再多一圈——每升一阶就多一对纬向瓣，正是球谐函数「节纬线数 = l」的可视化。
  **必须归一化**：Y40 未归一化时 `35c⁴−30c²+3 ∈ [3,8]`，dis 会跨到
  0.03..12.6（实测），画面炸成一片；除以 8 后统一落在 2.5..4.2。
  θ 用 `PI*(t−floor(t))` 扫、φ 用 `2π*floor(t)/rows` 阶梯扫——这是引擎里
  唯一的「双角度栅格」写法（一维 t 只有小数/整数两位可拆）。
  7200 粒（每档 2400）/ 约 20ms。
- **命令**（复制即用，三条一起载入）：

```
/particleex polarparameter minecraft:end_rod -8 0 0 1 0.95 0.89 1 0 0 0 0 48 's1=PI*(t-floor(t));s2=2*PI*floor(t)/48;dis=3+0.8*(1.5*cos(s1)*cos(s1)-0.5)' 0.02 200 'null' 1 null
/particleex polarparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 48 's1=PI*(t-floor(t));s2=2*PI*floor(t)/48;dis=3+0.8*(2.5*cos(s1)*cos(s1)*cos(s1)-1.5*cos(s1))' 0.02 200 'null' 1 null
/particleex polarparameter minecraft:end_rod 8 0 0 1 0.95 0.89 1 0 0 0 0 48 's1=PI*(t-floor(t));s2=2*PI*floor(t)/48;dis=3+0.8*((35*cos(s1)^4-30*cos(s1)*cos(s1)+3)/8)' 0.02 200 'null' 1 null
```

### juliaescape · Julia 逃逸高度场（迭代次数成山）

- **标签**：`parameter` `表达式` `分形` `高度场`
- **说明**：同样是 `z←z²+(−0.8)` 迭代 16 次，但这里**不是筛点、是把逃逸轮数
  画成高度**：`z = floor(log|z₁₆|²/ln2)·0.4`。落在集合内的点 z 恒 0（贴地），
  越早逃逸的点越高——Julia 集从平面图变成了「地形」。实测 z 分 19 层、
  最高 7.6 格，3874 粒 / 48ms。
  **关键技巧**：集合内的点 `|z₁₆|²` 会下溢到 0，`log(0) = −Inf` 把整条命令毁掉
  （实测 z 跨度一度达 1029），必须 `mm=min(m,1000000)` 先钳住；上钳 1e6
  同时把高度压在 19.9 层以内。
  ⚠️ **必须用 parameter 族**：conditional 的位置只取网格坐标，表达式里写的
  x/y/z 只参与条件求值、**不改变落点**——这是第四类字段陷阱。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 150 'px=-1.5+3*(t-floor(t));py=-1.5+3*floor(t)/150;zr0=px;zi0=py;zr1=zr0*zr0-zi0*zi0+(0-0.8);zi1=2*zr0*zi0;zr2=zr1*zr1-zi1*zi1+(0-0.8);zi2=2*zr1*zi1;zr3=zr2*zr2-zi2*zi2+(0-0.8);zi3=2*zr2*zi2;zr4=zr3*zr3-zi3*zi3+(0-0.8);zi4=2*zr3*zi3;zr5=zr4*zr4-zi4*zi4+(0-0.8);zi5=2*zr4*zi4;zr6=zr5*zr5-zi5*zi5+(0-0.8);zi6=2*zr5*zi5;zr7=zr6*zr6-zi6*zi6+(0-0.8);zi7=2*zr6*zi6;zr8=zr7*zr7-zi7*zi7+(0-0.8);zi8=2*zr7*zi7;zr9=zr8*zr8-zi8*zi8+(0-0.8);zi9=2*zr8*zi8;zr10=zr9*zr9-zi9*zi9+(0-0.8);zi10=2*zr9*zi9;zr11=zr10*zr10-zi10*zi10+(0-0.8);zi11=2*zr10*zi10;zr12=zr11*zr11-zi11*zi11+(0-0.8);zi12=2*zr11*zi11;zr13=zr12*zr12-zi12*zi12+(0-0.8);zi13=2*zr12*zi12;zr14=zr13*zr13-zi13*zi13+(0-0.8);zi14=2*zr13*zi13;zr15=zr14*zr14-zi14*zi14+(0-0.8);zi15=2*zr14*zi14;zr16=zr15*zr15-zi15*zi15+(0-0.8);zi16=2*zr15*zi15;mm=min(zr16*zr16+zi16*zi16,1000000);x=px;y=py;z=floor(log(mm)/0.6931)*0.4' 0.01 200 'null' 1 null
```

### vortexstreet · 涡街晶格（sin·cos 驻波零线）

- **标签**：`conditional` `表达式` `流场`
- **说明**：`sin(2x)·cos(y) ≈ 0.3` 的等值线——两个正交驻波相乘，零线在平面上
  织成规则方格，对应卡门涡街在稳定区间里的周期性排列。改 0.3 只平移等值线
  （取 0 时退化为完整方格网），改 2 和 1 的比值改变横竖格距比。4171 粒 / 32ms。
  条件写成 `abs(F−0.3)<0.05` 而非 `abs(F)<0.05`：**等值线可以取非零值**，
  这是本库其余 conditional 模板没用过的写法。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 8 6 0 'abs(sin(2*x)*cos(y)-0.3)<0.05' 0.05 200 null 1 null
```

### vortexdistort · 扭曲涡场（交叉项打破晶格）

- **标签**：`conditional` `表达式` `流场`
- **说明**：在涡街晶格上加乘积交叉项 `0.2·sin(0.7xy)`：±xy 的反对称让格子
  一半顺时针扭、一半逆时针扭，规则方格被打散成螺旋状涡胞。这是「加一项就
  从有序走向局部混沌」的最小例子——0.2 调到 0 退回 vortexstreet 的正方晶格，
  调到 0.5 以上涡胞互相吞并成乱流。4800 粒 / 32ms。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 8 6 0 'abs(sin(1.5*x)*cos(1.2*y)+0.2*sin(0.7*x*y)-0.3)<0.06' 0.05 200 null 1 null
```

### catenoid · 悬链面→螺旋面（等距变形族）

- **标签**：`parameter` `表达式` `极小曲面`
- **说明**：极小曲面里最漂亮的等距变形：α=0 是螺旋面（helicoid），α=π/2 是
  悬链面（catenoid），中间值是整族**既保长度又保面积的弯曲**——1776 年
  Meusnier 证明的那对曲面。写法
  `x = cosα·sinh v·sin u + sinα·cosh v·cos u`，三条命令取 α=0 / π/4 / π/2
  并排（左→右从螺旋面变号角面）。`sinh`/`cosh` 引擎可用；v 限在 ±1.5
  防止 cosh 爆炸。6000 粒 / 26ms。
- **命令**（复制即用，三条一起载入）：

```
/particleex parameter minecraft:end_rod -7 0 0 1 0.95 0.89 1 0 0 0 0 60 'u=2*PI*(t-floor(t));v=1.5*(floor(t)/60-0.5);x=sinh(v)*sin(u);z=(0-sinh(v))*cos(u);y=u' 0.03 200 'null' 1 null
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 60 'u=2*PI*(t-floor(t));v=1.5*(floor(t)/60-0.5);x=0.707107*sinh(v)*sin(u)+0.707107*cosh(v)*cos(u);z=(0-0.707107)*sinh(v)*cos(u)+0.707107*cosh(v)*sin(u);y=0.707107*u+0.707107*v' 0.03 200 'null' 1 null
/particleex parameter minecraft:end_rod 7 0 0 1 0.95 0.89 1 0 0 0 0 60 'u=2*PI*(t-floor(t));v=1.5*(floor(t)/60-0.5);x=cosh(v)*cos(u);z=cosh(v)*sin(u);y=v' 0.03 200 'null' 1 null
```

### crystal · 晶体点阵三型（SC / BCC / FCC）

- **标签**：`conditional` `表达式` `晶体`
- **说明**：三条命令并排各画一种布拉维格子。判定用三角函数零点：
  `sin(πx/a)=0 ⇔ x 是 a 的整数倍`。
  **SC 用「到最近格点的球距」判定**——sin 三轴同时过零会随阈值放宽而暴增
  （bw 0.06→0.2 从 7 粒涨到 129 粒，仍到不了可用密度），改成球体积判定
  `|x−a·round(x/a)|² < r²` 后稳定在 9408 粒。
  BCC 是 `|sin x + sin y + sin z|` 趋零（整数三重与半整数三重都满足），
  FCC 换成 cos 之和。改 a（表达式里的 1.5）整体缩放，改阈值调点的大小。
  这三型是金属晶体的全部基本格子（Fe 是 BCC、Cu 是 FCC、Po 是 SC）。
  共 16960 粒 / 439ms。
- **命令**（复制即用，三条一起载入）：

```
/particleex conditional minecraft:end_rod -7 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(x-1.5*round(x/1.5))^2+abs(y-1.5*round(y/1.5))^2+abs(z-1.5*round(z/1.5))^2<0.1024' 0.1 200 null 1 null
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(sin(PI*x/1.5)+sin(PI*y/1.5)+sin(PI*z/1.5))<0.02' 0.1 200 null 1 null
/particleex conditional minecraft:end_rod 7 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(cos(PI*x/1.5)+cos(PI*y/1.5)+cos(PI*z/1.5))<0.02' 0.1 200 null 1 null
```

### pendulum · 单摆相空间（三能级等能线）

- **标签**：`conditional` `表达式` `动力系统`
- **说明**：相平面 (θ, ω) 上的三条等能线：`E = ω²/2 − cos θ`。左边 E=0.2 是
  小振幅的**闭合椭圆**（摆小角度来回，永不越顶），中间 E=0.95 逼近**分界线**
  （周期趋于无穷），右边 E=1.6 越过顶点成为**开放轨道**（单向转圈）。
  分界线 E=1 是相空间拓扑的临界点——动力系统里最干净的分岔例子。
  三条并排、各错开 7 格，11064 粒 / 52ms。
  注意这是 2D 图形，**扫描范围必须写 `3 3 0`**（x-y 竖直面），写成 `3 0 3`
  会把 ω 压成常数、三条曲线全部退化。
- **命令**（复制即用，三条一起载入）：

```
/particleex conditional minecraft:end_rod -7 0 0 1 0.95 0.89 1 0 0 0 3 3 0 'abs(y*y/2-cos(x)-0.2)<0.08' 0.02 200 null 1 null
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 0 'abs(y*y/2-cos(x)-0.95)<0.08' 0.02 200 null 1 null
/particleex conditional minecraft:end_rod 7 0 0 1 0.95 0.89 1 0 0 0 3 3 0 'abs(y*y/2-cos(x)-1.6)<0.08' 0.02 200 null 1 null
```

### fibonaccisphere · 斐波那契球（黄金角均匀分布）

- **标签**：`parameter` `表达式` `球面分布`
- **说明**：球面上最均匀的点分布：k 从 1 到 N，纬线 `y=R(1−2k/N)` 等间距下降，
  方位角每次转**黄金角** `2π(1−1/φ)=2.399963 rad`。黄金角的好处是任何前缀
  都是准均匀的——只画前 100 个点也不会挤成一团，与向日葵种子排列同一原理。
  与随机撒点（`nebula`）的区别：随机撒点会有疏有密，斐波那契是**真正等间距**。
  N=3000、R=5 时 3001 粒 / 6ms。`step` 必须是 1（k=floor(t) 逐点），
  写 0.1 会让每个点重复采样 10 次。N 直接改表达式里的 3000 与 tmax。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3000 'k=floor(t);th=2.399963229728653*k;y=5*(1-2*k/3000);rr=sqrt(max(0,25-y*y));x=rr*cos(th);z=rr*sin(th)' 1 200 'null' 1 null
```

### foamcube · 立方泡沫（sin x·sin y·sin z 零面）

- **标签**：`conditional` `表达式` `泡沫`
- **说明**：`sin x·sin y·sin z ≈ 0` 的等值面——三个方向的驻波同时过零，结果是
  **三族互相垂直的平面网格**，把空间切成整齐的小立方体。泡沫结构里最简单的
  一型：每个气泡都是立方体、所有面都平。12581 粒 / 46ms、占格 7262，
  是覆盖率最高的 3D 体模板之一。改带宽 0.06 调泡壁厚度，改 sin 的系数调泡径。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4.5 4.5 4.5 'abs(sin(x)*sin(y)*sin(z))<0.06' 0.25 200 null 1 null
```

### foamcavity · BCC 泡沫（球形空腔阵列）

- **标签**：`conditional` `表达式` `泡沫`
- **说明**：`sin x·sin y + sin y·sin z + sin z·sin x ≈ 0.3` 的等值面——壁不是
  平面而是**曲面**，围出上下两层各四个球形空腔（体心立方排布）。正面能看到
  4 个洞、侧面看是双层结构，是 Kelvin 泡沫问题的近似解之一。
  1362 粒 / 51ms（比 cube 版稀疏，因为等值面更窄）。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4.5 4.5 4.5 'abs(sin(x)*sin(y)+sin(y)*sin(z)+sin(z)*sin(x)-0.3)<0.05' 0.25 200 null 1 null
```

### foamthin · 薄壁泡沫（三向余弦零线）

- **标签**：`conditional` `表达式` `泡沫`
- **说明**：`sin x + sin y + sin z ≈ 0` 的等值面——三个方向的平面波相加，零面
  形成**互相穿插的薄壁**，比立方泡沫更像肥皂泡的连通膜（立方泡沫直角相交，
  这里斜交）。2305 粒 / 29ms、占格 1976。与 `foamcube` 对照：同一族公式、
  两种拓扑——cube 版「所有面都平」，这一型「所有面都斜」。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4.5 4.5 4.5 'abs(sin(x)+sin(y)+sin(z))<0.08' 0.25 200 null 1 null
```

### thomasslow · Thomas 环·低阻尼（b=0.1 大环）

- **标签**：`normal` `表达式` `vel` `混沌`
- **说明**：与已收录的 `thomas`（b=0.208186，标准值）同一组方程
  `vx=sin(y)−bx, vy=sin(z)−by, vz=sin(x)−bz`，但 b 取 0.1。
  **b 是阻尼系数**：b 越小，注入的能量越难耗散，轨道越外扩——实测跨度
  t=0 时 6.3 格、30 tick 后 17.6 格、300 tick 后 22.1 格；标准 b=0.208
  只有约 7 格；b=0.3 反而缩成 6 格小球。两条模板可直接对照
  「阻尼越小、吸引子越大」的规律。3000 粒 / 315ms。
  ⚠️ 只有 Thomas 系统在 20 TPS 显式欧拉下不发散（sin 项的天然有界性），
  Lorenz / Rössler / Aizawa 等在这一积分器下全部爆掉（见 [05-examples](examples.md)）。
- **命令**（复制即用）：

```
/particleex normal minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0.5 0.5 0.5 3000 900 'u=sin(y)-0.1*x;v=sin(z)-0.1*y;w=sin(x)-0.1*z;(vx,vy,vz)=(u*0.3,v*0.3,w*0.3)' 1 null
```

### tesseract · Tesseract 4D 超立方体投影

- **标签**：`parameter` `表达式` `4D`
- **说明**：4 维超立方体的 3D 透视投影：16 个顶点由 t 的低 4 位编码，每个顶点
  延伸 4 条边（翻转一个位），32 条边各细分 120 点。4D 旋转在 x-w 平面上
  （0.6 rad），再按 w 坐标透视缩放 `2.6+wr`——这就是「内立方套外立方 +
  跨接线」的来源：**内立方是 w 坐标更远的那个立方体**，透视让它变小。
  同一条命令即是完整的 4D→3D 降维演示。3841 粒 / 24ms。
  改 PER（120）调边长密度，改 0.825336/0.564642（cos/sin 0.6）调 4D 旋转相位。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3840 'k=floor(t/120);s=floorMod(t,120)/120;d=floor(k/16);base=k-16*d;b0=floorMod(base,2);b1=floorMod(floor(base/2),2);b2=floorMod(floor(base/4),2);b3=floorMod(floor(base/8),2);c0=2*b0-1;c1=2*b1-1;c2=2*b2-1;c3=2*b3-1;w0=max(0,1-abs(d-0));w1=max(0,1-abs(d-1));w2=max(0,1-abs(d-2));w3=max(0,1-abs(d-3));c0=c0+(0-c0-c0)*s*w0;c1=c1+(0-c1-c1)*s*w1;c2=c2+(0-c2-c2)*s*w2;c3=c3+(0-c3-c3)*s*w3;xr=c0*0.825336-c3*0.564642;wr=c0*0.564642+c3*0.825336;sc=7/(2.6+wr);x=xr*sc;y=c1*sc;z=c2*sc' 1 200 'null' 1 null
```

### octahedron · 八面体（|x|+|y|+|z|=R 面族）

- **标签**：`conditional` `表达式` `多面体`
- **说明**：`|x|+|y|+|z| = 4` 的等值面就是**正八面体**（六个顶点在坐标轴上）——
  L1 范数的等值面。三轴绝对值相加写起来最简单，却得到最经典的柏拉图立体
  之一。4455 粒 / 99ms。四个「象限」面在等距投影下拼成完整菱形，中心空腔是
  八面体的内部。与 `cube` 是同一族「p-范数等值面」的 p=1 与 p=∞ 两端。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 4 4 4 'abs(abs(x)+abs(y)+abs(z)-4)<0.06' 0.12 200 null 1 null
```

### cube · 立方体（max|x| 面族）

- **标签**：`conditional` `表达式` `多面体`
- **说明**：`max(|x|,|y|,|z|) = 3` 的等值面——L∞ 范数的等值面就是立方体。与
  八面体是同一族「p-范数等值面」的两端：p=1 八面体、p=∞ 立方体、p=2 球。
  7351 粒 / 40ms，绘制最快的一条（max 比 abs 三联快）。等距投影下能看到
  三个面 + 棱线，是库里唯一能直接看出「立体感」的多面体。
- **命令**（复制即用）：

```
/particleex conditional minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 3 3 3 'abs(max(max(abs(x),abs(y)),abs(z))-3)<0.05' 0.12 200 null 1 null
```

### heatsphere · 球面高度热图（颜色承载物理量）

- **标签**：`rgbaparameter` `表达式` `颜色场`
- **说明**：球面上的高度 `h=(y/R+1)/2` 映射成色相：南极 h=0 纯蓝 → 赤道
  h=0.5 绿 → 北极 h=1 纯红，是一条完整的色相环。这是**用颜色维度承载物理量**
  的范式——位置只负责形状，颜色负责读数。三条通道写成
  `cr=h; cg=1−|2h−1|; cb=1−h`（红-绿-蓝三段线性插值），比用 cos 绕色相环
  更直观、过渡也更平滑。6401 粒 / 33ms、占格 1256、30 种色。
  把 h 换成温度、压力、速度模长都是同一个写法。
- **命令**（复制即用）：

```
/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 32 'u=t;k=floor(u/0.1);v=floorMod(u,0.1)/0.1;th=k*0.1;ph=v*6.2832;x=5*sin(th)*cos(ph);z=5*sin(th)*sin(ph);y=5*cos(th);h=(y/5+1)/2;cr=h;cg=1-abs(2*h-1);cb=1-h;alpha=1' 0.005 200 'null' 1 null
```

### toruscolor · 环面色带（主参数绕色相环）

- **标签**：`rgbaparameter` `表达式` `颜色场`
- **说明**：环面上按主轴角度 th 绕一整圈色相：`hh=th/2π`，三分量
  `cr=0.5+0.5cos(2π·hh)` 等相隔 2π/3。绕环面走一圈颜色也走一圈，于是
  「颜色 = 位置沿主环的进度」变得可读——是给闭合曲线/环面加时间或进度
  指示的标准做法。12600 粒 / 42ms、占格 749、55 种色。
  与 `superformula` 的极角着色对照：那条是平面极坐标，这条是 3D 环面主参数。
- **命令**（复制即用）：

```
/particleex rgbaparameter minecraft:end_rod 0 0 0 0 0 0 0 63 'u=t;k=floor(u/0.05);v=floorMod(u,0.05)/0.05;th=k*0.05;ph=v*6.2832;x=(3+0.8*cos(ph))*cos(th);z=(3+0.8*cos(ph))*sin(th);y=0.8*sin(ph);hh=th/6.2832;cr=0.5+0.5*cos(hh*6.2832);cg=0.5+0.5*cos(hh*6.2832-2.0944);cb=0.5+0.5*cos(hh*6.2832+2.0944);alpha=1' 0.005 200 'null' 1 null
```

### rose3d · 3D 玫瑰螺旋（极坐标玫瑰绕轴上升）

- **标签**：`parameter` `表达式` `曲线 3D 化`
- **说明**：经典玫瑰线 `r=|cos(kθ)|`（k=5 出五瓣）绕 y 轴高速旋转 60 圈，
  同时缓慢上升——2D 玫瑰变成一条 3D 螺旋带。**关键是转速 60 远大于上升
  速率 0.05**：每转一圈只升约 0.005 格，60 圈形成均匀的螺旋薄壳。俯视是
  完美的五瓣玫瑰，侧视是斜纹螺旋带，等距视角下立体感最强。
  6667 粒 / 27ms、占格 3377。改 k 换瓣数（3/4/6），改 60 换螺旋密度。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 100 'u=t;k=5;r=3*abs(cos(k*u));th=u*60;x=r*cos(th);z=r*sin(th);y=u*0.05-2.5' 0.015 200 'null' 1 null
```

### rose3ddual · 双层玫瑰（正反镜像对）

- **标签**：`parameter` `表达式` `曲线 3D 化`
- **说明**：同一条 3D 玫瑰螺旋，但 y 坐标乘一个 `sg=floorMod(u,2)*2−1` 的
  正负交替因子：奇数段向上、偶数段向下，于是同一条命令画出**上下镜像的
  两层**。侧视能看到两层中间夹着空隙，等距视角像一朵立体花。与原版的差别
  只在 y 的那一个因子——一个 `*sg` 把单层薄壳变成双层对称结构，是本库最省的
  「对称化」写法。6667 粒 / 22ms、占格 2641。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 100 'u=t;k=5;r=3*abs(cos(k*u));th=u*60;sg=floorMod(u,2)*2-1;x=r*cos(th);z=r*sin(th);y=sg*(u*0.025-1.25)' 0.015 200 'null' 1 null
```

### dnahelix · DNA 双螺旋（主链双色的完整模型）

- **标签**：`parameter` `表达式` `多命令组合`
- **说明**：三条命令拼出一条完整的 DNA：两条主链各 40 圈螺旋（y 从 −4 到 4，
  半径 1.5），相位差 π 让它们处于直径两端；第三条画 26 根横档，把两条链在
  同一高度连起来。**横档是这里唯一的难点**——它需要「同一 y、两端各落在两条
  链上」，写法是先把 `t` 归一化成 0..1，`k=floor(u*N)` 取横档编号、
  `s=floorMod(u*N,1)` 取档内位置，角度 `th=40πk/N` 只由编号决定（同一根档上的
  所有点角度相同），再用 `(2s−1)` 从 −1 线性拉到 +1，于是每个点都落在这根档的
  连线上。俯视是标准圆环（双链在直径两端 + 径向横档），等距视角是清晰的螺旋柱。
  21201 粒 / 60ms、占格 1525。改 `40*PI` 换圈数，改 N 换横档数，改 1.5 换半径。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 0.2 0.6 1 1 0 0 0 0 40 'u=t/40;th=u*40*PI;r=1.5;x=r*cos(th);z=r*sin(th);y=u*8-4' 0.005 200 'null' 1 null
/particleex parameter minecraft:end_rod 0 0 0 1 0.35 0.3 1 0 0 0 0 40 'u=t/40;th=u*40*PI+PI;r=1.5;x=r*cos(th);z=r*sin(th);y=u*8-4' 0.005 200 'null' 1 null
/particleex parameter minecraft:end_rod 0 0 0 0.9 0.9 1 1 0 0 0 0 26 'u=t/26;N=26;k=floor(u*N);s=floorMod(u*N,1);th=40*PI*k/N;x=1.5*cos(th)*(2*s-1);z=1.5*sin(th)*(2*s-1);y=8*k/N-4' 0.005 200 'null' 1 null
```

### helicoid · 螺旋面（极小曲面的经典代表）

- **标签**：`parameter` `表达式` `极小曲面`
- **说明**：Helicoid：`(v·cos u, v·sin u, c·u)`——一条水平直线一边绕轴旋转一边
  匀速上升，扫出的曲面。它与悬链面（本库 `catenoid`）是同一张曲面在等距变形下
  的两端，是极小曲面里最基础的一对。采样用**两层索引**：`k=floor(u/N)` 选螺旋的
  第几圈（共 40 圈），`s` 在圈内取角度；半径 v 由 k 决定，所以每一圈是一条半径
  固定的水平线——这正是它的生成方式。按 45° 侧滚看最像螺旋楼梯；等距视角下能
  看到半透明的层叠丝带。24000 粒 / 27ms、占格 1002。把 `0.6` 调大让螺距更大。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 23999 'u=t;N=600;R2=40;k=floor(u/N);s=floorMod(u,N)/N;ug=s*4*PI;v=k/R2*4-2;x=v*cos(ug);y=v*sin(ug);z=0.6*ug-3.8' 1 200 'null' 1 null
```

### dini · Dini 螺旋面（常平均曲率的扭曲喇叭）

- **标签**：`parameter` `表达式` `极小曲面`
- **说明**：Dini 曲面：`z = a·(cos v + ln tan(v/2)) + b·u`，x/y 是半径为
  `a·sin v` 的圆。它是**常平均曲率曲面**（不同于极小曲面），形状像一只被拧过
  的喇叭筒——下部敞开成漏斗、上部收成螺旋尖。v 取 0.35..π−0.35 避开
  `log(tan(0))` 的奇点，u 扫 4π 让上下端各拧两圈。**采样分层**：k 决定 v
  （40 层），s 在层内扫 u。等距视角呈现典型的「螺旋楼梯筒」轮廓。
  24000 粒 / 57ms、占格 927。改 `b` 调扭转强度（b 越大越像拧毛巾）。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 23999 'u=t;N=600;R2=40;k=floor(u/N);s=floorMod(u,N)/N;ug=s*4*PI;vv=0.35+(PI-0.7)*k/R2;a=2;b=0.25;x=a*cos(ug)*sin(vv);y=a*sin(ug)*sin(vv);z=a*(cos(vv)+log(tan(vv/2)))+b*ug' 1 200 'null' 1 null
```

### supertoroid · 超环面（|cos|^n 控制环管截面）

- **标签**：`parameter` `表达式` `曲面`
- **说明**：环面的超椭圆推广：把截面半径换成 `R + a·sign(cos v)·|cos v|^n`、
  高度换成 `a·sign(sin v)·|sin v|^n`。n=1 是标准环面（圆管），n→0 时截面趋近
  方管（像一个带孔的立方块），n<1 出「胖方环」，n>1 出「瘦星环」。**这里必须用
  `signum(x)*pow(abs(x),n)`**——直接 `x^n` 对负底数返回 NaN（JDK Math.pow 语义）。
  与本库 `superellipsoid`（2D 超椭圆旋转）互补：那个改的是轮廓，这个改的是环管
  截面。20000 粒 / 26ms、占格 2016。俯视是一个带方角特征的圆环带。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 19999 'u=t;N=200;R2=100;k=floor(u/N);s=floorMod(u,N)/N;n=0.6;RR=3;aa=1.2;ug=k/R2*2*PI;vv=s*2*PI;cv=cos(vv);sv=sin(vv);r=RR+aa*signum(cv)*pow(abs(cv),n);x=r*cos(ug);y=r*sin(ug);z=aa*signum(sv)*pow(abs(sv),n)' 1 200 'null' 1 null
```

### stereosphere · 球极投影网格球（正交网格贴在球面）

- **标签**：`parameter` `表达式` `球面`
- **说明**：球极投影之逆：把平面上的**正交网格**（u 族竖线 × v 族横线）映回球面。
  写法是逆变换 `(X,Y) → (2X/(1+r²), 2Y/(1+r²), (r²−1)/(1+r²))`——平面上的无穷远点
  映到北极，原点映到南极，所以**网格在北极处被压得极密、在南极处被拉得极疏**
  （这正是球极投影保角的代价，也是它视觉上最有辨识度的地方）。俯视看是一张
  规整的经纬网球；等距视角能看到极点附近的密集堆积。**采样用两层索引**：
  `k=floor(u/P)` 选第几条线，`s=floorMod(u,P)/(P-1)` 取线上位置。7320 粒 / 22ms、
  占格 700。改 `2.5` 换球半径，改 NL/P 换网格疏密。
- **命令**（复制即用）：

```
/particleex parameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 7319 'u=t;NL=61;P=120;k=floor(u/P);s=floorMod(u,P)/(P-1);a=2*k/(NL-1)-1;b=2*s-1;X=a;Y=b;rr=X*X+Y*Y;den=1+rr;x=2*X/den*2.5;y=2*Y/den*2.5;z=(rr-1)/den*2.5' 1 200 'null' 1 null
```

### tickgrow · 随时间画出的螺旋（tickparameter 逐帧生长）

- **标签**：`tickparameter` `表达式` `时间驱动`
- **说明**：用 **tickparameter** 族：命令注册后不是一次性生成全部粒子，而是
  **每个游戏 tick 吐 `cpt` 个点**，t 按 step 递进——于是曲线是「随时间一笔画
  出来」的。这条画的是半径 3 的圆螺旋（`th=u*0.02` 每 tick 转一点、`y=u*0.002`
  缓慢上升），20 个点/tick 持续 150 tick，最终 2961 粒。播放时能看到螺旋一圈圈
  长出来的动态过程，这是 parameter 族做不到的（后者是瞬时全部生成）。
  **命令槽位与众不同**：`<begin> <end> <表达式> <step> <cpt>`，注意此处
  **cpt 在 age 之前**（非 tick 族没有 cpt 槽）。2961 粒 / 14ms、占格 657、
  跨度 10.3。
- **命令**（复制即用）：

```
/particleex tickparameter minecraft:end_rod 0 0 0 1 0.95 0.89 1 0 0 0 0 3000 'u=t;th=u*0.02;r=3;x=r*cos(th);z=r*sin(th);y=u*0.002' 1 20 200 'null' 1 null
```

### tickpulse · 阶梯扩散脉冲环（tickparameter）

- **标签**：`tickparameter` `表达式` `时间驱动`
- **说明**：同样是 tickparameter，但半径按 `r=1+floor(u/100)*0.25` **阶梯式
  跳变**：每 100 个采样点（5 个 tick）半径跳 0.25 格，于是每帧画面是一圈固定
  半径的圆，跳变瞬间同时存在两圈——形成同心环逐层向外扩散的脉冲感。俯视能
  看到从内到外的多层圆环。**阶梯与 tick 节拍要对齐**：一圈 100 点 = 5 tick
  （cpt=25），改 cpt 要同步改阶梯长度，否则阶梯与圆环错位成斜纹。2951 粒 / 16ms、
  占格 1066、跨度 22.8。
- **命令**（复制即用）：

```
/particleex tickparameter minecraft:end_rod 0 0 0 1 0.9 0.5 1 0 0 0 0 3000 'u=t;th=u*0.02;r=1+floor(u/100)*0.25;x=r*cos(th);z=r*sin(th);y=0' 1 25 200 'null' 1 null
```

### rgbaspiral · 彩虹阿基米德螺线（rgbapolarparameter 颜色表达式）

- **标签**：`rgbapolarparameter` `表达式` `颜色`
- **说明**：用 **rgbapolarparameter** 族：它**没有颜色槽**，颜色完全由表达式里的
  `cr/cg/cb` 给出——这是本库唯一直写颜色字段的模板。画 6 圈阿基米德螺线
  （`s1=u*0.0047` 方位角、`dis=0.3+u*0.0009` 半径同步线性增长），同时
  `cr/cg/cb = 0.5+0.5*cos(φ) / cos(φ−2π/3) / cos(φ+2π/3)` 让颜色沿径向绕色相环
  一圈——于是同一条螺线上能同时看到 577 种颜色，从内到外是彩虹渐变。**注意
  polar 族只读 `s1/s2/dis`**：写 `x/y/z` 会静默失效（全落原点）。8000 粒 / 22ms、
  占格 631、跨度 20.0。改 `0.0047` 换圈数，改 `0.0009` 换圈间距。
- **命令**（复制即用）：

```
/particleex rgbapolarparameter minecraft:end_rod 0 0 0 0 0 0 0 7999 'u=t;s2=0;s1=u*0.0047;dis=0.3+u*0.0009;cr=0.5+0.5*cos(u*0.03);cg=0.5+0.5*cos(u*0.03-2.0944);cb=0.5+0.5*cos(u*0.03+2.0944)' 1 200 'null' 1 null
```

## 待采纳候选（社区高频用法）

| 模板 | 来源 | 状态 |
|---|---|---|
| ~~**呼吸缩放**~~ | B 站社区用法 | ✅ 已采纳为 `breathing` 模板（2026-10-15，见上） |
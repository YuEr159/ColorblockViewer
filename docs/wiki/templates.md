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

## 已收录模板（当前 11 条）

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

## 待采纳候选（社区高频用法）

| 模板 | 来源 | 状态 |
|---|---|---|
| ~~**呼吸缩放**~~ | B 站社区用法 | ✅ 已采纳为 `breathing` 模板（2026-10-15，见上） |
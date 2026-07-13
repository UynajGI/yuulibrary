---
title: "实指数反馈 Ising 模型：从零温混合相到非解析临界性"
description: "系统研究实指数反馈 Ising 模型的理论笔记：统一非对称与对称反馈，严格区分平均场、有限维全局反馈与一维精确自由能，给出 p=1 与 p=2 两个结构边界的完整物理图景。"
date: 2026-07-13T12:43:41+08:00
author: "Ma, Sudakow, Krapivsky / Xu, Chen, Zhou, Wang"
source_type: "paper"
source_title: "Mixed Phases in Feedback Ising Models (PRL 2026) / Phase transitions in voting simulated by an intelligent Ising model (CTPh 2026)"
tags: ["统计物理", "Ising模型", "相变与临界现象"]
weight: 101
---


> 本笔记以两类已有工作为出发点：一类是零温下研究线性反馈 $f(m)=1+\gamma m$ 的反馈 Ising 模型，重点是稳定混合相、超稳定性和随外场扫描的分岔；另一类是采用对称二次反馈 $J(m)=J_0(1+\kappa m^2)$ 的“智能 Ising 模型”，重点是有限温度相变和三临界行为。这里将两者统一到实指数 $p>0$ 的框架中，并严格区分平均场、有限维全局反馈以及一维精确受限自由能三个层次。
>
> 与原稿相比，本笔记特别修正或澄清了以下问题：
> 1. “$J(m)>0$”只能称为**瞬时二体耦合前因子非负**，不能等同于普通固定正耦合的铁磁体；反馈会生成非局域多体作用。
> 2. 判断混合相是否为全局基态时，必须同时与 $m=+1$ 和 $m=-1$ 比较，不能只做单侧 Maxwell 比较。
> 3. 所有“出现混合相”或“成为混合基态”的阈值都应使用严格不等式；等号处通常只是端点并合或退化。
> 4. $p>2$ 的有限温度结构并非简单地“没有三临界点”，而是可出现一个以有限磁化跳变接到 $T=J$ 连续临界线上的**临界端点**。
> 5. 平均场 Landau 分类不能直接搬到一维全局反馈模型；一维中 $J(m)$ 还会通过零磁化背景自由能贡献更低阶的 $|m|^p$ 项。

---

## 1. 为什么要研究实指数反馈

普通 Ising 模型把自旋之间的耦合常数 $J$ 视为外部给定参数。反馈 Ising 模型则允许耦合随系统自身的宏观状态改变，即

$$
J\longrightarrow J(m),
\qquad
m=\frac1N\sum_{i=1}^N s_i,
\qquad s_i=\pm1.
$$

这种结构适合描述“微观个体的相互作用强度由整体状态反过来调节”的系统，例如投票中的实时民调、神经网络中的活动依赖突触、资源受限的群体协同、气候中的冰—反照率反馈等。其关键并不只是把一个常数换成函数，而是：一次局部自旋翻转会改变全局磁化，继而改变大量键的耦合强度，因此模型实际上包含非局域的有效多体作用。

已有线性反馈模型取

$$
f(m)=1+\gamma m,
$$

在零温平均场下可以产生普通铁磁模型没有的稳定混合相。另一方面，对称二次反馈

$$
f(m)=1+\kappa m^2
$$

在有限温度下可以改变相变阶数并产生三临界点。若要把指数从整数推广到任意实数，不能直接写 $m^p$，因为当 $m<0$ 且 $p\notin\mathbb Z$ 时，$m^p$ 一般不是实数。自然的实值延拓有两种：

$$
\Phi_p^{\mathrm A}(m)=\operatorname{sgn}(m)|m|^p,
$$

以及

$$
\Phi_p^{\mathrm S}(m)=|m|^p.
$$

前者是“奇函数式”的非对称延拓，在奇整数 $p$ 时退化为 $m^p$；后者是偶函数式的对称延拓，在偶整数 $p$ 时退化为 $m^p$。它们不是同一个模型的两种记号，而是物理上不同的两类反馈：

$$
\begin{aligned}
\text{非对称反馈：}\quad&
f_{\mathrm A}(m)=1+\kappa\,\operatorname{sgn}(m)|m|^p,\\
\text{对称反馈：}\quad&
f_{\mathrm S}(m)=1+\kappa |m|^p.
\end{aligned}
$$

非对称反馈区分 $m>0$ 与 $m<0$，显式破坏 $m\to-m$ 对称性；对称反馈只依赖磁化强度，保留自旋反演对称性。

---

## 2. 模型层次与平均场自由能

为了避免把平均场模型和有限维模型混在一起，先定义严格的 Curie–Weiss 型反馈模型：

$$
H_N(\mathbf s) =
-h\sum_{i=1}^N s_i
-\frac{J}{N}
\left[1+\kappa\Phi_p(m)\right]
\sum_{i<j}s_i s_j.
$$

利用

$$
\sum_{i<j}s_i s_j =
\frac12\left(N^2m^2-N\right),
$$

在热力学极限中能量密度为

$$
\varepsilon(m) =
-hm-\frac{J}{2}
\left[1+\kappa\Phi_p(m)\right]m^2.
$$

因此两类模型分别为

$$
\boxed{
\varepsilon_{\mathrm A}(m) =
-hm-\frac J2
\left[m^2+\kappa m|m|^{p+1}\right]
}
$$

和

$$
\boxed{
\varepsilon_{\mathrm S}(m) =
-hm-\frac J2
\left[m^2+\kappa |m|^{p+2}\right].
}
$$

虽然当 $0<p<1$ 时反馈函数本身在 $m=0$ 的导数发散，但它在平均场能量中总是乘以 $m^2$。因此对任意 $p>0$，上述能量至少二次可微，零温平均场动力学所需的一阶、二阶导数均是良定义的。需要排除的是 $p=0$ 的非一致极限，因为此时 $|m|^p$ 在 $m\to0$ 与 $p\to0$ 两个极限下不交换。

有限温度下，磁化为 $m$ 的构型数给出标准 Ising 混合熵

$$
I(m) =
\frac{1+m}{2}\ln\frac{1+m}{2}
+
\frac{1-m}{2}\ln\frac{1-m}{2}.
$$

于是平均场自由能密度是

$$
\mathcal F(m)=\varepsilon(m)+T I(m).
$$

这里的 $\mathcal F(m)$ 对 Curie–Weiss 反馈模型是热力学极限中的精确大偏差自由能，而不是再做一次近似得到的“猜测 Landau 势”。

---

## 3. 零温平均场动力学：混合相为什么可以稳定

对一般反馈函数 $f(m)$，写

$$
\varepsilon(m)=-hm-\frac J2 f(m)m^2.
$$

定义

$$
g(m) =
-J\left[
m f(m)+\frac12m^2f'(m)
\right],
$$

则

$$
\varepsilon'(m)=-h+g(m).
$$

零温 Glauber 型平均场动力学为

$$
\boxed{
\dot m =
-m+\operatorname{sgn}[h-g(m)].
}
$$

在切换曲线 $h=g(m)$ 两侧，

$$
\dot m=
\begin{cases}
1-m,&h>g(m),\\[1mm]
-1-m,&h<g(m).
\end{cases}
$$

因此系统总有两个端点分支 $m=\pm1$，而内部混合相满足

$$
|m|<1,
\qquad
h=g(m).
$$

内部支的稳定性不是由普通线性化特征值给出，而由切换曲线的方向决定：

$$
\boxed{
g'(m)>0 \quad\Longleftrightarrow\quad
\text{内部混合相稳定},
}
$$

$$
\boxed{
g'(m)<0 \quad\Longleftrightarrow\quad
\text{内部混合相不稳定}.
}
$$

原因是当轨道偏离稳定切换曲线时，两侧矢量场分别以有限速度将其推回。扰动不是指数衰减，而是在有限时间内线性回到分支，因此这种稳定性被称为“超稳定”。

若外场缓慢变化，轨道可以沿 $h=g(m)$ 滑动。由

$$
\dot h=g'(m)\dot m
$$

以及切换面上允许的 Filippov 速度区间

$$
-1-m\le \dot m\le 1-m,
$$

得到稳定混合支的动态俘获条件

$$
\boxed{
(-1-m)g'(m)
\le
\dot h
\le
(1-m)g'(m).
}
$$

这条式子说明：稳定混合相并非无条件跟随外场；当扫场速度超过局部允许范围时，轨道会被甩离混合支。

---

## 4. 非对称实指数反馈：稳定混合相与混合基态

### 4.1 分岔曲线和稳定阈值

对

$$
\varepsilon_{\mathrm A}(m) =
-hm-\frac J2
\left[m^2+\kappa m|m|^{p+1}\right],
$$

使用

$$
\frac{d}{dm}\left[m|m|^{p+1}\right] =
(p+2)|m|^{p+1},
$$

得到

$$
\varepsilon'_{\mathrm A}(m) =
-h-Jm-\frac{J\kappa}{2}(p+2)|m|^{p+1}.
$$

定义

$$
A_p=\frac{p+2}{2},
\qquad
C_p=A_p(p+1)
=\frac{(p+1)(p+2)}{2},
$$

则内部混合支为

$$
\boxed{
h=g_{\mathrm A}(m) =
-J\left[
m+A_p\kappa |m|^{p+1}
\right].
}
$$

其斜率为

$$
\boxed{
g_{\mathrm A}'(m) =
-J\left[
1+C_p\kappa\operatorname{sgn}(m)|m|^p
\right].
}
$$

当 $\kappa>0$ 时，稳定条件只能在 $m<0$ 满足。令 $x=-m>0$，有

$$
C_p\kappa x^p>1.
$$

折叠点为

$$
\boxed{
m_f =
-\left(\frac1{C_p\kappa}\right)^{1/p},
}
$$

只有当 $|m_f|<1$ 时，稳定混合支才真正进入物理区间。因此

$$
\boxed{
\kappa>\kappa_{\mathrm s}(p) =
\frac{1}{C_p} =
\frac{2}{(p+1)(p+2)}.
}
$$

等号 $\kappa=\kappa_{\mathrm s}$ 时折叠点正好位于 $m=-1$，尚不存在有限长度的内部稳定支，所以必须使用严格不等式。

折叠点对应的外场为

$$
\boxed{
h_f =
J\frac{p}{p+1}
\left(
\frac1{C_p\kappa}
\right)^{1/p}.
}
$$

两个端点切换场为

$$
\boxed{
h_+=g_{\mathrm A}(1) =
-J(1+A_p\kappa),
}
$$

$$
\boxed{
h_-=g_{\mathrm A}(-1) =
J(1-A_p\kappa).
}
$$

在准静态增场且 $\kappa>\kappa_{\mathrm s}$ 时，典型路径是

$$
m=-1
\longrightarrow
m_{\rm mix}
\longrightarrow
m=+1.
$$

第一步发生在 $h_-$ 附近，随后系统沿稳定混合支运动，最终在折叠 $h_f$ 处跳向 $m=+1$。

当 $p=1$ 时，

$$
\kappa_{\mathrm s}(1)=\frac13,
\qquad
m_f=-\frac1{3\kappa},
\qquad
h_f=\frac{J}{6\kappa},
$$

与线性反馈模型的已知结果完全一致，这也是对实指数推导的一个重要校验。

---

### 4.2 仅有稳定性还不够：必须做完整的基态比较

稳定混合相可能只是亚稳态。要判断其是否为零温全局基态，必须同时比较

$$
m=-x,\qquad m=-1,\qquad m=+1.
$$

在稳定内部支上，

$$
m=-x,\qquad 0<x<1,
$$

对应外场

$$
\boxed{
h_x =
J\left[
x-A_p\kappa x^{p+1}
\right].
}
$$

内部定态的能量为

$$
\varepsilon_{\mathrm A}(-x) =
\frac J2x^2
-\frac J2(p+1)\kappa x^{p+2}.
$$

与 $m=+1$ 的能量差为

$$
\boxed{
\Delta_+(x) =
\varepsilon_{\mathrm A}(-x)-\varepsilon_{\mathrm A}(1) =
\frac J2
\left[
(1+x)^2
+
\kappa
\left(
1-(p+2)x^{p+1}-(p+1)x^{p+2}
\right)
\right].
}
$$

令 $\Delta_+=0$，得到混合相与 $m=+1$ 的 Maxwell 曲线

$$
\boxed{
\kappa_M(x) =
\frac{(1+x)^2}
{
(p+2)x^{p+1}
+(p+1)x^{p+2}
-1
}.
}
$$

分母必须为正，所以参数 $x$ 只取满足

$$
(p+2)x^{p+1}+(p+1)x^{p+2}>1
$$

的区间。

与 $m=-1$ 的能量差为

$$
\boxed{
\Delta_-(x) =
\varepsilon_{\mathrm A}(-x)-\varepsilon_{\mathrm A}(-1) =
\frac J2
\left[
(1-x)^2
+
\kappa
\left(
(p+2)x^{p+1}
-(p+1)x^{p+2}
-1
\right)
\right].
}
$$

其导数可以写成

$$
\frac{d\Delta_-}{dx} =
J(1-x)\left(C_p\kappa x^p-1\right).
$$

在稳定混合支上 $C_p\kappa x^p>1$，所以

$$
\frac{d\Delta_-}{dx}>0.
$$

又因为 $\Delta_-(1)=0$，因此对任意稳定内部点 $x<1$，

$$
\boxed{
\Delta_-(x)<0.
}
$$

这说明稳定混合支一旦从 $m=-1$ 端点进入内部，它在相应外场下立刻比 $m=-1$ 能量更低。于是决定其能否成为全局基态的真正竞争者是 $m=+1$。

---

### 4.3 混合基态阈值

对 $\kappa_M(x)$ 直接求导可得

$$
\kappa_M'(x) =
-\frac{(1+x)Q_p(x)}
{
\left[
(p+2)x^{p+1}
+(p+1)x^{p+2}
-1
\right]^2
},
$$

其中

$$
Q_p(x) =
x^p
\left[
p^2(1+x)^2
+p(x+1)(x+3)
+2
\right]
+2>0.
$$

因此

$$
\kappa_M'(x)<0,
$$

即 Maxwell 曲线随 $x$ 单调下降。最小反馈强度在 $x\to1^-$ 处取得：

$$
\boxed{
\kappa_{\mathrm g}(p) =
\lim_{x\to1^-}\kappa_M(x) =
\frac{2}{p+1}.
}
$$

严格地说：

$$
\boxed{
\kappa>\kappa_{\mathrm g}(p)
\quad\Longrightarrow\quad
\text{存在有限外场区间，稳定混合相是全局基态}.
}
$$

在 $\kappa=\kappa_{\mathrm g}$ 时，退化点仍位于 $x=1$，即只是端点 $m=-1$ 与 $m=+1$ 的能量关系发生临界变化，并没有真正的内部混合基态。

两个阈值满足

$$
\frac{\kappa_{\mathrm g}}{\kappa_{\mathrm s}}
=p+2,
$$

所以总有

$$
\kappa_{\mathrm s}<\kappa_{\mathrm g}.
$$

整个零温结构因此分为

$$
0<\kappa\le\kappa_{\mathrm s}:
\quad
\text{无内部稳定混合相},
$$

$$
\kappa_{\mathrm s}<\kappa\le\kappa_{\mathrm g}:
\quad
\text{存在稳定但非全局的混合相},
$$

$$
\kappa>\kappa_{\mathrm g}:
\quad
\text{存在混合基态区间}.
$$

---

### 4.4 $p=1$ 为什么是边界，而不是“代表情形”

非对称反馈的瞬时二体前因子为

$$
f_{\mathrm A}(m) =
1+\kappa\operatorname{sgn}(m)|m|^p.
$$

当 $\kappa>0$ 时，其最小值位于 $m=-1$，因此

$$
f_{\mathrm A}(m)\ge0
\quad\forall m\in[-1,1]
$$

等价于

$$
0\le\kappa\le1.
$$

而混合基态阈值是

$$
\kappa_{\mathrm g}(p)=\frac2{p+1}.
$$

于是：

- 当 $0<p<1$ 时，$\kappa_{\mathrm g}>1$，要产生内部混合基态，必须进入某些磁化区间中 $f_{\mathrm A}(m)<0$ 的区域；
- 当 $p=1$ 时，$\kappa_{\mathrm g}=1$，线性模型正好落在边界上；
- 当 $p>1$ 时，$\kappa_{\mathrm g}<1$，存在

$$
\boxed{
\frac2{p+1}<\kappa\le1
}
$$

这一有限区间，其中 $f_{\mathrm A}(m)$ 对所有 $m$ 都非负，但混合相仍可成为零温全局基态。

这确实是实指数推广中最有分量的结果之一。不过物理表述必须准确：不能说“这是一个普通铁磁体却违反了铁磁基态定理”。这里的 $f_{\mathrm A}(m)$ 虽然始终非负，但它依赖所有自旋共同决定的 $m$。因此 Hamiltonian 不是固定正二体耦合的普通铁磁 Hamiltonian，而是包含全局多体反馈的模型。更严谨的说法是：

$$
\boxed{
\text{在所有磁化处瞬时二体耦合前因子均非负的条件下，}
\text{全局反馈多体作用仍可选择部分磁化基态。}
}
$$

线性 $p=1$ 之所以特殊，不只是因为它“最简单”，而是因为它恰好是

$$
\kappa_{\mathrm g}=1
$$

的临界边界。实指数推广揭示了线性模型在参数空间中的奇异地位。

---

## 5. 对称反馈：正反馈不稳定混合相，负反馈可直接锁定部分磁化

对称模型为

$$
\varepsilon_{\mathrm S}(m) =
-hm-\frac J2
\left[m^2+\kappa|m|^{p+2}\right].
$$

内部支满足

$$
\boxed{
h=g_{\mathrm S}(m) =
-J\left[
m+A_p\kappa\operatorname{sgn}(m)|m|^{p+1}
\right],
}
$$

并且

$$
\boxed{
g_{\mathrm S}'(m) =
-J\left[
1+C_p\kappa|m|^p
\right].
}
$$

若 $\kappa>0$，括号始终为正，因此

$$
g_{\mathrm S}'(m)<0,
$$

零温内部混合支全部不稳定。对称正反馈会随着 $|m|$ 增大而增强对齐倾向，因此它推动系统走向满磁化，而不是将系统稳定在中间磁化。

若 $\kappa=-a<0$，稳定条件变成

$$
C_pa|m|^p>1.
$$

稳定混合支进入物理区间的阈值是

$$
\boxed{
a>\frac{2}{(p+1)(p+2)}.
}
$$

由于模型保持 $m\to-m$ 对称性，稳定分支成对出现在正、负磁化两侧。

更进一步，在 $h=0$ 时可直接求出对称负反馈的混合基态。令 $x=|m|$，则

$$
\varepsilon_{\mathrm S}(x) =
-\frac J2\left(x^2-a x^{p+2}\right).
$$

内部极值满足

$$
2x-a(p+2)x^{p+1}=0,
$$

因此

$$
\boxed{
x_0 =
\left[
\frac{2}{a(p+2)}
\right]^{1/p}.
}
$$

它位于 $0<x_0<1$ 的条件是

$$
\boxed{
a>\frac{2}{p+2}.
}
$$

在这个条件下，函数 $x^2-a x^{p+2}$ 先增后减，$x_0$ 是其全局最大点，因此 $\pm x_0$ 是零场全局基态。若还要求瞬时耦合前因子

$$
f_{\mathrm S}(m)=1-a|m|^p
$$

在整个区间非负，则需 $a\le1$。所以对任意 $p>0$，都有

$$
\boxed{
\frac{2}{p+2}<a\le1
}
$$

这一“非负瞬时耦合前因子下的对称混合基态”区间。

这与非对称正反馈的机制不同。非对称模型依靠方向性反馈使某一侧的内部支战胜两个满磁化态；对称负反馈则通过在大 $|m|$ 时削弱耦合，直接阻止系统完全对齐。

---

## 6. 有限温度平均场理论

### 6.1 精确方程状态与自旋odal

平均场熵满足

$$
I'(m)=\operatorname{arctanh}m,
\qquad
I''(m)=\frac1{1-m^2}.
$$

非对称模型的自由能为

$$
\boxed{
\mathcal F_{\mathrm A}(m) =
-hm
-\frac J2\left[m^2+\kappa m|m|^{p+1}\right]
+TI(m).
}
$$

方程状态为

$$
\boxed{
h =
T\operatorname{arctanh}m
-J\left[
m+A_p\kappa|m|^{p+1}
\right].
}
$$

局部稳定条件是

$$
\boxed{
\mathcal F_{\mathrm A}''(m) =
\frac{T}{1-m^2}
-J\left[
1+C_p\kappa\operatorname{sgn}(m)|m|^p
\right]
>0.
}
$$

对应自旋odal温度可参数化为

$$
\boxed{
\frac{T_{\mathrm{sp}}^{\mathrm A}}{J} =
(1-m^2)
\left[
1+C_p\kappa\operatorname{sgn}(m)|m|^p
\right].
}
$$

对称模型则有

$$
\boxed{
\mathcal F_{\mathrm S}(m) =
-hm
-\frac J2\left[m^2+\kappa|m|^{p+2}\right]
+TI(m),
}
$$

$$
\boxed{
h =
T\operatorname{arctanh}m
-J\left[
m+A_p\kappa\operatorname{sgn}(m)|m|^{p+1}
\right],
}
$$

$$
\boxed{
\mathcal F_{\mathrm S}''(m) =
\frac{T}{1-m^2}
-J\left[
1+C_p\kappa|m|^p
\right].
}
$$

因此

$$
\boxed{
\frac{T_{\mathrm{sp}}^{\mathrm S}}{J} =
(1-m^2)
\left[
1+C_p\kappa|m|^p
\right].
}
$$

需要特别注意：方程状态中不仅有普通的 $Jf(m)m$，还多出来自 $f'(m)$ 的反馈项。直接把标准 Curie–Weiss 方程写成

$$
m=\tanh\{\beta[h+Jf(m)m]\}
$$

会漏掉这部分，是一个常见错误。正确的平衡方程必须由完整自由能对 $m$ 求导。

---

### 6.2 对称模型的 Landau 展开

在 $h=0$ 附近，

$$
TI(m) =
-T\ln2
+\frac T2m^2
+\frac T{12}m^4
+\frac T{30}m^6
+O(m^8).
$$

于是

$$
\boxed{
\mathcal F_{\mathrm S}(m) =
-T\ln2
+\frac{T-J}{2}m^2
+\frac T{12}m^4
+\frac T{30}m^6
-\frac{J\kappa}{2}|m|^{p+2}
+\cdots.
}
$$

真正决定临界结构的是反馈项的阶数

$$
q=p+2.
$$

由此自然出现三个区间。

---

### 6.3 $0<p<2$：非解析临界区

此时

$$
2<q<4,
$$

反馈项位于二次项与四次项之间，因而在足够靠近临界点时压过普通 $m^4$ 项。

#### 负反馈 $\kappa<0$

令 $\kappa=-|\kappa|$，则近临界自由能为

$$
\mathcal F_{\mathrm S}
\simeq
\frac{T-J}{2}m^2
+
\frac{J|\kappa|}{2}|m|^{p+2}.
$$

在 $T<J$ 时，非零极小值满足

$$
|m|^p =
\frac{2(J-T)}
{J|\kappa|(p+2)}.
$$

因此

$$
\boxed{
|m|
\propto
(J-T)^{1/p},
\qquad
\beta_{\mathrm{MF}}=\frac1p.
}
$$

在 $T=J$ 施加小场时，

$$
h\propto
\operatorname{sgn}(m)|m|^{p+1},
$$

所以

$$
\boxed{
\delta_{\mathrm{MF}}=p+1.
}
$$

线性响应在 $T>J$ 仍给出

$$
\chi\sim(T-J)^{-1},
$$

故

$$
\gamma_{\mathrm{MF}}=1.
$$

最小自由能的奇异部分满足

$$
f_{\mathrm s}\sim-|J-T|^{1+2/p},
$$

对应

$$
\alpha_{\mathrm{MF}}=1-\frac2p.
$$

这些指数满足平均场标度关系

$$
\alpha+2\beta+\gamma=2.
$$

它们是该非解析平均场自由能中的渐近指数，不应未经检验地宣称为有限维普适指数。

#### 正反馈 $\kappa>0$

此时 $-J\kappa |m|^{p+2}/2$ 是负的。即使二次系数仍为正，非解析负项也可与正四次项共同制造有限磁化极小值。因此对任意非零正反馈，连续相变都会被一级相变抢先。

利用后面的共存参数式，在弱反馈极限可得

$$
\kappa_{\mathrm{coex}} =
\frac{1}{3p}m_{\mathrm j}^{\,2-p}
+O(m_{\mathrm j}^{\,4-p}),
$$

$$
\frac{T_{\mathrm{coex}}}{J} =
1+\frac{2-p}{6p}m_{\mathrm j}^{\,2}
+O(m_{\mathrm j}^{\,4}),
$$

从而

$$
\boxed{
m_{\mathrm j}
\sim
(3p\kappa)^{1/(2-p)},
}
$$

$$
\boxed{
\frac{T_{\mathrm{coex}}-J}{J}
\sim
\frac{2-p}{6p}
(3p\kappa)^{2/(2-p)}.
}
$$

因此一级跳变在 $\kappa\to0^+$ 时连续缩小，但 $(\kappa,T)=(0,J)$ 不是普通多项式 Landau 意义下的三临界点，而是一个由非解析项控制的端点。

---

### 6.4 $p=2$：标准三临界点

当 $p=2$ 时，

$$
|m|^{p+2}=m^4.
$$

四次系数为

$$
b_4(T,\kappa) =
\frac T{12}-\frac{J\kappa}{2}.
$$

二次系数在

$$
T_c=J
$$

消失。令二次和四次系数同时为零，得到

$$
\boxed{
T_{\mathrm{TCP}}=J,
\qquad
\kappa_{\mathrm{TCP}}=\frac16.
}
$$

六次系数为

$$
\frac J{30}>0,
$$

所以该点稳定。于是：

$$
\kappa<\frac16:
\quad
T=J \text{ 处连续相变},
$$

$$
\kappa=\frac16:
\quad
\text{三临界点},
$$

$$
\kappa>\frac16:
\quad
\text{一级相变}.
$$

这里的 $\kappa=1/6$ 是有限温度平均场对称正反馈的三临界值。它与零温对称负反馈中某些阈值在数值上可能相同，但两者的符号、机制和物理含义完全不同，不能混为一谈。

---

### 6.5 $p>2$：普通局域临界性与有限磁化临界端点

当 $p>2$ 时，反馈项阶数高于四次。对任意有限 $\kappa$，原点附近仍由

$$
\frac{T-J}{2}m^2+\frac T{12}m^4
$$

控制，所以局部连续临界行为仍是普通平均场 Ising 型：

$$
T_c=J,
\qquad
\beta_{\mathrm{MF}}=\frac12.
$$

但足够强的正反馈可以在远离 $m=0$ 的位置制造更低的有限磁化极小值，从而在 $T>J$ 发生一级相变。这个一级线不会通过令四次系数变号而在 $m=0$ 处形成三临界点，而是在有限磁化处接到 $T=J$ 的连续临界线上。

为了看清这一点，定义

$$
\tau=\frac TJ,
\qquad
L(m)=\operatorname{arctanh}m,
$$

$$
\mathcal I(m) =
I(m)-I(0) =
\frac12
\left[
(1+m)\ln(1+m)
+
(1-m)\ln(1-m)
\right].
$$

零场下，非零定态与 $m=0$ 共存需满足

$$
\tau L(m) =
m+A_p\kappa m^{p+1},
$$

$$
\tau\mathcal I(m) =
\frac12m^2+\frac12\kappa m^{p+2}.
$$

消去 $\kappa$，得到任意实数 $p>0$ 的共存参数式

$$
\boxed{
\tau_{\mathrm{coex}}(m) =
\frac{p\,m^2}
{
2\left[(p+2)\mathcal I(m)-mL(m)\right]
},
}
$$

$$
\boxed{
\kappa_{\mathrm{coex}}(m) =
\frac{
2\left[\tau_{\mathrm{coex}}(m)L(m)-m\right]
}
{(p+2)m^{p+1}}.
}
$$

小 $m$ 展开给出

$$
\tau_{\mathrm{coex}} =
1-\frac{p-2}{6p}m^2+O(m^4),
$$

$$
\kappa_{\mathrm{coex}} =
\frac1{3p}m^{2-p}
+O(m^{4-p}).
$$

对 $p>2$，小 $m$ 共存支有 $\tau<1$，此时 $m=0$ 已经局部不稳定，所以它不是物理上的顺磁—有序一级共存。真正的一级线从 $\tau=1$ 的有限磁化点开始。令 $m_{\mathrm{CE}}$ 满足

$$
\boxed{
2\left[
(p+2)\mathcal I(m_{\mathrm{CE}})
-m_{\mathrm{CE}}L(m_{\mathrm{CE}})
\right] =
p\,m_{\mathrm{CE}}^2,
}
$$

则临界端点反馈强度为

$$
\boxed{
\kappa_{\mathrm{CE}} =
\frac{
2\left[L(m_{\mathrm{CE}})-m_{\mathrm{CE}}\right]
}
{
(p+2)m_{\mathrm{CE}}^{p+1}
}.
}
$$

在这一点，$m=0$ 的相关长度意义下仍处在 $T=J$ 临界状态，但它与一个有限 $m_{\mathrm{CE}}$ 的有序极小值等能，因此序参量跳变不消失。它不是三临界点，而是有限磁化临界端点。

几个平均场数值例子为

| $p$ | $m_{\mathrm{CE}}$ | $\kappa_{\mathrm{CE}}$ |
|---:|---:|---:|
| 3 | 0.8059 | 0.2933 |
| 4 | 0.9179 | 0.3364 |
| 6 | 0.9773 | 0.3688 |

因此 $p>2$ 的完整结论应表述为：

$$
\boxed{
\text{弱正反馈下仍在 }T=J\text{ 连续转变；}
\quad
\text{强正反馈下由有限磁化一级转变抢先；}
\quad
\text{两者在临界端点连接。}
}
$$

---

## 7. 一维全局反馈模型的精确受限自由能

考虑一维周期链

$$
H =
-J(m)\sum_{i=1}^N s_i s_{i+1}
-h\sum_{i=1}^N s_i.
$$

在固定磁化 $m$ 的子空间中，$J(m)$ 是常数，因此可以先使用普通一维 Ising 模型的转移矩阵，再对辅助场做 Legendre 变换。

定义

$$
K=\beta J,
\qquad
H_u=\beta u.
$$

最大转移矩阵本征值为

$$
\lambda_+(K,H_u) =
e^K\cosh H_u
+
\sqrt{
e^{2K}\sinh^2H_u+e^{-2K}
}.
$$

普通一维 Ising 模型的磁化关系为

$$
m =
\frac{\sinh H_u}
{
\sqrt{\sinh^2H_u+e^{-4K}}
}.
$$

反解得

$$
\boxed{
H_*(m;K) =
\operatorname{arsinh}
\left[
\frac{m e^{-2K}}
{\sqrt{1-m^2}}
\right].
}
$$

固定 $J$ 的受限自由能为

$$
\boxed{
\beta\phi(m;J) =
mH_*(m;K)
-
\ln\lambda_+\!\left(K,H_*(m;K)\right).
}
$$

对于全局反馈，只需在固定磁化扇区中代入

$$
J\to J(m),
$$

于是热力学极限中的精确自由能景观为

$$
\boxed{
\Phi(m;T,h) =
\phi\!\left(m;J(m)\right)-hm.
}
$$

平衡磁化由

$$
m_{\mathrm{eq}} =
\arg\min_{m\in[-1,1]}\Phi(m;T,h)
$$

确定。

这一结果说明，一维全局反馈模型虽然具有局部最近邻键，但其耦合依赖全局磁化，等效包含非局域多体相互作用。因此它在有限温度发生相变并不违反普通短程一维 Ising 模型无有限温相变的结论。

更重要的是，一维精确模型的 Landau 阶数不能照搬平均场结果。固定 $J$ 时，

$$
\beta[\phi(m;J)-\phi(0;J)] =
\frac{e^{-2K}}2m^2
+
\frac{3e^{4K}-1}{24e^{6K}}m^4
+O(m^6).
$$

但当

$$
J(m)=J_0\left(1+\kappa|m|^p\right)
$$

时，零磁化背景自由能

$$
-\ln[2\cosh K(m)]
$$

本身就展开为

$$
-\ln[2\cosh K_0]
-
K_0\kappa\tanh K_0\,|m|^p
+\cdots.
$$

因此在一维中，反馈首先可在 $|m|^p$ 阶进入，而不是像 Curie–Weiss 能量中那样只在 $|m|^{p+2}$ 阶进入。二次反馈 $p=2$ 能直接改写一维自由能的二次系数，这正是一维模型可在有限温度产生连续线与三临界行为的根本原因。

所以应严格区分：

$$
\boxed{
\text{平均场实指数分类：反馈阶数为 }p+2;
}
$$

$$
\boxed{
\text{一维全局反馈精确分类：背景键自由能还会产生 }|m|^p\text{ 项}.
}
$$

一维三临界参数必须从上述精确自由能重新求解，不能直接套用平均场的 $\kappa_{\mathrm{TCP}}=1/6$。

---

## 8. 有限维全局反馈与 Monte Carlo 的正确能量差

对最近邻格点模型定义

$$
H =
-J(m)B-hM,
$$

其中

$$
B=\sum_{\langle i,j\rangle}s_i s_j,
\qquad
M=\sum_i s_i,
\qquad
m=\frac MN.
$$

翻转第 $k$ 个自旋后，

$$
m'=m-\frac{2s_k}{N}.
$$

定义该自旋相邻键的和

$$
b_k=\sum_{j\in\mathrm{nn}(k)}s_k s_j,
$$

则

$$
B'=B-2b_k.
$$

精确能量变化是

$$
\boxed{
\Delta E =
-J(m')\left(B-2b_k\right)
+J(m)B
+2hs_k.
}
$$

等价地，

$$
\boxed{
\Delta E =
\left[J(m)-J(m')\right]B
+
2J(m')b_k
+
2hs_k.
}
$$

第一项是全局反馈贡献。虽然单次翻转只有

$$
m'-m=O(N^{-1}),
$$

但

$$
B=O(N),
$$

所以

$$
[J(m)-J(m')]B=O(1),
$$

不能忽略。若只使用普通 Ising 模型的局部能量差

$$
\Delta E_{\rm naive}=2J(m)b_k+2hs_k,
$$

则不满足目标 Hamiltonian 的详细平衡，采样的是错误分布。

Metropolis 接受率应为

$$
P_{\mathrm{acc}} =
\min\left(1,e^{-\beta\Delta E}\right).
$$

在对称模型且 $h=0$ 时，全局翻转 $s_i\to-s_i$ 保持 $m^2$、$|m|^p$ 和 $B$ 不变，可作为零能量更新；在非对称模型中 $J(-m)\neq J(m)$，全局翻转一般不再是零能量操作，必须按实际 $\Delta E$ 接受或拒绝。

---

## 9. 数值验证应如何组织

理论文章若没有实验条件，数值部分至少应完成三层验证。

第一层是零温平均场分岔。对给定 $p,\kappa$，直接画

$$
h=g_{\mathrm A}(m)
\quad\text{或}\quad
h=g_{\mathrm S}(m),
$$

标出 $g'(m)>0$ 与 $g'(m)<0$ 的支，并核对

$$
m_f,
\qquad
h_f,
\qquad
\kappa_{\mathrm s}.
$$

再用小温度正则化

$$
\dot m =
-m+\tanh\{\beta[h(t)-g(m)]\},
\qquad
\beta\gg1,
$$

验证超稳定回归、俘获区间和扫场脱锁。

第二层是平均场自由能最小化。对每个 $(p,\kappa,T,h)$，应在整个 $[-1,1]$ 上搜索所有局部极小，而不是只从单一起点运行局部优化。可靠流程是：先密集网格扫描，再用有界优化细化每个候选极小，最后比较自由能。一级相变点应使用等自由能条件定位，自旋odal用 $\mathcal F'=\mathcal F''=0$ 定位。

第三层是有限维 Monte Carlo。仅用比热峰位置不足以确定相变阶数。建议至少同时测量：

$$
U_4 =
1-\frac{\langle m^4\rangle}
{3\langle m^2\rangle^2},
$$

$$
\chi =
\frac{N}{T}
\left(
\langle m^2\rangle-\langle |m|\rangle^2
\right),
$$

以及能量与磁化分布 $P(E)$、$P(m)$。一级相变应检查：

- 双峰结构是否随系统尺寸变清晰；
- 两峰间距除以 $N$ 后是否趋于非零潜热；
- 自由能势垒 $-T\ln P(E)$ 是否随界面尺度增长；
- 等权重或等高准则下的伪临界点是否按一级相变有限尺寸标度移动。

反馈模型容易出现高势垒和长隧穿时间，普通单自旋 Metropolis 在一级区会严重滞后。可采用并行回火、multicanonical、Wang–Landau 或基于多温度数据的重加权方法。无论采用何种算法，能量差都必须使用上一节的全局反馈精确公式。

---

## 10. 物理图景与文章真正的主线

这套实指数理论的主线不是“把整数 $p$ 换成实数 $p$”这么简单，而是由两个边界指数组织起来。

第一个边界是

$$
p=1.
$$

它控制非对称零温模型能否在瞬时二体前因子始终非负时出现混合基态：

$$
p<1:
\quad
\kappa_{\mathrm g}>1,
$$

$$
p=1:
\quad
\kappa_{\mathrm g}=1,
$$

$$
p>1:
\quad
\kappa_{\mathrm g}<1.
$$

因此 $p=1$ 是“混合基态是否必须进入负耦合前因子区域”的分界点。

第二个边界是

$$
p=2.
$$

它控制对称平均场自由能中反馈项相对于普通四次项的位置：

$$
0<p<2:
\quad
|m|^{p+2}\text{ 先于 }m^4,
$$

$$
p=2:
\quad
|m|^{p+2}=m^4,
$$

$$
p>2:
\quad
|m|^{p+2}\text{ 晚于 }m^4.
$$

因此 $p=2$ 分别对应非解析临界性、标准三临界性和有限磁化一级转变三种不同机制的边界。

把这两条边界合起来，文章可以形成非常清楚的逻辑：

1. 线性反馈工作表明零温稳定混合相可能存在，但线性模型中的混合基态必须等到反馈前因子即将变号；
2. 二次对称反馈工作表明非线性反馈会在有限温度改变相变阶数；
3. 实指数推广揭示，$p=1$ 与 $p=2$ 都不是随意选取的例子，而是两个不同物理问题中的结构边界；
4. $p>1$ 允许“瞬时二体前因子始终非负”与“部分磁化全局基态”共存；
5. $0<p<2$ 产生非解析平均场临界指数，$p=2$ 产生标准三临界点，$p>2$ 产生有限磁化临界端点；
6. 一维精确模型又表明，空间关联会把反馈项的有效 Landau 阶数前移，因此平均场与一维必须分开讨论。

---

## 11. 结论

实指数反馈 Ising 模型最重要的结论可以压缩为以下几条。

对非对称正反馈，

$$
\boxed{
\kappa_{\mathrm s}(p) =
\frac{2}{(p+1)(p+2)}
}
$$

是稳定混合支进入物理区间的阈值，而

$$
\boxed{
\kappa_{\mathrm g}(p) =
\frac{2}{p+1}
}
$$

是内部混合相能够成为全局基态的阈值。对任意 $p>1$，存在

$$
\frac2{p+1}<\kappa\le1
$$

这一瞬时二体耦合前因子全程非负、但全局基态部分磁化的区间。其来源不是普通二体铁磁作用，而是状态依赖耦合产生的非局域多体反馈。

对对称反馈，正反馈在零温下不稳定内部混合相，负反馈则可稳定并在

$$
|\kappa|>\frac2{p+2}
$$

时于零场产生对称混合基态。

在有限温度 Curie–Weiss 理论中，$p$ 将相变分成三类：

$$
0<p<2:
\quad
\text{非解析临界或非解析一级转变},
$$

$$
p=2:
\quad
\text{标准三临界点},
$$

$$
p>2:
\quad
\text{普通局域临界性与有限磁化临界端点}.
$$

最后，一维全局反馈模型可以通过普通一维 Ising 转移矩阵的受限自由能精确化为单变量最小化问题，但其低阶展开与平均场不同，不能将平均场的 $p+2$ Landau 分类直接照搬。

从理论文章的角度，最值得突出的一句话不是“我们研究了任意实指数”，而是：

$$
\boxed{
\text{反馈指数决定了宏观部分有序能否在非负瞬时耦合下成为基态，}
\text{并决定相变是非解析、三临界，还是由有限磁化极小值驱动。}
}
$$

---

## 参考文献

1. Y.-P. Ma, I. Sudakow, and P. L. Krapivsky, “Mixed Phases in Feedback Ising Models,” *Physical Review Letters* **137**, 027101 (2026).
2. G. Xu, J. Chen, X. Zhou, and Y. Wang, “Phase transitions in voting simulated by an intelligent Ising model,” *Communications in Theoretical Physics* **78**, 055601 (2026).
3. R. J. Glauber, “Time-dependent statistics of the Ising model,” *Journal of Mathematical Physics* **4**, 294 (1963).
4. L. D. Landau, “On the theory of phase transitions,” *Zh. Eksp. Teor. Fiz.* **7**, 19 (1937).
5. H. Nishimori and G. Ortiz, *Elements of Phase Transitions and Critical Phenomena*, Oxford University Press (2010).

## 附录：严格原子化推导

> 以下推导由 strict-atomic-math-engine 生成。每相邻两行之间恰好相差一次原子操作（展开/合并/代入/求导/移项），行末标注了本步唯一的操作类型。

### A.1 平均场能量密度（§2）

从 Hamiltonian 出发推导 $\varepsilon_{\mathrm A}(m)$：

$$
\begin{aligned}
\varepsilon_{\mathrm A}(m)
&= \lim_{N\to\infty} \frac{1}{N}H_N(\mathbf s)
\quad \text{(仅定义能量密度：Hamiltonian 除以自旋数 $N$)}\\[4pt]
&= \lim_{N\to\infty} \frac{1}{N}\!\left[-h\sum_{i=1}^{N}s_i - \frac{J}{N}[1+\kappa\Phi_p(m)]\sum_{i<j}s_i s_j\right]
\quad \text{(仅代入 $H_N(\mathbf s)$ 的显式表达式)}\\[4pt]
&= \lim_{N\to\infty} \left[-\frac{h}{N}\sum_{i=1}^{N}s_i - \frac{J}{N^{2}}[1+\kappa\Phi_p(m)]\sum_{i<j}s_i s_j\right]
\quad \text{(仅将 $1/N$ 乘入方括号内的每一项)}\\[4pt]
&= \lim_{N\to\infty} \left[-\frac{h}{N}\cdot Nm - \frac{J}{N^{2}}[1+\kappa\Phi_p(m)]\sum_{i<j}s_i s_j\right]
\quad \text{(仅代入 $\sum_{i=1}^{N}s_i = Nm$)}\\[4pt]
&= \lim_{N\to\infty} \left[-hm - \frac{J}{N^{2}}[1+\kappa\Phi_p(m)]\sum_{i<j}s_i s_j\right]
\quad \text{(仅化简系数：$h/N \cdot Nm = hm$)}\\[4pt]
&= \lim_{N\to\infty} \left[-hm - \frac{J}{N^{2}}[1+\kappa\Phi_p(m)]\cdot\frac{1}{2}(N^{2}m^{2}-N)\right]
\quad \text{(仅代入 $\sum_{i<j}s_i s_j = \tfrac12(N^{2}m^{2}-N)$)}\\[4pt]
&= \lim_{N\to\infty} \left[-hm - \frac{J}{2}[1+\kappa\Phi_p(m)]\!\left(m^{2}-\frac{1}{N}\right)\right]
\quad \text{(仅将 $(N^{2}m^{2}-N)$ 逐项除以 $N^{2}$)}\\[4pt]
&= -hm - \frac{J}{2}[1+\kappa\Phi_p(m)]\,m^{2}
\quad \text{(仅取热力学极限 $N\to\infty$，$1/N\to 0$ 项消失)}\\[4pt]
&= -hm - \frac{J}{2}\!\left[m^{2} + \kappa\operatorname{sgn}(m)|m|^{p}\,m^{2}\right]
\quad \text{(仅代入 $\Phi_p^{\mathrm A}(m)=\operatorname{sgn}(m)|m|^{p}$)}\\[4pt]
&= -hm - \frac{J}{2}\!\left[m^{2} + \kappa\,m|m|^{p+1}\right]
\quad \text{(仅使用恒等式 $\operatorname{sgn}(m)|m|^{p}m^{2}=m|m|^{p+1}$)}
\end{aligned}
$$

### A.2 非对称反馈：导数、内部支与折叠点（§4.1）

**A.2.1 能量导数**

$$
\begin{aligned}
\varepsilon'_{\mathrm A}(m)
&= \frac{d}{dm}\!\left[-hm - \frac{J}{2}\!\left(m^{2} + \kappa\,m|m|^{p+1}\right)\right]
\quad \text{(仅对 $\varepsilon_{\mathrm A}(m)$ 表达式求导)}\\[4pt]
&= \frac{d}{dm}(-hm) + \frac{d}{dm}\!\left[-\frac{J}{2}m^{2}\right] + \frac{d}{dm}\!\left[-\frac{J\kappa}{2}\,m|m|^{p+1}\right]
\quad \text{(仅应用导数线性性：和的导数 $=$ 导数的和)}\\[4pt]
&= -h - \frac{J}{2}\cdot 2m - \frac{J\kappa}{2}\cdot\frac{d}{dm}\!\left(m|m|^{p+1}\right)
\quad \text{(仅逐项求导：$\frac{d}{dm}(-hm)=-h$，$\frac{d}{dm}m^{2}=2m$)}\\[4pt]
&= -h - Jm - \frac{J\kappa}{2}\cdot(p+2)|m|^{p+1}
\quad \text{(仅使用恒等式 $\frac{d}{dm}[m|m|^{p+1}]=(p+2)|m|^{p+1}$)}
\end{aligned}
$$

**A.2.2 内部混合支 $g_{\mathrm A}(m)$**

$$
\begin{aligned}
\varepsilon'_{\mathrm A}(m) &= 0
\quad \text{(仅令导数等于零，求极值点)}\\[4pt]
-h - Jm - \frac{J\kappa}{2}(p+2)|m|^{p+1} &= 0
\quad \text{(仅代入 $\varepsilon'_{\mathrm A}(m)$ 的显式结果)}\\[4pt]
h &= -Jm - \frac{J\kappa}{2}(p+2)|m|^{p+1}
\quad \text{(仅将 $-h$ 移到等号右边)}\\[4pt]
h &= -J\!\left[m + A_{p}\,\kappa\,|m|^{p+1}\right]
\quad \text{(仅提取公因子 $-J$，代入 $A_{p} \equiv \frac{p+2}{2}$)}
\end{aligned}
$$

**A.2.3 稳定性斜率 $g'_{\mathrm A}(m)$**

$$
\begin{aligned}
g'_{\mathrm A}(m)
&= \frac{d}{dm}\!\left[-J\!\left(m + A_{p}\kappa|m|^{p+1}\right)\right]
\quad \text{(仅对 $g_{\mathrm A}(m)$ 求导)}\\[4pt]
&= -J\!\left[1 + A_{p}\kappa\cdot\frac{d}{dm}\!\left(|m|^{p+1}\right)\right]
\quad \text{(仅提取常数因子 $-J$，$\frac{d}{dm}m=1$)}\\[4pt]
&= -J\!\left[1 + A_{p}\kappa\cdot(p+1)\operatorname{sgn}(m)|m|^{p}\right]
\quad \text{(仅使用 $\frac{d}{dm}|m|^{p+1}=(p+1)\operatorname{sgn}(m)|m|^{p}$)}\\[4pt]
&= -J\!\left[1 + C_{p}\,\kappa\operatorname{sgn}(m)|m|^{p}\right]
\quad \text{(仅代入 $C_{p}\equiv A_{p}(p+1)=\frac{(p+1)(p+2)}{2}$)}
\end{aligned}
$$

**A.2.4 折叠点 $m_f$**

$$
\begin{aligned}
g'_{\mathrm A}(m_f) &= 0
\quad \text{(仅令导数等于零，求折叠点)}\\[4pt]
-J\!\left[1 + C_{p}\,\kappa\operatorname{sgn}(m_f)|m_f|^{p}\right] &= 0
\quad \text{(仅代入 $g'_{\mathrm A}(m_f)$ 的显式结果)}\\[4pt]
1 + C_{p}\,\kappa\operatorname{sgn}(m_f)|m_f|^{p} &= 0
\quad \text{(仅两边同除以 $-J \neq 0$)}\\[4pt]
C_{p}\,\kappa\operatorname{sgn}(m_f)|m_f|^{p} &= -1
\quad \text{(仅将 $1$ 移到等号右边)}\\[4pt]
-|m_f|^{p} &= -\frac{1}{C_{p}\kappa}
\quad \text{(仅在负支 $m_f<0$ 代入 $\operatorname{sgn}(m_f)=-1$，再两边同除 $C_{p}\kappa$)}\\[4pt]
m_f &= -\left(\frac{1}{C_{p}\kappa}\right)^{1/p}
\quad \text{(仅两边取 $1/p$ 次幂，恢复符号)}
\end{aligned}
$$

**A.2.5 稳定阈值 $\kappa_{\mathrm s}(p)$**

$$
\begin{aligned}
|m_f| &< 1
\quad \text{(仅写出物理约束：折叠点磁化强度绝对值小于 $1$)}\\[4pt]
\left(\frac{1}{C_{p}\kappa}\right)^{1/p} &< 1
\quad \text{(仅代入 $|m_f|$ 的显式表达式)}\\[4pt]
C_{p}\kappa &> 1
\quad \text{(仅两边取 $p$ 次幂后取倒数，不等号反向)}\\[4pt]
\kappa &> \frac{1}{C_{p}} = \frac{2}{(p+1)(p+2)}
\quad \text{(仅代入 $C_{p}=(p+1)(p+2)/2$)}
\end{aligned}
$$

### A.3 Maxwell 构造与混合基态阈值（§4.2-4.3）

**A.3.1 与 $m=+1$ 的能量差 $\Delta_{+}(x)$**

$$
\begin{aligned}
\Delta_{+}(x)
&= \varepsilon_{\mathrm A}(-x) - \varepsilon_{\mathrm A}(1)
\quad \text{(仅定义能量差)}\\[4pt]
&= \left[\frac{J}{2}x^{2} - \frac{J}{2}(p+1)\kappa x^{p+2}\right] - \left[-h - \frac{J}{2}(1+\kappa)\right]
\quad \text{(仅代入两态能量)}\\[4pt]
&= \frac{J}{2}x^{2} - \frac{J}{2}(p+1)\kappa x^{p+2} + h + \frac{J}{2} + \frac{J}{2}\kappa
\quad \text{(仅去掉减号括号，逐项变号)}\\[4pt]
&= \frac{J}{2}x^{2} - \frac{J}{2}(p+1)\kappa x^{p+2} + J[x - A_{p}\kappa x^{p+1}] + \frac{J}{2} + \frac{J}{2}\kappa
\quad \text{(仅代入 $h = h_{x} = J[x - A_{p}\kappa x^{p+1}]$)}\\[4pt]
&= \frac{J}{2}(x^{2} + 2x + 1) + \frac{J}{2}\kappa\!\left(1 - (p+1)x^{p+2} - 2A_{p}x^{p+1}\right)
\quad \text{(仅按是否含 $\kappa$ 分组并提取公因子)}\\[4pt]
&= \frac{J}{2}\!\left[(1+x)^{2} + \kappa\!\left(1 - (p+2)x^{p+1} - (p+1)x^{p+2}\right)\right]
\quad \text{(仅代入 $2A_{p}=p+2$，写 $(x+1)^{2}$)}
\end{aligned}
$$

**A.3.2 Maxwell 曲线 $\kappa_M(x)$**

令 $\Delta_{+}(x)=0$：

$$
\begin{aligned}
(1+x)^{2} + \kappa\!\left(1 - (p+2)x^{p+1} - (p+1)x^{p+2}\right) &= 0
\quad \text{(仅两边同除以 $J/2 \neq 0$)}\\[4pt]
\kappa_M(x) &= \frac{(1+x)^{2}}{(p+2)x^{p+1} + (p+1)x^{p+2} - 1}
\quad \text{(仅移项解出 $\kappa$)}
\end{aligned}
$$

**A.3.3 $\kappa_M(x)$ 的单调性**

定义 $N(x)=(1+x)^{2}$，$D(x)=(p+2)x^{p+1}+(p+1)x^{p+2}-1$：

$$
\begin{aligned}
N'(x) &= 2(1+x)
\quad \text{(仅对分子求导)}\\[4pt]
D'(x) &= (p+2)(p+1)x^{p} + (p+1)(p+2)x^{p+1}
\quad \text{(仅对分母逐项求导)}\\[4pt]
&= (p+1)(p+2)\,x^{p}(1+x)
\quad \text{(仅提取公因子)}\\[4pt]
\kappa'_M(x) &= \frac{2(1+x)D(x) - (1+x)^{3}(p+1)(p+2)x^{p}}{[D(x)]^{2}}
\quad \text{(仅应用商的求导法则并代入)}\\[4pt]
&= -\frac{2(1+x)\,Q_{p}(x)}{x\,[D(x)]^{2}} < 0
\quad \text{(仅代入 $Q_{p}(x)=x^{p}[p^{2}(1+x)^{2}+p(x+1)(x+3)+2]+2>0$)}
\end{aligned}
$$

**A.3.4 混合基态阈值 $\kappa_{\mathrm g}(p)$**

$$
\begin{aligned}
\kappa_{\mathrm g}(p)
&= \lim_{x\to 1^{-}} \kappa_M(x)
\quad \text{(仅定义 $\kappa_{\mathrm g}$ 为 Maxwell 曲线在 $x\to 1^{-}$ 的极限)}\\[4pt]
&= \frac{(1+1)^{2}}{(p+2)\cdot 1^{p+1} + (p+1)\cdot 1^{p+2} - 1}
\quad \text{(仅代入 $x=1$，分母非零可直接求值)}\\[4pt]
&= \frac{4}{2p+2}
\quad \text{(仅计算：分子 $=4$，分母 $=p+2+p+1-1=2p+2$)}\\[4pt]
&= \frac{2}{p+1}
\quad \text{(仅分子分母同除以 $2$)}
\end{aligned}
$$

**A.3.5 比值 $\kappa_{\mathrm g}/\kappa_{\mathrm s}$**

$$
\begin{aligned}
\frac{\kappa_{\mathrm g}(p)}{\kappa_{\mathrm s}(p)}
&= \frac{2/(p+1)}{2/[(p+1)(p+2)]}
\quad \text{(仅代入两阈值的显式结果)}\\[4pt]
&= \frac{2}{p+1} \cdot \frac{(p+1)(p+2)}{2}
\quad \text{(仅将"除以分数"变为"乘以倒数")}\\[4pt]
&= p+2
\quad \text{(仅约去公共因子 $2$ 和 $(p+1)$)}
\end{aligned}
$$

**A.3.6 与 $m=-1$ 的能量差 $\Delta_{-}(x)$ 及其单调性**

$$
\begin{aligned}
\Delta_{-}(x)
&= \varepsilon_{\mathrm A}(-x) - \varepsilon_{\mathrm A}(-1)
\quad \text{(仅定义能量差)}\\[4pt]
&= \left[\frac{J}{2}x^{2} - \frac{J}{2}(p+1)\kappa x^{p+2}\right] - \left[h - \frac{J}{2}(1-\kappa)\right]
\quad \text{(仅代入两态能量)}\\[4pt]
&= \frac{J}{2}\!\left[(1-x)^{2} + \kappa\!\left((p+2)x^{p+1} - (p+1)x^{p+2} - 1\right)\right]
\quad \text{(仅按 $\kappa$ 分组、提取公因子、代入 $2A_{p}=p+2$)}\\[4pt]
\frac{d\Delta_{-}}{dx}
&= -J(1-x) + \frac{J}{2}\kappa\,(p+1)(p+2)\,x^{p}(1-x)
\quad \text{(仅逐项求导并化简)}\\[4pt]
&= J(1-x)(C_{p}\kappa x^{p} - 1)
\quad \text{(仅提取公因子 $J(1-x)$，代入 $C_{p}=\frac{(p+1)(p+2)}{2}$)}\\[4pt]
&> 0 \quad (\forall\,x<1\text{ 在稳定支上})
\quad \text{(仅在稳定支上 $C_{p}\kappa x^{p}>1$，故乘积为正)}\\[4pt]
\therefore\; \Delta_{-}(x) &< \Delta_{-}(1) = 0
\quad \text{(仅由 $\Delta_{-}$ 严格递增且 $\Delta_{-}(1)=0$)}
\end{aligned}
$$

### A.4 对称反馈（§5）

**A.4.1 内部支 $g_{\mathrm S}(m)$ 与稳定性**

$$
\begin{aligned}
\varepsilon_{\mathrm S}(m) &= -hm - \frac{J}{2}m^{2} - \frac{J\kappa}{2}|m|^{p+2}
\quad \text{(仅展开 $\varepsilon_{\mathrm S}$ 的括号)}\\[4pt]
\frac{\partial\varepsilon_{\mathrm S}}{\partial m}
&= -h - Jm - \frac{J\kappa}{2}(p+2)\operatorname{sgn}(m)|m|^{p+1}
\quad \text{(仅逐项求导)}\\[4pt]
&= -h - J[m + A_{p}\kappa\operatorname{sgn}(m)|m|^{p+1}]
\quad \text{(仅提取公因子 $J$，代入 $A_{p}=\frac{p+2}{2}$)}
\end{aligned}
$$

令 $\partial\varepsilon_{\mathrm S}/\partial m = 0$ 得 $h = g_{\mathrm S}(m) = -J[m + A_{p}\kappa\operatorname{sgn}(m)|m|^{p+1}]$。

$$
\begin{aligned}
g'_{\mathrm S}(m)
&= -J[1 + A_{p}\kappa(p+1)|m|^{p}]
\quad \text{(仅对 $g_{\mathrm S}$ 求导，使用 $\frac{d}{dm}[\operatorname{sgn}(m)|m|^{p+1}]=(p+1)|m|^{p}$)}\\[4pt]
&= -J[1 + C_{p}\kappa|m|^{p}]
\quad \text{(仅代入 $C_{p}=A_{p}(p+1)$)}
\end{aligned}
$$

当 $\kappa=-a<0$ 时，稳定条件 $g'_{\mathrm S}(m)>0$ 变为 $C_{p}a|m|^{p}>1$。

**A.4.2 对称负反馈零场混合基态**

$$
\begin{aligned}
\varepsilon_{\mathrm S}(x) &= -\frac{J}{2}x^{2} + \frac{Ja}{2}x^{p+2}
\quad \text{(仅代入 $h=0$, $\kappa=-a$, $x=|m|$)}\\[4pt]
\frac{d\varepsilon_{\mathrm S}}{dx} &= -Jx + \frac{Ja}{2}(p+2)x^{p+1}
\quad \text{(仅逐项求导)}\\[4pt]
&= x[-J + \frac{Ja}{2}(p+2)x^{p}]
\quad \text{(仅提取公因子 $x$)}
\end{aligned}
$$

非零解 $x\neq 0$：

$$
\begin{aligned}
\frac{Ja}{2}(p+2)x^{p} &= J
\quad \text{(仅令方括号内为零并移项)}\\[4pt]
x_{0} &= \left[\frac{2}{a(p+2)}\right]^{1/p}
\quad \text{(仅解出 $x$)}
\end{aligned}
$$

$x_{0}<1$ 等价于 $a > \frac{2}{p+2}$。

### A.5 有限温度平均场（§6.1-6.2）

**A.5.1 对称模型方程状态**

$$
\begin{aligned}
\mathcal F_{\mathrm S}(m) &= -hm - \frac{J}{2}[m^{2}+\kappa|m|^{p+2}] + TI(m)
\quad \text{(原式)}\\[4pt]
\frac{\partial\mathcal F_{\mathrm S}}{\partial m}
&= -h - J[m + A_{p}\kappa\operatorname{sgn}(m)|m|^{p+1}] + T\operatorname{arctanh}m
\quad \text{(仅逐项求导，代入 $I'(m)=\operatorname{arctanh}m$)}
\end{aligned}
$$

令 $\partial\mathcal F_{\mathrm S}/\partial m = 0$ 得方程状态 $h = T\operatorname{arctanh}m - J[m + A_{p}\kappa\operatorname{sgn}(m)|m|^{p+1}]$。

**A.5.2 自旋odal温度**

自旋odal由 $\partial h/\partial m = 0$ 定义：

$$
\begin{aligned}
\frac{\partial h}{\partial m}
&= \frac{T}{1-m^{2}} - J[1 + C_{p}\kappa|m|^{p}]
\quad \text{(仅对方程状态求导，$\frac{d}{dm}\operatorname{arctanh}m=\frac{1}{1-m^{2}}$)}\\[4pt]
\frac{T_{\mathrm{sp}}^{\mathrm S}}{J}
&= (1-m^{2})[1 + C_{p}\kappa|m|^{p}]
\quad \text{(仅令导数为零，解出 $T$)}
\end{aligned}
$$

**A.5.3 Landau 展开**

$$
\begin{aligned}
\mathcal F_{\mathrm S}(m)
&= -hm - \frac{J}{2}m^{2} - \frac{J\kappa}{2}|m|^{p+2} + T[- \ln 2 + \tfrac12 m^{2} + \tfrac{1}{12}m^{4} + \tfrac{1}{30}m^{6} + O(m^{8})]
\quad \text{(仅代入 $I(m)$ 的小 $m$ 展开)}\\[4pt]
&= -T\ln 2 + \frac{T-J}{2}m^{2} + \frac{T}{12}m^{4} + \frac{T}{30}m^{6} - \frac{J\kappa}{2}|m|^{p+2} + \cdots
\quad \text{(仅合并 $m^{2}$ 项：$-\frac{J}{2}m^{2}+\frac{T}{2}m^{2}=\frac{T-J}{2}m^{2}$，令 $h=0$)}
\end{aligned}
$$

### A.6 临界指数（§6.3）

**A.6.1 $0<p<2$ 负反馈：$\beta_{\mathrm{MF}} = 1/p$**

近临界处（$T<J$，$\kappa=-|\kappa|<0$）：

$$
\begin{aligned}
\mathcal F_{\mathrm S} &\simeq \frac{T-J}{2}m^{2} + \frac{J|\kappa|}{2}|m|^{p+2}
\quad \text{(仅保留主导项)}\\[4pt]
\frac{\partial\mathcal F_{\mathrm S}}{\partial m}
&\simeq (T-J)m + \frac{J|\kappa|}{2}(p+2)\operatorname{sgn}(m)|m|^{p+1}
\quad \text{(仅逐项求导)}
\end{aligned}
$$

令导数为零（取 $m>0$）：

$$
\begin{aligned}
(J-T)m &= \frac{J|\kappa|}{2}(p+2)m^{p+1}
\quad \text{(仅将 $(T-J)m = -(J-T)m$ 移项)}\\[4pt]
|m|^{p} &= \frac{2(J-T)}{J|\kappa|(p+2)}
\quad \text{(仅两边同除 $m\cdot J|\kappa|(p+2)/2$)}\\[4pt]
|m| &\propto (J-T)^{1/p}
\quad \text{(仅取 $1/p$ 次幂并写比例关系)}
\end{aligned}
$$

故 $\beta_{\mathrm{MF}} = 1/p$。

**A.6.2 Rushbrooke 等式验证**

$\mathcal F_{\mathrm{min}} \propto (J-T)^{(p+2)/p}$，两次求导得 $C \propto (J-T)^{(2-p)/p}$，故 $\alpha_{\mathrm{MF}} = 1 - 2/p$。
代入 $\gamma_{\mathrm{MF}} = 1$：

$$
\begin{aligned}
\alpha_{\mathrm{MF}} + 2\beta_{\mathrm{MF}} + \gamma_{\mathrm{MF}}
&= \left(1 - \frac{2}{p}\right) + 2\left(\frac{1}{p}\right) + 1
\quad \text{(仅代入三个临界指数)}\\[4pt]
&= 1 - \frac{2}{p} + \frac{2}{p} + 1
\quad \text{(仅计算 $2\cdot\frac{1}{p} = \frac{2}{p}$)}\\[4pt]
&= 2
\quad \text{(仅合并 $-\frac{2}{p} + \frac{2}{p} = 0$，$1+1=2$)}
\end{aligned}
$$

**A.6.3 正反馈弱极限下一级跳变**

$$
\begin{aligned}
\kappa_{\mathrm{coex}} &= \frac{1}{3p}m_{\mathrm j}^{2-p}
\quad \text{(仅取主导项)}\\[4pt]
m_{\mathrm j} &\sim (3p\kappa)^{1/(2-p)}
\quad \text{(仅反解 $m_{\mathrm j}$)}\\[4pt]
\frac{T_{\mathrm{coex}}-J}{J} &\sim \frac{2-p}{6p}(3p\kappa)^{2/(2-p)}
\quad \text{(仅代入 $\tau_{\mathrm{coex}}-1 \simeq \frac{2-p}{6}m_{\mathrm j}^{2}$)}
\end{aligned}
$$

### A.7 三临界点 $p=2$（§6.4）

$$
\begin{aligned}
\mathcal F_{\mathrm S}
&= \frac{T-J}{2}m^{2} + \left(\frac{T}{12} - \frac{J\kappa}{2}\right)m^{4} + \frac{T}{30}m^{6} + \cdots
\quad \text{(仅代入 $p=2$，$|m|^{p+2}=m^{4}$)}\\[4pt]
T_{\mathrm{TCP}} &= J
\quad \text{(仅令二次系数 $\frac{T-J}{2}=0$)}\\[4pt]
\kappa_{\mathrm{TCP}} &= \frac{1}{6}
\quad \text{(仅令四次系数 $\frac{J}{12}-\frac{J\kappa}{2}=0$，代入 $T=J$)}\\[4pt]
\left.\frac{T}{30}\right|_{T=J} &= \frac{J}{30} > 0
\quad \text{(仅验证六次系数为正，TCP 稳定)}
\end{aligned}
$$

### A.8 共存参数式（§6.5）

从零场非零定态条件（$m>0$，$\tau = T/J$）：

$$
\begin{aligned}
\tau L(m) &= m + A_{p}\kappa\, m^{p+1}
\quad \text{(方程状态除以 $J$，$h=0$)}\\[4pt]
\tau\mathcal I(m) &= \tfrac12 m^{2} + \tfrac12\kappa\, m^{p+2}
\quad \text{(积分形式)}
\end{aligned}
$$

从第一式解出 $\kappa = \frac{\tau L(m) - m}{A_{p} m^{p+1}}$，代入第二式：

$$
\begin{aligned}
\tau\mathcal I(m) &= \tfrac12 m^{2} + \frac{\tau L(m) - m}{2A_{p}}m
\quad \text{(仅化简 $m^{p+2}/m^{p+1}=m$)}\\[4pt]
\tau\left[\mathcal I(m) - \frac{m L(m)}{2A_{p}}\right] &= \frac{m^{2}}{2}\left(1 - \frac{1}{A_{p}}\right)
\quad \text{(仅分离含 $\tau$ 与不含 $\tau$ 的项)}
\end{aligned}
$$

代入 $A_{p} = \frac{p+2}{2}$，计算 $1 - 1/A_{p} = \frac{p}{p+2}$：

$$
\begin{aligned}
\tau_{\mathrm{coex}}(m) &= \frac{p\,m^{2}}{2[(p+2)\mathcal I(m) - m L(m)]}
\quad \text{(仅通分化简)}\\[4pt]
\kappa_{\mathrm{coex}}(m) &= \frac{2[\tau_{\mathrm{coex}}(m) L(m) - m]}{(p+2)m^{p+1}}
\quad \text{(仅回代得 $\kappa$)}
\end{aligned}
$$

### A.9 一维精确模型（§7）

**A.9.1 磁化关系反解**

$$
\begin{aligned}
m &= \frac{\sinh H_u}{\sqrt{\sinh^{2} H_u + e^{-4K}}}
\quad \text{(一维 Ising 磁化关系)}\\[4pt]
m^{2} &= \frac{\sinh^{2} H_u}{\sinh^{2} H_u + e^{-4K}}
\quad \text{(仅两边平方，化简根号)}\\[4pt]
m^{2}(S + e^{-4K}) &= S
\quad \text{(仅代入 $S = \sinh^{2} H_u$，两边乘分母)}\\[4pt]
S &= \frac{m^{2} e^{-4K}}{1 - m^{2}}
\quad \text{(仅移项解出 $S$)}\\[4pt]
H_*(m;K) &= \operatorname{arsinh}\!\left(\frac{m\,e^{-2K}}{\sqrt{1 - m^{2}}}\right)
\quad \text{(仅取正平方根，两边取反双曲正弦)}
\end{aligned}
$$

**A.9.2 受限自由能（Legendre 变换）**

$$
\begin{aligned}
\beta\phi(m;J) &= \sup_{u}\{m u - \ln\lambda_{+}(K, u)\}
\quad \text{(仅写出 Legendre 变换定义)}\\[4pt]
&= m H_*(m;K) - \ln\lambda_{+}(K, H_*(m;K))
\quad \text{(仅在驻点 $u=H_*$ 处取值)}
\end{aligned}
$$

**A.9.3 小 $m$ 展开**

记 $a = e^{-2K}$：

$$
\begin{aligned}
\beta[\phi(m;J) - \phi(0;J)]
&= \frac{a}{2}m^{2} + \frac{3a - a^{3}}{24}m^{4} + O(m^{6})
\quad \text{(仅展开 $\operatorname{arsinh}$, $\cosh$, $\sqrt{\cdot}$ 到 $m^{4}$ 并合并)}\\[4pt]
&= \frac{e^{-2K}}{2}m^{2} + \frac{3e^{4K} - 1}{24e^{6K}}m^{4} + O(m^{6})
\quad \text{(仅回代 $a = e^{-2K}$)}
\end{aligned}
$$

**A.9.4 零磁化背景自由能的 $|m|^{p}$ 项**

$$
\begin{aligned}
K(m) &= K_{0}(1 + \kappa|m|^{p})
\quad \text{(仅代入 $J(m)=J_{0}(1+\kappa|m|^{p})$)}\\[4pt]
f(K) &= -\ln(2\cosh K)
\quad \text{(仅定义 $f(K)$)}\\[4pt]
f(K(m)) &= f(K_{0}) + f'(K_{0})(K(m)-K_{0}) + \cdots
\quad \text{(仅在 $K_{0}$ 处做一阶 Taylor 展开)}\\[4pt]
&= -\ln(2\cosh K_{0}) - \tanh K_{0}\cdot K_{0}\kappa|m|^{p} + \cdots
\quad \text{(仅代入 $f'(K)=-\tanh K$，$K(m)-K_{0}=K_{0}\kappa|m|^{p}$)}
\end{aligned}
$$

这表明一维自由能中反馈首先在 $|m|^{p}$ 阶进入——与平均场中反馈只在 $|m|^{p+2}$ 阶进入有本质区别。

### A.10 有限维 Monte Carlo 精确能量差（§8）

翻转第 $k$ 个自旋：$s'_{k} = -s_{k}$，$M' = M - 2s_{k}$，$m' = m - \frac{2s_{k}}{N}$，$B' = B - 2b_{k}$。

$$
\begin{aligned}
\Delta E &= H' - H
\quad \text{(仅定义能量差)}\\[4pt]
&= [-J(m')B' - hM'] - [-J(m)B - hM]
\quad \text{(仅代入翻转前后的 Hamiltonian)}\\[4pt]
&= -J(m')B' + J(m)B - h(M' - M)
\quad \text{(仅去括号)}\\[4pt]
&= -J(m')(B - 2b_{k}) + J(m)B + 2h s_{k}
\quad \text{(仅代入 $B'=B-2b_{k}$，$M'-M=-2s_{k}$)}\\[4pt]
&= -J(m')B + 2J(m')b_{k} + J(m)B + 2h s_{k}
\quad \text{(仅分配 $-J(m')$ 于 $(B-2b_{k})$)}\\[4pt]
&= [J(m) - J(m')]B + 2J(m')b_{k} + 2h s_{k}
\quad \text{(仅将 $J(m)B - J(m')B$ 合并)}
\end{aligned}
$$

第一项 $[J(m)-J(m')]B$ 虽然 $J(m)-J(m') = O(1/N)$，但 $B = O(N)$，乘积为 $O(1)$，不可忽略——这反映了全局反馈的实质：单次翻转通过改变 $m$ 进而改变所有键的耦合强度。

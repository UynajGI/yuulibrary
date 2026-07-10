---
title: "自旋-玻色模型的相干态路径积分"
description: "从玻色相干态与自旋相干态出发，把线性自旋-玻色耦合的配分函数写成联合路径积分，精确积掉玻色场得到只含自旋的有效作用量；再代入 Rabi、Jaynes-Cummings、XXZ 三类耦合与单模/谱函数两种浴结构，逐个得到推迟自旋作用量与传播子对称化判据"
date: 2026-07-10
author: "学习笔记"
source_type: "综合笔记"
source_title: "自旋-玻色模型相干态路径积分推导"
tags: ["路径积分", "相干态", "自旋-玻色模型", "Berry相", "推迟相互作用", "谱函数"]
weight: 5
---

## 0. 这篇笔记在做什么

线性自旋-玻色耦合模型是量子耗散、量子光学（Rabi、Jaynes–Cummings）和量子磁性（XXZ spin-boson）的共同框架。它的核心结构可以一句话概括：一个（或少数几个）自旋自由度，通过一个对玻色算符**线性**的耦合项，与一个自由玻色浴相互作用。

对这种模型，有一条解析上完全严格的化简路线：**用玻色相干态和自旋相干态把配分函数写成联合路径积分，然后把所有玻色自由度高斯积掉**，得到一个只含自旋相干态变量、但带有长程虚时间相互作用的"有效自旋理论"。本文按这条路线完整推导一遍，不做任何模型特殊化；最后再把 $\hat\varrho_\mu$ 分别代入 Rabi、JC、XXZ，看看三类耦合如何给出不同的有效作用量。

为什么这件事值得单独写一篇？因为整条推导只依赖两个条件——$\hat H_{\mathrm b}$ 对玻色场是二次型、$\hat H_{\mathrm{sb}}$ 对 $\hat a_\mu,\hat a_\mu^\dagger$ 是线性的——只要满足这两个条件，浴积分就能解析完成。剩下真正决定模型差异的只有一个判据：耦合算符 $\hat\varrho_\mu$ 是不是厄米的（$\hat\varrho_\mu^\dagger=\hat\varrho$ 还是 $\hat\varrho_\mu^\dagger\neq\hat\varrho_\mu$）。这个判据决定了玻色传播子能否对称化，进而决定了有效自旋作用量的结构。

---

## 1. 通用模型

### 1.1 哈密顿量

考虑一般的线性自旋-玻色耦合模型

$$
\boxed{
\hat H
=
\hat H_{\mathrm s}
+
\sum_\mu \omega_\mu \hat a_\mu^\dagger\hat a_\mu
+
\sum_\mu
\left(
\hat a_\mu^\dagger\hat\varrho_\mu
+
\hat\varrho_\mu^\dagger \hat a_\mu
\right)
}
$$

其中：

- $\hat H_{\mathrm s}$ 是只作用于自旋 Hilbert 空间的任意哈密顿量（如 Zeeman 项、自旋间交换）；
- $\hat H_{\mathrm b}=\sum_\mu\omega_\mu\hat a_\mu^\dagger\hat a_\mu$ 是自由玻色浴，$\mu$ 可标记离散模式或连续谱指标；
- $\hat\varrho_\mu=\hat\varrho_\mu[\hat{\mathbf J}]$ 是只作用于自旋空间、含耦合常数的算符，**不要求其为厄米算符**。

由于玻色算符与自旋算符作用于不同的 Hilbert 空间，

$$
[\hat a_\mu,\hat\varrho_\nu]
=
[\hat a_\mu^\dagger,\hat\varrho_\nu]
=
0.
$$

我们的目标是同时插入玻色相干态和自旋相干态，把配分函数写成联合路径积分，然后精确积掉玻色场，得到只含自旋相干态变量的配分函数。

---

## 2. 两类相干态

### 2.1 玻色相干态

对每个玻色模式 $\mu$，采用归一化相干态

$$
|\phi_\mu\rangle
=
e^{-|\phi_\mu|^2/2}
e^{\phi_\mu\hat a_\mu^\dagger}|0\rangle ,
$$

它满足本征值方程 $\hat a_\mu|\phi_\mu\rangle=\phi_\mu|\phi_\mu\rangle$ 以及完备性关系

$$
\boxed{
\int_{\mathbb C}
\frac{d^2\phi_\mu}{\pi}
|\phi_\mu\rangle\langle\phi_\mu|
=
\hat{\mathbb 1}_{\mu}.
}
$$

相干态重叠为

$$
\boxed{
\langle\phi_\mu'|\phi_\mu\rangle
=
\exp\left[
-\frac12|\phi_\mu'|^2
-\frac12|\phi_\mu|^2
+
\bar\phi_\mu'\phi_\mu
\right].
}
$$

所有玻色模式的联合相干态记为 $|\boldsymbol\phi\rangle=\bigotimes_\mu|\phi_\mu\rangle$。

### 2.2 自旋相干态

采用由最高权重态生成的自旋相干态（自旋量子数 $S$）

$$
\boxed{
|z\rangle
=
\frac{1}{(1+|z|^2)^S}
e^{z\hat J_-}|S,S\rangle ,
\qquad z\in\mathbb C .
}
$$

其完备性关系为

$$
\boxed{
\frac{2S+1}{\pi}
\int_{\mathbb C}
\frac{d^2z}{(1+|z|^2)^2}
|z\rangle\langle z|
=
\hat{\mathbb 1}_{\mathrm s},
}
$$

其中 $d^2z=d(\operatorname{Re}z)\,d(\operatorname{Im}z)$。

两个自旋相干态的重叠为

$$
\boxed{
\langle z'|z\rangle
=
\frac{(1+\bar z' z)^{2S}}
{(1+|z'|^2)^S(1+|z|^2)^S}.
}
$$

需要注意，自旋相干态**并非任意两态都不正交**。当 $1+\bar z' z=0$ 时，它们对应 Bloch 球上的对跖点，重叠为零。但路径积分真正依赖的是相邻时间片的光滑性：只要 $z_{j+1}-z_j=O(\varepsilon)$，就有 $\langle z_{j+1}|z_j\rangle\to 1$，并不要求所有自旋相干态之间的重叠都非零。这正是路径积分只在相邻时间片上做短时间展开、而非同时对比相距很远的两个态的原因。

---

## 3. 配分函数的时间切片

有限温度配分函数为 $Z=\operatorname{Tr}e^{-\beta\hat H}$。将虚时间区间分成 $M$ 片，步长 $\varepsilon=\beta/M$，$\tau_j=j\varepsilon$。在每个时间片同时插入自旋相干态和所有玻色模式的相干态完备性关系：

$$
\begin{aligned}
Z
={}&
\lim_{M\to\infty}
\int
\prod_{j=0}^{M-1}
\left[
\frac{2S+1}{\pi}
\frac{d^2z_j}{(1+|z_j|^2)^2}
\prod_\mu
\frac{d^2\phi_{\mu,j}}{\pi}
\right]
\\
&\times
\prod_{j=0}^{M-1}
\left\langle
z_{j+1},\boldsymbol\phi_{j+1}
\left|
e^{-\varepsilon\hat H}
\right|
z_j,\boldsymbol\phi_j
\right\rangle .
\end{aligned}
$$

由于这里计算的是迹，边界条件为周期性：

$$
z_M=z_0,
\qquad
\phi_{\mu,M}=\phi_{\mu,0}.
$$

对短时间传播子展开 $e^{-\varepsilon\hat H}=1-\varepsilon\hat H+O(\varepsilon^2)$，于是

$$
\begin{aligned}
&
\left\langle
z_{j+1},\boldsymbol\phi_{j+1}
\left|
e^{-\varepsilon\hat H}
\right|
z_j,\boldsymbol\phi_j
\right\rangle
\\
&\quad =
\langle z_{j+1}|z_j\rangle
\prod_\mu
\langle\phi_{\mu,j+1}|\phi_{\mu,j}\rangle
\\
&\qquad\times
\exp\left[
-\varepsilon H_{j+1,j}
+O(\varepsilon^2)
\right],
\end{aligned}
$$

其中

$$
H_{j+1,j}
\equiv
\frac{
\langle z_{j+1},\boldsymbol\phi_{j+1}|
\hat H
|z_j,\boldsymbol\phi_j\rangle
}{
\langle z_{j+1}|z_j\rangle
\prod_\mu
\langle\phi_{\mu,j+1}|\phi_{\mu,j}\rangle
}
$$

是短时间片上的**相干态协变符号**（covariant symbol）——即算符在"非正交、过完备"相干态基底下、扣除了态重叠后的矩阵元。它是路径积分作用量中直接出现的量。

---

## 4. 保留一般 $\hat\varrho_\mu$ 的协变符号

### 4.1 纯自旋与耦合算符的协变符号

定义纯自旋哈密顿量的协变符号

$$
h_{\mathrm s}^{j+1,j}
\equiv
\frac{
\langle z_{j+1}|
\hat H_{\mathrm s}
|z_j\rangle
}{
\langle z_{j+1}|z_j\rangle
},
$$

对耦合算符定义

$$
\boxed{
\varrho_\mu^{j+1,j}
\equiv
\frac{
\langle z_{j+1}|
\hat\varrho_\mu
|z_j\rangle
}{
\langle z_{j+1}|z_j\rangle
},
\qquad
\varrho_\mu^{\dagger,j+1,j}
\equiv
\frac{
\langle z_{j+1}|
\hat\varrho_\mu^\dagger
|z_j\rangle
}{
\langle z_{j+1}|z_j\rangle
}.
}
$$

这里的上标 $\dagger$ 表示"算符 $\hat\varrho_\mu^\dagger$ 的协变符号"。**关键提醒**：在离散时间表达式中，一般不能直接写成 $\varrho_\mu^{\dagger,j+1,j}=\left(\varrho_\mu^{j+1,j}\right)^*$，因为 bra 与 ket 位于不同的时间片（$j+1$ 与 $j$），只有连续极限且取同一时刻时，复共轭关系才恢复。

### 4.2 玻色相干态的矩阵元

玻色相干态把 $\hat a$、$\hat a^\dagger$ 分别替换为左右两个时间片上的复数：

$$
\frac{\langle\phi_{\mu,j+1}|\hat a_\mu|\phi_{\mu,j}\rangle}{\langle\phi_{\mu,j+1}|\phi_{\mu,j}\rangle}
=\phi_{\mu,j},
\qquad
\frac{\langle\phi_{\mu,j+1}|\hat a_\mu^\dagger|\phi_{\mu,j}\rangle}{\langle\phi_{\mu,j+1}|\phi_{\mu,j}\rangle}
=\bar\phi_{\mu,j+1},
$$

以及 $\langle\hat a_\mu^\dagger\hat a_\mu\rangle=\bar\phi_{\mu,j+1}\phi_{\mu,j}$。所以

$$
\boxed{
\begin{aligned}
H_{j+1,j}
={}&
h_{\mathrm s}^{j+1,j}
+
\sum_\mu
\omega_\mu
\bar\phi_{\mu,j+1}\phi_{\mu,j}
\\
&+
\sum_\mu
\left[
\bar\phi_{\mu,j+1}
\varrho_\mu^{j+1,j}
+
\varrho_\mu^{\dagger,j+1,j}
\phi_{\mu,j}
\right].
\end{aligned}
}
$$

到这里为止，**没有对 $\hat\varrho_\mu$ 作任何模型特殊化**。

---

## 5. 两类几何（Berry）项

相干态重叠在连续极限下会贡献一阶时间导数项——这就是几何项或 Berry 项。

### 5.1 玻色相干态的几何项

令 $\phi_{\mu,j+1}=\phi_\mu(\tau_j)+\varepsilon\dot\phi_\mu(\tau_j)$。相邻玻色相干态的重叠展开为

$$
-\ln
\langle\phi_{\mu,j+1}|\phi_{\mu,j}\rangle
=
\frac{\varepsilon}{2}
\left(
\bar\phi_\mu\dot\phi_\mu
-
\dot{\bar\phi}_\mu\phi_\mu
\right)
+
O(\varepsilon^2).
$$

因此每个玻色模式产生一个一阶时间导数项：

$$
S_{\mathrm B,\mu}^{\mathrm{bos}}
=
\frac12
\int_0^\beta d\tau
\left(
\bar\phi_\mu\dot\phi_\mu
-
\dot{\bar\phi}_\mu\phi_\mu
\right).
$$

由于玻色场满足周期边界条件，$\int_0^\beta d\tau\,\partial_\tau(\bar\phi_\mu\phi_\mu)=0$，所以也可等价地写成

$$
\boxed{
S_{\mathrm B,\mu}^{\mathrm{bos}}
=
\int_0^\beta d\tau\,
\bar\phi_\mu\partial_\tau\phi_\mu .
}
$$

### 5.2 自旋 Berry 项

令 $z_{j+1}=z_j+\varepsilon\dot z_j$。从自旋相干态重叠得到

$$
-\ln\langle z_{j+1}|z_j\rangle
=
\varepsilon S
\frac{
\bar z\dot z-\dot{\bar z}z
}{
1+\bar z z
}
+
O(\varepsilon^2).
$$

因此自旋几何项为

$$
\boxed{
S_{\mathrm B}^{\mathrm{spin}}[\bar z,z]
=
S\int_0^\beta d\tau\,
\frac{
\bar z\dot z-\dot{\bar z}z
}{
1+\bar z z
}.
}
$$

这个量是纯虚数。在 Bloch 球语言中，记自旋相干态对应的单位向量为 $\mathbf n(\tau)$（北极 $z=0$、南极 $z\to\infty$），它可以写成

$$
S_{\mathrm B}^{\mathrm{spin}}
=
iS\,\mathcal A[\mathbf n],
$$

其中 $\mathcal A[\mathbf n]$ 是闭合路径 $\mathbf n(\tau)$ 在单位球面上所围的**有向立体角**。整体正负号依赖于生成约定（$e^{zJ_-}|S,S\rangle$ 还是 $e^{zJ_+}|S,-S\rangle$）以及所选的局部规范。

**需要纠正一个常见误解**：一般闭合路径的立体角并不是 $4\pi k$。任意闭合曲线都可以围出连续取值的立体角。只有使用不同曲面填充**同一条**闭合曲线时，两种立体角之间的差才是 $4\pi k$（$k\in\mathbb Z$）。因此自旋 Berry 相一般不能直接忽略——它贡献的是纯虚相位，会真实地影响配分函数的干涉结构。

---

## 6. 联合自旋-玻色路径积分

### 6.1 连续极限作用量

在连续极限中定义对角协变符号（同一时间片）

$$
h_{\mathrm s}(\bar z,z)
=
\frac{\langle z|\hat H_{\mathrm s}|z\rangle}{\langle z|z\rangle},
\qquad
\varrho_\mu(\bar z,z)
=
\frac{\langle z|\hat\varrho_\mu|z\rangle}{\langle z|z\rangle},
\qquad
\varrho_\mu^\dagger(\bar z,z)
=
\frac{\langle z|\hat\varrho_\mu^\dagger|z\rangle}{\langle z|z\rangle}.
$$

这里仅把自旋算符写成相干态协变符号，没有指定 $\hat\varrho_\mu$ 的具体形式。于是配分函数成为

$$
\boxed{
Z
=
\int_{\mathrm{PBC}}
\mathcal D\mu_S[\bar z,z]\,
\prod_\mu
\mathcal D[\bar\phi_\mu,\phi_\mu]\,
e^{-S[\bar z,z,\bar\phi,\phi]}
}
$$

其中作用量为

$$
\boxed{
\begin{aligned}
S
={}&
S_{\mathrm B}^{\mathrm{spin}}[\bar z,z]
+
\int_0^\beta d\tau\,
h_{\mathrm s}(\bar z,z)
\\
&+
\sum_\mu
\int_0^\beta d\tau\,
\bar\phi_\mu
(\partial_\tau+\omega_\mu)
\phi_\mu
\\
&+
\sum_\mu
\int_0^\beta d\tau
\left[
\bar\phi_\mu(\tau)
\varrho_\mu(\tau)
+
\varrho_\mu^\dagger(\tau)
\phi_\mu(\tau)
\right].
\end{aligned}
}
$$

### 6.2 玻色部分是高斯型

为简化记号，定义 $L_\mu\equiv \partial_\tau+\omega_\mu$，则玻色模式 $\mu$ 的作用量为

$$
\boxed{
S_{\mathrm b,\mu}
=
\int_0^\beta d\tau
\left[
\bar\phi_\mu L_\mu\phi_\mu
+
\bar\phi_\mu\varrho_\mu
+
\varrho_\mu^\dagger\phi_\mu
\right].
}
$$

关键观察：**每个玻色模式都只以二次型和线性源项出现**。其中 $\varrho_\mu,\varrho_\mu^\dagger$ 对玻色积分而言只是外部源（它们是 $z(\tau)$ 的函数）。因此玻色路径积分是严格的高斯泛函积分，可以解析完成。

---

## 7. 精确积去玻色相干态

这是全文最关键的一步：把每个玻色模式的高斯积分做掉。

### 7.1 配平方

把 $S_{\mathrm b,\mu}$ 写成算符矩阵记号（省略虚时间积分）：

$$
S_{\mathrm b,\mu}
=
\bar\phi_\mu L_\mu\phi_\mu
+
\bar\phi_\mu\varrho_\mu
+
\varrho_\mu^\dagger\phi_\mu.
$$

作变量平移

$$
\widetilde\phi_\mu
=
\phi_\mu
+
L_\mu^{-1}\varrho_\mu,
\qquad
\widetilde{\bar\phi}_\mu
=
\bar\phi_\mu
+
\varrho_\mu^\dagger L_\mu^{-1}.
$$

验证配平方：

$$
\begin{aligned}
\widetilde{\bar\phi}_\mu
L_\mu
\widetilde\phi_\mu
={}&
\left(
\bar\phi_\mu
+
\varrho_\mu^\dagger L_\mu^{-1}
\right)
L_\mu
\left(
\phi_\mu
+
L_\mu^{-1}\varrho_\mu
\right)
\\
={}&
\bar\phi_\mu L_\mu\phi_\mu
+
\bar\phi_\mu\varrho_\mu
+
\varrho_\mu^\dagger\phi_\mu
+
\varrho_\mu^\dagger
L_\mu^{-1}
\varrho_\mu .
\end{aligned}
$$

前三项正是原来的 $S_{\mathrm b,\mu}$，因此

$$
\boxed{
S_{\mathrm b,\mu}
=
\widetilde{\bar\phi}_\mu
L_\mu
\widetilde\phi_\mu
-
\varrho_\mu^\dagger
L_\mu^{-1}
\varrho_\mu .
}
$$

### 7.2 定义逆核（玻色传播子）

定义周期边界条件下 $L_\mu$ 的逆核

$$
D_\mu(\tau-\tau')
\equiv
L_\mu^{-1}(\tau,\tau'),
$$

满足

$$
\boxed{
(\partial_\tau+\omega_\mu)
D_\mu(\tau-\tau')
=
\delta_\beta(\tau-\tau'),
}
$$

其中 $\delta_\beta$ 是周期为 $\beta$ 的 delta 函数。恢复虚时间积分，作用量写成

$$
\boxed{
\begin{aligned}
S_{\mathrm b,\mu}
={}&
\int_0^\beta d\tau\,
\widetilde{\bar\phi}_\mu(\tau)
L_\mu
\widetilde\phi_\mu(\tau)
\\
&-
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
\varrho_\mu^\dagger(\tau)
D_\mu(\tau-\tau')
\varrho_\mu(\tau').
\end{aligned}
}
$$

### 7.3 完成高斯积分

平移变换的 Jacobian 为常数 $1$，所以 $\mathcal D[\bar\phi_\mu,\phi_\mu]=\mathcal D[\widetilde{\bar\phi}_\mu,\widetilde\phi_\mu]$。因此

$$
\begin{aligned}
&\int
\mathcal D[\bar\phi_\mu,\phi_\mu]\,
e^{-S_{\mathrm b,\mu}}
\\
&=
\exp\left[
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
\varrho_\mu^\dagger(\tau)
D_\mu(\tau-\tau')
\varrho_\mu(\tau')
\right]
\\
&\qquad\times
\int
\mathcal D[\widetilde{\bar\phi}_\mu,\widetilde\phi_\mu]\,
\exp\left[
-\int_0^\beta d\tau\,
\widetilde{\bar\phi}_\mu
L_\mu
\widetilde\phi_\mu
\right].
\end{aligned}
$$

第二个积分正是自由玻色模式的配分函数

$$
Z_{\mathrm b,\mu}^{(0)}
\equiv
\int
\mathcal D[\bar\phi_\mu,\phi_\mu]\,
\exp\left[
-\int_0^\beta d\tau\,
\bar\phi_\mu
(\partial_\tau+\omega_\mu)
\phi_\mu
\right],
$$

其结果为熟知的 Planck 因子

$$
\boxed{
Z_{\mathrm b,\mu}^{(0)}
=
\frac{1}{1-e^{-\beta\omega_\mu}}.
}
$$

所以

$$
\boxed{
\begin{aligned}
&\int
\mathcal D[\bar\phi_\mu,\phi_\mu]\,
e^{-S_{\mathrm b,\mu}}
\\
&=
Z_{\mathrm b,\mu}^{(0)}
\exp\left[
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
\varrho_\mu^\dagger(\tau)
D_\mu(\tau-\tau')
\varrho_\mu(\tau')
\right].
\end{aligned}
}
$$

所有玻色模式相乘：

$$
\boxed{
Z_{\mathrm b}^{(0)}
=
\prod_\mu
\frac{1}{1-e^{-\beta\omega_\mu}}.
}
$$

---

## 8. 积去玻色子后的有效自旋作用量

将所有模式的高斯积分结果代回，得到只含自旋相干态变量的配分函数：

$$
\boxed{
\begin{aligned}
Z
={}&
Z_{\mathrm b}^{(0)}
\int_{\mathrm{PBC}}
\mathcal D\mu_S[\bar z,z]\,
\\
&\times
\exp\Bigg[
-
S_{\mathrm B}^{\mathrm{spin}}[\bar z,z]
-
\int_0^\beta d\tau\,
h_{\mathrm s}(\bar z,z)
\\
&\qquad
+
\sum_\mu
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
\varrho_\mu^\dagger(\tau)
D_\mu(\tau-\tau')
\varrho_\mu(\tau')
\Bigg].
\end{aligned}
}
$$

等价地写成

$$
\boxed{
Z
=
Z_{\mathrm b}^{(0)}
\int_{\mathrm{PBC}}
\mathcal D\mu_S[\bar z,z]\,
e^{-S_{\mathrm{eff}}[\bar z,z]}
}
$$

其中有效作用量为

$$
\boxed{
\begin{aligned}
S_{\mathrm{eff}}[\bar z,z]
={}&
S_{\mathrm B}^{\mathrm{spin}}[\bar z,z]
+
\int_0^\beta d\tau\,
h_{\mathrm s}(\bar z,z)
\\
&-
\sum_\mu
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
\varrho_\mu^\dagger(\tau)
D_\mu(\tau-\tau')
\varrho_\mu(\tau').
\end{aligned}
}
$$

这就是一般线性自旋-玻色耦合模型，同时采用玻色相干态和自旋相干态后，精确积分掉玻色场所得到的配分函数。它的物理含义很清楚：

- 自旋仍然带着 Berry 相 $S_{\mathrm B}^{\mathrm{spin}}$ 和纯自旋能量 $\int h_{\mathrm s}$；
- 玻色浴的效应被压缩为连接两个虚时间点的**记忆核** $D_\mu(\tau-\tau')$，夹在 $\varrho_\mu^\dagger(\tau)$ 和 $\varrho_\mu(\tau')$ 之间；
- 因为 $\tau,\tau'$ 独立取遍 $[0,\beta)$，这是一个**双时间、非局域**的推迟相互作用——浴的记忆使自旋在虚时间上产生长程关联。

---

## 9. 玻色传播子的形式

### 9.1 分段形式

由定义 $D_\mu(\tau-\tau')=(\partial_\tau+\omega_\mu)^{-1}$，对 $-\beta<\tau<\beta$，传播子为

$$
\boxed{
D_\mu(\tau)
=
\begin{cases}
\left[1+n_B(\omega_\mu)\right]
e^{-\omega_\mu\tau},
&
0<\tau<\beta,
\\[6pt]
n_B(\omega_\mu)
e^{-\omega_\mu\tau},
&
-\beta<\tau<0,
\end{cases}
}
$$

其中 $n_B(\omega)=1/(e^{\beta\omega}-1)$ 是 Bose 分布。对负时间 $\tau<0$，因为 $-\omega_\mu\tau=\omega_\mu|\tau|$，第二支也可写成 $D_\mu(\tau)=n_B(\omega_\mu)e^{\omega_\mu|\tau|}$。

### 9.2 KMS 周期性

传播子满足玻色 KMS 周期条件

$$
\boxed{
D_\mu(\tau+\beta)
=
D_\mu(\tau).
}
$$

也可以写成模 $\beta$ 的形式。定义 $\tau_\beta=\tau\bmod\beta$，$0\le\tau_\beta<\beta$，则

$$
\boxed{
D_\mu(\tau)
=
\frac{
e^{-\omega_\mu\tau_\beta}
}{
1-e^{-\beta\omega_\mu}
}.
}
$$

注意传播子是**有方向的**：一般地 $D_\mu(\tau-\tau')\neq D_\mu(\tau'-\tau)$。这个方向性来自玻色相干态几何项 $\bar\phi\,\partial_\tau\phi$ 的一阶导数结构——下一节会看到，它决定了能否对称化。

---

## 10. 传播子的对称化判据

### 10.1 一般情形：不能随意对称化

当 $\hat\varrho_\mu\neq\hat\varrho_\mu^\dagger$ 时，有效作用量中的结构必须保持为

$$
\boxed{
\varrho_\mu^\dagger(\tau)
D_\mu(\tau-\tau')
\varrho_\mu(\tau').
}
$$

这里的传播子是有方向的：$D_\mu(\tau-\tau')\neq D_\mu(\tau'-\tau)$ 一般成立。因此**不能**直接将其替换为偶函数核 $D_{\mu,+}(\tau-\tau')$。

### 10.2 厄米耦合：可以对称化

只有在厄米耦合情形 $\hat\varrho_\mu^\dagger=\hat\varrho_\mu$ 下，且连续路径积分中的 $\varrho_\mu(\tau)$ 是可交换的 c-number 函数，才可以利用积分变量交换 $\tau\leftrightarrow\tau'$ 进行对称化。此时

$$
\begin{aligned}
I_\mu
&=
\int d\tau d\tau'\,
\varrho_\mu(\tau)
D_\mu(\tau-\tau')
\varrho_\mu(\tau')
\\
&=
\int d\tau d\tau'\,
\varrho_\mu(\tau)
D_\mu(\tau'-\tau)
\varrho_\mu(\tau'),
\end{aligned}
$$

两式相加除以 $2$：

$$
\boxed{
I_\mu
=
\int d\tau d\tau'\,
\varrho_\mu(\tau)
D_{\mu,+}(\tau-\tau')
\varrho_\mu(\tau')
}
$$

其中对称传播子定义为

$$
\boxed{
D_{\mu,+}(\Delta\tau)
=
\frac12
\left[
D_\mu(\Delta\tau)
+
D_\mu(-\Delta\tau)
\right].
}
$$

代入 $D_\mu$ 的分段形式，对 $0\le|\Delta\tau|_\beta\le\beta$ 有

$$
\boxed{
D_{\mu,+}(\Delta\tau)
=
\frac{
\cosh\left[
\omega_\mu
\left(
\frac{\beta}{2}
-
|\Delta\tau|_\beta
\right)
\right]
}{
2\sinh(\beta\omega_\mu/2)
}.
}
$$

### 10.3 文献中两种写法的关系

如果另行定义 $D_{0,\mu}\equiv 2D_{\mu,+}$，则

$$
\boxed{
D_{0,\mu}(\Delta\tau)
=
\frac{
\cosh\left[
\omega_\mu
\left(
\frac{\beta}{2}
-
|\Delta\tau|_\beta
\right)
\right]
}{
\sinh(\beta\omega_\mu/2)
}.
}
$$

相应地，有效作用量必须写成

$$
\int\varrho_\mu D_{\mu,+}\varrho_\mu
=
\frac12
\int\varrho_\mu D_{0,\mu}\varrho_\mu .
$$

所以文献中常见的两种写法——$D_+={\cosh}/{(2\sinh)}$ 与 $D_0={\cosh}/{\sinh}$——并不矛盾。区别只是因子 $1/2$ 放在核内部还是作用量外部。

---

## 11. Berry 项的个数

在积去玻色场之前，联合路径积分中的几何项为

$$
\boxed{
S_{\mathrm{geom}}
=
S_{\mathrm B}^{\mathrm{spin}}
+
\sum_\mu
S_{\mathrm B,\mu}^{\mathrm{bos}}
=
S\int_0^\beta d\tau\,
\frac{
\bar z\dot z-\dot{\bar z}z
}{
1+\bar z z
}
+
\sum_\mu
\int_0^\beta d\tau\,
\bar\phi_\mu\dot\phi_\mu .
}
$$

形式上，对于一个自旋和 $N_{\mathrm b}$ 个玻色模式，有 $1+N_{\mathrm b}$ 个一阶时间导数几何项。但需要区分它们的性质：

- 自旋项 $S_{\mathrm B}^{\mathrm{spin}}=iS\mathcal A[\mathbf n]$ 是 Bloch 球上的 Berry/Wess–Zumino 项，具有立体角和规范拼接结构；
- 玻色项 $S_{\mathrm B,\mu}^{\mathrm{bos}}=\int\bar\phi_\mu\partial_\tau\phi_\mu$ 是玻色相空间的辛几何项。它虽然也来自相干态重叠，但通常不把每个玻色模式的该项单独称为一个拓扑 Berry 相。

积去玻色场以后，玻色几何项不再显式出现，而是被编码进 $D_\mu=(\partial_\tau+\omega_\mu)^{-1}$ 之中。也就是说，以下性质都源于玻色相干态的一阶导数项：$D_\mu(\tau-\tau')$ 的时间方向性（$D_\mu(\tau)\neq D_\mu(-\tau)$）、它的分段结构、以及 $D_\mu(\tau+\beta)=D_\mu(\tau)$ 的 KMS 周期性。

因此积去玻色场后的纯自旋有效配分函数中，**显式剩下的几何项只有 $S_{\mathrm B}^{\mathrm{spin}}$**。

---

## 12. 何时代入具体的 $\hat\varrho_\mu$

推导到

$$
\boxed{
S_{\mathrm{eff}}
=
S_{\mathrm B}^{\mathrm{spin}}
+
\int h_{\mathrm s}
-
\sum_\mu
\iint
\varrho_\mu^\dagger(\tau)
D_\mu(\tau-\tau')
\varrho_\mu(\tau')
}
$$

之后，才需要根据具体模型指定 $\hat\varrho_\mu$。在此之前，整个推导只需要两个条件：$\hat H_{\mathrm b}$ 对玻色场是二次型，以及 $\hat H_{\mathrm{sb}}$ 对 $\hat a_\mu,\hat a_\mu^\dagger$ 是线性的。

还需要注意，对于非线性的自旋算符 $\hat\varrho_\mu$，不能简单执行 $\hat{\mathbf J}\to S\mathbf n$ 这种形式替换。严格对象始终是相干态协变符号

$$
\boxed{
\varrho_\mu(\bar z,z)
=
\frac{
\langle z|\hat\varrho_\mu|z\rangle
}{
\langle z|z\rangle
}.
}
$$

只有当 $\hat\varrho_\mu$ 对自旋算符是线性的，它才直接退化成相应的 Bloch 向量分量。

下面从一般结果出发，把 $\hat\varrho_\mu$ 分别代入 Rabi、JC 和 XXZ。为避免混乱，分成两大类：

1. **离散单模**：每个耦合通道只含一个频率确定的振子；
2. **连续谱浴**：对大量模式求和，并用谱函数 $J(\omega)$ 表示。

三种模型的根本区别不是"有没有 Berry 相"——它们都有同一个自旋 Berry 项——而是 $\hat\varrho^\dagger=\hat\varrho$ 还是 $\hat\varrho^\dagger\neq\hat\varrho$。Rabi 和坐标耦合 XXZ 属于第一种（厄米），可以将玻色传播子对称化；JC 属于第二种（非厄米），必须保留有方向的传播子。

---

# 第一部分：共同起点与自旋相干态符号

## 12.1 共同起点

考虑

$$
\hat H
=
\hat H_{\mathrm s}
+
\sum_\mu\omega_\mu\hat a_\mu^\dagger\hat a_\mu
+
\sum_\mu
\left(
\hat a_\mu^\dagger\hat\varrho_\mu
+
\hat\varrho_\mu^\dagger \hat a_\mu
\right).
$$

积去玻色相干态之后，得到

$$
\boxed{
Z
=
Z_{\mathrm b}^{(0)}
\int_{\mathrm{PBC}}
\mathcal D\mu_S[\bar z,z]\,
e^{-S_{\mathrm{eff}}[\bar z,z]}
}
$$

其中

$$
\boxed{
\begin{aligned}
S_{\mathrm{eff}}
={}&
S_{\mathrm B}^{\mathrm{spin}}
+
\int_0^\beta d\tau\,
h_{\mathrm s}(\tau)
\\
&-
\sum_\mu
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
\varrho_\mu^\dagger(\tau)
D_{\omega_\mu}(\tau-\tau')
\varrho_\mu(\tau').
\end{aligned}
}
$$

这里 $S_{\mathrm B}^{\mathrm{spin}}=S\int_0^\beta d\tau\,\frac{\bar z\dot z-\dot{\bar z}z}{1+\bar z z}$ 是自旋 Berry 项，而 $D_\omega(\tau-\tau')=(\partial_\tau+\omega)^{-1}$ 是有方向的玻色传播子。

定义周期距离 $|\Delta\tau|_\beta\equiv \Delta\tau\bmod\beta$（$0\le|\Delta\tau|_\beta<\beta$），则

$$
\boxed{
D_\omega(\Delta\tau)
=
\frac{
e^{-\omega|\Delta\tau|_\beta}
}{
1-e^{-\beta\omega}
}
}
$$

或者写成分段形式：

$$
\boxed{
D_\omega(\Delta\tau)
=
\begin{cases}
(1+n_B)e^{-\omega\Delta\tau},
&0<\Delta\tau<\beta,
\\[4pt]
n_B\,e^{-\omega\Delta\tau},
&-\beta<\Delta\tau<0,
\end{cases}
}
$$

其中 $n_B(\omega)=1/(e^{\beta\omega}-1)$。对称传播子定义为

$$
\boxed{
D_{\omega,+}(\Delta\tau)
=
\frac12
\left[
D_\omega(\Delta\tau)
+
D_\omega(-\Delta\tau)
\right]
=
\frac{
\cosh\left[
\omega\left(
\frac{\beta}{2}
-
|\Delta\tau|_\beta
\right)
\right]
}{
2\sinh(\beta\omega/2)
}.
}
$$

还可以定义 $D_{0,\omega}\equiv 2D_{\omega,+}$。

## 12.2 自旋相干态符号

采用 $|z\rangle=(1+|z|^2)^{-S}e^{zJ_-}|S,S\rangle$。定义

$$
s_\alpha(\tau)
\equiv
\frac{
\langle z(\tau)|\hat J_\alpha|z(\tau)\rangle
}{
\langle z(\tau)|z(\tau)\rangle
},
$$

显式为

$$
s_z
=
S\frac{1-|z|^2}{1+|z|^2},
\qquad
s_+
=
\frac{2Sz}{1+|z|^2},
\qquad
s_-
=
\frac{2S\bar z}{1+|z|^2}.
$$

并有 $s_x=\frac{s_++s_-}{2}$，$s_y=\frac{s_+-s_-}{2i}$。对自旋 $1/2$，$\hat J_\alpha=\frac12\hat\sigma_\alpha$。

---

# 第二部分：离散单模情形

这里"单模"对 Rabi 和 JC 是一个玻色振子。对于 XXZ，若要求得到严格的 $J_xJ_x+J_yJ_y+\Delta J_zJ_z$ 结构，就必须让不同自旋分量耦合到彼此独立的玻色通道。因此"单模 XXZ"更准确地说是：**每个独立耦合通道只有一个模式**。否则，一个共同模式同时耦合 $J_x,J_y,J_z$ 会产生交叉项（见 §15.3）。

## 13. 单模 Rabi

### 13.1 哈密顿量

采用旋转后的 Rabi 写法

$$
\boxed{
\hat H_{\mathrm R}
=
-h_x\hat J_x
+
\omega_0\hat a^\dagger\hat a
+
g(\hat a^\dagger+\hat a)\hat J_z.
}
$$

将耦合项与一般形式比较：

$$
\hat a^\dagger\hat\varrho
+
\hat\varrho^\dagger\hat a
=
g\hat a^\dagger\hat J_z
+
g\hat J_z\hat a.
$$

因此 $\hat\varrho=g\hat J_z$，$\hat\varrho^\dagger=g\hat J_z$——**厄米耦合**。对应的相干态符号是 $\varrho(\tau)=g\,s_z(\tau)$，纯自旋部分为 $h_{\mathrm s}(\tau)=-h_xs_x(\tau)$。

### 13.2 代入一般有效作用量

一般推迟项为 $-\iint\varrho^\dagger(\tau)D_{\omega_0}(\tau-\tau')\varrho(\tau')$，代入 $\varrho=\varrho^\dagger=gs_z$ 得到

$$
S_{\mathrm{ret}}^{\mathrm R}
=
-g^2
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
s_z(\tau)
D_{\omega_0}(\tau-\tau')
s_z(\tau').
$$

由于 $s_z(\tau)s_z(\tau')$ 在交换两个时间后不变，可以对称化：

$$
\begin{aligned}
S_{\mathrm{ret}}^{\mathrm R}
&=
-\frac{g^2}{2}
\iint
s_z(\tau)
\left[
D_{\omega_0}(\tau-\tau')
+
D_{\omega_0}(\tau'-\tau)
\right]
s_z(\tau')
\\
&=
-g^2
\iint
s_z(\tau)
D_{\omega_0,+}(\tau-\tau')
s_z(\tau').
\end{aligned}
$$

所以

$$
\boxed{
\begin{aligned}
S_{\mathrm{eff}}^{\mathrm{Rabi},1}
={}&
S_{\mathrm B}^{\mathrm{spin}}
-
h_x\int_0^\beta d\tau\,s_x(\tau)
\\
&-
g^2
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
s_z(\tau)
D_{\omega_0,+}(\tau-\tau')
s_z(\tau').
\end{aligned}
}
$$

使用 $D_{0,\omega_0}=2D_{\omega_0,+}$，也可写成

$$
\boxed{
\begin{aligned}
S_{\mathrm{eff}}^{\mathrm{Rabi},1}
={}&
S_{\mathrm B}^{\mathrm{spin}}
-
h_x\int_0^\beta d\tau\,s_x(\tau)
\\
&-
\frac{g^2}{2}
\iint
s_z(\tau)
D_{0,\omega_0}(\tau-\tau')
s_z(\tau').
\end{aligned}
}
$$

最终配分函数为

$$
\boxed{
Z_{\mathrm{Rabi}}^{(1)}
=
\frac{1}{1-e^{-\beta\omega_0}}
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{Rabi},1}}.
}
$$

---

## 14. 单模 JC

### 14.1 哈密顿量

$$
\boxed{
\hat H_{\mathrm{JC}}
=
-h_z\hat J_z
+
\omega_0\hat a^\dagger\hat a
+
g\left(
\hat a^\dagger\hat J_-
+
\hat J_+\hat a
\right).
}
$$

与一般形式比较：$\hat a^\dagger\hat\varrho+\hat\varrho^\dagger\hat a=g\hat a^\dagger\hat J_-+g\hat J_+\hat a$，因此 $\hat\varrho=g\hat J_-$，$\hat\varrho^\dagger=g\hat J_+$。这是**非厄米耦合**：$\hat\varrho^\dagger\neq\hat\varrho$。

相干态符号为 $\varrho(\tau)=g\,s_-(\tau)$，$\varrho^\dagger(\tau)=g\,s_+(\tau)$，纯自旋部分为 $h_{\mathrm s}(\tau)=-h_zs_z(\tau)$。

### 14.2 代入一般有效作用量

直接得到

$$
\boxed{
S_{\mathrm{ret}}^{\mathrm{JC}}
=
-g^2
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
s_+(\tau)
D_{\omega_0}(\tau-\tau')
s_-(\tau').
}
$$

所以

$$
\boxed{
\begin{aligned}
S_{\mathrm{eff}}^{\mathrm{JC},1}
={}&
S_{\mathrm B}^{\mathrm{spin}}
-
h_z\int_0^\beta d\tau\,s_z(\tau)
\\
&-
g^2
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
s_+(\tau)
D_{\omega_0}(\tau-\tau')
s_-(\tau').
\end{aligned}
}
$$

最终配分函数为

$$
\boxed{
Z_{\mathrm{JC}}^{(1)}
=
\frac{1}{1-e^{-\beta\omega_0}}
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{JC},1}}.
}
$$

### 14.3 为什么 JC 不能对称化

原始积分是 $I_{\mathrm{JC}}=\iint s_+(\tau)D(\tau-\tau')s_-(\tau')$。交换积分变量 $\tau\leftrightarrow\tau'$ 得到 $\iint s_+(\tau')D(\tau'-\tau)s_-(\tau)$，**这不是原来的被积函数**，因为 $s_+(\tau')s_-(\tau)\neq s_+(\tau)s_-(\tau')$——即使这些是 c-number，它们也位于不同时间，并且升降方向发生了交换。

在三角积分域中可以更清楚地看到方向性。将方形积分分成 $\tau>\tau'$ 和 $\tau<\tau'$：

$$
\begin{aligned}
I_{\mathrm{JC}}
={}&
\int_0^\beta d\tau
\int_0^\tau d\tau'\,
(1+n_B)
e^{-\omega_0(\tau-\tau')}
s_+(\tau)s_-(\tau')
\\
&+
\int_0^\beta d\tau
\int_0^\tau d\tau'\,
n_B
e^{+\omega_0(\tau-\tau')}
s_+(\tau')s_-(\tau).
\end{aligned}
$$

因此

$$
\boxed{
\begin{aligned}
S_{\mathrm{ret}}^{\mathrm{JC}}
={}&
-g^2
\int_0^\beta d\tau
\int_0^\tau d\tau'
\\
&\times
\Big[
(1+n_B)
e^{-\omega_0(\tau-\tau')}
s_+(\tau)s_-(\tau')
\\
&\qquad
+
n_B
e^{+\omega_0(\tau-\tau')}
s_+(\tau')s_-(\tau)
\Big].
\end{aligned}
}
$$

第一项对应正向虚时间传播，第二项对应通过热圆周绕回来的过程。零温极限下 $n_B\to 0$，于是只剩

$$
S_{\mathrm{ret}}^{\mathrm{JC},T=0}
=
-g^2
\int_{\tau>\tau'}
d\tau d\tau'\,
e^{-\omega_0(\tau-\tau')}
s_+(\tau)s_-(\tau').
$$

这说明 **JC 的核在零温下仍然是有方向的**——这是 JC 与 Rabi/XXZ 最根本的差别。

---

## 15. 单模 XXZ 自旋-玻色模型

### 15.1 为什么需要独立通道

考虑三个独立玻色模式 $\hat a_x,\hat a_y,\hat a_z$，哈密顿量写成

$$
\boxed{
\begin{aligned}
\hat H_{\mathrm{XXZ}}^{(1)}
={}&
\hat H_{\mathrm s}
+
\sum_{\ell=x,y,z}
\omega_\ell
\hat a_\ell^\dagger\hat a_\ell
\\
&+
\sum_{\ell=x,y,z}
g_\ell
(\hat a_\ell^\dagger+\hat a_\ell)
\hat J_\ell .
\end{aligned}
}
$$

其中 XXZ 条件为 $g_x=g_y\equiv g_\perp$，$\omega_x=\omega_y\equiv\omega_\perp$，而 $z$ 通道可不同：$g_z,\omega_z$。对每个通道 $\hat\varrho_\ell=g_\ell\hat J_\ell=\hat\varrho_\ell^\dagger$，因此三个通道都是**厄米耦合**。

### 15.2 分别积去三个模式

一般推迟项变成（每个通道对称化）

$$
S_{\mathrm{ret}}^{\mathrm{XXZ}}
=
-
\sum_{\ell=x,y,z}
g_\ell^2
\iint
s_\ell(\tau)
D_{\omega_\ell,+}(\tau-\tau')
s_\ell(\tau').
$$

使用 XXZ 条件：

$$
\boxed{
\begin{aligned}
S_{\mathrm{ret}}^{\mathrm{XXZ},1}
={}&
-g_\perp^2
\iint
D_{\omega_\perp,+}(\tau-\tau')
\\
&\qquad\times
\left[
s_x(\tau)s_x(\tau')
+
s_y(\tau)s_y(\tau')
\right]
\\
&-
g_z^2
\iint
s_z(\tau)
D_{\omega_z,+}(\tau-\tau')
s_z(\tau').
\end{aligned}
}
$$

利用 $s_x(\tau)s_x(\tau')+s_y(\tau)s_y(\tau')=\frac12\left[s_+(\tau)s_-(\tau')+s_-(\tau)s_+(\tau')\right]$，所以

$$
\boxed{
\begin{aligned}
S_{\mathrm{ret}}^{\mathrm{XXZ},1}
={}&
-\frac{g_\perp^2}{2}
\iint
D_{\omega_\perp,+}(\tau-\tau')
\\
&\qquad\times
\left[
s_+(\tau)s_-(\tau')
+
s_-(\tau)s_+(\tau')
\right]
\\
&-
g_z^2
\iint
s_z(\tau)
D_{\omega_z,+}(\tau-\tau')
s_z(\tau').
\end{aligned}
}
$$

完整有效作用量为

$$
\boxed{
S_{\mathrm{eff}}^{\mathrm{XXZ},1}
=
S_{\mathrm B}^{\mathrm{spin}}
+
\int_0^\beta d\tau\,h_{\mathrm s}(\tau)
+
S_{\mathrm{ret}}^{\mathrm{XXZ},1}.
}
$$

自由玻色配分函数为

$$
\boxed{
Z_{\mathrm b}^{(0)}
=
\frac{1}{
(1-e^{-\beta\omega_\perp})^2
(1-e^{-\beta\omega_z})
}.
}
$$

所以

$$
\boxed{
Z_{\mathrm{XXZ}}^{(1)}
=
\frac{1}{
(1-e^{-\beta\omega_\perp})^2
(1-e^{-\beta\omega_z})
}
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{XXZ},1}}.
}
$$

### 15.3 一个共同模式为什么一般不是 XXZ

若只有一个共同模式，并写成

$$
\hat H_{\mathrm{sb}}
=
(\hat a^\dagger+\hat a)
\left(
g_x\hat J_x
+
g_y\hat J_y
+
g_z\hat J_z
\right),
$$

那么 $\hat\varrho=g_x\hat J_x+g_y\hat J_y+g_z\hat J_z$。积去玻色子后：

$$
\begin{aligned}
S_{\mathrm{ret}}
=
-
\sum_{\alpha,\beta=x,y,z}
g_\alpha g_\beta
\iint
s_\alpha(\tau)
D_+(\tau-\tau')
s_\beta(\tau').
\end{aligned}
$$

除了 $s_xs_x$、$s_ys_y$、$s_zs_z$，还会出现 $s_xs_y$、$s_xs_z$、$s_ys_z$ 等交叉项。因此，一个共同模式通常产生的是一个**秩一耦合矩阵** $K_{\alpha\beta}\propto g_\alpha g_\beta$，而不是对角 XXZ 结构。这就是为什么严格 XXZ 需要每个分量耦合到独立的浴通道。

---

# 第三部分：连续谱函数情形

连续谱情形的哈密顿量包含大量模式 $\sum_q\omega_q a_q^\dagger a_q$。定义谱函数

$$
\boxed{
J(\omega)
=
\pi
\sum_q
|g_q|^2
\delta(\omega-\omega_q).
}
$$

于是 $\sum_q |g_q|^2 f(\omega_q)=\int_0^\infty \frac{d\omega}{\pi}J(\omega)f(\omega)$。

需要注意：$J(\omega)$ 决定的是"模式密度乘耦合平方"，它足以确定推迟核，但一般**不能单独确定**自由浴配分函数 $Z_{\mathrm b}^{(0)}$，因为不耦合或弱耦合模式也会贡献自由能。因此连续谱情形最自然写成归一化配分函数 $Z/Z_{\mathrm b}^{(0)}$。

---

## 16. 谱函数 Rabi：多模坐标耦合

### 16.1 哈密顿量

$$
\boxed{
\hat H_{\mathrm R}^{\mathrm{bath}}
=
-h_x\hat J_x
+
\sum_q
\omega_q\hat a_q^\dagger\hat a_q
+
\sum_q
g_q(\hat a_q^\dagger+\hat a_q)\hat J_z.
}
$$

对每个模式 $\hat\varrho_q=g_q\hat J_z=\hat\varrho_q^\dagger$（厄米）。因此

$$
S_{\mathrm{ret}}
=
-\sum_q g_q^2
\iint
s_z(\tau)
D_{\omega_q,+}(\tau-\tau')
s_z(\tau').
$$

定义 Rabi 对称核

$$
\boxed{
K_{\mathrm R,+}(\Delta\tau)
=
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm R}(\omega)
D_{\omega,+}(\Delta\tau)
=
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm R}(\omega)
\frac{
\cosh\left[
\omega\left(
\frac{\beta}{2}
-
|\Delta\tau|_\beta
\right)
\right]
}{
2\sinh(\beta\omega/2)
}.
}
$$

于是

$$
\boxed{
\begin{aligned}
S_{\mathrm{eff}}^{\mathrm{Rabi},J}
={}&
S_{\mathrm B}^{\mathrm{spin}}
-
h_x
\int_0^\beta d\tau\,s_x(\tau)
\\
&-
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
s_z(\tau)
K_{\mathrm R,+}(\tau-\tau')
s_z(\tau').
\end{aligned}
}
$$

配分函数为

$$
\boxed{
\frac{
Z_{\mathrm{Rabi}}^{(J)}
}{
Z_{\mathrm b}^{(0)}
}
=
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{Rabi},J}}.
}
$$

若定义 Kirchner 型核 $\chi_{\mathrm R}^{-1}(\Delta\tau)\equiv 2K_{\mathrm R,+}(\Delta\tau)$，则

$$
\boxed{
\chi_{\mathrm R}^{-1}(\Delta\tau)
=
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm R}(\omega)
\frac{
\cosh\left[
\omega\left(
\frac{\beta}{2}
-
|\Delta\tau|_\beta
\right)
\right]
}{
\sinh(\beta\omega/2)
}
}
$$

并且作用量写成 $S_{\mathrm{ret}}=-\frac12\iint s_z(\tau)\chi_{\mathrm R}^{-1}(\tau-\tau')s_z(\tau')$。

---

## 17. 谱函数 JC：多模旋转波耦合

### 17.1 哈密顿量

$$
\boxed{
\begin{aligned}
\hat H_{\mathrm{JC}}^{\mathrm{bath}}
={}&
-h_z\hat J_z
+
\sum_q
\omega_q\hat a_q^\dagger\hat a_q
\\
&+
\sum_q
g_q
\left(
\hat a_q^\dagger\hat J_-
+
\hat J_+\hat a_q
\right).
\end{aligned}
}
$$

对每个模式 $\hat\varrho_q=g_q\hat J_-$，$\hat\varrho_q^\dagger=g_q\hat J_+$（非厄米）。因此

$$
S_{\mathrm{ret}}
=
-\sum_q g_q^2
\iint
s_+(\tau)
D_{\omega_q}(\tau-\tau')
s_-(\tau').
$$

定义有方向的 JC 核

$$
\boxed{
K_{\mathrm{JC}}^{\rightarrow}(\Delta\tau)
=
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm{JC}}(\omega)
D_\omega(\Delta\tau).
}
$$

于是

$$
\boxed{
\begin{aligned}
S_{\mathrm{eff}}^{\mathrm{JC},J}
={}&
S_{\mathrm B}^{\mathrm{spin}}
-
h_z\int_0^\beta d\tau\,s_z(\tau)
\\
&-
\int_0^\beta d\tau
\int_0^\beta d\tau'\,
s_+(\tau)
K_{\mathrm{JC}}^{\rightarrow}(\tau-\tau')
s_-(\tau').
\end{aligned}
}
$$

配分函数为

$$
\boxed{
\frac{
Z_{\mathrm{JC}}^{(J)}
}{
Z_{\mathrm b}^{(0)}
}
=
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{JC},J}}.
}
$$

### 17.2 JC 谱核的分段形式

对 $0<\Delta\tau<\beta$，有

$$
\boxed{
K_{\mathrm{JC}}^{\rightarrow}(\Delta\tau)
=
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm{JC}}(\omega)
\left[1+n_B(\omega)\right]
e^{-\omega\Delta\tau}.
}
$$

对 $-\beta<\Delta\tau<0$，有

$$
\boxed{
K_{\mathrm{JC}}^{\rightarrow}(\Delta\tau)
=
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm{JC}}(\omega)
n_B(\omega)
e^{-\omega\Delta\tau}.
}
$$

一般而言 $K_{\mathrm{JC}}^{\rightarrow}(\Delta\tau)\neq K_{\mathrm{JC}}^{\rightarrow}(-\Delta\tau)$，因此不能把它写成单独的 $\frac{\cosh}{\sinh}$ 偶函数核。

如果强行定义 $K_+=\frac12\left(K^\rightarrow(\Delta\tau)+K^\rightarrow(-\Delta\tau)\right)$，还必须同时保留两个不同的自旋结构 $s_+(\tau)s_-(\tau')$ 和 $s_+(\tau')s_-(\tau)$，所以这并**不能**把 JC 化成 Rabi 型密度-密度作用量。

---

## 18. 谱函数 XXZ

### 18.1 哈密顿量

令每个自旋分量耦合到独立玻色浴：

$$
\boxed{
\begin{aligned}
\hat H_{\mathrm{XXZ}}^{\mathrm{bath}}
={}&
\hat H_{\mathrm s}
+
\sum_{\ell=x,y,z}
\sum_q
\omega_{q\ell}
\hat a_{q\ell}^\dagger
\hat a_{q\ell}
\\
&+
\sum_{\ell=x,y,z}
\sum_q
g_{q\ell}
\left(
\hat a_{q\ell}^\dagger
+
\hat a_{q\ell}
\right)
\hat J_\ell .
\end{aligned}
}
$$

对每个模式和通道 $\hat\varrho_{q\ell}=g_{q\ell}\hat J_\ell=\hat\varrho_{q\ell}^\dagger$（厄米）。定义三个谱函数

$$
\boxed{
J_\ell(\omega)
=
\pi
\sum_q
g_{q\ell}^2
\delta(\omega-\omega_{q\ell}).
}
$$

XXZ 条件为 $J_x(\omega)=J_y(\omega)\equiv J_\perp(\omega)$，而 $J_z(\omega)$ 可以不同。

### 18.2 定义三个对称核

$$
\boxed{
K_\ell(\Delta\tau)
=
\int_0^\infty
\frac{d\omega}{\pi}
J_\ell(\omega)
D_{\omega,+}(\Delta\tau)
=
\int_0^\infty
\frac{d\omega}{\pi}
J_\ell(\omega)
\frac{
\cosh\left[
\omega\left(
\frac{\beta}{2}
-
|\Delta\tau|_\beta
\right)
\right]
}{
2\sinh(\beta\omega/2)
}.
}
$$

在 XXZ 情形 $K_x=K_y\equiv K_\perp$。因此

$$
\boxed{
\begin{aligned}
S_{\mathrm{ret}}^{\mathrm{XXZ},J}
={}&
-
\iint
K_\perp(\tau-\tau')
\\
&\qquad\times
\left[
s_x(\tau)s_x(\tau')
+
s_y(\tau)s_y(\tau')
\right]
\\
&-
\iint
K_z(\tau-\tau')
s_z(\tau)s_z(\tau').
\end{aligned}
}
$$

升降算符形式为

$$
\boxed{
\begin{aligned}
S_{\mathrm{ret}}^{\mathrm{XXZ},J}
={}&
-\frac12
\iint
K_\perp(\tau-\tau')
\\
&\quad\times
\left[
s_+(\tau)s_-(\tau')
+
s_-(\tau)s_+(\tau')
\right]
\\
&-
\iint
K_z(\tau-\tau')
s_z(\tau)s_z(\tau').
\end{aligned}
}
$$

完整作用量为

$$
\boxed{
S_{\mathrm{eff}}^{\mathrm{XXZ},J}
=
S_{\mathrm B}^{\mathrm{spin}}
+
\int_0^\beta d\tau\,h_{\mathrm s}(\tau)
+
S_{\mathrm{ret}}^{\mathrm{XXZ},J}.
}
$$

配分函数为

$$
\boxed{
\frac{
Z_{\mathrm{XXZ}}^{(J)}
}{
Z_{\mathrm b}^{(0)}
}
=
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{XXZ},J}}.
}
$$

### 18.3 一般共同浴需要矩阵谱函数

如果同一个浴模式同时耦合多个分量：$\hat\varrho_q=\sum_{\alpha=x,y,z}g_{q\alpha}\hat J_\alpha$，则应定义矩阵谱函数

$$
\boxed{
J_{\alpha\beta}(\omega)
=
\pi
\sum_q
g_{q\alpha}g_{q\beta}
\delta(\omega-\omega_q).
}
$$

有效作用量为

$$
\boxed{
S_{\mathrm{ret}}
=
-
\sum_{\alpha,\beta}
\iint
s_\alpha(\tau)
K_{\alpha\beta}(\tau-\tau')
s_\beta(\tau'),
}
$$

其中 $K_{\alpha\beta}(\Delta\tau)=\int_0^\infty \frac{d\omega}{\pi}J_{\alpha\beta}(\omega)D_{\omega,+}(\Delta\tau)$。纯 XXZ 要求 $J_{\alpha\beta}=0$（$\alpha\neq\beta$）并且 $J_{xx}=J_{yy}$。

---

# 第四部分：统一视角与长程行为

## 19. 单模与谱函数的统一关系

单模其实是谱函数的 delta 峰特例：

- **Rabi**：$J_{\mathrm R}(\omega)=\pi g^2\delta(\omega-\omega_0)$，于是 $K_{\mathrm R,+}(\tau)=g^2D_{\omega_0,+}(\tau)$；
- **JC**：$J_{\mathrm{JC}}(\omega)=\pi g^2\delta(\omega-\omega_0)$，于是 $K_{\mathrm{JC}}^\rightarrow(\tau)=g^2D_{\omega_0}(\tau)$；
- **XXZ**：$J_\perp(\omega)=\pi g_\perp^2\delta(\omega-\omega_\perp)$，$J_z(\omega)=\pi g_z^2\delta(\omega-\omega_z)$，于是 $K_\perp(\tau)=g_\perp^2 D_{\omega_\perp,+}(\tau)$，$K_z(\tau)=g_z^2 D_{\omega_z,+}(\tau)$。

因此六种情况并不是六套互不相关的理论，而是：

$$
\boxed{
\text{三种不同的 }\hat\varrho
\quad\times\quad
\text{离散谱或连续谱}.
}
$$

---

## 20. 幂律谱下的长虚时间行为

考虑 ohmic 族幂律谱

$$
J_\ell(\omega)
=
2\pi\alpha_\ell
\omega_c^{1-s_\ell}
\omega^{s_\ell}
\Theta(\omega_c-\omega).
$$

在零温和长虚时间极限下，$D_{\omega,+}(\tau)\to \frac12 e^{-\omega|\tau|}$。因此 Rabi 或 XXZ 的对称核为

$$
\begin{aligned}
K_\ell(\tau)
&\simeq
\frac{1}{\pi}
\int_0^\infty
d\omega\,
2\pi\alpha_\ell
\omega_c^{1-s_\ell}
\omega^{s_\ell}
\frac12 e^{-\omega|\tau|}
\\
&=
\alpha_\ell
\omega_c^{1-s_\ell}
\int_0^\infty
d\omega\,
\omega^{s_\ell}
e^{-\omega|\tau|}.
\end{aligned}
$$

利用 $\int_0^\infty d\omega\,\omega^s e^{-\omega|\tau|}=\frac{\Gamma(1+s)}{|\tau|^{1+s}}$，得到

$$
\boxed{
K_\ell(\tau)
\sim
\alpha_\ell
\Gamma(1+s_\ell)
\omega_c^{1-s_\ell}
\frac{1}{|\tau|^{1+s_\ell}}.
}
$$

所以 **Rabi 与 XXZ 的连续浴产生偶对称的长程虚时间相互作用**。

对于 JC，在零温极限：

$$
D_\omega(\tau)
\longrightarrow
\begin{cases}
e^{-\omega\tau},&\tau>0,\\
0,&\tau<0,
\end{cases}
$$

因此

$$
\boxed{
K_{\mathrm{JC}}^\rightarrow(\tau)
\sim
2\alpha
\Gamma(1+s)
\omega_c^{1-s}
\frac{\Theta(\tau)}{\tau^{1+s}}.
}
$$

它不是 $|\tau|^{-1-s}$，而是**带方向的** $\Theta(\tau)\tau^{-1-s}$。这正是 JC 与 Rabi/XXZ 在积去玻色子后最根本的差别：前者的推迟核因果地指向未来，后者的推迟核在时间上对称。

---

## 21. 六种情况汇总

| 模型 | 模式结构 | $\hat\varrho$ | 核 | 推迟自旋结构 |
|------|---------|--------------|-----|-------------|
| 单模 Rabi | 一个模式 | $gJ_z$ | $D_{\omega_0,+}$ | $s_z(\tau)s_z(\tau')$ |
| 谱 Rabi | $J_{\mathrm R}(\omega)$ | $g_qJ_z$ | $K_{\mathrm R,+}$ | $s_z(\tau)s_z(\tau')$ |
| 单模 JC | 一个模式 | $gJ_-$ | $D_{\omega_0}$ | $s_+(\tau)s_-(\tau')$ |
| 谱 JC | $J_{\mathrm{JC}}(\omega)$ | $g_qJ_-$ | $K_{\mathrm{JC}}^\rightarrow$ | $s_+(\tau)s_-(\tau')$ |
| 单模 XXZ | 每通道一个模式 | $g_\ell J_\ell$ | $D_{\omega_\ell,+}$ | $s_xs_x+s_ys_y+\text{各向异性 }s_zs_z$ |
| 谱 XXZ | $J_\perp,J_z$ | $g_{q\ell}J_\ell$ | $K_\perp,K_z$ | $\frac12(s_+s_-+s_-s_+)+s_zs_z$ |

最简洁的统一结论是：

$$
\boxed{
\begin{aligned}
\text{Rabi:}\quad&
\varrho=gJ_z,
\\
\text{JC:}\quad&
\varrho=gJ_-,
\\
\text{XXZ:}\quad&
\varrho_\ell=g_\ell J_\ell.
\end{aligned}
}
$$

然后由厄米性决定传播子结构：

$$
\boxed{
\varrho^\dagger=\varrho
\;\Rightarrow\;
D\ \text{可对称化为}\ D_+,
}
$$

$$
\boxed{
\varrho^\dagger\neq\varrho
\;\Rightarrow\;
\text{必须保留有方向的}\ D.
}
$$

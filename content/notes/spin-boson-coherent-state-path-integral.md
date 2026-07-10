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

> **本文范围**：下面的推导插入单个自旋相干态 $|z\rangle$，因此严格对应**单个自旋**或已限制到固定总自旋 $S$ 表示中的**集体自旋**。多自旋推广需要 $\bigotimes_i|z_i\rangle$ 和相应的多自旋 Berry 项，见第 1.1 节末尾的说明。

对这种模型，有一条在有限时间切片层面严格的化简路线：**用玻色相干态和自旋相干态把配分函数写成联合路径积分，然后把所有玻色自由度高斯积掉**，得到一个只含自旋相干态变量、但带有长程虚时间相互作用的"有效自旋理论"。在离散时间切片层面，玻色积分归结为有限维复高斯积分；本文的连续时间作用量是该离散结果的记号简写。下文按这条路线完整推导一遍，不做任何模型特殊化；最后再把 $\hat\varrho_\mu$ 分别代入 Rabi、JC、XXZ，看看三类耦合如何给出不同的有效作用量。

为什么这件事值得单独写一篇？因为整条推导只依赖两个条件——$\hat H_{\mathrm b}$ 对玻色场是二次型、$\hat H_{\mathrm{sb}}$ 对 $\hat a_\mu,\hat a_\mu^\dagger$ 是线性的——只要满足这两个条件，浴积分就能解析完成。耦合算符 $\hat\varrho_\mu$ 是否厄米（$\hat\varrho_\mu^\dagger=\hat\varrho$ 还是 $\hat\varrho_\mu^\dagger\neq\hat\varrho_\mu$）是一个方便的一阶判据：它直接决定了玻色传播子能否对称化，进而决定了有效自旋作用量的结构。但模型的差异不止于此——对称性（$\mathbb Z_2$、$U(1)$）、耦合矩阵的秩、谱的红外结构等同样关键，后续各节会逐一展开。

---

## 1. 通用模型

### 1.1 哈密顿量

考虑一般的线性自旋-玻色耦合模型

$$
\boxed{
\hat H =
\hat H_{\mathrm s} +
\sum_\mu \omega_\mu \hat a_\mu^\dagger\hat a_\mu +
\sum_\mu
\left(
\hat a_\mu^\dagger\hat\varrho_\mu +
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
[\hat a_\mu,\hat\varrho_\nu] =
[\hat a_\mu^\dagger,\hat\varrho_\nu] =
0.
$$

我们的目标是同时插入玻色相干态和自旋相干态，把配分函数写成联合路径积分，然后精确积掉玻色场，得到只含自旋相干态变量的配分函数。

> **多自旋推广**：若 $\hat H_{\mathrm s}$ 含多个自旋间的交换作用，则需要为每个自旋插入独立的相干态 $|z_i\rangle$，测度变为 $\prod_i\mathcal D\mu_{S_i}[\bar z_i,z_i]$，Berry 项变为 $\sum_i S_i\int d\tau\,\frac{\bar z_i\dot z_i-\dot{\bar z}_iz_i}{1+\bar z_iz_i}$。本文以下推导均针对单自旋或集体自旋情形，多自旋推广在形式上直接但记号更繁。

---

## 2. 两类相干态

### 2.1 玻色相干态

对每个玻色模式 $\mu$，采用归一化相干态

$$
|\phi_\mu\rangle =
e^{-|\phi_\mu|^2/2}
e^{\phi_\mu\hat a_\mu^\dagger}|0\rangle ,
$$

它满足本征值方程 $\hat a_\mu|\phi_\mu\rangle=\phi_\mu|\phi_\mu\rangle$ 以及完备性关系

$$
\boxed{
\int_{\mathbb C}
\frac{d^2\phi_\mu}{\pi}
|\phi_\mu\rangle\langle\phi_\mu| =
\hat{\mathbb 1}_{\mu}.
}
$$

相干态重叠为

$$
\boxed{
\langle\phi_\mu'|\phi_\mu\rangle =
\exp\left[
-\frac12|\phi_\mu'|^2
-\frac12|\phi_\mu|^2 +
\bar\phi_\mu'\phi_\mu
\right].
}
$$

所有玻色模式的联合相干态记为 $|\boldsymbol\phi\rangle=\bigotimes_\mu|\phi_\mu\rangle$。

### 2.2 自旋相干态

采用由最高权重态生成的自旋相干态（自旋量子数 $S$）

$$
\boxed{
|z\rangle =
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
|z\rangle\langle z| =
\hat{\mathbb 1}_{\mathrm s},
}
$$

其中 $d^2z=d(\operatorname{Re}z)\,d(\operatorname{Im}z)$。

两个自旋相干态的重叠为

$$
\boxed{
\langle z'|z\rangle =
\frac{(1+\bar z' z)^{2S}}
{(1+|z'|^2)^S(1+|z|^2)^S}.
}
$$

需要注意，自旋相干态**并非任意两态都不正交**。当 $1+\bar z' z=0$ 时，它们对应 Bloch 球上的对跖点，重叠为零。但路径积分真正依赖的是相邻时间片的行为：对连续的经典路径或鞍点路径，$z_{j+1}-z_j=O(\varepsilon)$ 保证了 $\langle z_{j+1}|z_j\rangle\to 1$，从而可以作短时间展开。然而**精确量子路径积分中的典型路径不必光滑**——连续导数形式只是离散极限的形式表达，不应把所有被积路径预先限制为光滑路径。

另外，单一立体投影坐标 $z$ 在南极（$z\to\infty$）奇异。对于穿过南极的闭合路径，需要南北两个坐标片或直接用 $\mathbf n(\tau)$ 和 Wess–Zumino 曲面表示。此时两个坐标片给出的 Berry 项之差为 $\mathcal A_1-\mathcal A_2=4\pi k$，但 $e^{-iS\cdot 4\pi k}=1$（因为 $2S\in\mathbb Z$），因此配分函数仍是良定义的。这一规范单值性在第 5.2 节进一步讨论。

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
h_{\mathrm s}^{j+1,j} +
\sum_\mu
\omega_\mu
\bar\phi_{\mu,j+1}\phi_{\mu,j}
\\
&+
\sum_\mu
\left[
\bar\phi_{\mu,j+1}
\varrho_\mu^{j+1,j} +
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
\langle\phi_{\mu,j+1}|\phi_{\mu,j}\rangle =
\frac{\varepsilon}{2}
\left(
\bar\phi_\mu\dot\phi_\mu -
\dot{\bar\phi}_\mu\phi_\mu
\right) +
O(\varepsilon^2).
$$

因此每个玻色模式产生一个一阶时间导数项：

$$
S_{\mathrm B,\mu}^{\mathrm{bos}} =
\frac12
\int_0^\beta d\tau
\left(
\bar\phi_\mu\dot\phi_\mu -
\dot{\bar\phi}_\mu\phi_\mu
\right).
$$

由于玻色场满足周期边界条件，$\int_0^\beta d\tau\,\partial_\tau(\bar\phi_\mu\phi_\mu)=0$，所以也可等价地写成

$$
\boxed{
S_{\mathrm B,\mu}^{\mathrm{bos}} =
\int_0^\beta d\tau\,
\bar\phi_\mu\partial_\tau\phi_\mu .
}
$$

### 5.2 自旋 Berry 项

令 $z_{j+1}=z_j+\varepsilon\dot z_j$。从自旋相干态重叠得到

$$
-\ln\langle z_{j+1}|z_j\rangle =
\varepsilon S
\frac{
\bar z\dot z-\dot{\bar z}z
}{
1+\bar z z
} +
O(\varepsilon^2).
$$

因此自旋几何项为

$$
\boxed{
S_{\mathrm B}^{\mathrm{spin}}[\bar z,z] =
S\int_0^\beta d\tau\,
\frac{
\bar z\dot z-\dot{\bar z}z
}{
1+\bar z z
}.
}
$$

在原始物理积分轮廓 $\bar z(\tau)=z(\tau)^*$（即路径位于真实 Bloch 球上）时，这个量是纯虚数。但在复鞍点、瞬子计算、或将 $z,\bar z$ 作为独立变量处理时，Berry 项不一定保持纯虚——复化鞍点分析中不应继续使用这一结论。

在 Bloch 球语言中，记自旋相干态对应的单位向量为 $\mathbf n(\tau)$（北极 $z=0$、南极 $z\to\infty$），它可以写成

$$
S_{\mathrm B}^{\mathrm{spin}} =
iS\,\mathcal A[\mathbf n],
$$

其中 $\mathcal A[\mathbf n]$ 是闭合路径 $\mathbf n(\tau)$ 在单位球面上所围的**有向立体角**。整体正负号依赖于生成约定（$e^{zJ_-}|S,S\rangle$ 还是 $e^{zJ_+}|S,-S\rangle$）以及所选的局部规范。

**需要纠正一个常见误解**：一般闭合路径的立体角并不是 $4\pi k$。任意闭合曲线都可以围出连续取值的立体角。只有使用不同曲面填充**同一条**闭合曲线时，两种立体角之间的差才是 $4\pi k$（$k\in\mathbb Z$）。这个 $4\pi k$ 的规范单值性也保证了 $z$ 坐标在南极的奇异性不会破坏配分函数的良定性：换用不同坐标片时，Berry 项的差为 $4\pi k S$，而 $e^{-i\cdot 4\pi k S}=1$（因为 $2S\in\mathbb Z$）。因此自旋 Berry 相一般不能直接忽略——它贡献的是纯虚相位，会真实地影响配分函数的干涉结构。

---

## 6. 联合自旋-玻色路径积分

**严格性说明**：下文的连续时间表达式应理解为继承了离散时间切片处方的记号简写。真正的严格对象是有限 $M$ 片、步长 $\varepsilon=\beta/M$ 的离散时间路径积分——在这一层次上，玻色场的高斯积分是严格成立的。连续极限 $M\to\infty$ 在积掉玻色场之后再取。推导逻辑链为：

$$
\boxed{\text{先离散}\;\to\;\text{积掉玻色场}\;\to\;\text{再取连续极限}}
$$

若先将所有协变符号替换为同一时刻的对角符号再声称完全严格，对含 $J_z^2$ 或非线性自旋项的模型可能产生异常（Solari–Kochetov 修正，见 [arXiv:1012.1328](https://arxiv.org/abs/1012.1328)）。

### 6.1 连续极限作用量

在连续极限中定义对角协变符号（同一时间片）

$$
h_{\mathrm s}(\bar z,z) =
\frac{\langle z|\hat H_{\mathrm s}|z\rangle}{\langle z|z\rangle},
\qquad
\varrho_\mu(\bar z,z) =
\frac{\langle z|\hat\varrho_\mu|z\rangle}{\langle z|z\rangle},
\qquad
\varrho_\mu^\dagger(\bar z,z) =
\frac{\langle z|\hat\varrho_\mu^\dagger|z\rangle}{\langle z|z\rangle}.
$$

这里仅把自旋算符写成相干态协变符号，没有指定 $\hat\varrho_\mu$ 的具体形式。于是配分函数成为

$$
\boxed{
Z =
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
S_{\mathrm B}^{\mathrm{spin}}[\bar z,z] +
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
\varrho_\mu(\tau) +
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
S_{\mathrm b,\mu} =
\int_0^\beta d\tau
\left[
\bar\phi_\mu L_\mu\phi_\mu +
\bar\phi_\mu\varrho_\mu +
\varrho_\mu^\dagger\phi_\mu
\right].
}
$$

关键观察：**每个玻色模式都只以二次型和线性源项出现**。其中 $\varrho_\mu,\varrho_\mu^\dagger$ 对玻色积分而言只是外部源（它们是 $z(\tau)$ 的函数）。因此玻色路径积分是严格的高斯泛函积分，可以解析完成。

> **可逆性条件**：高斯积分要求 $L_\mu=\partial_\tau+\omega_\mu$ 在周期函数空间上可逆，这要求 $\omega_\mu>0$。若存在严格零模（$\omega_\mu=0$），则 $Z_{\mathrm b}^{(0)}$ 发散且 $L_\mu^{-1}$ 无定义，需单独处理。连续谱延伸到 $\omega\to 0$ 时，还需检查红外收敛性。

---

## 7. 精确积去玻色相干态

这是全文最关键的一步：把每个玻色模式的高斯积分做掉。

**离散到连续的桥梁**：在 $M$ 片时间切片中，令指标模 $M$ 周期识别（$\phi_M=\phi_0$），玻色离散作用量可写成矩阵形式：

$$
\boxed{
\begin{aligned}
S_{\mathrm b}^{(M)} =
\sum_{j=0}^{M-1}
\Big[
&\bar\phi_j\phi_j - (1-\varepsilon\omega)\bar\phi_j\phi_{j-1} \\
&+ \varepsilon\bar\phi_j \varrho^{j,j-1} + \varepsilon \varrho^{\dagger,j,j-1} \phi_{j-1}
\Big].
\end{aligned}
}
$$

写成 $\bar{\boldsymbol\phi}A^{(M)}\boldsymbol\phi + \bar{\boldsymbol\phi}\boldsymbol\eta + \bar{\boldsymbol\eta}\boldsymbol\phi$，有限维复高斯积分严格给出

$$
\boxed{
\int d\bar{\boldsymbol\phi}\,d\boldsymbol\phi\, e^{-S_{\mathrm b}^{(M)}} =
\frac{1}{\det A^{(M)}}
\exp\left[\bar{\boldsymbol\eta}(A^{(M)})^{-1}\boldsymbol\eta\right].
}
$$

最后取 $M\to\infty$ 极限：$(A^{(M)})^{-1}\to D_\omega(\tau-\tau')$，$[\det A^{(M)}]^{-1}\to Z_{\mathrm b}^{(0)}$（或等价地 $\det A^{(M)}\to 1-e^{-\beta\omega}=1/Z_{\mathrm b}^{(0)}$）。下文在继承此离散处方的连续记号中完成推导。

### 7.1 配平方

把 $S_{\mathrm b,\mu}$ 写成算符矩阵记号（省略虚时间积分）：

$$
S_{\mathrm b,\mu} =
\bar\phi_\mu L_\mu\phi_\mu +
\bar\phi_\mu\varrho_\mu +
\varrho_\mu^\dagger\phi_\mu.
$$

作变量平移

$$
\widetilde\phi_\mu =
\phi_\mu +
L_\mu^{-1}\varrho_\mu,
\qquad
\widetilde{\bar\phi}_\mu =
\bar\phi_\mu +
\varrho_\mu^\dagger L_\mu^{-1}.
$$

> **独立变量说明**：在相干态泛函积分中，$\phi$ 与 $\bar\phi$ 在高斯积分和复轮廓延拓意义下作为**独立变量**处理——因此第二个平移并非第一个的复共轭。完成积分后，原始积分轮廓才对应 $\bar\phi=\phi^*$。此外，平移后的场仍满足周期边界条件，因为 $L_\mu^{-1}$ 是周期逆算符，而自旋源 $\varrho_\mu(\tau)$ 也是周期的。

验证配平方：

$$
\begin{aligned}
\widetilde{\bar\phi}_\mu
L_\mu
\widetilde\phi_\mu
={}&
\left(
\bar\phi_\mu +
\varrho_\mu^\dagger L_\mu^{-1}
\right)
L_\mu
\left(
\phi_\mu +
L_\mu^{-1}\varrho_\mu
\right)
\\
={}&
\bar\phi_\mu L_\mu\phi_\mu +
\bar\phi_\mu\varrho_\mu +
\varrho_\mu^\dagger\phi_\mu +
\varrho_\mu^\dagger
L_\mu^{-1}
\varrho_\mu .
\end{aligned}
$$

前三项正是原来的 $S_{\mathrm b,\mu}$，因此

$$
\boxed{
S_{\mathrm b,\mu} =
\widetilde{\bar\phi}_\mu
L_\mu
\widetilde\phi_\mu -
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
D_\mu(\tau-\tau') =
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
Z_{\mathrm b,\mu}^{(0)} =
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
Z_{\mathrm b}^{(0)} =
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
\exp\Bigg[ -
S_{\mathrm B}^{\mathrm{spin}}[\bar z,z] -
\int_0^\beta d\tau\,
h_{\mathrm s}(\bar z,z)
\\
&\qquad +
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
Z =
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
S_{\mathrm B}^{\mathrm{spin}}[\bar z,z] +
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
D_\mu(\tau) =
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
D_\mu(\tau+\beta) =
D_\mu(\tau).
}
$$

也可以写成模 $\beta$ 的形式。定义 $\tau_\beta=\tau\bmod\beta$，$0\le\tau_\beta<\beta$，则

$$
\boxed{
D_\mu(\tau) =
\frac{
e^{-\omega_\mu\tau_\beta}
}{
1-e^{-\beta\omega_\mu}
}.
}
$$

注意传播子是**有方向的**：一般地 $D_\mu(\tau-\tau')\neq D_\mu(\tau'-\tau)$。这个方向性来自玻色相干态几何项 $\bar\phi\,\partial_\tau\phi$ 的一阶导数结构——下一节会看到，它决定了能否对称化。

### 9.3 等时跳跃与时间切片处方

传播子在 $\tau=0$ 处存在跳跃。由分段形式直接读出：

$$
\boxed{
D_\mu(0^+) = 1 + n_B(\omega_\mu),
\qquad
D_\mu(0^-) = n_B(\omega_\mu),
}
$$

因此

$$
\boxed{
D_\mu(0^+) - D_\mu(0^-) = 1.
}
$$

这个跳跃正是 $(\partial_\tau+\omega_\mu)D_\mu(\tau)=\delta_\beta(\tau)$ 成立的原因——对 $\delta_\beta$ 积分时，阶跃来自 $\partial_\tau$ 作用在 $D_\mu$ 在 $\tau=0$ 的间断上。

**等时处方对以下情形不可省略**：
- 离散时间推导中，$\tau=\tau'$ 的顶点位于同一时间片；
- 正常序问题与等时自收缩；
- QMC 顶点位于同一虚时间；
- 从 Matsubara 频率表达式恢复时间核。

在实际计算中，当 $\tau=\tau'$ 时需根据时间切片约定选取 $D_\mu(0^+)$ 或 $D_\mu(0^-)$。对有限模式或具有有限紫外截止、在 $\tau=0$ 可积的核，等时点是零测集，不影响普通双积分；若连续谱无紫外截止导致核在等时处奇异（如某些幂律谱的接触项），则必须保留离散时间处方或引入紫外正则化。本文后续双时间积分默认核在原点可积。

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
I_\mu =
\int d\tau d\tau'\,
\varrho_\mu(\tau)
D_{\mu,+}(\tau-\tau')
\varrho_\mu(\tau')
}
$$

其中对称传播子定义为

$$
\boxed{
D_{\mu,+}(\Delta\tau) =
\frac12
\left[
D_\mu(\Delta\tau) +
D_\mu(-\Delta\tau)
\right].
}
$$

代入 $D_\mu$ 的分段形式，对 $0\le d_\beta(\Delta\tau)\le\beta/2$ 有

$$
\boxed{
D_{\mu,+}(\Delta\tau) =
\frac{
\cosh\left[
\omega_\mu
\left(
\frac{\beta}{2} -
d_\beta(\Delta\tau)
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
D_{0,\mu}(\Delta\tau) =
\frac{
\cosh\left[
\omega_\mu
\left(
\frac{\beta}{2} -
d_\beta(\Delta\tau)
\right)
\right]
}{
\sinh(\beta\omega_\mu/2)
}.
}
$$

相应地，有效作用量必须写成

$$
\int\varrho_\mu D_{\mu,+}\varrho_\mu =
\frac12
\int\varrho_\mu D_{0,\mu}\varrho_\mu .
$$

所以文献中常见的两种写法——$D_+={\cosh}/{(2\sinh)}$ 与 $D_0={\cosh}/{\sinh}$——并不矛盾。区别只是因子 $1/2$ 放在核内部还是作用量外部。

> **注意**：以上讨论假设所有文献采用相同的玻色场归一化和相同的谱函数定义。若使用不同坐标归一化（如 $X=a+a^\dagger$、$q=(a+a^\dagger)/\sqrt{2\omega}$、或 $q=(a+a^\dagger)/\sqrt{2m\omega}$），核中还会出现额外的 $\omega$ 或质量因子，不能简单归约为因子 $1/2$ 的放置位置。

### 10.4 Matsubara 频率表示

在频域中，传播子的方向性、对称化和因子关系都变得透明。取玻色 Matsubara 频率 $\nu_n=2\pi n/\beta$，在约定 $\phi(\tau)\sim e^{-i\nu_n\tau}$ 下：

$$
\boxed{
D_\omega(i\nu_n) = \frac{1}{\omega - i\nu_n}.
}
$$

于是对称核与反对称核为：

$$
\boxed{
D_{\omega,+}(i\nu_n) = \frac{\omega}{\omega^2 + \nu_n^2},
\qquad
D_{\omega,-}(i\nu_n) = \frac{i\nu_n}{\omega^2 + \nu_n^2}.
}
$$

频域视角立刻揭示了模型分类的物理实质：
- **Rabi / 坐标耦合**：厄米耦合只保留偶频部分 $D_{\omega,+}$（$\nu_n$ 的偶函数）；
- **JC**：非厄米耦合同时包含偶频和奇频结构，$D_{\omega,-}$ 正是方向性的频域来源；
- $D_{\omega,-}$ 在 $\nu_n\to 0$ 时消失，因此静态极限下方向性减弱——这与高温下所有模型趋同的事实一致。

---

## 11. 几何一阶项：积掉玻色场前后的去向

在积去玻色场之前，联合路径积分中的几何项为

$$
\boxed{
S_{\mathrm{geom}} =
S_{\mathrm B}^{\mathrm{spin}} +
\sum_\mu
S_{\mathrm B,\mu}^{\mathrm{bos}} =
S\int_0^\beta d\tau\,
\frac{
\bar z\dot z-\dot{\bar z}z
}{
1+\bar z z
} +
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
S_{\mathrm{eff}} =
S_{\mathrm B}^{\mathrm{spin}} +
\int h_{\mathrm s} -
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
\varrho_\mu(\bar z,z) =
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

### 12.1 共同起点（代入前回顾）

有效作用量与传播子已在第 8–10 节完整推导，这里只摘要结论以便代入具体模型。配分函数为

$$
Z = Z_{\mathrm b}^{(0)}
\int_{\mathrm{PBC}} \mathcal D\mu_S[\bar z,z]\,
e^{-S_{\mathrm{eff}}[\bar z,z]},
\qquad
S_{\mathrm{eff}} =
S_{\mathrm B}^{\mathrm{spin}} + \int h_{\mathrm s} -
\sum_\mu \iint \varrho_\mu^\dagger(\tau) D_{\omega_\mu}(\tau-\tau') \varrho_\mu(\tau').
$$

传播子 $D_\omega(\tau)=(\partial_\tau+\omega)^{-1}$ 在第 9 节已给出分段形式和 KMS 周期性，对称核 $D_{\omega,+}$ 在第 10 节已定义。此处仅引入后续讨论所需的周期距离记号。

**周期距离记号**。对虚时间差 $\Delta\tau$，区分两个量：

- **有向余数** $u_\beta(\Delta\tau)\equiv \Delta\tau\bmod\beta$，满足 $0\le u_\beta<\beta$；
- **无向周期距离** $d_\beta(\Delta\tau)\equiv\min\bigl[u_\beta(\Delta\tau),\,\beta-u_\beta(\Delta\tau)\bigr]$，满足 $0\le d_\beta\le\beta/2$。

于是**有向传播子**用有向余数写出：

$$
\boxed{
D_\omega(\Delta\tau) =
\frac{e^{-\omega\,u_\beta(\Delta\tau)}}{1-e^{-\beta\omega}},
}
$$

而**对称传播子**用无向距离写出：

$$
\boxed{
D_{\omega,+}(\Delta\tau) =
\frac{
\cosh\left[\omega\left(\frac{\beta}{2} - d_\beta(\Delta\tau)\right)\right]
}{
2\sinh(\beta\omega/2)
}.
}
$$

> **旧版记号勘误**：此前版本用 $|\Delta\tau|_\beta$ 同时表示有向余数和无向距离，这是不规范的。本文自此以下统一使用 $u_\beta$（有向）和 $d_\beta$（无向）。

### 12.2 自旋相干态符号

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
s_z =
S\frac{1-|z|^2}{1+|z|^2},
\qquad
s_+ =
\frac{2Sz}{1+|z|^2},
\qquad
s_- =
\frac{2S\bar z}{1+|z|^2}.
$$

并有 $s_x=\frac{s_++s_-}{2}$，$s_y=\frac{s_+-s_-}{2i}$。对自旋 $1/2$，$\hat J_\alpha=\frac12\hat\sigma_\alpha$。

---

**第二部分：离散单模情形。** 下面把 $\hat\varrho_\mu$ 分别代入 Rabi、JC、XXZ 的单模版本。"单模"对 Rabi 和 JC 是一个玻色振子；对 XXZ，若要求得到对角结构，需让不同自旋分量耦合到彼此独立的玻色通道——因此"单模 XXZ"更准确地说：**每个独立耦合通道只有一个模式**（否则一个共同模式同时耦合多分量会产生交叉项，见 §15.3）。

## 13. 单模 Rabi

### 13.1 哈密顿量

采用旋转后的 Rabi 写法

$$
\boxed{
\hat H_{\mathrm R} =
-h_x\hat J_x +
\omega_0\hat a^\dagger\hat a +
g(\hat a^\dagger+\hat a)\hat J_z.
}
$$

将耦合项与一般形式比较：

$$
\hat a^\dagger\hat\varrho +
\hat\varrho^\dagger\hat a =
g\hat a^\dagger\hat J_z +
g\hat J_z\hat a.
$$

因此 $\hat\varrho=g\hat J_z$，$\hat\varrho^\dagger=g\hat J_z$——**厄米耦合**。对应的相干态符号是 $\varrho(\tau)=g\,s_z(\tau)$，纯自旋部分为 $h_{\mathrm s}(\tau)=-h_xs_x(\tau)$。

### 13.2 代入一般有效作用量

一般推迟项为 $-\iint\varrho^\dagger(\tau)D_{\omega_0}(\tau-\tau')\varrho(\tau')$，代入 $\varrho=\varrho^\dagger=gs_z$ 得到

$$
S_{\mathrm{ret}}^{\mathrm R} =
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
D_{\omega_0}(\tau-\tau') +
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
S_{\mathrm B}^{\mathrm{spin}} -
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
S_{\mathrm B}^{\mathrm{spin}} -
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
Z_{\mathrm{Rabi}}^{(1)} =
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
\hat H_{\mathrm{JC}} =
-h_z\hat J_z +
\omega_0\hat a^\dagger\hat a +
g\left(
\hat a^\dagger\hat J_- +
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
S_{\mathrm{ret}}^{\mathrm{JC}} =
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
S_{\mathrm B}^{\mathrm{spin}} -
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
Z_{\mathrm{JC}}^{(1)} =
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
&\qquad +
n_B
e^{+\omega_0(\tau-\tau')}
s_+(\tau')s_-(\tau)
\Big].
\end{aligned}
}
$$

第一项对应正向虚时间传播，第二项对应通过热圆周绕回来的过程。零温极限下 $n_B\to 0$，于是只剩

$$
S_{\mathrm{ret}}^{\mathrm{JC},T=0} =
-g^2
\int_{\tau>\tau'}
d\tau d\tau'\,
e^{-\omega_0(\tau-\tau')}
s_+(\tau)s_-(\tau').
$$

这说明 **JC 的核在零温下仍然是有方向的**——这是 JC 与 Rabi/XXZ 最根本的差别。

### 14.4 JC 推迟项的 $D_+/D_-$ 完整分解

"不能对称化"并不意味着不能分解。定义反对称传播子

$$
\boxed{
D_{\omega,-}(\Delta\tau) \equiv
\frac12\left[D_\omega(\Delta\tau) - D_\omega(-\Delta\tau)\right],
}
$$

其 Matsubara 表示为 $D_{\omega,-}(i\nu_n)=i\nu_n/(\omega^2+\nu_n^2)$（见 §10.4）。则可以将 JC 推迟项严格分解为对称部分与反对称部分：

$$
\boxed{
\begin{aligned}
I_{\mathrm{JC}}
&=
\iint s_+(\tau) D_\omega(\tau-\tau') s_-(\tau')
\\
&=
\frac12 \iint
\left[s_+(\tau)s_-(\tau') + s_+(\tau')s_-(\tau)\right]
D_{\omega,+}(\tau-\tau')
\\
&\quad +
\frac12 \iint
\left[s_+(\tau)s_-(\tau') - s_+(\tau')s_-(\tau)\right]
D_{\omega,-}(\tau-\tau').
\end{aligned}
}
$$

用 $s_x,s_y$ 写出更为透明。利用 $s_\pm = s_x \pm i s_y$：

$$
\boxed{
\begin{aligned}
I_{\mathrm{JC}}
=&
\iint D_{\omega,+}(\tau-\tau')
\Big[s_x(\tau)s_x(\tau') + s_y(\tau)s_y(\tau')\Big]
\\
&+
i\iint D_{\omega,-}(\tau-\tau')
\Big[s_y(\tau)s_x(\tau') - s_x(\tau)s_y(\tau')\Big].
\end{aligned}
}
$$

因此 **JC 并非完全不能分解为对称核——而是不能只保留对称核**。它包含两项：
- **对称的横向交换项**（由 $D_+$ 控制），形式上与 XXZ 的 $J_xJ_x+J_yJ_y$ 部分完全相同；
- **反对称有向项**（由 $D_-$ 控制），携带 $s_x,s_y$ 之间的反对称时序结构，是 JC 独有的。

零温下 $D_-$ 仍然非零（$\lim_{\beta\to\infty} D_{\omega,-}(i\nu_n) = i\nu_n/(\omega^2+\nu_n^2)$），因此即使 $T=0$，反对称部分也存活。这比单纯说"不能对称化"更精确：**JC 与横向 XXZ 的差别在于多了由 $D_-$ 控制的反对称有向项**。

另外，沿物理积分轮廓 $\bar z=z^*$，$s_x,s_y$ 为实数，因此 $D_+$ 项为实数，而 $D_-$ 项（前面带有 $i$）一般贡献复相位。这意味着 JC 的相干态有效作用量一般是**复的**——这对数值方法（QMC 有无符号问题）有直接影响。

> **措辞修正**：上文"JC 的推迟核因果地指向未来"应改为"JC 的核在虚时间热圆周上保持有向的算符排序结构"。这是 Euclidean/Matsubara 热传播子，方向性表示的是虚时间排序和 $\hat a$ 与 $\hat a^\dagger$ 的算符顺序，而非实时间因果性。

---

## 15. 单模 XXZ 对称的自旋-玻色耦合

> **命名说明**：本节得到的有效作用量是同一自旋在不同虚时间之间的各向异性推迟自相互作用 $-\iint K_\alpha(\tau-\tau') s_\alpha(\tau)s_\alpha(\tau')$，它并不等于通常的瞬时空间 XXZ 哈密顿量 $H_{\mathrm{XXZ}}=\sum_{\langle ij\rangle}[J_\perp(S_i^xS_j^x+S_i^yS_j^y)+J_zS_i^zS_j^z]$。称其为"XXZ"是指浴耦合具有 $x,y$ 通道的各向同性（$g_x=g_y$，$J_{xx}=J_{yy}$），这是一种 $U(1)$ 对称的双浴/三通道自旋-玻色模型。

### 15.1 独立通道：最简单的对角实现

彼此独立的浴通道是得到对角 XXZ 核的最简单充分条件——但并非必要条件（真正条件见 §15.3 和 §18.3）。考虑三个独立玻色模式 $\hat a_x,\hat a_y,\hat a_z$，哈密顿量写成

$$
\boxed{
\begin{aligned}
\hat H_{\mathrm{XXZ}}^{(1)}
={}&
\hat H_{\mathrm s} +
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
S_{\mathrm{ret}}^{\mathrm{XXZ}} = -
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
s_x(\tau)s_x(\tau') +
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
s_+(\tau)s_-(\tau') +
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
S_{\mathrm{eff}}^{\mathrm{XXZ},1} =
S_{\mathrm B}^{\mathrm{spin}} +
\int_0^\beta d\tau\,h_{\mathrm s}(\tau) +
S_{\mathrm{ret}}^{\mathrm{XXZ},1}.
}
$$

自由玻色配分函数为

$$
\boxed{
Z_{\mathrm b}^{(0)} =
\frac{1}{
(1-e^{-\beta\omega_\perp})^2
(1-e^{-\beta\omega_z})
}.
}
$$

所以

$$
\boxed{
Z_{\mathrm{XXZ}}^{(1)} =
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
\hat H_{\mathrm{sb}} =
(\hat a^\dagger+\hat a)
\left(
g_x\hat J_x +
g_y\hat J_y +
g_z\hat J_z
\right),
$$

那么 $\hat\varrho=g_x\hat J_x+g_y\hat J_y+g_z\hat J_z$。积去玻色子后：

$$
\begin{aligned}
S_{\mathrm{ret}} = -
\sum_{\alpha,\beta=x,y,z}
g_\alpha g_\beta
\iint
s_\alpha(\tau)
D_+(\tau-\tau')
s_\beta(\tau').
\end{aligned}
$$

除了 $s_xs_x$、$s_ys_y$、$s_zs_z$，还会出现 $s_xs_y$、$s_xs_z$、$s_ys_z$ 等交叉项。因此，一个共同模式通常产生的是一个**秩一耦合矩阵** $K_{\alpha\beta}\propto g_\alpha g_\beta$，而不是对角 XXZ 结构。

**一般情况下得到对角 XXZ 核的真正条件**是：矩阵谱函数 $J_{\alpha\beta}(\omega)$（定义见 §18.3）在所选自旋基底中对角化，即 $J_{\alpha\beta}(\omega)=0$（$\alpha\neq\beta$），且 $J_{xx}(\omega)=J_{yy}(\omega)$。彼此独立的浴通道（每个 $\alpha$ 有自己的一套模式）是满足这一条件的简单充分构造，但即使某些单个模式同时耦合多个分量，只要所有模式求和后的交叉谱密度消失，仍然可以得到对角核。Weber 等人的 $U(1)$ 对称双浴模型采用的正是相同而独立的横向浴，是一种标准且合理的实现（[arXiv:2108.01131](https://arxiv.org/abs/2108.01131)）。

---

**第三部分：连续谱函数情形。** 下面把同样的 $\hat\varrho_\mu$ 代入连续谱浴——大量模式求和，用谱函数 $J(\omega)$ 表示。连续谱情形的哈密顿量包含大量模式 $\sum_q\omega_q a_q^\dagger a_q$。定义谱函数

$$
\boxed{
J(\omega) =
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
\hat H_{\mathrm R}^{\mathrm{bath}} =
-h_x\hat J_x +
\sum_q
\omega_q\hat a_q^\dagger\hat a_q +
\sum_q
g_q(\hat a_q^\dagger+\hat a_q)\hat J_z.
}
$$

对每个模式 $\hat\varrho_q=g_q\hat J_z=\hat\varrho_q^\dagger$（厄米）。因此

$$
S_{\mathrm{ret}} =
-\sum_q g_q^2
\iint
s_z(\tau)
D_{\omega_q,+}(\tau-\tau')
s_z(\tau').
$$

定义 Rabi 对称核

$$
\boxed{
K_{\mathrm R,+}(\Delta\tau) =
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm R}(\omega)
D_{\omega,+}(\Delta\tau) =
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm R}(\omega)
\frac{
\cosh\left[
\omega\left(
\frac{\beta}{2} -
d_\beta(\Delta\tau)
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
S_{\mathrm B}^{\mathrm{spin}} -
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
} =
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{Rabi},J}}.
}
$$

若定义 Kirchner 型核 $\chi_{\mathrm R}^{-1}(\Delta\tau)\equiv 2K_{\mathrm R,+}(\Delta\tau)$，则

$$
\boxed{
\chi_{\mathrm R}^{-1}(\Delta\tau) =
\int_0^\infty
\frac{d\omega}{\pi}
J_{\mathrm R}(\omega)
\frac{
\cosh\left[
\omega\left(
\frac{\beta}{2} -
d_\beta(\Delta\tau)
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
-h_z\hat J_z +
\sum_q
\omega_q\hat a_q^\dagger\hat a_q
\\
&+
\sum_q
g_q
\left(
\hat a_q^\dagger\hat J_- +
\hat J_+\hat a_q
\right).
\end{aligned}
}
$$

对每个模式 $\hat\varrho_q=g_q\hat J_-$，$\hat\varrho_q^\dagger=g_q\hat J_+$（非厄米）。因此

$$
S_{\mathrm{ret}} =
-\sum_q g_q^2
\iint
s_+(\tau)
D_{\omega_q}(\tau-\tau')
s_-(\tau').
$$

定义有方向的 JC 核

$$
\boxed{
K_{\mathrm{JC}}^{\rightarrow}(\Delta\tau) =
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
S_{\mathrm B}^{\mathrm{spin}} -
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
} =
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{JC},J}}.
}
$$

### 17.2 JC 谱核的分段形式

对 $0<\Delta\tau<\beta$，有

$$
\boxed{
K_{\mathrm{JC}}^{\rightarrow}(\Delta\tau) =
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
K_{\mathrm{JC}}^{\rightarrow}(\Delta\tau) =
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
\hat H_{\mathrm s} +
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
\hat a_{q\ell}^\dagger +
\hat a_{q\ell}
\right)
\hat J_\ell .
\end{aligned}
}
$$

对每个模式和通道 $\hat\varrho_{q\ell}=g_{q\ell}\hat J_\ell=\hat\varrho_{q\ell}^\dagger$（厄米）。定义三个谱函数

$$
\boxed{
J_\ell(\omega) =
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
K_\ell(\Delta\tau) =
\int_0^\infty
\frac{d\omega}{\pi}
J_\ell(\omega)
D_{\omega,+}(\Delta\tau) =
\int_0^\infty
\frac{d\omega}{\pi}
J_\ell(\omega)
\frac{
\cosh\left[
\omega\left(
\frac{\beta}{2} -
d_\beta(\Delta\tau)
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
={}& -
\iint
K_\perp(\tau-\tau')
\\
&\qquad\times
\left[
s_x(\tau)s_x(\tau') +
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
s_+(\tau)s_-(\tau') +
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
S_{\mathrm{eff}}^{\mathrm{XXZ},J} =
S_{\mathrm B}^{\mathrm{spin}} +
\int_0^\beta d\tau\,h_{\mathrm s}(\tau) +
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
} =
\int\mathcal D\mu_S\,
e^{-S_{\mathrm{eff}}^{\mathrm{XXZ},J}}.
}
$$

### 18.3 一般共同浴需要矩阵谱函数

如果同一个浴模式同时耦合多个分量：$\hat\varrho_q=\sum_{\alpha=x,y,z}g_{q\alpha}\hat J_\alpha$，由于 $g_{q\alpha}$ 可为复数，$\hat\varrho_q$ 一般不是厄米算符——因此**不能**预先将传播子对称化为 $D_{\omega,+}$。正确的一般式保留有向传播子，定义**矩阵谱函数**

$$
\boxed{
J_{\alpha\beta}(\omega) =
\pi
\sum_q
g_{q\alpha}^* g_{q\beta}
\delta(\omega-\omega_q),
}
$$

它是厄米正半定矩阵（$J_{\beta\alpha}=J_{\alpha\beta}^*$，且对任意向量 $v_\alpha$ 有 $\sum_{\alpha\beta}v_\alpha^* J_{\alpha\beta}v_\beta\ge 0$）。有效作用量与核为

$$
\boxed{
\begin{aligned}
S_{\mathrm{ret}} &= -
\sum_{\alpha,\beta}
\iint
s_\alpha(\tau)
K_{\alpha\beta}^{\rightarrow}(\tau-\tau')
s_\beta(\tau'), \\[4pt]
K_{\alpha\beta}^{\rightarrow}(\Delta\tau) &=
\int_0^\infty \frac{d\omega}{\pi}
J_{\alpha\beta}(\omega)
D_\omega(\Delta\tau).
\end{aligned}
}
$$

注意这里用的是**有向** $D_\omega$，而非对称 $D_{\omega,+}$。

**实部/虚部分解（作用量层面）**。将厄米矩阵谱函数写成

$$
\boxed{
J_{\alpha\beta}(\omega) =
J_{\alpha\beta}^{\mathrm R}(\omega) +
i J_{\alpha\beta}^{\mathrm I}(\omega),
}
$$

其中 $J^{\mathrm R}$ 为实对称矩阵，$J^{\mathrm I}$ 为实反对称矩阵。将 $J_{\alpha\beta}$ 和 $D_\omega = D_{\omega,+} + D_{\omega,-}$ 代入完整作用量：

$$
\begin{aligned}
S_{\mathrm{ret}} &=
-\sum_{\alpha,\beta}\iint
s_\alpha(\tau)
\int_0^\infty\frac{d\omega}{\pi}
J_{\alpha\beta}(\omega) D_\omega(\tau-\tau')
s_\beta(\tau') \\
&=
-\sum_{\alpha,\beta}\iint
s_\alpha(\tau)
\int_0^\infty\frac{d\omega}{\pi}
\Big[
J_{\alpha\beta}^{\mathrm R} D_{\omega,+}
+
J_{\alpha\beta}^{\mathrm R} D_{\omega,-}
+
i J_{\alpha\beta}^{\mathrm I} D_{\omega,+}
+
i J_{\alpha\beta}^{\mathrm I} D_{\omega,-}
\Big]
s_\beta(\tau').
\end{aligned}
$$

在同时交换积分哑变量 $(\alpha,\tau)\leftrightarrow(\beta,\tau')$ 后：
- $J^{\mathrm R}_{\alpha\beta} D_{\omega,-}(\tau-\tau')$ 项因 $J^{\mathrm R}$ 对称而 $D_-$ 反对称，积分为零；
- $i J^{\mathrm I}_{\alpha\beta} D_{\omega,+}(\tau-\tau')$ 项因 $J^{\mathrm I}$ 反对称而 $D_+$ 对称，积分为零。

因此**仅剩两项**，作用量级的有效形式为

$$
\boxed{
\begin{aligned}
S_{\mathrm{ret}} =
-\sum_{\alpha,\beta}\iint
s_\alpha(\tau)
\int_0^\infty\frac{d\omega}{\pi}
\Big[
&J_{\alpha\beta}^{\mathrm R}(\omega)
D_{\omega,+}(\tau-\tau')
\\
&+
i J_{\alpha\beta}^{\mathrm I}(\omega)
D_{\omega,-}(\tau-\tau')
\Big]
s_\beta(\tau').
\end{aligned}
}
$$

> **注意**：上式是**作用量层面**的化简，利用了 $J^{\mathrm R}$/$J^{\mathrm I}$ 的对称性以及 $D_+$/$D_-$ 的奇偶性在交换积分变量后抵消——并非原始矩阵核 $K_{\alpha\beta}^{\rightarrow}$ 逐元素等于 $J^{\mathrm R}D_+ + i J^{\mathrm I}D_-$。

因此：
- 实对称谱矩阵 $\leftrightarrow$ 在作用量中搭配 $D_{\omega,+}$；
- 虚反对称谱矩阵 $\leftrightarrow$ 在作用量中搭配 $i D_{\omega,-}$。

**回退到已有特例**：
- 若所有 $g_{q\alpha}$ 均为实数，则 $J^{\mathrm I}=0$；$J^{\mathrm R}D_-$ 项虽在核矩阵元中存在，但在完整双线性作用量中因反对称性积分为零。因此最终作用量中只剩 $J^{\mathrm R}D_+$——这覆盖本文 Rabi 和独立通道 XXZ 的情形；
- JC 的 $\hat\varrho_q = g_q\hat J_- = g_q(\hat J_x - i\hat J_y)$，此时 $J^{\mathrm I}_{xy} = -J^{\mathrm I}_{yx} \neq 0$，必须保留 $D_-$ 项。

**得到对角 XXZ 核的条件**（在所选自旋基底中）：

$$
\boxed{
J^{\mathrm I}_{\alpha\beta}=0,\qquad
J^{\mathrm R}_{\alpha\beta}=0\;\;(\alpha\neq\beta),\qquad
J^{\mathrm R}_{xx}=J^{\mathrm R}_{yy}.
}
$$

独立浴通道是实现这一条件的简单充分构造，但非唯一方式。

---

**第四部分：统一视角与长程行为。** 下面把单模与连续谱联系起来，并考察幂律谱下推迟核的长程虚时间行为。

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
J_\ell(\omega) =
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

它不是 $|\tau|^{-1-s}$，而是**带方向的** $\Theta(\tau)\tau^{-1-s}$。这正是 JC 与 Rabi/XXZ 在积去玻色子后最根本的差别：前者的推迟核在虚时间热圆周上保持有向的算符排序结构，后者的推迟核在时间上对称。

**幂律近似的适用范围**：上述推导在硬截止谱下将积分上限从 $\omega_c$ 延伸到 $\infty$，是长时间近似，要求

$$
\boxed{\omega_c^{-1} \ll |\tau| \ll \beta}
$$

零温时则为 $\omega_c^{-1}\ll|\tau|$。有限温度下虚时间是圆，最大无向距离只有 $\beta/2$，不存在无限大的 $|\tau|$——因此有限温幂律尾部应在 $|\tau|\sim\beta/2$ 处截断。此外，$s>-1$ 保证 Laplace 积分在低频可积；若还要求静态位移 $\int_0^\infty d\omega\,J(\omega)/\omega$ 收敛，通常需要更强的红外条件（如 $s>0$ 的 Ohmic 族）。

---

## 21. 六种情况汇总

| 模型 | 模式结构 | $\hat\varrho$ | 核 | 推迟自旋结构 |
|------|---------|--------------|-----|-------------|
| 单模 Rabi | 一个模式 | $gJ_z$ | $D_{\omega_0,+}$ | $s_z(\tau)s_z(\tau')$ |
| 谱 Rabi | $J_{\mathrm R}(\omega)$ | $g_qJ_z$ | $K_{\mathrm R,+}$ | $s_z(\tau)s_z(\tau')$ |
| 单模 JC | 一个模式 | $gJ_-$ | $D_{\omega_0}$ | $s_+(\tau)s_-(\tau')$ |
| 谱 JC | $J_{\mathrm{JC}}(\omega)$ | $g_qJ_-$ | $K_{\mathrm{JC}}^\rightarrow$ | $s_+(\tau)s_-(\tau')$ |
| 单模 XXZ | 每通道一个模式 | $g_\ell J_\ell$ | $D_{\omega_\ell,+}$ | $s_x(\tau)s_x(\tau')+s_y(\tau)s_y(\tau')+\text{各向异性 }s_z(\tau)s_z(\tau')$ |
| 谱 XXZ | $J_\perp,J_z$ | $g_{q\ell}J_\ell$ | $K_\perp,K_z$ | $\frac12[s_+(\tau)s_-(\tau')+s_-(\tau)s_+(\tau')]+s_z(\tau)s_z(\tau')$ |

### 21.1 统一结论：从 $\hat\varrho$ 到传播子结构

三种模型的 $\hat\varrho$ 分别为 $gJ_z$（Rabi）、$gJ_-$（JC）、$g_\ell J_\ell$（XXZ 对称耦合）。厄米性（$\hat\varrho^\dagger=\hat\varrho$ 还是 $\hat\varrho^\dagger\neq\hat\varrho$）是一个方便的一阶判据——$\hat\varrho^\dagger=\hat\varrho$ 时传播子可对称化为 $D_+$，$\hat\varrho^\dagger\neq\hat\varrho$ 时必须保留有方向的 $D$（或其 $D_+/D_-$ 分解）。

但厄米性并非模型的唯一根本区别。更深层的差异包括：

### 21.2 对称性与守恒量

$$
\begin{array}{c|c|c|c}
\text{模型} & \text{对称性} & \text{守恒量} & \text{传播子结构} \\
\hline
\text{Rabi} & \mathbb Z_2 & \text{宇称 } \hat\Pi=(-1)^{\hat a^\dagger\hat a}\hat\sigma_x & D_+ \text{（对称）} \\
\text{JC} & U(1) & N_{\mathrm{ex}}=\hat a^\dagger\hat a+\hat J_z+S & D = D_+ + D_- \text{（有向）} \\
\text{XXZ 对称浴} & U(1) & \text{自旋-浴通道联合旋转} & D_+ \text{（对称，对角）}
\end{array}
$$

> **Rabi 宇称与旋转约定**：本文采用 $H_{\mathrm R}=-h_x\hat J_x+\omega\hat a^\dagger\hat a+g(\hat a+\hat a^\dagger)\hat J_z$，其 $\mathbb Z_2$ 变换为 $\hat a\to-\hat a$、$\hat J_z\to-\hat J_z$、$\hat J_x\to\hat J_x$。对 $S=1/2$，$\hat\sigma_x\hat\sigma_z\hat\sigma_x=-\hat\sigma_z$，故 $\hat\Pi=(-1)^{\hat a^\dagger\hat a}\hat\sigma_x$。对一般自旋 $S$，可写为 $\hat\Pi=\exp[i\pi(\hat a^\dagger\hat a+\hat J_x+S)]$（整体相位不影响对称性）。注意 $(-1)^{\hat a^\dagger\hat a}\hat\sigma_z$ 对应的是未旋转的标准 Rabi 写法 $H\sim\Omega\hat\sigma_z+g(\hat a+\hat a^\dagger)\hat\sigma_x$，而非本文使用的约定。

积掉玻色场后，有效作用量仍保留相应的对称性——这是检验推导正确性的重要交叉验证。

### 21.3 其他区分模型的关键因素

除厄米性和对称性外，以下因素同样决定模型的物理行为：
- **耦合矩阵的秩与通道数**：单实象限耦合通道（Rabi）、单复模式两个正交象限耦合横向自旋（JC：$a=(q+ip)/\sqrt2$，$a^\dagger J_-+J_+a=\sqrt2(qJ_x-pJ_y)$）、两个或三个独立浴通道（XXZ）；
- **谱的红外结构**：单模（$\delta$ 峰）vs. 连续谱（sub-Ohmic/Ohmic/super-Ohmic），决定是否存在真正的量子临界行为；
- **是否存在复相位**：JC 的 $D_-$ 项贡献复相位，可能影响 QMC 的符号问题；
- **静态位移与重整化**：厄米坐标耦合产生静态能量降低 $\lambda=\int_0^\infty\frac{d\omega}{\pi}\frac{J(\omega)}{\omega}$，在静态/绝热近似下产生单离子各向异性；若 $\hat H_{\mathrm s}$ 不与 $\hat J_z$ 对易还会重整化横场动力学（见 §22）。

因此，更完整的表述是：

$$
\boxed{
\begin{aligned}
&\text{厄米性}\;\hat\varrho^\dagger=\hat\varrho
\;\Rightarrow\;
D\ \text{可对称化为}\ D_+ \quad\text{（Rabi, XXZ）} \\
&\text{非厄米}\;\hat\varrho^\dagger\neq\hat\varrho
\;\Rightarrow\;
\text{必须保留有向结构}\ D=D_++D_- \quad\text{（JC）}
\end{aligned}
}
$$

但同属厄米类的 Rabi 与 XXZ，其对称性（$\mathbb Z_2$ vs. $U(1)$）、通道数（1 vs. 3）和谱结构仍然导致不同的物理——厄米性只是第一层分类。

---

## 22. 静态位移与反项

对厄米坐标耦合（Rabi、XXZ），推迟核包含静态能量降低。考虑核的静态积分（对所有 $\omega>0$）：

$$
\boxed{
\int_0^\beta d\tau\, D_{\omega,+}(\tau) = \frac{1}{\omega}.
}
$$

因此定义静态耦合强度

$$
\boxed{
\lambda_z \equiv \int_0^\infty \frac{d\omega}{\pi} \frac{J_z(\omega)}{\omega}.
}
$$

### 22.1 零 Matsubara 模分解（非局域项，非局域 $s_z^2$）

$K_+(\tau)$ 的零频分量为 $\lambda_z/\beta$。将核分解为

$$
\boxed{
K_+(\tau) = \frac{\lambda_z}{\beta} + \widetilde K_+(\tau),
\qquad
\int_0^\beta d\tau\,\widetilde K_+(\tau) = 0.
}
$$

按照本文第 16 节的约定（无外部 $1/2$ 因子），推迟项为

$$
\boxed{
\begin{aligned}
S_{\mathrm{ret}}
&= -\iint s_z(\tau) K_+(\tau-\tau') s_z(\tau')
\\
&= -\frac{\lambda_z}{\beta}
\left[\int_0^\beta d\tau\, s_z(\tau)\right]^2
\;-\; \iint s_z(\tau) \widetilde K_+(\tau-\tau') s_z(\tau').
\end{aligned}
}
$$

**关键点**：第一项是全局虚时间非局域项——它耦合了 $s_z$ 在整个 $[0,\beta]$ 上的平均值，**不是**局域的 $-\lambda_z\int d\tau\,s_z(\tau)^2$。不能写成 $\int s_z(\tau)^2$ 的局域形式。

### 22.2 静态/绝热极限

仅在**静态路径或绝热近似** $s_z(\tau)\simeq s_z$（常数）下：

$$
-\frac{\lambda_z}{\beta}(\beta s_z)^2 = -\beta\lambda_z s_z^2,
$$

此时才可解释为类似单离子各向异性的静态能量降低。若 $\hat H_{\mathrm s}$ 不与 $\hat J_z$ 对易（例如 Rabi 模型含 $\hat J_x$ 横场项），玻色位移还会重整化横场动力学——不能简单归约为局域 $J_z^2$ 项。

因此，关于 $S=1/2$ 只产生常数、$S>1/2$ 产生单离子各向异性、多自旋产生瞬时交换等结论，均需限定在**静态近似或 $\hat H_{\mathrm s}$ 与 $\hat J_z$ 对易**的前提下。

### 22.3 紫外发散类型

对你采用的幂律谱

$$
J(\omega) = 2\pi\alpha\,\omega_c^{1-s}\omega^s\,\Theta(\omega_c-\omega),
$$

静态位移为

$$
\boxed{
\lambda = 2\alpha\,\omega_c^{1-s}\int_0^{\omega_c} \omega^{s-1}d\omega
= \frac{2\alpha}{s}\,\omega_c,
\qquad s>0.
}
$$

- **$s>0$**（sub-Ohmic $0<s<1$、Ohmic $s=1$ 及 super-Ohmic $s>1$）：红外端 $\lambda$ 收敛；在本文带 $\omega_c^{1-s}$ 的参数化下 $\lambda\propto\omega_c$，当 $\omega_c\to\infty$ 时呈线性紫外增长；
- **$s=0$**：引入红外截止 $\omega_{\mathrm{IR}}$ 后 $\lambda_{s=0}=2\alpha\omega_c\ln(\omega_c/\omega_{\mathrm{IR}})$，为红外对数发散（结果也依赖紫外尺度 $\omega_c$）；
- **$s<0$**：低频幂律发散，需红外截断。

因此，若 $\lambda$ 紫外发散，需要 counterterm 或参数重整化吸收到裸自旋哈密顿量中。

---

## 23. 一致性检查

以下三个简单极限可作为推导正确性的交叉验证。

### 23.1 自由极限

$g_\mu=0$（所有耦合关闭）时，推迟项消失：

$$
Z = Z_{\mathrm b}^{(0)} \int\mathcal D\mu_S\, e^{-S_{\mathrm B}^{\mathrm{spin}} - \int h_{\mathrm s}} = Z_{\mathrm b}^{(0)} Z_{\mathrm s}^{(0)},
$$

配分函数分解为自由玻色浴和自由自旋的乘积，与直接求迹 $\operatorname{Tr}e^{-\beta(\hat H_{\mathrm s}+\hat H_{\mathrm b})}$ 一致。

### 23.2 核的静态积分

对所有 $\omega>0$：

$$
\boxed{
\int_0^\beta d\tau\, D_\omega(\tau) = \int_0^\beta d\tau\, D_{\omega,+}(\tau) = \frac{1}{\omega}.
}
$$

反对称核积分为零：$\int_0^\beta d\tau\, D_{\omega,-}(\tau)=0$。这保证静态极限下方向性消失，与高温下所有模型趋同的物理一致。

### 23.3 高温与零温极限

**零温**（$\beta\omega\gg 1$）：

$$
D_{\omega,+}(\tau) \to \frac12 e^{-\omega|\tau|},
\qquad
D_{\omega,-}(\tau) \to \frac12\operatorname{sgn}(\tau) e^{-\omega|\tau|}.
$$

**高温**（$\beta\omega\ll 1$，令 $x=\beta\omega$，$y=\tau/\beta$）：

$$
\boxed{
D_{\omega,+}(\tau) \sim \frac{1}{\beta\omega} + O(\beta\omega),
\qquad
D_{\omega,-}(\tau) \sim \frac12 - \frac{\tau}{\beta} + O(\beta\omega).
}
$$

$D_-$ 本身并不在高温极限逐点趋于零——但它相对于巨大的零频部分被抑制：

$$
\boxed{
\frac{D_-}{D_+} = O(\beta\omega).
}
$$

因此高温下有向结构在静态热力学量中相对减弱。$D_+\simeq 1/(\beta\omega)$ 是近似**常数核**（零 Matsubara 模主导），在整个虚时间圆上全局耦合——它并非局域的 $\delta(\tau-\tau')$，不能称作"无记忆"。

---

## 24. 单模不自动意味着相变

从有效作用量出现长时间或非局域核，不能直接推出量子相变。具体而言：

- **有限参数单模 Rabi**：一般只有 crossover（能级免交叉），量子相变需要特定的缩放极限（如原子频率与振子频率之比趋于无穷）。有限频率比下主要表现为有限频率标度和交叉行为（参见 [arXiv:1503.03090](https://arxiv.org/abs/1503.03090)）。
- **单模 JC**：零温下可有不同激发数扇区之间的基态能级交叉（ground-state level crossing），即基态所属总激发数发生阶梯式转变——这不是通常意义上的激发态量子相变（excited-state QPT），而是基态的逐级 level crossing（参见 [arXiv:1603.03943](https://arxiv.org/abs/1603.03943)）。在有限温度下，这些零温台阶被热混合平滑。
- **连续 sub-Ohmic 浴（$0<s<1$）**：对标准单浴 Ising 型 spin-boson 模型，通常表现为局域化—离域化之间的**连续零温二级量子相变**。
- **连续 Ohmic 浴（$s=1$）**：对标准单浴 Ising 型 spin-boson 模型，出现 **Kosterlitz–Thouless（BKT）型量子相变**，临界行为与 sub-Ohmic 的连续二级转变本质不同。
- **$U(1)$ 双浴、XXZ 对称浴或 JC 型有向耦合**：临界结构需要根据具体对称性和矩阵谱函数另行分析——上述 sub-Ohmic/Ohmic 分类不可直接套用。
- **有限温度**：对固定有限 $S$、有限模式数且哈密顿量稳定的单自旋模型，有限 $\beta$ 下配分函数通常解析，零温能级非解析性被平滑为 crossover。若同时取热力学极限（$S\to\infty$、$N\to\infty$ 或连续扩展系统极限），则需要另行判断是否存在有限温热相变。

不同 $s$ 区间的临界指数及量子—经典映射还需要谱函数的具体分析。因此，结论"有效作用量是非局域的"与"存在有限温相变"之间有一道需要谱函数具体分析才能跨越的鸿沟。

---

## 25. 恢复玻色可观测量

积掉玻色场后，读者可能以为玻色信息全部丢失。实际上可以通过引入外源恢复。

在积掉玻色场之前，向作用量加入外源项：

$$
S_\eta = -\int_0^\beta d\tau\,\left[\bar\eta_\mu(\tau)\phi_\mu(\tau) + \bar\phi_\mu(\tau)\eta_\mu(\tau)\right].
$$

平移高斯积分后得到生成泛函 $Z[\bar\eta,\eta]$。由泛函微分可恢复：

- **平均玻色场**：$\langle a_\mu(\tau)\rangle = -\int d\tau'\, D_\mu(\tau-\tau')\langle\varrho_\mu(\tau')\rangle_{\mathrm s}$——由自旋源完全决定；
- **传播子**：$\langle T_\tau a_\mu(\tau)a_\mu^\dagger(\tau')\rangle = D_\mu(\tau-\tau') + \text{自旋源的双收缩}$；
- **光子数/浴能量**：$\langle a_\mu^\dagger a_\mu\rangle$ 可由等时传播子结合自旋关联函数得到。

这一节对后续算光子数、浴能量、纠缠熵等物理量非常有用——积掉浴并不丢失信息，只是将其编码在自旋关联函数的非局域结构中。

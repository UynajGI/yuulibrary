---
title: "线性响应理论基础笔记"
description: "从小扰动到 Kubo 公式，从响应函数到涨落耗散定理——以大四物理水平消化重组的完整入门教程，连接 Berry 相、Rabi 模型与耗散系统"
date: 2026-07-01
author: "学习笔记（基于 De Nittis & Lein、Jacob & Goold、Ban 等、Henheik & Teufel、Milonni 等）"
source_type: "综合笔记"
source_title: "线性响应理论经典文献"
tags: ["线性响应理论", "Kubo公式", "涨落耗散定理", "谱函数", "格林函数", "Berry相", "Rabi模型"]
weight: 100
---

# 线性响应理论基础笔记

## 0. 这篇笔记要做什么

**线性响应理论（Linear Response Theory, LRT）** 是量子统计物理中最优雅也最实用的框架之一。它的核心问题极其简单：

> *给一个处于平衡态的系统施加一个非常弱的外场，系统会如何响应？*

这个问题驱动了 Kubo 公式、涨落耗散定理、格林函数方法等一系列工具的发展。本笔记从大四物理学生的视角出发，假设你学过量子力学和统计物理，但不假设你熟悉多体理论、场论或高级凝聚态。

**本文与前人综述的关键区别**：不罗列结论，而是展示"每个概念为什么被需要"——从问题出发，逐步构建理论工具。

---

## 1. 线性响应理论的出发点：小扰动下系统如何响应

### 1.1 核心问题

想象一个物理系统——可以是一块金属、一个超导量子比特、或者一个分子——初始时处于热平衡。现在施加一个非常弱的外场（电场、磁场、激光……）。你测量某个可观测量的变化时，希望**只保留线性于外场强度的项**。

这之所以可行，是因为一个深刻的物理事实：

{{< callout type="important" title="核心假设" >}}
**微扰足够小** $\Rightarrow$ 系统偏离平衡不远 $\Rightarrow$ 响应与外场强度成正比。非线性的 $O(F^2)$ 项在弱场极限下可忽略。
{{< /callout >}}

### 1.2 为什么要关注"线性"响应？

三个原因：

1. **普适性**：线性响应系数（如电导率 $\sigma$、磁化率 $\chi$）是材料的**内禀性质**，不依赖于外场的具体细节
2. **可测性**：实验中测量的几乎都是线性响应——交流电导率、中子散射截面、核磁共振谱线
3. **理论基础**：线性响应是通往非平衡统计力学的门户——理解"系统离平衡不远时如何行为"，是理解更复杂非平衡现象的前提

### 1.3 经典类比：阻尼谐振子

在进入量子力学之前，先看一个经典例子。考虑受迫阻尼谐振子：

$$
m\ddot{x} + m\gamma \dot{x} + m\omega_0^2 x = F(t)
$$

当 $F(t)$ 很小时，稳态解为 $x(t) = \int_{-\infty}^t \chi(t - t') F(t') dt'$，其中 $\chi(t) = \frac{1}{m\omega_1} e^{-\gamma t/2} \sin(\omega_1 t)$ （$\omega_1 = \sqrt{\omega_0^2 - \gamma^2/4}$）是**响应函数**。

关键特征：
- **因果性**：$x(t)$ 只依赖于**过去**的力（$t' \le t$）→ $\chi(t) = 0$ for $t < 0$
- **卷积形式**：$\chi(t - t')$ 只依赖于时间差 → 时间平移不变性（平衡态系统的特征）
- **频域简洁性**：Fourier 变换后 $\tilde{x}(\omega) = \tilde{\chi}(\omega) \tilde{F}(\omega)$

量子线性响应的形式完全平行，只是 $\chi(t)$ 现在由系统的**量子力学算符**决定。

### 1.4 适用条件

- 外场强度足够小（$|\Phi| \ll 1$，系统的特征能量尺度）
- 系统初始处于稳态（通常是热平衡态 $\rho_0 \sim e^{-\beta H_0}$）
- 外场是"经典"的（不是量子化的）——即用一个含时函数 $F(t)$ 而非量子算符来描述

---

## 2. 从经典响应到量子响应：为什么需要响应函数

### 2.1 量子系统中的"响应"是什么？

在经典物理中，响应函数联系力 $F(t)$ 和位移 $x(t)$。在量子力学中，我们关心的不是轨道，而是**期望值的变化**：

$$
\Delta \langle A \rangle (t) = \langle A \rangle_{\rho(t)} - \langle A \rangle_{\rho_0}
$$

其中：
- $A$ 是我们要测量的可观测量（如电流 $\hat{J}$、磁化强度 $\hat{M}$）
- $\rho_0$ 是初始平衡态密度矩阵
- $\rho(t)$ 是外场作用下 $t$ 时刻的密度矩阵

### 2.2 量子响应函数的定义

与经典类比，量子线性响应函数 $\phi_{AV}(t)$ 由以下关系定义：

$$
\Delta \langle A \rangle(t) = \int_{-\infty}^t dt' \, \phi_{AV}(t - t') \, F(t')
$$

这里 $F(t)$ 是外场强度（标量函数），$V$ 是与外场耦合的系统算符——即微扰哈密顿量为 $H_{\mathrm{ext}}(t) = -F(t) V$。

{{< callout type="note" title="记号约定" >}}
本文统一采用耦合约定 $H_{\mathrm{ext}}(t) = F(t) V$（$F(t)$ 为经典外场，$V$ 为系统算符）。不同教材可能把负号放在外场耦合里，也可能放在响应函数定义里——只要整篇一致，物理结果不变。例如电偶极与电场耦合常写为 $H_{\mathrm{ext}} = -E(t) d$，在本文约定下可取 $F(t) = E(t)$，$V = -d$；或者 $F(t) = -E(t)$，$V = d$，两种等效。
- $F(t)$：经典外场，含时标量函数
- $V$：与外场耦合的系统算符
- $\phi_{AV}(t)$：响应函数，完全由**未微扰**系统的性质决定
{{< /callout >}}

### 2.3 常见误区

| 误区 | 正解 |
|------|------|
| 响应函数依赖外场形式 | 响应函数是系统内禀性质，只依赖 $H_0, \rho_0, A, V$ |
| 任何小扰动都可以线性响应 | 需要外场是经典含时函数；量子探针（如散射粒子）不一定满足标准 Kubo 形式 |
| 线性响应 = 微扰论 | 线性响应**使用**一阶含时微扰论，但其结论（Kubo 公式）只涉及未微扰系统的关联函数 |

---

## 3. 含时微扰论回顾：外场如何进入哈密顿量

### 3.1 设定

总哈密顿量：

$$
H(t) = H_0 + H_{\mathrm{ext}}(t), \quad H_{\mathrm{ext}}(t) = F(t) V
$$

其中 $H_0$ 是未微扰哈密顿量（已知其本征态和本征值），$H_{\mathrm{ext}}(t)$ 描述外场与系统的耦合。

### 3.2 相互作用表象

为了用微扰论处理外场，转到**相互作用表象**（Dirac 表象）。对任意算符 $O$：

$$
O_I(t) = e^{iH_0 t/\hbar} O e^{-iH_0 t/\hbar}
$$

密度矩阵的演化由 Liouville-von Neumann 方程描述：

$$
\frac{d}{dt} \rho_I(t) = -\frac{i}{\hbar} [H_{\mathrm{ext},I}(t), \rho_I(t)]
$$

### 3.3 一阶微扰展开

将上述方程从初始时刻 $t_0$ 积分到 $t$：

$$
\rho_I(t) = \rho_I(t_0) - \frac{i}{\hbar} \int_{t_0}^t dt' [H_{\mathrm{ext},I}(t'), \rho_I(t')]
$$

一阶微扰意味着在积分号内用 $\rho_I(t') \approx \rho_I(t_0) = \rho_0$：

$$
\rho_I(t) \approx \rho_0 - \frac{i}{\hbar} \int_{t_0}^t dt' [H_{\mathrm{ext},I}(t'), \rho_0]
$$

### 3.4 期望值变化

可观测量 $A$ 的期望值变化：

$$
\begin{aligned}
\Delta \langle A \rangle(t) &= \operatorname{Tr}[A \rho(t)] - \operatorname{Tr}[A \rho_0] \\
&= \operatorname{Tr}[A_I(t) \rho_I(t)] - \operatorname{Tr}[A_I(t) \rho_0] \\
&= -\frac{i}{\hbar} \int_{t_0}^t dt' \operatorname{Tr}\big[A_I(t) [H_{\mathrm{ext},I}(t'), \rho_0]\big] \\
&= -\frac{i}{\hbar} \int_{t_0}^t dt' \operatorname{Tr}\big[[A_I(t), H_{\mathrm{ext},I}(t')] \rho_0\big] \quad \text{(迹的循环性)}
\end{aligned}
$$

代入 $H_{\mathrm{ext},I}(t') = F(t') V_I(t')$：

$$
\Delta \langle A \rangle(t) = -\frac{i}{\hbar} \int_{t_0}^t dt' F(t') \operatorname{Tr}\big[[A_I(t), V_I(t')] \rho_0\big]
$$

### 3.5 关键假设

1. **初始稳态**：$[\rho_0, H_0] = 0$（平衡态与 $H_0$ 对易）→ 可推到第 3 行
2. **外场弱**：仅保留 $F$ 的一阶项
3. **$t_0 \to -\infty$**：外场从无穷过去绝热开启（Kubo 的标准设定）

取 $t_0 \to -\infty$，利用关联函数的时移不变性 $\langle [A_I(t), V_I(t')] \rangle_0 = \langle [A_I(t - t'), V] \rangle_0$：

$$
\boxed{\Delta \langle A \rangle(t) = \int_{-\infty}^t dt' \phi_{AV}(t - t') F(t'), \quad \phi_{AV}(t) = -\frac{i}{\hbar} \theta(t) \operatorname{Tr}\big[[A_I(t), V] \rho_0\big]}
$$

这是**量子响应函数的最基本形式**。$\theta(t)$ 是 Heaviside 阶跃函数（保证因果性——响应不能先于微扰）。

---

## 4. Kubo 公式的详细推导

### 4.1 什么是 Kubo 公式？

Kubo 公式是上节结果的**频域版本**。频域更方便，因为：
- 实验通常用单色（单频）外场
- 响应函数在频域中的解析性质与**因果性**直接相关
- 频域关联函数与**谱函数**的联系更直接

### 4.2 频域转换

令 $F(t) = \frac{1}{2\pi} \int_{-\infty}^{\infty} d\omega \, \tilde{F}(\omega) e^{-i\omega t}$，代入卷积公式：

$$
\begin{aligned}
\Delta \langle A \rangle(t) &= \int_{-\infty}^t dt' \phi_{AV}(t - t') F(t') \\
&= \frac{1}{2\pi} \int_{-\infty}^{\infty} d\omega \, \tilde{F}(\omega) e^{-i\omega t} \int_0^{\infty} d\tau \, \phi_{AV}(\tau) e^{i\omega \tau}
\end{aligned}
$$

定义**广义磁化率（susceptibility）**：

$$
\boxed{\chi_{AV}(\omega) = \int_0^{\infty} dt \, \phi_{AV}(t) e^{i\omega t}}
$$

则 $\Delta \langle A \rangle(t) = \frac{1}{2\pi} \int d\omega \, \chi_{AV}(\omega) \tilde{F}(\omega) e^{-i\omega t}$。

### 4.3 Kubo 公式的显式形式

将 $\phi_{AV}(t)$ 代入 $\chi_{AV}(\omega)$，得到频域 Kubo 公式：

$$
\chi_{AV}(\omega) = -\frac{i}{\hbar} \int_0^{\infty} dt \, e^{i\omega t} \operatorname{Tr}\big[[A_I(t), V] \rho_0\big]
$$

引入正则系综 $\rho_0 = e^{-\beta H_0}/Z$（$Z = \operatorname{Tr}[e^{-\beta H_0}]$），利用 $H_0$ 的本征基 $\{|m\rangle\}$（$H_0 |m\rangle = E_m |m\rangle$）：

{{< callout type="important" title="Kubo 公式的谱分解形式" >}}

$$
\chi_{AV}(\omega) = \sum_{m,n} \frac{e^{-\beta E_m} - e^{-\beta E_n}}{Z} \frac{\langle m|A|n\rangle \langle n|V|m\rangle}{E_m - E_n + \hbar\omega + i\eta}
$$

其中 $\eta \to 0^+$（无穷小正数，来自 $\int_0^{\infty} dt e^{i(\omega + i\eta)t}$ 的收敛因子）。

{{< /callout >}}

### 4.4 推导中的关键步骤

1. **$\theta(t)$ 的 Fourier 变换**：严格地说，为了让积分收敛，需要将外场看成从过去缓慢打开，引入收敛因子：
   $$
   \int_0^{\infty} dt \, e^{i\omega t - 0^+ t} = \frac{i}{\omega + i0^+}
   $$
   其中 $0^+$ 是正无穷小量。它决定了极点从复平面的**上半平面**绕过——正是这个 $i0^+$ 选择了"推迟响应"（因果响应）。下面把所有 $i0^+$ 简写为 $i\eta$（$\eta \to 0^+$，不是物理耗散率，只是数学工具）。

2. **迹的展开**：$\operatorname{Tr}[[A_I(t), V] \rho_0] = \sum_{m,n} (e^{-\beta E_m} - e^{-\beta E_n}) \langle m|A|n\rangle \langle n|V|m\rangle e^{i(E_n - E_m)t/\hbar}/Z$

3. **时间积分**：$\int_0^{\infty} dt e^{i(\omega + (E_n - E_m)/\hbar)t - \eta t} = i\hbar/(E_m - E_n + \hbar\omega + i\hbar\eta)$

### 4.5 物理意义

- **分母** $E_m - E_n + \hbar\omega$：外场频率 $\omega$ 必须匹配系统的能级差 $\Delta E_{nm} = E_n - E_m$ 才能产生显著响应 → **共振条件**
- **权重** $(e^{-\beta E_m} - e^{-\beta E_n})$：只有不同布居数的态之间才有净响应（平衡态下布居数相同 $\Rightarrow$ 无净跃迁）
- **矩阵元** $\langle m|A|n\rangle \langle n|V|m\rangle$：跃迁的选择定则——$A$ 和 $V$ 都必须能连接 $|m\rangle$ 和 $|n\rangle$

### 4.6 完整计算示例：两能级系统的动态磁化率

理论最怕空洞。让我们用 Kubo 公式实际算一个最简单的量子系统——**两能级系统（TLS）在外场下的动态磁化率**。

**模型**：$H_0 = \frac{\hbar\omega_0}{2} \sigma_z$，基态 $|g\rangle$（$E_g = -\hbar\omega_0/2$），激发态 $|e\rangle$（$E_e = +\hbar\omega_0/2$）。

**外场耦合**：外磁场 $B(t)$ 沿 $x$ 方向，$H_{\mathrm{ext}}(t) = -B(t) \mu \sigma_x$，即 $F(t) = B(t)$，$V = \mu \sigma_x$。我们测量 $A = \mu \sigma_x$（磁矩的 $x$ 分量）。

**第一步：计算矩阵元**。在 $\sigma_z$ 的本征基下 $\sigma_x = |e\rangle\langle g| + |g\rangle\langle e|$，非零矩阵元只有 $\langle e|\sigma_x|g\rangle = \langle g|\sigma_x|e\rangle = 1$。

**第二步：写 Kubo 公式的谱分解**。代入 $A = V = \mu\sigma_x$，$Z = 1 + e^{-\beta\hbar\omega_0}$：
$$
\chi_{xx}(\omega) = \mu^2 \sum_{m,n} \frac{e^{-\beta E_m} - e^{-\beta E_n}}{Z} \frac{|\langle m|\sigma_x|n\rangle|^2}{E_m - E_n + \hbar\omega + i\eta}
$$

$(m,n) = (g,e)$ 项：$\Delta E = E_g - E_e = -\hbar\omega_0$，权重 $= (p_g - p_e)$
$(m,n) = (e,g)$ 项：$\Delta E = E_e - E_g = +\hbar\omega_0$，权重 $= (p_e - p_g)$

其中 $p_g = 1/(1+e^{-\beta\hbar\omega_0})$，$p_e = e^{-\beta\hbar\omega_0}/(1+e^{-\beta\hbar\omega_0})$，且 $p_g - p_e = \tanh(\beta\hbar\omega_0/2)$。

**第三步：整理**：
$$
\boxed{\chi_{xx}(\omega) = \frac{\mu^2}{\hbar} \tanh\left(\frac{\beta\hbar\omega_0}{2}\right) \left[\frac{1}{\omega - \omega_0 + i\eta} - \frac{1}{\omega + \omega_0 + i\eta}\right]}
$$

**第四步：取虚部（吸收谱）**。利用 $\Im[(x + i\eta)^{-1}] = -\pi\delta(x)$：
$$
\boxed{\Im[\chi_{xx}(\omega)] = -\frac{\pi\mu^2}{\hbar} \tanh\left(\frac{\beta\hbar\omega_0}{2}\right) \big[\delta(\omega - \omega_0) - \delta(\omega + \omega_0)\big]}
$$

**物理诠释**：
- **吸收峰在 $\omega = \pm\omega_0$**：外场频率必须匹配 TLS 的能级差才能被吸收——共振条件是 Kubo 公式分母 $\hbar\omega + E_m - E_n$ 的必然结果
- **负 $\omega$ 的峰对应受激发射**：系统向外场释放能量（$\omega < 0$ 意味着系统从高能级跃迁到低能级，把能量交给外场）——这是量子系统与经典谐振子的关键区别
- **温度因子 $\tanh(\beta\hbar\omega_0/2)$**：高温下 $p_g \approx p_e$ → 吸收和发射几乎抵消 → 净响应趋近于零。物理上：两能级在高温下"饱和"了，对外场不敏感
- **零温极限**：$\tanh \to 1$ → 只有基态布居 → 只有吸收峰（$\omega = +\omega_0$），无发射——因为 $T=0$ 时系统没有能量可以释放

**验证 FDT**：计算对称关联函数 $C_{xx}(t) = \frac{\mu^2}{2} \langle \{\sigma_x(t), \sigma_x(0)\} \rangle_0$。利用 $\sigma_x(t) = \sigma_+ e^{i\omega_0 t} + \sigma_- e^{-i\omega_0 t}$ 和 $\operatorname{Tr}[\sigma_+ \sigma_- \rho_0] = p_g$，得：
$$
C_{xx}(t) = \mu^2 \cos(\omega_0 t), \qquad C_{xx}(\omega) = \pi\mu^2 \left[\delta(\omega - \omega_0) + \delta(\omega + \omega_0)\right]
$$
代入 FDT $\Im[\chi_{xx}] = -\frac{1}{\hbar}\tanh(\beta\hbar\omega/2) C_{xx}$，利用 $\delta$ 函数的性质 $\tanh(\beta\hbar\omega/2)|_{\omega = \pm\omega_0} = \pm \tanh(\beta\hbar\omega_0/2)$，等式恰好成立。

**实部（色散）**：$\Re[\chi_{xx}(\omega)] = \frac{\mu^2}{\hbar} \tanh(\beta\hbar\omega_0/2) \left[\mathcal{P}\frac{1}{\omega - \omega_0} - \mathcal{P}\frac{1}{\omega + \omega_0}\right]$——在 $\omega = \pm\omega_0$ 处有奇点，远离共振时 $|\Re[\chi]| \sim 1/|\omega - \omega_0|$。实验上测量的是**折射率 $\propto \Re[\chi]$** 和**吸收系数 $\propto \Im[\chi]$**。

{{< callout type="note" title="从两能级到多能级" >}}
多能级系统的 $\chi_{AV}(\omega)$ 就是许多个两能级跃迁的叠加——每个能级对 $(m,n)$ 贡献一个 Lorentzian（或 delta）峰，权重由 Boltzmann 布居差和跃迁矩阵元决定。这就是 Kubo 公式谱分解形式的真正威力：它把**任意量子系统的线性响应**分解为**独立跃迁的加权求和**。
{{< /callout >}}

---

## 5. 因果性、推迟响应函数与对易子

### 5.1 为什么响应函数必须是对易子？

回到实时间响应函数：

$$
\phi_{AV}(t) = -\frac{i}{\hbar} \theta(t) \operatorname{Tr}\big[[A_I(t), V] \rho_0\big]
$$

**对易子 $[A_I(t), V]$ 的来源**：它是从 $\operatorname{Tr}[[A_I(t), V] \rho_0] = \operatorname{Tr}[A_I(t) [V, \rho_0]]$ 这条路径来的。物理上，对易子衡量的是 $t$ 时刻的 $A$ 与 $0$ 时刻的 $V$ 之间的**量子非对易性**——这正是"外场 $V$ 施加后，系统通过量子动力学将扰动传播到 $A$"的数学表达。

### 5.2 推迟响应函数

上节定义的 $\phi_{AV}(t)$ 就是**推迟响应函数**——"推迟"意味着 $A$ 在 $V$ **之后**才响应（$t > 0$ 时才有非零值）：

$$
\phi_{AV}(t) = -\frac{i}{\hbar} \theta(t) \langle [A(t), V(0)] \rangle_0
$$

许多多体教材会定义不含 $1/\hbar$ 的**推迟格林函数**：
$$
G^R_{AV}(t) = -i\theta(t) \langle [A(t), V(0)] \rangle_0
$$
两者只差一个约定因子：$G^R_{AV} = \hbar \cdot \phi_{AV}$。本文统一使用 $\phi_{AV}(t)$ 表示响应核，$\chi_{AV}(\omega)$ 表示它的频域形式（见 §4.2），不再单独引入 $G^R$ 以免混淆。

### 5.3 因果性与 Kramers-Kronig 关系

$\chi_{AV}(\omega)$ 是 $\phi_{AV}(t)$ 的 Fourier-Laplace 变换。由于 $\phi_{AV}(t)$ 仅在 $t \ge 0$ 非零，$\chi_{AV}(\omega)$ 在**上半复 $\omega$ 平面解析**。这导出了 Kramers-Kronig 关系：

$$
\Re[\chi_{AV}(\omega)] = \frac{1}{\pi} \mathcal{P} \int_{-\infty}^{\infty} d\omega' \frac{\Im[\chi_{AV}(\omega')]}{\omega' - \omega}, \quad \Im[\chi_{AV}(\omega)] = -\frac{1}{\pi} \mathcal{P} \int_{-\infty}^{\infty} d\omega' \frac{\Re[\chi_{AV}(\omega')]}{\omega' - \omega}
$$

物理含义：响应函数的实部（色散）和虚部（耗散/吸收）不是独立的——知道吸收谱，就能算出折射率。实验上通常测量 $\Im[\chi]$（吸收谱），再通过 K-K 关系得到 $\Re[\chi]$。

### 5.4 常见误区

- "响应函数就是对易子" → 不完全。响应函数包含 $\theta(t)$（因果性）和 $(-i/\hbar)$（来自 Schrödinger 方程）
- "格林函数就是响应函数" → 有多种格林函数（推迟、超前、因果、热……），推迟格林函数才对应物理响应
- "K-K 关系对所有函数成立" → 仅当函数在上半平面解析（等价于因果性），对无因果性的量（如关联函数）不直接成立

---

## 6. 响应函数、关联函数和格林函数的关系

### 6.1 什么是关联函数？

关联函数衡量的是两个可观测量在不同时刻的**量子涨落相关性**：

$$
C_{AV}(t) = \frac{1}{2} \langle \{A_I(t), V(0)\} \rangle_0 = \frac{1}{2} \operatorname{Tr}[\{A_I(t), V(0)\} \rho_0]
$$

其中 $\{X, Y\} = XY + YX$ 是反对易子（anticommutator）。

在经典极限（$\hbar \to 0$）下：
- **对易子** $\frac{1}{i\hbar}[A, B]$ 过渡到经典**泊松括号** $\{A, B\}_{\mathrm{PB}}$。因此响应并非"只有量子系统才有"——经典系统同样有线性响应，只是量子理论用对易子表达，经典理论用泊松括号表达
- **反对易子** $\frac{1}{2}\{A, B\}$ 在 $\hbar \to 0$ 时直接过渡为经典关联 $A(t)B(0)$——这是纯经典可测的量

### 6.2 三种函数的关系图

| 函数 | 定义 | 物理含义 | 频域 |
|------|------|---------|------|
| 响应函数 $\phi_{AV}(t)$ | $-\frac{i}{\hbar}\theta(t)\langle[A(t), V]\rangle$ | 因果响应核 | $\chi_{AV}(\omega)$ |
| 关联函数 $C_{AV}(t)$ | $\frac{1}{2}\langle\{A(t), V\}\rangle$ | 平衡涨落 | $C_{AV}(\omega)$ |

**核心关系**（热平衡下）：

$$
\boxed{\Im[\chi_{AV}(\omega)] = -\frac{1}{\hbar} \tanh\left(\frac{\beta\hbar\omega}{2}\right) C_{AV}(\omega)}
$$

这是涨落耗散定理的最基本形式。

### 6.3 常见误区

| 误区 | 正解 |
|------|------|
| 关联函数 = 响应函数 | 关联函数用**反对易子**，响应函数用**对易子**——两者在零温下差一个 $\operatorname{sgn}(\omega)$ 因子 |
| 频域 $\chi$ 和 $C$ 是 Fourier 变换 | $\chi_{AV}(\omega)$ 是 Laplace-Fourier 变换（积分下限 $0$），$C_{AV}(\omega)$ 是全 Fourier 变换（积分下限 $-\infty$） |
| $\chi$ 是实数 | 一般复——$\Re[\chi]$ = 色散/折射，$\Im[\chi]$ = 耗散/吸收 |

### 6.4 Onsager 倒易关系：响应函数的对称性

Lars Onsager 在 1931 年获得诺贝尔奖的工作证明了一个深刻的结论：**线性输运系数矩阵是对称的**。在 Kubo 公式的语言中，这等价于：

$$
\chi_{AV}(\omega; B) = \varepsilon_A \varepsilon_V \, \chi_{VA}(\omega; -B)
$$

其中 $B$ 代表外加磁场，$\varepsilon_A = \pm 1$ 是 $A$ 在时间反演下的宇称（如位置是偶、速度是奇）。

**物理含义**：如果你测量"用力 $F_V$ 推系统，观测 $A$ 如何响应"，和"用力 $F_A$ 推系统，观测 $V$ 如何响应"，两者在磁场反转下给出相同的结果。例如：**电场产生温度梯度（Peltier 效应）和温度梯度产生电流（Seebeck 效应）的系数互为倒易**。

从 Kubo 公式验证 Onsager 关系：在时间反演下 $\Theta H_0(B) \Theta^{-1} = H_0(-B)$，$\Theta \rho_0 \Theta^{-1} = \rho_0$（平衡态时间反演不变），$\Theta A \Theta^{-1} = \varepsilon_A A$。将这些代入 $\chi_{AV}$ 的定义，利用 $\langle [A(t), V] \rangle_0 = \varepsilon_A \varepsilon_V \langle [V(t), A] \rangle_0 |_{B \to -B}$，即可得证。

**对 Berry 相研究的直接意义**：Onsager 关系保证了 $\sigma_{xy}(B) = \sigma_{yx}(-B)$——霍尔电导率在磁场反转下是**反对称**的（$\sigma_{xy} = -\sigma_{yx}$）。你的 Berry 相/几何量子门论文中处理的参数空间，本质上具有和磁场类似的"时间反演破缺"结构——拓扑响应的反对称性来自同一个数学根源。

---

## 7. 谱表示与谱函数

### 7.1 为什么需要谱函数？

Kubo 公式涉及对能级求和。对于大系统（多体、连续谱），直接求和不可行。**谱函数**将这些求和打包成一个频率函数。先讨论自关联情形（$A = V$）：

$$
\boxed{S_{AA}(\omega) = \frac{1}{Z} \sum_{m,n} e^{-\beta E_m} |\langle m|A|n\rangle|^2 \delta(\hbar\omega - (E_n - E_m))}
$$

$S_{AA}(\omega)$ 的物理含义：系统在频率 $\omega$ 处吸收或发射能量 $\hbar\omega$ 的**跃迁强度权重**。对于两个不同算符 $A$ 和 $V$ 的交叉谱函数，矩阵元一般是 $\langle m|A|n\rangle \langle n|V|m\rangle$，不能简单写成模平方。

### 7.2 与响应函数的关系

可以证明：

$$
\Im[\chi_{AA}(\omega)] = -\pi (1 - e^{-\beta\hbar\omega}) S_{AA}(\omega)
$$

当 $A = V$ 时（自响应，如电导率的电流-电流响应），这是可测量量：
- $\Im[\chi_{AA}(\omega)]$ → 能量耗散率（实验：吸收谱）
- $S_{AA}(\omega)$ → 跃迁强度分布（实验：非弹性散射截面）

### 7.3 谱函数与态密度的区别

| | 谱函数 $S_{AA}(\omega)$ | 态密度 $\rho(E)$ |
|---|---|---|
| 定义 | $\sum_{m,n} e^{-\beta E_m} |\langle m|A|n\rangle|^2 \delta(\hbar\omega - E_n + E_m) / Z$ | $\sum_n \delta(E - E_n)$ |
| 物理 | 权重化的跃迁强度 | 能级计数 |
| 选择定则 | 受 $A$ 的矩阵元影响 | 无选择定则 |

{{< callout type="note" title="关键区别" >}}
态密度告诉你"有多少态可供跃迁"，谱函数告诉你"这些态实际能被探测到的权重有多大"。中子散射测的是谱函数，不是态密度。
{{< /callout >}}

### 7.4 动态结构因子

在凝聚态和中子散射中，常用**动态结构因子（dynamical structure factor）**：

$$
S(\mathbf{q}, \omega) = \frac{1}{2\pi\hbar} \int_{-\infty}^{\infty} dt e^{i\omega t} \langle \rho_{-\mathbf{q}}(t) \rho_{\mathbf{q}}(0) \rangle
$$

其中 $\rho_{\mathbf{q}} = \sum_j e^{i\mathbf{q} \cdot \mathbf{r}_j}$ 是密度算符的 Fourier 分量。

它与响应函数的关系（涨落耗散定理的另一种形式）：

$$
S(\mathbf{q}, \omega) = -\frac{1}{\pi} \frac{1}{1 - e^{-\beta\hbar\omega}} \Im[\chi(\mathbf{q}, \omega)]
$$

**实验意义**：$S(\mathbf{q}, \omega)$ 直接由非弹性中子散射或 X 射线散射测量 → 从中提取 $\Im[\chi]$ → 通过 K-K 关系得 $\Re[\chi]$ → 完整响应函数。

### 7.5 Lehmann 表示：从 Kubo 到谱函数的形式桥梁

将谱分解形式的 Kubo 公式进一步写开，可以得到**Lehmann 表示**——这是连接 Kubo 公式和谱函数的标准形式。将 $\chi_{AV}(\omega)$ 的虚部显式写出：

$$
\Im[\chi_{AV}(\omega)] = -\frac{\pi}{Z} \sum_{m,n} (e^{-\beta E_m} - e^{-\beta E_n}) \langle m|A|n\rangle \langle n|V|m\rangle \, \delta(\hbar\omega - (E_n - E_m))
$$

当 $A = V$ 且 $A$ 为厄米算符时，在本文约定下，**正频部分**（$\omega > 0$）的 $\Im[\chi_{AA}(\omega)]$ 为非正。这对应外场向系统输入能量（吸收）。负频部分由 $\Im[\chi_{AA}(-\omega)] = -\Im[\chi_{AA}(\omega)]$（奇对称性）给出，符号相反——对应受激发射。整体上，$(e^{-\beta E_m} - e^{-\beta E_n})$ 与 $\delta(\hbar\omega - (E_n - E_m))$ 中隐含的因子共同保证了**净耗散功率为非负**（热力学第二定律在 LRT 层面的体现）。

**Lehmann 表示的物理图像**：想象把所有能级画在一条轴上，每个能级对的跃迁对应一条从 $E_m$ 到 $E_n$ 的"箭头"。$\Im[\chi_{AA}(\omega)]$ 在 $\omega$ 处的值，就是所有"能量差恰好等于 $\hbar\omega$ 的箭头"的加权和。低温下，从低能级出发的箭头（$E_m$ 小 → $e^{-\beta E_m}$ 大）权重更大。

**与实验的直接对应**：
- **光学吸收谱** $\alpha(\omega) \propto \omega \Im[\chi_{xx}(\omega)]$（电偶极跃迁，$A = V = e\hat{x}$）
- **非弹性中子散射截面** $\frac{d^2\sigma}{d\Omega d\omega} \propto S(\mathbf{q}, \omega) \propto \frac{1}{1-e^{-\beta\hbar\omega}} \Im[\chi_{\rho\rho}(\mathbf{q}, \omega)]$
- **核磁共振（NMR）线形** $\propto \Im[\chi_{S_+ S_-}(\omega)]$（自旋翻转跃迁，见 §13.5）

**常见误区**：$\Im[\chi]$ 和 $S(\omega)$ 只差一个温度因子 $(1 - e^{-\beta\hbar\omega})$——实验上测量的是 $S(\omega)$（散射截面），但从 $S(\omega)$ 提取 $\Im[\chi]$ 需要除以这个因子。**在 $\hbar\omega \ll k_B T$ 时这个因子趋近于零** → 低频 $S(\omega)$ 信号很强，但对应的 $\Im[\chi]$ 可能被放大若干量级 → 数据处理中的常见陷阱。

### 7.6 常见实验技术及其对应的响应函数

| 实验技术 | 可观测量 $A$ | 微扰 $V$ | 测到的量 | 信息 |
|---------|-------------|----------|---------|------|
| 交流电导率 | 电流 $J$ | 电场 $E$ | $\sigma(\omega)$ | 载流子动力学、Drude 权重 |
| 中子散射 | 自旋密度 $\rho_{\mathbf{q}}$ | 中子磁矩 | $S(\mathbf{q},\omega)$ | 磁激发谱、自旋波色散 |
| NMR/ESR | 横向自旋 $S_+$ | 射频场 $B_1$ | $\Im[\chi_{+-}(\omega)]$ | 局部环境、弛豫时间 $T_1,T_2$ |
| 光学吸收 | 电偶极 $e\mathbf{r}$ | 光电场 $\mathbf{E}$ | 吸收系数 $\alpha(\omega)$ | 能隙、激子、声子 |
| 拉曼散射 | 极化率 $\alpha$ | 光电场 $\mathbf{E}(\omega_i)$ | $I(\omega_s) \propto \Im[\chi_{\alpha\alpha}(\omega_i - \omega_s)]$ | 声子、磁振子、电子激发 |
| 光电子能谱 (ARPES) | 电子湮灭 $c_{\mathbf{k}}$ | 光子 | 单粒子谱函数 $A(\mathbf{k},\omega)$ | 能带结构、准粒子寿命 |
| 磁化率测量 (SQUID) | 总磁矩 $M$ | 磁场 $B$ | $\chi(0)$（静态） | 磁序、超导 Meissner 效应 |

注意：ARPES 测量的是**单粒子谱函数** $A(\mathbf{k}, \omega) = -\frac{1}{\pi} \Im[G^R(\mathbf{k}, \omega)]$（推迟格林函数的虚部），而中子散射和光学测量的是**两粒子谱函数**（密度-密度或电流-电流关联）。两者通过不同的格林函数与 LRT 联系——单粒子响应涉及 $G^R \sim \langle \{c(t), c^\dagger(0)\} \rangle$，两粒子响应涉及 $\chi \sim \langle [\rho(t), \rho(0)] \rangle$。

### 7.7 线性响应的边界：何时失效？

线性响应理论有三个暗含假设，当它们被破坏时，Kubo 公式不再适用：

1. **微扰强度**：当 $|F|$ 不满足 $|F| \ll$ 系统的特征能量尺度时，$O(F^2)$ 及以上项不可忽略。例如，强激光场下 TLS 的 Rabi 频率 $\Omega_R = \mu E/\hbar$ 与 $\omega_0$ 可比 → 非线性响应起主导
2. **响应时间尺度**：LRT 假设系统始终**接近平衡**。如果外场驱动系统**远离平衡**（如脉冲激光在 fs 尺度内将电子加热到 $T_e \gg T_{\mathrm{lattice}}$），线性关系 $\Delta \langle A \rangle \propto F$ 在脉冲期间不成立
3. **量子相干性**：在强关联系统（如 Luttinger 液体、分数量子霍尔态）中，低能激发是**集体模式**而非独立准粒子。需要注意：Lehmann 谱表示本身不是近似——它对任意量子系统都严格成立。真正可能失效的是"把谱函数理解成许多独立准粒子跃迁"的简单图像。在强关联系统中，谱函数仍然存在，但峰可能变宽、分裂，甚至不再对应清楚的单粒子准粒子 → 需要非微扰方法（Bethe ansatz、共形场论、张量网络……）来计算谱函数本身

**与你的 Rabi 模型研究的关系**：USC 区间 $(g/\omega \gtrsim 0.1)$ 的 Rabi 模型恰好触碰了边界 #2——系统-环境耦合不再"弱"，$\rho_{\mathrm{ss}}$（非平衡稳态）与 $\rho_0$（热平衡态）的差异不能忽略 → 需要 Ban 等 (2017) 的推广 LRT 或 Liouvillian 微扰论。

**关键判断准则**：LRT 的有效性等价于以下条件：
$$
\int_0^{\infty} dt \, |\phi_{AV}(t)| < \infty \quad \text{且} \quad \lim_{F \to 0} \frac{\Delta \langle A \rangle}{F} \text{ 存在且不依赖于 } F
$$
第一个条件（响应函数的 $L^1$ 可积性）在无耗散系统中可能不成立（如理想晶体在 $\omega = 0$ 时 $\sigma(\omega) \propto \delta(\omega)$ 不绝对可积——但这仅是分布意义下的 Dirac delta，物理上仍可处理）；第二个条件在相变临界点处失效（$\lim_{F \to 0} \Delta M/F = \infty$，磁化率发散）。

---

## 8. 涨落耗散定理

### 8.1 核心问题

> *平衡态下的热涨落（无外场时的自发涨落）与系统对外场的耗散响应（外场做功的耗散率）之间，有什么定量关系？*

答案是**涨落耗散定理（Fluctuation-Dissipation Theorem, FDT）**。

### 8.2 物理图像

考虑一个简单的例子：Brown 粒子在液体中的运动。
- **无外力时**：粒子在热涨落下做随机运动，其均方位移 $\langle x^2(t) \rangle$ 由扩散系数 $D$ 决定
- **有外力时**：粒子以迁移率 $\mu$ 移动，$v = \mu F$

Einstein 关系 $D = \mu k_B T$ 是最简单的 FDT：**描述耗散的系数（$\mu$）和描述涨落的系数（$D$）被温度联系在一起**。

量子 FDT 的完整形式：

{{< callout type="important" title="涨落耗散定理" >}}

$$
\Im[\chi_{AA}(\omega)] = -\frac{1}{\hbar} \tanh\left(\frac{\beta\hbar\omega}{2}\right) C_{AA}(\omega),
$$

或等价地：

$$
C_{AA}(\omega) = -\hbar \coth\left(\frac{\beta\hbar\omega}{2}\right) \Im[\chi_{AA}(\omega)].
$$

{{< /callout >}}

### 8.3 经典极限与量子极限

- **经典极限** $\hbar\omega \ll k_B T$（高温或低频）：$\tanh(\beta\hbar\omega/2) \approx \beta\hbar\omega/2$ → $\Im[\chi_{AA}] \approx -\frac{\beta\omega}{2} C_{AA}$，等价地 $C_{AA} \approx -\frac{2k_B T}{\omega} \Im[\chi_{AA}]$ → 恢复 Nyquist 定理和 Einstein 关系（负号来自本文约定，不同教材可能整体差一个符号）
- **量子极限** $T \to 0$（$\beta \to \infty$）：$\tanh(\beta\hbar\omega/2) \to \operatorname{sgn}(\omega)$ → $\Im[\chi_{AA}(\omega)] = -\frac{\operatorname{sgn}(\omega)}{\hbar} C_{AA}(\omega)$ → 零温下仍有量子涨落（零点运动）

### 8.4 FDT 的推导：从 Kubo 公式出发

FDT 不是额外假设——它可以直接从 Kubo 公式导出。推导过程揭示了 **FDT 的根源在于 $\rho_0$ 是 Boltzmann 分布**。

从 Kubo 公式的谱分解出发，计算 $\Im[\chi_{AA}(\omega)]$：
$$
\Im[\chi_{AA}(\omega)] = -\frac{\pi}{Z} \sum_{m,n} (e^{-\beta E_m} - e^{-\beta E_n}) |\langle m|A|n\rangle|^2 \, \delta(\hbar\omega - (E_n - E_m))
$$

另一方面，计算关联函数 $C_{AA}(\omega) = \int_{-\infty}^{\infty} dt \, e^{i\omega t} \frac{1}{2} \langle \{A(t), A(0)\} \rangle_0$ 的谱表示：
$$
C_{AA}(\omega) = \frac{\pi}{Z} \sum_{m,n} e^{-\beta E_m} |\langle m|A|n\rangle|^2 \left[\delta(\hbar\omega - (E_n - E_m)) + \delta(\hbar\omega + (E_n - E_m))\right]
$$

注意 $C_{AA}(\omega)$ 是 $\omega$ 的偶函数（来自反对易子的对称性），而 $\Im[\chi_{AA}(\omega)]$ 是奇函数（来自对易子的反对称性）。

现在比较两式。利用 $\delta$ 函数，将 $\Im[\chi_{AA}]$ 中对 $E_n, E_m$ 的求和拆分：
$$
\begin{aligned}
\Im[\chi_{AA}(\omega)] &= -\frac{\pi}{Z} \sum_{m,n} e^{-\beta E_m} |\langle m|A|n\rangle|^2 \delta(\hbar\omega - (E_n - E_m)) \\
&\quad + \frac{\pi}{Z} \sum_{m,n} e^{-\beta E_n} |\langle m|A|n\rangle|^2 \delta(\hbar\omega - (E_n - E_m))
\end{aligned}
$$

第二项交换 $m \leftrightarrow n$，利用 $|\langle n|A|m\rangle|^2 = |\langle m|A|n\rangle|^2$（$A$ 自伴），得：
$$
\Im[\chi_{AA}(\omega)] = -\frac{\pi}{Z} (1 - e^{-\beta\hbar\omega}) \sum_{m,n} e^{-\beta E_m} |\langle m|A|n\rangle|^2 \delta(\hbar\omega - (E_n - E_m))
$$

与 $C_{AA}(\omega)$ 比较（注意 $C_{AA}$ 含 $\delta(\hbar\omega + \cdots)$ 项仅在 $\omega < 0$ 时贡献）：
$$
\boxed{\Im[\chi_{AA}(\omega)] = -\frac{1}{\hbar} \tanh\left(\frac{\beta\hbar\omega}{2}\right) C_{AA}(\omega)}
$$

**推导中唯一用到的假设**：$\rho_0 = e^{-\beta H_0}/Z$（Gibbs 态）。如果初始态不是热平衡态（如 Rabi 模型的 NESS），FDT 需要用更复杂的"非平衡涨落耗散关系"取代（见 §13.2）。

### 8.5 为什么 FDT 如此重要？

1. **实验**：通过测量平衡涨落（无外场！）就能**预测**系统对外场的响应——中子散射测 $S(\mathbf{q}, \omega)$ 就是利用这个原理
2. **理论**：统一了输运理论（Kubo 公式）和统计力学（Einstein 关系、Nyquist 定理、Onsager 关系）
3. **计算**：在很多情况下，计算关联函数比直接计算响应函数更容易（或反过来）

### 8.6 非微扰推广（选读）

这一小节是选读。大四阶段只需要知道：FDT 的核心并不只是"一阶微扰"的结果——它更深地来自热平衡态的时间反演结构。下面的非微扰版本只是佐证这一点，不要求掌握推导。

Jacob & Goold (2025) 证明：即使不用 Kubo 的线性近似，散射理论中仍存在一个**非微扰版本的 FDT**：

$$
\chi_{\Delta} = -2i \tanh(\beta\Delta/2) \, C_{\Delta}
$$

其中 $\chi_{\Delta}$ 和 $C_{\Delta}$ 用精确散射振幅（而非 Born 近似）定义。这暗示 FDT 比 Kubo 公式本身更**基本**——它来自时间反演对称性和平衡态的性质，而不依赖弱耦合。

---

## 9. 静态响应、动态响应与零频极限

### 9.1 静态响应

**静态响应**是 $\omega \to 0$ 的极限：外场随时间变化极慢（绝热）。此时：

$$
\chi_{AV}(0) = \lim_{\omega \to 0} \chi_{AV}(\omega) = -\frac{i}{\hbar} \int_0^{\infty} dt \operatorname{Tr}[[A_I(t), V] \rho_0]
$$

静态磁化率 $\chi = \partial M/\partial B$、静态电极化率 $\alpha = \partial P/\partial E$ 都是 $\chi(0)$ 的例子。

### 9.2 等温响应 vs 绝热响应

需区分两种静态极限：
- **等温响应**（isothermal）：$\omega \to 0$ 但系统始终与热库接触 → 温度恒定
- **绝热响应**（adiabatic）：$\omega \to 0$ 且系统孤立 → 熵恒定

两者一般不相等。它们的差别来自系统是否能和热库交换热量——具体差多少依赖系统的热容、热膨胀系数以及被测响应量的性质。对气体声速等简单例子，会出现类似 $C_P/C_V$ 的因子；但在一般线性响应理论中，不能简单认为所有静态响应都只差一个 $C_P/C_V$。

### 9.3 Kubo-Strěda 公式（只需知道物理意义）

这一节只需要理解物理结论，不要求掌握严格推导。Kubo-Strěda 公式是 Kubo 公式在零温、静态、Fermi 投影条件下对霍尔电导率的特殊形式。它最重要的结论是：**横向电导率不仅和 Fermi 面附近的态有关，还和所有占据态的几何结构（Berry 曲率）有关**。

当 $\rho_0 = \chi_{(-\infty, E_F]}(H_0)$（零温 Fermi 投影）时，静态霍尔电导率简化为：

$$
\sigma_{xy} = -i \, \mathcal{T}\big(P [[P, X], [P, Y]]\big)
$$

这是**双重对易子公式（DCF）**——Kubo 公式在 $\omega = 0, T = 0$ 的静态极限。其物理意义是：霍尔电导等于 Fermi 海在实空间中的 Chern 数。

### 9.4 常见误区

- "静态响应 = 取 $\omega = 0$ 代入任何公式" → 需要先算动态响应再取极限，否则可能丢失拓扑项（$\delta(\omega)$ 的贡献）
- "Kubo-Strěda = Kubo 的直接化简" → DCF 需要 $X$ 和 $Y$ 的非对角部分（OD），标准 Kubo 中 $X$ 无界带来的发散被抵消——这是非平凡的技术步骤

---

## 10. 有限温度下的线性响应

### 10.1 温度进入的两种方式

1. **通过 $\rho_0 = e^{-\beta H_0}/Z$**（初始态）：每个本征态按 Boltzmann 权重贡献
2. **通过 $\tanh(\beta\hbar\omega/2)$**（FDT）：量子涨落与热涨落的竞争

### 10.2 零温极限

$T \to 0$ 时，$\rho_0 \to |\Omega\rangle\langle\Omega|$（基态投影）。此时：

$$
\chi_{AV}(\omega) = \sum_{n \neq \Omega} \frac{\langle\Omega|A|n\rangle \langle n|V|\Omega\rangle}{E_\Omega - E_n + \hbar\omega + i\eta} - \frac{\langle\Omega|V|n\rangle \langle n|A|\Omega\rangle}{E_n - E_\Omega + \hbar\omega + i\eta}
$$

第一项是**共振吸收**（从基态激发），第二项是**反共振**（在旋转波近似下通常被丢弃，但对 Berry 曲率等拓扑量有贡献）。

### 10.3 高温极限

$k_B T \gg \hbar\omega$ 时，$\tanh(\beta\hbar\omega/2) \approx \beta\hbar\omega/2$，由 $\Im[\chi_{AA}] = -\frac{1}{\hbar}\tanh(\beta\hbar\omega/2) C_{AA}$ 得：

$$
C_{AA}(\omega) \approx -\frac{2k_B T}{\omega} \Im[\chi_{AA}(\omega)]
$$

负号来自本文对响应函数的约定（不同教材若整体差一个符号，这里也会相应改变）。物理上，$\Im[\chi_{AA}] < 0$（正频吸收）意味着 $C_{AA}$ 在经典极限下为正——涨落关联总是正定的。

### 10.4 Matsubara 形式

{{< callout type="note" title="单位约定" >}}
本节采用统计物理常用约定：$k_B = 1$，因此 $\beta = 1/T$ 的量纲是 $1/$能量。虚时 $\tau$ 也有 $1/$能量的量纲，Matsubara 频率 $\omega_n = 2\pi n/\beta$ 实际是"能量型频率"（量纲 = 能量）。如果保留 $\hbar$，虚时范围为 $0 \le \tau \le \beta\hbar$，Matsubara 频率为 $\omega_n = 2\pi n/\beta\hbar$（量纲 = 频率）。本文为了公式简洁，采用前一种写法。
{{< /callout >}}

有限温度下，虚时（Matsubara）格林函数比实时格林函数更方便计算：

$$
\mathcal{G}_{AV}(i\omega_n) = -\int_0^{\beta} d\tau e^{i\omega_n \tau} \langle T_\tau A(\tau) V(0) \rangle
$$

其中 $\omega_n = 2\pi n/\beta$（玻色型）是 Matsubara 频率。实时响应函数由解析延拓 $i\omega_n \to \omega + i\eta$ 得到。

### 10.5 Matsubara 计算实例：TLS 的虚时关联函数

以 §4.6 的两能级系统为例，展示 Matsubara 形式的具体计算。定义虚时 Heisenberg 算符 $A(\tau) = e^{\tau H_0} A e^{-\tau H_0}$（注意没有 $i$——这是 Matsubara 和实时形式的关键区别）。

对于 $H_0 = \frac{\hbar\omega_0}{2}\sigma_z$，$\sigma_x(\tau) = e^{\tau\hbar\omega_0/2 \cdot \sigma_z} \sigma_x e^{-\tau\hbar\omega_0/2 \cdot \sigma_z} = \sigma_+ e^{\tau\hbar\omega_0} + \sigma_- e^{-\tau\hbar\omega_0}$。

Matsubara 格林函数（$A = V = \mu\sigma_x$）：
$$
\mathcal{G}(i\omega_n) = -\mu^2 \int_0^{\beta} d\tau \, e^{i\omega_n\tau} \langle T_\tau \sigma_x(\tau) \sigma_x(0) \rangle_0
$$

计算虚时排序期望值（对 $0 < \tau < \beta$）：
$$
\langle T_\tau \sigma_x(\tau) \sigma_x(0) \rangle_0 = \frac{1}{Z} \operatorname{Tr}[e^{-\beta H_0} e^{\tau H_0} \sigma_x e^{-\tau H_0} \sigma_x] = p_g e^{\tau\hbar\omega_0} + p_e e^{-\tau\hbar\omega_0}
$$

积分 $\int_0^{\beta} d\tau e^{i\omega_n\tau \pm \tau\hbar\omega_0} = \frac{e^{\pm\beta\hbar\omega_0} - 1}{i\omega_n \pm \hbar\omega_0}$（利用 $e^{i\omega_n\beta} = 1$，因为 $\omega_n = 2\pi n/\beta$）。得：
$$
\mathcal{G}(i\omega_n) = \frac{\mu^2}{\hbar} \tanh\left(\frac{\beta\hbar\omega_0}{2}\right) \frac{2\omega_0}{(i\omega_n)^2 - \omega_0^2}
$$

**解析延拓** $i\omega_n \to \omega + i\eta$：
$$
\mathcal{G}(\omega + i\eta) = \frac{\mu^2}{\hbar} \tanh\left(\frac{\beta\hbar\omega_0}{2}\right) \frac{2\omega_0}{(\omega + i\eta)^2 - \omega_0^2}
$$

而实时推迟格林函数 $G^R(\omega) = -\chi_{xx}(\omega)$。分解因式 $(\omega + i\eta)^2 - \omega_0^2 = (\omega - \omega_0 + i\eta)(\omega + \omega_0 + i\eta)$，部分分式后恰好恢复 §4.6 的 $\chi_{xx}(\omega)$。

**要点**：Matsubara 的优势在于——虚时排序 $T_\tau$ 和 Boltzmann 因子 $e^{-\beta H_0}$ 的结合使得计算完全在有限温度下进行，无需先算零温再"加热"。代价是最后一步的解析延拓 $i\omega_n \to \omega + i\eta$ 在数值上可能是不适定问题（小噪声可能被放大）。对简单模型（如 TLS）解析延拓可精确完成；对多体系统，常需借助 Padé 近似或最大熵方法。

### 10.6 常见误区

- "有限温度 = 加一个 $\coth(\beta\hbar\omega/2)$ 因子" → 仅对**平衡态且线性响应**成立。对非平衡稳态（如 Rabi 模型的耗散态），FDT 可能不成立或需推广
- "Matsubara 频率是物理频率" → 它们是辅助量，只在解析延拓后与物理频率联系

---

## 11. 线性响应与 Berry 曲率 / 几何响应

### 11.1 Berry 曲率如何从响应中出现？

考虑一个系统受**绝热慢变**参数 $\mathbf{\lambda}(t) = (\lambda_1(t), \ldots, \lambda_d(t))$ 的调制。这些参数可以是磁场方向、外部磁通、晶格动量，或 Rabi 模型中的某个慢变控制参数。每个参数都有一个共轭的**广义力**：
$$
F_k = -\frac{\partial H}{\partial \lambda_k}
$$
线性响应关心的是：当参数 $\lambda_l$ 缓慢变化时，另一个广义力 $F_k$ 会不会产生正比于速度 $\dot{\lambda}_l$ 的响应——这就是"几何响应"的物理来源。

根据绝热微扰论，参数变化诱导的广义力期望值为：

$$
\langle F_k \rangle = -\partial_{\lambda_k} E_0 + \hbar \sum_{l} \Omega_{kl}(\mathbf{\lambda}) \dot{\lambda}_l
$$

其中 $E_0$ 是瞬时基态能量，$\Omega_{kl} = i(\langle \partial_k \psi_0 | \partial_l \psi_0 \rangle - \langle \partial_l \psi_0 | \partial_k \psi_0 \rangle)$ 是 **Berry 曲率**（Berry curvature）。

第一项是保守力（Hellmann-Feynman），第二项是**几何响应力**——正比于参数变化速度，垂直（横向）于变化方向。

### 11.2 从 Kubo 到 Berry 曲率

将 Kubo 公式的参数取为 $H(t) = H_0 - \mathbf{F}(t) \cdot \mathbf{r}$（外电场），在**直流极限** $\omega \to 0$ 和**零温极限** $T \to 0$ 下计算霍尔电导率：

$$
\sigma_{xy}^{\mathrm{Kubo}} \xrightarrow{\omega\to 0, T\to 0} \frac{e^2}{h} \times (\text{Fermi 海的总 Chern 数})
$$

这就是 TKNN (Thouless-Kohmoto-Nightingale-den Nijs, 1982) 的核心结论——量子霍尔电导的量子化来自 Brillouin 区上 Berry 曲率的积分 = 陈数（Chern number）。

### 11.3 Henheik 与 Teufel 的贡献

Henheik & Teufel (2021) 论证了一个微妙之处：**当外场关闭谱 gap 时，Kubo 公式仍可能成立——但需要引入 NEASS（非平衡几乎稳态）的概念**。传统的绝热定理假设瞬时本征态跟踪成立（要求 gap 保持开放），但在输运情境中外场会关闭全局 gap。NEASS 方法通过"局部 gap 结构"绕过了这个限制。

物理直觉（图 1 of Henheik & Teufel）：施加电压 $\Delta U$ 在距离 $L$ 上，虽然全局势 $\sim xE$ 关闭了 gap，但电子要从占据带跃迁到非占据带，仍需克服 gap $g$ 或隧穿距离 $g/E$——只要 $g/E$ 很大，原基态仍是"几乎稳态"。

### 11.4 和我的研究的关系

- **Berry 相论文中的 STA 测量**（Zhang 2017, Leek 2007）：绝热捷径（shortcut to adiabaticity, STA）添加反绝热项以加速 Berry 相的积累。线性响应在"STA 轨迹附近"的微扰稳定性分析中，Kubo 公式给出了驱动噪声对 Berry 相位的影响
- **几何量子门**（Zhao 2021, Deng 2026）：几何门的保真度受控于几何相位的环境响应 → 线性响应框架可用于计算退相干率（$1/T_2^\ast \propto$ 噪声谱密度 $\times$ Berry 曲率在参数空间中的涨落）

---

## 12. 线性响应在 Rabi / Spin-Boson 模型中的用法

### 12.1 Rabi 模型与耗散相变

量子 Rabi 模型 ($H_R = \frac{\hbar\omega_q}{2}\sigma_z + \hbar\omega_c a^\dagger a + \hbar g\sigma_x(a + a^\dagger)$) 在超强耦合（USC）区间 $(g/\omega \gtrsim 0.1)$ 展现出丰富的非平衡物理 [De Filippis et al., 2023]。

{{< callout type="note" title="关于相变一词" >}}
严格地说，单个有限自由度的 Rabi 模型通常不会出现真正的热力学非解析相变。文献中讨论的 Rabi / dissipative Rabi 临界行为，往往依赖某种极限——例如 $\omega_q/\omega_c \to \infty$（经典振子极限）、强耗散连续谱、或 Liouvillian gap 在非平衡稳态中趋于闭合。因此这里讨论的是"临界行为判据"和"相变特征"，不能说普通有限维 Rabi 模型已经发生了严格热力学意义上的相变。
{{< /callout >}}

核心问题：系统与环境耦合 → 环境诱导耗散（Lindblad 项 $\kappa \mathcal{D}[a]$）→ 稳态由 $H_R$ 的相干动力学与耗散的竞争决定 → 在某些参数区间可能出现类临界行为（Liouvillian gap 的显著缩小，对应系统弛豫时间急剧增长）。

### 12.2 线性响应的角色

在 De Filippis 等 (2023) 的框架中，线性响应理论以两种方式出现：

1. **稳态附近的微扰响应**：在 NESS（非平衡稳态）附近加小的探测场 → 系统的响应（如透射谱 $|S_{21}(\omega)|^2$）率由 $\chi_{aa^\dagger}(\omega)$（光子关联的 susceptibility）给出
2. **Liouvillian gap**：$\lambda_{\mathrm{gap}} = -\max_j \Re[\lambda_j]$（$\lambda_j$ 是 Liouvillian $\mathcal{L}$ 的本征值）。当 $\lambda_{\mathrm{gap}} \to 0$ → 系统临界慢化 → 响应函数在 $\omega \to 0$ 处发散（静态磁化率的临界指数）

### 12.3 Spin-Boson 模型

Spin-Boson 模型 ($H_{SB} = \frac{\Delta}{2}\sigma_x + \frac{\varepsilon}{2}\sigma_z + \sum_k \hbar\omega_k b_k^\dagger b_k + \sigma_z \sum_k g_k(b_k + b_k^\dagger)$) 是耗散两能级系统的"标准模型"。

线性响应在此模型中的应用：
1. **动态磁化率** $\chi_{zz}(\omega)$：探测自旋对外部偏置 $\varepsilon(t)$ 的响应 → 实验上对应介电损耗或量子比特的退相干谱
2. **Ohmic 耗散的线性响应**：当谱函数 $J(\omega) = \pi \sum_k g_k^2 \delta(\omega - \omega_k) = 2\pi\alpha\omega$（Ohmic）时，$\chi_{zz}(\omega)$ 在低温下的行为由 $\alpha$（无量纲耗散强度）决定：
   - $\alpha < 1/2$：相干振荡（coherent）
   - $\alpha > 1/2$：非相干衰减（incoherent/overdamped）
   - $\alpha = 1$：Kosterlitz-Thouless 量子相变（localization transition）

### 12.4 Ban 等的开放系统线性响应公式

Ban 等 (2017) 给出了**开放系统**中线性响应函数的最一般形式（四个部分）：

$$
\phi_{BA}(t, \tau) = \phi_{BA}^{(0)} + \phi_{BA}^{(c)} + \phi_{BA}^{(i,0)} + \phi_{BA}^{(i,c)}
$$

各部分含义：
- $\phi_{BA}^{(0)}$：忽略所有关联（系统-热库、热库不同时刻之间）→ 这是 Markov 极限
- $\phi_{BA}^{(c)}$：**热库关联修正**（热库在不同时刻的态之间的关联）→ 非 Markov 性的直接体现
- $\phi_{BA}^{(i,0)}$：系统-热库初始关联的贡献
- $\phi_{BA}^{(i,c)}$：两种关联的合成效应

**关键结论**：量子回归定理（quantum regression theorem）仅在 Markov 极限下成立——如果热库有记忆，两时间关联函数 $\langle B(t) A(\tau) \rangle$ **不能**仅由单时间传播子计算。这对 Rabi 模型在 USC 区间意味着：当 $g/\omega \gtrsim 0.1$ 时，标准的量子光学主方程（Born-Markov）失效——需要 Ban 等的推广公式或等效的非微扰方法。

### 12.5 具体应用：NMR 线形与动态磁化率

核磁共振（NMR）是线性响应理论最经典的应用之一。下面展示如何从 Kubo 公式出发，推导 NMR 线形。

**物理设定**：核自旋 $I = 1/2$ 在静磁场 $B_0 \hat{z}$ 中（Larmor 频率 $\omega_L = \gamma B_0$），同时受到局部环境（其他核自旋、电子云屏蔽……）产生的随机涨落场 $\delta B(t)$ 的作用。加弱的横向射频场 $B_1(t)\cos(\omega t)\hat{x}$。

**哈密顿量**：$H_0 = -\hbar\omega_L I_z$，$H_{\mathrm{ext}}(t) = -\hbar\gamma B_1(t) I_x$（射频场），加上与环境的耦合 $H_{SB} = I_z \sum_k g_k(b_k + b_k^\dagger)$（简化 Spin-Boson 型）。

**NMR 信号**：测量的是横向磁化率 $\chi_{+-}(\omega)$，可观测量为 $I_+ = I_x + iI_y$，外场耦合到 $I_x = (I_+ + I_-)/2$。由 Kubo 公式：
$$
\chi_{+-}(\omega) = (\hbar\gamma)^2 \frac{i}{\hbar} \int_0^{\infty} dt \, e^{i\omega t} \langle [I_+(t), I_-(0)] \rangle_0
$$

**Bloch 唯象结果的微观推导**：在 Markov 极限（环境关联时间 $\tau_c$ 远短于自旋弛豫时间 $T_1, T_2$）下，上式给出：
$$
\Im[\chi_{+-}(\omega)] \propto \frac{T_2}{1 + (\omega - \omega_L)^2 T_2^2}
$$
即 Lorentzian 线形，半高宽 $= 1/T_2$——这就是 Bloch 方程的"横向弛豫"的微观起源。$T_2$ 由环境噪声谱密度 $J(\omega)$ 在 $\omega = 0$ 和 $\omega = \omega_L$ 处的值决定：
$$
\frac{1}{T_2} = \frac{1}{2T_1} + \frac{1}{T_2^\ast}, \quad \frac{1}{T_1} \propto J(\omega_L), \quad \frac{1}{T_2^\ast} \propto \lim_{\omega \to 0} \frac{J(\omega)}{\omega}
$$
$T_2^\ast$（纯退相）来自环境在 $\omega \to 0$ 的低频噪声——这正是**量子比特退相干**的核心机制。

**非 Markov 修正**：当环境关联时间不可忽略时（如 USC 区间的 Rabi 模型或低温 Spin-Boson），Lorentzian 线形失效。此时需用 Ban 等 (2017) 的四部分响应函数 $\phi_{+-} = \phi_{+-}^{(0)} + \phi_{+-}^{(c)}$（假设无初始关联），其中 $\phi_{+-}^{(c)}$ 给出频率依赖的退相干率 $\Gamma_2(\omega)$：
$$
\Im[\chi_{+-}(\omega)] \propto \frac{\Gamma_2(\omega)}{(\omega - \omega_L - \delta\omega(\omega))^2 + \Gamma_2(\omega)^2}
$$
这里 $\delta\omega(\omega)$ 是频率依赖的 Lamb 位移，$\Gamma_2(\omega)$ 正比于环境的**量子噪声谱** $S_{BB}(\omega) = \frac{1}{2\pi} \int dt e^{i\omega t} \langle \{\delta B(t), \delta B(0)\} \rangle$——这就是线性响应理论的终极实验意义：**你测量 NMR 线形 → 你得到 $\Im[\chi(\omega)]$ → 通过 FDT 你反推出环境的量子噪声谱 → 你知道了系统与环境的耦合强度和机制**。

### 12.6 从 LRT 视角看你的论文收藏

你的图书馆中有几篇论文可以从 LRT 视角重新审视：

- **De Filippis 等 (2023)**：Rabi 模型的耗散临界行为。临界点附近 Liouvillian gap 变小 → 系统弛豫时间变长 → 低频响应通常会增强。是否真的表现为 $\chi(\omega) \sim 1/\omega$ 或某个观测量发散，要看具体模型、极限顺序、噪声谱和稳态定义，不能只凭 LRT 形式直接断言。但 LRT 提供了一个有用的诊断：**临界慢化必然伴随低频响应增强**——这可以作为非平衡相变的一个判据
- **Leek 等 (2007)**：Berry 相观测。施加微波脉冲沿参数空间闭合路径驱动量子比特 → Berry 相 = 路径围成的立体角 = Kubo 公式在绝热极限下给出的 $\sigma_{xy}$。你的 Berry 相论文和 LRT 论文本质上在研究同一个物理量——Berry 曲率——只是前者从**几何相位的时域积累**切入，后者从**频率依赖的响应函数**切入
- **Zhang 等 (2017)**：STA 测量 Berry 相。反绝热项的作用是在不破坏Berry 相的前提下加速演化 → 从 LRT 视角：STA 改变了有效 Liouvillian 的谱，使得 $\chi(\omega)$ 在绝热频率 $\omega \sim \eta$ 处仍有良好定义（而不是被 $1/\eta$ 的发散所污染）

---

## 13. 输运系数：从 Kubo 公式到电导率

### 13.1 Kubo-Greenwood 公式

将 §4 的一般 Kubo 公式特化到**电导率**——这是 LRT 最经典也最重要的应用。

**设定**：电子系统 $H_0 = \sum_i \frac{\mathbf{p}_i^2}{2m} + V(\mathbf{r}_i)$，外加均匀电场 $\mathbf{E}(t)$。在长度规范下 $H_{\mathrm{ext}}(t) = -e \sum_i \mathbf{r}_i \cdot \mathbf{E}(t)$。

**电流算符**：$\mathbf{J} = \frac{e}{m} \sum_i \mathbf{p}_i$。电导率张量由 $J_\alpha(\omega) = \sum_\beta \sigma_{\alpha\beta}(\omega) E_\beta(\omega)$ 定义。由 Kubo 公式：
$$
\boxed{\sigma_{\alpha\beta}(\omega) = \frac{e^2}{i\omega} \left[\chi_{v_\alpha v_\beta}(\omega) + \frac{n}{m} \delta_{\alpha\beta}\right]}
$$
其中 $v_\alpha = p_\alpha/m$ 是速度算符，$n$ 是电子密度，第二项是**抗磁项**（diamagnetic term）——保证 $\sigma(\omega)$ 满足 gauge 不变性和求和规则 $\int_0^{\infty} d\omega \Re[\sigma_{xx}(\omega)] = \pi n e^2/2m$。

### 13.2 Kubo-Bastin 公式与拓扑

在无序系统中使用位置算符不方便。改为用速度-速度关联：
$$
\sigma_{\alpha\beta}(\omega) = \frac{e^2}{\hbar} \int_{-\infty}^{\infty} dE \, f(E) \operatorname{Tr}\big[v_\alpha \, \delta(E - H_0) \, v_\beta \, \frac{dG^R(E + \hbar\omega)}{dE} + \mathrm{h.c.}\big]
$$
这是 **Kubo-Bastin 公式**——无序系统中计算电导率的标准起点。

当 $\omega \to 0, T \to 0$ 时：
$$
\sigma_{\alpha\beta} = \frac{e^2}{h} \times 2\pi i \, \mathcal{T}\big(P [[P, \hat{r}_\alpha], [P, \hat{r}_\beta]]\big)
$$
$P = \chi_{(-\infty, E_F]}(H_0)$，$\mathcal{T}$ 是体平均迹。这正是量子（反常）霍尔效应中**电导率 = Chern 数 $\times \, e^2/h$** 的微观公式。

### 13.3 纵向 vs 横向响应

- **纵向电导率** $\sigma_{xx}(\omega)$：电流 $\parallel$ 电场 → $\Re[\sigma_{xx}]$ = Joule 热耗散
- **横向电导率** $\sigma_{xy}$：电流 $\perp$ 电场 → 可非耗散 → **拓扑电流**，时间反演破缺系统中量子化

### 13.4 常见误区

- "电导率只依赖 Fermi 面附近" → 对纵向 $\sigma_{xx}$ 成立（Mott 公式），但**霍尔电导率 $\sigma_{xy}$ 依赖于所有占据态**（Fermi 海的积分）——它是热力学量而非仅输运量
- "速度-速度关联直接给出电导率" → 需要先算 $r$-$r$ 关联再取 $\omega \to 0$，或用 $\sigma_{\alpha\beta} = \lim_{\omega \to 0} \frac{i}{\omega} \chi_{J_\alpha J_\beta}(\omega)$（$1/\omega$ 因子来自 $r = v/(i\omega)$）

---

## 14. 初学者技术栈路线图

```
步骤 1 (1-2天)
├── 经典阻尼谐振子的受迫响应 → 理解 χ(t), 因果性, K-K关系
├── 量子力学含时微扰论回顾 (Sakurai Ch. 5)
└── 正则系综基础 (Pathria Ch. 2-3)

步骤 2 (2-3天)
├── 从含时微扰论推导 Kubo 公式 (本笔记 §3-4)
├── 计算最简单的例子：两能级系统的动态磁化率
├── 理解 χ(ω) 的实部/虚部各自代表什么
└── 阅读 Jacob & Goold (2025) 附录 A

步骤 3 (3-5天)
├── 涨落耗散定理 (本笔记 §8)
├── 推迟格林函数入门 (Fetter & Walecka Ch. 3-4)
├── 谱函数与动态结构因子 (本笔记 §7)
└── 练习：从 χ(ω) 反推 S(ω)，从 S(ω) 理解中子散射截面

步骤 4 (1-2周)
├── 有限温度 Matsubara 形式 (Mahan Ch. 2)
├── Berry 曲率与量子霍尔效应的拓扑解释
├── Spin-Boson 模型的动态磁化率计算
└── 阅读 Henheik & Teufel (2021) — 理解非平衡几乎稳态
```

### 14.1 需要掌握的核心概念清单

- [ ] 含时微扰论 → 一阶修正密度矩阵
- [ ] 响应函数 $\phi_{AV}(t)$ 的定义与物理解释
- [ ] 频域易感率 $\chi_{AV}(\omega)$ 与 $\phi_{AV}(t)$ 的关系
- [ ] Kramers-Kronig 关系的因果性起源
- [ ] 关联函数 $C_{AV}(t)$ 与涨落耗散定理
- [ ] 谱函数 $S_{AV}(\omega)$ 与可测量（中子散射、吸收谱）
- [ ] 推迟、超前、因果、热（Matsubara）四种格林函数的区别
- [ ] 零温极限 vs 经典高温极限
- [ ] Kubo-Strěda 公式 → Chern 数 → 量子霍尔效应
- [ ] 开放系统 LRT 中 Markov 性 vs 非 Markov 性的判据

### 14.2 最容易踩的坑

1. **混淆 $\chi(\omega)$ 和 $C(\omega)$**：前者是 $\int_0^{\infty}$ 的 Laplace-Fourier，后者是 $\int_{-\infty}^{\infty}$ 的 Fourier → 前者在上半平面解析，后者不一定
2. **忽略 $i\eta$ 收敛因子**：$\chi(\omega) = \lim_{\eta \to 0^+} \cdots$ —— $\eta$ 的符号编码了推迟（$+i\eta$）vs 超前（$-i\eta$）边界条件
3. **以为线性响应只能用于平衡态**：Ban 等 (2017) 和 Konopik & Lutz (2019) 已将 LRT 推广到非平衡稳态
4. **把 Matsubara 频率当物理频率**：Matsubara $\omega_n = 2\pi n/\beta$ 是虚轴上离散点，物理 $\omega$ 是实轴上的连续变量
5. **以为"弱外场"等价于"弱系统-环境耦合"**：前者是微扰参数小（$F \ll 1$），后者是耗散耦合小（$g \ll \omega$）——两个独立的"弱"条件

---

## 15. 参考文献与推荐阅读顺序

### 15.1 入门教材（先读）

1. **L. E. Reichl, *A Modern Course in Statistical Physics* (4th ed., 2016)**
   - 第 13-14 章：线性响应与涨落耗散定理的物理介绍
   - 中文读者友好：推导详细，不假设多体理论前置知识
   - 建议：读完本笔记 §1-8 后，读此书第 13 章巩固

2. **J. J. Sakurai, *Modern Quantum Mechanics* (2nd ed.)**
   - 第 5 章：含时微扰论（相互作用表象、Dyson 级数、跃迁几率）
   - Kubo 公式推导的前置技能

### 15.2 标准教材（同步读）

3. **R. Kubo, M. Toda, N. Hashitsume, *Statistical Physics II: Nonequilibrium Statistical Mechanics* (Springer, 1985)**
   - 第 2 章：Kubo 自己的陈述——从物理动机到公式推导
   - 经典名著，细节丰富

4. **G. D. Mahan, *Many-Particle Physics* (3rd ed., 2000)**
   - 第 3 章：线性响应与 Kubo 公式（格林函数进路）
   - 第 7 章：有限温度 Matsubara 形式
   - 适合学完本笔记后进一步深入多体

5. **A. Altland & B. Simons, *Condensed Matter Field Theory* (2nd ed., 2010)**
   - 第 6 章：线性响应与涨落耗散定理（路径积分进路）
   - 从场论视角统一处理，适合后续提升

### 15.3 高级教材（后读）

6. **H. Bruus & K. Flensberg, *Many-Body Quantum Theory in Condensed Matter Physics* (2004)**
   - 第 6 章：Kubo 公式与电导率计算
   - 强调实际计算（无序平均、Feynman 图）

7. **G. De Nittis & M. Lein, *Linear Response Theory: An Analytic-Algebraic Approach* (Springer Briefs, 2017)**
   - **本图书馆已有完整翻译笔记** [content/papers/de-nittis2016-linear-response/](/yuulibrary/papers/de-nittis2016-linear-response/)
   - von Neumann 代数 + 非交换 $L^p$ 空间的统一数学框架
   - 对想深入理解 LRT 严格数学基础的读者不可或缺
   - 前提：需要泛函分析（Banach/Hilbert 空间、谱定理、$C^*$-代数基础）

### 15.4 经典论文

8. **R. Kubo, *J. Phys. Soc. Jpn.* 12, 570 (1957)**
   - 原始 Kubo 公式论文。"不可逆过程的统计力学理论 I"
   - 建议：读完本笔记 §1-4 后去读，体会 Kubo 的原初动机

9. **J. Bellissard, A. van Elst, H. Schulz-Baldes, *J. Math. Phys.* 35, 5373 (1994)**
   - 非交换几何进路处理量子霍尔效应，证明了 Kubo 导出的 DCF 的量子化
   - $C^*$-代数框架在凝聚态中的经典应用

10. **S. L. Jacob & J. Goold, arXiv:2504.12385 (2025)**
    - **本图书馆已有完整翻译笔记** [content/papers/jacob2025-collision-kubo/](/yuulibrary/papers/jacob2025-collision-kubo/)
    - Kubo 公式从散射理论中的自主涌现 + 附录 A 是优秀 LRT 教程
    - 建议：**读完本笔记后去读附录 A**——两者互补

### 15.5 与 Rabi / Spin-Boson / Berry 相相关的论文

11. **M. Ban, S. Kitajima, T. Arimitsu, F. Shibata, *Phys. Rev. A* 95, 022126 (2017)**
    - **本图书馆已有完整翻译笔记** [content/papers/ban2017-linear-response-open-systems/](/yuulibrary/papers/ban2017-linear-response-open-systems/)
    - 开放系统 LRT：初始态任意 + 含初始关联 + 四部分响应函数
    - 对理解 Rabi 模型 USC 区间非 Markov 响应至关重要

12. **J. Henheik & S. Teufel, *Comm. Math. Phys.* 373, 621 (2020) & arXiv:2101.00717 (2021)**
    - **本图书馆已有完整翻译笔记**
    - NEASS 方法论证 Kubo 公式：处理外场关闭 gap 的情况
    - 对理解 Berry 相在输运实验中的绝热前提有直接价值

13. **G. De Filippis et al., *Phys. Rev. Lett.* 130, 210401 (2023)**
    - **本图书馆已有完整翻译笔记** [content/papers/dissipation-driven-rabi-qpt/](/yuulibrary/papers/dissipation-driven-rabi-qpt/)
    - Rabi 模型耗散驱动相变——Ness 处 Liouvillian gap 闭合
    - LRT 在非平衡相变临界点处的失效（发散）是理解 USC 物理的关键

14. **P. J. Leek et al., *Science* 318, 1889 (2007)**
    - **本图书馆已有完整翻译笔记**
    - 固态量子比特中首次观测 Berry 相
    - Berry 相的 LRT 诠释：$\sigma_{xy}$ 作为 Berry 曲率在参数空间的积分

### 15.6 后续需要补充阅读的材料

15. **A. J. Leggett et al., *Rev. Mod. Phys.* 59, 1 (1987)**
    - Spin-Boson 模型的综述——耗散两能级系统的"圣经"
    - 需要补充：LRT 在 Ohmic/Sub-Ohmic/Super-Ohmic 耗散下的具体计算

16. **H.-P. Breuer & F. Petruccione, *The Theory of Open Quantum Systems* (Oxford, 2006)**
    - 第 3-4 章：量子主方程的微观推导（投影算子方法）
    - 第 9 章：开放系统线性响应
    - 建议在读完 Ban 等 (2017) 笔记后补充阅读

17. **D. A. Abanin et al., *Rev. Mod. Phys.* 91, 021001 (2019)**
    - 多体局域化（MBL）综述
    - MBL 系统的 LRT（$\sigma(\omega)$ 在低频的行为）是当前活跃研究前沿

---

## 16. 补充：公式索引

| 名称 | 公式 | 位置 |
|------|------|------|
| 实时间响应函数 | $\phi_{AV}(t) = -\frac{i}{\hbar}\theta(t)\langle[A(t), V]\rangle_0$ | §3-4 |
| 频域 Kubo 公式 | $\chi_{AV}(\omega) = \int_0^{\infty} dt \phi_{AV}(t) e^{i\omega t}$ | §4 |
| 涨落耗散定理 | $\Im[\chi_{AA}] = -\frac{1}{\hbar}\tanh(\beta\hbar\omega/2) C_{AA}$ | §8 |
| 谱函数 | $S_{AV}(\omega) = \frac{1}{Z}\sum_{m,n} e^{-\beta E_m} |\langle m|A|n\rangle|^2 \delta(\hbar\omega - E_n + E_m)$ | §7 |
| Kramers-Kronig | $\Re[\chi(\omega)] = \frac{1}{\pi}\mathcal{P}\int d\omega' \frac{\Im[\chi(\omega')]}{\omega'-\omega}$ | §5 |
| Kubo-Strěda (DCF) | $\sigma_{xy} = -i\mathcal{T}(P [[P, X], [P, Y]])$ | §9 |
| 开放系统 LRT | $\phi_{BA} = \phi_{BA}^{(0)} + \phi_{BA}^{(c)} + \phi_{BA}^{(i,0)} + \phi_{BA}^{(i,c)}$ | §12 |
| 动态结构因子 | $S(\mathbf{q},\omega) = \frac{1}{2\pi\hbar} \int dt e^{i\omega t} \langle\rho_{-\mathbf{q}}(t) \rho_{\mathbf{q}}(0)\rangle$ | §7 |

---

*最后更新：2026-07-01。基于本图书馆书籍（De Nittis & Lein, Milonni）、论文笔记（Henheik & Teufel, Ban et al., Jacob & Goold, De Filippis et al., Leek et al.）及标准教材消化重组。*

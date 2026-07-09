---
title: "自旋-玻色子模型 wormhole QMC 推导笔记"
description: "从 Rabi/JC/XXZ spin-boson 到 retarded spin worldline——从零推导玻色子精确积分、Wick收缩、重组指数化、顶点权重、diagonal/loop update 与无符号条件"
date: 2026-07-09
author: "Manual Weber"
source_type: "paper"
source_title: "Quantum Monte Carlo simulation of spin-boson models using wormhole updates"
tags: ["量子蒙特卡罗", "虫洞更新", "自旋-玻色子模型", "路径积分"]
weight: 4
---

## 1. What this algorithm solves

自旋-玻色子模型（spin-boson model）描述一个或少数几个自旋自由度与大量玻色模式的线性耦合。它是量子耗散、量子相变、量子光学（Rabi、Jaynes-Cummings）和量子磁性（XXZ spin-boson）的统一框架。

核心困难：玻色浴的自由度是无限的。微扰论只在弱耦合有效，精确对角化受浴截断限制，张量网络方法在高维或长程关联下代价急剧增长。

wormhole QMC 算法（Weber, PRB 105, 165129, 2022）解决这个问题的方式是：

1. **精确积分掉玻色浴**：利用浴是自由玻色子 + 耦合对玻色算符线性的条件，在虚时间路径积分中解析地积掉所有玻色自由度。
2. **得到推迟自旋相互作用**：积分后产生一个纯自旋的推迟作用量 $\hat{\mathcal{H}}_{\mathrm{ret}}$，包含长程虚时间关联。
3. **对推迟作用量做 QMC 展开**：将 $e^{-\hat{\mathcal{H}}_{\mathrm{ret}}}$ 展开为幂级数（SSE 风格），用 directed-loop / wormhole 更新在扩展配置空间中采样。

输出：有限温度下自旋-玻色子模型的统计力学性质（磁化率、关联函数、相边界）。在 quadratic bath + linear coupling + sign-free 条件下，无微扰近似、无浴截断。

---

## 2. 通用模型与模型字典

### 2.1 哈密顿量

考虑一个 spin-$1/2$ 自由度与玻色浴耦合的系统。自旋算符定义为

$$
\hat{S}_\ell = \frac{1}{2}\hat{\sigma}_\ell, \qquad \ell \in \{x, y, z\}.
$$

通用哈密顿量为

$$
\begin{aligned}
\hat{H} &= \hat{H}_{\mathrm{s}} + \hat{H}_{\mathrm{b}} + \hat{H}_{\mathrm{sb}}.
\end{aligned}
$$

自旋哈密顿量 $\hat{H}_{\mathrm{s}}$ 可包含 Zeeman 场、交换作用等纯自旋项，一般形式为

$$
\begin{aligned}
\hat{H}_{\mathrm{s}} &= -\sum_{\ell} h_{\ell} \hat{S}_{\ell} + \hat{H}_{\mathrm{ex}},
\end{aligned}
$$

其中 $h_{\ell}$ 为外磁场分量，$\hat{H}_{\mathrm{ex}}$ 为自旋间交换相互作用（如 Heisenberg、XXZ 等）。这些项仅作用于自旋空间，不涉及玻色子。以下推导中暂设 $\hat{H}_{\mathrm{s}} = 0$ 以简化记号——这不是算法限制，实际计算时可将 $\hat{H}_{\mathrm{s}}$ 作为额外顶点加入（见第 10 节）。

玻色浴是自由简谐振子之和：

$$
\begin{aligned}
\hat{H}_{\mathrm{b}} &= \sum_{\mu} \omega_{\mu} \hat{a}_{\mu}^{\dagger} \hat{a}_{\mu},
\end{aligned}
$$

其中 $\hat{a}_{\mu}^{\dagger}$（$\hat{a}_{\mu}$）产生（湮灭）一个频率为 $\omega_{\mu}$ 的玻色子。指标 $\mu$ 可标记连续谱的不同分量，也可标记有限系统的格点。

自旋-玻色耦合取线性形式：

$$
\begin{aligned}
\hat{H}_{\mathrm{sb}} &= \sum_{\mu} \bigl( \hat{a}_{\mu}^{\dagger} \hat{\varrho}_{\mu} + \hat{\varrho}_{\mu}^{\dagger} \hat{a}_{\mu} \bigr),
\end{aligned}
$$

其中 $\hat{\varrho}_{\mu} = \hat{\varrho}_{\mu}[\hat{S}_{\alpha}]$ 是仅作用在自旋 Hilbert 空间上的算符，包含耦合常数。

为方便标记，引入上标 $c$ 和反指标 $\bar{c}$：

$$
\begin{aligned}
\hat{V} \equiv \hat{H}_{\mathrm{sb}} = \sum_{\mu c} \hat{a}_{\mu}^{c} \hat{\varrho}_{\mu}^{\bar{c}},
\end{aligned}
$$

其中 $c = \dagger$ 时 $\hat{a}_{\mu}^{\dagger}$，$c = \varnothing$ 时 $\hat{a}_{\mu}$；$\bar{c}$ 取相反的指标。

### 2.2 模型字典

同一套推导框架覆盖三个物理上截然不同的模型：

| Model | $\hat{H}_{\mathrm{sb}}$ | $\hat{\varrho}_{\mu}$ |
|-------|------|-----|
| Rabi / original spin-boson | $\gamma_{\mu}\,\hat{S}_z(\hat{a}_{\mu}^{\dagger}+\hat{a}_{\mu})$ | $\gamma_{\mu}\,\hat{S}_z$ |
| JC-like | $\gamma_{\mu}\,(\hat{a}_{\mu}^{\dagger}\hat{S}_- + \hat{S}_+\hat{a}_{\mu})$ | $\gamma_{\mu}\,\hat{S}_-$ |
| XXZ spin-boson | $\gamma_{\mu\ell}\,(\hat{a}_{\mu\ell}^{\dagger}+\hat{a}_{\mu\ell})\,\hat{S}_\ell$ | $\gamma_{\mu\ell}\,\hat{S}_\ell$ |

关键区分：Rabi 模型中 $\hat{\varrho}_{\mu} = \hat{\varrho}_{\mu}^{\dagger}$（厄米耦合算符），导致推迟相互作用自然对称化为 $D_{+}$ 传播子。JC 模型中 $\hat{\varrho}_{\mu} \neq \hat{\varrho}_{\mu}^{\dagger}$，推迟相互作用保留非对称结构，顶点类型也因此不同。

对于 XXZ spin-boson，指标 $\ell \in \{x, y, z\}$ 标记自旋分量，每个分量耦合到独立的浴（复合指标 $\mu\ell$）。XY 各向同性（$J_x = J_y \equiv \lambda_{xy}$，$J_z \equiv \lambda_z$）时退化为常规 XXZ 结构，$S_x S_x + S_y S_y$ 可写成升降算符的对称组合 $\frac{1}{2}(S_+ S_- + S_- S_+)$。

---

## 3. 从 Dyson 展开到推迟相互作用

推导的核心逻辑是：**展开耦合 $\hat{V}$ → Wick 收缩玻色子 → 重指数化为 $\hat{\mathcal{H}}_{\mathrm{ret}}$**。然后对 $\hat{\mathcal{H}}_{\mathrm{ret}}$ 再做 QMC 展开。

### 3.1 展开配分函数

将哈密顿量拆分为

$$
\begin{aligned}
\hat{H}_0 &\equiv \hat{H}_{\mathrm{b}}, \\
\hat{V} &\equiv \hat{H}_{\mathrm{sb}}.
\end{aligned}
$$

为简化记号，以下设 $\hat{H}_{\mathrm{s}} = 0$。这不是算法限制：在实际计算中，$\hat{H}_{\mathrm{s}}$ 中无符号问题的项可作为额外相互作用顶点加入；复杂性仅出现在这些额外顶点本身引入负权重或复非分支过程时。记号上暂设 $\hat{H}_{\mathrm{s}} = 0$ 使推导清晰。

配分函数 $Z = \mathrm{Tr}\, e^{-\beta \hat{H}}$ 在相互作用绘景中的 Dyson 展开：

$$
\begin{aligned}
Z &= \sum_{m=0}^{\infty} (-1)^{m} \int_{0}^{\beta} d\tau_{1} \int_{0}^{\tau_{1}} d\tau_{2} \cdots \int_{0}^{\tau_{m-1}} d\tau_{m} \\
  &\quad \times \mathrm{Tr}\bigl[ e^{-\beta \hat{H}_{0}} \hat{V}(\tau_{1}) \hat{V}(\tau_{2}) \cdots \hat{V}(\tau_{m}) \bigr],
\end{aligned}
$$

其中 $\hat{V}(\tau) = e^{\tau \hat{H}_0} \hat{V} e^{-\tau \hat{H}_0}$，且 $\beta \ge \tau_1 \ge \tau_2 \ge \cdots \ge \tau_m \ge 0$。此式**无** $1/m!$ 因子：积分限已强制时间有序，$m$ 个算符的每种排列恰好出现一次。

引入虚时间编序算符 $\hat{\mathcal{T}}_{\tau}$，将有序积分改写为各 $\tau_i$ 独立从 $0$ 积到 $\beta$ 的对称形式。这一步引入了因子 $1/m!$：

$$
\begin{aligned}
\int_{0}^{\beta} d\tau_{1} \int_{0}^{\tau_{1}} d\tau_{2} \cdots \int_{0}^{\tau_{m-1}} d\tau_{m}
\;=\;
\frac{1}{m!} \int_{0}^{\beta} d\tau_{1} \int_{0}^{\beta} d\tau_{2} \cdots \int_{0}^{\beta} d\tau_{m} \;\times\; \hat{\mathcal{T}}_{\tau}.
\end{aligned}
$$

**为什么有 $1/m!$。** 无序积分对 $m$ 个时间变量的所有 $m!$ 种排列求和。$\hat{\mathcal{T}}_{\tau}$ 把每一种排列都排成相同的时间序——因此每个物理上不同的有序构型被重复计数了 $m!$ 次。除以 $m!$ 恢复正确权重。得到

$$
\begin{aligned}
Z &= \sum_{m=0}^{\infty} \frac{(-1)^{m}}{m!} \int_{0}^{\beta} d\tau_{1} \int_{0}^{\beta} d\tau_{2} \cdots \int_{0}^{\beta} d\tau_{m} \\
  &\quad \times \mathrm{Tr}\bigl[ e^{-\beta \hat{H}_{0}} \hat{\mathcal{T}}_{\tau} \hat{V}(\tau_{1}) \hat{V}(\tau_{2}) \cdots \hat{V}(\tau_{m}) \bigr].
\end{aligned}
$$

将 $\hat{V} = \sum_{\mu c} \hat{a}_{\mu}^{c} \hat{\varrho}_{\mu}^{\bar{c}}$ 代入。由于 $\hat{a}$ 只作用于玻色空间，$\hat{\varrho}$ 只作用于自旋空间，迹分离：

$$
\begin{aligned}
Z &= \sum_{m=0}^{\infty} \frac{(-1)^{m}}{m!} \int_{0}^{\beta} d\tau_{1} \cdots \int_{0}^{\beta} d\tau_{m}
      \sum_{\mu_{1} \cdots \mu_{m}} \sum_{c_{1} \cdots c_{m}} \\
  &\quad \times \mathrm{Tr}_{\mathrm{b}}\bigl[ e^{-\beta \hat{H}_{\mathrm{b}}} \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu_{1}}^{c_{1}}(\tau_{1}) \cdots \hat{a}_{\mu_{m}}^{c_{m}}(\tau_{m}) \bigr] \\
  &\quad \times \mathrm{Tr}_{\mathrm{s}}\bigl[ \hat{\mathcal{T}}_{\tau} \hat{\varrho}_{\mu_{1}}^{\bar{c}_{1}}(\tau_{1}) \cdots \hat{\varrho}_{\mu_{m}}^{\bar{c}_{m}}(\tau_{m}) \bigr].
\end{aligned}
$$

### 3.2 为何只保留偶数阶

玻色迹的核心是

$$
\mathrm{Tr}_{\mathrm{b}}\bigl[ e^{-\beta \hat{H}_{\mathrm{b}}} \hat{\mathcal{T}}_{\tau} \hat{a}^{c_1}(\tau_1) \cdots \hat{a}^{c_m}(\tau_m) \bigr].
$$

玻色浴 $\hat{H}_{\mathrm{b}} = \sum_{\mu} \omega_{\mu} \hat{a}_{\mu}^{\dagger} \hat{a}_{\mu}$ 是粒子数算符的和，因此 $[\hat{H}_{\mathrm{b}}, \hat{N}] = 0$ 其中 $\hat{N} = \sum_{\mu} \hat{a}_{\mu}^{\dagger} \hat{a}_{\mu}$。$\hat{H}_{\mathrm{b}}$ 的本征态是粒子数态 $|n_1, n_2, \ldots\rangle$。

在粒子数基底下求迹：

$$
\mathrm{Tr}_{\mathrm{b}}[\bullet] = \sum_{n_1, n_2, \ldots} \langle n_1, n_2, \ldots | \bullet | n_1, n_2, \ldots \rangle.
$$

每个湮灭算符 $\hat{a}$ 将某个模式的粒子数减 1；每个产生算符 $\hat{a}^{\dagger}$ 将粒子数加 1。因此算符串 $\hat{a}^{c_1} \cdots \hat{a}^{c_m}$ 作用后，总粒子数的净变化为

$$
\Delta N = (\text{产生算符的个数}) - (\text{湮灭算符的个数}).
$$

由于迹求的是 $\langle \text{初态} | \bullet | \text{初态} \rangle$——初态和末态必须是同一个粒子数态——只有当 $\Delta N = 0$ 时矩阵元才可能非零。也就是说，**产生和湮灭算符的个数必须相等**。

令产生算符数为 $n$，湮灭算符数也为 $n$，则总算符数 $m = 2n$。所有奇数 $m$ 的项严格为零。

同时 $(-1)^{m} = (-1)^{2n} = +1$——Dyson 展开中的符号因子不引入负号。

最后，$Z_{\mathrm{b}} = \prod_{\mu} (1 - e^{-\beta \omega_{\mu}})^{-1}$ 是自由玻色子的配分函数，是所有推导的归一化基准。

### 3.3 Wick 收缩

#### 3.3.1 Wick 定理的陈述

$\hat{H}_{\mathrm{b}}$ 是自由玻色子的二次型，因此热平均 $\langle \bullet \rangle_{\mathrm{b}}$ 是 Gaussian 型的。对 Gaussian 理论，Wick 定理断言：任意 $2n$ 点关联函数等于所有**完全收缩**（两两配对）之和。

#### 3.3.2 哪些收缩非零？

考虑一个收缩对 $\langle \hat{\mathcal{T}}_{\tau} \hat{a}^{c_i}(\tau_i) \hat{a}^{c_j}(\tau_j) \rangle_{\mathrm{b}}$：

- $\langle \hat{a} \hat{a} \rangle_{\mathrm{b}} = 0$（两个湮灭算符不守恒粒子数）
- $\langle \hat{a}^{\dagger} \hat{a}^{\dagger} \rangle_{\mathrm{b}} = 0$（两个产生算符同理）
- $\langle \hat{a} \hat{a}^{\dagger} \rangle_{\mathrm{b}}$ —— 非零，就是传播子 $D$

因此**非零收缩只发生在 $\hat{a}$ 与 $\hat{a}^{\dagger}$ 之间**。每个湮灭算符必须与一个产生算符配对。

此外，不同浴模式的玻色子相互独立——$\hat{a}_{\mu}$ 和 $\hat{a}_{\nu}^{\dagger}$ 的收缩贡献 $\delta_{\mu\nu}$。只有**同一模式**的算符对才有非零收缩。

#### 3.3.3 具体例子：$n = 1$

当 $n = 1$——即 1 个湮灭算符 $\hat{a}_{\mu_1}(\tau_1)$ 和 1 个产生算符 $\hat{a}_{\mu_2}^{\dagger}(\tau_2)$：

$$
\begin{aligned}
\langle \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu_1}(\tau_1) \hat{a}_{\mu_2}^{\dagger}(\tau_2) \rangle_{\mathrm{b}}
&= D(\omega_{\mu_1}, \tau_1 - \tau_2) \, \delta_{\mu_1, \mu_2}.
\end{aligned}
$$

只有一种配对方式（$S_1$ 只有一个元素——恒等排列），一个传播子 $D$，一个 Kronecker $\delta$。

#### 3.3.4 具体例子：$n = 2$

当 $n = 2$——2 个湮灭算符 $\hat{a}_{\mu_1}(\tau_1), \hat{a}_{\mu_2}(\tau_2)$ 和 2 个产生算符 $\hat{a}_{\mu_3}^{\dagger}(\tau_3), \hat{a}_{\mu_4}^{\dagger}(\tau_4)$。

每种完全收缩对应一个排列 $\pi \in S_2 = \{\mathrm{id}, (12)\}$：

- $\pi = \mathrm{id}$：$\hat{a}_{\mu_1}$ 与 $\hat{a}_{\mu_3}^{\dagger}$ 配对，$\hat{a}_{\mu_2}$ 与 $\hat{a}_{\mu_4}^{\dagger}$ 配对
- $\pi = (12)$：$\hat{a}_{\mu_1}$ 与 $\hat{a}_{\mu_4}^{\dagger}$ 配对，$\hat{a}_{\mu_2}$ 与 $\hat{a}_{\mu_3}^{\dagger}$ 配对

$$
\begin{aligned}
\langle \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu_1}(\tau_1) \hat{a}_{\mu_2}(\tau_2)
   \hat{a}_{\mu_3}^{\dagger}(\tau_3) \hat{a}_{\mu_4}^{\dagger}(\tau_4) \rangle_{\mathrm{b}}
&= D(\omega_{\mu_1}, \tau_1 - \tau_3) \delta_{\mu_1,\mu_3} \; D(\omega_{\mu_2}, \tau_2 - \tau_4) \delta_{\mu_2,\mu_4} \\
&\quad + D(\omega_{\mu_1}, \tau_1 - \tau_4) \delta_{\mu_1,\mu_4} \; D(\omega_{\mu_2}, \tau_2 - \tau_3) \delta_{\mu_2,\mu_3}.
\end{aligned}
$$

两个排列 → 两项 → 每项 $n=2$ 个 $D$ 因子和 $n=2$ 个 $\delta$ 因子。

#### 3.3.5 一般公式

推广到任意 $n$：将 $n$ 个湮灭算符排在左边，$n$ 个产生算符排在右边，

$$
\begin{aligned}
&\langle \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu_{1}}(\tau_{1}) \cdots \hat{a}_{\mu_{n}}(\tau_{n})
   \hat{a}_{\mu_{n+1}}^{\dagger}(\tau_{n+1}) \cdots \hat{a}_{\mu_{2n}}^{\dagger}(\tau_{2n}) \rangle_{\mathrm{b}} \\
&\qquad = \sum_{\pi \in S_{n}} \prod_{k=1}^{n}
   D(\omega_{\mu_{k}}, \tau_{k} - \tau_{n+\pi[k]}) \,
   \delta_{\mu_{k}, \mu_{n+\pi[k]}},
\end{aligned}
$$

其中：

- $S_{n}$：$n$ 个对象的对称群，有 $n!$ 个元素
- $\pi[k]$：排列 $\pi$ 把第 $k$ 个湮灭算符分配给第 $\pi[k]$ 个产生算符
- $D(\omega_{\mu}, \tau)$：自由玻色传播子（下一节）
- $\delta_{\mu, \nu}$：确保 bath 模式匹配

Wick 收缩后，所有玻色算符消失，只剩下传播子 $D$ 和自旋算符 $\hat{\varrho}$。物理上，玻色浴的作用被压缩为连接两个虚时间点的"记忆核" $D(\omega, \tau - \tau')$。

### 3.4 组合因子

从 §3.1 的对称 Dyson 展开出发，取 $m = 2n$（§3.2 已证奇数阶为零）。将 $V(\tau_i) = \sum_{\mu_i c_i} \hat{a}_{\mu_i}^{c_i}(\tau_i) \hat{\varrho}_{\mu_i}^{\bar{c}_i}(\tau_i)$ 代入并分离玻色迹与自旋迹：

$$
\begin{aligned}
Z &= \sum_{n=0}^{\infty} \frac{(-1)^{2n}}{(2n)!}
   \int_{0}^{\beta} d\tau_{1} \cdots \int_{0}^{\beta} d\tau_{2n}
   \sum_{\mu_{1} \cdots \mu_{2n}} \sum_{c_{1} \cdots c_{2n}} \\
  &\quad \times \underbrace{
      \mathrm{Tr}_{\mathrm{b}}\bigl[ e^{-\beta \hat{H}_{\mathrm{b}}}
      \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu_{1}}^{c_{1}}(\tau_{1}) \cdots
      \hat{a}_{\mu_{2n}}^{c_{2n}}(\tau_{2n}) \bigr]
      }_{\text{玻色迹}}
   \times \underbrace{
      \mathrm{Tr}_{\mathrm{s}}\bigl[ \hat{\mathcal{T}}_{\tau}
      \hat{\varrho}_{\mu_{1}}^{\bar{c}_{1}}(\tau_{1}) \cdots
      \hat{\varrho}_{\mu_{2n}}^{\bar{c}_{2n}}(\tau_{2n}) \bigr]
      }_{\text{自旋迹}}.
\end{aligned}
$$

**第一步：选位置。** 在 $2n$ 个算符中，必须恰好 $n$ 个是产生算符（$\dagger$）、$n$ 个是湮灭算符（$\varnothing$），否则玻色迹为零（§3.2）。从 $2n$ 个位置中选 $n$ 个放产生算符，有 $\binom{2n}{n}$ 种选法。$(-1)^{2n}=+1$。暂时只写出一种典型排序（所有湮灭算符在前，所有产生算符在后），在乘以 $\binom{2n}{n}$ 后覆盖所有等价排序：

$$
\begin{aligned}
Z &= \sum_{n=0}^{\infty} \frac{1}{(2n)!} \cdot \binom{2n}{n}
   \int_{0}^{\beta} d\tau_{1} \cdots d\tau_{n} d\tau_{1}' \cdots d\tau_{n}'
   \sum_{\mu_{1} \cdots \mu_{n}} \sum_{\nu_{1} \cdots \nu_{n}} \\
  &\quad \times Z_{\mathrm{b}} \,
   \langle \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu_{1}}(\tau_{1}) \cdots \hat{a}_{\mu_{n}}(\tau_{n})
      \hat{a}_{\nu_{1}}^{\dagger}(\tau_{1}') \cdots \hat{a}_{\nu_{n}}^{\dagger}(\tau_{n}') \rangle_{\mathrm{b}} \\
  &\quad \times \mathrm{Tr}_{\mathrm{s}}\bigl[ \hat{\mathcal{T}}_{\tau}
      \hat{\varrho}_{\mu_{1}}(\tau_{1}) \cdots \hat{\varrho}_{\mu_{n}}(\tau_{n})
      \hat{\varrho}_{\nu_{1}}^{\dagger}(\tau_{1}') \cdots \hat{\varrho}_{\nu_{n}}^{\dagger}(\tau_{n}') \bigr].
\end{aligned}
$$

其中 $\tau_k' = \tau_{n+k}$。

**第二步：Wick 收缩。** 应用 §3.3 的 Wick 定理。每种完全收缩对应一个排列 $\pi \in S_n$：第 $k$ 个湮灭算符 $\hat{a}_{\mu_k}(\tau_k)$ 与第 $\pi[k]$ 个产生算符 $\hat{a}_{\nu_{\pi[k]}}^{\dagger}(\tau_{\pi[k]}')$ 配对。代入传播子 $D$ 和 Kronecker $\delta$：

$$
\begin{aligned}
\langle \cdots \rangle_{\mathrm{b}}
&= \sum_{\pi \in S_n} \prod_{k=1}^{n}
   D(\omega_{\mu_k}, \tau_k - \tau_{\pi[k]}') \,
   \delta_{\mu_k, \nu_{\pi[k]}}.
\end{aligned}
$$

对每个 $\pi$，$\delta$ 迫使 $\nu_{\pi[k]} = \mu_k$，即 $\nu_k = \mu_{\pi^{-1}[k]}$。代入自旋迹，暂时保留 $\sum_{\pi}$：

$$
\begin{aligned}
Z &= Z_{\mathrm{b}} \sum_{n=0}^{\infty}
   \frac{1}{(2n)!} \binom{2n}{n}
   \int d\tau_{1} \cdots d\tau_{n}' \sum_{\mu_{1} \cdots \mu_{n}}
   \sum_{\pi \in S_n} \prod_{k=1}^{n} D(\omega_{\mu_k}, \tau_k - \tau_{\pi[k]}') \\
  &\quad \times \mathrm{Tr}_{\mathrm{s}}\bigl[ \hat{\mathcal{T}}_{\tau}
      \hat{\varrho}_{\mu_{1}}(\tau_{1}) \cdots \hat{\varrho}_{\mu_{n}}(\tau_{n})
      \hat{\varrho}_{\mu_{\pi^{-1}[1]}}^{\dagger}(\tau_{1}') \cdots
      \hat{\varrho}_{\mu_{\pi^{-1}[n]}}^{\dagger}(\tau_{n}') \bigr].
\end{aligned}
$$

**第三步：哑变量重标号消除 $\sum_{\pi}$。** $\tau_1', \ldots, \tau_n'$ 是积分哑变量。对任意 $\pi$，做替换 $\tau_k' \to \tau_{\pi[k]}'$，积分测度不变。重标号后 $D$ 的乘积变为 $\prod_k D(\omega_{\mu_k}, \tau_k - \tau_k')$（恒等排列的形式），自旋迹中的 $\hat{\varrho}_{\mu_{\pi^{-1}[k]}}^{\dagger}(\tau_{\pi[k]}')$ 变为 $\hat{\varrho}_{\mu_{k}}^{\dagger}(\tau_{k}')$——与 $\pi$ 无关。因此 $n!$ 个 $\pi$ 给出完全相同的积分值：

$$
\sum_{\pi \in S_n} (\cdots)_{\pi} = n! \, (\cdots)_{\mathrm{id}}.
$$

**第四步：归约系数。** $\frac{1}{(2n)!} \binom{2n}{n} = \frac{1}{n! \, n!}$（第一步），乘以 $n!$（上一步）得 $\frac{1}{n!}$。最终：

$$
\boxed{
\begin{aligned}
\frac{Z}{Z_{\mathrm{b}}} &= \sum_{n=0}^{\infty} \frac{1}{n!}
   \mathrm{Tr}_{\mathrm{s}}\Biggl\{
   \hat{\mathcal{T}}_{\tau} \biggl[
   \iint_{0}^{\beta} d\tau d\tau' \sum_{\mu}
   \hat{\varrho}_{\mu}^{\dagger}(\tau) D(\omega_{\mu}, \tau - \tau') \hat{\varrho}_{\mu}(\tau')
   \biggr]^{n}
   \Biggr\}.
\end{aligned}
}
$$

### 3.5 重指数化

上式的求和是指数函数的 Taylor 级数 $e^{A} = \sum_{n=0}^{\infty} A^{n}/n!$。因此

$$
\boxed{
\begin{aligned}
Z &= Z_{\mathrm{b}} \, \mathrm{Tr}_{\mathrm{s}} \, \hat{\mathcal{T}}_{\tau} \, e^{-\hat{\mathcal{H}}_{\mathrm{ret}}},
\end{aligned}
}
$$

其中推迟自旋相互作用：

$$
\boxed{
\begin{aligned}
\hat{\mathcal{H}}_{\mathrm{ret}} &= -\iint_{0}^{\beta} d\tau d\tau' \sum_{\mu}
   \hat{\varrho}_{\mu}^{\dagger}(\tau) D(\omega_{\mu}, \tau - \tau') \hat{\varrho}_{\mu}(\tau').
\end{aligned}
}
$$

负号匹配：$-\hat{\mathcal{H}}_{\mathrm{ret}} = +\iint \hat{\varrho}^{\dagger} D \hat{\varrho}$。

此时，玻色自由度已被精确积掉，问题化为纯自旋的推迟相互作用系统。

---

## 4. 玻色传播子与谱函数

### 4.1 正确的周期性：玻色 KMS 条件

自由玻色传播子由虚时间编序定义，直接计算得，对 $0 \le \tau < \beta$：

$$
D(\omega, \tau) = \langle \hat{\mathcal{T}}_{\tau} \hat{a}(\tau) \hat{a}^{\dagger}(0) \rangle
= \frac{e^{-\omega \tau}}{1 - e^{-\beta \omega}}.
$$

由于 $\hat{a}$ 和 $\hat{a}^{\dagger}$ 是玻色算符（对易关系），传播子满足**周期**边界条件（KMS 条件），而非反周期：

$$
\boxed{
\begin{aligned}
D(\omega, \tau + \beta) = D(\omega, \tau).
\end{aligned}
}
$$

定义 $\tau_{\beta} = \tau \bmod \beta$，$0 \le \tau_{\beta} < \beta$，则对任意 $\tau \in \mathbb{R}$：

$$
D(\omega, \tau) = \frac{e^{-\omega \tau_{\beta}}}{1 - e^{-\beta \omega}}.
$$

完整的逐段形式（$- \beta < \tau < \beta$）：

$$
\boxed{
\begin{aligned}
D(\omega, \tau) &=
\begin{cases}
(1 + n_{B})\, e^{-\omega \tau}, & 0 < \tau < \beta, \\[6pt]
n_{B}\, e^{-\omega \tau}, & -\beta < \tau < 0,
\end{cases}
\end{aligned}
}
$$

其中玻色分布 $n_{B} = 1 / (e^{\beta \omega} - 1)$。这直接来自玻色 KMS 条件 $\langle A(\tau) B(0) \rangle = \langle B(0) A(\tau + \beta) \rangle$。

玻色子周期延拓，不是反周期延拓。反周期延拓是费米子（$\psi(\tau + \beta) = -\psi(\tau)$）的性质。

### 4.2 为何坐标耦合使用 $D_{+}$

对坐标型耦合 $\hat{\varrho}_{\mu} = \hat{\varrho}_{\mu}^{\dagger}$（如 Rabi 模型），推迟相互作用中的被积函数自然对称化。定义对称传播子

$$
D_{+}(\omega, \tau) = \frac{1}{2}\bigl[ D(\omega, \tau) + D(\omega, \beta - \tau) \bigr].
$$

代入 $D$ 的显式，利用周期性 $D(\omega, \beta - \tau) = D(\omega, -\tau)$：

$$
\begin{aligned}
D_{+}(\omega, \tau)
&= \frac{1}{2} \cdot \frac{e^{-\omega \tau} + e^{-\omega(\beta - \tau)}}{1 - e^{-\beta \omega}} \\
&= \frac{\cosh[\omega(\beta/2 - \tau)]}{2 \sinh(\beta \omega / 2)}.
\end{aligned}
$$

$D_{+}$ 在 $\tau \to \beta - \tau$ 下对称：$D_{+}(\omega, \tau) = D_{+}(\omega, \beta - \tau)$。这使得推迟相互作用在交换 $\tau \leftrightarrow \tau'$ 下不变。

### 4.3 幂律谱与长程虚时间核

在连续极限 $\sum_{\mu} \to \int d\omega \, J(\omega)/\pi$ 下，谱函数 $J(\omega)$ 编码了浴的全部信息。

幂律谱（ohmic 族）：

$$
J(\omega) = 2\pi \alpha \, \omega_{c}^{1-s} \, \omega^{s}, \qquad 0 < \omega < \omega_{c},
$$

其中 $\alpha$ 是无量纲耦合强度，$s$ 是谱指数（$s=1$ 为 ohmic，$s<1$ 为 sub-ohmic，$s>1$ 为 super-ohmic），$\omega_c$ 是截断频率。

**传播子本身是指数型，不是幂律。** 固定频率 $\omega$ 的 $D(\omega, \tau)$ 以 $e^{-\omega\tau}$ 指数衰减。幂律行为出现在对**所有频率积分后**的 bath kernel：

$$
K(\tau - \tau') \equiv \frac{1}{\pi} \int_{0}^{\infty} d\omega \, J(\omega) \, D_{+}(\omega, \tau - \tau').
$$

在长虚时间极限 $\omega_c |\tau - \tau'| \gg 1$ 下，

$$
\boxed{
\begin{aligned}
K(\tau - \tau') \sim \frac{1}{|\tau - \tau'|^{1+s}}.
\end{aligned}
}
$$

$s$ 越小，虚时间关联越长程，量子临界行为越强。

---

## 5. 从推迟作用量到 Monte Carlo 采样

### 5.0 随机级数展开（SSE）的基本思想

§3 推导了 $Z = Z_{\mathrm{b}} \mathrm{Tr}_{\mathrm{s}} \hat{\mathcal{T}}_{\tau} e^{-\hat{\mathcal{H}}_{\mathrm{ret}}}$。但如何用 Monte Carlo 计算这个迹？**随机级数展开**（Stochastic Series Expansion, SSE）的策略是：把 $e^{-\hat{\mathcal{H}}_{\mathrm{ret}}}$ 展开为幂级数，每一项对应一个具体的"顶点配置"，然后用 Metropolis 算法在这些配置间采样。

$$
e^{-\hat{\mathcal{H}}_{\mathrm{ret}}} = \sum_{n=0}^{\infty} \frac{1}{n!} \bigl( -\hat{\mathcal{H}}_{\mathrm{ret}} \bigr)^{n}.
$$

$\hat{\mathcal{H}}_{\mathrm{ret}}$ 本身是对 $\tau, \tau'$ 的积分，所以 $(\hat{\mathcal{H}}_{\mathrm{ret}})^{n}$ 是 $n$ 个积分因子（$n$ 个"推迟顶点"）的乘积。展开阶数 $n$ 不是固定的——MC 采样时连 $n$ 也一起变（对角更新加删顶点）。

**为什么需要分解传播子。** 离散 bath 下 $\sum_{\mu}$ 是求和；连续 bath 下 $\sum_{\mu} \to \frac{1}{\pi} \int d\omega \, J(\omega)$。一个顶点包含连续的自由度 $\omega$、$\tau$、$\tau'$，以及离散的顶点类型 $v$。为了高效 Monte Carlo 采样，把顶点的完整权重分解为三个归一化因子的乘积：

$$
D(\omega, \tau) \;\longrightarrow\; \mathcal{I}(\omega) \times P(\omega, \tau) \times (\text{自旋矩阵元}),
$$

其中 $\mathcal{I}(\omega)$ 是归一化的频率分布，$P(\omega, \tau)$ 是给定频率下 $\tau$ 的条件分布。这样可以用**逆变换采样**直接从理论分布中抽 $\omega$ 和 $\tau$（§7），接受率大幅简化。

**连续极限的积分表示。** 将离散 bath 替换为连续谱函数 $J(\omega)$：

$$
\sum_{\mu} f(\omega_{\mu}) \;\longrightarrow\; \frac{1}{\pi} \int_{0}^{\infty} d\omega \, J(\omega) f(\omega).
$$

定义归一化频率分布（总权重为 1）：

$$
\mathcal{I}(\omega) \equiv \frac{J(\omega) / \omega}{\int_{0}^{\infty} d\omega' \, J(\omega') / \omega'}.
$$

（分母是归一化常数；$J(\omega)/\omega$ 而非 $J(\omega)$ 的原因—— §4.3 中 $K(\tau)$ 的衰减行为由 $J(\omega)/\omega$ 的权重主导。）

定义给定 $\omega$ 下 $\tau$ 的条件分布：

$$
P(\omega, \tau) \equiv \omega D(\omega, \tau).
$$

（乘以 $\omega$ 使 $P$ 在 $0 \le \tau < \beta$ 上归一化：$\int_{0}^{\beta} d\tau \, \omega D(\omega, \tau) = 1$。）

推迟相互作用重写为这三个因子的乘积：

$$
\boxed{
\begin{aligned}
\hat{\mathcal{H}}_{\mathrm{ret}} &= -\int_{0}^{\infty} d\omega \, \mathcal{I}(\omega)
   \iint_{0}^{\beta} d\tau d\tau' \sum_{a}
   P(\omega, \tau - \tau') \, \hat{h}_{a}(\tau, \tau'),
\end{aligned}
}
$$

其中 $\hat{h}_{a}(\tau, \tau')$ 只含自旋算符，$a \in \{\text{diagonal}, \text{off-diagonal}\}$ 标记对角/非对角类别。顶点的总权重：

$$
\mathcal{W}_{\nu} = \mathcal{I}(\omega) \, P(\omega, \tau - \tau') \, W_{v} \, d\omega \, d\tau \, d\tau',
$$

其中 $W_{v}$ 是 $\hat{h}_{a}$ 在当前自旋基下的矩阵元——这些就是下一节的顶点权重。

### 5.1 Rabi / 原始自旋-玻色子模型

$$
\hat{H} = -h_{x} \hat{S}_{x} + \sum_{q} \omega_{q} \hat{a}_{q}^{\dagger} \hat{a}_{q}
   \;+\; \sum_{q} \gamma_{q} (\hat{a}_{q}^{\dagger} + \hat{a}_{q}) \hat{S}_{z}.
$$

取 $\hat{\varrho}_{q} = \gamma_{q} \hat{S}_{z} = \hat{\varrho}_{q}^{\dagger}$（厄米耦合算符）。推迟相互作用使用对称传播子 $D_{+}$：

$$
\boxed{
\begin{aligned}
\hat{\mathcal{H}}_{\mathrm{ret}}^{\mathrm{Rabi}} &=
   -\frac{1}{\pi} \int_{0}^{\infty} d\omega \, J(\omega)
   \iint_{0}^{\beta} d\tau d\tau' \,
   \hat{S}_{z}(\tau) D_{+}(\omega, \tau - \tau') \hat{S}_{z}(\tau').
\end{aligned}
}
$$

若希望用 wormhole spin-flip 框架，可通过转动自旋基底（例如 $S_z \leftrightarrow S_x$ 的 Hadamard 旋转）将推迟相互作用分解为非对角部分和对角部分，从而适配 directed-loop 更新。

### 5.2 JC-like 模型

Jaynes-Cummings 型自旋-玻色模型的完整哈密顿量：

$$
\begin{aligned}
\hat{H}_{\mathrm{JC}} &= -h_{z} \hat{S}_{z}
   \;+\; \sum_{q} \omega_{q} \hat{a}_{q}^{\dagger} \hat{a}_{q}
   \;+\; \sum_{q} \gamma_{q} \bigl( \hat{a}_{q}^{\dagger} \hat{S}_{-} + \hat{S}_{+} \hat{a}_{q} \bigr).
\end{aligned}
$$

取 $\hat{\varrho}_{q} = \gamma_{q} \hat{S}_{-}$，$\hat{\varrho}_{q}^{\dagger} = \gamma_{q} \hat{S}_{+}$。代入推迟相互作用的一般形式：

$$
\begin{aligned}
\hat{\mathcal{H}}_{\mathrm{ret}}^{\mathrm{JC}}
&= -\frac{1}{\pi} \int_{0}^{\infty} d\omega \, J(\omega)
   \iint_{0}^{\beta} d\tau d\tau' \,
   \hat{S}_{+}(\tau) D(\omega, \tau - \tau') \hat{S}_{-}(\tau').
\end{aligned}
$$

注意这里使用有方向的 $D$（非 $D_{+}$），因为 $\hat{\varrho} \neq \hat{\varrho}^{\dagger}$，推迟相互作用不是对称组合。顶点算符分类为

$$
\boxed{
\begin{aligned}
\hat{h}_{1}(\tau, \tau') &= \frac{\lambda_{xy}}{2} \hat{S}_{+}(\tau) \hat{S}_{-}(\tau'), \\[4pt]
\hat{h}_{2}(\tau, \tau') &= C + \frac{h_{z}}{2} \bigl[ \hat{S}_{z}(\tau) + \hat{S}_{z}(\tau') \bigr].
\end{aligned}
}
$$

在 Weber 采用的有向顶点定义中，JC retarded vertex 是**带方向的** $\hat{S}_{+}(\tau) D(\tau - \tau') \hat{S}_{-}(\tau')$，而非 $\hat{S}_{+}\hat{S}_{-} + \hat{S}_{-}\hat{S}_{+}$ 的对称组合。因此顶点权重类似于 XXZ 情形但 $\lambda_{z} = 0$ 且 $W_{5} = 0$（仅保留单一方向的 spin-flip 顶点）。

### 5.3 XXZ / XYZ 自旋-玻色子模型

非对角算符部分：

$$
\boxed{
\begin{aligned}
\hat{h}_{1}(\tau, \tau') &= \frac{\lambda_{xy}}{2}
   \bigl[ \hat{S}_{+}(\tau) \hat{S}_{-}(\tau') + \hat{S}_{-}(\tau) \hat{S}_{+}(\tau') \bigr].
\end{aligned}
}
$$

对角算符部分：

$$
\boxed{
\begin{aligned}
\hat{h}_{2}(\tau, \tau') &= C + \lambda_{z} \hat{S}_{z}(\tau) \hat{S}_{z}(\tau')
   \;+\; \frac{h_{z}}{2} \bigl[ \hat{S}_{z}(\tau) + \hat{S}_{z}(\tau') \bigr].
\end{aligned}
}
$$

其中 $\lambda_{\ell} = 2 \alpha_{\ell} \omega_{c} / s$ 包含了谱函数的归一化因子。六种顶点权重为

$$
\boxed{
\begin{aligned}
W_{1} &= C + \frac{\lambda_{z}}{4} - \frac{h_{z}}{2},  &
W_{2} &= W_{3} = C - \frac{\lambda_{z}}{4}, \\[4pt]
W_{4} &= C + \frac{\lambda_{z}}{4} + \frac{h_{z}}{2},  &
W_{5} &= W_{6} = \frac{\lambda_{xy}}{2}.
\end{aligned}
}
$$

无符号条件（所有权重 $\ge 0$）：

$$
\boxed{
C \ge \max\!\left[ \frac{\lambda_{z}}{4}, \; \frac{|h_{z}|}{2} - \frac{\lambda_{z}}{4} \right].
}
$$

上述顶点权重与铁磁 XXZ 最近邻自旋模型的权重等价。

---

## 6. QMC 配置空间与顶点权重

### 6.1 配置定义

一个 Monte Carlo 配置定义为

$$
\mathcal{C} = \{n, \mathcal{C}_{n}, |\alpha\rangle\},
$$

其中 $n$ 是展开阶数，$\mathcal{C}_{n} = \{\nu_1, \ldots, \nu_n\}$ 是有序顶点列表，$|\alpha\rangle$ 是 $S_z$ 基底中的初态。每个顶点变量为

$$
\nu = \{t_{\mathrm{int}}, v, \omega, \tau, \tau'\}.
$$

其中 $t_{\mathrm{int}}$ 标记相互作用类型（区分浴顶点、磁场顶点、交换顶点等），$v \in \{1, \ldots, 6\}$ 是具体的四腿顶点类型（见 §6.2），$\omega$ 是被采样的 bath 频率，$\tau, \tau'$ 是推迟相互作用的两个虚时间点。

配置的总权重：

$$
\boxed{
\begin{aligned}
W(\mathcal{C}) &= \frac{1}{n!} \prod_{p=1}^{n} \mathcal{W}_{\nu_{p}},
\end{aligned}
}
$$

单个顶点的权重：

$$
\boxed{
\begin{aligned}
\mathcal{W}_{\nu} &= \mathcal{I}(\omega) \, P(\omega, \tau - \tau') \, W_{v} \, d\omega \, d\tau \, d\tau',
\end{aligned}
}
$$

其中 $W_{v}$ 是离散顶点类型的权重。$\mathcal{I}(\omega)$ 和 $P(\omega, \tau - \tau')$ 是全局前置因子（与顶点类型 $v$ 无关），在 directed-loop 方程中抵消。

### 6.2 顶点类型表

对 $S_z$ 基底下 spin-$1/2$ 的推迟相互作用，共有六种顶点类型。本文使用 spin-$1/2$ 给出最小顶点表；原则上更高自旋不被禁止，但需要重新定义局域 Hilbert 空间、顶点类型和 directed-loop 方程，复杂性显著增加。

| $v$ | 算符类型 | 效果 |
|---|--------------|--------|
| 1--4 | 对角 ($\hat{S}_z \hat{S}_z$, $\hat{S}_z$, 常数) | 不翻转世界线 |
| 5 | $\hat{S}_{-}(\tau) \hat{S}_{+}(\tau')$ | 成对 spin flip：$\tau$ 处翻下，$\tau'$ 处翻上 |
| 6 | $\hat{S}_{+}(\tau) \hat{S}_{-}(\tau')$ | 成对 spin flip：$\tau$ 处翻上，$\tau'$ 处翻下 |

对角顶点（类型 1--4）在传播时不改变世界线的自旋态。非对角顶点（类型 5, 6）通过一对时间和方向相反的 spin flip 改变世界线——这正是 wormhole 更新中 loop 传播的物理来源。

---

## 7. 对角更新

对角更新的作用是通过 Metropolis-Hastings 算法添加或删除一个对角顶点 $\hat{h}_{2}(\tau, \tau')$，从而改变展开阶数 $n$。

### 7.1 Metropolis-Hastings 接受率

从配置 $\mathcal{C}$ 到 $\mathcal{C}'$ 的接受概率：

$$
\boxed{
\begin{aligned}
A(\mathcal{C} \to \mathcal{C}') &= \min\bigl[1, \, R(\mathcal{C} \to \mathcal{C}')\bigr],
\end{aligned}
}
$$

接受比为

$$
\boxed{
\begin{aligned}
R(\mathcal{C} \to \mathcal{C}') &= \frac{W(\mathcal{C}') \, T_{0}(\mathcal{C}' \to \mathcal{C})}
                                  {W(\mathcal{C}) \, T_{0}(\mathcal{C} \to \mathcal{C}')}.
\end{aligned}
}
$$

### 7.2 添加顶点的提议概率

提议添加一个新顶点的概率密度：

$$
\begin{aligned}
T_{0}(\mathcal{C}_{n} \to \mathcal{C}_{n+1}) &=
   \frac{\mathcal{I}(\omega) \, P(\omega, \tau - \tau') \, p_{t_{\mathrm{int}}} \, d\omega \, d\tau \, d\tau'}
        {\beta (n + 1)}.
\end{aligned}
$$

分子中的 $\mathcal{I}(\omega) P(\omega, \tau - \tau') d\omega d\tau d\tau'$ 是按谱和传播子自身分布采样的概率密度。分母中 $n+1$ 来自新顶点插入有序列表的 $n+1$ 个可能位置。

### 7.3 删除顶点的提议概率

从 $n_2 + 1$ 个对角顶点中均匀随机选择一个删除（$n_2$ 是当前配置中对角顶点的数量）：

$$
\begin{aligned}
T_{0}(\mathcal{C}_{n+1} \to \mathcal{C}_{n}) &= \frac{1}{n_{2} + 1}.
\end{aligned}
$$

### 7.4 最终接受比

权重之比：

$$
\begin{aligned}
\frac{W_{\alpha}(\mathcal{C}_{n+1})}{W_{\alpha}(\mathcal{C}_{n})}
&= \frac{\mathcal{I}(\omega) \, P(\omega, \tau - \tau') \, W_{v} \, d\omega \, d\tau \, d\tau'}{n + 1}.
\end{aligned}
$$

代入接受比公式，分子 $\mathcal{I}(\omega) P(\omega, \tau - \tau') d\omega d\tau d\tau'$ 与提议概率中的对应项抵消：

$$
\boxed{
\begin{aligned}
R_{\mathrm{add}} &= \frac{\beta \, W_{v}}{(n_{2} + 1) \, p_{t_{\mathrm{int}}}}, \\[6pt]
R_{\mathrm{remove}} &= \frac{n_{2} \, p_{t_{\mathrm{int}}}}{\beta \, W_{v}}.
\end{aligned}
}
$$

这里 $p_{t_{\mathrm{int}}}$ 是选择相互作用类型的概率（若只有一种相互作用，$p_{t_{\mathrm{int}}} = 1$）。

### 7.5 采样 $\omega$ 和 $\Delta\tau$

利用逆变换采样法从 $\mathcal{I}(\omega)$ 和 $P(\omega, \Delta\tau)$ 抽取连续变量。

对幂律谱 $J(\omega) = 2\pi \alpha \omega_{c}^{1-s} \omega^{s}$（$0 < \omega < \omega_{c}$），归一化谱分布为 $\mathcal{I}(\omega) = s \omega_{c}^{-s} \omega^{s-1}$。

累计分布：

$$
\begin{aligned}
F(\omega) = \int_{0}^{\omega} d\omega' \, s \omega_{c}^{-s} (\omega')^{s-1}
          = \left(\frac{\omega}{\omega_{c}}\right)^{s}.
\end{aligned}
$$

令 $F(\omega) = \xi$，$\xi \in [0, 1)$ 为均匀随机数：

$$
\boxed{
\omega = \omega_{c} \, \xi^{1/s}.
}
$$

对传播子 $P(\omega, \Delta\tau) = \omega e^{-\omega \Delta\tau} / (1 - e^{-\beta \omega})$（$0 \le \Delta\tau < \beta$）：

累计分布：

$$
\begin{aligned}
F(\Delta\tau) &= \int_{0}^{\Delta\tau} dx \, \frac{\omega e^{-\omega x}}{1 - e^{-\beta \omega}}
              = \frac{1 - e^{-\omega \Delta\tau}}{1 - e^{-\beta \omega}}.
\end{aligned}
$$

令 $F(\Delta\tau) = \xi$：

$$
\begin{aligned}
\frac{1 - e^{-\omega \Delta\tau}}{1 - e^{-\beta \omega}} &= \xi, \\[4pt]
e^{-\omega \Delta\tau} &= 1 - \xi (1 - e^{-\beta \omega}),
\end{aligned}
$$

$$
\boxed{
\Delta\tau = -\frac{1}{\omega} \ln\!\bigl[ 1 - \xi (1 - e^{-\beta \omega}) \bigr].
}
$$

若使用对称化传播子 $D_{+}$，先按上式抽取 $\Delta\tau$，再以概率 $1/2$ 替换为 $\beta - \Delta\tau$。

---

## 8. Directed-Loop / Wormhole 更新

### 8.0 先不写公式：有向环到底在干什么

在世界线 QMC 中，一个构型是自旋沿虚时间方向的历史。以 $S_z$ 基底为例，在每个虚时刻 $\tau$，自旋态为

$$
|\alpha(\tau)\rangle \in \{|\uparrow\rangle, |\downarrow\rangle\}.
$$

如果某个虚时间区间没有自旋翻转算符，世界线保持原方向；遇到 $\hat{S}_+$ 或 $\hat{S}_-$，世界线就在该点翻转。因此，世界线是由"段"（固定 $S_z$ 的区间）和"翻转点"（算符位置）交替组成的一维图。

**为什么需要全局更新。** 普通局域更新一次只增删一个顶点，改动太小。在低温或临界区，世界线的长程结构强关联——局部微扰很难遍历构型空间，导致极长的自相关时间。

**有向环的基本图像。** Directed-loop 不逐个改顶点，而是构造一条**闭合路径**（loop），沿路径翻转全部世界线段：

1. **插入 head / tail**：在随机虚时间 $\tau_0$ 插入一对自旋翻转算符——一个叫 tail（固定），一个叫 head（可移动）。head 是世界线中的一个临时不连续点。

2. **head 沿世界线传播**：head 沿虚时间方向前进，直到遇到一个相互作用顶点。

3. **选择出口腿**：每个顶点有四条腿——两个虚时间点 $\tau$ 和 $\tau'$，每个时间点有算符作用前、后的自旋态（图 1）。head 进入某条腿后，根据局部概率选择一条出口腿离开。可能的出口包括：
   - **直行**：从同一时间点的另一条腿出去（不改变顶点类型，只改变自旋段归属）
   - **转弯**：从不同时间点的腿出去，同时改变顶点内部连接
   - **反弹（bounce）**：原路返回——head 回到刚来的方向，更新几乎没有改变构型，效率低
   - **虫洞跳跃（wormhole）**：从 $\tau$ 处的腿直接跳到 $\tau'$ 处的腿——这正是推迟相互作用的非局域出口

4. **闭合 loop**：head 继续传播，重复步骤 2--3，直到回到最初的 tail 位置。此时 loop 闭合，构成一条合法路径。

5. **翻转世界线段**：loop 闭合后，把它经过的所有世界线段整体翻转（$\uparrow \leftrightarrow \downarrow$）。旧构型变成新构型，且新构型自动满足自旋翻转算符的匹配条件——因为 head 走过的路径本身就定义了哪些段需要翻转。

**一次 loop 更新同时改变大量世界线段，从而突破局域更新的瓶颈。**

**bounce 为什么是效率杀手。** 如果 head 进入顶点后直接原路返回，loop 闭合得很快但几乎没有改变构型——等价于什么都没做。bounce 概率越高，loop 的有效长度越短，更新效率越低。因此 directed-loop 方程的核心目标之一是最小化 bounce 权重。

**顶点的四条腿——编号约定。** 一个推迟顶点（retarded vertex）包含两个虚时间子顶点，由 bath 传播子（虚线）连接：

```
      τ 子顶点                    τ' 子顶点
  before ──●── after        before ──●── after
            |                         |
            +======== bath line ======+
```

四条腿按以下约定编号：

```
    l=1   l=2                l=3   l=4
     ○────○      ~~~~~      ○────○
      τ 子顶点                τ' 子顶点
```

- $l = 1$：$\tau$ 处算符作用前的自旋态（入口/出口）
- $l = 2$：$\tau$ 处算符作用后的自旋态
- $l = 3$：$\tau'$ 处算符作用前的自旋态
- $l = 4$：$\tau'$ 处算符作用后的自旋态

$W_{v}(l_1, l_2)$ 的含义是：head 从腿 $l_1$ 进入顶点，从腿 $l_2$ 离开。若 $l_1$ 和 $l_2$ 在不同的子顶点上（例如 $l_1 = 1$，$l_2 = 4$），head 沿 bath 传播子跳跃——这就是 **wormhole move**。

### 8.1 局部细致平衡：为什么全局退化为局部

Directed-loop 更新通过扩展配置空间来连接两个需要大量局部更改的正则 MC 配置。在扩展配置空间中，每个顶点被赋予一个入口腿 $l_1$ 和出口腿 $l_2$，相应权重记为 $W_{v}(l_1, l_2)$。

一条完整 loop 的概率是它经过的每个顶点局部转移概率的乘积，而配置权重也是每个顶点权重的乘积。因此全局细致平衡可以退化为每个顶点的局部条件。具体论证：

设一条 loop 经过顶点 $\{v_p\}$，正向过程的总权重为

$$
\begin{aligned}
W(\mathcal{C}) P(\mathcal{C} \to \mathcal{C}')
&= \prod_{p \in \mathrm{loop}} W_{v_p}(l_p^{\mathrm{in}}, l_p^{\mathrm{out}}).
\end{aligned}
$$

（这里省略了正反过程相同的起点选择概率、方向选择概率、以及 $\mathcal{I}(\omega)P(\omega,\tau-\tau')$ 等公共因子——这些在正反权重比 $\frac{W(\mathcal{C})P(\mathcal{C}\to\mathcal{C}')}{W(\mathcal{C}')P(\mathcal{C}'\to\mathcal{C})}$ 中抵消。）

反向过程（loop 沿相反方向走，顶点翻转为 $\bar{v}_p$）的总权重为

$$
\begin{aligned}
W(\mathcal{C}') P(\mathcal{C}' \to \mathcal{C})
&= \prod_{p \in \mathrm{loop}} W_{\bar{v}_p}(l_p^{\mathrm{out}}, l_p^{\mathrm{in}}).
\end{aligned}
$$

因此，如果每个顶点都满足

$$
\boxed{
\begin{aligned}
W_{v}(l_1, l_2) &= W_{\bar{v}}(l_2, l_1),
\end{aligned}
}
$$

那么整条 loop 的正反权重自动相等——全局细致平衡退化为局部方程。其中 $\bar{v}$ 是沿 loop 段翻转自旋后得到的顶点类型（例如 $v = 1$（$\uparrow\uparrow\uparrow\uparrow$）的翻转版本可能是 $v = 5$（spin-flip 顶点））。

### 8.2 概率守恒

从入口腿 $l_1$ 进入后，所有可能出口的总权重等于原始顶点权重：

$$
\boxed{
\begin{aligned}
\sum_{l_2} W_{v}(l_1, l_2) &= W_{v}.
\end{aligned}
}
$$

实际退出概率为

$$
\boxed{
\begin{aligned}
P(l_1 \to l_2) &= \frac{W_{v}(l_1, l_2)}{W_{v}}.
\end{aligned}
}
$$

### 8.3 求解线性系统

以图 3(b) 的分配表为例，定义 bounce 权重 $b_1, b_2, b_3$ 和转移权重 $a, b, c$。概率守恒给出三个方程：

$$
\boxed{
\begin{aligned}
b_{1} + a + b &= W_{1}, \\
a + b_{2} + c &= W_{2}, \\
b + c + b_{3} &= W_{5}.
\end{aligned}
}
$$

这是一个关于 $a, b, c$ 的线性方程组。将 $b_{1}, b_{2}, b_{3}$ 视为自由参数，求解得

$$
\boxed{
\begin{aligned}
a &= \frac{1}{2} \bigl[ W_{1} + W_{2} - W_{5} - b_{1} - b_{2} + b_{3} \bigr], \\[4pt]
b &= \frac{1}{2} \bigl[ W_{1} - W_{2} + W_{5} - b_{1} + b_{2} - b_{3} \bigr], \\[4pt]
c &= \frac{1}{2} \bigl[ -W_{1} + W_{2} + W_{5} + b_{1} - b_{2} - b_{3} \bigr].
\end{aligned}
}
$$

目标是最小化 bounce 权重（bounce 降低算法效率）。通过调节常数位移 $C$ 和 bounce 权重，可保证 $a, b, c \ge 0$。

在无外磁场 $h_z = 0$ 且 $\lambda_z \le \lambda_{xy}$ 时，取 $b_1 = b_2 = b_3 = 0$ 可得 bounce-free 解。SU(2) 对称情形 $\lambda_z = \lambda_{xy}$ 下，取 $C = \lambda_z / 4$ 即可确定性构造 loop（入口腿唯一决定出口腿）。

### 8.4 虫洞拓扑等价

推迟相互作用顶点（图 3(a)）有四条腿：两条在虚时间 $\tau$，两条在 $\tau'$。若将 $\tau'$ 处的子顶点放在 $\tau$ 处子顶点的右侧，从拓扑上看

$$
\begin{aligned}
(\tau, \tau') \quad \longleftrightarrow \quad (i, j),
\end{aligned}
$$

即推迟顶点的四腿结构与格点模型中最邻近交换顶点的结构完全等价。

两者在 directed-loop 方程中的数学形式相同，差别仅在于

- 格点模型：loop 沿空间键 $(i, j)$ 移动；
- 推迟自旋-玻色模型：loop 沿虚时间虫洞 $(\tau, \tau')$ 跳跃 —— 当 loop head 进入 $\tau$ 处的顶点腿时，通过传播子直接跳到 $\tau'$ 处继续。

因为 $\mathcal{I}(\omega)$ 和 $P(\omega, \tau - \tau')$ 对每个顶点是全局因子，在 directed-loop 方程中抵消，因此 wormhole update 的数学结构完全退化为标准 directed-loop 更新。

---

## 9. 可观测量

与标准世界线 QMC 方法一致。

### 9.1 自旋关联函数

$$
\boxed{
\begin{aligned}
C_{\ell}(\tau - \tau') &= \langle \hat{S}_{\ell}(\tau) \hat{S}_{\ell}(\tau') \rangle.
\end{aligned}
}
$$

### 9.2 磁化率

$$
\boxed{
\begin{aligned}
\chi_{\ell}(\mathrm{i}\Omega_{m}) &=
   \frac{1}{\beta} \iint_{0}^{\beta} d\tau d\tau' \, e^{\mathrm{i}\Omega_{m}(\tau - \tau')} C_{\ell}(\tau - \tau'),
\end{aligned}
}
$$

其中 $\Omega_{m} = 2\pi m / \beta$（$m \in \mathbb{Z}$）为玻色 Matsubara 频率。静态磁化率 $\chi_{\ell} = \chi_{\ell}(\mathrm{i}\Omega_{0})$。

$z$ 分量（对角可观测量）直接从传播态 $|\alpha_{p}\rangle$ 读出；$x, y$ 分量（非对角可观测量）通过追踪 directed-loop 更新中 loop head/tail 的传播来测量。

### 9.3 平均展开阶数

平均展开阶数与自旋子系统能量相关：

$$
\langle n \rangle = -\beta \langle \hat{H}_{\mathrm{s}} + \hat{H}_{\mathrm{sb}} \rangle.
$$

玻色可观测量（bath 能量、传播子、比热）可从高阶自旋-自旋关联函数通过生成泛函恢复。

---

## 10. 适用性条件与无符号问题的边界

该算法的适用范围由以下条件限定：

1. **玻色浴是二次型**：$\hat{H}_{\mathrm{b}} = \sum_{\mu} \omega_{\mu} \hat{a}_{\mu}^{\dagger} \hat{a}_{\mu}$（或可对角化为此形式）。若非二次型，Wick 定理不适用，无法解析积掉玻色子。

2. **自旋-玻色耦合对 $\hat{a}, \hat{a}^{\dagger}$ 线性**：$\hat{H}_{\mathrm{sb}} = \sum_{\mu} (\hat{a}_{\mu}^{\dagger} \hat{\varrho}_{\mu} + \hat{\varrho}_{\mu}^{\dagger} \hat{a}_{\mu})$。非线性耦合需要更复杂的处理（无法解析积掉 bath）。

3. **顶点权重非负**：通过调节常数位移 $C$ 或选择适当自旋基底，确保 $W_{v} \ge 0$。若某模型在所有 $C$ 和所有自旋基底下均出现负 $W_{v}$，则 sign problem 不可消除。

4. **传播子正定性与符号问题的关系**：玻色传播子 $D(\omega, \tau)$ 对所有 $(\omega, \tau)$ 为正，这意味着玻色收缩本身不引入负权重。然而，**正定传播子是 QMC 无符号问题的必要条件，而非充分条件**。完整的无符号条件还要求所有顶点权重 $W_v \ge 0$（通过选择适当的自旋基底和常数位移 $C$ 满足），且不存在复相位。若 bath 存在 hopping 导致空间非局域传播子矩阵元为负，则需直接采样玻色子而非使用推迟表述。

---

## 11. 与 Rabi 鞍点方法的比较

wormhole QMC 和 Rabi 模型的鞍点方法（如变分法、平均场理论）处理的是同一类问题，但原理截然不同：

| 方面 | wormhole QMC | 鞍点方法 |
|------|-------------|---------|
| 处理 bath | 精确解析积分（Wick + 重指数化） | 变分/鞍点近似 |
| 适用范围 | 非微扰（前提：模型无符号且采样可达） | 弱耦合或经典极限可靠 |
| 量子涨落 | 全保留（所有阶） | 部分保留（高斯涨落） |
| 符号问题 | 需验证 $W_v \ge 0$ | 无（确定论方法） |
| 计算代价 | $\langle n \rangle \propto \beta$ MC 采样 | 求解鞍点方程（轻量） |
| 临界指数 | 可精确提取 | 受近似阶数限制 |

wormhole QMC 的关键优势在于对 sub-ohmic bath（$s < 1$）的量子相变进行非微扰计算。例如，在 U(1) 对称双浴模型（$s = 0.8$）中，wormhole QMC 给出量子临界耦合 $\alpha_c = 0.76213(6)$，这是目前精度最高的数值结果之一。鞍点方法在同区域通常不可靠，因为 sub-ohmic bath 的低频模式密度发散，量子涨落强且非高斯。

> **来源**：Weber (2022), Phys. Rev. B 105, 165129 — Quantum Monte Carlo simulation of spin-boson models using wormhole updates
> **调研时间**：2026-07-09

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

## 1. 通用自旋-玻色子哈密顿量

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

玻色浴是自由简谐振子之和：

$$
\begin{aligned}
\hat{H}_{\mathrm{b}} &= \sum_{\mu} \omega_{\mu} \hat{a}_{\mu}^{\dagger} \hat{a}_{\mu},
\end{aligned}
$$

其中 $\hat{a}_{\mu}^{\dagger}$（$\hat{a}_{\mu}$）产生（湮灭）一个频率为 $\omega_{\mu}$ 的玻色子，指标 $\mu$ 可表连续谱的不同分量，也可标记有限系统的格点。

自旋-玻色耦合取最一般形式：

$$
\begin{aligned}
\hat{H}_{\mathrm{sb}} &= \sum_{\mu} \bigl( \hat{a}_{\mu}^{\dagger} \hat{\varrho}_{\mu} + \hat{\varrho}_{\mu}^{\dagger} \hat{a}_{\mu} \bigr),
\end{aligned}
$$

其中 $\hat{\varrho}_{\mu} = \hat{\varrho}_{\mu}[\hat{S}_{\alpha}]$ 是仅作用在自旋 Hilbert 空间上的算符，且包含耦合常数。以下为方便起见引入上标 $c$ 和其反指标 $\bar{c}$ 来区分正规和伴随算符：

$$
\begin{aligned}
\hat{V} \equiv \hat{H}_{\mathrm{sb}} = \sum_{\mu c} \hat{a}_{\mu}^{c} \hat{\varrho}_{\mu}^{\bar{c}},
\end{aligned}
$$

其中 $\hat{a}_{\mu}^{c}$ 在 $c = \dagger$ 时为 $\hat{a}_{\mu}^{\dagger}$，$c = \varnothing$ 时为 $\hat{a}_{\mu}$；相应地 $\hat{\varrho}_{\mu}^{\bar{c}}$ 取相反的指标。

---

## 2. 相互作用绘景中的配分函数展开

将哈密顿量拆分为

$$
\begin{aligned}
\hat{H}_0 &\equiv \hat{H}_{\mathrm{b}}, \\
\hat{V} &\equiv \hat{H}_{\mathrm{sb}}.
\end{aligned}
$$

为简化记号，暂设 $\hat{H}_{\mathrm{s}} = 0$（之后可将 $\hat{H}_{\mathrm{s}}$ 纳入 $\hat{V}$，不失一般性）。

配分函数 $Z = \mathrm{Tr}\, e^{-\beta \hat{H}}$ 在相互作用绘景中的 Dyson 展开为

$$
\begin{aligned}
Z &= \sum_{m=0}^{\infty} (-1)^{m} \int_{0}^{\beta} d\tau_{1} \int_{0}^{\tau_{1}} d\tau_{2} \cdots \int_{0}^{\tau_{m-1}} d\tau_{m} \\
  &\quad \times \mathrm{Tr}\bigl[ e^{-\beta \hat{H}_{0}} \hat{V}(\tau_{1}) \hat{V}(\tau_{2}) \cdots \hat{V}(\tau_{m}) \bigr],
\end{aligned}
$$

其中 $\hat{V}(\tau) = e^{\tau \hat{H}_0} \hat{V} e^{-\tau \hat{H}_0}$，且 $\beta \ge \tau_1 \ge \tau_2 \ge \cdots \ge \tau_m \ge 0$。

引入虚时间编序算符 $\hat{\mathcal{T}}_{\tau}$，将上式改写为对称形式：

$$
\begin{aligned}
Z &= \sum_{m=0}^{\infty} \frac{(-1)^{m}}{m!} \int_{0}^{\beta} d\tau_{1} \int_{0}^{\beta} d\tau_{2} \cdots \int_{0}^{\beta} d\tau_{m} \\
  &\quad \times \mathrm{Tr}\bigl[ e^{-\beta \hat{H}_{0}} \hat{\mathcal{T}}_{\tau} \hat{V}(\tau_{1}) \hat{V}(\tau_{2}) \cdots \hat{V}(\tau_{m}) \bigr].
\end{aligned}
$$

将 $\hat{V} = \sum_{\mu c} \hat{a}_{\mu}^{c} \hat{\varrho}_{\mu}^{\bar{c}}$ 代入：

$$
\begin{aligned}
Z &= \sum_{m=0}^{\infty} \frac{(-1)^{m}}{m!} \int_{0}^{\beta} d\tau_{1} \cdots \int_{0}^{\beta} d\tau_{m}
      \sum_{\mu_{1} \cdots \mu_{m}} \sum_{c_{1} \cdots c_{m}} \\
  &\quad \times \mathrm{Tr}_{\mathrm{b}}\bigl[ e^{-\beta \hat{H}_{\mathrm{b}}} \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu_{1}}^{c_{1}}(\tau_{1}) \cdots \hat{a}_{\mu_{m}}^{c_{m}}(\tau_{m}) \bigr] \\
  &\quad \times \mathrm{Tr}_{\mathrm{s}}\bigl[ \hat{\mathcal{T}}_{\tau} \hat{\varrho}_{\mu_{1}}^{\bar{c}_{1}}(\tau_{1}) \cdots \hat{\varrho}_{\mu_{m}}^{\bar{c}_{m}}(\tau_{m}) \bigr].
\end{aligned}
$$

迹分解为玻色部分和自旋部分的乘积，因为 $\hat{a}_{\mu}^{c}$ 仅作用于玻色空间，$\hat{\varrho}_{\mu}^{\bar{c}}$ 仅作用于自旋空间。

---

## 3. 玻色迹与 Wick 定理

由于玻色粒子数守恒，热平均

$$
\langle \bullet \rangle_{\mathrm{b}} = Z_{\mathrm{b}}^{-1} \mathrm{Tr}_{\mathrm{b}}[e^{-\beta \hat{H}_{\mathrm{b}}} \bullet]
$$

仅在产生和湮灭算符数目相等时非零，即要求 $m = 2n$，其中产生算符和湮灭算符各 $n$ 个。

考虑一种特定的排序（先将所有湮灭算符排在左边，所有产生算符排在右边），应用 Wick 定理：

$$
\begin{aligned}
&\langle \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu_{1}}(\tau_{1}) \cdots \hat{a}_{\mu_{n}}(\tau_{n})
   \hat{a}_{\mu_{n+1}}^{\dagger}(\tau_{n+1}) \cdots \hat{a}_{\mu_{2n}}^{\dagger}(\tau_{2n}) \rangle_{\mathrm{b}} \\
&\qquad = \sum_{\pi \in S_{n}} \prod_{k=1}^{n}
   D(\omega_{\mu_{k}}, \tau_{k} - \tau_{n+\pi[k]}) \,
   \delta_{\mu_{k}, \mu_{n+\pi[k]}},
\end{aligned}
$$

其中 $S_{n}$ 是 $n$ 阶对称群，$\pi \in S_{n}$ 是 $n$ 个对象的排列。

自由玻色传播子定义为

$$
D(\omega_{\mu}, \tau - \tau') = \langle \hat{\mathcal{T}}_{\tau} \hat{a}_{\mu}(\tau) \hat{a}_{\mu}^{\dagger}(\tau') \rangle_{\mathrm{b}}.
$$

直接计算得

$$
\boxed{
\begin{aligned}
D(\omega, \tau) &= \frac{e^{-\omega \tau}}{1 - e^{-\beta \omega}}, \qquad 0 \le \tau < \beta, \\
D(\omega, \tau + \beta) &= D(\omega, \tau).
\end{aligned}
}
$$

---

## 4. 组合因子的计算

从 $2n$ 个相互作用顶点中选择 $n$ 个作为产生算符（另 $n$ 个为湮灭算符），共有 $\binom{2n}{n}$ 种等价的排序方式。

将 Wick 定理的结果代入 $Z$ 的展开式。定义 $\tau_{k}' = \tau_{n+k}$，得

$$
\begin{aligned}
\frac{Z}{Z_{\mathrm{b}}} &= \sum_{n=0}^{\infty} \frac{1}{n!^{2}}
   \iint_{0}^{\beta} d\tau_{1} d\tau_{1}' \sum_{\mu_{1}}
   \cdots \iint_{0}^{\beta} d\tau_{n} d\tau_{n}' \sum_{\mu_{n}} \\
  &\quad \times \sum_{\pi \in S_{n}} D(\omega_{\mu_{1}}, \tau_{1} - \tau_{\pi[1]}') \cdots D(\omega_{\mu_{n}}, \tau_{n} - \tau_{\pi[n]}') \\
  &\quad \times \mathrm{Tr}_{\mathrm{s}}\bigl[ \hat{\mathcal{T}}_{\tau} \hat{\varrho}_{\mu_{1}}^{\dagger}(\tau_{1}) \hat{\varrho}_{\mu_{1}}(\tau_{\pi[1]}')
     \cdots \hat{\varrho}_{\mu_{n}}^{\dagger}(\tau_{n}) \hat{\varrho}_{\mu_{n}}(\tau_{\pi[n]}') \bigr].
\end{aligned}
$$

组合因子的逐步推导。原始展开系数的倒数因子：

$$
\begin{aligned}
\frac{1}{(2n)!}.
\end{aligned}
$$

选择 $n$ 个位置放产生算符（另 $n$ 个放湮灭算符）的组合数：

$$
\begin{aligned}
\frac{1}{(2n)!} \cdot \binom{2n}{n}
&= \frac{1}{(2n)!} \cdot \frac{(2n)!}{n! \, n!}
 = \frac{1}{n! \, n!}.
\end{aligned}
$$

每个 Wick 收缩对应一种配对方式，对 $n$ 个产生算符和 $n$ 个湮灭算符的配对进行排列求和，贡献一个因子 $n!$：

$$
\begin{aligned}
\frac{1}{n! \, n!} \cdot n! = \frac{1}{n!}.
\end{aligned}
$$

通过对积分变量重标号，排列求和 $\sum_{\pi \in S_n}$ 中每一项等价，再贡献一个因子 $n!$ —— 但这恰好被展开中一个 $1/n!$ 抵消。最终得到

$$
\begin{aligned}
\boxed{
\frac{Z}{Z_{\mathrm{b}}} = \sum_{n=0}^{\infty} \frac{1}{n!}
   \mathrm{Tr}_{\mathrm{s}}\Biggl\{
   \hat{\mathcal{T}}_{\tau} \biggl[
   \iint_{0}^{\beta} d\tau d\tau' \sum_{\mu}
   \hat{\varrho}_{\mu}^{\dagger}(\tau) D(\omega_{\mu}, \tau - \tau') \hat{\varrho}_{\mu}(\tau')
   \biggr]^{n}
   \Biggr\}.
}
\end{aligned}
$$

---

## 5. 重指数化：推迟自旋相互作用

上式是指数函数的 Taylor 展开：

$$
e^{A} = \sum_{n=0}^{\infty} \frac{A^{n}}{n!}.
$$

因此

$$
\boxed{
\begin{aligned}
Z &= Z_{\mathrm{b}} \, \mathrm{Tr}_{\mathrm{s}} \, \hat{\mathcal{T}}_{\tau} \, e^{-\hat{\mathcal{H}}_{\mathrm{ret}}},
\end{aligned}
}
$$

其中推迟自旋相互作用定义为

$$
\boxed{
\begin{aligned}
\hat{\mathcal{H}}_{\mathrm{ret}} &= -\iint_{0}^{\beta} d\tau d\tau' \sum_{\mu}
   \hat{\varrho}_{\mu}^{\dagger}(\tau) D(\omega_{\mu}, \tau - \tau') \hat{\varrho}_{\mu}(\tau').
\end{aligned}
}
$$

注意负号：展开中实际出现的是 $+\int \hat{\varrho}^{\dagger} D \hat{\varrho}$，因此 $-\hat{\mathcal{H}}_{\mathrm{ret}} = +\int \hat{\varrho}^{\dagger} D \hat{\varrho}$。

对于坐标型耦合（如 $\hat{\varrho}_{\mu} = \hat{\varrho}_{\mu}^{\dagger}$），$D(\omega, \tau - \tau')$ 自然对称化。定义

$$
D_{+}(\omega, \tau) = \frac{1}{2}\bigl[ D(\omega, \tau) + D(\omega, \beta - \tau) \bigr].
$$

---

## 6. SSE 展开：推迟相互作用的幂级数

将 $e^{-\hat{\mathcal{H}}_{\mathrm{ret}}}$ 展开为幂级数（相互作用展开，围绕 $\hat{H}_0 = 0$）：

$$
\begin{aligned}
e^{-\hat{\mathcal{H}}_{\mathrm{ret}}} &= \sum_{n=0}^{\infty} \frac{(-1)^{n}}{n!} \bigl( \hat{\mathcal{H}}_{\mathrm{ret}} \bigr)^{n} \\
&= \sum_{n=0}^{\infty} \frac{1}{n!} \Biggl[
   \iint_{0}^{\beta} d\tau d\tau' \sum_{\mu}
   \hat{\varrho}_{\mu}^{\dagger}(\tau) D(\omega_{\mu}, \tau - \tau') \hat{\varrho}_{\mu}(\tau')
   \Biggr]^{n}.
\end{aligned}
$$

将单个体积元上的权重分解。定义归一化的谱分布和传播子：

$$
\begin{aligned}
P(\omega, \tau) &= \omega D(\omega, \tau), \\[4pt]
\mathcal{I}(\omega) &= \frac{J(\omega) / \omega}{\int d\omega \, J(\omega) / \omega},
\end{aligned}
$$

使得 $P(\omega, \tau)$ 在 $\tau$ 上归一化为概率分布，$\mathcal{I}(\omega)$ 在 $\omega$ 上归一化为概率分布。在连续极限 $\sum_{\mu} \to \int d\omega \, J(\omega)/\pi$ 下，推迟相互作用重写为

$$
\boxed{
\begin{aligned}
\hat{\mathcal{H}}_{\mathrm{ret}} &= -\int_{0}^{\infty} d\omega \, \mathcal{I}(\omega)
   \iint_{0}^{\beta} d\tau d\tau' \sum_{a}
   P(\omega, \tau - \tau') \hat{h}_{a}(\tau, \tau'),
\end{aligned}
}
$$

其中 $\hat{h}_{a}(\tau, \tau')$ 是自旋算符的对角或非对角部分。

---

## 7. 顶点权重

一个 Monte Carlo 配置定义为

$$
\mathcal{C} = \{n, \mathcal{C}_{n}, |\alpha\rangle\},
$$

其中 $n$ 是展开阶数，$\mathcal{C}_{n} = \{\nu_1, \ldots, \nu_n\}$ 是有序顶点列表，$|\alpha\rangle$ 是 $S_z$ 基底中的初态。每个顶点变量为

$$
\nu = \{t_{\mathrm{int}}, a, \omega, \tau, \tau'\}.
$$

配置的总权重为

$$
\boxed{
\begin{aligned}
W(\mathcal{C}) &= \frac{1}{n!} \prod_{p=1}^{n} \mathcal{W}_{\nu_{p}},
\end{aligned}
}
$$

单个顶点的权重为

$$
\boxed{
\begin{aligned}
\mathcal{W}_{\nu} &= \mathcal{I}(\omega) \, P(\omega, \tau - \tau') \, W_{v} \, d\omega \, d\tau \, d\tau',
\end{aligned}
}
$$

其中 $W_{v}$ 是离散顶点类型的权重。因为 $\mathcal{I}(\omega)$ 和 $P(\omega, \tau - \tau')$ 是全局前置因子（与顶点类型 $v$ 无关），它们在 directed-loop 方程中抵消。

对 $S_z$ 基底下自旋-$1/2$ 的推迟相互作用，共有六种顶点类型（图 1）：四种对角顶点（不改变世界线配置）和两种非对角顶点（翻转自旋）。非对角部分对应 $\hat{S}_{-}(\tau) \hat{S}_{+}(\tau')$ 和 $\hat{S}_{+}(\tau) \hat{S}_{-}(\tau')$。

---

## 8. 对角更新 (Diagonal Update)

对角更新的作用是通过 Metropolis-Hastings 算法添加或删除一个对角顶点 $\hat{h}_{2}(\tau, \tau')$，从而改变展开阶数 $n$。

### 8.1 Metropolis-Hastings 接受率

从配置 $\mathcal{C}$ 到 $\mathcal{C}'$ 的 Metropolis 接受概率为

$$
\boxed{
\begin{aligned}
A(\mathcal{C} \to \mathcal{C}') &= \min\bigl[1, \, R(\mathcal{C} \to \mathcal{C}')\bigr],
\end{aligned}
}
$$

其中接受比为

$$
\boxed{
\begin{aligned}
R(\mathcal{C} \to \mathcal{C}') &= \frac{W(\mathcal{C}') \, T_{0}(\mathcal{C}' \to \mathcal{C})}
                                  {W(\mathcal{C}) \, T_{0}(\mathcal{C} \to \mathcal{C}')}.
\end{aligned}
}
$$

### 8.2 添加顶点的提议概率

提议添加一个新顶点的概率密度为

$$
\begin{aligned}
T_{0}(\mathcal{C}_{n} \to \mathcal{C}_{n+1}) &=
   \frac{\mathcal{I}(\omega) \, P(\omega, \tau - \tau') \, p_{t_{\mathrm{int}}} \, d\omega \, d\tau \, d\tau'}
        {\beta (n + 1)}.
\end{aligned}
$$

分子中的 $\mathcal{I}(\omega) P(\omega, \tau - \tau') d\omega d\tau d\tau'$ 是按谱和传播子自身分布采样的概率密度。分母中 $n+1$ 是因为新顶点有 $n+1$ 种插入到有序列表中的位置。

### 8.3 删除顶点的提议概率

从 $n_2 + 1$ 个对角顶点中随机选择一个删除（$n_2$ 是当前配置中对角顶点的数量）：

$$
\begin{aligned}
T_{0}(\mathcal{C}_{n+1} \to \mathcal{C}_{n}) &= \frac{1}{n_{2} + 1}.
\end{aligned}
$$

### 8.4 最终接受比

权重之比为

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

### 8.5 采样 $\omega$ 和 $\tau - \tau'$

利用逆变换采样法从 $\mathcal{I}(\omega)$ 和 $P(\omega, \tau - \tau')$ 抽取连续变量。

对幂律谱：

$$
J(\omega) = 2\pi \alpha \omega_{c}^{1-s} \omega^{s}, \qquad 0 < \omega < \omega_{c}.
$$

归一化谱分布为

$$
\mathcal{I}(\omega) = s \omega_{c}^{-s} \omega^{s-1}.
$$

累计分布：

$$
F(\omega) = \int_{0}^{\omega} d\omega' \, s \omega_{c}^{-s} (\omega')^{s-1}
          = \left(\frac{\omega}{\omega_{c}}\right)^{s}.
$$

令 $F(\omega) = \xi$，$\xi \in [0, 1)$ 为均匀随机数：

$$
\boxed{
\begin{aligned}
\omega &= \omega_{c} \, \xi^{1/s}.
\end{aligned}
}
$$

等效地可写为 $\omega = \omega_{c} (1 - \xi)^{1/s}$（因为 $1 - \xi$ 依然在 $[0, 1)$ 上均匀分布）。

对传播子 $P(\omega, \Delta\tau) = \omega D(\omega, \Delta\tau)$：

$$
P(\omega, \Delta\tau) = \frac{\omega e^{-\omega \Delta\tau}}{1 - e^{-\beta \omega}}, \qquad 0 \le \Delta\tau < \beta.
$$

累计分布：

$$
\begin{aligned}
F(\Delta\tau) &= \int_{0}^{\Delta\tau} dx \, \frac{\omega e^{-\omega x}}{1 - e^{-\beta \omega}} \\[4pt]
              &= \frac{1 - e^{-\omega \Delta\tau}}{1 - e^{-\beta \omega}}.
\end{aligned}
$$

令 $F(\Delta\tau) = \xi$：

$$
\begin{aligned}
\frac{1 - e^{-\omega \Delta\tau}}{1 - e^{-\beta \omega}} &= \xi, \\[4pt]
1 - e^{-\omega \Delta\tau} &= \xi (1 - e^{-\beta \omega}), \\[4pt]
e^{-\omega \Delta\tau} &= 1 - \xi (1 - e^{-\beta \omega}),
\end{aligned}
$$

$$
\boxed{
\begin{aligned}
\Delta\tau &= -\frac{1}{\omega} \ln\!\bigl[ 1 - \xi (1 - e^{-\beta \omega}) \bigr].
\end{aligned}
}
$$

若使用对称化传播子 $D_{+}$，先按上式抽取 $\Delta\tau$，再以概率 $1/2$ 替换为 $\beta - \Delta\tau$。

---

## 9. Directed-Loop 方程

Directed-loop 更新通过扩展配置空间来连接两个需要大量局部更改的正则 MC 配置。全局细致平衡条件因 MC 权重 $W(\mathcal{C}) \propto \prod_{p} \mathcal{W}_{\nu_p}$ 因子化而退化为对每个顶点的局部条件。

在扩展配置空间中，每个顶点被赋予一个入口腿 $l_1$ 和出口腿 $l_2$，相应权重记为 $W_{v}(l_1, l_2)$。

### 9.1 局部细致平衡

正向过程（顶点类型 $v$，入口 $l_1$，出口 $l_2$）和反向过程（顶点类型 $\bar{v}$，入口 $l_2$，出口 $l_1$）的权重相等：

$$
\boxed{
\begin{aligned}
W_{v}(l_1, l_2) &= W_{\bar{v}}(l_2, l_1).
\end{aligned}
}
$$

其中 $\bar{v}$ 是将顶点 $v$ 沿 loop 段翻转自旋后得到的顶点类型。

### 9.2 概率守恒

从入口腿 $l_1$ 进入后，所有可能出口的总权重等于原始顶点权重：

$$
\boxed{
\begin{aligned}
\sum_{l_2} W_{v}(l_1, l_2) &= W_{v}.
\end{aligned}
}
$$

由此，实际退出概率为

$$
\boxed{
\begin{aligned}
P(l_1 \to l_2) &= \frac{W_{v}(l_1, l_2)}{W_{v}}.
\end{aligned}
}
$$

### 9.3 求解线性系统

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

目标是最小化 bounce 权重 $b_{1}, b_{2}, b_{3}$（bounce 降低算法效率）。通过调节常数位移 $C$ 和 bounce 权重，可保证 $a, b, c \ge 0$。

在无外磁场 $h_z = 0$ 且 $\lambda_z \le \lambda_{xy}$ 时，取 $b_1 = b_2 = b_3 = 0$ 可得 bounce-free 解。对于 SU(2) 对称情形 $\lambda_z = \lambda_{xy}$，取 $C = \lambda_z / 4$ 即可确定性构造 loop（入口腿唯一决定出口腿）。

---

## 10. Wormhole 更新：推迟顶点到最近邻顶点的拓扑等价

推迟相互作用顶点（图 3(a)）有四个腿：两个在虚时间 $\tau$，两个在虚时间 $\tau'$。若将 $\tau'$ 处的子顶点放在 $\tau$ 处子顶点的右侧，从拓扑上看

$$
\begin{aligned}
(\tau, \tau') \quad \longleftrightarrow \quad (i, j),
\end{aligned}
$$

即推迟顶点的四条腿结构与格点模型中最邻近交换顶点的结构完全等价。

两者在 directed-loop 方程中的数学形式相同，差别仅在于

- 格点模型：loop 沿空间键 $(i, j)$ 移动；
- 推迟自旋-玻色模型：loop 沿虚时间虫洞 $(\tau, \tau')$ 跳跃 —— 当 loop head 进入 $\tau$ 处的顶点腿时，可通过传播子直接跳到 $\tau'$ 处继续。

因为 $\mathcal{I}(\omega)$ 和 $P(\omega, \tau - \tau')$ 对每个顶点是全局因子，在 directed-loop 方程中抵消，所以 wormhole update 的数学结构完全退化为标准 directed-loop 更新。

---

## 11. 可观测量

与标准世界线 QMC 方法一致。

### 11.1 自旋关联函数

$$
\boxed{
\begin{aligned}
C_{\ell}(\tau - \tau') &= \langle \hat{S}_{\ell}(\tau) \hat{S}_{\ell}(\tau') \rangle.
\end{aligned}
}
$$

### 11.2 磁化率

$$
\boxed{
\begin{aligned}
\chi_{\ell}(\mathrm{i}\Omega_{m}) &=
   \frac{1}{\beta} \iint_{0}^{\beta} d\tau d\tau' \, e^{\mathrm{i}\Omega_{m}(\tau - \tau')} C_{\ell}(\tau - \tau'),
\end{aligned}
}
$$

其中 $\Omega_{m} = 2\pi m / \beta$，$m \in \mathbb{Z}$ 为玻色 Matsubara 频率。静态磁化率定义为 $\chi_{\ell} = \chi_{\ell}(\mathrm{i}\Omega_{0})$。

$z$ 分量（对角可观测量）可直接从传播态 $|\alpha_{p}\rangle$ 读出；$x, y$ 分量（非对角可观测量）通过追踪 directed-loop 更新中 loop head/tail 的传播来测量。

### 11.3 平均展开阶数

平均展开阶数与自旋子系统能量相关：

$$
\langle n \rangle = -\beta \langle \hat{H}_{\mathrm{s}} + \hat{H}_{\mathrm{sb}} \rangle.
$$

玻色可观测量（如 bath 能量、传播子、比热）可从高阶自旋-自旋关联函数通过生成泛函恢复。

---

## 12. 具体模型中的顶点权重

### 12.1 XXZ 自旋-玻色子模型

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

无符号条件（所有权重非负）要求

$$
\boxed{
C \ge \max\!\left[ \frac{\lambda_{z}}{4}, \; \frac{|h_{z}|}{2} - \frac{\lambda_{z}}{4} \right].
}
$$

上述顶点权重与铁磁 XXZ 最近邻自旋模型的权重等价。

### 12.2 Jaynes-Cummings 模型

$$
\boxed{
\begin{aligned}
\hat{h}_{1}(\tau, \tau') &= \frac{\lambda_{xy}}{2} \hat{S}_{+}(\tau) \hat{S}_{-}(\tau'), \\[4pt]
\hat{h}_{2}(\tau, \tau') &= C + \frac{h_{z}}{2} \bigl[ \hat{S}_{z}(\tau) + \hat{S}_{z}(\tau') \bigr].
\end{aligned}
}
$$

顶点权重类似于 XXZ 情形，但 $\lambda_{z} = 0$，$W_{5} = 0$（仅保留单一方向的 spin-flip 顶点）。

### 12.3 原始自旋-玻色子模型 / Rabi 模型

$$
\hat{H} = -h_{x} \hat{S}_{x} + \sum_{q} \omega_{q} \hat{a}_{q}^{\dagger} \hat{a}_{q}
   \;+\; \sum_{q} \gamma_{q} (\hat{a}_{q}^{\dagger} + \hat{a}_{q}) \hat{S}_{z}.
$$

取 $\hat{\varrho}_{q} = \gamma_{q} \hat{S}_{z} = \hat{\varrho}_{q}^{\dagger}$，推迟相互作用为

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

注意这里使用了对称化传播子 $D_{+}$（坐标耦合 $a^{\dagger} + a$ 天然对称）。若希望使用 wormhole spin-flip 框架，可转动自旋基底（例如 $S_z \leftrightarrow S_x$ 的 Hadamard 旋转），使得推迟相互作用分解为非对角部分和对角部分，从而使用 directed-loop 更新。

---

## 13. 算法适用条件

该算法的适用范围由以下条件限定：

1. **玻色浴是二次型**：$\hat{H}_{\mathrm{b}} = \sum_{\mu} \omega_{\mu} \hat{a}_{\mu}^{\dagger} \hat{a}_{\mu}$（或可对角化为此形式），否则 Wick 定理不适用。

2. **自旋-玻色耦合对 $\hat{a}, \hat{a}^{\dagger}$ 线性**：$\hat{H}_{\mathrm{sb}} = \sum_{\mu} (\hat{a}_{\mu}^{\dagger} \hat{\varrho}_{\mu} + \hat{\varrho}_{\mu}^{\dagger} \hat{a}_{\mu})$，非线性耦合需要更复杂的处理。

3. **顶点权重非负**：通过调节常数位移 $C$ 或选择适当自旋基底，确保 $W_{v} \ge 0$。

4. **传播子不引入负权重**：玻色传播子 $D(\omega, \tau) > 0$ 对所有 $\omega, \tau$ 成立。若 bath 存在 hopping 导致空间非局域传播子的矩阵元为负，则需直接采样玻色子而非使用推迟表述。

---

> **来源**：Weber (2022), Phys. Rev. B 105, 165129 — Quantum Monte Carlo simulation of spin-boson models using wormhole updates
> **调研时间**：2026-07-09

---
title: "虫洞更新：从延迟相互作用到非局域蒙特卡罗"
description: "Weber (2022) 提出的虫洞更新方法——利用积分掉玻色子浴产生的延迟相互作用中的远距离顶点对作为有向环的源和汇，将非局域更新映射为等效最近邻问题"
date: 2026-07-09
author: "Manuel Weber"
source_type: "paper"
source_title: "Quantum Monte Carlo simulation of spin-boson models using wormhole updates"
tags: ["量子蒙特卡罗", "虫洞更新", "自旋-玻色子模型"]
weight: 5
---

## 一句话概括

将自旋-玻色子模型中的玻色子浴精确积分掉，产生虚时中的非局域延迟自旋-自旋相互作用；然后利用相互作用顶点的两个时空分离的算符天然构成有向环的"虫洞"——环头从顶点的入口腿进入，瞬移至远距离的出口腿退出——使非局域更新等价于最近邻晶格模型的有向环更新，从而以线性标度实现遍历采样，无需直接模拟玻色子自由度。

## 核心思维框架

### 框架一：相互作用表象中的路径积分——"先积分，后展开"

传统思路是直接在玻色子+自旋的联合构型空间中采样，但非粒子数守恒的玻色子模式导致极长的自相关时间。Weber 的策略是**颠倒顺序**：

1. 先将玻色子自由度精确积分掉（因为 $\hat{H}_{\mathrm{b}}$ 是二次型）→ 得到仅含自旋自由度的有效作用量 $\hat{\mathcal{H}}_{\mathrm{ret}}$
2. 再对仅含自旋的有效理论做微扰展开（SSE风格）→ 采样自旋世界线构型

关键洞察：积分掉玻色子浴等价于在自旋之间引入由自由玻色子传播子 $D(\omega,\tau)$ 介导的延迟相互作用。这个过程没有近似，是精确的。

### 框架二：虫洞更新——非局域相互作用的"透视"性质

延迟相互作用的每个顶点 $\hat{\varrho}^\dagger(\tau) \hat{\varrho}(\tau')$ 包含两个在虚时上可能相距很远的算符。Weber 的核心发现是：**在有向环方程中，这个非局域性完全透明**。

原因：有向环方程的推导只依赖于顶点权重 $W_v$ 的值和顶点的腿结构（四个腿：$\tau$ 处的入口/出口 + $\tau'$ 处的入口/出口），而与两个子顶点在虚时轴上的距离无关。拓扑上，延迟顶点等价于将 $\tau'$ 处的子顶点移到 $\tau$ 处的子顶点右侧，形成最近邻结构。

这意味着：
- 有向环方程的形式与最近邻 XXZ 模型完全相同
- 从 $\tau$ 处的腿瞬移至 $\tau'$ 处的腿只是链表中的一次跳转
- $\mathcal{I}(\omega)$ 和 $P(\omega,\tau-\tau')$ 作为全局前因子在对角更新中处理，从有向环方程中自动消去

### 框架三：对角更新承载全部时间依赖性

这是实现上的关键分工：

- **对角更新**：负责添加/移除对角顶点，采样 $\omega$ 和 $\tau-\tau'$（通过逆变换采样从 $\mathcal{I}(\omega)$ 和 $P(\omega,\tau-\tau')$ 中抽取），改变展开阶数 $n$
- **有向环更新**：负责将对角顶点与非对角顶点相互转换，构造闭合环翻转世界线段。完全不涉及连续时间变量

这种分工使时间依赖性的采样完全与全局更新解耦，$O(n)$ 的对角更新 + $O(\chi_{xy})$ 的有向环更新共同构成遍历算法。

### 框架四：正定传播子 vs. 行列式——玻色子与费米子的分水岭

这是虫洞更新能够高效的关键物理原因：

- **玻色子浴**：自由玻色子传播子 $D(\omega,\tau) = e^{-\omega\tau}/(1-e^{-\beta\omega}) > 0$（正定），Wick 收缩直接给出正权重乘积
- **费米子浴**：传播子可取负值，需要构造行列式来保证正性 → $O(\beta^3)$ 标度

虫洞更新的存在性依赖于"无符号问题"——这等价于要求浴传播子正定。

### 框架五：有限温度标度分析——温度作为虚时方向的系统尺寸

在量子临界点的有限尺寸标度中，空间方向和虚时方向不对称。对于零维杂质模型（无空间维度），逆温度 $\beta$ 扮演唯一的"系统尺寸"角色。通过对 $\{T, T/10\}$ 数据对的交叉点做幂律外推 $\alpha_*(T) = \alpha_c + A T^e$，可以在零温极限精确确定临界耦合。

## 核心推导（原子步骤展开）

### 推导一：从自旋-玻色子哈密顿量到延迟相互作用

**起点**：通用自旋-玻色子模型

$$
\hat{H} = \hat{H}_{\mathrm{s}} + \hat{H}_{\mathrm{b}} + \hat{H}_{\mathrm{sb}}, \quad \hat{H}_{\mathrm{b}} = \sum_\mu \omega_\mu \hat{a}_\mu^\dagger \hat{a}_\mu, \quad \hat{H}_{\mathrm{sb}} = \sum_\mu (\hat{a}_\mu^\dagger \hat{\varrho}_\mu + \hat{\varrho}_\mu^\dagger \hat{a}_\mu)
$$

设 $\hat{H}_{\mathrm{s}} = 0$ 以简化记号（稍后可以加回），取 $\hat{H}_0 \equiv \hat{H}_{\mathrm{b}}$，$\hat{V} \equiv \hat{H}_{\mathrm{sb}}$。

**第 1 步**：写出配分函数的戴森展开（有序积分形式）

$$
Z = \sum_{m=0}^{\infty} (-1)^m \int_0^\beta d\tau_1 \int_0^{\tau_1} d\tau_2 \cdots \int_0^{\tau_{m-1}} d\tau_m \, \mathrm{Tr}\!\left[e^{-\beta\hat{H}_0} \hat{V}(\tau_1) \hat{V}(\tau_2) \cdots \hat{V}(\tau_m)\right]
\quad \text{(仅写出戴森展开的有序积分形式)}
$$

**第 2 步**：引入时序算符 $\hat{\mathcal{T}}_\tau$，将有序积分改写为等限积分

$$
Z = \sum_{m=0}^{\infty} \frac{(-1)^m}{m!} \int_0^\beta d\tau_1 \int_0^\beta d\tau_2 \cdots \int_0^\beta d\tau_m \, \mathrm{Tr}\!\left[e^{-\beta\hat{H}_0} \hat{\mathcal{T}}_\tau \hat{V}(\tau_1) \hat{V}(\tau_2) \cdots \hat{V}(\tau_m)\right]
\quad \text{(仅引入 } \hat{\mathcal{T}}_\tau \text{ 将有序积分转为等限积分)}
$$

**第 3 步**：将 $\hat{V} = \sum_{\mu c} \hat{a}_\mu^c \hat{\varrho}_\mu^{\bar{c}}$ 代入，展开求和

$$
Z = \sum_{m=0}^{\infty} \frac{(-1)^m}{m!} \int_0^\beta d\tau_1 \cdots \int_0^\beta d\tau_m \sum_{\mu_1\cdots\mu_m} \sum_{c_1\cdots c_m} \mathrm{Tr}\!\left[e^{-\beta\hat{H}_{\mathrm{b}}} \hat{\mathcal{T}}_\tau \hat{a}_{\mu_1}^{c_1}(\tau_1) \cdots \hat{a}_{\mu_m}^{c_m}(\tau_m)\right] \times \mathrm{Tr}_{\mathrm{s}}\!\left[\hat{\mathcal{T}}_\tau \hat{\varrho}_{\mu_1}^{\bar{c}_1}(\tau_1) \cdots \hat{\varrho}_{\mu_m}^{\bar{c}_m}(\tau_m)\right]
\quad \text{(仅将 } \hat{V} \text{ 的显式代入，分离玻色子与自旋迹)}
$$

**第 4 步**：利用玻色子粒子数守恒，仅 $m = 2n$（等量产生/湮灭算符）时非零

$$
Z = \sum_{n=0}^{\infty} \frac{(-1)^{2n}}{(2n)!} \int_0^\beta d\tau_1 \cdots \int_0^\beta d\tau_{2n} \sum_{\mu_1\cdots\mu_{2n}} \sum_{c_1\cdots c_{2n}} \mathrm{Tr}_{\mathrm{b}}\!\left[\cdots\right] \times \mathrm{Tr}_{\mathrm{s}}\!\left[\cdots\right]
\quad \text{(仅限制 } m = 2n \text{，利用粒子数守恒)}
$$

**第 5 步**：注意到 $\binom{2n}{n}$ 种等量产生/湮灭的选法；选择一种特定的排序（所有湮灭算符在前，所有产生算符在后）来阐述 Wick 定理

$$
\langle \hat{\mathcal{T}}_\tau \hat{a}_{\mu_1}(\tau_1) \cdots \hat{a}_{\mu_n}(\tau_n) \hat{a}_{\mu_{n+1}}^\dagger(\tau_{n+1}) \cdots \hat{a}_{\mu_{2n}}^\dagger(\tau_{2n}) \rangle_{\mathrm{b}} = \sum_{\pi \in S_n} \prod_{k=1}^{n} D(\omega_{\mu_k}, \tau_k - \tau_{n+\pi[k]}) \, \delta_{\mu_k, \mu_{n+\pi[k]}}
\quad \text{(仅写出 Wick 定理的显式结果)}
$$

**第 6 步**：代入玻色子迹的结果，合并所有 $\binom{2n}{n}$ 种组合，消去 $(-1)^{2n}=1$

$$
\frac{Z}{Z_{\mathrm{b}}} = \sum_{n=0}^{\infty} \frac{1}{n!^2} \iint_0^\beta d\tau_1 d\tau_1' \sum_{\mu_1} \cdots \iint_0^\beta d\tau_n d\tau_n' \sum_{\mu_n} \sum_{\pi \in S_n} \prod_{k=1}^n D(\omega_{\mu_k}, \tau_k - \tau_{\pi[k]}') \times \mathrm{Tr}_{\mathrm{s}}\!\left[\hat{\mathcal{T}}_\tau \hat{\varrho}_{\mu_1}^\dagger(\tau_1) \hat{\varrho}_{\mu_1}(\tau_{\pi[1]}') \cdots \hat{\varrho}_{\mu_n}^\dagger(\tau_n) \hat{\varrho}_{\mu_n}(\tau_{\pi[n]}')\right]
\quad \text{(仅代入 Wick 定理结果，定义 } \tau_k' = \tau_{n+k} \text{)}
$$

**第 7 步**：对所有排列 $\pi \in S_n$ 的求和可通过重新标记 $\tau'$ 变量求值，每个排列贡献相同 → 产生因子 $n!$

$$
\frac{Z}{Z_{\mathrm{b}}} = \sum_{n=0}^{\infty} \frac{1}{n!} \iint_0^\beta d\tau_1 d\tau_1' \sum_{\mu_1} \cdots \iint_0^\beta d\tau_n d\tau_n' \sum_{\mu_n} \prod_{k=1}^n D(\omega_{\mu_k}, \tau_k - \tau_k') \times \mathrm{Tr}_{\mathrm{s}}\!\left[\hat{\mathcal{T}}_\tau \hat{\varrho}_{\mu_1}^\dagger(\tau_1) \hat{\varrho}_{\mu_1}(\tau_1') \cdots \hat{\varrho}_{\mu_n}^\dagger(\tau_n) \hat{\varrho}_{\mu_n}(\tau_n')\right]
\quad \text{(仅对所有排列求和并吸收因子 } n! \text{)}
$$

**第 8 步**：识别出 $n$ 个相同因子的乘积结构，写成紧凑形式

$$
\frac{Z}{Z_{\mathrm{b}}} = \sum_{n=0}^{\infty} \frac{1}{n!} \mathrm{Tr}_{\mathrm{s}} \left\{ \hat{\mathcal{T}}_\tau \left[ \iint_0^\beta d\tau d\tau' \sum_\mu \hat{\varrho}_\mu^\dagger(\tau) D(\omega_\mu, \tau - \tau') \hat{\varrho}_\mu(\tau') \right]^n \right\}
\quad \text{(仅将 } n \text{ 个相同因子写成幂次形式)}
$$

**第 9 步**：重新指数化——无穷级数恢复为指数形式

$$
Z = Z_{\mathrm{b}} \, \mathrm{Tr}_{\mathrm{s}} \, \hat{\mathcal{T}}_\tau \exp\left[ \iint_0^\beta d\tau d\tau' \sum_\mu \hat{\varrho}_\mu^\dagger(\tau) D(\omega_\mu, \tau - \tau') \hat{\varrho}_\mu(\tau') \right]
\quad \text{(仅将级数重新指数化)}
$$

**第 10 步**：定义延迟自旋相互作用哈密顿量

$$
\hat{\mathcal{H}}_{\mathrm{ret}} = -\iint_0^\beta d\tau d\tau' \sum_\mu \hat{\varrho}_\mu^\dagger(\tau) D(\omega_\mu, \tau - \tau') \hat{\varrho}_\mu(\tau')
\quad \text{(仅定义 } \hat{\mathcal{H}}_{\mathrm{ret}} \text{)}
$$

**第 11 步**：得到最终有效配分函数

$$
Z = Z_{\mathrm{b}} \, \mathrm{Tr}_{\mathrm{s}} \, \hat{\mathcal{T}}_\tau e^{-\hat{\mathcal{H}}_{\mathrm{ret}}}
\quad \text{(仅将定义代入指数)}
$$

### 推导二：Wick 定理对玻色子迹的逐项收缩

考虑玻色子热期望值：

$$
\langle \hat{\mathcal{T}}_\tau \hat{a}_{\mu_1}(\tau_1) \cdots \hat{a}_{\mu_n}(\tau_n) \hat{a}_{\mu_{n+1}}^\dagger(\tau_{n+1}) \cdots \hat{a}_{\mu_{2n}}^\dagger(\tau_{2n}) \rangle_{\mathrm{b}}
$$

其中 $\langle \bullet \rangle_{\mathrm{b}} = Z_{\mathrm{b}}^{-1} \mathrm{Tr}_{\mathrm{b}}[e^{-\beta\hat{H}_{\mathrm{b}}} \bullet]$，$\hat{H}_{\mathrm{b}} = \sum_\mu \omega_\mu \hat{a}_\mu^\dagger \hat{a}_\mu$。

**第 1 步**：写出 Wick 定理的陈述——$2n$ 点函数等于所有完全收缩之和

$$
\langle \hat{\mathcal{T}}_\tau \hat{a}_1 \cdots \hat{a}_n \hat{a}_{n+1}^\dagger \cdots \hat{a}_{2n}^\dagger \rangle_{\mathrm{b}} = \sum_{\text{所有完全收缩}} \prod_{\text{每个收缩对}} \langle \hat{\mathcal{T}}_\tau \, \hat{a}_i^{c_i} \hat{a}_j^{c_j} \rangle_{\mathrm{b}}
\quad \text{(仅陈述 Wick 定理)}
$$

**第 2 步**：非零收缩仅发生在 $\hat{a}$ 与 $\hat{a}^\dagger$ 之间

$$
\langle \hat{\mathcal{T}}_\tau \hat{a}_\mu(\tau) \hat{a}_\nu^\dagger(\tau') \rangle_{\mathrm{b}} = D(\omega_\mu, \tau - \tau') \delta_{\mu\nu}
\quad \text{(仅写出非零收缩的显式)}
$$

**第 3 步**：每个完全收缩对应一个排列 $\pi \in S_n$：第 $k$ 个湮灭算符 $\hat{a}_{\mu_k}(\tau_k)$ 与第 $\pi[k]$ 个产生算符 $\hat{a}_{\mu_{n+\pi[k]}}^\dagger(\tau_{n+\pi[k]})$ 收缩

$$
\langle \cdots \rangle_{\mathrm{b}} = \sum_{\pi \in S_n} \prod_{k=1}^n \langle \hat{\mathcal{T}}_\tau \hat{a}_{\mu_k}(\tau_k) \hat{a}_{\mu_{n+\pi[k]}}^\dagger(\tau_{n+\pi[k]}) \rangle_{\mathrm{b}}
\quad \text{(仅将完全收缩表示为排列求和)}
$$

**第 4 步**：代入自由玻色子传播子的显式

$$
\langle \cdots \rangle_{\mathrm{b}} = \sum_{\pi \in S_n} \prod_{k=1}^n D(\omega_{\mu_k}, \tau_k - \tau_{n+\pi[k]}) \, \delta_{\mu_k, \mu_{n+\pi[k]}}
\quad \text{(仅代入传播子显式)}
$$

**第 5 步**：写出传播子的显式

$$
D(\omega, \tau) = \frac{e^{-\omega\tau}}{1 - e^{-\beta\omega}}, \quad 0 \leqslant \tau < \beta
\quad \text{(仅给出传播子显式)}
$$

**第 6 步**：验证周期性边界条件

$$
D(\omega, \tau + \beta) = \frac{e^{-\omega(\tau+\beta)}}{1 - e^{-\beta\omega}} = \frac{e^{-\omega\tau} e^{-\omega\beta}}{1 - e^{-\beta\omega}} = D(\omega, \tau) \cdot \frac{e^{-\omega\beta}(1 - e^{-\omega\beta})}{e^{-\omega\beta} - e^{-2\omega\beta}} \neq D(\omega, \tau)
\quad \text{(仅代入周期性条件验证)}
$$

实际上正确的验证是：

$$
D(\omega, \tau + \beta) = \frac{e^{-\omega(\tau+\beta)}}{1 - e^{-\beta\omega}} = \frac{e^{-\omega\tau}}{e^{\beta\omega} - 1}
$$

而 $D(\omega, \tau) = \frac{e^{-\omega\tau}}{1 - e^{-\beta\omega}}$，两者相等当且仅当 $\frac{1}{1 - e^{-\beta\omega}} = \frac{1}{e^{\beta\omega} - 1}$，即 $e^{\beta\omega} - 1 = 1 - e^{-\beta\omega}$，这不恒成立。实际上传播子满足的是 $D(\omega, \tau + \beta) = -e^{\beta\omega} D(\omega, \tau)$ 类型的关系——此处论文原文的声称需在适当的解析延拓意义下理解。

**正确的陈述**：对于 $0 \leqslant \tau < \beta$，传播子定义为 $D(\omega, \tau) = e^{-\omega\tau}/(1 - e^{-\beta\omega})$，且通过反周期延拓到全实轴。在路径积分中，这由 $\hat{\mathcal{T}}_\tau$ 自动处理。

### 推导三：有向环方程的推导与求解

**出发点**：在扩展构型空间中，每个顶点 $v$ 被赋予入口腿 $l_{\mathrm{in}}$ 和出口腿 $l_{\mathrm{out}}$，权重变为 $W_v(l_{\mathrm{in}}, l_{\mathrm{out}})$。

**第 1 步**：写出局域细致平衡条件

$$
W_v(l_1, l_2) = W_{\bar{v}}(l_2, l_1)
\quad \text{(仅写出局域细致平衡方程)}
$$

其中 $\bar{v}$ 是通过沿分配的环段翻转自旋从 $v$ 得到的顶点类型。例如 $v=1$（自旋 $\uparrow\uparrow\uparrow\uparrow$）在环段翻转后可以变为 $v=5$（自旋翻转顶点）。

**第 2 步**：写出概率守恒条件

$$
\sum_{l_2} W_v(l_1, l_2) = W_v
\quad \text{(仅写出概率守恒方程，对出口腿求和等于总权重)}
$$

**第 3 步**：为图 3(b) 的赋值表写出显式方程

考察图 3(b) 的赋值表。行对应入口腿，列对应出口腿。设 $a, b, c$ 为"直通/转向"权重，$b_1, b_2, b_3$ 为反弹权重（对角线）。

从第一行（进入 $l=1$，即左上腿 $\uparrow$）：

$$
b_1 + a + b = W_1
\quad \text{(仅写出第一行的概率守恒)}
$$

**第 4 步**：写出第二行

$$
a + b_2 + c = W_2
\quad \text{(仅写出第二行的概率守恒)}
$$

**第 5 步**：写出第三行

$$
b + c + b_3 = W_5
\quad \text{(仅写出第三行的概率守恒)}
$$

**第 6 步**：用细致平衡关系消去对称位置的变量。将三个方程视为关于 $a, b, c$ 的线性方程组

$$
\begin{aligned}
a + b &= W_1 - b_1 \\
a + c &= W_2 - b_2 \\
b + c &= W_5 - b_3
\end{aligned}
\quad \text{(仅将反弹权重移至等式右侧)}
$$

**第 7 步**：通过加减消元求解 $a$

$$
\begin{aligned}
(a+b) + (a+c) - (b+c) &= (W_1 - b_1) + (W_2 - b_2) - (W_5 - b_3) \\
2a &= W_1 + W_2 - W_5 - b_1 - b_2 + b_3
\end{aligned}
\quad \text{(仅做消元：第一式+第二式-第三式)}
$$

**第 8 步**：得到 $a$ 的解

$$
a = \frac{1}{2}\left[W_1 + W_2 - W_5 - b_1 - b_2 + b_3\right]
\quad \text{(仅两边除以 2)}
$$

**第 9 步**：类似地求解 $b$

$$
b = \frac{1}{2}\left[W_1 - W_2 + W_5 - b_1 + b_2 - b_3\right]
\quad \text{(仅用消元法求 } b \text{)}
$$

**第 10 步**：求解 $c$

$$
c = \frac{1}{2}\left[-W_1 + W_2 + W_5 + b_1 - b_2 - b_3\right]
\quad \text{(仅用消元法求 } c \text{)}
$$

**第 11 步**：代入 XXZ 自旋-玻色子模型的顶点权重

$$
W_1 = C + \frac{\lambda_z}{4} - \frac{h_z}{2}, \quad W_2 = W_3 = C - \frac{\lambda_z}{4}, \quad W_4 = C + \frac{\lambda_z}{4} + \frac{h_z}{2}, \quad W_5 = W_6 = \frac{\lambda_{xy}}{2}
\quad \text{(仅代入 XXZ 权重定义)}
$$

**第 12 步**：将 $W_1, W_2, W_5$ 代入 $a$ 的表达式

$$
\begin{aligned}
a &= \frac{1}{2}\left[\left(C + \frac{\lambda_z}{4} - \frac{h_z}{2}\right) + \left(C - \frac{\lambda_z}{4}\right) - \frac{\lambda_{xy}}{2} - b_1 - b_2 + b_3\right] \\
  &= \frac{1}{2}\left[2C - \frac{h_z}{2} - \frac{\lambda_{xy}}{2} - b_1 - b_2 + b_3\right]
\end{aligned}
\quad \text{(仅将权重代入并合并同类项)}
$$

**第 13 步**：将 $W_1, W_2, W_5$ 代入 $b$ 的表达式

$$
b = \frac{1}{2}\left[\frac{\lambda_z}{2} - \frac{h_z}{2} + \frac{\lambda_{xy}}{2} - b_1 + b_2 - b_3\right]
\quad \text{(仅代入权重并化简)}
$$

**第 14 步**：将 $W_1, W_2, W_5$ 代入 $c$ 的表达式

$$
c = \frac{1}{2}\left[-\frac{\lambda_z}{2} + \frac{h_z}{2} + \frac{\lambda_{xy}}{2} + b_1 - b_2 - b_3\right]
\quad \text{(仅代入权重并化简)}
$$

**第 15 步**：分析无反弹条件。设 $h_z = 0$，$b_1 = b_2 = b_3 = 0$

$$
a = \frac{1}{2}\left[2C - \frac{\lambda_{xy}}{2}\right], \quad b = \frac{1}{2}\left[\frac{\lambda_z}{2} + \frac{\lambda_{xy}}{2}\right], \quad c = \frac{1}{2}\left[-\frac{\lambda_z}{2} + \frac{\lambda_{xy}}{2}\right]
\quad \text{(仅设反弹权重和磁场为零)}
$$

**第 16 步**：检查正定性条件。$c \geqslant 0$ 要求

$$
-\frac{\lambda_z}{2} + \frac{\lambda_{xy}}{2} \geqslant 0 \implies \lambda_z \leqslant \lambda_{xy}
\quad \text{(仅解不等式)}
$$

这恰好是无反弹解的适用范围。当 $\lambda_z = \lambda_{xy}$（SU(2) 对称点），取 $C = \lambda_z/4$，则 $c=0$，$a = \frac{1}{2}[\lambda_z/2 - \lambda_z/2] = 0$？等一下，让我仔细算：

$$
C = \lambda_z/4, \quad \lambda_{xy} = \lambda_z
$$

$$
a = \frac{1}{2}\left[2\cdot\frac{\lambda_z}{4} - \frac{\lambda_z}{2}\right] = \frac{1}{2}\left[\frac{\lambda_z}{2} - \frac{\lambda_z}{2}\right] = 0
$$

$$
b = \frac{1}{2}\left[\frac{\lambda_z}{2} + \frac{\lambda_z}{2}\right] = \frac{\lambda_z}{2}
$$

$$
c = \frac{1}{2}\left[-\frac{\lambda_z}{2} + \frac{\lambda_z}{2}\right] = 0
$$

因此 SU(2) 对称点入口腿确定性地决定出口腿（$b = \lambda_z/2 = W_5$，$a=c=0$），与海森堡模型的有向环完全相同。

### 推导四：为什么延迟顶点等价于最近邻顶点

**关键观察**：有向环方程只依赖于顶点权重 $W_v$ 的值和腿的连接拓扑。

**第 1 步**：写出延迟顶点的矩阵元结构

延迟顶点 $\hat{\varrho}^\dagger(\tau) \hat{\varrho}(\tau')$ 作用于世界线构型时，产生四个腿：

- $\tau$ 处：进入腿（自旋态在算符作用前）、退出腿（自旋态在算符作用后）
- $\tau'$ 处：进入腿、退出腿

$$
\text{顶点结构：} \quad \text{leg}_{\tau}^{\mathrm{in}} \rightarrow \text{leg}_{\tau}^{\mathrm{out}} \quad \text{---} \quad \text{leg}_{\tau'}^{\mathrm{in}} \rightarrow \text{leg}_{\tau'}^{\mathrm{out}}
\quad \text{(仅描述顶点拓扑)}
$$

**第 2 步**：注意到虚时传播在子顶点之间不改变自旋态

在 $\tau$ 和 $\tau'$ 之间，世界线仅做平凡的虚时演化（$\hat{H}_0$ 不含自旋算符）。因此，$\tau$ 处的退出腿与 $\tau'$ 处的进入腿具有相同的自旋态。

$$
\text{leg}_{\tau}^{\mathrm{out}} = \text{leg}_{\tau'}^{\mathrm{in}} \quad \text{（在无外加自旋哈密顿量时）}
\quad \text{(仅陈述平凡时间传播)}
$$

**第 3 步**：将 $\tau'$ 处的子顶点在逻辑上移至 $\tau$ 处子顶点的右侧

这在拓扑上等价于最近邻晶格模型中连接相邻格点的顶点。唯一的区别是"格点指标" $i$ 被替换为"虚时标签" $\tau$。

$$
\text{延迟顶点} \cong \text{最近邻顶点（逻辑重排后）}
\quad \text{(仅陈述拓扑等价性)}
$$

**第 4 步**：验证权重等价性。对于 XXZ 自旋-玻色子模型，顶点权重为

$$
W_1 = C + \frac{\lambda_z}{4} - \frac{h_z}{2}, \quad W_2 = W_3 = C - \frac{\lambda_z}{4}, \quad W_4 = C + \frac{\lambda_z}{4} + \frac{h_z}{2}, \quad W_5 = W_6 = \frac{\lambda_{xy}}{2}
\quad \text{(仅重写权重以对比)}
$$

这与铁磁 XXZ 链中最近邻交换相互作用的顶点权重完全一致（见 Syljuåsen & Sandvik, 2002, Eq. 68-73）。

### 推导五：玻色子传播子的逆变换采样

对角更新需要从 $\mathcal{I}(\omega)$ 和 $P(\omega, \tau)$ 中采样。对于幂律谱 $J(\omega) = 2\pi\alpha \omega_c^{1-s} \omega^s$：

**第 1 步**：归一化谱密度

$$
\mathcal{I}(\omega) = \frac{J(\omega)/\omega}{\int_0^{\omega_c} d\omega \, J(\omega)/\omega} = \frac{2\pi\alpha \omega_c^{1-s} \omega^{s-1}}{\int_0^{\omega_c} d\omega \, 2\pi\alpha \omega_c^{1-s} \omega^{s-1}}
\quad \text{(仅写出归一化定义)}
$$

**第 2 步**：计算归一化积分

$$
\int_0^{\omega_c} d\omega \, \omega^{s-1} = \left.\frac{\omega^s}{s}\right|_0^{\omega_c} = \frac{\omega_c^s}{s}
\quad \text{(仅计算幂次积分)}
$$

**第 3 步**：得到归一化后的分布

$$
\mathcal{I}(\omega) = \frac{2\pi\alpha \omega_c^{1-s} \omega^{s-1}}{2\pi\alpha \omega_c^{1-s} \cdot \omega_c^s / s} = s \omega_c^{-s} \omega^{s-1}
\quad \text{(仅代入归一化因子)}
$$

**第 4 步**：计算累积分布函数

$$
F(\omega) = \int_0^\omega d\omega' \, s \omega_c^{-s} (\omega')^{s-1} = s \omega_c^{-s} \cdot \frac{\omega^s}{s} = \left(\frac{\omega}{\omega_c}\right)^s
\quad \text{(仅计算累积分布)}
$$

**第 5 步**：求逆函数。设 $\xi = F(\omega) = (\omega/\omega_c)^s$

$$
\omega = \omega_c \, \xi^{1/s}
\quad \text{(仅求逆函数)}
$$

**第 6 步**：用 $1-\xi$ 替换 $\xi$（两者都是 $[0,1)$ 上的均匀分布）以匹配论文符号习惯

$$
\omega = \omega_c (1-\xi)^{1/s}
\quad \text{(仅做变量替换 } \xi \to 1-\xi \text{)}
$$

**第 7 步**：对传播子 $P(\omega, \tau) = \omega D(\omega, \tau) = \omega e^{-\omega\tau}/(1 - e^{-\beta\omega})$ 计算累积分布（关于 $\tau$）

$$
F(\tau) = \int_0^\tau d\tau' \, \frac{\omega e^{-\omega\tau'}}{1 - e^{-\beta\omega}} = \frac{1 - e^{-\omega\tau}}{1 - e^{-\beta\omega}}
\quad \text{(仅计算指数累积分布)}
$$

**第 8 步**：求逆

$$
\xi = \frac{1 - e^{-\omega\tau}}{1 - e^{-\beta\omega}} \implies 1 - e^{-\omega\tau} = \xi(1 - e^{-\beta\omega})
\quad \text{(仅乘法移项)}
$$

**第 9 步**：解出 $\tau$

$$
e^{-\omega\tau} = 1 - \xi(1 - e^{-\beta\omega}) \implies \tau = -\frac{1}{\omega} \ln[1 - \xi(1 - e^{-\beta\omega})]
\quad \text{(仅取对数并解出 } \tau \text{)}
$$

### 推导六：有限温度标度分析与临界耦合估计

**第 1 步**：定义重标度磁化率

$$
T^s \chi_{xy} = T^s \cdot \frac{1}{\beta} \iint_0^\beta d\tau d\tau' \, C_{xy}(\tau - \tau')
\quad \text{(仅写出定义)}
$$

**第 2 步**：在临界相中，$C_{xy}(\tau) \sim 1/\tau^{1-s}$，代入标度分析

$$
\chi_{xy} \sim \int_0^\beta d\tau \, \frac{1}{\tau^{1-s}} \sim \beta^s
\quad \text{(仅做标度假定下的量纲分析)}
$$

**第 3 步**：因此 $T^s \chi_{xy} = \beta^{-s} \chi_{xy} \sim \text{const}$（在临界相中 $T \to 0$ 时有限），而在局域相中 $\chi_{xy} \sim 1/T$，$T^s \chi_{xy} \sim T^{s-1} \to \infty$

$$
T^s \chi_{xy} \to \begin{cases} \text{有限} & \alpha < \alpha_c \\ \infty & \alpha > \alpha_c \end{cases} \quad (T \to 0)
\quad \text{(仅陈述两个相的渐近行为)}
$$

**第 4 步**：对于温度对 $\{T, T/10\}$，提取交叉点 $\alpha_*(T)$

$$
\alpha_*(T) : \left.T^s \chi_{xy}\right|_{T,\alpha_*} = \left.T^s \chi_{xy}\right|_{T/10,\alpha_*}
\quad \text{(仅定义交叉点)}
$$

**第 5 步**：假设交叉点遵循幂律趋近

$$
\alpha_*(T) = \alpha_c + A T^e
\quad \text{(仅写出标度假设)}
$$

**第 6 步**：最小二乘拟合得到 $\alpha_c = 0.76213(6)$

$$
\boxed{\alpha_c = 0.76213(6)}
\quad \text{(仅给出拟合结果)}
$$

## 决策启发式

1. **何时使用虫洞更新**：哈密顿量中玻色子部分是二次型（可精确积分）且自由传播子正定（无符号问题）。这是虫洞更新存在性的充要条件。

2. **何时不用虫洞更新**：存在玻色子跳跃项 $\hat{a}_i^\dagger \hat{a}_j$（$i \neq j$）时，积分掉玻色子产生的非局域传播子可能取负值 → 符号问题。此时直接模拟玻色子更优（如 Jaynes-Cummings-Hubbard 模型）。

3. **反弹最小化原则**：求解有向环方程时，优先将反弹权重 $b_i$ 设为零，仅当正定性不满足时才引入非零反弹。反弹降低环长度 → 降低更新效率。

4. **逆变换采样优先**：当 $\mathcal{I}(\omega)$ 和 $P(\omega,\tau)$ 的累积分布可解析求逆时，逆变换采样是最高效的——接受概率独立于参数，恒为 $O(1)$。

5. **温度作为虚时尺寸**：对于零维杂质模型，$\beta$ 是唯一的有限尺寸参数。在 $\{T, T/10\}$ 对上做交叉点外推是提取零温临界耦合的标准策略。

6. **常数偏移 $C$ 的调谐**：$C$ 需满足 $C \geqslant \max[\lambda_z/4, |h_z|/2 - \lambda_z/4]$ 以保证所有对角权重非负。在 SU(2) 对称点，选 $C = \lambda_z/4$ 可获得确定性环构造。

7. **对角更新 vs. 有向环更新的频率**：预热阶段动态调整，使每个顶点平均被两类更新各触及至少一次。对角更新的计算量（含排序 $O(n \log n)$）在实际可及温度下始终小于有向环更新。

8. **从 SSE 迁移的习惯**：如果你已经实现了 SSE 有向环更新，虫洞更新的增量改动仅限于：(a) 顶点列表从定长算符串变为变长列表，(b) 对每次对角更新做时间排序以获取世界线构型，(c) 链表中的跳转需支持"虫洞"——从 $\tau$ 处的子顶点直接链接到 $\tau'$ 处的子顶点。

## 批判性思考

### 方法局限

1. **玻色子可观测量不可直接访问**：因为玻色子已被积分掉，$\langle \hat{a}^\dagger \hat{a} \rangle$ 等只能通过自旋的高阶关联函数间接恢复。从离散频率到连续谱的映射存在系统性模糊（需引入与 NRG 类似的离散化-连续化方案）。

2. **无自旋哈密顿量的假设**：推导中设 $\hat{H}_0$ 不含自旋项（使得虚时演化平凡）。如果加入 $\hat{H}_{\mathrm{s}}$，需要额外处理自旋在 $\hat{H}_{\mathrm{s}}$ 下的非平凡时间演化，公式会变复杂但原则上可行。

3. **仅适用于自旋-1/2**：当前公式依赖 $\hat{S}_z$ 本征态的两值性质。推广到更高自旋需要重新构造顶点权重和有向环赋值表。

4. **空间维度的限制**：虽然虫洞更新可平凡扩展到空间格点（每个格点加一个指标 $i$），但如果不同格点的浴之间存在关联（非独立浴），传播子矩阵的非对角元可能引入符号问题。

### 与其他方法的比较

5. **vs. 杂化展开 CT-QMC**：虫洞更新保持了 $O(n)$ 的全局更新标度（环长 $\sim \chi_{xy}$），而杂化展开 CT-QMC 仅有局域更新（$O(\beta^3)$ 标度来自行列式计算）。但杂化展开可以处理费米子浴（通过行列式处理符号），虫洞更新目前限于正定玻色子传播子。

6. **vs. MPS/Wilson 链方法**：MPS 方法的系统误差来自对数离散化（约 1%），虫洞更新的误差来自统计涨落和有限温度外推（可系统性减小）。两者互补：MPS 直接给 $T=0$ 结果，QMC 给有限温度行为。

### 未解决的问题

7. **符号问题的边界**：什么条件下非局域传播子保持正定？对于一般的浴谱函数 $J(\omega)$ 和一般的耦合结构，这个问题的完整刻画仍是开放的。

8. **多浴互斥效应的全貌**：论文仅考虑了 $s=0.8$ 的 U(1) 对称双浴模型。$s^* \approx 0.76$ 以下的临界相消失机制、三浴（SU(2) 对称）情形在后续工作 [62] 中处理，但更高浴数或更一般的耦合结构尚待探索。

## 关键公式速查

| 公式 | 表达式 | 含义 |
|------|--------|------|
| 自由玻色子传播子 | $D(\omega,\tau) = \frac{e^{-\omega\tau}}{1-e^{-\beta\omega}}$ | 玻色子浴的裸传播子，正定 |
| 延迟自旋相互作用 | $\hat{\mathcal{H}}_{\mathrm{ret}} = -\iint d\tau d\tau' \sum_\mu \hat{\varrho}_\mu^\dagger(\tau) D(\omega_\mu,\tau-\tau') \hat{\varrho}_\mu(\tau')$ | 积分掉玻色子浴后自旋的有效作用量 |
| 重标度传播子与谱密度 | $P(\omega,\tau) = \omega D(\omega,\tau)$，$\mathcal{I}(\omega) = s\omega_c^{-s}\omega^{s-1}$ | 将连续变量转为可直接采样的概率分布 |
| XXZ 顶点权重 | $W_5 = W_6 = \lambda_{xy}/2$，对角权重含 $C \pm \lambda_z/4 \pm h_z/2$ | 与铁磁 XXZ 链完全相同的权重结构 |
| 有向环方程（细致平衡） | $W_v(l_1,l_2) = W_{\bar{v}}(l_2,l_1)$ | 局域版本的全局细致平衡 |
| 有向环方程（概率守恒） | $\sum_{l_2} W_v(l_1,l_2) = W_v$ | 入口腿确定后所有出口概率之和等于顶点权重 |
| 无反弹条件 | $\lambda_z \leqslant \lambda_{xy}$（$h_z=0$ 时） | 保证所有转移概率非负 |
| 逆变换采样 $\omega$ | $\omega = \omega_c(1-\xi)^{1/s}$ | 从幂律谱中解析采样 |
| 逆变换采样 $\tau$ | $\tau = -\frac{1}{\omega}\ln[1-\xi(1-e^{-\beta\omega})]$ | 从玻色子传播子中解析采样 |
| 临界耦合 | $\alpha_c = 0.76213(6)$（$s=0.8$） | 双浴 U(1) 自旋-玻色子模型的临界点 |

## 术语对照

| 英文 | 中文 | 注释 |
|------|------|------|
| wormhole update | 虫洞更新 | 环头利用延迟相互作用顶点在虚时中相距很远的两点间瞬移 |
| retarded interaction | 延迟相互作用 | 积分掉玻色子浴后自旋间的有效非瞬时耦合 |
| directed-loop update | 有向环更新 | 沿闭合环翻转世界线段以实现对角/非对角顶点转换的全局更新 |
| diagonal update | 对角更新 | 添加/移除不改变自旋态的对角顶点，采样连续时间变量 |
| stochastic series expansion (SSE) | 随机级数展开 | 在 $\hat{H}_0=0$ 的基下展开配分函数的 QMC 框架 |
| free-boson propagator | 自由玻色子传播子 | $D(\omega,\tau)$，表征玻色子的裸虚时关联 |
| Wick's theorem | Wick 定理 | 将 $2n$ 点玻色子关联函数分解为两两收缩之和 |
| inverse transform sampling | 逆变换采样 | 从均匀随机数通过累积分布的逆函数生成目标分布的样本 |
| bounce move | 反弹移动 | 环头在进入顶点后沿原路返回的更新方式，降低效率 |
| world-line configuration | 世界线构型 | 自旋态沿虚时演化的图形表示 |
| ergodicity | 遍历性 | 马尔可夫链能到达构型空间中所有非零权重的构型 |
| spectral function | 谱函数 | $J(\omega)$，完全决定玻色子浴对自旋子系统的影响 |
| critical phase | 临界相 | 部分屏蔽导致的幂律自旋关联相，$C_{xy}(\tau) \sim 1/\tau^{1-s}$ |
| localized phase | 局域相 | 形成局域磁矩的相，$\lim_{\tau \to \infty} C_{xy}(\tau) = m_{\mathrm{loc}}^2 > 0$ |
| beta-doubling | $\beta$ 倍增 | 预热阶段逐步增加 $\beta$ 以加速收敛的技术 |

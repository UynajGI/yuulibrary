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

## 从 Rabi / JC / XXZ spin-boson 到 retarded spin worldline

## 0. 本节目标

本节要解释 Weber 的 wormhole QMC 算法到底在算什么。它的核心思想不是直接采样玻色子，而是：

\[
\boxed{
\text{先把 quadratic bosons 精确积掉，得到自旋之间的虚时间非局域相互作用。}
}
\]

然后再对这个纯自旋的 retarded interaction 做连续虚时世界线 QMC。

这和常见 Rabi 鞍点推导的方向相反。Rabi 鞍点推导常常是保留光场坐标 \(q(\tau)\)，再积掉或近似处理自旋；而这里是把玻色子先积掉，保留自旋世界线。Weber 论文明确说，直接采样不守粒子数的玻色自由度会导致长自相关，而如果玻色哈密顿量是二次型，就可以精确积掉玻色子，得到系统自由度中的 retarded interaction；随后用 directed-loop / wormhole update 高效采样。

---

## 1. 模型与记号

先统一记号。设自旋为 spin-\(\frac12\)。本文用

\[
S_\ell=\frac12\sigma_\ell,\qquad \ell=x,y,z
\]

也可以直接用 Pauli 矩阵 \(\sigma_\ell\)。如果使用 \(\sigma_\ell\) 而不是 \(S_\ell\)，所有耦合常数会差一个因子 \(2\)，但结构完全相同。

通用自旋-玻色子模型写成

\[
\hat H=\hat H_s+\hat H_b+\hat H_{sb}.
\]

其中玻色浴是自由 harmonic oscillators：

\[
\hat H_b=\sum_\mu \omega_\mu a_\mu^\dagger a_\mu.
\]

自旋-玻色耦合写成

\[
\hat H_{sb}
=\sum_\mu
\left(
a_\mu^\dagger \rho_\mu+\rho_\mu^\dagger a_\mu
\right).
\]

这里 \(\rho_\mu\) 是只作用在自旋 Hilbert 空间上的算符，并且包含耦合常数。比如：

### Rabi / original spin-boson 坐标耦合

若

\[
H_{sb}
=\sum_\mu g_\mu \sigma_z(a_\mu^\dagger+a_\mu),
\]

则直接取

\[
\boxed{\rho_\mu=g_\mu\sigma_z,\qquad \rho_\mu^\dagger=\rho_\mu.}
\]

于是

\[
a_\mu^\dagger\rho_\mu+\rho_\mu^\dagger a_\mu
=g_\mu a_\mu^\dagger\sigma_z
+g_\mu\sigma_z a_\mu
=g_\mu\sigma_z(a_\mu^\dagger+a_\mu),
\]

因为 \(a_\mu,a_\mu^\dagger\) 和 \(\sigma_z\) 作用在不同 Hilbert 空间，彼此对易。

所以 Rabi 耦合当然可以放进这个形式，关键只是：

\[
\boxed{\rho_\mu \text{ 包含 } \sigma_z \text{ 即可。}}
\]

### Jaynes-Cummings 耦合

若

\[
H_{sb}
=\sum_\mu g_\mu
\left(
a_\mu^\dagger S_-+S_+a_\mu
\right),
\]

则取

\[
\boxed{\rho_\mu=g_\mu S_-,\qquad \rho_\mu^\dagger=g_\mu S_+.}
\]

### XXZ spin-boson 耦合

若三个自旋分量分别耦合到不同 bath：

\[
H_{sb}
=\sum_{q,\ell}
g_{q\ell}(a_{q\ell}^\dagger+a_{q\ell})S_\ell,
\qquad \ell=x,y,z,
\]

则对每个分量取

\[
\rho_{q\ell}=g_{q\ell}S_\ell.
\]

这里的 \(\mu\) 可以理解为复合指标：

\[
\mu=(q,\ell).
\]

Weber 论文的模型部分正是用这个统一形式同时覆盖 original spin-boson、XXZ spin-boson 和 Jaynes-Cummings 型模型。

---

## 2. 谱函数：如何从离散 bath 变成连续 bath

玻色 bath 的影响由谱函数决定。定义

\[
J_\ell(\omega)
=\pi\sum_q g_{q\ell}^2\delta(\omega-\omega_{q\ell}).
\]

这句话的意思是：所有 bath mode 的频率和耦合强度，不再逐个记录，而是压缩成一个函数 \(J(\omega)\)。

因此，只要遇到求和

\[
\sum_q g_q^2 f(\omega_q),
\]

就可以换成

\[
\sum_q g_q^2 f(\omega_q)
=\frac1\pi
\int_0^\infty d\omega\,J(\omega)f(\omega).
\]

常见幂律谱为

\[
J_\ell(\omega)
=2\pi\alpha_\ell\omega_c^{1-s}\omega^s,
\qquad 0<\omega<\omega_c.
\]

其中

\[
s=1
\]

是 Ohmic bath，

\[
0<s<1
\]

是 sub-Ohmic bath。

这个谱函数稍后会进入虚时间核。连续 bath 的低频行为决定了虚时间长程相互作用。对幂律谱，频率积分会产生大致

\[
K(\tau)\sim \frac{1}{|\tau|^{1+s}}
\]

的长程虚时间相互作用。Weber 论文也指出，对 power-law spectrum，频率平均后的传播子会在虚时间中诱导长程相互作用。

---

## 3. 配分函数的 interaction-picture 展开

目标是计算

\[
Z=\mathrm{Tr}\,e^{-\beta H}.
\]

取

\[
H_0=H_b,
\qquad
V=H_{sb}.
\]

为了先看清楚浴如何被积掉，暂时把 \(H_s\) 放在一边。之后 \(H_s\) 可以作为额外自旋顶点加入 QMC；这不影响积掉 bath 的主逻辑。

interaction picture 中

\[
V(\tau)=e^{\tau H_0}Ve^{-\tau H_0}.
\]

配分函数展开为

\[
Z
=
\sum_{m=0}^{\infty}
\frac{(-1)^m}{m!}
\int_0^\beta d\tau_1\cdots d\tau_m\,
\mathrm{Tr}
\left[
e^{-\beta H_b}
\mathcal T_\tau
V(\tau_1)\cdots V(\tau_m)
\right].
\]

这里 \(\mathcal T_\tau\) 是虚时间序算符。它把较大的 \(\tau\) 排在左边。

将

\[
V(\tau)
=\sum_\mu
\left[
a_\mu^\dagger(\tau)\rho_\mu(\tau)
+
\rho_\mu^\dagger(\tau)a_\mu(\tau)
\right]
\]

代入。由于 \(a_\mu,a_\mu^\dagger\) 只作用在玻色 Hilbert 空间，\(\rho_\mu,\rho_\mu^\dagger\) 只作用在自旋 Hilbert 空间，所以迹可以拆开：

\[
\mathrm{Tr}=\mathrm{Tr}_b\mathrm{Tr}_s.
\]

于是每一阶展开都变成：

\[
\text{玻色迹}\times \text{自旋迹}.
\]

这一步的物理意思是：玻色子只提供传播子，自旋算符保留下来。

---

## 4. 为什么只有偶数阶贡献？

看玻色迹：

\[
\mathrm{Tr}_b
\left[
e^{-\beta H_b}
\mathcal T_\tau
a^{c_1}_{\mu_1}(\tau_1)
\cdots
a^{c_m}_{\mu_m}(\tau_m)
\right].
\]

其中 \(a^c\) 表示 \(a\) 或 \(a^\dagger\)。

自由玻色热平均中，如果湮灭算符和产生算符数目不相等，平均值为零。原因是 \(H_b\) 守玻色粒子数，而 \(a\) 改变粒子数 \(-1\)，\(a^\dagger\) 改变粒子数 \(+1\)。若总粒子数改变不为零，取迹时初末态不能相同，因此贡献为零。

所以非零项必须满足：

\[
m=2n.
\]

偶数阶中有 \(n\) 个 \(a\)，\(n\) 个 \(a^\dagger\)。

这也是为什么 Dyson 展开中的符号

\[
(-1)^m
\]

最后不会带来负号：

\[
(-1)^{2n}=+1.
\]

---

## 5. 自由玻色传播子 \(D(\omega,\tau)\)

自由玻色子在 interaction picture 中：

\[
a(\tau)=e^{\tau H_b}ae^{-\tau H_b}=e^{-\omega\tau}a,
\]

\[
a^\dagger(\tau)=e^{\tau H_b}a^\dagger e^{-\tau H_b}=e^{+\omega\tau}a^\dagger.
\]

定义热平均传播子：

\[
D(\omega,\tau-\tau')
=\left\langle
\mathcal T_\tau a(\tau)a^\dagger(\tau')
\right\rangle_b.
\]

若 \(0\le \tau-\tau'<\beta\)，则

\[
D(\omega,\tau-\tau')
=e^{-\omega(\tau-\tau')}
\langle aa^\dagger\rangle_b.
\]

自由玻色热平均中

\[
\langle a^\dagger a\rangle_b=n_B(\omega)
=\frac{1}{e^{\beta\omega}-1},
\]

\[
\langle aa^\dagger\rangle_b=1+n_B(\omega)
=\frac{1}{1-e^{-\beta\omega}}.
\]

因此

\[
\boxed{
D(\omega,\tau)
=\frac{e^{-\omega\tau}}{1-e^{-\beta\omega}},
\qquad
0\le \tau<\beta.
}
\]

并且由于虚时间是热圆周，

\[
D(\omega,\tau+\beta)=D(\omega,\tau).
\]

这个 \(D\) 就是 bath 被积掉后留下来的"记忆核"。

---

## 6. Wick 收缩：从很多玻色算符变成传播子乘积

因为 \(H_b\) 是二次型，自由玻色热平均是 Gaussian，所以可以用 Wick 定理。

比如有 \(n\) 个 \(a\) 和 \(n\) 个 \(a^\dagger\)：

\[
\left\langle
\mathcal T_\tau
a_{\mu_1}(\tau_1)\cdots a_{\mu_n}(\tau_n)
a_{\nu_1}^\dagger(\tau'_1)\cdots a_{\nu_n}^\dagger(\tau'_n)
\right\rangle_b.
\]

Wick 定理说它等于所有两两配对的和：

\[
\sum_{\pi\in S_n}
\prod_{k=1}^n
D(\omega_{\mu_k},\tau_k-\tau'_{\pi(k)})
\delta_{\mu_k,\nu_{\pi(k)}}.
\]

这里 \(\pi\) 表示一种配对方式。每个 contraction 都把一对 \(a,a^\dagger\) 换成一个传播子 \(D\)。

于是玻色子完全消失，只剩下：

\[
\text{传播子 }D
\quad\times\quad
\text{对应的自旋算符 } \rho^\dagger(\tau)\rho(\tau').
\]

---

## 7. 组合因子：为什么最后是 \(1/n!\)

原来的展开有

\[
\frac{1}{(2n)!}.
\]

但是从 \(2n\) 个相互作用顶点中选择哪些是 \(a\)，哪些是 \(a^\dagger\)，有组合因子

\[
\binom{2n}{n}.
\]

然后 Wick 收缩有 \(n!\) 种配对。

粗略地说，组合因子变成：

\[
\frac{1}{(2n)!}
\binom{2n}{n}
n!
=
\frac{1}{n!}.
\]

所以最后得到的展开具有形式

\[
\frac{1}{n!}
\left[
\int d\tau d\tau'
\sum_\mu
\rho_\mu^\dagger(\tau)
D(\omega_\mu,\tau-\tau')
\rho_\mu(\tau')
\right]^n.
\]

这就是为什么 retarded interaction 的展开阶数是 \(n\)，而每个顶点包含两个虚时间点 \(\tau,\tau'\)。

---

## 8. 重指数化：得到 retarded spin interaction

把上一节结果写完整：

\[
\frac{Z}{Z_b}
=\sum_{n=0}^{\infty}
\frac{1}{n!}
\mathrm{Tr}_s
\left\{
\mathcal T_\tau
\left[
\int_0^\beta d\tau d\tau'
\sum_\mu
\rho_\mu^\dagger(\tau)
D(\omega_\mu,\tau-\tau')
\rho_\mu(\tau')
\right]^n
\right\}.
\]

这正是指数函数的 Taylor 展开：

\[
e^A=\sum_{n=0}^{\infty}\frac{A^n}{n!}.
\]

因此

\[
Z
=
Z_b\,
\mathrm{Tr}_s
\mathcal T_\tau
e^{-\mathcal H_{\rm ret}},
\]

其中定义

\[
\boxed{
\mathcal H_{\rm ret}
=-
\int_0^\beta d\tau d\tau'
\sum_\mu
\rho_\mu^\dagger(\tau)
D(\omega_\mu,\tau-\tau')
\rho_\mu(\tau')
.
}
\]

注意这里的 \(\mathcal H_{\rm ret}\) 不是普通哈密顿量，而是已经对虚时间积分过的"作用量型"相互作用。它出现在

\[
e^{-\mathcal H_{\rm ret}}
\]

里。

这个负号很重要。因为展开中实际出现的是

\[
+
\int d\tau d\tau'\rho^\dagger D\rho,
\]

所以为了写成 \(e^{-\mathcal H_{\rm ret}}\)，必须定义

\[
\mathcal H_{\rm ret}= -\int \rho^\dagger D\rho.
\]

Weber 论文中也正是通过 interaction-picture 展开和 Wick 定理，把自旋-玻色耦合变成这个 retarded spin-spin interaction。

---

## 9. Rabi / original spin-boson 的 retarded interaction

考虑多模 Rabi / original spin-boson：

\[
H
=
H_s+
\sum_q\omega_q a_q^\dagger a_q
+
\sum_q g_q\sigma_z(a_q^\dagger+a_q).
\]

取

\[
\rho_q=g_q\sigma_z.
\]

代入通用公式：

\[
\mathcal H_{\rm ret}
=-
\int d\tau d\tau'
\sum_q
g_q^2
\sigma_z(\tau)
D(\omega_q,\tau-\tau')
\sigma_z(\tau').
\]

因为这是坐标耦合 \(a^\dagger+a\)，通常把核对称化：

\[
D_+(\omega,\tau)
=\frac12
\left[
D(\omega,\tau)+D(\omega,\beta-\tau)
\right].
\]

于是

\[
\boxed{
\mathcal H_{\rm ret}^{\rm Rabi/SB}
=-
\frac1\pi
\int_0^\infty d\omega\,J(\omega)
\int_0^\beta d\tau d\tau'\,
\sigma_z(\tau)
D_+(\omega,\tau-\tau')
\sigma_z(\tau')
.
}
\]

如果使用 \(S_z=\sigma_z/2\)，则把 \(\sigma_z\) 换成 \(S_z\)，耦合常数相应吸收因子。

这里的物理意义非常直接：在 \(\tau'\) 时刻自旋的 \(\sigma_z\) 激发了 bath；bath 经过虚时间传播到 \(\tau\)；然后在 \(\tau\) 时刻反作用到自旋的 \(\sigma_z\)。因此 bath 诱导出自旋和自身在不同时刻之间的长程相互作用。

如果是单模 Rabi，只需取

\[
J(\omega')=\pi g^2\delta(\omega'-\omega_0).
\]

此时 retarded kernel 不再是连续 bath 的幂律长程核，而是单个 oscillator 的核。算法形式上仍成立，但数值上单模 Rabi 往往直接 ED 更简单。

---

## 10. JC-like 模型的 retarded interaction

Jaynes-Cummings 型模型为

\[
H
=
-h_zS_z
+
\sum_q\omega_q a_q^\dagger a_q
+
\sum_qg_q
\left(
a_q^\dagger S_-+S_+a_q
\right).
\]

取

\[
\rho_q=g_qS_-,
\qquad
\rho_q^\dagger=g_qS_+.
\]

代入通用公式：

\[
\mathcal H_{\rm ret}^{\rm JC}
=-
\int d\tau d\tau'
\sum_qg_q^2
S_+(\tau)
D(\omega_q,\tau-\tau')
S_-(\tau').
\]

连续谱下：

\[
\boxed{
\mathcal H_{\rm ret}^{\rm JC}
=-
\frac1\pi
\int_0^\infty d\omega\,J(\omega)
\int_0^\beta d\tau d\tau'\,
S_+(\tau)
D(\omega,\tau-\tau')
S_-(\tau')
.
}
\]

注意这里不是 \(D_+\)，而是方向性的 \(D\)。原因是 JC 耦合保留了旋转波结构：

\[
a^\dagger S_-+S_+a.
\]

也就是说，bath 的产生和自旋的下降配对，bath 的湮灭和自旋的上升配对。它不是 Rabi 那种 \(a^\dagger+a\) 坐标耦合。

Weber 文中也明确写出 JC Hamiltonian 积掉 bath 后得到 \(S_+(\tau)D(\omega,\tau-\tau')S_-(\tau')\) 型 retarded interaction。

---

## 11. XXZ spin-boson 的 retarded interaction

XXZ spin-boson 是

\[
H
=
-\sum_\ell h_\ell S_\ell
+
\sum_{q,\ell}\omega_q a_{q\ell}^\dagger a_{q\ell}
+
\sum_{q,\ell}g_{q\ell}
(a_{q\ell}^\dagger+a_{q\ell})S_\ell.
\]

每个自旋分量 \(\ell=x,y,z\) 耦合到自己的 bath。

取

\[
\rho_{q\ell}=g_{q\ell}S_\ell.
\]

积掉 bath 后得到

\[
\boxed{
\mathcal H_{\rm ret}^{\rm XXZ}
=-
\frac1\pi
\sum_\ell
\int_0^\infty d\omega\,J_\ell(\omega)
\int_0^\beta d\tau d\tau'\,
S_\ell(\tau)
D_+(\omega,\tau-\tau')
S_\ell(\tau')
.
}
\]

如果

\[
J_x=J_y,
\]

也就是

\[
\lambda_x=\lambda_y\equiv\lambda_{xy},
\]

则 \(x,y\) 平面具有 XXZ 结构。

把

\[
S_xS_x+S_yS_y
\]

写成升降算符：

\[
S_x=\frac12(S_++S_-),
\]

\[
S_y=\frac{1}{2i}(S_+-S_-).
\]

于是

\[
S_x(\tau)S_x(\tau')
+
S_y(\tau)S_y(\tau')
=\frac12
\left[
S_+(\tau)S_-(\tau')
+
S_-(\tau)S_+(\tau')
\right].
\]

所以 retarded interaction 可以拆成 off-diagonal 顶点和 diagonal 顶点：

\[
h_1(\tau,\tau')
=\frac{\lambda_{xy}}{2}
\left[
S_+(\tau)S_-(\tau')
+
S_-(\tau)S_+(\tau')
\right],
\]

\[
h_2(\tau,\tau')
=C+\lambda_zS_z(\tau)S_z(\tau')
+
\frac{h_z}{2}
\left[
S_z(\tau)+S_z(\tau')
\right].
\]

这里 \(C\) 是人为加入的常数项，用来保证 Monte Carlo 权重非负。它对应

\[
C\,\mathbb 1(\tau)\mathbb 1(\tau').
\]

---

## 12. 顶点权重：为什么会有六种 vertex

在 \(S_z\) 基底中，自旋状态只有

\[
|\uparrow\rangle,\qquad |\downarrow\rangle.
\]

一个 retarded vertex 有两个时间点：

\[
\tau,\qquad \tau'.
\]

每个时间点有算符作用前、作用后的状态，因此一个 vertex 有四条腿。图像上可以想成：

\[
\text{左时间点两条腿}
\quad+\quad
\text{右时间点两条腿}.
\]

对于 XXZ / JC 型的 retarded interaction，有两类顶点：

### diagonal vertex

不改变世界线自旋状态。例如

\[
S_z(\tau)S_z(\tau')
\]

或者常数项 \(C\)。它们只给权重，不翻转自旋。

### off-diagonal vertex

会翻转自旋。例如

\[
S_+(\tau)S_-(\tau'),
\]

\[
S_-(\tau)S_+(\tau').
\]

它们让两个虚时间点的自旋同时发生翻转。

对于 XXZ 模型，六种顶点权重为：

\[
W_1=C+\frac{\lambda_z}{4}-\frac{h_z}{2},
\]

\[
W_2=W_3=C-\frac{\lambda_z}{4},
\]

\[
W_4=C+\frac{\lambda_z}{4}+\frac{h_z}{2},
\]

\[
W_5=W_6=\frac{\lambda_{xy}}{2}.
\]

为了无符号采样，需要所有权重非负。因此选择

\[
\boxed{
C\ge
\max
\left[
\frac{\lambda_z}{4},
\frac{|h_z|}{2}-\frac{\lambda_z}{4}
\right].
}
\]

这个 \(C\) 不改变物理，只是把所有 diagonal 矩阵元平移成非负数。Weber 论文中也说明，加入常数 \(C\) 是为了得到 positive weights，且 XXZ spin-boson 的顶点权重等价于 ferromagnetic XXZ 最近邻自旋模型的顶点权重。

---

## 13. JC 的顶点权重

JC 的 operator part 是

\[
h_1(\tau,\tau')
=\frac{\lambda_{xy}}{2}
S_+(\tau)S_-(\tau'),
\]

\[
h_2(\tau,\tau')
=C+
\frac{h_z}{2}
\left[
S_z(\tau)+S_z(\tau')
\right].
\]

它和 XXZ 类似，但有两个区别：

第一，

\[
\lambda_z=0.
\]

第二，只保留一个方向的 spin-flip 顶点。也就是不是

\[
S_+S_-+S_-S_+
\]

的完全对称形式，而是方向性的

\[
S_+(\tau)S_-(\tau').
\]

所以其中一个 off-diagonal vertex 的权重为零。Weber 文中也说 JC 的顶点权重类似 XXZ，但取 \(\lambda_z=0\) 且一个 \(W_5\) 类顶点为零。

---

## 14. 原始 Rabi / spin-boson 为什么有时要换基底

对 original spin-boson：

\[
H
=
-h_xS_x+
\sum_q\omega_q a_q^\dagger a_q
+
\sum_qg_q(a_q^\dagger+a_q)S_z.
\]

在 \(S_z\) 基底中，浴耦合产生的是

\[
S_z(\tau)K(\tau-\tau')S_z(\tau').
\]

这是 diagonal retarded interaction。它当然可以被积掉 bath 得到，但它不是 wormhole spin-flip 顶点。

如果希望使用 directed-loop / wormhole update 的 off-diagonal 框架，可以换到 \(S_x\) 基底。Hadamard 旋转会交换

\[
S_z\leftrightarrow S_x.
\]

于是原来的 bath coupling 变成

\[
S_x(\tau)K(\tau-\tau')S_x(\tau').
\]

而

\[
S_x=\frac12(S_++S_-).
\]

所以

\[
S_x(\tau)S_x(\tau')
=\frac14
\left[
S_+(\tau)S_+(\tau')
+
S_+(\tau)S_-(\tau')
+
S_-(\tau)S_+(\tau')
+
S_-(\tau)S_-(\tau')
\right].
\]

于是 off-diagonal part 变成

\[
\boxed{
h_1(\tau,\tau')
=\frac{\lambda_z}{4}
\left[
S_+(\tau)S_-(\tau')
+
S_-(\tau)S_+(\tau')
+
S_+(\tau)S_+(\tau')
+
S_-(\tau)S_-(\tau')
\right].
}
\]

diagonal part 变成

\[
\boxed{
h_2(\tau,\tau')
=C+
\frac{h_x}{2}
\left[
S_z(\tau)+S_z(\tau')
\right].
}
\]

只要选择

\[
C\ge \frac{|h_x|}{2},
\]

就能保证 diagonal weights 非负。

这解释了一个容易混淆的问题：

\[
\boxed{
\text{Rabi 耦合当然可以写成 }a^\dagger\rho+\rho^\dagger a,
\quad
\rho=g\sigma_z.
}
\]

但做 wormhole update 时，若想把 retarded interaction 变成 spin-flip 顶点，通常要选合适自旋基底。

---

## 15. QMC 实际采样什么？

积掉 bath 后，配分函数是

\[
Z
=
Z_b
\sum_{\mathcal C}
W(\mathcal C).
\]

一个 Monte Carlo 配置是

\[
\mathcal C=
\{n,\mathcal C_n,|\alpha\rangle\}.
\]

其中：

\[
n
\]

是展开阶数；

\[
|\alpha\rangle
\]

是初始自旋状态，比如 \(S_z\) 基底中的 \(|\uparrow\rangle\) 或 \(|\downarrow\rangle\)；

\[
\mathcal C_n=\{\nu_1,\nu_2,\ldots,\nu_n\}
\]

是顶点列表。

每个顶点

\[
\nu
\]

包含：

\[
\nu=\{t_{\rm int},v,\omega,\tau,\tau'\}.
\]

其中：

* \(t_{\rm int}\)：相互作用类型，例如 bath 顶点、磁场顶点、格点交换顶点等；
* \(v\)：具体 vertex 类型；
* \(\omega\)：被采样到的 bath 频率；
* \(\tau,\tau'\)：这个 retarded vertex 的两个虚时间点。

这说明 QMC 并不保存 boson occupation number。它保存的是：

\[
\boxed{
\text{一串由 bath propagator 连接起来的自旋顶点。}
}
\]

每个顶点都像一条"虚时间虫洞"：\(\tau\) 和 \(\tau'\) 相隔很远，但被同一个 bath propagator 连接。

---

## 16. 顶点权重的分解

单个顶点权重可以写成：

\[
\mathcal W_\nu
=\mathcal I(\omega)
P(\omega,\tau-\tau')
W_v
\,d\omega\,d\tau\,d\tau'.
\]

这里

\[
W_v
\]

是自旋 vertex 权重，比如上一节的 \(W_1,\ldots,W_6\)。

为了方便采样，把传播子和谱函数重标度为概率分布：

\[
P(\omega,\tau)=\omega D(\omega,\tau),
\]

\[
\mathcal I(\omega)
=\frac{J(\omega)/\omega}
{\int d\omega\,J(\omega)/\omega}.
\]

对幂律谱

\[
J(\omega)=2\pi\alpha\omega_c^{1-s}\omega^s,
\]

有

\[
\mathcal I(\omega)
=s\omega_c^{-s}\omega^{s-1}.
\]

这样总权重是

\[
W(\mathcal C)
=\frac{1}{n!}
\prod_{p=1}^n
\mathcal W_{\nu_p}.
\]

这里的

\[
\frac1{n!}
\]

来自展开阶数的组合因子。

---

## 17. diagonal update：加删 diagonal vertex

为了采样不同的展开阶数 \(n\)，需要 diagonal update。它的作用是：

\[
n\rightarrow n+1
\]

或

\[
n\rightarrow n-1.
\]

也就是加入或删除一个 diagonal vertex。

加入一个 diagonal vertex 的 proposal 可以这样设计：

1. 从 \([0,\beta)\) 均匀抽第一个时间 \(\tau\)；
2. 从 \(\mathcal I(\omega)\) 抽频率 \(\omega\)；
3. 从 \(P(\omega,\tau-\tau')\) 抽第二个时间差 \(\tau-\tau'\)；
4. 根据当前世界线状态判断 vertex 类型 \(v\)；
5. 用 Metropolis-Hastings 接受或拒绝。

proposal 概率密度为

\[
T_0(\mathcal C_n\to\mathcal C_{n+1})
=\frac{
\mathcal I(\omega)
P(\omega,\tau-\tau')
p_{t_{\rm int}}
d\omega\,d\tau\,d\tau'
}
{\beta(n+1)}.
\]

这里 \(p_{t_{\rm int}}\) 是选择相互作用类型的概率。若只有一种相互作用，则

\[
p_{t_{\rm int}}=1.
\]

删除一个 diagonal vertex 时，从已有 diagonal vertices 中随机选一个删除：

\[
T_0(\mathcal C_{n+1}\to\mathcal C_n)
=\frac{1}{n_2+1},
\]

其中 \(n_2\) 是原配置中的 diagonal vertex 数量。

Metropolis-Hastings 接受率为

\[
A(\mathcal C\to\mathcal C')
=\min[1,R(\mathcal C\to\mathcal C')],
\]

\[
R(\mathcal C\to\mathcal C')
=\frac{
W(\mathcal C')T_0(\mathcal C'\to\mathcal C)
}
{
W(\mathcal C)T_0(\mathcal C\to\mathcal C')
}.
\]

代入权重后，\(\mathcal I(\omega)\) 和 \(P(\omega,\tau-\tau')\) 抵消，得到加 vertex 的接受比：

\[
\boxed{
R_{\rm add}
=\frac{\beta W_v}
{(n_2+1)p_{t_{\rm int}}}.
}
\]

删 vertex 的接受比：

\[
\boxed{
R_{\rm remove}
=\frac{n_2p_{t_{\rm int}}}
{\beta W_v}.
}
\]

这就是为什么要按传播子本身去抽 \(\omega\) 和 \(\tau-\tau'\)：这样连续变量的权重已经被 proposal 吸收，接受率只剩简单的自旋 vertex 权重。Weber 文中 diagonal update 正是以 Metropolis-Hastings 加删 \(h_2(\tau,\tau')\) 顶点，并把 \(\omega,\tau-\tau'\) 按对应分布抽样。

---

## 18. 如何实际抽 \(\omega\) 和 \(\tau-\tau'\)

对幂律谱，

\[
\mathcal I(\omega)
=s\omega_c^{-s}\omega^{s-1}.
\]

其累计分布为

\[
F(\omega)
=\int_0^\omega d\omega'\,
s\omega_c^{-s}{\omega'}^{s-1}
=\left(\frac{\omega}{\omega_c}\right)^s.
\]

令

\[
F(\omega)=\xi,
\qquad \xi\in[0,1),
\]

则

\[
\omega=\omega_c \xi^{1/s}.
\]

Weber 文中写成

\[
\omega=\omega_c(1-\xi)^{1/s},
\]

这与上式等价，因为 \(1-\xi\) 仍然是 \([0,1)\) 上均匀随机数。

接着从

\[
P(\omega,\Delta\tau)=\omega D(\omega,\Delta\tau)
\]

抽

\[
\Delta\tau=\tau-\tau'.
\]

因为

\[
D(\omega,\Delta\tau)
=\frac{e^{-\omega\Delta\tau}}
{1-e^{-\beta\omega}},
\]

所以

\[
P(\omega,\Delta\tau)
=\frac{\omega e^{-\omega\Delta\tau}}
{1-e^{-\beta\omega}},
\qquad
0\le \Delta\tau<\beta.
\]

累计分布：

\[
F(\Delta\tau)
=\int_0^{\Delta\tau}
dx\,
\frac{\omega e^{-\omega x}}
{1-e^{-\beta\omega}}
=\frac{1-e^{-\omega\Delta\tau}}
{1-e^{-\beta\omega}}.
\]

令

\[
F(\Delta\tau)=\xi,
\]

得到

\[
1-e^{-\omega\Delta\tau}
=\xi(1-e^{-\beta\omega}),
\]

\[
e^{-\omega\Delta\tau}
=1-\xi(1-e^{-\beta\omega}),
\]

因此

\[
\boxed{
\Delta\tau
=-\frac1\omega
\ln
\left[
1-\xi(1-e^{-\beta\omega})
\right].
}
\]

若使用对称传播子 \(D_+\)，可以先按上式抽 \(\Delta\tau\)，然后以 \(1/2\) 概率替换为

\[
\beta-\Delta\tau.
\]

---

## 19. directed-loop update：为什么需要 wormhole

diagonal update 只能改变顶点数量，但不能高效改变整条自旋世界线。为了避免长自相关，需要 directed-loop update。

普通 directed-loop 的思想是：

1. 在随机虚时间插入一对自旋翻转算符；
2. 一个作为 tail 固定；
3. 另一个作为 head 沿世界线传播；
4. head 遇到 vertex 时，根据局部概率选择出口；
5. head 最后回到 tail，形成闭合 loop；
6. 翻转 loop 经过的所有世界线段。

对 retarded vertex，特殊之处是一个顶点含有两个时间点：

\[
\tau,\qquad \tau'.
\]

这两个点由 bath propagator 连接。

所以当 loop head 进入 \(\tau\) 处的 vertex leg 时，它可以选择从同一时间点附近出去，也可以直接通过 propagator 跳到 \(\tau'\) 处的另一个 leg 出去。

这个非局域跳跃就是

\[
\boxed{\text{wormhole update}.}
\]

直观图像：

\[
\text{loop head 在虚时间中走到 }\tau
\quad\Rightarrow\quad
\text{沿 bath propagator 瞬间跳到 }\tau'.
\]

因此它可以一次性改变相隔很远的虚时间片段，而不是靠 local update 慢慢扩散。这就是算法高效的原因。

Weber 论文中说，两个非局域相互作用算符可以作为 worm/directed loop 的 source 和 sink，从而允许 loop 在世界线配置中做非局域移动；并且构造规则等价于普通最近邻自旋模型，只是把 lattice-site index 换成 imaginary-time variables。

---

## 20. directed-loop 方程

每个 vertex 有四条腿。loop 从入口腿 \(l_1\) 进入，从出口腿 \(l_2\) 离开。

定义扩展权重：

\[
W_v(l_1,l_2).
\]

它表示：原本 vertex 类型为 \(v\)，loop 从 \(l_1\) 进、从 \(l_2\) 出的局部过程权重。

directed-loop 方程有两条：

### 局部 detailed balance

\[
\boxed{
W_v(l_1,l_2)
=W_{\bar v}(l_2,l_1).
}
\]

这里 \(\bar v\) 表示沿 loop segment 翻转后得到的新 vertex 类型。

这条式子保证正向过程和反向过程的概率平衡。

### 概率归一化

\[
\boxed{
\sum_{l_2}W_v(l_1,l_2)=W_v.
}
\]

也就是说，从入口腿 \(l_1\) 进入后，所有可能出口的权重加起来，必须等于原始 vertex 权重 \(W_v\)。

因此实际出口概率为

\[
\boxed{
P(l_1\to l_2)
=\frac{W_v(l_1,l_2)}{W_v}.
}
\]

重要的是，单个 vertex 的完整权重为

\[
\mathcal I(\omega)P(\omega,\tau-\tau')W_v.
\]

其中

\[
\mathcal I(\omega)P(\omega,\tau-\tau')
\]

对这个 vertex 的所有出口选择都是公共因子，所以在 directed-loop 方程里会抵消。

因此 loop update 只需要处理离散的 \(W_v\)，不用关心连续传播子。连续时间和 bath 频率已经在 diagonal update 中被采样了。

---

## 21. 为什么 retarded vertex 等价于最近邻 XXZ vertex

普通 SSE 中的最近邻 XXZ vertex 连接两个空间格点：

\[
i,\qquad j.
\]

retarded spin-boson 中，一个 vertex 连接两个虚时间点：

\[
\tau,\qquad \tau'.
\]

形式上：

\[
(i,j)
\quad\longleftrightarrow\quad
(\tau,\tau').
\]

普通空间最近邻 vertex 有四条腿：

\[
\text{site }i\text{ 的前后状态}
+
\text{site }j\text{ 的前后状态}.
\]

retarded vertex 也有四条腿：

\[
\text{time }\tau\text{ 的前后状态}
+
\text{time }\tau'\text{ 的前后状态}.
\]

所以 directed-loop 方程的数学结构完全相同。差别只是：

普通 XXZ：

\[
\text{loop 在空间 bond 上走。}
\]

retarded spin-boson：

\[
\text{loop 在虚时间 wormhole 上跳。}
\]

这就是 Weber 算法最漂亮的地方：它把"虚时间非局域相互作用"转化成了"类似空间 bond 的四腿顶点"。

---

## 22. 这个算法什么时候无符号？

算法能高效工作，需要以下条件：

### 条件 1：玻色 bath 必须是 Gaussian

也就是

\[
H_b=\sum_\mu\omega_\mu a_\mu^\dagger a_\mu
\]

或更一般的二次型。这样才能用 Wick 定理精确积掉 bath。

如果有

\[
a^\dagger a^\dagger aa
\]

这样的玻色相互作用，bath 不再 Gaussian，不能直接这样积掉。

### 条件 2：耦合必须对 \(a,a^\dagger\) 线性

例如：

\[
(a^\dagger+a)S_z,
\]

\[
a^\dagger S_-+S_+a.
\]

如果是非线性耦合，比如

\[
(a^\dagger+a)^2S_z,
\]

推导会变复杂，不属于这个基本框架。

### 条件 3：顶点权重可以调成非负

需要通过常数 shift \(C\) 或合适基底，让

\[
W_v\ge 0.
\]

若出现负权重或复相位，就会有 sign problem。

### 条件 4：传播子不能引入负权重

对于局域 bath 或正定谱函数，一般没问题。但如果有 boson hopping，积掉后得到空间非局域传播子，可能对不同格点有负矩阵元，从而产生 sign problem。

Weber 论文在讨论 lattice generalization 时也提醒，像 Jaynes-Cummings-Hubbard / polariton 模型中若积掉带 hopping 的 boson，非局域传播子可能有负贡献，这时更适合直接采样 boson，而不是使用该 retarded formulation。

---

## 23. 如何判断一个新模型能不能用这套算法

给定一个模型，按下面步骤判断：

### 第一步：写出 bath

如果 bath 是

\[
H_b=\sum_\mu\omega_\mu a_\mu^\dagger a_\mu,
\]

或可以对角化成这个形式，则通过第一关。

### 第二步：把耦合写成

\[
H_{sb}=\sum_\mu(a_\mu^\dagger\rho_\mu+\rho_\mu^\dagger a_\mu).
\]

例如 Rabi：

\[
g_\mu\sigma_z(a_\mu^\dagger+a_\mu)
\]

对应

\[
\rho_\mu=g_\mu\sigma_z.
\]

JC：

\[
g_\mu(a_\mu^\dagger S_-+S_+a_\mu)
\]

对应

\[
\rho_\mu=g_\mu S_-.
\]

### 第三步：积掉 bath

直接写

\[
\mathcal H_{\rm ret}
=-
\int d\tau d\tau'
\sum_\mu
\rho_\mu^\dagger(\tau)
D(\omega_\mu,\tau-\tau')
\rho_\mu(\tau').
\]

若是 \(a^\dagger+a\) 型坐标耦合，通常使用对称核：

\[
D_+(\omega,\tau)
=\frac12[D(\omega,\tau)+D(\omega,\beta-\tau)].
\]

### 第四步：换成 \(S_z\) 基底中的顶点

把 \(S_x,S_y\) 写成

\[
S_\pm=S_x\pm iS_y.
\]

找出所有非零矩阵元：

\[
\langle \alpha'|h_a|\alpha\rangle\neq0.
\]

这些就是 vertex 类型。

### 第五步：检查权重

给每个 vertex 写出 \(W_v\)。如果可以通过 \(C\) 让所有

\[
W_v\ge0,
\]

则可以无符号 QMC。

### 第六步：设计 update

* diagonal update：加删 diagonal vertex，采样 \(\omega,\tau,\tau'\)；
* directed-loop / wormhole update：用 directed-loop 方程改变世界线。

---

## 24. 和 Rabi 鞍点路线的关系

最后强调和你原来 Rabi 推导的区别。

### Rabi 鞍点路线

通常写

\[
H_{\rm Rabi}
=\frac12p^2+\frac12\omega^2q^2
+
\Gamma\sigma_x+\lambda q\sigma_z.
\]

然后构造路径积分

\[
Z=\int \mathcal Dq\,\mathcal D\mathbf n\,e^{-S[q,\mathbf n]}.
\]

接着保留 \(q(\tau)\)，处理自旋，得到光场软模、鞍点自由能、Gaussian fluctuation kernel 等。

这条路线适合研究：

\[
\omega/\Gamma\to0
\]

的 classical oscillator limit，以及软模临界行为。

### Wormhole QMC 路线

这里不保留 \(q\) 或 \(a\)，而是把它们积掉：

\[
\int \mathcal Da^\dagger\mathcal Da
\quad\Rightarrow\quad
\mathcal H_{\rm ret}[S].
\]

得到：

\[
S_\alpha(\tau)K(\tau-\tau')S_\alpha(\tau').
\]

然后采样自旋世界线。

这条路线适合研究：

* 多模 Rabi / dissipative Rabi；
* original spin-boson；
* JC bath；
* XXZ / XYZ spin-boson；
* sub-Ohmic / Ohmic bath 的低温临界行为；
* 自旋关联函数和 susceptibility；
* local moment 与 quantum critical coupling。

所以两条路线不是互相否定，而是变量选择不同：

\[
\boxed{
\text{Rabi 鞍点：保留软玻色坐标，积掉/近似自旋。}
}
\]

\[
\boxed{
\text{wormhole QMC：积掉 Gaussian bath，保留自旋世界线。}
}
\]

---

## 25. 总结

这套算法的核心推导可以压缩成一行：

\[
\boxed{
H_{sb}=a^\dagger\rho+\rho^\dagger a
\quad
\Longrightarrow
\quad
\mathcal H_{\rm ret}
=-
\int d\tau d\tau'\,
\rho^\dagger(\tau)D(\tau-\tau')\rho(\tau')
}
\]

其中：

* Rabi / original spin-boson：\(\rho=g\sigma_z\) 或 \(gS_z\)；
* JC：\(\rho=gS_-\)；
* XXZ：\(\rho_{q\ell}=g_{q\ell}S_\ell\)。

积掉 bath 后，QMC 不再采样 boson occupation，而是采样 retarded spin vertices：

\[
\nu=\{v,\omega,\tau,\tau'\}.
\]

diagonal update 负责采样

\[
\omega,\tau,\tau'
\]

和展开阶数 \(n\)；

wormhole directed-loop update 负责在自旋世界线中做非局域翻转。

因此它不是"任何模型都能算"的万能算法，而是适用于：

\[
\boxed{
\text{quadratic bath}
+
\text{linear spin-boson coupling}
+
\text{positive vertex weights}
}
\]

这一大类模型。

Rabi、JC-like、XXZ/XYZ spin-boson 都能纳入这个框架；差别只在于 \(\rho\) 的选择、是否需要对称核 \(D_+\)、是否需要换自旋基底、以及 vertex 类型和 directed-loop 方程的复杂程度。

---

> **来源**：Weber (2022), Phys. Rev. B 105, 165129 — Quantum Monte Carlo simulation of spin-boson models using wormhole updates
> **调研时间**：2026-07-09

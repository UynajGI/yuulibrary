---
title: "通过量子点接触直接测量双量子点量子比特的几何相位"
description: "Liu 等（2015）提出了通过量子点接触（QPC）电流直接读取双量子点几何相位的方案——将抽象的几何相位映射为可观测的输运电流，所有参数在实验中均可调可测（理论方案，含主方程推导）"
category: "geometric-phase"
date: 2026-07-01
author: "Bao Liu, Feng-Yang Zhang, Jie Song, He-Shan Song"
year: 2015
tags: ["几何相位", "量子点"]
links:
  - name: "DOI (Sci. Rep.)"
    url: "https://doi.org/10.1038/srep11726"
weight: 8
---

# Direct measurement on the geometric phase of a double quantum dot qubit via quantum point contact device
## 通过量子点接触直接测量双量子点量子比特的几何相位

**Bao Liu, Feng-Yang Zhang, Jie Song, He-Shan Song**

哈尔滨工业大学物理系

*Scientific Reports* **5**, 11726 (2015) | [理论方案，含级联主方程推导]

## 摘要

提出了通过量子点接触（QPC）直接读取耦合双量子点系统几何相位的方案。核心思想是将几何相位信息编码到通过 QPC 的输运电流中——QPC 对量子点上的电子占据态极其敏感，两个量子点的不同占据对应不同的 QPC 耦合强度。利用 Gurvitz 级联主方程方法，导出了双量子点几何相位与 QPC 电流之间的定量关系。表达式中所有参数在实验中均可测量或可调。该方案将量子态层析（QST）所需的复杂测量转化为简单的电流测量。

---

## 核心方案

### 模型：双量子点 + QPC 探测器

系统由三部分构成：

- **双量子点量子比特**：两个量子点能级 $E_1$、$E_2$，耦合强度 $\Omega_0$，一个电子在其中隧穿
- **QPC 器件**：左右两个电极引线，化学势差产生偏压 $V_d$，电子从左向右隧穿
- **相互作用**：量子点上的电子占据态影响 QPC 的势垒高度 → 改变耦合强度 $\Omega \leftrightarrow \Omega'$

系统总哈密顿量：

$$H_s = E_1 a_1^\dagger a_1 + E_2 a_2^\dagger a_2 + \Omega_0 (a_1^\dagger a_2 + a_2^\dagger a_1), \tag{1}$$
$$H_d = \sum_l E_l c_l^\dagger c_l + \sum_r E_r c_r^\dagger c_r, \tag{2}$$
$$H_i = \sum_{l,r} \Omega (c_l^\dagger c_r + c_r^\dagger c_l) + \sum_{l,r} \delta\Omega (a_1^\dagger a_1 c_l^\dagger c_r + \mathrm{h.c.}). \tag{3}$$

其中 $\delta\Omega = \Omega - \Omega'$ 是电子占据 $E_1$ vs $E_2$ 态时 QPC 耦合强度的差异，这是几何相位信号的物理来源。

### Gurvitz 级联主方程

使用 Gurvitz 方法从闭合系统 Schrödinger 方程导出量子比特的约化动力学：

$$\dot{\rho}_{11}^{(n)} = -D'\rho_{11}^{(n)} + D'\rho_{11}^{(n-1)} + i\Omega_0 (\rho_{12}^{(n)} - \rho_{21}^{(n)}), \tag{4}$$
$$\dot{\rho}_{22}^{(n)} = -D\rho_{22}^{(n)} + D\rho_{22}^{(n-1)} - i\Omega_0 (\rho_{12}^{(n)} - \rho_{21}^{(n)}), \tag{5}$$
$$\dot{\rho}_{12}^{(n)} = i(E_2-E_1)\rho_{12}^{(n)} + i\Omega_0 (\rho_{11}^{(n)} - \rho_{22}^{(n)}) - \tfrac{1}{2}(D'+D)\rho_{12}^{(n)} + (DD')^{1/2}\rho_{12}^{(n-1)}. \tag{6}$$

上标 $(n)$ 记录通过 QPC 的电子数。$D = 2\pi|\Omega|^2 \rho_l \rho_r V_d$（和 $D'$）是两种电子占据态下的 QPC 隧穿率。

### 几何相位 → 电流表达式

对 $(n)$ 求和得到标准主方程后，可以计算通过 QPC 的稳态电流 $I$。**核心结果**：电流依赖于量子比特的相干性 $\rho_{12}$，而 $\rho_{12}$ 的相位包含了演化路径的几何相位信息。

推导的电流表达式将几何相位映射为可观测的电流差：

$$\gamma_g \propto \arctan\left(\frac{\langle y \rangle}{\langle x \rangle}\right) \quad \leftrightarrow \quad \Delta I_{\mathrm{QPC}}$$

方案的实验可行性在于：QPC 电流测量是半导体量子点实验中的**标准技术**，不需要额外的量子态层析能力。

{{< callout type="important" title="方案核心创新" >}}
将几何相位这一"量子"可观测量转化为 QPC 电流这一"经典"可观测量，显著降低了实验复杂度和对量子操控精度的要求。
{{< /callout >}}

### 与超导平台测量方案的对比

| | Leek 2007 | Zhang 2017 | Liu 2015 (本文) |
|---|---|---|---|
| 平台 | 超导 transmon | 超导 phase qubit | **半导体量子点** |
| 测量方法 | 量子态层析 (QST) | QST + Bloch 轨迹 | **QPC 电流测量** |
| 测量复杂度 | 高（需要全态重建） | 高 | **低（单次电流读取）** |
| 退相干限制 | $T_1 = 7\ \mu\mathrm{s}$ | $T_1 = 270\ \mathrm{ns}$ | **由电极偏压决定** |

---

## 阅读笔记

### 一句话概括

将双量子点量子比特的几何相位映射为 QPC 电流——用标准半导体输运技术替代复杂的量子态层析。

### 核心论证链

1. 双量子点是一个电荷量子比特 → 电子在不同量子点上的占据形成叠加态
2. QPC 电流对量子点的电荷态高度敏感 → 可以用作量子比特的**连续弱测量**
3. 量子比特的相干性 $\rho_{12}$ 直接出现在 QPC 电流表达式中 → 电流编码了相位信息
4. 演化路径控制的几何相位将改变 $\rho_{12}$ 的幅角 → 电流变化 = 几何相位的直接读出
5. Gurvitz 级联主方程提供了完整的理论框架（含反作用/退相干）

### 批判性思考

1. **QPC 测量的反作用**：QPC 作为探测器会对量子比特产生退相干（dephasing）——方案中虽然考虑了反作用，但在实际实验中测量强度和信号质量之间存在 trade-off
2. **与超导实验的互补性**：半导体量子点平台的优势在于成熟的输运测量技术，劣势在于相干时间（$T_2^*$ 通常远短于超导量子比特）
3. **实验实现状态**：截至 2026 年，该方案似乎尚未有实验实现的报道；半导体量子点的几何相位实验仍是一个待填补的空白

### 局限性

- 纯理论方案，尚未实验验证
- QPC 连续弱测量引入的退相干限制了可观测的演化周期数
- 方案依赖于特定参数区间（$D$ vs $D'$ 的比值需可调）
- 量子点平台本身的高退相干率可能使几何相位的观测更为困难

### 关键公式速查

| 公式 | 含义 |
|------|------|
| $\delta\Omega = \Omega - \Omega'$ | QPC 耦合差异（信号来源） |
| Eq. (4)-(6) | Gurvitz 级联主方程 |
| $D = 2\pi|\Omega|^2 \rho_l \rho_r V_d$ | QPC 隧穿率 |
| $\gamma_g \simeq S/2 = \pi(1-\cos\theta_0)$ | 双量子点几何相位（Bloch 球立体角的一半） |

### 延伸阅读

- **[Leek et al. 2007, Science](/papers/berry-phase-solid-state-qubit/)** — 超导平台首次实验：Berry 相位观测
- **[Zhang et al. 2017, PRA](/papers/zhang2017-sta-berry-phase/)** — 超导平台快速测量：STA 协议
- **[Valahu et al. 2023, Nat. Chem.](/papers/valahu2023-conical-intersection-geometric-phase/)** — 离子阱平台：锥形交叉点几何相位

### 术语对照

| 中文 | 英文 | 含义 |
|------|------|------|
| 量子点接触 | quantum point contact (QPC) | 纳米尺度收缩区，通过电流反映邻近电荷态 |
| 级联主方程 | hierarchical master equation | Gurvitz 方法：用通过 QPC 的电子数索引约化密度矩阵 |
| 连续弱测量 | continuous weak measurement | 通过 QPC 电流持续获取量子比特的部分信息 |

---
title: "基于可调耦合器的串扰鲁棒超导双量子比特几何门"
description: "Deng 等（2026）利用可调耦合器实现串扰鲁棒的超导双量子比特几何门——解决了多量子比特系统中 ZZ 串扰对几何门保真度的限制（理论方案）"
category: "geometric-phase"
date: 2026-07-01
author: "Bo-Xun Deng, Jia-Qi Hu, Cheng-Yun Ding, Zheng-Yuan Xue, Tao Chen"
year: 2026
tags: ["几何量子计算", "电路QED", "超导量子比特"]
links:
  - name: "DOI (Front. Phys.)"
    url: "https://doi.org/10.15302/frontphys.2026.103205"
weight: 12
---

# Crosstalk-robust superconducting two-qubit geometric gates using tunable couplers
## 基于可调耦合器的串扰鲁棒超导双量子比特几何门

**Bo-Xun Deng, Jia-Qi Hu, Cheng-Yun Ding, Zheng-Yuan Xue, Tao Chen**

华南师范大学

*Frontiers of Physics* (2026) | [理论方案]

## 摘要

多量子比特系统中的 ZZ 串扰（crosstalk）是限制双量子比特门保真度的关键问题。当两个量子比特处于频率失谐时，残余 ZZ 耦合导致条件相位误差。本文首次将**可调耦合器**（tunable coupler）技术引入几何量子计算——通过调制可调耦合器的频率，在保持两量子比特有效耦合的同时动态抑制 ZZ 串扰。这为超导芯片上的可扩展几何量子计算提供了更贴近实际硬件的方案。

## 核心方案

### ZZ 串扰的来源

在固定耦合的 transmon 对中，即使量子比特处于频率失谐态，它们之间的电容耦合仍产生残余 ZZ 相互作用：

$$H_{ZZ} = \zeta \sigma_z \otimes \sigma_z$$

其中 $\zeta \propto g^2 / (\Delta^2 - \alpha\Delta)$（$g$ 为耦合强度，$\Delta$ 为频率差，$\alpha$ 为非谐性）。当多量子比特同时操作时，这种串扰会导致邻近量子比特的错误相位累积。

### 可调耦合器方案

使用可调耦合器（tunable coupler，如频率可调的 transmon 介于两个固定频率 transmon 之间），通过调制耦合器的频率 $\omega_c(t)$：

- **门操作期间**：$\omega_c$ 调至近共振 → 有效耦合 $g_{\mathrm{eff}}$ 最大化 → 快速几何门
- **空闲期间**：$\omega_c$ 调至远失谐 → $g_{\mathrm{eff}} \to 0$ → ZZ 串扰被抑制

$$g_{\mathrm{eff}} = \frac{g_{1c} g_{2c}}{2} \left(\frac{1}{\Delta_{1c}} + \frac{1}{\Delta_{2c}}\right)$$

其中 $\Delta_{ic} = \omega_i - \omega_c$。

### 为什么这对几何门特别重要？

几何门对**演化路径的精确控制**有更高要求——ZZ 串扰在门操作期间持续扰动路径，会导致几何相位的系统性偏移。使用可调耦合器可以在门操作期间精确控制耦合强度，确保路径的几何纯度。

---

## 阅读笔记

### 一句话概括

将可调耦合器引入几何量子计算，解决了多量子比特系统中 ZZ 串扰对几何门保真度的限制，使方案更贴近实际超导硬件架构。

### 核心论证链

1. 固定耦合 transmon 架构中 ZZ 串扰不可避免 → 限制几何门保真度
2. 可调耦合器可以提供**动态可控的两体耦合** → 门操作时强耦合，空闲时零耦合
3. 几何门利用反演设计 + 可调耦合 → 在保持速度的同时抑制串扰

### 这项工作的现实意义

Google、IBM 等超导量子计算团队从 2019 年开始广泛采用可调耦合器架构（如 Google Sycamore 的 gmon 耦合器）。将几何量子计算的理论框架适配到这一主流硬件架构上，是几何门从理论走向大规模集成的必要步骤。

### 局限性

- 纯理论方案，模拟参数偏理想
- 未讨论可调耦合器本身引入的额外噪声（耦合器 flux 噪声）
- 与 Zheng-Yuan Xue 组此前的理论工作高度重叠（Xu 2020 → Ding 2022 → Liang 2024 → 本文 = 同一框架的不同变体）

### 延伸阅读

- **[Ding et al. 2022, QST](/papers/ding2022-path-optimized/)** — 同组的路径优化方案
- **[Zhao et al. 2021, Sci. China](/papers/zhao2021-xmon-geometric-gates/)** — 实验实现（固定耦合）

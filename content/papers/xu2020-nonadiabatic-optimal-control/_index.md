---
title: "超导电路上最优控制非绝热几何量子计算"
description: "Xu 等（2020）提出了超导电路上结合最优控制的非绝热几何量子计算方案，实现了鲁棒的单/双量子比特几何门（理论方案）"
date: 2026-07-01
author: "Jing Xu, Sai Li, Tao Chen, Zheng-Yuan Xue"
year: 2020
tags: ["几何量子计算", "超导量子比特", "最优控制"]
links:
  - name: "DOI (Front. Phys.)"
    url: "https://doi.org/10.1007/s11467-020-0976-2"
weight: 6
---

# Nonadiabatic geometric quantum computation with optimal control on superconducting circuits
## 超导电路上最优控制非绝热几何量子计算

**Jing Xu, Sai Li, Tao Chen, Zheng-Yuan Xue**

华南师范大学 · 广东省量子工程与量子材料重点实验室

*Frontiers of Physics* **15**, 41601 (2020) | [理论方案]

## 摘要

量子门非常脆弱，实现高保真度的鲁棒量子门是量子操控的终极目标。本文提出了超导电路上的非绝热几何量子计算方案：transmon 单量子比特门通过时变振幅和相位的共振微波驱动实现，双量子比特门通过电容耦合 transmon 的频率调制实现。该方案结合了几何相位的鲁棒性与最优控制技术，可进一步增强门的鲁棒性。

---

## 核心方案

### 单量子比特门

使用的哈密顿量与 Zhao 2021 类似，但引入**最优控制**来优化脉冲形状：

$$H(t) = \Omega(t) e^{-i\phi(t)} |0\rangle\langle 1| + \mathrm{H.c.}$$

其中 $\Omega(t)$ 和 $\phi(t)$ 均为时变的。通过构造满足循环演化条件的脉冲，实现任意几何单量子比特门。

### 双量子比特门

通过调制其中一个 transmon 的频率来实现有效共振耦合，从而实现非平凡的几何双量子比特门。

![](images/fig1.webp)
{{< caption >}}图 1：单量子比特几何量子门的示意图。(a) transmon 能级结构。(b) Bloch 球上的演化路径。{{< /caption >}}

### 最优控制增强鲁棒性

![](images/fig2.webp)
{{< caption >}}图 2：几何门的性能比较。引入最优控制（$\eta > 0$）后，门对频率失谐误差的鲁棒性显著增强。{{< /caption >}}

---

## 阅读笔记

### 一句话概括

将最优控制技术与非绝热几何量子计算结合，在超导电路上实现了鲁棒性可调的单/双量子比特几何门。

### 核心论证链

1. 几何门已具有内在噪声鲁棒性，但仍有改进空间
2. 引入最优控制（优化 $\Omega(t)$ 和 $\phi(t)$ 的脉冲形状）→ 进一步增强鲁棒性
3. 单量子比特门：transmon + 共振微波驱动
4. 双量子比特门：电容耦合 + 频率调制

### 与实验论文的关系

Xu 2020 为 Zhao 2021 等实验实现提供了理论基础。Zheng-Yuan Xue 组（华南师大）是超导几何量子计算领域的主要理论组之一。

### 延伸阅读

- **[Zhao et al. 2021, Sci. China](/papers/zhao2021-xmon-geometric-gates/)** — 实验实现版本
- **[Ding et al. 2022, QST](/papers/ding2022-path-optimized/)** — 路径优化版

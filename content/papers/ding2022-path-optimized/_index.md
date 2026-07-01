---
title: "超导量子比特上的路径优化非绝热几何量子计算"
description: "Ding 等（2022）提出了路径优化的非绝热几何量子计算方案，通过优化演化路径减少了门时间并增强了鲁棒性（理论方案，含实验可行性讨论）"
date: 2026-07-01
author: "Cheng-Yun Ding, Li-Na Ji, Tao Chen, Zheng-Yuan Xue"
year: 2022
tags: ["几何量子计算", "超导量子比特", "路径优化"]
links:
  - name: "DOI (Quantum Sci. Technol.)"
    url: "https://doi.org/10.1088/2058-9565/ac3621"
weight: 7
---

# Path-optimized nonadiabatic geometric quantum computation on superconducting qubits
## 超导量子比特上的路径优化非绝热几何量子计算

**Cheng-Yun Ding, Li-Na Ji, Tao Chen, Zheng-Yuan Xue**

华南师范大学 · 广东省量子工程与量子材料重点实验室

*Quantum Sci. Technol.* **7**, 015016 (2022) | [理论方案]

## 摘要

非绝热几何量子计算虽具有速度和鲁棒性优势，但受限于特定的演化路径，门时间通常比传统动力学门更长，导致鲁棒性减弱和保真度降低。本文提出了路径优化的非绝热几何量子计算方案，通过优化 Bloch 球上量子态演化的路径来减少门时间。数值模拟表明，优化后的 S、T 和 Hadamard 门对多种误差源的鲁棒性显著优于传统方案。

---

## 核心方案

### 路径优化原理

传统非绝热几何门限制量子态沿特定路径（如测地线）演化。本文放松了这一限制，允许在更大的参数空间中优化路径：

- **目标**：最小化门时间 + 最大化对特定噪声的鲁棒性
- **方法**：数值优化 Bloch 球上的演化路径
- **结果**：更短的门时间、更强的鲁棒性

![](images/fig1.webp)
{{< caption >}}图 1：超导 transmon 上的实现方案——能级结构和耦合示意图。{{< /caption >}}

![](images/fig2.webp)
{{< caption >}}图 2：路径优化后的几何门保真度对比。优化方案（圆点）在多种误差下均优于传统方案（方块）。{{< /caption >}}

---

## 阅读笔记

### 一句话概括

通过数值优化演化路径来缩短非绝热几何门的门时间，在保持几何鲁棒性的同时显著提升了门的性能。

### 与实验论文的关系

Ding 2022 为**纯理论/数值方案**，尚未在实验上验证。该方案为后续实验实现提供了更优的脉冲设计方法论。与 Xu 2020 同属 Zheng-Yuan Xue 组的理论工作。

### 延伸阅读

- **[Xu et al. 2020, Front. Phys.](/papers/xu2020-nonadiabatic-optimal-control/)** — 最优控制方案
- **[Zhao et al. 2021, Sci. China](/papers/zhao2021-xmon-geometric-gates/)** — 实验实现

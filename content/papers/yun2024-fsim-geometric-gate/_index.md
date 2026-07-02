---
title: "超导电路中一步实现非绝热几何 fSim 门"
description: "Yun 等（2024）提出在超导电路中一步实现非绝热几何 fSim 门（CZ + iSWAP 组合门）的方案——首次将几何相位鲁棒性应用于 fSim 门，减少门时间和控制误差敏感性（理论方案）"
date: 2026-07-01
author: "M.-R. Yun, Zheng Shan, Li-Li Sun, L.-L. Yan, Yu Jia, S.-L. Su, G. Chen"
year: 2024
tags: ["几何量子计算", "电路QED", "超导量子比特"]
links:
  - name: "DOI (PRA)"
    url: "https://doi.org/10.1103/PhysRevA.110.022608"
weight: 11
---

# One-step implementation of nonadiabatic geometric fSim gate in superconducting circuits
## 超导电路中一步实现非绝热几何 fSim 门

**M.-R. Yun, Zheng Shan, Li-Li Sun, L.-L. Yan, Yu Jia, S.-L. Su, G. Chen**

郑州大学 · 河南科学院

*Physical Review A* **110**, 022608 (2024) | [理论方案]

## 摘要

fSim 门（fermionic simulation gate）因其在减少量子算法深度方面的显著优势而备受关注：$U_{\mathrm{fSim}} = \text{CZ} \cdot \text{iSWAP}^\theta$。然而在实现中，控制参数波动和退相干会导致保真度下降。本文首次将非绝热几何相位的鲁棒性应用于 fSim 门，提出在超导电路中**一步**实现几何 fSim 门的方案——CZ 子门和 iSWAP 子门在同一脉冲中同时生成，而非分步级联。

## 核心方案

### fSim 门的结构

fSim 门在计算基 $\{|00\rangle, |01\rangle, |10\rangle, |11\rangle\}$ 下的矩阵形式：

$$U_{\mathrm{fSim}}(\theta, \phi) = \begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & \cos\theta & -i\sin\theta & 0 \\ 0 & -i\sin\theta & \cos\theta & 0 \\ 0 & 0 & 0 & e^{-i\phi} \end{pmatrix}$$

其中 iSWAP 子门控制 $\theta$（$|01\rangle \leftrightarrow |10\rangle$ 的子空间旋转角），CZ 子门控制 $\phi$（条件相位）。

### 一步非绝热几何实现

方案使用 dressed-state 框架，在 $|01\rangle \leftrightarrow |10\rangle$ 子空间中构造循环演化，通过反演设计同时实现 iSWAP 旋转角 $\theta$ 和条件相位 $\phi$ 的几何积累。**一步**（one-step）意味着不需要将 iSWAP 和 CZ 拆分为两个独立的门操作——减少了总门时间和对中间态累积误差的敏感性。

### 门性能

数值模拟表明：
- 对控制参数波动（$\sim$5% error）具有显著优于动力学 fSim 门的鲁棒性
- 门时间与标准动力学 fSim 门相当（$\sim$100 ns 量级）
- 可以扩展到更多量子比特的耦合结构中

---

## 阅读笔记

### 一句话概括

首次将非绝热几何相位的鲁棒性扩展到 fSim 门（iSWAP + CZ 的组合），在超导电路中用一步脉冲实现。

### 为什么 fSim 门重要？

fSim 门是 Google Sycamore 量子优势实验中使用的核心双量子比特门。它的优势在于：
1. 同时生成纠缠和条件相位 → 减少电路深度
2. 在 fermionic 模拟（量子化学）中特别有用
3. 可以作为通用双量子比特门

### 局限性

- 纯理论方案，距离实验实现还有距离
- 未讨论 transmon 的弱非谐性对 fSim 门的影响（泄漏到 $|02\rangle$、$|20\rangle$ 态）
- 与 Google Sycamore 实验中使用的高保真度（99.8%+）动力学 fSim 门相比，几何版本的实验优势尚未验证

### 延伸阅读

- **[Zhao et al. 2021, Sci. China](/papers/zhao2021-xmon-geometric-gates/)** — 单量子比特几何门实验
- **[Xu et al. 2020, Front. Phys.](/papers/xu2020-nonadiabatic-optimal-control/)** — 含双量子比特几何门方案的先驱工作

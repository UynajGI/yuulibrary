---
title: "锥形交叉点动力学中几何相位干涉的直接观测"
description: "Valahu 等（2023）在可编程离子阱量子模拟器中首次直接观测到了锥形交叉点周围波包动力学中的几何相位干涉效应（Nature Chemistry 实验）"
date: 2026-07-01
author: "C. H. Valahu, V. C. Olaya-Agudelo, R. J. MacDonell, T. Navickas, A. D. Rao, M. J. Millican, J. B. Pérez-Sánchez, J. Yuen-Zhou, M. J. Biercuk, C. Hempel, T. R. Tan, I. Kassal"
year: 2023
tags: ["几何相位", "离子阱", "锥形交叉点", "量子模拟"]
links:
  - name: "DOI (Nat. Chem.)"
    url: "https://doi.org/10.1038/s41557-023-01300-3"
  - name: "arXiv"
    url: "https://arxiv.org/abs/2211.07320"
weight: 9
---

# Direct observation of geometric-phase interference in dynamics around a conical intersection
## 锥形交叉点动力学中几何相位干涉的直接观测

**C. H. Valahu, V. C. Olaya-Agudelo, R. J. MacDonell 等**

悉尼大学 · ARC 量子系统工程卓越中心 · UCSD · ETH Zurich

*Nature Chemistry* **15**, 1503–1508 (2023) | 🔴 实验

## 摘要

锥形交叉点（conical intersections）在化学和物理中广泛存在，控制着光收集、视觉、光催化和化学反应性等过程。当反应路径环绕锥形交叉点时，分子波函数会受到几何相位的影响，通过量子力学干涉改变反应结果。以往实验只在散射模式和光谱可观测量中检测到几何相位的间接信号，从未直接观测到底层的波包干涉。本文在可编程离子阱量子模拟器中，首次直接观测到了一个**工程化锥形交叉点**周围波包动力学中的几何相位干涉。实验开发了一种重建囚禁离子二维波包密度的技术，结果与理论模型一致，证明了类比量子模拟器精确描述核量子效应的能力。

---

## 实验方案

### 离子阱量子模拟器

实验使用 **$^{171}\mathrm{Yb}^+$ 离子阱**量子模拟器，通过映射关系将化学系统的锥形交叉点动力学编码到离子的内部和运动自由度中：

- 离子的两个内部电子态模拟分子的两个电子态
- 离子的两个简谐振动模式模拟分子的两个核振动模式
- 激光驱动的耦合模拟非绝热耦合

### 几何相位干涉

当波包沿环绕锥形交叉点的闭合路径演化时，几何相位导致波函数获得一个 $\pi$ 相移。两条路径（顺时针 vs 逆时针）的干涉产生**破坏性干涉**——这是几何相位的直接指纹。

{{< rough-canvas width="600" height="320" id="valahu-conical" >}}

<script>
document.addEventListener("DOMContentLoaded", function () {
  const rc = rough.canvas(document.getElementById("valahu-conical"));
  const ctx = document.getElementById("valahu-conical").getContext("2d");

  // Upper energy surface (cone top)
  const apexX = 320, apexY = 140;
  rc.line(apexX, apexY, 160, 280, { roughness: 1.3, stroke: "#007aff", strokeWidth: 2 });
  rc.line(apexX, apexY, 480, 280, { roughness: 1.3, stroke: "#007aff", strokeWidth: 2 });
  // Lower surface
  rc.line(apexX, apexY, 220, 260, { roughness: 1.3, stroke: "#ff9500", strokeWidth: 2 });
  rc.line(apexX, apexY, 420, 260, { roughness: 1.3, stroke: "#ff9500", strokeWidth: 2 });
  // Dashed back edges
  rc.line(apexX, apexY, 180, 200, { roughness: 1.0, stroke: "#007aff60", strokeWidth: 1.5 });
  rc.line(apexX, apexY, 460, 200, { roughness: 1.0, stroke: "#ff950060", strokeWidth: 1.5 });

  // Closed path encircling the conical intersection (on lower surface)
  rc.ellipse(apexX, apexY+100, 160, 35, { roughness: 1.6, stroke: "#ff3b30", strokeWidth: 2.5 });

  // Arrow on path
  ctx.fillStyle = "#ff3b30"; ctx.font = "14px monospace";
  ctx.fillText("C (环绕路径)", apexX-50, apexY+145);

  // Axes labels
  ctx.fillStyle = "#86868b"; ctx.font = "13px monospace";
  ctx.fillText("q₁ (核坐标1)", 140, 295);
  ctx.fillText("q₂ (核坐标2)", 490, 295);
  ctx.fillStyle = "#007aff";
  ctx.fillText("E₊ (激发态)", 490, 165);
  ctx.fillStyle = "#ff9500";
  ctx.fillText("E₋ (基态)", 490, 240);

  // Conical intersection point
  rc.circle(apexX-3, apexY-3, 8, { roughness: 0.8, fill: "#ff3b30", stroke: "#ff3b30" });
  ctx.fillStyle = "#ff3b30"; ctx.font = "15px monospace";
  ctx.fillText("锥形交叉点", apexX-45, apexY-15);

  // Left side: wavepacket interference annotation
  ctx.fillStyle = "#86868b"; ctx.font = "13px monospace";
  ctx.fillText("绕C一圈 → 波函数相位+π", 30, 100);
  ctx.fillText("两条反方向路径干涉:", 30, 125);
  ctx.fillText("|ψ⟩_cw + |ψ⟩_ccw = 0", 30, 150);
  ctx.fillStyle = "#ff3b30"; ctx.font = "15px monospace";
  ctx.fillText("← 破坏性干涉 (几何相位指纹)", 30, 180);
});
</script>

![](images/fig1.webp)
{{< caption >}}实验示意：离子阱中的工程化锥形交叉点，波包绕锥形交叉点演化的两条路径。{{< /caption >}}

---

## 阅读笔记

### 一句话概括

首次在离子阱量子模拟器中直接观测到了锥形交叉点周围几何相位导致的波包干涉——从"间接信号"到"直接观测"的跨越。

### 与传统 Berry 相位实验的关系

| | Leek 2007 | 本文 (2023) |
|---|---|---|
| 平台 | 超导量子比特 | **离子阱** |
| 几何相位来源 | 外加磁场旋转 | **锥形交叉点（分子动力学）** |
| 应用场景 | 量子计算 | **化学动力学** |
| 核心观测 | Berry 相位累积 | **几何相位干涉图样** |

这是 Berry 相位研究从"量子计算"到"化学物理"的跨学科延伸。

### 延伸阅读

- **[Leek et al. 2007, Science](/papers/berry-phase-solid-state-qubit/)** — Berry 相位在固态中的首次观测
- **Berry 1984, Proc. R. Soc. Lond. A** — Berry 相位的原始论文

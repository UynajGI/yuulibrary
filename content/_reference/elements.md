---
title: "元素速查"
description: "所有内容元素 shortcode 的用法与效果"
date: 2026-06-23
weight: 1
---

本页列出全部内容元素 shortcode 的用法与实际渲染效果，供编写书籍/笔记时速查。

## 提示框 callout

用于强调提示、注意事项、业界事例。`type` 控制配色。

```
{{</* callout type="tip" title="标题（可选）" */>}}
内容……
{{</* /callout */>}}
```

| type | 配色 | 用途 |
|------|------|------|
| `tip` | 蓝 💙 | 小提示、最佳实践 |
| `note` | 灰 ⬜ | 一般说明、业界事例 |
| `warning` | 橙 🟠 | 警告、易错点 |
| `important` | 红 🔴 | 重要、必读 |

{{< callout type="tip" title="提示" >}}
这是一个 tip 提示框。用于补充有用的小技巧。
{{< /callout >}}

{{< callout type="warning" title="注意" >}}
不要混淆 $P(s'|s,a)$ 和 $P(s'|s)$——前者依赖动作，后者不依赖。
{{< /callout >}}

{{< callout type="note" title="业界事例 1-1" >}}
业界事例用 note 类型，标题带编号。
{{< /callout >}}

## 定义 definition

教材中引入新概念时使用。

```
{{</* definition title="马尔可夫决策过程" */>}}
定义内容……
{{</* /definition */>}}
```

{{< definition title="马尔可夫决策过程（MDP）" >}}
一个 MDP 由状态集 $S$、动作集 $A$、转移概率 $P(s'|s,a)$、奖励函数 $R$ 和折扣因子 $\gamma$ 组成。其核心性质是**马尔可夫性**：未来只取决于当前状态和动作，与历史无关。
{{< /definition >}}

## 定理 theorem

用于定理、引理、命题、推论。`type` 可选（默认"定理"）。

```
{{</* theorem type="引理" title="贝尔曼最优方程" */>}}
陈述……
{{</* /theorem */>}}
```

{{< theorem type="定理" title="贝尔曼最优方程" >}}
最优状态价值函数满足：
$$
V^*(s) = \max_a \sum_{s'} P(s'|s,a) \left[ R(s,a,s') + \gamma V^*(s') \right]
$$
{{< /theorem >}}

## 例题 example

用于例题，**可嵌套 `{{</* solution */>}}`** 显示解答。

```
{{</* example title="例5-1" */>}}
题目描述……

{{</* solution */>}}
解答过程……
{{</* /solution */>}}

{{</* /example */>}}
```

{{< example title="例1-1 远期合约收益" >}}
假设今天是1月15日，某加工商知道在5月15日需要100000磅铜。即期铜价为每磅340美分，5月份期货合约为每磅320美分。该加工商应如何对冲？

{{< solution >}}
进入4份期货合约多头（每份25000磅），锁定价格在每磅320美分。整体费用约 $320000$ 美元，无论5月即期价格如何变动。
{{< /solution >}}
{{< /example >}}

## 解答块 solution

独立使用（不嵌套在 example 内时），用于习题解答。

```
{{</* solution */>}}
解答：……
{{</* /solution */>}}
```

{{< solution >}}
独立解答块。绿色左边框，内部可写 Markdown 和数学公式 $E[X] = \sum p_i x_i$。
{{< /solution >}}

## 图注 caption

紧接图片或表格之后，居中显示。

```
![](images/figure.jpg)
{{</* caption */>}}图5.1　Sarsa 算法示意图{{</* /caption */>}}
```

![](/yuulibrary/books/rl-intro/images/b7edf9c7eb8d4cfb8e5ff3a5e3a0d8a0e5f1c2d3e4b5a6f7c8d9e0f1a2b3c4d5.jpg)
{{< caption >}}示例图注：这是一张示意图{{< /caption >}}

## 要点 key-point

章节末的要点总结。

```
{{</* key-point */>}}
本章要点……
{{</* /key-point */>}}
```

{{< key-point >}}
- 远期合约收益 = $S_T - K$（多头）或 $K - S_T$（空头）
- 期货每天结算，远期只在到期日结算
- 对冲用期货锁定未来买入/卖出价格
{{< /key-point >}}

## 算法块 algorithm

包裹 pseudocode.js 的 `<pre class="pseudocode">`，统一框式外观。

```
{{</* algorithm title="Sarsa 算法" */>}}
<pre class="pseudocode">
\begin{algorithm}
\caption{算法 1: Sarsa}
\begin{algorithmic}
state 输入: episodes, α, γ
for{each episode}
    state S ← first state
    repeat
        state Q(S, A) ← Q(S, A) + α(R + γQ(S', A') - Q(S, A))
    until{S is terminal state}
endfor
\end{algorithmic}
\end{algorithm}
</pre>
{{</* /algorithm */>}}
```

{{< algorithm title="Sarsa 算法" >}}
<pre class="pseudocode">
\begin{algorithm}
\caption{算法 1: Sarsa}
\begin{algorithmic}
\REQUIRE episodes, $\alpha$, $\gamma$
\FOR{each episode}
    \STATE $S \leftarrow$ first state
    \REPEAT
        \STATE $Q(S, A) \leftarrow Q(S, A) + \alpha(R + \gamma Q(S', A') - Q(S, A))$
    \UNTIL{$S$ is terminal state}
\ENDFOR
\end{algorithmic}
\end{algorithm}
</pre>
{{< /algorithm >}}

---

## 手绘图形 rough-canvas

用 rough.js 创建手绘风格的 Canvas 图形。

```
{{</* rough-canvas width="600" height="400" id="my-sketch" */>}}

<script>
document.addEventListener("DOMContentLoaded", function () {
  const rc = rough.canvas(document.getElementById("my-sketch"));
  rc.circle(80, 80, 60, { roughness: 1.2, fill: "rgba(52,199,89,0.15)", stroke: "#34c759" });
  rc.rectangle(200, 40, 140, 80, { roughness: 1.5, fill: "rgba(0,122,255,0.1)", stroke: "#007aff" });
  rc.line(400, 30, 520, 150, { roughness: 1 });
});
</script>
```

{{< rough-canvas width="600" height="180" id="demo-canvas" >}}

<script>
document.addEventListener("DOMContentLoaded", function () {
  const rc = rough.canvas(document.getElementById("demo-canvas"));
  rc.circle(80, 90, 60, { roughness: 1.2, fill: "rgba(52,199,89,0.15)", stroke: "#34c759", strokeWidth: 2 });
  rc.rectangle(200, 50, 140, 80, { roughness: 1.5, fill: "rgba(0,122,255,0.1)", stroke: "#007aff", strokeWidth: 2 });
  rc.ellipse(440, 90, 70, 50, { roughness: 1.3, fill: "rgba(255,149,0,0.1)", stroke: "#ff9500", strokeWidth: 2 });
  rc.line(400, 30, 520, 150, { roughness: 1.8, stroke: "#ff3b30", strokeWidth: 2 });
});
</script>

常用形状：`rectangle(x, y, w, h)` / `circle(cx, cy, d)` / `ellipse(cx, cy, w, h)` / `line(x1, y1, x2, y2)` / `path(d)` / `curve(points)` / `arc(cx, cy, w, h, start, stop)` / `linearPath(points)` / `polygon(vertices)`。

`roughness` 控制手绘程度（0=直线，~2=潦草），`fill` / `stroke` / `strokeWidth` 控制样式。

**注意**：Canvas 的 `width`/`height` 属性定义画布分辨率，CSS 控制显示大小。如需 Retina 清晰度，将属性值设为显示尺寸的 2 倍。

---

## 标签 tags

笔记/论文的 `front matter` 设 `tags`，自动聚合到 `/tags/`。

```yaml
---
title: "笔记标题"
date: 2026-06-23
tags: ["概率论", "面试"]
---
```

## 数学公式

行内 `$...$`，行间 `$$...$$`。Goldmark passthrough 原样透传给 KaTeX，`_`/`^`/`*` 不会被解析为 Markdown。

行内：$E[X] = \sum_{i} p_i x_i$

行间：
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## 代码块

标 `python`（或其他语言）才有语法高亮：

````markdown
```python
def value_iteration(V, theta=1e-6):
    while True:
        delta = 0
        for s in states:
            v = V[s]
            V[s] = max(q_value(s, a) for a in actions)
            delta = max(delta, abs(v - V[s]))
        if delta < theta:
            break
    return V
```
````

```python
def value_iteration(V, theta=1e-6):
    while True:
        delta = 0
        for s in states:
            v = V[s]
            V[s] = max(q_value(s, a) for a in actions)
            delta = max(delta, abs(v - V[s]))
        if delta < theta:
            break
    return V
```

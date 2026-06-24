---
title: "附录"
weight: 110
description: "概率论基础、测度论、序列收敛性、梯度下降。"
---

# 附录

## ◇ 随机变量（random variable）

顾名思义，“变量”表示它可以从一个数值集合中取值，“随机”表示其取值必须服从一个概率分布。

随机变量通常用大写字母表示，而一个具体样本值通常用小写字母表示。例如，X 是一个随机变量，x 是 X 的一个具体样本值。随机变量可以是标量，也可以是向量。与普通变量一样，随机变量可以进行数学运算，例如求和、乘积、绝对值等。如果 X、Y 是两个随机变量，我们可以计算 $X + Y$ 、 $X + 1$ 、XY 等。

## ◇ 随机序列（stochastic sequence）

我们可能经常遇到对一个随机变量 X 采样得到的随机序列 $\{x_{i}\}_{i=1}^{n}$ 。例如，如果投掷一枚骰子 n 次，设 $x_{i}$ 为第 i 次投掷获得的值，那么 $\{x_{1}, x_{2}, \ldots, x_{n}\}$ 是一个随机序列或者随机过程，其中 $x_{i}$ 被认为也是一个随机变量。

初学者可能会感到困惑： $x_{i}$ 只是随机变量的一个具体的样本值，为什么这里认为它是一个随机变量？实际上，如果样本序列已经确定下来了，例如是 $\{1,6,3,5,\ldots\}$ ，那么这个序列不是一个随机序列，因为所有样本值都已经确定了。然而，如果我们使用变量 $x_{i}$ 来代表样本值，那么它是一个随机变量，这是因为它的取值服从了一个概率分布。这里虽然 $x_{i}$ 是小写字母，但它仍然代表一个随机变量。

## ◇ 概率（probability）

符号 $p(X = x)$ 或 $p_X(x)$ 描述了随机变量 $X$ 取值 $x$ 的概率。当上下文明确时， $p(X = x)$ 通常简写为 $p(x)$ 。

## ◇ 联合概率（joint probability）

符号 $p(X = x, Y = y)$ 或 $p(x, y)$ 描述了随机变量 $X$ 取值 $x$ 并且 $Y$ 取值 $y$ 的概率。一个有用的公式为

$$
\sum_{y} p (x, y) = p (x).
$$

## ◇ 条件概率（conditional probability）

符号 $p(X = x|A = a)$ 描述了在随机变量 $A$ 已经取值 $a$ 的条件下，随机变量 $X$ 取值 $x$ 的概率。我们常常将 $p(X = x|A = a)$ 简写为 $p(x|a)$ 。

关于联合概率和条件概率，下面的等式成立：

$$
p (x, a) = p (x | a) p (a)
$$

且

$$
p (x | a) = \frac{p (x , a)}{p (a)}.
$$

由于 $p(x) = \sum_{a}p(x,a)$ ，我们有

$$
p (x) = \sum_{a} p (x, a) = \sum_{a} p (x | a) p (a),
$$

这被称为全概率公式（formula of total probability）。

◇ 独立性（independence）

如果两个随机变量的取值互不影响，那么这两个随机变量是独立的。从数学上讲，如果 $X$ 和 $Y$ 独立，则

$$
p (x, y) = p (x) p (y).
$$

由于 $p(x,y) = p(x|y)p(y)$ ，由上式可进一步推出

$$
p (x | y) = p (x).
$$

◇ 条件独立（conditional independence）

设 X、A、B 为三个随机变量。如果给定 B 时有

$$
p (X = x \mid A = a, B = b) = p (X = x \mid B = b),
$$

那么我们说 $X$ 与条件 $A$ 独立。

该性质在强化学习中有重要应用。具体来说，考虑三个连续时刻的状态： $s_{t}, s_{t+1}, s_{t+2}$ 。虽然直观上看 $s_{t+2}$ 与 $s_{t+1}$ 和 $s_{t}$ 都有关系，但是如果 $s_{t+1}$ 已经给定，那么 $s_{t+2}$ 条件独立于 $s_{t}$ ，即有

$$
p (s_{t + 2} | s_{t + 1}, s_{t}) = p (s_{t + 2} | s_{t + 1}).
$$

这实际上就是马尔可夫过程的无记忆性质。

◇ 全概率公式（formula of total probability）

前面介绍条件概率时，我们已经提到了全概率公式。由于它很重要，下面再次单独列出它：

$$
p (x) = \sum_{y} p (x, y) = \sum_{y} p (x | y) p (y).
$$

◇ 链式规则（chain rule）

根据条件概率的定义可知

$$
p (a, b) = p (a | b) p (b).
$$

此式可推广至

$$
p (a, b, c) = p (a | b, c) p (b, c) = p (a | b, c) p (b | c) p (c).
$$

上式可进一步推出 $p(a,b,c) / p(c) = p(a,b|c) = p(a|b,c)p(b|c)$ 。由公式 $p(a,b|c) = p(a|b,c)p(b|c)$ 可推出

$$
p (x | a) = \sum_{b} p (x, b | a) = \sum_{b} p (x | b, a) p (b | a).
$$

◇ 期望/期望值/均值（expectation/expected value/mean value）

假设 $X$ 是一个随机变量，其取值 $x$ 的概率是 $p(x)$ ，那么 $X$ 的期望值定义为

$$
\mathbb{E} [ X ] = \sum_{x} p (x) x.
$$

期望值具有线性性质：

$$
\begin{array}{c} \mathbb{E} [ X + Y ] = \mathbb{E} [ X ] + \mathbb{E} [ Y ], \\ \mathbb{E} [ a X ] = a \mathbb{E} [ X ]. \end{array}
$$

上面第二个等式可以简单地通过定义证明。上面第一个等式的证明如下：

$$
\begin{array}{r l} \mathbb{E} [ X + Y ] & = \sum_{x} \sum_{y} (x + y) p (X = x, Y = y) \\ & = \sum_{x} x \sum_{y} p (x, y) + \sum_{y} y \sum_{x} p (x, y) \\ & = \sum_{x} x p (x) + \sum_{y} y p (y) \\ & = \mathbb{E} [ X ] + \mathbb{E} [ Y ]. \end{array}
$$

此外，由于线性的性质可得

$$
\mathbb{E} \left[ \sum_{i} a_{i} X_{i} \right] = \sum_{i} a_{i} \mathbb{E} [ X_{i} ].
$$

类似地，可以证明

$$
\mathbb{E} [ A X ] = A \mathbb{E} [ X ],
$$

其中 $A \in \mathbb{R}^{n \times n}$ 是一个确定性矩阵， $X \in \mathbb{R}^n$ 是一个随机向量。

◇ 条件期望（conditional expectation）

条件期望的定义是

$$
\mathbb{E} [ X | A = a ] = \sum_{x} x p (x | a).
$$

与全概率公式类似，我们有全期望公式（formula of total expectation）：

$$
\mathbb{E} [ X ] = \sum_{a} \mathbb{E} [ X | A = a ] p (a).
$$

上式的证明如下：

$$
\begin{array}{r l} \sum_{a} \mathbb{E} [ X | A = a ] p (a) & = \sum_{a} \left[ \sum_{x} p (x | a) x \right] p (a) \\ & = \sum_{x} \sum_{a} p (x | a) p (a) x \\ & = \sum_{x} \left[ \sum_{a} p (x | a) p (a) \right] x \\ & = \sum_{x} p (x) x \\ & = \mathbb{E} [ X ]. \end{array}
$$

在强化学习中经常会用到全期望公式。

此外，条件期望也满足

$$
\mathbb{E} [ X | A = a ] = \sum_{b} \mathbb{E} [ X | A = a, B = b ] p (b | a).
$$

上式在推导贝尔曼方程时会用到。我们可以利用链式法则（如 $p(x|a,b)p(b|a) = p(x,b|a)$ ）来证明该式，具体证明在此省略。

最后值得注意的是， $\mathbb{E}[X|A = a]$ 与 $\mathbb{E}[X|A]$ 不同。前者是一个值，而后者是一个随机变量。实际上， $\mathbb{E}[X|A]$ 是随机变量 $A$ 的函数，此时需要用更严格的概率论来定义 $\mathbb{E}[X|A]$ ，这会在[附录B](#附录b)中讨论。

◇ 期望的梯度（gradient of expectation）

设 $f(X,\beta)$ 是随机变量 $X$ 和确定性参数向量 $\beta$ 的标量函数。那么，

$$
\nabla_{\beta} \mathbb{E} [ f (X, \beta) ] = \mathbb{E} [ \nabla_{\beta} f (X, \beta) ].
$$

证明:由于 $\mathbb{E}[f(X,\beta)]=\sum_{x}f(x,a)p(x)$ ，我们有 $\nabla_{\beta}\mathbb{E}[f(X,\beta)]=\nabla_{\beta}\sum_{x}f(x,a)p(x)=\sum_{x}\nabla_{\beta}f(x,a)p(x)=\mathbb{E}[\nabla_{\beta}f(X,\beta)]$ 。

◇ 方差、协方差、协方差矩阵（variance、covariance、covariance matrix）

一个随机变量 $X$ 的方差定义为 $\operatorname{var}(X) = \mathbb{E}[(X - \bar{x})^2]$ ，其中 $\bar{x} = \mathbb{E}[X]$ 。两个随机变量 $X$ 、 $Y$ 的协方差定义为 $\operatorname{cov}(X, Y) = \mathbb{E}[(X - \bar{x})(Y - \bar{y})]$ 。对于一个随机向量 $X = [X_1, \ldots, X_n]^{\mathrm{T}}$ ，其协方差矩阵定义为 $\operatorname{var}(X) \doteq \Sigma = \mathbb{E}[(X - \bar{x})(X - \bar{x})^{\mathrm{T}}] \in \mathbb{R}^{n \times n}$ 。 $\Sigma$ 的第 $ij$ 项是 $[\Sigma]_{ij} = \mathbb{E}[[X - \bar{x}]_i[X - \bar{x}]_j] = \mathbb{E}[(X_i - \bar{x}_i)(X_j - \bar{x}_j)] = \operatorname{cov}(X_i, X_j)$ 。一个基本的性质是: 如果 a 是确定性的, 那么 $\mathrm{var}(a)=0$ 。此外, 可以验证 $\mathrm{var}(AX+a)=\mathrm{var}(AX)=A\mathrm{var}(X)A^{\mathrm{T}}=A\Sigma A^{\mathrm{T}}$ 。

下面总结了一些关于方差的有用性质。

\- 性质1： $\mathbb{E}[(X - \bar{x})(Y - \bar{y})] = \mathbb{E}[XY] - \bar{x}\bar{y} = \mathbb{E}[XY] - \mathbb{E}[X]\mathbb{E}[Y]$ 。

证明： $\mathbb{E}[(X - \bar{x})(Y - \bar{y})] = \mathbb{E}[XY - X\bar{y} -\bar{x} Y + \bar{x}\bar{y}] = \mathbb{E}[XY] - \mathbb{E}[X]\bar{y} -\bar{x}\mathbb{E}[Y] + \bar{x}\bar{y} =$ $\mathbb{E}[XY] - \mathbb{E}[X]\mathbb{E}[Y] - \mathbb{E}[X]\mathbb{E}[Y] + \mathbb{E}[X]\mathbb{E}[Y] = \mathbb{E}[XY] - \mathbb{E}[X]\mathbb{E}[Y].$

\- 性质2：如果 $X, Y$ 是独立的，那么 $\mathbb{E}[XY] = \mathbb{E}[X]\mathbb{E}[Y]$ 。

证明： $\mathbb{E}[XY] = \sum_{x}\sum_{y}p(x,y)xy = \sum_{x}\sum_{y}p(x)p(y)xy = \sum_{x}p(x)x\sum_{y}p(y)y =$ $\mathbb{E}[X]\mathbb{E}[Y]$ 。

\- 性质3：如果 $X, Y$ 是独立的，那么 $\operatorname{cov}(X, Y) = 0$ 。

证明：当 $X, Y$ 是独立的时候， $\operatorname{cov}(X, Y) = \mathbb{E}[XY] - \mathbb{E}[X]\mathbb{E}[Y] = \mathbb{E}[X]\mathbb{E}[Y] - \mathbb{E}[X]\mathbb{E}[Y] = 0$ 。

## 附录B

测度概率论

本附录将简要介绍测度概率论（measure-theoretic probability theory），它也被称为严格概率论（rigorous probability theory）。我们仅介绍其中一些基本概念和结论，更多介绍可参见文献[96-98]。测度概率论需要一些测度理论的基础知识，本附录没有涵盖，感兴趣的读者可以参考文献[99]。

读者可能会问：为了学习强化学习有必要理解测度概率论吗？如果读者对涉及随机序列收敛性的理论分析感兴趣，那么就是有必要的。例如，我们在[第6章](ch06.md)和[第7章](ch07.md)经常遇到几乎必然（almost surely）收敛的概念，这一概念就来源于测度概率论。如果读者对这些理论分析不感兴趣，则可以跳过这些部分，而不会影响学习其他内容。

## 概率三元组

概率三元组（probability triple）是建立测度概率论的基础，它也被称为概率空间或概率测度空间（probability space/probability measure space）。一个概率三元组包含如下三要素。

$\Omega$ ：这是一个集合，称为样本空间（sample space）或者结果空间（outcome space）。 $\Omega$ 中的任一元素称为一个结果（outcome），记为 $\omega$ 。这个集合包含随机采样所有可能的结果。

例子：当玩掷骰子游戏时，我们有6个可能的结果 $\{1,2,3,4,5,6\}$ 。因此， $\Omega = \{1,2,3,4,5,6\}$ 。

◇ F: 这是一个集合，称为事件空间（event space）。它是 $\Omega$ 的一个 $\sigma$ -代数（ $\sigma$ -algebra）或称为 $\sigma$ -域（ $\sigma$ -field）。 $\sigma$ -代数的定义见方框 B.1。F 中的任一元素称为一个事件（event），表示为 A。样本空间 $\Omega$ 中的每一个结果只是一个基本事件（elementary event），而一个事件可能是一个或多个基本事件的组合。

例子：当玩掷骰子游戏时，一个基本事件的例子是“你得到的数字是 $i$ ”，其中 $i \in \{1, \ldots, 6\}$ 。一个非基本事件的例子是“你得到的数字大于3”，这个事件的数学表示为 $A = \{\omega \in \Omega : \omega > 3\}$ 。由于 $\Omega = \{1, 2, 3, 4, 5, 6\}$ ，因此可知 $A = \{4, 5, 6\}$ ，即 $A$ 是包含三个基础事件的集合。

◇ P: 这是一个从 F 到 $[0,1]$ 的映射，代表概率测度（probability measure）。任何 $A \in F$ 是一个包含 $\Omega$ 中一些元素的集合，而 $\mathbb{P}(A)$ 则是这个集合的概率测度。

例子：如果 $A = \Omega$ ，则 $\mathbb{P}(A) = 1$ ；如果 $A = \varnothing$ （空集），则 $\mathbb{P}(A) = 0$ 。在掷骰子的游戏中，考虑事件“你得到的数字大于3”，该事件可以写为 $A = \{\omega \in \Omega : \omega > 3\}$ 。由于 $\Omega = \{1,2,3,4,5,6\}$ ，可知 $A = \{4,5,6\}$ ，所以 $\mathbb{P}(A) = 1/2$ 。也就是说，我们掷出一个大于3的数字的概率是 $1/2$ 。这里“概率”在数学上指的是“测度”。

{{< definition title="方框B.1：$\sigma$-代数的定义" >}}

$\Omega$ 的一个代数（algebra）是满足某些条件的 $\Omega$ 的一些子集的集合，而 $\sigma$ -代数（ $\sigma$ -algebra）是一种特殊但重要的代数。具体来说，用 $\mathcal{F}$ 表示一个 $\sigma$ -代数，那么它必须满足以下条件。

◇ F 包含 $\varnothing$ 和 $\Omega;$

◇ F 对补集封闭；

◇ F 对可数并集和交集封闭。

$\Omega$ 的 $\sigma$ -代数不是唯一的。根据上面三个条件， $\mathcal{F}$ 可能包含 $\Omega$ 的所有子集，也可能只包含一部分子集。此外，这三个条件并不是相互独立的。例如，如果 $\mathcal{F}$ 包含 $\Omega$ 并且对补集封闭，那么它自然包含 $\varnothing$ 。更多信息可参见文献[96-98]。

例子：在玩掷骰子游戏时，我们有 $\Omega = \{1,2,3,4,5,6\}$ 。 $\mathcal{F} = \{\Omega ,\varnothing ,\{1,2,3\}$ ， $\{4,5,6\}\}$ 是一个 $\sigma$ -代数，因为它满足上述三个条件（原因留给读者验证）。当然也还有其他的 $\sigma$ -代数，例如 $\{\Omega ,\varnothing ,\{1,2,3,4,5\} ,\{6\}\}$ 。此外，如果 $\Omega$ 仅包含有限个元素，那么由其所有子集组成的集合是一个 $\sigma$ -代数。

{{< /definition >}}

## 随机变量

基于概率三元组的概念，我们可以正式定义随机变量。虽然它被称为“变量”，但它实际上是一个“函数”。具体来说，它是一个从 $\Omega$ 到 $\mathbb{R}$ 的映射： $X(\omega):\Omega \to \mathbb{R}$ ，即 $X(\omega)$ 为 $\Omega$ 中的每个元素分配了一个数值。

并非所有从 $\Omega$ 到 $\mathbb{R}$ 的映射都是随机变量。如果一个映射 $X: \Omega \to \mathbb{R}$ 对于所有 $x \in \mathbb{R}$ 都满足

$$
A = \{\omega \in \Omega | X (\omega) \leqslant x \} \in \mathcal{F},
$$

那么 $X$ 被称为一个随机变量。这个定义要求对任意的 $x$ ， $X(\omega) \leqslant x$ 必须是 $\mathcal{F}$ 中的一个事件。更多信息可参见文献[96, 第3.1节]。

## 随机变量的期望

随机变量的期望的定义比较复杂，这里仅考虑特殊但重要的简单随机变量的期望。

具体来说，如果 $X(\omega)$ 能取的值的个数是有限的，那么该随机变量是简单的（simple）。令 $\mathcal{X}$ 代表 $X$ 的所有取值的集合。简单随机变量就是如下映射： $X(w):\Omega \to \mathcal{X}$ 。该映射可以写成如下解析式：

$$
X (\omega) \doteq \sum_{x \in \mathcal{X}} x \mathbb{1} _{A_{x}} (\omega),
$$

其中

$$
A_{x} = \{\omega \in \Omega | X (\omega) = x \} \doteq X^{- 1} (x)
$$

并且

$$
\mathbb{1} _{A_{x}} (\omega) \doteq \left\{\begin{array}{l l} 1, & \omega \in A_{x}, \\ 0, & \omega \notin A_{x}. \end{array} \right.\tag{B.1}
$$

这里 $\mathbb{1}_{A_x}(\omega)$ 是一个指示函数（indicator function）： $\mathbb{1}_{A_x}(\omega):\Omega \to \{0,1\}$ 。如果 $\omega$ 被映射到 $x$ ，那么该指示函数等于1；否则它等于0。 $\Omega$ 中的多个 $\omega$ 可能映射到 $\mathcal{X}$ 中的同一个值，但是 $\Omega$ 中的一个 $\omega$ 不能同时映射到 $\mathcal{X}$ 中的多个值。

有了上述准备，简单随机变量的期望定义为

$$
\mathbb{E} [ X ] \doteq \sum_{x \in \mathcal{X}} x \mathbb{P} (A_{x}),\tag{B.2}
$$

其中

$$
A_{x} = \{\omega \in \Omega | X (\omega) = x \}.
$$

大家还记得在概率论基础中介绍的期望的定义吗？其定义为 $\mathbb{E}[X] = \sum_{x\in \mathcal{X}}xp(x)$ 。这个定义与式(B.2)非常类似，只是后者更加正式。

作为一个典型例子，下面我们计算式(B.1)中指示函数的期望值。值得注意的是，指示函数也是一个随机变量，它将 $\Omega$ 映射到 $\{0,1\}$ [96, 命题3.1.5]，因此我们可以计算它的期望值。具体来说，考虑指示函数 $\mathbb{1}_A$ ，其中 $A$ 表示一个事件。那么我们有

$$
\mathbb{E} [ \mathbb{1} _{A} ] = \mathbb{P} (A).
$$

该式的证明如下：

$$
\begin{array}{l} \mathbb{E} [ \mathbb{1} _{A} ] = \sum_{z \in \{0, 1 \}} z \mathbb{P} (\mathbb{1} _{A} = z) \\ \qquad = 0 \cdot \mathbb{P} (\mathbb{1} _{A} = 0) + 1 \cdot \mathbb{P} (\mathbb{1} _{A} = 1) \\ \qquad = \mathbb{P} (\mathbb{1} _{A} = 1) \\ \qquad = \mathbb{P} (A). \end{array}
$$

更多关于指示函数的性质可参见文献[100, 第24章]。

## 随机变量的条件期望

式(B.2)中的期望将随机变量映射到一个特定的值。下面介绍一种将随机变量映射到另一个随机变量的条件期望。

假设 $X$ 、 $Y$ 、 $Z$ 都是随机变量。考虑下面三种情况，后一种情况是前一种的扩展。

◇ 第一，考虑 $E[X|Y=2]$ 或 $E[X|Y=5]$ 这样的条件期望，它们都是具体的数值。

◇ 第二，考虑 $E[X|Y=y]$ ，其中 y 是一个变量。由于不同 y 值会得到不同的期望值，因此不难看出这个条件期望是 y 的函数。

◇ 第三，考虑 $E[X|Y]$ ，其中 Y 是一个随机变量。这个条件期望也是 Y 的函数。然而，因为 Y 是一个随机变量，所以 $E[X|Y]$ 也是一个随机变量。由于 $E[X|Y]$ 是一个随机变量，我们可以像对待普通随机变量一样对待它，例如计算它的期望值。

这里我们重点关注第三种情况中的期望，因为它经常出现在随机序列的收敛性分析中，其严格的定义可参见文献[96, 第13章]，下面仅介绍一些有用的结论[101]。

引理B.1(基本性质)。设 $X$ 、 $Y$ 、 $Z$ 是随机变量，则以下性质成立。

(a) $\mathbb{E}[a|Y] = a$ ，其中 $a$ 是一个确定的数值。

(b) $\mathbb{E}[aX + bZ|Y] = a\mathbb{E}[X|Y] + b\mathbb{E}[Z|Y]$ 。

(c) 如果 $X$ 、 $Y$ 是独立的，那么 $\mathbb{E}[X|Y] = \mathbb{E}[X]$ 。

(d) $\mathbb{E}[Xf(Y)|Y] = f(Y)\mathbb{E}[X|Y]$ 。

(e) $\mathbb{E}[f(Y)|Y]=f(Y)$ 。

(f) $\mathbb{E}[X|Y, f(Y)] = \mathbb{E}[X|Y]$ .

(g) 如果 $X \geqslant 0$ ，那么 $\mathbb{E}[X|Y] \geqslant 0$ 。

(h) 如果 $X \geqslant Z$ ，那么 $\mathbb{E}[X|Y] \geqslant \mathbb{E}[Z|Y]$ 。

证明：下面只证明两个有代表性的性质，其他性质的证明是类似的。

为了证明性质 (a) 中的 $\mathbb{E}[a|Y] = a$ ，我们只需要证明 $\mathbb{E}[a|Y = y] = a$ 对任意 $Y$ 可能取的数值 $y$ 都成立即可，而这显然是成立的。

为了证明性质 (d)，我们只需要证明 $\mathbb{E}[Xf(Y)|Y=y]=f(Y=y)\mathbb{E}[X|Y=y]$ 对任意 Y 可能取的数值 y 都成立即可，而此式成立是因为 $\mathbb{E}[Xf(Y)|Y=y]=\sum_{x}xf(y)p(x|y)=f(y)\sum_{x}xp(x|y)=f(y)\mathbb{E}[X|Y=y]$ 。

由于 $\mathbb{E}[X|Y]$ 是一个随机变量，我们可以计算它的期望。下面给出了相关的一些性质，这些性质对于分析随机序列的收敛性十分有用。

引理B.2。设 $X$ 、Y、Z为随机变量，则以下性质成立。

(a) $\mathbb{E}\left[\mathbb{E}[X|Y]\right] = \mathbb{E}[X]$ 。

(b) $\mathbb{E}\left[\mathbb{E}[X|Y,Z]\right]=\mathbb{E}[X]$ 。

(c) $\mathbb{E}\left[\mathbb{E}[X|Y]|Y\right]=\mathbb{E}[X|Y]$ 。

证明：为了证明性质(a)，我们只需要证明 $\mathbb{E}\big[\mathbb{E}[X|Y = y]\big] = \mathbb{E}[X]$ 对所有 $Y$ 可能取的值 $y$ 都成立即可。为此，由于 $\mathbb{E}[X|Y]$ 是 $Y$ 的函数，我们可以将其表示为 $f(Y)\doteq \mathbb{E}[X|Y]$ 。那么有

$$
\begin{array}{r l} \mathbb{E} [ \mathbb{E} [ X | Y ] ] & = \mathbb{E} [ f (Y) ] = \sum_{y} f (Y = y) p (y) \\ & = \sum_{y} \mathbb{E} [ X | Y = y ] p (y) \\ & = \sum_{y} \left(\sum_{x} x p (x | y)\right) p (y) \\ & = \sum_{x} x \sum_{y} p (x | y) p (y) \\ & = \sum_{x} x \sum_{y} p (x, y) \\ & = \sum_{x} x p (x) \\ & = \mathbb{E} [ X ]. \end{array}
$$

对性质 (b) 的证明是类似的:

$$
\mathbb{E} \left[ \mathbb{E} [ X | Y, Z ] \right] = \sum_{y, z} \mathbb{E} [ X | y, z ] p (y, z) = \sum_{y, z} \sum_{x} x p (x | y, z) p (y, z) = \sum_{x} x p (x) = \mathbb{E} [ X ].
$$

性质 (c) 可以直接由引理B.1中的性质 (e) 推出。具体来说，如果 $f(Y) \doteq \mathbb{E}[X|Y]$ ，那么 $\mathbb{E}[\mathbb{E}[X|Y]|Y] = \mathbb{E}[f(Y)|Y] = f(Y) = \mathbb{E}[X|Y]$ 。

## 随机序列收敛性的定义

我们关注测度概率论的一个重要原因是它能严格描述随机序列的收敛性。

考虑随机序列 $\{X_k\} \doteq \{X_1, X_2, \ldots, X_k, \ldots\}$ 。这个序列中的每一个元素都是在三元组 $(\Omega, \mathcal{F}, \mathbb{P})$ 上定义的随机变量。当我们说 $\{X_k\}$ 收敛时，我们应该非常小心，因为存在许多不同类型的收敛。

## ◇ 必然收敛（sure convergence）

定义: 如果下式成立, 那么 $\{X_{k}\}$ 必然（surely）或处处（everywhere）或逐点（pointwise）收敛到 X:

$$
\lim_{k \to \infty} X_{k} (\omega) = X (\omega), \quad{\text{对任意}} \omega \in \Omega .
$$

这意味着对于 $\Omega$ 中的所有元素， $\lim_{k\to \infty}X_k(\omega) = X(\omega)$ 都是成立的。该定义也可

以等价地描述为

$$
A = \Omega \quad{\text{其中}} \quad A = \left\{\omega \in \Omega : \lim_{k \to \infty} X_{k} (\omega) = X (\omega) \right\}.
$$

◇ 几乎必然收敛（almost sure convergence）

定义：如果下式成立，那么 $\{X_k\}$ 几乎必然（almost surely）或几乎处处（almost everywhere）或以概率1（with probability 1, w.p.1）收敛到 $X$ ：

$$
\mathbb{P} (A) = 1 \quad{\text{其中}} \quad A = \left\{\omega \in \Omega : \lim_{k \to \infty} X_{k} (\omega) = X (\omega) \right\}.\tag{B.3}
$$

这意味着对于 $\Omega$ 中的几乎所有元素， $\lim_{k \to \infty} X_k(\omega) = X(\omega)$ 都是成立的。而那些无法让这个极限成立的元素构成了一个测度为0的集合。简单起见，式(B.3)通常写为

$$
\mathbb{P} \left(\lim_{k \rightarrow \infty} X_{k} = X\right) = 1.
$$

几乎必然收敛可以表示为 $X_{k} \xrightarrow{\mathrm{a.s.}} X$ .

◇ 概率收敛（convergence in probability）

定义：如果对于任何 $\epsilon > 0$ 下式都成立，那么 $\{X_k\}$ 概率收敛到 $X$

$$
\lim_{k \to \infty} \mathbb{P} (A_{k}) = 0 \quad{\text{其中}} \quad A_{k} = \left\{\omega \in \Omega : | X_{k} (\omega) - X (\omega) | > \epsilon \right\}.\tag{B.4}
$$

简单起见式(B.4)可以写成

$$
\lim_{k \to \infty} \mathbb{P} (| X_{k} - X | > \epsilon) = 0.
$$

概率收敛和（几乎）必然收敛的区别如下。（几乎）必然收敛首先评估在 $\Omega$ 中每个点的收敛性，然后检查这些点的测度。概率收敛首先检查满足 $|X_{k} - X| > \epsilon$ 的点，然后评估其测度是否会随着 $k \to \infty$ 收敛到0。

◇ 均值收敛（convergence in mean）

定义：如果下式成立，那么 $\{X_k\}$ 以 $r$ 次均值（或 $L^r$ 范数）收敛到 $X$

$$
\lim_{k \to \infty} \mathbb{E} [ | X_{k} - X | ^{r} ] = 0.
$$

最常见的情况是 $r = 1$ 和 $r = 2$ 。值得一提的是，均值收敛并不等同于 $\lim_{k\to \infty}\mathbb{E}[X_k - X] = 0$ 或 $\lim_{k\to \infty}\mathbb{E}[X_k] = \mathbb{E}[X]$ ，因为可能 $\mathbb{E}[X_k]$ 收敛但方差不收敛。

◇ 分布收敛（convergence in distribution）

定义：假设 $X_{k}$ 的累积分布函数（cumulative distribution function）是 $\mathbb{P}(X_k\leqslant a)$

其中 $a \in \mathbb{R}$ 。如果累积分布函数满足下式，那么 $\{X_k\}$ 以分布收敛到 $X$ ：

$$
\lim_{k \to \infty} \mathbb{P} (X_{k} \leqslant a) = \mathbb{P} (X \leqslant a), \quad{\text{对所有}} a \in \mathbb{R}.
$$

上式可以另写为

$$
\lim_{k \to \infty} \mathbb{P} (A_{k}) = \mathbb{P} (A),
$$

其中

$$
A_{k} \doteq \left\{\omega \in \Omega : X_{k} (\omega) \leqslant a \right\}, \quad A \doteq \left\{\omega \in \Omega : X (\omega) \leqslant a \right\}.
$$

上述不同收敛类型之间的关系如下所示：

$$
\text{几乎必然收敛} \quad \Longrightarrow \quad \text{概率收敛} \quad \Longrightarrow \quad \text{分布收敛}
$$

$$
\text{均值收敛} \quad \Longrightarrow \quad \text{概率收敛} \quad \Longrightarrow \quad \text{分布收敛}
$$

几乎必然收敛和平均收敛相互之间不能推出，更多信息可参见文献[102]。

## 附录C

序列的收敛性

下面介绍一些关于确定性序列（deterministic sequence）和随机序列（stochastic sequence）收敛性的结果，这些结果对于分析[第6章](ch06.md)和[第7章](ch07.md)的强化学习算法的收敛性十分有用。

## C.1 确定性序列的收敛性

## 单调序列的收敛性

考虑一个序列 $\{x_{k}\} \doteq \{x_{1}, x_{2}, \ldots, x_{k}, \ldots\}$ ，其中 $x_{k} \in \mathbb{R}$ 。这个序列是确定性的，即 $x_{k}$ 不是随机变量。关于确定性序列，最著名的收敛性结论之一是关于单调序列。

定理C.1（单调序列的收敛性）。如果序列 $\{x_{k}\}$ 是非递增的并且有下界：

◇ 非增：对所有的 k，有 $x_{k+1} \leqslant x_{k}$ ;

◇ 下界：对所有的 k，有 $x_{k} \geqslant \alpha$ ;

那么当 $k \to \infty$ 时， $x_{k}$ 会收敛到一个极限，该极限是 $\{x_{k}\}$ 的下确界。

类似地，如果 $\{x_{k}\}$ 是非递减的并且有上界，那么该序列也是收敛的。

## 非单调序列的收敛性

接下来介绍非单调序列的收敛性。为此，首先引入下面的算子[103]。对任意 $z \in \mathbb{R}$ ，定义

$$
\begin{array}{l} z^{+} \doteq \left\{\begin{array}{l l} z, & z \geqslant 0, \\ 0, & z <   0, \end{array} \right. \\ z^{-} \doteq \left\{\begin{array}{l l} z, & z \leqslant 0, \\ 0, & z > 0. \end{array} \right. \end{array}
$$

显然， $z^{+}\geqslant 0$ 且 $z^{-}\leqslant 0$ 对任意 $z$ 都成立。此外，

$$
z = z^{+} + z^{-}
$$

也对所有 $z \in \mathbb{R}$ 都成立。

下面分析 $\{x_{k}\}$ 的收敛性。将 $x_{k}$ 重写为

$$
\begin{array}{l} x_{k} = x_{k} - x_{k - 1} + x_{k - 1} - x_{k - 2} + \dots - x_{2} + x_{2} - x_{1} + x_{1} \\ = \sum_{i = 1} ^{k - 1} (x_{i + 1} - x_{i}) + x_{1} \\ \doteq S_{k} + x_{1}, \end{array}\tag{C.1}
$$

其中 $S_{k} \doteq \sum_{i=1}^{k-1}(x_{i+1} - x_{i})$ 。这里 $S_{k}$ 可以分解为

$$
S_{k} = \sum_{i = 1} ^{k - 1} (x_{i + 1} - x_{i}) = S_{k} ^{+} + S_{k} ^{-},
$$

其中

$$
S_{k} ^{+} = \sum_{i = 1} ^{k - 1} (x_{i + 1} - x_{i}) ^{+} \geqslant 0, \quad S_{k} ^{-} = \sum_{i = 1} ^{k - 1} (x_{i + 1} - x_{i}) ^{-} \leqslant 0.
$$

下面给出 $S_{k}^{+}$ 和 $S_{k}^{-}$ 的一些有用性质。

◇ $\{S_{k}^{+}\geqslant0\}$ 是一个非递减序列，因为对于所有的 k 都有 $S_{k+1}^{+}\geqslant S_{k}^{+}$ 。

$\diamond \{S_k^- \leqslant 0\}$ 是一个非递增序列，因为对于所有的 $k$ 都有 $S_{k + 1}^{-} \leqslant S_k^{-}$ 。

如果 $S_{k}^{+}$ 有上界，则 $S_{k}^{-}$ 有下界，这是因为 $S_{k}^{-} \geqslant -S_{k}^{+} - x_{1}$ 成立，而该不等式可由 $S_{k}^{-} + S_{k}^{+} + x_{1} = x_{k} \geqslant 0$ 推出。

有了上面的准备，我们给出如下结果。

定理 C.2 (非单调序列的收敛性)。对于任意非负序列 $\{x_{k} \geqslant 0\}$ ，如果

$$
\sum_{k = 1} ^{\infty} (x_{k + 1} - x_{k}) ^{+} <   \infty ,\tag{C.2}
$$

那么当 $k \to \infty$ 时， $\{x_k\}$ 收敛。

证明：首先，令 $S_{k}^{+} = \sum_{i=1}^{k-1}(x_{i+1} - x_{i})^{+}$ 。条件 $\sum_{k=1}^{\infty}(x_{k+1} - x_k)^{+} < \infty$ 表明对于所有的 $k$ ， $S_{k}^{+}$ 都具有有限上界。由于 $\{S_{k}^{+}\}$ 是非递减的， $\{S_{k}^{+}\}$ 的收敛性立即可以从定理C.1得出。设 $S_{*}^{+}$ 为 $S_{k}^{+}$ 的收敛值。

其次， $S_{k}^{+}$ 的有界性意味着 $S_{k}^{-}$ 是下界有限的，这是因为 $S_{k}^{-} \geqslant -S_{k}^{+} - x_{1}$ 。由于 $\{S_{k}^{-}\}$ 是非递增的， $\{S_{k}^{-}\}$ 的收敛性立即可以从定理 C.1 得出。设 $S_{*}^{-}$ 为 $S_{k}^{-}$ 的收敛值。

最后，因为 $x_{k} = S_{k}^{+} + S_{k}^{-} + x_{1}$ （如式(C.1)所示），所以由 $S_{k}^{+}$ 和 $S_{k}^{-}$ 的收敛性可知 $\{x_{k}\}$ 能收敛到 $S_{*}^{+} + S_{*}^{-} + x_{1}$ 。

定理C.2比定理C.1更为一般化，因为它允许 $\{x_{k}\}$ 是非单调的。反过来说，定理C.1是定理C.2的一个特殊情况。这是因为在单调情况下定理C.2仍然是适用的。具体来说，如果 $0 \leqslant x_{k+1} \leqslant x_{k}$ ，那么 $\sum_{k=1}^{\infty}(x_{k+1} - x_{k})^{+} = 0$ ，此时(C.2)仍然成立。

我们该如何理解条件(C.2)呢？该条件的直观意义是 $(x_{k + 1} - x_k)^+$ 是逐渐收敛到0的，因此虽然 $\{x_{k}\}$ 不是递减的，但是当 $k$ 很大时这个序列已经接近递减序列了。换句话说，条件(C.2)要求序列的递增变化是逐渐被抑制的。

定理C.2针对的是一般化的序列。下面考虑一个特殊但重要的序列。假设 $\{x_{k} \geqslant 0\}$ 是一个非负序列并且满足

$$
x_{k + 1} \leqslant x_{k} + \eta_{k}.
$$

如果 $\eta_{k} = 0$ ，那么 $x_{k + 1}\leqslant x_k$ ，此时序列是单调的。如果 $\eta_{k}\geqslant 0$ ，那么该序列不是单调的，因为 $x_{k + 1}$ 有可能大于 $x_{k}$ 。此时我们能得到其收敛性条件吗？答案是肯定的，下面的结果表明当 $\eta_{k}$ 满足一些条件时就能确保 $\{x_k\}$ 的收敛，这个结果是定理C.2的直接推论。

推论C.1。假设一个非负序列 $\{x_{k}\geqslant 0\}$ 满足

$$
x_{k + 1} \leqslant x_{k} + \eta_{k}.
$$

如果 $\{\eta_k\geqslant 0\}$ 满足

$$
\sum_{k = 1} ^{\infty} \eta_{k} <   \infty ,
$$

那么 $\{x_{k} \geqslant 0\}$ 收敛。

证明：由于 $x_{k + 1}\leqslant x_k + \eta_k$ ，因此对所有的 $k$ 都有 $(x_{k + 1} - x_k)^+ \leqslant \eta_k$ ，由此可得

$$
\sum_{k = 1} ^{\infty} (x_{k + 1} - x_{k}) ^{+} \leqslant \sum_{k = 1} ^{\infty} \eta_{k} <   \infty .
$$

因此式(C.2)中的条件成立，所以根据定理C.2可以得出该序列的收敛性。

如何从直观上理解推论C.1呢？从直观上来说， $\sum_{k=1}^{\infty}\eta_{k}<\infty$ 意味着 $\eta_{k}$ 逐渐收敛到0，因此 $\{x_{k}\}$ 最终逐渐变成了单调序列。

## C.2 随机序列的收敛性

下面考虑随机序列。虽然[附录B](#附录b)已经给出了随机序列收敛性的多种定义，但是还没有介绍如何确定一个随机序列是否收敛。下面介绍一类重要的随机序列，称为Martingale（鞅）。如果一个序列能够被归为Martingale（或其变体之一），那么其收敛性往往不难证明。

## 鞅序列的收敛

$\diamond$ 定义：一个随机序列 $\{X_k\}_{k = 1}^{\infty}$ 被称为Martingale，如果 $\mathbb{E}[|X_k|] < \infty$ 并且

$$
\mathbb{E} [ X_{k + 1} | X_{1}, \ldots , X_{k} ] = X_{k}\tag{C.3}
$$

对任意 $k$ 几乎必然成立。注意，这里 $\mathbb{E}[X_{k + 1}|X_1,\dots ,X_k]$ 是随机变量，而不是一个确定值，这也是为什么需要说该式“几乎必然”的原因。另外， $\mathbb{E}[X_{k + 1}|X_1,\dots ,X_k]$ 通常简写为 $\mathbb{E}[X_{k + 1}|\mathcal{H}_k]$ ，其中 $\mathcal{H}_k = \{X_1,\dots ,X_k\}$ 表示序列过去的“历史”，而且 $\mathcal{H}_k$ 还有一个特定的名字：Filtration，更多信息可参见[96,第14章]和[104]。

例子：能够形象地说明Martingale的一个例子是随机游走（random walk），这是描述一个点随机移动的随机过程。具体来说，令 $X_{k}$ 表示一个点 $k$ 时刻的位置。从 $X_{k}$ 开始，如果单步位移的平均值等于0，那么下一个时刻的位置 $X_{k + 1}$ 的期望等于 $X_{k}$ ，此时有 $\mathbb{E}[X_{k + 1}|X_1,\dots ,X_k] = X_k$ ，所以 $\{X_k\}$ 是一个Martingale。

Martingale的一个基本性质是

$$
\mathbb{E} [ X_{k + 1} ] = \mathbb{E} [ X_{k} ]
$$

对任意 $k$ 都成立。由此可得

$$
\mathbb{E} [ X_{k} ] = \mathbb{E} [ X_{k - 1} ] = \dots = \mathbb{E} [ X_{2} ] = \mathbb{E} [ X_{1} ].
$$

这个结果可以通过对(C.3)的两边求期望进而应用引理B.2中的性质(b)加以证明。

注意，Martingale的期望是不变的常数。下面我们将其扩展到两类更一般化的变体：Submartingale和Supermartingale，它们的期望是单调变化的。

定义：一个随机序列 $\{X_k\}$ 被称为Submartingale（次鞅），如果 $\mathbb{E}[|X_k|] < \infty$ 并且

$$
\mathbb{E} [ X_{k + 1} | X_{1}, \dots , X_{k} ] \geqslant X_{k}\tag{C.4}
$$

对所有 $k$ 成立。

对式(C.4)的两边求期望值可得 $\mathbb{E}[X_{k + 1}] \geqslant \mathbb{E}[X_k]$ ，这是因为 $\mathbb{E}[\mathbb{E}[X_{k + 1}|X_1,\dots ,X_k]] = \mathbb{E}[X_{k + 1}]$ （引理B.2中的性质(b))。由此可得

$$
\mathbb{E} [ X_{k} ] \geqslant \mathbb{E} [ X_{k - 1} ] \geqslant \dots \geqslant \mathbb{E} [ X_{2} ] \geqslant \mathbb{E} [ X_{1} ].
$$

因此，Submartingale的期望是递增的。

值得一提的是，当我们比较两个随机变量 $X$ 和 $Y$ 时， $X \leqslant Y$ 意味着对所有 $\omega \in \Omega$ 都有 $X(\omega) \leqslant Y(\omega)$ ，而并不意味着 $X$ 的最大值小于 $Y$ 的最小值。

定义：一个随机序列 $\{X_k\}$ 被称为Supermartingale（超鞅），如果 $\mathbb{E}[|X_k|] < \infty$ 并且

$$
\mathbb{E} \left[ X_{k + 1} \mid X_{1}, \dots , X_{k} \right] \leqslant X_{k}\tag{C.5}
$$

对所有的 $k$ 成立。

类似地，对(C.5)两边取期望可得 $\mathbb{E}[X_{k + 1}]\leqslant \mathbb{E}[X_k]$ ，进而可得

$$
\mathbb{E} [ X_{k} ] \leqslant \mathbb{E} [ X_{k - 1} ] \leqslant \dots \leqslant \mathbb{E} [ X_{2} ] \leqslant \mathbb{E} [ X_{1} ].
$$

因此，Supermartingale的期望是递减的。

Submartingale 和 Supermartingale 分别对应期望递增和期望递减的情况。为了方便初学者区分它们，下面介绍一个简单技巧。“Supermartingale” 中有一个字母 “p” 向下指，因此其期望是递减的；“Submartingale” 中有一个字母 “b” 向上指，因此其期望是递增的 [104]。

为了方便理解，读者可以将 Submartingale 和 Supermartingale 与确定性序列中的单调情况相类比。针对确定性单调序列的收敛性已经在定理 C.1 中给出，下面给出针对随机序列的一个类似的结果。

定理 C.3 (鞅的收敛性)。如果 $\{X_{k}\}$ 是 Submartingale 或 Supermartingale，那么存在一个有限的随机变量 X，使得 $X_{k}$ 几乎必然收敛于 X。

上述定理的证明省略。关于鞅的介绍可参见文献[96, 第14章]和[104]。

## 准鞅序列的收敛

接下来介绍 Quasimartingale（准鞅），它的期望值不是单调的。为了方便理解，读者可以将其与确定性序列中的非单调情况相类比。Quasimartingale 的严格定义和收敛是比较复杂的，下面仅列出一些有用的性质。

定义事件 $A_{k}$ 为 $A_{k} \doteq \{\omega \in \Omega : \mathbb{E}[X_{k+1} - X_{k}|\mathcal{H}_{k}] \geqslant 0\}$ ，其中 $\mathcal{H}_k = \{X_1, \ldots, X_k\}$ 。事件 $A_{k}$ 对应了 $X_{k+1}$ 的期望大于 $X_{k}$ 的情况。设 $\mathbb{1}_{A_k}$ 是一个指示函数：

$$
\mathbb{1} _{A_{k}} = \left\{\begin{array}{l l} 1, & \mathbb{E} [ X_{k + 1} - X_{k} | \mathcal{H} _{k} ] \geqslant 0, \\ 0, & \mathbb{E} [ X_{k + 1} - X_{k} | \mathcal{H} _{k} ] <   0. \end{array} \right.
$$

指示函数的一个基本性质是对于任意事件 $A$ 有

$$
\mathbb{1} _{A} + \mathbb{1} _{A^{c}} = 1.
$$

其中 $A^{c}$ 表示 A 的补事件（complementary event）。因此，对于任意随机变量都有

$$
X = \mathbb{1} _{A} X + \mathbb{1} _{A^{c}} X.
$$

尽管 Quasimartingale 的期望并不是单调的，不过在一些条件下仍然能保证其收敛性。

定理 C.4 (准鞅的收敛性)。对于一个非负的随机序列 $\{X_{k} \geqslant 0\}$ ，如果

$$
\sum_{k = 1} ^{\infty} \mathbb{E} [ (X_{k + 1} - X_{k}) \mathbb{1} _{A_{k}} ] <   \infty ,
$$

那么 $\sum_{k=1}^{\infty} \mathbb{E}\left[(X_{k+1}-X_k)\mathbb{1}_{A_k^c}\right] > -\infty$ 并且存在一个有限的随机变量 $X$ 使得当 $k \to \infty$ 时， $X_k$ 几乎必然收敛于 $X$ 。

为了方便理解，定理C.4可以被视为定理C.2的类比，后者是针对非单调的确定性序列。定理C.4的证明可参见文献[105, 命题9.5]。注意，这里的 $X_{k}$ 应该是非负的，因此 $\sum_{k=1}^{\infty} \mathbb{E}[(X_{k+1} - X_k)\mathbb{1}_{A_k}]$ 的有界性可以推出 $\sum_{k=1}^{\infty} \mathbb{E}[(X_{k+1} - X_k)\mathbb{1}_{A_k^c}]$ 的有界性。

## 梳理与比较

前面介绍了不少关于序列收敛性的内容，为了方便读者理解，下面对这些内容进行梳理。

## ◇ 确定性序列

\- 单调序列：如定理C.1所示，如果一个序列是单调且有界的，那么它一定收敛。

\- 非单调序列：如定理C.2所示，即使一个序列是非单调的，但如果非单调的变化是被抑制的（例如 $\sum_{k=1}^{\infty}(x_{k+1} - x_k)^{+} < \infty$ ），那么它仍然收敛。

◇ 随机序列

\- Submartingale或Supermartingale：如定理C.3所示，由于Submartingale和Supermartingale的期望是单调变化的，因此该序列几乎必然收敛。

\- Quasimartingale: 如定理C.4所示, 即使 Quasimartingale 的期望是非单调的, 但如果非单调的变化是被抑制的 (例如 $\sum_{k=1}^{\infty} \mathbb{E}\left[(X_{k+1}-X_k)\mathbb{1}_{\mathbb{E}[X_{k+1}-X_k|\mathcal{H}_k]>0}\right]<\infty$ ), 那么它仍然收敛。

为了方便读者理解，表C.1汇总了不同种类的鞅的期望值的单调性。

表 C.1 不同种类的鞅的期望值的单调性总结。

<table><tr><td>鞅的变体</td><td>期望的单调性</td></tr><tr><td>鞅(Martingale)</td><td>常数: $\mathbb{E}[X_{k+1}] = \mathbb{E}[X_k]$ </td></tr><tr><td>次鞅(Submartingale)</td><td>递增: $\mathbb{E}[X_{k+1}] \geqslant \mathbb{E}[X_k]$ </td></tr><tr><td>超鞅(Supermartingale)</td><td>递减: $\mathbb{E}[X_{k+1}] \leqslant \mathbb{E}[X_k]$ </td></tr><tr><td>准鞅(Quasimartingale)</td><td>非单调</td></tr></table>

## 附录D

梯度下降方法是最常用的优化方法之一，它也是[第6章](ch06.md)介绍的随机梯度下降方法的基础。

## 凸性

## ◇ 定义

\- 凸集：假设 $\mathcal{D}$ 是 $\mathbb{R}^n$ 的一个子集。如果对于任意的 $x, y \in \mathcal{D}$ 以及任意 $c \in [0,1]$ 都有 $z \doteq cx + (1 - c)y \in \mathcal{D}$ ，那么这个集合是凸集（convex set）。

\- 凸函数：假设 $f: \mathcal{D} \to \mathbb{R}$ ，其中 $\mathcal{D}$ 是凸的。如果

$$
f (c x + (1 - x) y) \leqslant c f (x) + (1 - c) f (y)
$$

对所有 $x, y \in \mathcal{D}$ 和 $c \in [0,1]$ 都成立，那么 $f(x)$ 是凸函数（convex function）。

## ◇ 判别条件

\- 一阶条件：考虑函数 $f: \mathcal{D} \to \mathbb{R}$ ，其中 $\mathcal{D}$ 是凸的。如果

$$
f (y) - f (x) \geqslant \nabla f (x) ^{\mathrm{T}} (y - x)\tag{D.1}
$$

对所有 $x, y \in \mathcal{D}$ 都成立，那么 $f$ 是凸的[106, 第3.1.3节]。当 $x$ 是标量时， $\nabla f(x)$ 表示 $f(x)$ 在 $x$ 的切线斜率，此时(D.1)的几何解释是点 $(y, f(y))$ 总是位于切线之上。

\- 二阶条件：考虑函数 $f: \mathcal{D} \to \mathbb{R}$ ，其中 $\mathcal{D}$ 是凸的。如果

$$
\nabla^{2} f (x) \succeq 0
$$

对所有 $x \in \mathcal{D}$ 都成立，那么 $f$ 是凸的。这里 $\nabla^2 f(x)$ 是海森矩阵（Hessian matrix）。

## ◇ 凸度

不同凸函数的凸度（degree of convexity）可能是不同的。后面我们将看到凸度可能影响梯度下降算法中步长的选择。海森矩阵是描述凸度的一个有效工具。具体来说，如果在某一点海森矩阵 $\nabla^2 f(x)$ 接近奇异，那么该函数在该点周围是平坦的，因此是弱凸的。相反，如果 $\nabla^2 f(x)$ 的最小奇异值是正的且较大，那么该函数在该点周围是弯曲的，因此是强凸的。

$\nabla^2 f(x)$ 的下界和上界在表征函数凸性方面起着重要作用。

\- $\nabla^2 f(x)$ 的下界：如果 $\nabla^2 f(x) \succeq \ell I_n$ 对所有 $x$ 都成立（其中 $\ell > 0$ ），那么该函数被称为强凸或严格凸（strictly convex）。

\- $\nabla^2 f(x)$ 的上界：如果 $\nabla^2 f(x) \preceq LI_n$ 对所有 $x$ 都成立（其中 $L > 0$ ），那么该函数在任意一点的凸度不可能任意大。换句话说，一阶导数 $\nabla f(x)$ 不可能任意快的变化，因为其变化率是有上界的，该上界条件可以由 $\nabla f(x)$ 的利普希茨（Lipschitz）条件导出，如下所示。

引理D.1。假设 $f$ 是一个凸函数。如果 $\nabla f(x)$ 是利普希茨连续的并且利普希茨常数为 $L$ ，即

$$
\| \nabla f (x) - \nabla f (y) \| \leqslant L \| x - y \|, \quad{\text{对任意}} x, y,
$$

那么 $\nabla^2 f(x) \preceq LI_n$ 对任意 $x$ 都成立。这里 $\| \cdot \|$ 表示欧几里得范数。

梯度下降算法

考虑如下优化问题：

$$
\min_{x} f (x)
$$

其中 $x\in \mathcal{D}\subseteq \mathbb{R}^n,f:\mathcal{D}\to \mathbb{R}$ 。可用于求解该优化问题的梯度下降算法是

$$
x_{k + 1} = x_{k} - \alpha_{k} \nabla f (x_{k}), \quad k = 0, 1, 2, \dots\tag{D.2}
$$

其中 $\alpha_{k}$ 被称为步长（step size），它可以固定不变，也可以不断变化。下面是关于(D.2)的一些解释说明。

$\diamond$ 变化的方向： $\nabla f(x_{k})$ 是一个向量，指向 $f(x)$ 在 $x_{k}$ 附近增加最快的方向。因此， $-\nabla f(x_{k})$ 是 $f(x)$ 在 $x_{k}$ 附近减小最快的方向。

◇ 变化的幅度： $x_{k}$ 的变化量等于 $-\alpha_{k}\nabla f(x_{k})$ ，该量的幅值由步长 $\alpha_{k}$ 和 $\nabla f(x_{k})$ 的幅值共同决定。

\- $\nabla f(x_{k})$ 的幅值

当 $x_{k}$ 离最优解 $x^{*}$ 比较近时，由于 $\nabla f(x^{*}) = 0$ ，因此 $\| \nabla f(x_k)\|$ 的幅值比较小， $x_{k}$ 的变化幅值较小。这是合理的，因为此时已经接近最优解，应避免大幅度改变 $x$ 从而错过最优解。

当 $x_{k}$ 离最优解 $x^{*}$ 比较远时， $\nabla f(x_k)$ 的幅值可能较大，此时 $x_{k}$ 的变化幅值也较大。这也是合理的，因为我们希望能尽快接近最优解。

\- 步长 $\alpha_{k}$ 的大小

如果 $\alpha_{k}$ 较小，那么 $-\alpha_{k} \nabla f(x_{k})$ 的幅值也较小，因此收敛过程缓慢。如果 $\alpha_{k}$ 太大，那么 $x_{k}$ 的变化较为激进，这可能加快收敛速度，也可能导致发散。

我们应该如何选择 $\alpha_{k}$ 呢？ $\alpha_{k}$ 的选择应该依赖于 $f(x_{k})$ 的凸度。如果函数在最优解附近比较弯曲（即凸度强），那么步长 $\alpha_{k}$ 应该较小，从而保证收敛。如果函数在最优解附近比较平坦（即凸度弱），那么步长可以较大，从而快速接近最优解。

## 收敛性分析

下面给出梯度下降算法(D.2)的收敛性分析，即证明 $x_{k}$ 能够收敛到最优解 $x^{*}$ ，该最优解满足 $\nabla f(x^{*}) = 0$ 。首先，我们做一些假设。

◇ 假设1： $f(x)$ 是强凸的，从而有

$$
\nabla^{2} f (x) \succeq \ell I,
$$

其中 $\ell > 0$ 。

◇ 假设 2: $\nabla f(x)$ 是利普希茨连续的。由引理D.1可得

$$
\nabla^{2} f (x) \preceq L I_{n}.
$$

收敛性证明如下所示。

证明：对于任意的 $x_{k + 1}$ 和 $x_{k}$ ，根据文献[106,第9.1.2节]，我们有

$$
f \left(x_{k + 1}\right) = f \left(x_{k}\right) + \nabla f \left(x_{k}\right) ^{\mathrm{T}} \left(x_{k + 1} - x_{k}\right) + \frac{1}{2} \left(x_{k + 1} - x_{k}\right) ^{\mathrm{T}} \nabla^{2} f \left(z_{k}\right) \left(x_{k + 1} - x_{k}\right),\tag{D.3}
$$

其中 $z_{k}$ 是 $x_{k}$ 和 $x_{k + 1}$ 的一个凸组合（convex combination）。根据假设条件 $\nabla^2 f(z_k)\preceq$ $L I_{n}$ ，可得 $\| \nabla^{2}f(z_{k})\| \leqslant L$ 。那么从式(D.3)可以推出

$$
\begin{array}{r l} & f (x_{k + 1}) \leqslant f (x_{k}) + \nabla f (x_{k}) ^{\mathrm{T}} (x_{k + 1} - x_{k}) + \frac{1}{2} \| \nabla^{2} f (z_{k}) \| \| x_{k + 1} - x_{k} \| ^{2} \\ & \quad \leqslant f (x_{k}) + \nabla f (x_{k}) ^{\mathrm{T}} (x_{k + 1} - x_{k}) + \frac{L}{2} \| x_{k + 1} - x_{k} \| ^{2}. \end{array}
$$

将 $x_{k + 1} = x_k - \alpha_k\nabla f(x_k)$ 代入上述不等式得

$$
\begin{array}{l} f (x_{k + 1}) \leqslant f (x_{k}) + \nabla f (x_{k}) ^{\mathrm{T}} (- \alpha_{k} \nabla f (x_{k})) + \frac{L}{2} \| \alpha_{k} \nabla f (x_{k}) \| ^{2} \\ = f (x_{k}) - \alpha_{k} \| \nabla f (x_{k}) \| ^{2} + \frac{\alpha_{k} ^{2} L}{2} \| \nabla f (x_{k}) \| ^{2} \\ = f (x_{k}) - \underbrace{\alpha_{k} \left(1 - \frac{\alpha_{k} L}{2}\right)} _{\eta_{k}} \| \nabla f (x_{k}) \| ^{2}. \end{array}\tag{D.4}
$$

下面证明如果选择

$$
0 <   \alpha_{k} <   \frac{2}{L},\tag{D.5}
$$

那么序列 $\{f(x_k)\}_{k=1}^{\infty}$ 收敛于 $f(x^{*})$ ，其中 $\nabla f(x^{*}) = 0$ 。第一，由式(D.5)可知 $\eta_k > 0$ ，进而由式(D.4)可知 $f(x_{k+1}) \leqslant f(x_k)$ ，所以 $\{f(x_k)\}$ 是一个递减序列。第二，由于 $f(x_k) \geqslant f(x^{*})$ 对所有 $x_k$ 成立，根据单调收敛定理C.1，可知 $\{f(x_k)\}$ 随着 $k \to \infty$ 收敛。假设其收敛值为 $f^{*}$ ，在式(D.4)的两边取极限可得

$$
\begin{array}{l} \lim_{k \to \infty} f (x_{k + 1}) \leqslant \lim_{k \to \infty} f (x_{k}) - \lim_{k \to \infty} \eta_{k} \| \nabla f (x_{k}) \| ^{2} \\ \Leftrightarrow f^{*} \leqslant f^{*} - \lim_{k \to \infty} \eta_{k} \| \nabla f (x_{k}) \| ^{2} \\ \Leftrightarrow 0 \leqslant - \lim_{k \to \infty} \eta_{k} \| \nabla f (x_{k}) \| ^{2}. \end{array}
$$

由于 $\eta_{k}\| \nabla f(x_{k})\|^{2}\geqslant 0$ ，上述不等式表明 $\lim_{k\to \infty}\eta_k\| \nabla f(x_k)\| ^2 = 0$ 。如果 $\eta_{k}$ 不接近于0，那么 $\nabla f(x)$ 收敛到0，因此 $x$ 收敛到 $x^{*}$ 。证明完毕。以上证明受到[107]启发。

不等式(D.5)告诉了我们该如何选择 $\alpha_{k}$ 。如果函数较平坦（即 $L$ 较小），那么步长可以大一点；如果函数较弯曲（即 $L$ 较大），那么步长必须足够小才能确保收敛。当然，还有许多其他方法可以证明梯度下降算法的收敛性，例如收缩映射定理[108,引理3]，更全面的介绍可以参见文献[106]。


## 符号

在本书中，矩阵、随机变量通常由大写字母表示；向量、标量、样本值通常由小写字母表示。本书常用的数学符号如下所述。

$= \quad$ 等于 $\approx$ 近似 $\doteq$ 定义 $\geqslant , >, \leqslant , <$ 向量或者矩阵元素间的比较 $\in$ 属于 $\| \cdot \|_2$ 向量的欧几里得范数或相应的诱导矩阵范数 $\| \cdot \|_\infty$ 向量的无穷范数或相应的诱导矩阵范数 $\ln$ 自然对数 $\mathbb{R}$ 实数集合 $\mathbb{R}^n$ 由所有 $n$ 维实数向量组成的集合 $\mathbb{R}^{n\times m}$ 由所有 $n\times m$ 维实数矩阵组成的集合 $A\succeq 0 (A\succ 0)$ 矩阵 $A$ 是半正定的（正定的） $A\succeq 0 (A\succ 0)$ 矩阵 $A$ 是半负定的（负定的） $|x|$ 实数 $x$ 的绝对值 $|S|$ 集合 $S$ 中元素的个数 $\nabla_x f(x)$ 标量函数 $f(x)$ 对向量 $x$ 的梯度，有时简写为 $\nabla f(x)$ $[A]_{ij}$ 矩阵 $A$ 中第 $i$ 行第 $j$ 列的元素 $[x]_i$ 向量 $x$ 的第 $i$ 个元素 $X\sim p$ 随机变量 $X$ 的概率分布是 $p$ $p(X = x),\Pr (X = x)$ $X = x$ 的概率，常简写为 $p(x)$ 或 $\Pr (x)$ $p(x|y)$ 条件概率 $\mathbb{E}_{X\sim p}[X]$ 随机变量 $X$ 的期望值；当 $X$ 的分布明确时，常简写为 $\mathbb{E}[X]$ $\operatorname{var}(X)$ 随机变量 $X$ 的方差 $\arg \max_xf(x)$ 使得 $f(x)$ 达到最大值的最优 $x$ $\mathbb{1}_n$ 元素全为1的向量；当其维数明确时，常简写为1 $I_{n}$ $n\times n$ 的单位矩阵；当其维数明确时，常简写为 $I$

## 索引

$\epsilon$ -Greedy策略，88 $n$ -StepSarsa算法，135

Dvoretzky 定理, 107

Expected Sarsa 算法, 134

Off-policy 演员-评论家算法, 217
伪代码, 222
策略梯度定理, 220
重要性采样, 217

Off-policy 策略梯度定理, 220

Q-learning算法（基于值函数），177伪代码，177深度Q-learning,178

Q-learning算法（基于表格），137伪代码，140示例，141异策略，138

QAC算法, 213

REINFORCE算法, 206

Sarsa算法（基于值函数），176
伪代码，176
Sarsa算法（基于表格），130
n-Step Sarsa算法，135
Expected Sarsa算法，134
伪代码，132
同策略，139
学习最优策略，132
收敛性分析，132

不动点, 41
优势演员-评论家算法, 213
伪代码, 216
基准不变性, 213
时序差分误差, 216
最优基准函数, 214

## 值函数法

最小二乘TD算法（LSTD），174
深度Q-learning, 178
状态值估计，153
理论分析，165
贝尔曼误差，170
Q-learning算法，177
Sarsa算法，176
投影贝尔曼误差，171
示例，161
线性函数，153, 160

值迭代算法伪代码，59

动作，3

动作值（无折扣的情况），200
示例, 31

动作值（有折扣的情况），30与状态值的关系，30

动作空间, 3

压缩映射，41

压缩映射定理, 42

同策略, 138

回合，10

回合制任务, 10

回报，9

回放缓冲区，180

在线学习, 128

期望值估计, 78
增量形式算法, 100
罗宾斯-门罗算法, 106
随机梯度下降, 113

大数定律, 79

奖励, 7

平稳分布
值函数法, 154
策略梯度方法的目标函数, 189

异策略, 138

截断策略迭代算法伪代码，72与值迭代和策略迭代的比较，73

投影贝尔曼误差, 171

折扣回报, 10

折扣因子, 10

探索与利用, 91, 207

时序差分方法, 123, 149, 187, 211
n-Step Sarsa 算法, 135
Expected Sarsa 算法, 134
Q-learning 算法, 137
Sarsa 算法, 130
与蒙特卡罗方法比较, 127
值函数法, 150
状态值的估计, 124
统一框架, 142
时序差分目标, 126
时序差分误差, 126

时序差分目标, 126

时序差分误差，126

智能体, 12

最优状态值, 37

最优策略, 37
奖励设置的影响, 50
折扣因子的影响, 50
贪婪策略, 48

最小二乘TD算法（LSTD），174递归最小二乘，175

柯西序列, 43

模型，12

泊松方程, 201

深度Q-learning,178伪代码，180回放缓冲区，180示例，180经验回放，180主网络，179目标网络，179

演员-评论家方法, 212
Off-policy 演员-评论家算法, 217
优势演员-评论家算法, 213
确定性 Actor-Critic 算法, 223
确定性策略梯度算法, 223
QAC 算法, 213

特征向量, 151

状态, 2

状态值（无折扣的情况），200

状态值（有折扣的情况），19
与动作值的关系, 30
函数表示, 150

状态空间, 2

状态转移，3

环境, 12

确定性 Actor-Critic 算法, 223伪代码, 230
确定性策略梯度定理, 223
确定性策略梯度算法, 223

确定性策略梯度定理, 223

离线学习, 128

策略, 5
函数表示, 188
确定性策略, 6
表格表示法, 6
随机性策略, 6

策略梯度定理, 194
确定性情形, 223

策略梯度方法目标函数的不同表达式, 193目标函数：平均奖励, 191目标函数：平均状态值, 189REINFORCE算法, 206探索与利用, 207策略梯度定理, 194

策略评价
求解贝尔曼方程, 27
示例, 17

策略迭代算法, 62
伪代码, 66

经验回放，180

网格世界, 2

罗宾斯-门罗算法, 101
应用于期望值估计, 106
收敛性分析, 104

自举法, 18

蒙特卡罗方法, 78
MC ε-Greedy 算法, 89
MC Basic 算法, 81
MC Exploring Starts 算法, 86 蒙特卡罗策略梯度算法, 206

贝尔曼方程, 20
元素展开形式, 21
基于动作值的表达式
矩阵-向量形式, 26
示例, 22
等价表达式, 22
策略评价, 27
解析解, 27
迭代解, 27

贝尔曼最优方程, 38
元素展开形式, 38
压缩性质, 45
最优状态值, 47
最优策略, 47
求解定理, 46
矩阵-向量形式, 40

贝尔曼期望方程, 125

贝尔曼误差, 170

轨迹, 9

重要性采样, 217
示例, 218
重要性权重, 218

随机梯度下降, 112
与批量梯度下降的对比, 117
应用于期望值估计, 113
收敛性分析, 118
收敛模式, 114
确定性表述, 116

马尔可夫决策过程, 11
平稳分布, 155

马尔可夫性质, 12

马尔可夫过程, 12

## 参考文献

[1] M. Pinsky and S. Karlin, An introduction to stochastic modeling (3rd Edition). Academic Press, 1998.

[2] M. L. Puterman, Markov decision processes: Discrete stochastic dynamic programming. John Wiley & Sons, 2014.

[3] R. S. Sutton and A. G. Barto, Reinforcement learning: An introduction (2nd Edition). MIT Press, 2018.

[4] R. A. Horn and C. R. Johnson, Matrix analysis. Cambridge University Press, 2012.

[5] D. P. Bertsekas and J. N. Tsitsiklis, Neuro-dynamic programming. Athena Scientific, 1996.

[6] H. K. Khalil, Nonlinear systems (3rd Edition). Patience Hall, 2002.

[7] G. Strang, Calculus. Wellesley-Cambridge Press, 1991.

[8] A. Besenyei, “A brief history of the mean value theorem,” 2012, Lecture notes.

[9] A. Y. Ng, D. Harada, and S. Russell, “Policy invariance under reward transformations: Theory and application to reward shaping,” in International Conference on Machine Learning, vol. 99, 1999, pp. 278–287.

[10] R. E. Bellman, Dynamic programming. Princeton University Press, 2010.

[11] R. E. Bellman and S. E. Dreyfus, Applied dynamic programming. Princeton University Press, 2015.

[12] J. Bibby, “Axiomatisations of the average and a further generalisation of monotonic sequences,” Glasgow Mathematical Journal, vol. 15, no. 1, 1974, pp. 63–65.

[13] A. S. Polydoros and L. Nalpantidis, “Survey of model-based reinforcement learning: Applications on robotics,” Journal of Intelligent & Robotic Systems, vol. 86, no. 2, 2017, pp. 153-173.

[14] T. M. Moerland, J. Broekens, A. Plaat, and C. M. Jonker, “Model-based reinforcement learning: A survey,” Foundations and Trends in Machine Learning, vol. 16, no. 1, 2023, pp. 1-118.

[15] F.-M. Luo, T. Xu, H. Lai, X.-H. Chen, W. Zhang, and Y. Yu, “A survey on model-based reinforcement learning,” arXiv:2206.09328, 2022.

[16] X. Wang, Z. Zhang, and W. Zhang, “Model-based multi-agent reinforcement learning: Recent progress and prospects,” arXiv:2203.10603, 2022.

[17] M. Riedmiller, R. Hafner, T. Lampe, et al., “Learning by playing solving sparse reward tasks from scratch,” in International Conference on Machine Learning, 2018, pp. 4344-

4353.

[18] J. Ibarz, J. Tan, C. Finn, M. Kalakrishnan, P. Pastor, and S. Levine, “How to train your robot with deep reinforcement learning: Lessons we have learned,” The International Journal of Robotics Research, vol. 40, no. 4-5, 2021, pp. 698-721.

[19] S. Narvekar, B. Peng, M. Leonetti, J. Sinapov, M. E. Taylor, and P. Stone, “Curriculum learning for reinforcement learning domains: A framework and survey,” The Journal of Machine Learning Research, vol. 21, no. 1, 2020, pp. 7382-7431.

[20] C. Szepesvári, Algorithms for reinforcement learning. Springer, 2010.

[21] A. Maroti, “RBED: Reward based epsilon decay,” arXiv:1910.13701, 2019.

[22] V. Mnih, K. Kavukcuoglu, D. Silver, “Human-level control through deep reinforcement learning,” Nature, vol. 518, no. 7540, 2015, pp. 529–533.

[23] W. Dabney, G. Ostrovski, and A. Barreto, “Temporally-extended epsilon-greedy exploration,” arXiv:2006.01782, 2020.

[24] H.-F. Chen, Stochastic approximation and its applications. Springer Science & Business Media, 2006, vol. 64.

[25] H. Robbins and S. Monro, “A stochastic approximation method,” The Annals of Mathematical Statistics, 1951, pp. 400-407.

[26] J. Venter, “An extension of the Robbins-Monro procedure,” The Annals of Mathematical Statistics, vol. 38, no. 1, 1967, pp. 181-190.

[27] D.Ruppert, "Efficient estimations from a slowly convergent Robbins-Monro process," Cornell University Operations Research and Industrial Engineering, Tech. Rep., 1988.

[28] J. Lagarias, “Euler’s constant: Euler’s work and modern developments,” Bulletin of the American Mathematical Society, vol. 50, no. 4, 2013, pp. 527-628.

[29] J. H. Conway and R. Guy, The book of numbers. Springer Science & Business Media, 1998.

[30] S. Ghosh, “The Basel problem,” arXiv:2010.03953, 2020.

[31] A. Dvoretzky, “On stochastic approximation,” in The Third Berkeley Symposium on Mathematical Statistics and Probability, 1956.

[32] T. Jaakkola, M. I. Jordan, and S. P. Singh, “On the convergence of stochastic iterative dynamic programming algorithms,” Neural Computation, vol. 6, no. 6, 1994, pp. 1185-1201.

[33] T. Kailath, A. H. Sayed, and B. Hassibi, Linear estimation. Prentice Hall, 2000.

[34] C. K. Chui and G. Chen, Kalman filtering. Springer, 2017.

[35] G. A. Rummery and M. Niranjan, On-line Q-learning using connectionist systems. Technical Report, Cambridge University, 1994.

[36] H. Van Seijen, H. Van Hasselt, S. Whiteson, and M. Wiering, “A theoretical and empirical analysis of Expected Sarsa,” in IEEE Symposium on Adaptive Dynamic Pro-

gramming and Reinforcement Learning, 2009, pp. 177-184.

[37] M. Ganger, E. Duryea, and W. Hu, “Double Sarsa and double expected Sarsa with shallow and deep learning,” Journal of Data Analysis and Information Processing, vol. 4, no. 4, 2016, pp. 159-176.

[38] C. J. C. H. Watkins, “Learning from delayed rewards,” Ph.D. dissertation, King’s College, 1989.

[39] C. J. Watkins and P. Dayan, “Q-learning,” Machine learning, vol. 8, no. 3-4, 1992, pp. 279-292.

[40] T. C. Hesterberg, Advances in importance sampling. PhD Thesis, Stanford University, 1988.

[41] H. Hasselt, “Double Q-learning,” Advances in Neural Information Processing Systems, vol. 23, 2010.

[42] H. Van Hasselt, A. Guez, and D. Silver, “Deep reinforcement learning with double Q-learning,” in AAAI Conference on Artificial Intelligence, vol. 30, 2016.

[43] C. Dann, G. Neumann, and J. Peters, “Policy evaluation with temporal differences: A survey and comparison,” Journal of Machine Learning Research, vol. 15, 2014, pp. 809-883.

[44] J. Clifton and E. Laber, “Q-learning: Theory and applications,” Annual Review of Statistics and Its Application, vol. 7, 2020, pp. 279-301.

[45] B. Jang, M. Kim, G. Harerimana, and J. W. Kim, “Q-learning algorithms: A comprehensive classification and applications,” IEEE Access, vol. 7, 2019, pp. 133653-133667.

[46] R. S. Sutton, “Learning to predict by the methods of temporal differences,” Machine Learning, vol. 3, no. 1, 1988, pp. 9-44.

[47] G. Strang, Linear algebra and its applications (4th Edition). Belmont, CA: Thomson, Brooks/Cole, 2006.

[48] C. D. Meyer and I. Stewart, Matrix analysis and applied linear algebra. SIAM, 2023.

[49] M. Pinsky and S. Karlin, An introduction to stochastic modeling. Academic Press, 2010.

[50] M. G. Lagoudakis and R. Parr, “Least-squares policy iteration,” The Journal of Machine Learning Research, vol. 4, 2003, pp. 1107-1149.

[51] R. Munos, “Error bounds for approximate policy iteration,” in International Conference on Machine Learning, vol. 3, 2003, pp. 560-567.

[52] A. Geramifard, T. J. Walsh, S. Tellex, G. Chowdhary, N. Roy, and J. P. How, “A tutorial on linear function approximators for dynamic programming and reinforcement learning,” Foundations and Trends in Machine Learning, vol. 6, no. 4, 2013, pp. 375-451.

[53] B. Scherrer, "Should one compute the temporal difference fix point or minimize the

Bellman residual? the unified oblique projection view," in International Conference on Machine Learning, 2010.

[54] D. P. Bertsekas, Dynamic programming and optimal control: Approximate dynamic programming (Volume II). Athena Scientific, 2011.

[55] S. Abramovich, G. Jameson, and G. Sinnamon, “Refining Jensen’s inequality,” Bulletin mathématique de la Société des Sciences Mathématiques de Roumanie, 2004, pp. 3-14.

[56] S. S. Dragomir, “Some reverses of the Jensen inequality with applications,” Bulletin of the Australian Mathematical Society, vol. 87, no. 2, 2013, pp. 177-194.

[57] S. J. Bradtke and A. G. Barto, “Linear least-squares algorithms for temporal difference learning,” Machine Learning, vol. 22, no. 1, 1996, pp. 33–57.

[58] K. S. Miller, “On the inverse of the sum of matrices,” Mathematics Magazine, vol. 54, no. 2, 1981, pp. 67-72.

[59] S. A. U. Islam and D. S. Bernstein, “Recursive least squares for real-time implementation,” IEEE Control Systems Magazine, vol. 39, no. 3, 2019, pp. 82-85.

[60] V. Mnih, K.Kavukcuogle, D.Silver, “Playing Atari with deep reinforcement learning,” arXiv preprint arXiv:1312.5602, 2013.

[61] J. Fan, Z. Wang, Y. Xie, and Z. Yang, “A theoretical analysis of deep Q-learning,” in Learning for Dynamics and Control, 2020, pp. 486-489.

[62] L.-J. Lin, Reinforcement learning for robots using neural networks. 1992, Technical report.

[63] J. N. Tsitsiklis and B. Van Roy, “An analysis of temporal-difference learning with function approximation,” IEEE Transactions on Automatic Control, vol. 42, no. 5, 1997, pp. 674-690.

[64] R. S. Sutton, D. McAllester, S. Singh, and Y. Mansour, “Policy gradient methods for reinforcement learning with function approximation,” Advances in Neural Information Processing Systems, vol. 12, 1999.

[65] P. Marbach and J. N. Tsitsiklis, “Simulation-based optimization of Markov reward processes,” IEEE Transactions on Automatic Control, vol. 46, no. 2, 2001, pp. 191-209.

[66] J. Baxter and P. L. Bartlett, “Infinite-horizon policy-gradient estimation,” Journal of Artificial Intelligence Research, vol. 15, 2001, pp. 319-350.

[67] X.-R. Cao, “A basic formula for online policy gradient algorithms,” IEEE Transactions on Automatic Control, vol. 50, no. 5, 2005, pp. 696-699.

[68] R. J. Williams, “Simple statistical gradient-following algorithms for connectionist reinforcement learning,” Machine Learning, vol. 8, no. 3, 1992, pp. 229–256.

[69] J. Peters and S. Schaal, “Reinforcement learning of motor skills with policy gradients,” Neural Networks, vol. 21, no. 4, 2008, pp. 682-697.

[70] E. Greensmith, P. L. Bartlett, and J. Baxter, "Variance reduction techniques for gradient estimates in reinforcement learning," Journal of Machine Learning Research, vol. 5, no. 9, 2004.

[71] V. Mnih, A.P. Badia, M. Mirza, “Asynchronous methods for deep reinforcement learning,” in International Conference on Machine Learning, 2016, pp. 1928-1937.

[72] M. Babaeizadeh, I. Frosio, S. Tyree, J. Clemons, and J. Kautz, “Reinforcement learning through asynchronous advantage actor-critic on a GPU,” arXiv:1611.06256, 2016.

[73] T. Degris, M. White, and R. S. Sutton, “Off-policy actor-critic,” arXiv:1205.4839, 2012.

[74] D. Silver, G. Lever, N. Heess, T. Degris, D. Wierstra, and M. Riedmiller, “Deterministic policy gradient algorithms,” in International Conference on Machine Learning, 2014, pp. 387-395.

[75] T. P. Lillicrap, J.J.Hunt, A.Pritzel, “Continuous control with deep reinforcement learning,” arXiv:1509.02971, 2015.

[76] T. Haarnoja, A. Zhou, P. Abbeel, and S. Levine, “Soft actor-critic: Off-policy maximum entropy deep reinforcement learning with a stochastic actor,” in International Conference on Machine Learning, 2018, pp. 1861-1870.

[77] T. Haarnoja, A. Zhou, K. Hartikaimen, “Soft actor-critic algorithms and applications,” arXiv:1812.05905, 2018.

[78] J. Schulman, S. Levine, P. Abbeel, M. Jordan, and P. Moritz, “Trust region policy optimization,” in International Conference on Machine Learning, 2015, pp. 1889-1897.

[79] J. Schulman, F. Wolski, P. Dhariwal, A. Radford, and O. Klimov, “Proximal policy optimization algorithms,” arXiv:1707.06347, 2017.

[80] S. Fujimoto, H. Hoof, and D. Meger, “Addressing function approximation error in actor-critic methods,” in International Conference on Machine Learning, 2018, pp. 1587-1596.

[81] J. Foerster, G. Farquhar, T. Afouras, N. Nardelli, and S. Whiteson, “Counterfactual multi-agent policy gradients,” in AAAI Conference on Artificial Intelligence, vol. 32, 2018.

[82] R. Lowe, Y. I. Wu, A. Tamar, J. Harb, O. Pieter Abbeel, and I. Mordatch, “Multiagent actor-critic for mixed cooperative-competitive environments,” Advances in Neural Information Processing Systems, vol. 30, 2017.

[83] Y. Yang, R. Luo, M. Li, M. Zhou, W. Zhang, and J. Wang, “Mean field multi-agent reinforcement learning,” in International Conference on Machine Learning, 2018, pp. 5571-5580.

[84] O. Vinyals, I. Babuschkin, W.M. Czarnecki, “Grandmaster level in StarCraft II using multi-agent reinforcement learning,” Nature, vol. 575, no. 7782, 2019, pp. 350-354.

[85] Y. Yang and J. Wang, “An overview of multi-agent reinforcement learning from game theoretical perspective,” arXiv:2011.00583, 2020.

[86] S. Levine and V. Koltun, “Guided policy search,” in International Conference on Machine Learning, 2013, pp. 1–9.

[87] M. Janner, J. Fu, M. Zhang, and S. Levine, “When to trust your model: Model-based policy optimization,” Advances in Neural Information Processing Systems, vol. 32, 2019.

[88] M. G. Bellemare, W. Dabney, and R. Munos, “A distributional perspective on reinforcement learning,” in International Conference on Machine Learning, 2017, pp. 449–458.

[89] M. G. Bellemare, W. Dabney, and M. Rowland, Distributional Reinforcement Learning. MIT Press, 2023.

[90] H. Zhang, D. Liu, Y. Luo, and D. Wang, Adaptive dynamic programming for control: algorithms and stability. Springer Science & Business Media, 2012.

[91] F. L. Lewis, D. Vrabie, and K. G. Vamvoudakis, “Reinforcement learning and feedback control: Using natural decision methods to design optimal adaptive controllers,” IEEE Control Systems Magazine, vol. 32, no. 6, 2012, pp. 76-105.

[92] F. L. Lewis and D. Liu, Reinforcement learning and approximate dynamic programming for feedback control. John Wiley & Sons, 2013.

[93] Z.-P. Jiang, T. Bian, and W. Gao, “Learning-based control: A tutorial and some recent results,” Foundations and Trends in Systems and Control, vol. 8, no. 3, 2020, pp. 176-284.

[94] S. Meyn, Control systems and reinforcement learning. Cambridge University Press, 2022.

[95] S. E. Li, Reinforcement learning for sequential decision and optimal control. Springer, 2023.

[96] J. S. Rosenthal, First look at rigorous probability theory (2nd Edition). World Scientific Publishing Company, 2006.

[97] D. Pollard, A user's guide to measure theoretic probability. Cambridge University Press, 2002.

[98] P. J. Spreij, “Measure theoretic probability,” UvA Course Notes, 2012.

[99] R. G. Bartle, The elements of integration and Lebesgue measure. John Wiley & Sons, 2014.

[100] M. Taboga, Lectures on probability theory and mathematical statistics (2nd Edition). CreateSpace Independent Publishing Platform, 2012.

[101] T. Kennedy, “Theory of probability,” 2007, Lecture notes.

[102] A. W. Van der Vaart, Asymptotic statistics. Cambridge University Press, 2000.

[103] L. Bottou, “Online learning and stochastic approximations,” Online Learning in Neural Networks, vol. 17, no. 9, 1998, p. 142.

[104] D. Williams, Probability with martingales. Cambridge University Press, 1991.

[105] M. Métivier, Semimartingales: A course on stochastic processes. Walter de Gruyter, 1982.

[106] S. Boyd, S. P. Boyd, and L. Vandenberghe, Convex optimization. Cambridge University Press, 2004.

[107] S. Bubeck et al., “Convex optimization: Algorithms and complexity,” Foundations and Trends in Machine Learning, vol. 8, no. 3-4, 2015, pp. 231-357.

[108] A. Jung, “A fixed-point of view on gradient methods for big data,” Frontiers in Applied Mathematics and Statistics, vol. 3, p. 18, 2017.

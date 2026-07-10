---
title: "相干态路径积分的失效：两个简单例子"
description: "Wilson & Galitski（2011）展示了时间连续相干态路径积分在自旋路径积分和单格点 Bose-Hubbard 模型中失效的两个具体例子——当哈密顿量对构造相干态的代数生成元是二次型时，路径积分无法复现算符方法的正确结果，而时间离散版本不受影响。"
date: "2026-07-10T08:00:00+08:00"
author: "Justin H. Wilson, Victor Galitski"
year: 2011
category: ["quant-ph", "cond-mat"]
weight: 38
tags: ['路径积分', '相干态']
links:
  - name: "DOI (PRL)"
    url: "https://doi.org/10.1103/PhysRevLett.106.110401"
  - name: "arXiv"
    url: "https://arxiv.org/abs/1012.1328"
---

## 相干态路径积分的失效：两个简单例子

Justin H. Wilson<sup>1</sup> 和 Victor Galitski<sup>1</sup>

<sup>1</sup>Joint Quantum Institute and Condensed Matter Theory Center, Department of Physics, University of Maryland, College Park, Maryland 20742-4111, USA (日期：2014年1月2日)

我们展示了时间连续的相干态路径积分如何在单格点Bose-Hubbard模型和自旋路径积分中失效。具体而言，当哈密顿量是用于构造相干态的代数生成元的二次型时，路径积分无法产生算符方法得出的正确结果。正如前人学者所指出，我们注意到这些问题在路径积分的时间离散化版本中不会出现。

路径积分作为量子力学的另一种表述广为人知，并出现在许多教科书中，作为处理各种量子与统计力学问题的有用计算工具（例如参考文献[1–3]）。自其诞生以来，一直存在一个问题：如何为任何可由配备哈密顿量的希尔伯特空间描述的系统写出路径积分。解决该问题的一种方法就是现在所称的广义相干态路径积分[4, 5]，它推广了谐振子的相干态路径积分。路径积分[2]的关键观察是，给定一个哈密顿量H，传播子 $e^{- i t H}$ 在某个时间t可以分成N个切片 $ ( e^{- i t H / N} )^{N}$ ，并在每个乘法项之间插入一个由连续参数参数化的（过）完备基；广义相干态满足这一条件。如果我们取 $N \infty$ ，就得到时间连续的表述形式。相干态路径积分已在物理学的许多领域得到广泛和常规的应用（参见[6]中收集的众多论文）。

Glauber相干态[7]通常被理解为与谐振子相关的最经典态。它们服从谐振子的经典运动方程，并且是最小不确定态。Perelomov和Gilmore[8, 9]将相干态的定义扩展到海森堡代数（即谐振子代数）以外的李代数。此后，这些"广义"相干态被用于许多应用中（更多内容参见[10, 11]）。特别是，相干态构成一个过完备基（带有连续标记），因此允许单位分解，这是构造路径积分的必要要素。对于谐振子，相干态由一个复数α表示，但对于用su(2)（自旋）构造的相干态，它们是Bloch球面上的点 $S^{2}$。

对于谐振子的情况，众所周知，我们可以轻松地在正规序哈密顿量（所有湮灭算符右移）和相干态路径积分[1]之间进行转换；这是因为相干态是湮灭算符的本征矢。对于一般的相干态路径积分，路径积分中的"经典"哈密顿量仅仅是量子哈密顿量在相干态上的期望值。这一规则产生了一些著名的精确可解情形，但所有这些情形都涉及非相互作用项，这些项本质上在用于构造相干态的代数生成元中是线性的。当哈密顿量包含生成元的非线性项（相互作用）时，这一规则似乎会失效，正如本文所展示的。

路径积分广泛用于发展基于费曼图的微扰展开、非微扰技术（如瞬子方法）以及推导有效理论[2, 3]，但尽管路径积分取得了诸多成功，它们在数学基础上一直非常薄弱（关于这段历史的一个“片段”，可参见[12]）。特别是，自旋相干态路径积分有时会产生（定量上）错误的结果[13–17]，除非采用时间离散化形式[16, 18]。这些与时间连续路径积分相关的问题大多由Stone等人[19]通过识别涨落行列式中的一个反常来解决，该反常为半经典传播子增加了一个额外相位。Kochetov也在更一般的背景下发现了这一相位[20]。此外，Pletyukhov[21]将在谐振子情况下（在最简单的情形下，Weyl ordering对应于将湮灭算符和产生算符对称排序）将自旋路径积分中的额外相位与哈密顿量的Weyl排序联系起来。此外，Weyl排序在Bose-Hubbard情形下已在[22]中考虑过。不幸的是，这一解决方案并不能解释当前所考虑的失效现象。

在这篇短文中，我们概述了时间连续相干态路径积分的另一个问题。该问题体现在两个简单的例子中：(i) 自旋相干态路径积分和(ii) 谐振子相干态路径积分（特别是单格点Bose-Hubbard模型）。单格点Bose-Hubbard哈密顿量是一个最小模型，展示了正规排序路径积分的问题。然而，该问题本身比这里考虑的玩具模型更具一般性，并且显然会存在于更复杂的模型中，包括格点Bose-Hubbard模型。我们使用一种计算配分函数的精确方法（该方法最早由Cabra等人[23]用于自旋情形，其中$H = S_{z}$），并证明在算子正规排序（如大多数教科书所规定）和使用Weyl排序两种情况下，精确结果都与正确的配分函数存在差异（即，它不能由Solari和Kochetov[18, 20]发现并经Stone等人[19]详细阐述的相位反常所解释）。

我们从自旋的相干态路径积分开始，其中标准SU(2)代数定义在算子$\{S_{x} , S_{y} , S_{z} \}$上，满足$[ S_{i} , S_{j} ] = i \epsilon_{ijk} S_{k}$，我们通过取SU(2)群的$( 2 s + 1 ) \times ( 2 s + 1 )$矩阵表示来定义希尔伯特空间（s为系统的自旋）。与代数无关，我们通常可以定义一个厄米矩阵H，该矩阵作用于希尔伯特空间中的态，并且这将作为我们的哈密顿量。通常，H是代数生成元的多项式。

如果s是自旋-s系统中$S_{z}$的最大态，那么我们可以定义自旋相干态为$| {\bf n} \rangle = e^{- i \phi S_{z}} e^{- i \theta S_{y}} \left| s \right.$，其中$( \theta , \phi )$是球面$S^{2}$上沿单位向量n的坐标（即标准布洛赫球面上的一个点）。这些相干态是超完备的，满足$\frac{2 s + 1} {4 \pi} \int_{S^{2}} \mathrm{d} {\bf n} \left| {\bf n} \right. \left. {\bf n} \right| = 1$，其中$\mathrm{d} \mathbf{n} = \mathrm{d} \phi \mathrm{d} ( \cos \theta )$是$S^{2}$上的标准测度。利用这个连续的超完备基，我们可以用引言中讨论的标准方法[1]，从$\mathcal{Z} = \mathop{\mathrm{tr}} e^{- \beta H}$推导出自旋配分函数的标准路径积分：

$$
\mathcal{Z}^{\prime} = \int \mathcal{D} \mathbf{n} ( \tau ) \exp \{- \int_{0}^{\beta} \mathrm{d} \tau [ - \mathbf{n} ( \tau ) \partial_{\tau} \mathbf{n} ( \tau ) \tag{1}
$$

我们将由时间连续路径积分给出的配分函数称为 $\mathcal{Z}^{\prime}$，以区别于 $\mathcal{Z} = \mathop{\mathrm{tr}} e^{- \beta \hat{H}}$，因为我们将会发现，一般而言它们可能并不相等。该路径积分是对所有闭合路径进行的（因为它是配分函数）。方程（1）的作用量中的第一项 <sup>n</sup> ∂<sub>τ</sub> <sup>n</sup> 是贝里相位项，在(θ, φ) 坐标下为 $- \left. \mathbf{n} | \partial_{\tau} \mathbf{n} \right. = - s i ( 1 - \cos \theta ) \partial_{\tau} \phi$。

为了强调天真地使用方程（1）会出什么问题，我们采用Cabra等人[23]的方法。我们假设对于某个函数 $H ( x )$，有 $\langle \mathbf{n} ( \tau ) | H | \mathbf{n} ( \tau ) \rangle = H ( \cos \theta ( \tau ) )$（当且仅当哈密顿量 H 是对角矩阵时，这才成立）。这使得作用量对 φ 的依赖仅仅体现在作用量的贝里相位项中。然后我们对该贝里相位项进行分部积分；边界项就是 $\Delta \phi ( 1 - \cos \theta ( 0 ) )$，其中 $\Delta \phi = \phi ( \beta ) - \phi ( 0 ) = 2 \pi k$，k 为任意整数，同时因为我们的路径是闭合的，所以 $\cos \theta ( \beta ) = \cos \theta ( 0 )$。我们必须对由整数 k（即 φ 环绕球体的次数）定义的不同拓扑区进行求和。因此，我们唯一的 φ 依赖性是通过分部积分乘以 $\textstyle{\frac{\operatorname{dcos} \theta} {\operatorname{d} \tau}}$ 项得到的。我们使用泛函积分的标准恒等式 $\begin{array} {r l r} {\int{\mathcal{D}} \phi e^{- i \int_{0}^{\beta} \mathrm{d} \tau \phi ( \tau ) f ( \tau )}} & {{} =} & {} \end{array}$ $\delta ( f )$ 可以得到 cos θ 必须是常数 $\begin{array} {r} {( \mathrm{i . e . , ~} \frac{\operatorname{dcos} \theta} {\operatorname{d} \tau} = 0 )} \end{array}$。这个 δ 函数使我们能够对 $\mathcal{D} ( \cos \theta )$ 进行路径积分，除了初始值我们称之为 x := cos $\theta ( 0 )$。综合考虑这些因素，路径积分可以写成

$$
\mathcal{Z}^{\prime} = \sum_{k = - \infty}^{\infty} \int_{- 1}^{1} \mathrm{d} x e^{2 \pi i k s ( 1 - x ) - \beta H ( x )} .\tag{2}
$$

对 k 的求和可以求值为对形如 $\delta ( s ( 1 - x ) - n )$（对所有整数 n）的 δ 函数的求和。由于 x 在 -1 到 +1 区间内，只有有限个 n 有贡献（确切地说是 n = 0 到 n = 2s）。我们可以将对 n 的求和改写为对 $m : = s - n$ 的求和，并得到答案（省略整体常数）

$$
\mathcal{Z}^{\prime} = \sum_{m = - s}^{s} e^{- \beta H ( m / s )} .\tag{3}
$$

方程（3）看起来很有希望，但 $H ( m / s )$ 与 $\langle m | H | m \rangle$ 并不相同。首先让我们看看它在何处成立。取简单哈密顿量 $H = S_{z}$，那么 $\langle \mathbf{n} | H | \mathbf{n} \rangle = s \cos \theta$，因此 $H ( x ) = s x$。这立即给出

$$
\mathcal{Z}_{H = S_{z}}^{\prime} = \sum_{m = - s}^{s} e^{- \beta m} ,\tag{4}
$$

并且很容易（用算符语言）计算出 $\mathcal{Z}_{H = S_{z}}^{\prime} = \mathcal{Z}_{H = S_{z}}$。这两种方法对于特定哈密顿量 $H = S_{z}$ 是一致的（这是 Cabra 等人[23]所考虑的情况）。另一方面，如果我们取 $H = S_{z}^{2}$ 且 $s = 1$，我们可以计算出 $\begin{array} {r} {\langle{\bf n} | S_{z}^{2} | {\bf n} \rangle = \frac{1} {2} \left( \cos^{2} \theta + 1 \right)} \end{array}$；由此我们有

$$
H ( x ) = \frac{1} {2} \left( x^{2} + 1 \right) .\tag{5}
$$

因此，$\mathcal{Z}_{H = S_{-}^{2}}^{\prime} = 2 e^{- \beta} + e^{- \beta / 2}$，但这与 $\mathcal{Z}_{H = S_{\it \ / v}^{2}} = 2 \bar{e}^{- \beta} + 1$ 的差异不仅仅是乘一个常数因子。因此，对于 $s = 1$，我们有 $\mathcal{Z}_{H = S_{z}^{2}}^{\prime} \neq \mathcal{Z}_{H = S_{z}^{2}}$，实际上对于所有 $s > 1 / 2$，都有 $\mathcal{Z}_{H = S_{z}^{2}}^{\prime} \neq \mathcal{Z}_{H = S_{z}^{2}}$。

重要的是，当 $s = 1 / 2$ 时，两种方法对任何哈密顿量都一致。这是因为对于二态系统 $( s ~ = ~ 1 / 2 )$，任何（对角化后的）哈密顿量都可以写成 $H ~ = ~ a + b S_{z}$（实际上 $H = S_{z}^{2} = 1 / 4$），并且当 $H = a + b S_{z}$ 时，上述方法得到 $\mathcal{Z}^{\prime} = \mathcal{Z}$。

另外，如果令哈密顿量为 $H = S_{z}^{2} / s^{2}$，那么在 $s \gg 1$ 极限下，式 (3) 将得到正确结果。这是对于 $S_{z} / s$ 的有限多项式形式的哈密顿量的普遍结果，表明在“半经典”（即 s 趋于无穷）情形下，我们仍能得到合理的结果。

通过考虑 $H ( x ) = x^{2}$ 而非式 (5)，也可以强制两者一致，但这相当于在哈密顿量中将 $S_{z}$ 替换为 $\langle S_{z} \rangle$，而不仅仅考虑 $\langle H \rangle$。在 $H = S_{z}^{2}$ 情形下，这对应考虑 $\langle S_{z}^{2} \rangle$ 与 $\left. S_{z} \right. ^{2}$ 的区别；后者给出正确结果。这种构造没有先验的理由。

为了探究具有 Weyl-Heisenberg 代数（即谐振子代数）的系统是否也存在相同的问题，已知 [24] 可以通过考虑 $\mathfrak{u} ( 2 ) = \mathrm{span} \{S_{0} , S_{x} , S_{y} , S_{z} \} = \mathfrak{u} ( 1 ) \oplus \mathrm{su}(2)$，并将 $\mathfrak{u} ( 2 )$ 缩并到 Weyl-Heisenberg 代数，其中我们定义 $[ S_{0} , S_{i} ] = 0$。然后定义算符 $J_{0} : = S_{0}$、$J_{1 , 2} ( \epsilon ) : = \epsilon S_{y , x}$ 和 $J_{3} ( \epsilon ) : = S_{0} + \epsilon^{- 2} S_{z}$，得到对易关系 $[ J_{3} , J_{1 , 2} ] ~ = ~ \mp i J_{2 , 1} {}_{:}$、$[ J_{1} , J_{2} ] ~ = ~ - i \epsilon^{2} J_{3} + i J_{0}$ 和 $\left[ J_{0} , J_{i} \right] = 0$。如果令 $\epsilon \to 0$，则正好得到 Weyl-Heisenberg 代数：$\mathfrak{h}_{4} \ : = \ : \mathrm{span} \{1 , x , p , a^{\dagger} a \}$，满足 $[ x , p ] = i$、$[ a^{\dagger} a , x ] = - i p$ 和 $[ a^{\dagger} a , p ] = i x$。注意在此缩并中 $S_{z}^{2}$ 与 $a^{\dagger} a$ 相关，因此我们怀疑 $a^{\dagger} a$ 的二次项可能会像自旋相干态路径积分中发现的那样带来问题。

使用 Weyl-Heisenberg 代数构造其相干态的哈密顿量是 Bose-Hubbard 模型。对于单个格点，我们可以写成

$$
H = - \mu n + \frac{U} {2} n ( n - 1 ) ,\tag{6}
$$

其中 $n = a^{\dagger} a$，$a \ ( a^{\dagger} )$ 是代数的湮灭（产生）算符，满足 $[ a , a^{\dagger} ] = 1$。形式 $n ( n - 1 ) = a^{\dagger} a^{\dagger} a a$ 来源于路径积分所需的正规序：

$$
\begin{array} {r l r} {{\mathcal{Z}^{\prime} = \int \mathcal{D}^{2} z \ \exp \{- \int_{0}^{\beta} \mathrm{d} \tau [ \frac{1} {2} ( z^{*} \dot{z} - \dot{z}^{*} z )}} \\ & {} & {- \mu | z | ^{2} + \frac{U} {2} | z | ^{4} ] \} .} \end{array}\tag{7}
$$

我们可以用与获取自旋相干态路径积分中式 (3) 相同的方法来求解该路径积分。令 $z = {\sqrt{n}} e^{i \theta}$，则测度变为 $\mathcal{D}^{2} z \ : = \ : \mathcal{D} n \mathcal{D} \theta$，作用量变为 $\begin{array} {r} {S = \int \mathrm{d} \tau ( i n \dot{\theta} - \mu n + {\frac{U} {2}} n^{2} )} \end{array}$。对 $n \dot{\theta}$ 项进行分部积分，然后对 $\theta$ 积分，将固定 $n$ 为常数，边界项将固定 $n$ 为整数。由于 $n$ 是径向变量，它只能取正值，因此我们直接得到

$$
\mathcal{Z}^{\prime} = \sum_{n = 0}^{\infty} e^{\mu n \beta - \frac{U} {2} n^{2} \beta} .\tag{8}
$$

但这与我们可以用算符语言轻松计算的配分函数不同：

$$
\mathcal{Z} = \sum_{n = 0}^{\infty} e^{\mu n \beta - \frac{U} {2} n ( n - 1 ) \beta} .\tag{9}
$$

我们看到这里出现了与自旋相干态路径积分类似的问题。为了明确看出这一点，对于 \(U \gg 1\)，我们有 \({\mathcal{Z}}^{\prime} \sim 1 + e^{\mu - U / 2} + \cdots\)，但 \({\mathcal{Z}} \sim 1 + e^{\mu} + e^{2 \mu - U} + \cdots\)。由于渐近行为不同，\(\mathcal{Z}\) 和 \(\mathcal{Z}^{\prime}\) 是不同的表达式。注意，如果在 \(\mathcal{Z}^{\prime}\) 中令 \(\mu \to \mu + \frac{U} {2}\)，我们将得到相同的结果。这种对 \(\mu\) 的替换对应于在写出作用量时，将式 (6) 中的 \(n\) 替换为 \(\langle n \rangle = | z | ^{2}\)（因此得到的是 \(n^{2}\)，而不是 \(\langle n^{2} \rangle\)）。

现在我们将此与半经典结果进行比较。仍然考虑式 (6)，稍微改变我们的代数形式，引入一个小参数（类似于标准半经典理论中的 \(\hbar \to 0\)）：\(h^{- 1}\)，即表示指标；参见 [20] 中定义的 \(\gamma\)。我们在此指出，不同的 \(h\) 会按以下方式改变相干态 \(| z \rangle\)：如果 \(z = \frac{1} {\sqrt{2}} ( x + i y )\)，则 \(x = q / c\)，\(y = p / d\)，且 \(h = \hbar / ( c d )\)（以及 \([ a , a^{\dagger} ] = h\)）。我们使用 \(q\) 和 \(p\) 作为谐振子的标准位置和动量。到目前为止，我们一直考虑 \(h = 1\)。

我们可以利用 Hubbard-Stratonovich 变换和谐振子的传播子，写出两个相干态 \(\left| z_{i} \right.\) 和 \(\left| z_{f} \right.\) 之间的传播子：

$$
\begin{array} {r l} & {K ( z_{f}^{*} , z_{i} ; t ) = \langle z_{f} | e^{- i H T / h} | z_{i} \rangle} \\ & {\qquad = \sqrt{\frac{iT} {2 \pi U h}} \displaystyle \int \mathrm{d} \omega e^{\frac{1} {h} \Phi_{\omega} + \frac{1} {2} i \omega T + \frac{i} {8} U h T} ,} \end{array}\tag{10}
$$

(11)

其中我们定义了

$$
\Phi_{\omega} = z_{f}^{*} z_{i} e^{i ( \omega + \mu ) T} + \frac{iT} {2 U} \omega^{2} - \frac{1} {2} ( | z_{i} | ^{2} + | z_{f} | ^{2} ) .\tag{12}
$$

在路径积分符号中，我们可以写出传播子 [20]

$$
K ( z_{f}^{*} , z_{i} ; T ) = \int_{z ( 0 ) = z_{I}}^{z^{*} ( T ) = z_{f}^{*}} \mathcal{D}^{2} z \exp \left\{\Phi [ z , z^{*} ] / h \right\} ,\tag{13}
$$

其中 \(\Phi = \Gamma + S\)

$$
\Gamma = \frac{1} {2} \left[ z_{f}^{*} z ( T ) + z^{*} ( 0 ) z_{I} - | z_{f} | ^{2} - | z_{I} | ^{2} \right] ,\tag{14}
$$

$$
S = \frac{1} {2} \int_{0}^{T} \mathrm{d} t \left( z \dot{z}^{*} - z^{*} \dot{z} \right) - i \int_{0}^{T} \mathrm{d} t \left. z | H | z \right. .\tag{15}
$$

进行标准的半经典分析和代数运算（参见 [20] 和 [19]），半经典传播子的形式为

$$
\begin{array} {r} {K_{\mathrm{sc}} ( z_{f}^{*} , z_{i} ; T ) = \displaystyle \sum_{\omega} \left( \frac{iT} {hU} \right)^{1 / 2} \left( \frac{1} {h} \frac{\partial^{2} \Phi_{\omega}} {\partial \omega^{2}} \right)^{- 1 / 2}} \\ {\times \exp \left[ \frac{1} {h} \Phi_{\omega} + \frac{i} {2} ( \omega + \mu ) T - i \Delta \right] ,} \end{array}\tag{16}
$$

其中求和是对一致性方程的解进行的，一致性方程为 $\begin{array} {r} {\frac{\partial \Phi_{\omega}} {\partial \omega} = 0} \end{array}$ 或 $\omega = - U z_{f}^{*} z_{i} e^{i ( \omega + \mu ) \stackrel{} {T}}$ ，并且我们定义了 $\Delta = \textstyle{\frac{1} {2}} ( \mu + 2 \omega ) T$ 。项 $\Delta$ 来源于对涨落行列式反常的固定，Stone等人[19]在SU(2)情形下对此进行了详细描述。然而，如果我们尝试通过对方程(11)应用最陡下降法（其中 $h \to 0$ ）来得到方程(16)，将不会得到相同的结果。这是因为正如其他人[20, 21]所指出的：半经典近似将给出与哈密顿量的Weyl排序（即朴素地将所有 $a$ 和 $a^{\dagger} {\mathrm{:}}_{\mathrm{S}}$ 对称排序）一致的结果。通常的正规排序哈密顿量形式为（插入 $h$ ）$\begin{array} {r} {H = - \mu n + \frac{U} {2} n ( n - h )} \end{array}$ ，而Weyl排序哈密顿量形式为（相差一个常数）$\begin{array} {r} {H_{W} = - \mu n + \frac{U} {2} n ( n + h )} \end{array}$ 。如果我们对 $H_{W}$ 推导方程(11)，会发现最陡下降法恰好与方程(16)一致，正如预期[20, 21]。

虽然半经典结果并不新颖，但它表明路径积分处理的哈密顿量有所不同。不幸的是，我们的精确计算表明路径积分处理的是 $\begin{array} {r l} {H^{\prime}} & {{} =} \end{array}$ $\scriptstyle - \mu n + {\frac{U} {2}} n^{2}$ ，而半经典近似却表明它处理的是 $\begin{array} {r} {H_{W} = - \mu n + \frac{U} {2} n ( n + 1 )} \end{array}$ 。这两种方法存在差异，但都并非所考虑的原始哈密顿量。对于Weyl排序哈密顿量，我们可以将方程(6)中的原始哈密顿量写为 $H = H_{W} - U n$ ，这（相差一个常数）是Weyl排序的。这种排序可以通过添加额外项 $- U n$ 来修正路径积分。尽管Weyl排序所建议的路径积分修正不能轻易证明能修正精确计算，但它确实启发了一种专门针对我们精确计算的人为修正。我们使用以下作用量（回到 $h = 1$ 的情况）：

$$
S = \int \mathrm{d} t \left( - \mu | z | ^{2} + \frac{U} {2} | z | ^{2} ( | z | ^{2} - 1 ) \right) .\tag{17}
$$

此作用量的构造仅是将算子 $n$ 替换为函数 $| z | ^{2}$；虽然用得出式(8)的方法能得到正确结果，但并无先验理由认定此即正确作用量。类似地，若在自旋相干态路径积分中，将算子 $S_{z}$ 处处替换为其期望值 $\langle{\bf n} | S_{z} | {\bf n} \rangle$，我们同样能得到正确结果。特别地，对于 $H = S_{z}^{2}$，这意味着在自旋路径积分中使用的将是 $\left. S_{z} \right. ^{2}$ 而非 $\langle S_{z}^{2} \rangle$。一般而言，若将哈密顿量中的相干态生成元替换为它们的期望值，采用推导式(3)和式(8)的方法就能得到 $\mathcal{Z}$ 的正确结果。

撇开修正不谈，理解问题根源的一个简单方式是回到式(5)。这个 $H ( x )$ 函数无法取到值0，但 $\dot{H} = S_{z}^{2}$ 显然具有这样的本征值。其原因在于：对于SU(2)的高维表示，并非每个 $S_{z}$ 的本征向量都能通过标准的 ${\mathrm{SU}} ( 2 )$ 旋转变成另一个本征向量。另一方面，我们使用的相干态对于更高维表示也是完备集，因此原则上不应丢失关于 $m = 0$ 态的任何信息。连续性似乎是症结所在：$H ( x )$ 来源于时间离散形式（在时间切片 $j$ 和 $j + 1$ 之间）$\langle \mathbf{n}_{j + 1} | S_{z}^{2} | \mathbf{n}_{j} \rangle$，而 $\langle \mathbf{n} | S_{z}^{2} | - \mathbf{n} \rangle = 0$；所以 $\langle{\bf n}_{j + 1} | S_{z}^{2} | {\bf n}_{j} \rangle$ 可以取零，但连续时间路径积分所假设的"彼此接近"的路径（即 $\mathbf{n}_{j} \approx \mathbf{n}_{j + 1} \big)$ 无法实现这一点。因此，离散时间路径积分（在施加连续性假设之前）能明确给出计算的正確结果。

总而言之，在路径积分的时间连续表述中，无论是Weyl序建议的作用量，还是正规序构造的作用量，在通过路径积分进行评估时都无法给出正确结果。

致谢——感谢Michael Levin启发性讨论。本研究由NSFCAREER奖（DMR-0847224）资助。

### 参考文献

[1] A. Altland and B. D. Simons, Condensed Matter Field Theory, 2nd ed. (Cambridge University Press, 2010).

[2] X. Wen, Quantum Field Theory of Many-body Systems, reissue ed. (Oxford University Press, 2007).

[3] M. E. Peskin and D. V. Schroeder, An Introduction To Quantum Field Theory (Westview Press, 1995).

[4] J. R. Klauder, in Path Integrals and their Applications in Quantum, Statistical, and Solid State Physics, edited by G. Papadopoulos and J. Devreese (Plenum Press, Antwerp, Belgium, 1977).

[5] F. A. Berezin, Sov. Phys. Usp. <sup>23</sup>, 763 (1980).

[6] J. R. Klauder and B. Skagerstam, Coherent states: applications in physics and mathematical physics (World Scientific, 1985).

[7] R. J. Glauber, Phys. Rev. <sup>131</sup>, 2766 (1963).

[8] A. M. Perelomov, Commun. Math. Phys. <sup>26</sup>, 222 (1972).

[9] R. Gilmore, Ann. Phys. <sup>74</sup>, 391 (1972).

[10] W. Zhang, D. H. Feng, and R. Gilmore, Rev. Mod. Phys. <sup>62</sup>, 867 (1990).

[11] A. M. Perelomov, Generalized coherent states and their applications (Birkh¨auser, 1986).

[12] J. R. Klauder, “The Feynman path integral: An historical slice,” (2003), arXiv:quant-ph/0303034v1.

[13] M. Enz and R. Schilling, J. Phys. C <sup>19</sup>, 1765 (1986).

[14] K. Funahashi, T. Kashiwa, S. Sakoda, and K. Fujii, J. Math. Phys. <sup>36</sup>, 3232 (1995).

[15] K. Funahashi, T. Kashiwa, S. Nima, and S. Sakoda, Nucl. Phys. B <sup>453</sup>, 508 (1995).

[16] V. I. Belinicher, C. Providencia, and J. da Providencia, J. Phys. A <sup>30</sup>, 5633 (1997).

[17] J. Shibata and S. Takagi, Int. J. Mod. Phys. B <sup>13</sup>, 107 (1999).

[18] H. G. Solari, J. Math. Phys. <sup>28</sup>, 1097 (1987).

[19] M. Stone, K. Park, and A. Garg, J. Math. Phys. <sup>41</sup>, 8025 (2000).

[20] E. A. Kochetov, J. Phys. A <sup>31</sup>, 4473 (1998).

[21] M. Pletyukhov, J. Math. Phys. <sup>45</sup>, 1859 (2004).

[22] A. Polkovnikov, Ann. Phys. <sup>325</sup>, 1790 (2010).

[23] D. C. Cabra, A. Dobry, A. Greco, and G. L. Rossini, J. Phys. A <sup>30</sup>, 2699 (1997).

[24] R. Gilmore, Lie groups, physics, and geometry (Cambridge University Press, 2008).

---

## 阅读笔记

### 一句话概括
本文通过自旋SU(2)相干态路径积分（哈密顿量 \(H=S_z^2\)）和单格点Bose-Hubbard模型 (\(H=-\mu n + \frac{U}{2}n(n-1)\)）两个解析可解模型，揭示了标准**时间连续**相干态路径积分在哈密顿量为代数生成元二次型时的根本失效：配分函数 \(\mathcal{Z}'\) 与精确算符结果 \(\mathcal{Z}\) 定性不符。该失效源于连续时间极限中对路径“局部光滑性”的隐含要求——离散时间路径积分不会出现此问题，且该偏差无法被已知的Weyl排序反常相位所修复。

### 核心论证链
1. **构造时间连续路径积分**：使用标准切片程序（分割时间、插入过完备基）为自旋和海森堡代数写出配分函数表达式，其中经典哈密顿量取为量子算符在相干态上的期望值 \(\langle\mathbf{n}|H|\mathbf{n}\rangle\)。**原因**：这是教科书标准做法，认为路径积分应完全由期望值决定。**结论**：得到式(1)和式(7)的形式。
2. **精确化简路径积分**：采用Cabra等人的方法，假设 \(\langle\mathbf{n}|H|\mathbf{n}\rangle\) 仅依赖于 \(\cos\theta\)。对 \(\phi\) 分部积分后，利用泛函积分恒等式 \(\int\mathcal{D}\phi \, e^{-i\int\phi f}= \delta(f)\)，强制出 \(\dot{\cos\theta}=0\)。**原因**：分部积分边界项 \(\Delta\phi(1-\cos\theta)\) 产生整数卷绕数 \(k\)，使 \(\phi\) 路径积分只在 \(\dot{\cos\theta}=0\) 时有贡献。**结论**：路径积分被约化为单变量 \(x=\cos\theta\) 上的普通积分 + 对 \(k\) 求和。
3. **对 \(k\) 求和得到离散谱**：对 \(k\) 的求和给出 \(\sum_k e^{2\pi i k s (1-x)} = \sum_{n=0}^{2s} \delta(s(1-x)-n)\)，因 \(x\in[-1,1]\) 只有有限整数 \(n\) 贡献。**原因**：配分函数作为热力学迹，要求路径闭合，自然得到量子数离散化。**结论**：得到 \(\mathcal{Z}' = \sum_{m=-s}^s e^{-\beta H(m/s)}\)，式(3)。
4. **对比自旋 \(H=S_z^2\) 的精确结果**：对于 \(s=1\)，\(\langle\mathbf{n}|S_z^2|\mathbf{n}\rangle = \frac12(x^2+1)\)，代入得 \(\mathcal{Z}' = 2e^{-\beta} + e^{-\beta/2}\)；而精确算符迹 \(\mathcal{Z}=2e^{-\beta}+1\)。**原因**：路径积分中 \(H(x)\) 最小值为 \(1/2\)，但真实哈密顿量有本征值 \(0\)。**结论**：时间连续路径积分丢失了 \(m=0\) 态的贡献。
5. **通过代数缩并推广到Bose情形**：将SU(2)代数缩并到Weyl–Heisenberg代数，类比出单格点Bose–Hubbard模型也应存在同样问题。**原因**：缩并中 \(S_z^2\) 对应 \(n^2\)，而真实哈密顿量有 \(n(n-1)\)。**结论**：对 Bose 模型做完全相同化简得到 \(\mathcal{Z}'_{\text{Bose}} = \sum_n e^{\beta(\mu n - U n^2/2)}\)，式(8)。
6. **比较Bose精确结果与半经典/ Weyl排序**：精确配分函数 \(\mathcal{Z}_{\text{Bose}} = \sum_n e^{\beta(\mu n - U n(n-1)/2)}\) 与 \(\mathcal{Z}'_{\text{Bose}}\) 相差一个常数偏移 \(\mu\to\mu+U/2\)。半经典最陡下降法分析显示其对应 **Weyl排序** 哈密顿量 \(H_W = -\mu n + \frac{U}{2}n(n+1)\)，与 \(\mathcal{Z}'\) 也不同。**原因**：路径积分既不是正规序也不是Weyl序，而是直接替换 \(n\to |z|^2\)。**结论**：Weyl反常相位无法修复此偏差，失效是连续路径积分本身的固有问题。
7. **揭示根本原因**：离散时间路径积分中，插入的中间态可以“跳”到远处（如 \(\langle\mathbf{n}_{j+1}|S_z^2|\mathbf{n}_j\rangle = 0\) 当 \(\mathbf{n}_{j+1}=-\mathbf{n}_j\)），但连续极限要求相邻时间片态“几乎相同”，排除了此类贡献。**原因**：路径积分赖以成立的“路径光滑性”假设并非物理必需。**结论**：对于存在不同本征态无法通过连续旋转连接的哈密顿量，连续路径积分必然失效。

### 关键假设/条件表
| 假设/条件 | 数值/形式 | 含义与用途 |
| :--- | :--- | :--- |
| **自旋相干态构造** | \(\vert\mathbf{n}\rangle = e^{-i\phi S_z} e^{-i\theta S_y}\vert s\rangle\) | 标准SU(2)相干态，参数为Bloch球面坐标 |
| **哈密顿量（自旋）** | \(H=S_z^2\) (以 \(s=1\) 为例) | 最简单的生成元二次型，存在本征值 \(m=0\) 对应零期望值 |
| **哈密顿量（Bose）** | \(H=-\mu n + \frac{U}{2}n(n-1)\) | 正规序单格点Bose-Hubbard，粒子数算符二次型 |
| **作用量构造规则** | 经典哈密顿量 = \(\langle\text{coherent}\vert\hat{H}\vert\text{coherent}\rangle\) | 教科书标准约定，用于生成式(1)和(7) |
| **路径闭合条件** | \(\mathbf{n}(0)=\mathbf{n}(\beta)\)，\(z(0)=z(\beta)\) | 配分函数迹的条件，导致 \(\phi\) 边界项产生整数卷绕数 |
| **连续时间极限** | 默认相邻切片态相似：\(\vert\mathbf{n}_{j+1}\rangle\approx\vert\mathbf{n}_j\rangle\) | 路径积分核心假设，导致无法捕捉正交态之间的跃迁矩阵元 |
| **代数缩并** | \(\mathfrak{su}(2) \to \mathfrak{h}_4\) 当 \(\epsilon\to0\) | 形式上联系自旋和玻色算子，证明失效具有普适性 |
| **半经典参数** | \(h = \hbar/(cd)\) 取小值 | 用于Bose模型半经典分析，检验Weyl排序 |

### 批判性思考
1. **精确解法适用范围过窄**：Cabra方法要求 \(\langle\mathbf{n}|H|\mathbf{n}\rangle\) 仅为 \(\cos\theta\) 的函数，实质上要求 \(H\) 是 \(S_z\) 的多项式。对含 \(S_x\) 或非对角项的哈密顿量，此化简不成立，因此论文揭示的失效模式并非普遍有效。
2. **与Weyl排序修正的冲突未解决**：Stone/Kochetov的半经典结果显示Weyl排序可修正路径积分，但本文精确计算表明Weyl排序（对应 \(n(n+1)\)）仍与正确结果 \(n(n-1)\) 不符。这说明半经典修正对于离散谱错误不可逆，高阶或非微扰效应可能更大。
3. **Bose情况缺少粒子数截止论证**：Bose模型粒子数无穷，路径积分中的径向积分在 \(n\to\infty\) 时发散（若 \(U<0\)），但论文仅解析了收敛情况。未能说明在有限温度下截断的合理性，以及是否会产生不同于离散谱的假连续贡献。
4. **离散化方案未给出规范形式**：作者声称离散时间路径积分可避免问题，但未给出具体离散化规则（应如何插入态、如何取极限）。对于一般的非线性哈密顿量，离散化方案可能不唯一，且不同方案在连续极限下可能给出不同结果。
5. **对瞬子/隧穿计算的影响未被量化**：自旋路径积分常用于磁化隧穿问题（如 \(S_z^2\) 势）。若路径积分遗漏了 \(m=0\) 态，则瞬子幅度的计算将错误地忽略该低能态，导致隧穿能级分裂数值完全错误。论文未提供此类具体数值错误示例。
6. **“替换为期望值”修正缺乏理论依据**：作者提出的修正（将 \(n\) 直接替换为 \(|z|^2\)）虽然“后验”地得到正确结果，但没有任何第一性原理推导。此操作等价于忽略算符排序的非交换性，对于更复杂的哈密顿量（如含 \(a^\dagger a^\dagger\) 项）无法推广。

### 局限性
1. **仅分析了哈密顿量为**\(S_z^2\) **和**\(n(n-1)\) **的实标量势**：未涉及时变哈密顿量、含时驱动或非阿贝尔规范场等更一般情形，失效行为可能更复杂。
2. **仅检验了配分函数**\(\mathrm{tr}[e^{-\beta H}]\)：未检验跃迁振幅 \(\langle z_f|e^{-iHt}|z_i\rangle\) 的路径积分是否同样错误。动力学传播子的失效将直接影响含时微扰和量子淬火计算。
3. **未考虑多格点或连续系统**：作者认为失效会存在于多格点Bose-Hubbard模型，但未提供任何数值或解析证明。在多格点中，动量空间散色可能使期望值光滑化，掩盖单个格点的“奇异”贡献。
4. **未讨论非紧致李群（如**SU(1,1)**）**：论文只对紧致SU(2)和Weyl–Heisenberg代数检验，对于非紧致群（如双光子过程），希尔伯特空间无上界，失效可能表现为发散而非离散谱丢失。
5. **自旋**\(s=1/2\) **特例无法推广**：作者指出 \(s=1/2\) 时任何哈密顿量都无问题，因为此时任意对角哈密顿量可写为 \(a+bS_z\)。但这恰好回避了存在“不可连续连接的态”这一本质问题，而大多数物理系统具有多级结构。
6. **Bose模型推导的严格性不足**：在从式(7)到式(8)的化简中，作者对 \(\theta\) 积分使用 \(\delta(\dot{n})\) 约束，但 \(\theta\) 在径向坐标 \(n\) 为零时是奇异的。未讨论零点处测度是否产生附加修正。
7. **未提供离散化路径积分的具体形式**：虽然指出离散化可解决问题，但未给出可操作的正规则法（如Normal ordering vs Weyl ordering如何在离散化中实现），读者无法复现正确的离散化路径积分。

### 关键公式速查
- \(\mathcal{Z} = \mathrm{tr}\,[e^{-\beta\hat{H}}]\) — 精确配分函数（基准），全文对比对象
- \(\mathcal{Z}' = \int\mathcal{D}\mathbf{n}(\tau)\,\exp\bigg\{-\int_0^\beta\!d\tau\big[-\langle\mathbf{n}|\partial_\tau|\mathbf{n}\rangle + \langle\mathbf{n}|H|\mathbf{n}\rangle\big]\bigg\}\) — 标准自旋相干态路径积分，式(1)
- \(H(x)=\langle\mathbf{n}|S_z^2|\mathbf{n}\rangle = \frac12(x^2+1),\quad x=\cos\theta\) — 期望值函数，式(5)
- \(\mathcal{Z}'_{H=S_z^2,\,s=1} = 2e^{-\beta} + e^{-\beta/2}\) — 路径积分给出的配分函数，式(2,3)推导
- \(\mathcal{Z}_{H=S_z^2,\,s=1} = 2e^{-\beta}+1\) — 正确配分函数
- \(\mathcal{Z}'_{\text{Bose}} = \sum_{n=0}^\infty e^{\beta(\mu n - \frac{U}{2}n^2)}\) — 单格点Bose–Hubbard路径积分结果，式(8)
- \(\mathcal{Z}_{\text{Bose}} = \sum_{n=0}^\infty e^{\beta(\mu n - \frac{U}{2}n(n-1))}\) — 正确配分函数，式(9)
- \(H_W = -\mu n + \frac{U}{2}n(n+h)\) — Weyl排序下的Bose哈密顿量（含参数 \(h\)），半经典对应
- \(\Phi_\omega = z_f^* z_i e^{i(\omega+\mu)T} + \frac{iT}{2U}\omega^2 - \frac12(|z_i|^2+|z_f|^2)\) — 半经典传播子相位，式(12)
- \(\Delta = \frac12(\mu+2\omega)T\) — 涨落行列式反常相位修正，式(16)后

### 术语对照
| 中文 | 英文 | 含义 |
| :--- | :--- | :--- |
| 相干态 | Coherent state | 本征于湮灭算符（或群生成元）的过完备态族，由连续参数标记 |
| 广义相干态 | Generalized coherent state | 基于李群表示构造的相干态，如SU(2)自旋相干态 |
| 正规序 | Normal ordering | 所有产生算符置于湮灭算符左侧的排序约定 |
| Weyl排序 | Weyl ordering | 算符乘积完全对称平均的排序约定 |
| 贝里相位 | Berry phase | 路径积分中由相干态时间演化引起的几何相位 \(i\langle n\vert\dot{n}\rangle\) |
| 路径积分 | Path integral | 量子振幅或配分函数表示为所有可能路径的泛函积分 |
| 配分函数 | Partition function | \(\mathcal{Z}=\mathrm{tr}[e^{-\beta H}]\)，热力学性质的生成泛函 |
| 半经典近似 | Semiclassical approximation | \(h\to0\) 或 \(s\to\infty\) 极限下的驻点近似 |
| 卷绕数 | Winding number | \(\phi\) 在路径闭合时绕Bloch球赤道的整数圈数 \(k\) |
| 代数缩并 | Contraction of algebra | 将 \(\mathfrak{su}(2)\) 极限为 Weyl–Heisenberg 代数的过程 |
| 时间连续路径积分 | Time-continuous path integral | 直接写出含导数项的连续形式，省略离散化步骤 |
| 离散时间路径积分 | Time-discretized path integral | 先将时间分割为N段、插入完备基，再取极限 \(N\to\infty\) |

### 深入：失效的代数根源与拓扑解释
论文的核心洞察在于，二次型哈密顿量 \(S_z^2\) 的本征态 \(|m=0\rangle\) 在Bloch球上对应赤道大圆上所有点，但 **任意两个不同方向的赤道态之间无法通过连续的SU(2)旋转保持能量不变**。当路径积分假设时间切片之间相干态无限接近时，实际上禁止了路径从一个赤道点“跳”到另一个赤道点，从而丢失了 \(m=0\) 的多重贡献。这个问题的数学本质是：路径积分的连续性假设与相干态过完备基的离散谱结构之间的不兼容。对于线性项（如 \(S_z\)），所有路径的贡献相同，不存在该问题；对于更高次项（如 \(S_z^4\)），失效会以类似方式出现但程度不同。文章通过代数缩并将此论证推广到玻色系统，说明该失效并非自旋系统特有的，而是所有二次型相干态路径积分的共性问题。

### 延伸阅读
1. A. Altland and B. D. Simons, *Condensed Matter Field Theory*, 2nd ed. (Cambridge University Press, 2010) — 标准教科书，展示通常如何使用相干态路径积分，其中包含文中批评的“天真”构造。
2. M. Stone, K. Park, and A. Garg, J. Math. Phys. **41**, 8025 (2000) — 发现自旋路径积分的反常相位，试图修复半经典传播子，但本文指出该修复在精确层次上仍不足。
3. E. A. Kochetov, J. Phys. A **31**, 4473 (1998) — 一般代数情形的半经典路径积分理论，提出Weyl排序修正。
4. D. C. Cabra, A. Dobry, A. Greco, and G. L. Rossini, J. Phys. A **30**, 2699 (1997) — 使用本文的精确求解方法（仅考虑 \(H=S_z\) 情形），但本文首次将其推广到非线性并发现问题。
5. A. Polkovnikov, Ann. Phys. **325**, 1790 (2010) — 讨论Bose–Hubbard模型中的排序问题，提供Weyl排序在实际计算中的应用。

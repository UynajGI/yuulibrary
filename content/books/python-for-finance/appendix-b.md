---
title: "附录B · BSM期权类"
weight: 36
description: "Black-Scholes-Merton模型的欧式看涨期权类定义、使用示例及全书索引。"
---

# BSM期权类

## 类定义

以下给出Black-Scholes-Merton (1973)模型中欧式看涨期权（European call option）的类定义。这种基于类的实现是本章前述基于函数的实现的替代方案：

```python
#
# 在Black-Scholes-Merton模型中估值欧式看涨期权
# 包含vega函数和隐含波动率估计
# -- 基于类的实现
#

from math import log, sqrt, exp
from scipy import stats

class bsm_call_option(object):
    """ BSM模型中欧式看涨期权的类。

    属性
    S0: float 初始股票/指数水平
    K: float 行权价
    T: float 到期时间（以年分数表示）
    r: float 常数无风险短期利率
    sigma: float 扩散项中的波动率因子

    方法
    =====
    value: float
        返回看涨期权的现值
    vega: float
        返回看涨期权的vega
    imp_vol: float
        返回给定期权报价的隐含波动率
    """
    def __init__(self, S0, K, T, r, sigma):
        self.S0 = float(S0)
        self.K = K
        self.T = T
        self.r = r
        self.sigma = sigma

    def value(self):
        ''' 返回期权价值。
        '''
        d1 = ((log(self.S0 / self.K) +
            (self.r + 0.5 * self.sigma ** 2) * self.T) /
            (self.sigma * sqrt(self.T)))
        d2 = ((log(self.S0 / self.K) +
            (self.r - 0.5 * self.sigma ** 2) * self.T) /
            (self.sigma * sqrt(self.T)))
        value = (self.S0 * stats.norm.cdf(d1, 0.0, 1.0) -
            self.K * exp(-self.r * self.T) * stats.norm.cdf(d2, 0.0, 1.0))
        return value

    def vega(self):
        ''' 返回期权的vega。
        '''
        d1 = ((log(self.S0 / self.K) +
            (self.r + 0.5 * self.sigma ** 2) * self.T) /
            (self.sigma * sqrt(self.T)))
        vega = self.S0 * stats.norm.pdf(d1, 0.0, 1.0) * sqrt(self.T)
        return vega

    def imp_vol(self, C0, sigma_est=0.2, it=100):  <!-- validate-skip -->
        ''' 返回给定期权价格的隐含波动率（implied volatility）。
        '''
        option = bsm_call_option(self.S0, self.K, self.T, self.r, sigma_est)
        for i in range(it):
            option.sigma -= (option.value() - C0) / option.vega()
        return option.sigma
```

## 类的使用

该类可在交互式Jupyter Notebook会话中使用如下：

```python
In [1]: from bsm_option_class import *
In [2]: o = bsm_call_option(100., 105., 1.0, 0.05, 0.2)
type(o)
Out[2]: bsm_option_class.bsm_call_option
In [3]: value = o.value()
value
Out[3]: 8.021352235143176
In [4]: o.vega()
Out[4]: 39.67052380842653
In [5]: o.imp_vol(C0=value)
Out[5]: 0.2
```

期权类还可用于可视化例如不同行权价和到期日下的期权价值和vega。拥有解析期权定价公式的主要优势之一就在于此。以下Python代码生成不同到期日-行权价组合下的期权统计量：

```python
In [6]: import numpy as np
    maturities = np.linspace(0.05, 2.0, 20)
    strikes = np.linspace(80, 120, 20)
    K, T = np.meshgrid(strikes, maturities)
    C = np.zeros_like(K)
    V = np.zeros_like(C)
    for t in enumerate(maturities):
        for k in enumerate(strikes):
            o.T = t[1]
            o.K = k[1]
            C[t[0], k[0]] = o.value()
            V[t[0], k[0]] = o.vega()
```

首先，查看期权价值。图B-1展示了欧式看涨期权的价值曲面：

```python
In [7]: from pylab import cm, mpl, plt
    from mpl_toolkits.mplot3d import Axes3D
    mpl.rcParams['font.family'] = 'serif'
    %matplotlib inline

In [8]: fig = plt.figure(figsize=(12, 7))
    ax = fig.gca(projection='3d')
    surf = ax.plot_surface(K, T, C, rstride=1, cstride=1,
    cmap=cm.coolwarm, linewidth=0.5, antialiased=True)
    ax.set_xlabel('strike')
    ax.set_ylabel('maturity')
    ax.set_zlabel('European call option value')
    fig.colorbar(surf, shrink=0.5, aspect=5);
```

{{< caption >}}图B.1 欧式看涨期权的价值曲面{{< /caption >}}

其次，查看vega值。图B-2展示了欧式看涨期权的vega曲面：

```python
In [9]: fig = plt.figure(figsize=(12, 7))
    ax = fig.gca(projection='3d')
    surf = ax.plot_surface(K, T, V, rstride=1, cstride=1,
    cmap=cm.coolwarm, linewidth=0.5, antialiased=True)
    ax.set_xlabel('strike')
    ax.set_ylabel('maturity')
    ax.set_zlabel('Vega of European call option')
    fig.colorbar(surf, shrink=0.5, aspect=5);
```

{{< caption >}}图B.2 欧式看涨期权的vega曲面{{< /caption >}}

## 索引

### 符号
% 字符, 71
%time 函数, 276
%timeit 函数, 276
\* (乘法) 运算符, 150, 161
+ (加法) 运算符, 150, 161

### 2D绘图
交互式, 195-203
matplotlib导入与自定义, 168
一维数据集, 169-176
其他绘图样式, 183-191
二维数据集, 176-183

### 3D绘图, 191-194
\_\_abs\_\_ 方法, 160
\_\_add\_\_ 方法, 161
\_\_bool\_\_ 方法, 160
\_\_getitem\_\_ 方法, 161
\_\_init\_\_ 方法, 155, 159
\_\_iter\_\_ 方法, 162
\_\_len\_\_ 方法, 161
\_\_mul\_\_ 方法, 161
\_\_repr\_\_ 方法, 160
\_\_sizeof\_\_ 方法, 150
{} (花括号), 71

### A

绝对差值（absolute differences），计算, 212
绝对价格数据, 442
抽象（abstraction）, 147
致谢, xviii
自适应求积（adaptive quadrature）, 336
加法 (+) 运算符, 150, 161
聚合（aggregation）, 148, 158
AI优先的金融, 28
算法交易（algorithmic trading）
自动化交易, 521-554
FXCM交易平台, 467-481
交易策略, 483-520
算法（algorithms）（另见金融算法）
斐波那契数, 286-289
监督学习算法, 448
无监督学习算法, 444
素数, 282-285
圆周率pi, 290-293
Amazon Web Services (AWS), 50
美式期权（American options）, 376, 380, 607-614
匿名函数（anonymous functions）, 80
对偶路径（antithetic paths）, 573
对偶变量（antithetic variates）, 373
append() 方法, 136
使用pandas追加, 136
apply() 方法, 142, 218
近似（approximation）
插值技术, 324-328
主要焦点, 312
包导入与自定义, 312
回归技术, 313-324
任意精度浮点数, 65
array 模块, 88
数组（arrays）（另见NumPy）
使用纯Python代码处理, 86-90
使用PyTables的I/O, 262
Python数组类, 88-90
写入和读取NumPy数组, 242
人工智能（artificial intelligence, AI）, 28
亚式期权（Asian payoff）, 606
属性（attributes），在面向对象编程中, 145
归因, xvi
自动化交易（automated trading）
资金管理, 522-532
基础设施与部署, 546
日志记录与监控, 547-549
基于ML的交易策略, 532-543
在线算法, 544
Python脚本, 550-554
风险管理, 547
average\_cy1() 函数, 280
average\_nb() 函数, 279
average\_np() 函数, 278
average\_py() 函数, 277

### B

贝叶斯统计（Bayesian statistics）
贝叶斯回归, 430
贝叶斯公式, 429
概念, 398
真实世界数据应用, 435
随时间更新估计, 439
Benevolent Dictator for Life, 5
百慕大行权（Bermudan exercise）, 380, 607
大数据（big data）, 13, 231
二叉树（binomial trees）
Cox、Ross和Rubinstein定价模型, 294
Cython实现, 297
Numba实现, 297
NumPy实现, 295
Python实现, 294
bit\_length() 方法, 62
Black-Scholes-Merton (BSM), 14, 299, 353, 356, 369, 673-676
布尔值（Booleans）, 66
箱线图（boxplots）, 188
布朗运动（Brownian motion）, 299, 354, 356, 399, 491
bsm\_functions.py 模块, 378

### C

看涨期权（call options）, 375
回调函数（callback functions）, 477
K线数据（candles data）, 472
资本资产定价模型（capital asset pricing model）, 398
资金管理（capital management）
股票和指数的Kelly准则, 527-532
二项设置中的Kelly准则, 522-526
资本市场线（capital market line）, 425

随时间变化，计算, 212-215
图表（另见数据可视化）
卡方分布（Chi square distribution）, 351
Cholesky分解（Cholesky decomposition）, 365
类属性（class attributes）, 145
类（classes）
构建自定义类, 154-159
在面向对象编程中, 145
分类问题（classification problems）, 448, 504-511
云实例（cloud instances）
基础知识, 34
优势, 56
所需文件, 51
Python和Jupyter Notebook安装脚本, 53
Jupyter Notebook配置文件, 52
使用的主要工具, 50
RSA公钥和私钥, 51
编排Droplet设置的脚本, 55
选择合适的硬件架构, 273
服务提供商, 50
代码示例，获取和使用, xvi
抛硬币游戏, 522
比较运算符（comparison operators）, 66
编译（compilation）
动态编译, 276, 279
加速算法的包, 308
静态编译, 280
复杂选择，使用pandas, 132-135
组合（composition）, 148
压缩表（compressed tables）, 260
拼接（concatenation），使用pandas, 135
conda
使用conda进行基本包管理, 37-41
Miniconda安装, 35
使用conda管理虚拟环境, 41-44
常数短期利率（constant short rate）, 563
常数波动率（constant volatility）, 365
常量（constants）, 565
容器（containers）, 34（另见Docker容器）
未定权益（contingent claims），估值, 375
控制结构（control structures）, 78
凸优化（convex optimization）
约束优化, 332
全局最小值表示, 328
全局优化, 329
局部优化, 331
用例, 328
相关性分析（correlation analysis）
数据准备, 222
直接相关性度量, 227
对数收益率, 224
OLS回归, 226
count() 方法, 76
基于计数器的循环, 78
协方差矩阵（covariance matrix）, 416
协方差（covariances）, 398
Cox、Ross和Rubinstein定价模型, 294, 359
create\_plot() 函数, 312
create\_ts() 函数, 269
信用估值调整（credit valuation adjustments, CVA）, 388
信用风险价值（credit value-at-risk, CVaR）, 388
CSV文件
使用pandas的I/O, 250
使用Python读写, 236
三次样条插值（cubic splines interpolation）, 426
Cufflinks库, 167, 195, 199
cumsum() 方法, 171, 177, 215
花括号（{}）, 71
曲线（curves）, 565
Cython
优势, 62, 281
使用Cython实现二叉树, 297
指数加权移动平均（EWMA）, 307
使用Cython循环, 280
使用Cython的蒙特卡洛模拟, 302
素数算法, 284
递归函数实现, 286
用于大数的特殊数据类型, 288

### D

数据可视化（data visualization）
交互式2D绘图, 195-203
绘图包, 167
静态2D绘图, 168-191
静态3D绘图, 191-194
使用pandas, 126
Data-Driven Documents (D3.js) 标准, 167, 195
数据驱动金融（data-driven finance）, 24
DataFrame类
主要特性, 114
重要功能, 115
使用DataFrame对象, 115-118, 152
使用ndarray对象, 119-123, 151, 170
DataFrame() 函数, 119
日期时间信息（另见金融时间序列数据）
金融图表, 199-203
使用pandas管理, 119-123
建模和处理日期, 561
NumPy处理日期时间的功能, 665-667
pandas处理日期时间的功能, 668-670
使用正则表达式解析, 74
绘图, 667
Python datetime模块, 659-665
datetime模块, 659-665
datetime64信息, 667
DatetimeIndex对象, 120, 668
date\_range() 函数, 121
DAX 30股票指数, 637
决策树（decision trees, DTs）, 452
深度学习（deep learning, DL）, 28, 454
深度神经网络（deep neural networks, DNNs）
优势与劣势, 454
特征变换, 457
交易策略与, 512-519
训练-测试划分与, 459
使用scikit-learn, 454
使用TensorFlow, 455
delta, 599
衍生品分析（derivatives analytics）
衍生品估值, 595-616
DX分析包, 556, 617
DX定价库, 555
基于市场的估值, 637-657
投资组合估值, 617-636
金融模型模拟, 571-592
估值框架, 557-569
衍生品投资组合（derivatives portfolios）
建模类, 622-626
用例, 626-633
衍生品头寸（derivatives positions）
建模类, 618
用例, 620
衍生品估值（derivatives valuation）
美式行权, 607-614
欧式行权, 600-607
通用估值类, 596-599
derivatives\_portfolio类, 627, 634
derivatives\_position类, 634
describe() 函数, 123, 211
反序列化（deserialization）, 233
df.iplot() 方法, 196
历时解释（diachronic interpretation）, 429
字典对象（dict objects）, 81, 235
diff() 函数, 213
数字化（digitalization）, 10
DigitalOcean, 50
dir 函数, 63
离散化误差（discretization error）, 356
分散化（diversification）, 416
Docker容器
基础知识, 45
优势, 50
构建Ubuntu和Python Docker镜像, 46-50
Docker镜像 vs Docker容器, 45
双精度标准（double-precision standard）, 64
下采样（downsampling）, 215
Droplets, 50, 55
夏令时（DST, Daylight Saving Time）, 663
dst() 方法, 663
DX (Derivatives analytiX) 定价库, 555
DX分析包, 556, 617
dx.constant\_short\_rate类, 564, 617
dx.derivatives\_portfolio, 626
dx.geometric\_brownian\_motion类, 582, 602, 617
dx.jump\_diffusion类, 583, 617
dx.market\_environment类, 565, 577, 617, 621
dx.square\_root\_diffusion类, 588, 617
dx.valuation\_class类, 599
dx.valuation\_mcs\_american类, 611, 618
dx.valuation\_mcs\_european类, 602, 618
dx\_frame.py模块, 568
dx\_simulation.py, 591
动态编译（dynamic compiling）, 276, 279
动态模拟（dynamic simulation）, 356
动态类型语言（dynamically typed languages）, 62

### E

提前行权溢价（early exercise premium）, 382
编辑器（Editor）, 50
有效前沿（efficient frontier）, 421, 424
有效市场假说（efficient markets hypothesis, EMH）, 399, 492
Eikon Data API, 25
elif 控制元素, 79
else 控制元素, 79
封装（encapsulation）, 148, 156
希腊字母估计（estimation of Greeks）, 599
估计问题（estimation problems）, 448
Euler格式（Euler scheme）, 357, 360, 583
欧式期权（European options）, 375, 600-607, 673-676
eval() 方法, 142
基于事件的回测（event-based backtesting）, 537
ewma\_cy() 函数, 307
ewma\_nb() 函数, 307
ewma\_py() 函数, 306
Excel文件，使用pandas的I/O, 251
.executemany() 方法, 246
执行时间，估计循环, 276
期望投资组合收益率（expected portfolio return）, 418
期望投资组合方差（expected portfolio variance）, 418
指数加权移动平均（exponentially weighted moving average, EWMA）
Cython实现, 307
公式, 304
Numba实现, 307
Python实现, 305

### F

肥尾（fat tails）, 385, 413
特征变换（feature transforms）, 457
斐波那契数（Fibonacci numbers）, 286-289
fib\_rec\_py1() 函数, 286
filter() 函数, 80
金融（finance）
AI优先的金融, 28
数据驱动, 24
Python在金融中的作用, 14-24
技术在金融中的作用, 9-14
金融算法（financial algorithms）（另见算法；自动化交易；交易策略）
Black-Scholes-Merton (BSM), 14, 299, 353, 356, 369, 673-676
Cox、Ross和Rubinstein定价模型, 294, 359
首选方案与最佳方案, 308
最小二乘蒙特卡洛（LSM）, 381, 608
在线算法, 544
金融模型模拟, 571-592
支持向量机（SVM）, 29, 460
金融与数据分析（financial and data analytics）
挑战, 13
定义, 13
选择适当的硬件架构, 273
一次写入，多次读取, 26
金融指标（financial indicators）, 217
金融工具（financial instruments）
使用Python类进行自定义建模, 154-159
符号（RICs）, 209
金融研究（financial studies）, 217
金融理论（financial theory）, 398
金融时间序列数据（financial time series data）
随时间变化, 212-215
使用pandas进行相关分析, 222-227
使用pandas导入数据, 206-209
定义与示例, 205
使用pandas的高频数据, 228
包导入与自定义, 206
递归pandas算法, 304-308
重采样（resampling）, 215
使用pandas的滚动统计, 217-222
真实世界数据的统计分析, 409-415
摘要统计, 210-212
工具, 205
find\_MAP() 函数, 432
先进先出（FIFO）原则, 235
最佳方案（first-best solution）, 308
固定高斯求积（fixed Gaussian quadrature）, 336
闪电交易（flash trading）, 12
浮点数（floats）, 63
流控制（flow control）, 68
for 循环, 78 <!-- validate-skip -->
前视偏差（foresight bias），避免, 217
format() 函数, 71
频率方法（frequency approach）, 501-503
频率分布（frequency distribution）, 631
完全截断（full truncation）, 360
函数式编程（functional programming）, 80
资产定价基本定理（Fundamental Theorem of Asset Pricing）, 558-560
FXCM交易平台
入门, 469
检索预打包的历史数据
K线数据, 472
历史市场价格数据集, 469
tick数据, 470
风险免责声明, 468
使用API
账户信息, 480
K线数据, 475
初始步骤, 474
下单, 478
流数据, 477
fxcmpy包, 469

### G

高斯混合（Gaussian mixture）, 444, 447
高斯朴素贝叶斯（Gaussian Naive Bayes, GNB）, 449, 504
gbm\_mcs\_dyna() 函数, 377
gbm\_mcs\_stat() 函数, 376
generate\_paths() 方法, 580
generate\_payoff() 方法, 600
generate\_time\_grid() 方法, 574
通用模拟类（generic simulation class）, 574-577
通用估值类（generic valuation class）, 596-599
gen\_paths() 函数, 399
几何布朗运动（geometric Brownian motion）, 356, 399, 577-582
get\_info() 方法, 619
get\_instrument\_values() 方法, 575
get\_price() 方法, 156
get\_year\_deltas() 函数, 562
图表（另见数据可视化）
希腊字母（Greeks），估计, 599
格林威治标准时间（Greenwich Mean Time, GMT）, 662
GroupBy操作, 130

### H

硬盘驱动器（hard disk drives, HDDs）, 231
HDF5数据库标准, 252, 264
Heston随机波动率模型（Heston stochastic volatility model）, 365
隐藏层（hidden layers）, 454
高频数据（high frequency data）, 228
直方图（histograms）, 186, 225
命中率（hit ratio）, 500
混合硬盘驱动器（hybrid disk drives）, 231

### I

习语与范式（idioms and paradigms）, 308
IEEE 754, 64
if 控制元素, 79 <!-- validate-skip -->
不可变对象（immutable objects）, 76
import this 命令, 4 <!-- validate-skip -->
导入，定义, 6
index() 方法, 76
info() 函数, 123, 211
继承（inheritance）, 147
输入/输出（I/O）操作
兼容性问题, 236
在金融分析中的作用, 231
使用pandas
从SQL到pandas, 247
使用CSV文件, 250
使用Excel文件, 251
使用SQL数据库, 245
使用PyTables
内存外计算, 264
使用数组, 262
使用压缩表, 260
使用表, 253
使用Python
读写文本文件, 236
使用SQL数据库, 239
写入和读取NumPy数组, 242
将对象写入磁盘, 232
使用TsTables
数据检索, 270
数据存储, 269
样本数据, 267
实例属性（instance attributes）, 145
实例化（instantiation），在面向对象编程中, 146
整数（integers）, 62, 149
集成开发环境（integrated development environments, IDEs）, 6
积分（integration）
通过模拟积分, 337
积分区间, 335
数值积分, 336
包导入与自定义, 334
用例, 334
交互式2D绘图（interactive 2D plotting）
基本绘图, 195-199
金融绘图, 199-203
包, 195
插值技术（interpolation technique）
基本思想, 324
线性样条插值, 324
潜在缺点, 328
sci.splrep() 和 sci.splev() 函数, 325
IPython
优势与历史, 6
退出, 48
GBM模拟类, 580
安装, 39
交互式数据分析与, 19
制表补全功能, 62
使用Python 2.7语法, 42
is\_prime() 函数, 283, 285
is\_prime\_cy2() 函数, 285
is\_prime\_nb() 函数, 285
迭代算法（iterative algorithms）, 287

### J

连接（joining），使用pandas, 137
跳跃扩散（jump diffusion）, 369, 582-586
Jupyter
下载, xvi
Jupyter Notebook基础知识, 50
配置文件, 52
历史, 6
安装脚本, 53
安全措施, 53

### K

k-means聚类算法, 444, 446, 499-501
Kelly准则（Kelly criterion）
股票和指数, 527-532
二项设置, 522-526
核密度估计（kernel density estimator, KDE）, 225
键值存储（key-value stores）, 81
keyword 模块, 66
峰度检验（kurtosis test）, 405

### L

lambda 函数, 80
LaTeX排版, 189, 339
最小二乘蒙特卡洛（Least-Squares Monte Carlo, LSM）, 381, 608
最小二乘回归（least-squares regression）, 321
左连接（left join）, 137
杠杆效应（leverage effect）, 365
线性回归（linear regression）, 314
线性样条插值（linear splines interpolation）, 324
列表推导式（list comprehensions）, 79
列表（lists）
用列表构建数组, 86
定义, 76
扩展和缩减, 77
遍历, 79
在市场环境中, 565
在面向对象编程中, 150
操作和方法, 78
LLVM（low level virtual machine）, 279
对数收益（log returns），计算, 214, 224
对数正态分布（log-normal distribution）, 354, 399
逻辑运算符（logical operators）, 67
逻辑回归（logistic regression, LR）, 451, 504
最长回撤期（longest drawdown period）, 540
Longstaff-Schwartz模型, 608
循环（loops）
Cython, 280
估计执行时间, 276
Numba, 279
NumPy, 278
Python, 277
损失水平（loss level）, 388

### M

机器学习（machine learning, ML）
在金融行业的采用, 28
基础知识, 398
包, 444
监督学习, 448-461
涵盖的类型, 444
无监督学习, 444-447
map() 函数, 80
市场环境（market environments）, 565, 574
基于市场的估值（market-based valuation）
模型校准, 641-650
期权数据, 638-640
Python代码, 654
马尔可夫链蒙特卡洛（Markov chain Monte Carlo, MCMC）采样, 432, 437
马尔可夫性质（Markov property）, 356
Markowitz, Harry, 397, 415
鞅方法（martingale approach）, 560
鞅测度（martingale measure）, 375, 558, 578
数学工具（mathematical tools）
应用数学在金融行业的采用, 311
近似, 312-328
凸优化, 328-334
积分, 334-337
数学与Python语法, 18
符号计算, 337-343
matplotlib
基础知识, 8
优势, 167
使用matplotlib生成箱线图, 188
日期时间信息, 667
使用matplotlib生成直方图, 186, 225
matplotlib画廊, 189
NumPy数据结构与, 171
pandas对matplotlib的包装, 126
使用matplotlib生成散点图, 184, 246
使用matplotlib进行静态2D绘图, 168-191
长期财富最大化（maximization of long-term wealth）, 522
夏普比率最大化（maximization of the Sharpe ratio）, 421
最大回撤（maximum drawdown）, 540
McKinney, Wes, 205
mcs\_pi\_py() 函数, 292
mcs\_simulation\_cy() 函数, 302
mcs\_simulation\_nb() 函数, 302
mcs\_simulation\_np() 函数, 301
mcs\_simulation\_py() 函数, 300
均值收益（mean return）, 398
mean() 方法, 129
均值回归过程（mean-reverting processes）, 359
均方误差（mean-squared error, MSE）, 646
均值-方差投资组合选择（mean-variance portfolio selection）, 420
内存布局（memory layout）, 110
无记忆过程（memoryless process）, 356
合并（merging），使用pandas, 139
方法（methods），在面向对象编程中, 145
Miniconda, 35
最小化函数（minimization function）, 421
投资组合方差最小化（minimization of portfolio variance）, 423
minimize() 函数, 421
min\_func\_sharpe() 函数, 423
基于ML的交易策略（ML-based trading strategy）
最优杠杆, 538
概述, 532
持久化模型对象, 543
风险分析, 539-543
向量化回测, 533-537
MLPClassifier算法类, 454
现代投资组合理论（Modern Portfolio Theory, MPT）, 415（另见投资组合优化）
模块化（modularization）, 147, 617
矩匹配（moment matching）, 374, 573
蒙特卡洛模拟（Monte Carlo simulation）, 14, 290, 299-304, 337, 352, 375
乘法（\*）运算符, 150, 161
multiprocessing 模块, 276, 285, 303
可变对象（mutable objects）, 77

### N

噪声数据（noisy data）, 319
非冗余（nonredundancy）, 148
norm.pdf() 函数, 403
正态分布（normal distribution）, 398
正态对数收益（normal log returns）, 399
正态性检验（normality tests）
基准案例, 399-409
真实世界数据, 409-415
在金融中的作用, 397, 398
偏度、峰度与正态性, 405
normality\_tests() 函数, 405
归一化（normalization）, 214
归一化价格数据, 442
normaltest(), 405
now() 函数, 662
np.allclose() 函数, 234
np.arange() 函数, 242, 666
np.concatenate() 函数, 373
np.dot() 函数, 419
np.exp() 函数, 215
np.linspace() 函数, 312
np.meshgrid() 函数, 192
np.polyfit(), 313, 325
np.polyval(), 313, 325
np.sum() 函数, 142
npr.lognormal() 函数, 354
npr.standard\_normal() 函数, 354
Numba
使用Numba实现二叉树, 297
指数加权移动平均（EWMA）, 307
使用Numba循环, 279
使用Numba的蒙特卡洛模拟, 302
潜在缺点, 279
素数算法, 283
数值积分（numerical integration）, 336
NumPy
基础知识, 8, 85
使用NumPy实现二叉树, 295
涵盖的数据结构, 85
日期时间信息, 665-667
datetime64信息, 667
使用Python处理数据数组, 86-90
使用NumPy循环, 278
使用NumPy的蒙特卡洛模拟, 301
常规NumPy数组
布尔数组, 101
内置方法, 91
数学运算, 92
元信息, 97
多维, 94
NumPy dtype对象, 97
numpy.ndarray类, 90, 151, 170
重塑和调整大小, 98
速度比较, 103
通用函数（ufunc）, 92
结构化NumPy数组, 105
应用于pandas的通用函数, 126
代码向量化, 106-112
写入和读取NumPy数组, 242
numpy.random 子包, 346, 572
NUTS() 函数, 432

### O

对象关系映射（object relational mappers）, 239
面向对象编程（object-oriented programming, OOP）
优势与劣势, 145
dx.derivatives\_portfolio类, 626
示例类实现, 146
特性, 147
Python类, 154-159
Python数据模型, 159-163
Python对象, 149-154
术语, 145
Vector类, 163
对象（objects），在面向对象编程中, 145
在线算法（online algorithm）, 544
OpenSSL, 51
最优决策步（optimal decision step）, 609
最优分数f\*（optimal fraction f\*）, 523
最优停止问题（optimal stopping problem）, 380, 608
期权定价理论（option pricing theory）, 399
opts对象, 422
普通最小二乘（ordinary least-squares, OLS）回归, 226, 494-498
内存外计算（out-of-memory computations）, 264
过拟合（overfitting）, 491

### P

包管理器（package managers）
基础知识, 34
conda基本操作, 37-41
Miniconda安装, 35
pandas
基本分析, 123-126
基本可视化, 126
基础知识, 8
优势, 113
使用pandas计算随时间变化, 212-215
复杂选择, 132-135
拼接（concatenation）, 135
支持的数据格式, 244
涵盖的数据结构, 113
DataFrame类, 114-123, 152
日期时间信息, 668-670
发展, 205
容错性, 126
GroupBy操作, 130
使用pandas处理高频数据, 228
导入导出函数和方法, 245
使用pandas导入金融数据, 206-209
连接（joining）, 137
合并（merging）, 139
提供的多种选项, 143
NumPy通用函数与, 126
性能方面, 141
递归函数实现, 304-308
使用pandas的滚动统计, 218
Series类, 128
摘要统计, 210-212
使用pandas处理CSV文件, 250
使用pandas处理Excel文件, 251
使用pandas处理SQL数据库, 245
范式和习语（paradigms and idioms）, 308
并行处理（parallel processing）, 285
并行化（parallelization）, 303, 308
参数（parameters），在面向对象编程中, 146
pct\_change() 函数, 213
pd.concat() 函数, 136
pd.date\_range() 函数, 668
pd.read\_csv() 函数, 206, 245, 251
百分比变化（percentage change），计算, 213
完美预见（perfect foresight）, 217
性能（performance）
Python算法, 281-293
加速任务的方法, 275, 308
二叉树, 294-298
确保高性能, 21
循环, 276-281
蒙特卡洛模拟, 299-304
递归pandas算法, 304-308
所谓的Python缺点, 275
圆周率pi (π), 290-293
pickle.dump() 函数, 233
pickle.load() 函数, 233
plot() 方法, 126, 129
plotly
基本绘图, 195
优势, 167, 195
Plotly for Python入门指南, 195
本地或远程渲染, 195
可用的绘图类型, 198
plot\_option\_stats() 函数, 605
plt.axis() 函数, 173
plt.boxplot() 函数, 188
plt.hist() 函数, 186
plt.legend() 函数, 177
plt.plot() 函数, 169, 177
plt.plot\_surface() 函数, 193
plt.scatter() 函数, 184
plt.setp() 函数, 189
plt.subplots() 函数, 181
plt.title() 函数, 174
plt.xlabel() 函数, 174
plt.xlim() 函数, 173
plt.ylabel() 函数, 174
plt.ylim() 函数, 173
泊松分布（Poisson distribution）, 351
多态（polymorphism）, 148
投资组合优化（portfolio optimization）
背后的基本理论, 417
资本市场线, 425
有效前沿, 424
通过分散化实现最小风险, 416
正态分布收益与, 415
最优投资组合, 421
Harry Markowitz的开创性工作, 397
投资组合理论（portfolio theory）, 398, 415
投资组合估值（portfolio valuation）
衍生品投资组合建模类, 622-626
用例, 626-633
衍生品头寸建模类, 618
用例, 620
包装模块, 634
port\_ret() 函数, 420
port\_vol() 函数, 420
present\_value() 方法, 599
价格变动，预测方向, 504
定价库（pricing library）, 555
素数（prime numbers）
定义, 282
multiprocessing模块与, 285
使用Cython测试, 284
使用Numba测试, 283
使用Python测试, 282
print() 函数, 71 <!-- validate-skip -->
print\_statistics() 函数, 355, 402 <!-- validate-skip -->
私有实例属性（private instance attributes）, 157
概率密度函数（probability density function, PDF）, 403
违约概率（probability of default）, 388
伪代码（pseudo-code）, 18
伪随机数（pseudo-random numbers）, 346, 372
看跌期权（put options）, 375
PyMC3, 430
PyTables
基础知识, 8
优势, 252
内存外计算, 264
使用数组, 262
使用压缩表, 260
使用表, 253
Python数据模型（Python data model）
优势, 163
示例模型实现, 159-163
支持和实现的任务与结构, 159
Python数据结构（Python data structures）
内置结构, 75
控制结构, 78
字典（dicts）, 81, 235
函数式编程, 80
列表（lists）, 76, 150
集合（sets）, 82
涵盖的结构, 61
元组（tuples）, 75
Python数据类型（Python data types）
布尔值（Booleans）, 66
动态类型与静态类型语言, 62
浮点数（floats）, 63
整数（integers）, 62, 149
打印和字符串替换, 71
正则表达式与, 74
字符串（strings）, 69
涵盖的类型, 61
Python Enhancement Proposal 20, 4
Python for Algorithmic Trading证书项目, xv
Python基础设施（Python infrastructure）
云实例, 50-56
Docker容器, 45-50
包管理器, 35-41
可用工具和策略, 34
版本选择与部署, 33
虚拟环境管理器, 41-44
Python编程语言（另见面向对象编程）
在金融行业的采用, xiii
优势, 18
生态系统, 6, 308
通过Python提高效率与生产力, 18-23
确保高性能, 21
执行摘要与特性, 3
从原型到生产, 23
历史, 5
科学计算栈, 8
语法, 4, 14-18
用户谱系, 7
Python Quant Platform, xiv
The Python Quants GmbH, 556
Python Standard Library, 6
pytz 模块, 664

### Q

Quant Platform, 556
分位数-分位数（QQ）图, 404

### R

rand() 函数, 346
随机存取存储器（random access memory, RAM）, 231
随机数（random numbers）
生成不同分布律的随机数, 349
金融中的正态分布, 350
numpy.random子包, 346
简单随机数生成, 347
标准正态分布, 572
生成可视化, 348
各种分布随机数生成的可视化, 351
随机变量（random variables）, 353
随机游走假说（random walk hypothesis, RWH）, 440, 491-494
随机化训练-测试划分（randomized train-test split）, 511
range() 方法, 78
re 模块, 74
实时分析（real-time analytics）, 13
实时数据（real-time data）, 477
实时经济（real-time economy）, 13
重组树（recombining trees）, 294
递归函数实现（recursive function implementations）, 286, 304-308
reduce() 函数, 80
回归技术（regression technique）
单个基函数, 317
最小二乘方法, 321
线性回归, 314
单项式基函数, 313
多维与, 321
噪声数据与, 319
np.polyval() 函数, 314
普通最小二乘（OLS）回归, 226, 494-498
polyfit() 函数的参数, 314
任务, 313
未排序数据, 320
正则表达式（regular expressions）, 74
关系数据库（relational databases）, 239
相对收益数据（relative return data）, 442
相对强弱指标（Relative Strength Index, RSI）, 199
相关市场（relevant markets）, 622
replace() 方法, 70
重采样（resampling）, 215
可重用性（reusability）, 148
路透工具代码（Reuters Instrument Codes, RICs）, 209
风险管理（risk management）
自动化交易, 547
信用估值调整（CVA）, 388
FXCM交易平台, 468
最小化投资组合风险, 416
估值类, 595
风险价值（value-at-risk, VaR）, 383
风险中性贴现（risk-neutral discounting）
常数短期利率, 563
建模和处理日期, 560
风险中性投资者（risk-neutral investors）, 523
风险中性估值方法（risk-neutral valuation approach）, 560
无风险资产（riskless assets）, 426
滚动统计（rolling statistics）
使用pandas推导, 218
金融时间序列示例, 217
技术分析示例, 220
Romberg积分（Romberg integration）, 336
RSA公钥和私钥, 51

### S

sample() 函数, 432
抽样误差（sampling error）, 356
水平扩展与垂直扩展（scaling out vs. scaling up）, 273
散点图（scatter plots）, 184, 246
scatter\_matrix() 函数, 225
sci.fixed\_quad(), 336
sci.quad(), 336
sci.romberg(), 336
sci.splev() 函数, 325
sci.splrep() 函数, 325
科学方法（scientific method）, 25
科学计算栈（scientific stack）, 8
scikit-learn
基础知识, 8
在机器学习方面的优势, 444
使用scikit-learn的DNN, 454, 512-514
预测市场价格变动, 28
SciPy
基础知识, 8, 39
文档, 343, 463
scipy.integrate 包, 334
scipy.integrate 子包, 336
scipy.optimize.minimize() 函数, 333
scipy.stats 子包, 355, 402
sco.fmin() 函数, 331
sco.fsolve() 函数, 427
scs.describe() 函数, 356, 402
scs.scoreatpercentile() 函数, 385
安全外壳（Secure Shell, SSH）, 50
安全套接层（Secure Sockets Layer, SSL）, 50
self.generate\_paths(), 575
顺序训练-测试划分（sequential train-test split）, 509
序列化（serialization）, 233, 236
Series类, 128
集合（sets）, 82
set\_price() 方法, 156
夏普比率（Sharpe ratio）, 421
短期利率（short rates）, 359, 563
简单移动平均线（simple moving averages, SMAs）, 220, 484-491
模拟（simulation）
动态模拟, 356
随机变量, 353
随机过程, 356
在金融中的价值, 352
方差缩减, 372
模拟类（simulation classes）
通用模拟类, 574-577
几何布朗运动, 577-582
跳跃扩散, 582-586
概述, 614
随机数生成, 572
平方根扩散, 587-590
包装模块, 591
偏度检验（skewness test）, 405
切片（slicing）, 77
sn\_random\_numbers() 函数, 572
固态硬盘（solid state disks, SSDs）, 231
SQLAlchemy, 239
SQLite3, 239
平方根扩散（square-root diffusion）, 359, 587-590
堆叠（stacking）, 99
标准正态分布随机数, 572
静态耦合（static coupling）, 276
静态类型语言（statically typed languages）, 62
统计学习（statistical learning）, 398
统计（statistics）
贝叶斯统计, 429-443
机器学习（ML）, 444-461
正态性检验, 398-409
投资组合优化, 415-428
在金融中的价值, 397
随机微分方程（stochastic differential equation, SDE）, 299, 357
随机过程（stochastic processes）
定义, 356
几何布朗运动, 356, 399
跳跃扩散, 369
平方根扩散, 359
随机波动率, 365
随机波动率模型（stochastic volatility models）, 365
随机过程（stochastics）
Python脚本, 392
随机数, 346-352
风险度量, 383-391
模拟, 352-375
用例, 345
估值, 375-382
流数据（streaming data）, 477
行权价（strike values）, 191, 376
字符串（strings）
解析日期时间信息, 74
打印和字符串替换, 71
字符串方法, 69
文本表示, 69
Unicode字符串, 71
结构化查询语言（Structured Query Language, SQL）数据库
从SQL到pandas, 247
使用pandas处理, 245
使用Python处理, 239
sum() 方法, 142
摘要统计（summary statistics）, 210-212
监督学习（supervised learning）
分类问题与估计问题, 448
数据, 448
决策树（DTs）, 452
深度神经网络（DNNs）, 454-461
定义, 448
高斯朴素贝叶斯（GNB）, 449, 504
逻辑回归（LR）, 451, 504
支持向量机（SVM）算法, 29, 460, 504
sy.diff() 函数, 341
Symbol类, 338
符号计算（symbolic computation）
微分, 341
方程, 340
积分与微分, 340
Symbol类, 338
SymPy库, 337
SymPy, 337-343

### T

表（tables）
使用PyTables的压缩表, 260
使用TsTables的数据检索, 270
使用TsTables的数据存储, 269
使用PyTables的I/O, 253
尾部风险（tail risk）, 383
技术分析，使用pandas的滚动统计, 220
金融技术（technology in finance）
速度和频率的进步, 12
潜力, 9
实时分析, 13
技术与人才作为进入壁垒, 11
技术作为使能器, 10
技术支出, 10
TensorFlow, 28, 455, 515-519
终端（Terminal）, 50
文本文件（text files）
兼容性问题, 236
使用Python的I/O, 232
使用Python读写, 236
文本/代码编辑器（text/code editors）, 7, 50
tick数据, 228, 470
时间索引（time indices）, 120
时间到结果，使用Python改进, 19
timedelta对象, 661
到期时间（times-to-maturity）, 191
Timestamp对象, 668
today() 函数, 662
.to\_csv() 方法, 251
轨迹图（trace plots）, 433
交易策略（trading strategies）
算法交易，定义, 483
分类, 504-511
深度神经网络（DNNs）与, 512-519
频率方法, 501-503
k-means聚类算法, 499-501
线性OLS回归, 494-498
随机游走假说, 491-494
简单移动平均线（SMAs）, 484-491
基于ML的交易策略, 532-543
向量化回测方法, 483
train\_test\_split() 函数, 460
ts.read\_range() 函数, 271
TsTables
数据检索, 270
数据存储, 269
样本数据, 267
元组（tuples）, 75
type 函数, 62
排版约定, xv
tzinfo类, 663
tzname() 方法, 663

### U

Unicode字符串, 71
单位零息债券（unit zero-coupon bond, ZCB）, 563
未排序数据（unsorted data）, 320
无监督学习（unsupervised learning）
算法执行, 444
数据, 445
高斯混合, 447
k-means聚类算法, 446
update() 方法, 580
用户自定义函数（user-defined functions）, 477
UTC（协调世界时, Coordinated Universal Time）, 662
utcnow() 函数, 662
utcoffset() 方法, 663

### V

估值（valuation）
美式期权, 380
衍生品估值, 595-616
欧式期权, 14, 376
基于市场的估值, 637-657
投资组合估值, 617-636
未定权益估值, 375
估值框架（valuation framework）
资产定价基本定理, 558-560
市场环境, 565-567
风险中性贴现, 560-564
风险价值（value-at-risk, VaR）, 383, 542
van Rossum, Guido, 5
收益方差（variance of the returns）, 398
方差缩减（variance reduction）, 372, 573
代码向量化（vectorization of code）
优势, 308
增加的内存占用, 278
使用NumPy加速典型任务, 275
使用NumPy, 106-112
使用NumPy循环, 278
向量化回测方法（vectorized backtesting approach）, 483, 487, 533-537
vega, 599
view\_init() 方法, 194
Vim, 7
虚拟环境管理器（virtual environment managers）, 34, 41-44
波动率聚类（volatility clusters），发现, 224
波动率过程（volatility processes）, 359
波动率曲面（volatility surfaces）, 191

### Z

Python之禅（Zen of Python）, 4
基于零的编号（zero-based numbering）, 76

## 关于作者

Yves J. Hilpisch博士是The Python Quants的创始人和管理合伙人，该公司专注于在金融数据科学、人工智能、算法交易和计算金融领域使用开源技术。他也是The AI Machine的创始人兼首席执行官，该公司通过专有的策略执行平台专注于利用人工智能的力量进行算法交易。他还著有另外两本书：

- *Derivatives Analytics with Python* (Wiley, 2015)
- *Listed Volatility and Variance Derivatives* (Wiley, 2017)

Yves在CQF项目讲授计算金融学。他还是首个在线培训项目（可获得Python算法交易和/或计算金融大学证书）的负责人。

Yves编写了金融分析库DX Analytics，并在伦敦、法兰克福、柏林、巴黎和纽约组织关于人工智能、量化金融和算法交易的聚会、会议和训练营。他曾在北美、欧洲和亚洲的技术会议上发表主题演讲。

## 出版说明

《Python金融》封面上的动物是伊斯帕尼奥拉沟齿鼩（Hispaniolan solenodon）。伊斯帕尼奥拉沟齿鼩（*Solenodon paradoxus*）是一种濒危哺乳动物，生活在加勒比海的伊斯帕尼奥拉岛（包括海地和多米尼加共和国）。它在海地尤为罕见，在多米尼加共和国则较为常见。

沟齿鼩以节肢动物、蠕虫、蜗牛和爬行动物为食。它们偶尔也吃根茎、水果和树叶。沟齿鼩体重约一磅到两磅，头身长一英尺，尾巴长约十英寸。这种古老的哺乳动物看起来像一只大鼩鼱。它毛发浓密，背部红棕色，腹部颜色较浅，而尾巴、腿和突出的吻部无毛。

它过着相当 sedentary 的生活方式，经常躲藏起来。当它出来活动时，动作往往笨拙，奔跑时有时会绊倒。然而，作为夜行生物，它进化出了敏锐的听觉、嗅觉和触觉。它独特的体味据说像"山羊味"。

它从第二颗下门齿的沟槽中分泌有毒唾液，用于麻痹和攻击无脊椎动物猎物。因此，它是少数几种有毒的哺乳动物之一。有时在同类争斗中也会释放毒液，这对沟齿鼩本身可能是致命的。通常在初次冲突后，它们会建立支配关系并在同一居所中和平相处。家庭往往长期共同生活。显然，它只在洗澡时饮水。

O'Reilly封面上的许多动物都濒临灭绝；它们对世界都很重要。要了解更多关于如何帮助的信息，请访问 animals.oreilly.com。

封面图片来自Wood的《插图自然史》。封面字体为URW Typewriter和Guardian Sans。正文字体为Adobe Minion Pro；标题字体为Adobe Myriad Condensed；代码字体为Dalton Maag的Ubuntu Mono。

O'REILLY

还有更多精彩内容。

体验O'Reilly及其200多个合作伙伴的书籍、视频、直播在线培训课程等——全部集中在一个地方。

了解更多：oreilly.com/online-learning

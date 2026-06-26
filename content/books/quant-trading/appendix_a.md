---
title: "附录A · MATLAB速览"
weight: 24
description: "MATLAB常用函数与工具箱速览。"
---

MATLAB是由Mathworks公司开发的通用软件包，被许多机构量化研究员和交易者用作回测平台，特别是那些从事统计套利（Statistical Arbitrage）的人。在[第3章](ch03.md)中，我介绍了这个平台，并将其与其他替代方案的优缺点进行了比较。本书中的大多数策略示例都是用MATLAB编写的。其中许多策略是涉及数百只股票的组合交易策略，在Excel中非常难以回测。这里，我将为不熟悉该语言的交易者提供MATLAB的快速概述，以便他们判断是否值得投资学习和使用这个平台进行自己的回测。

MATLAB不仅是一种编程语言；它还是一个集成开发平台，包含非常用户友好的程序编辑器和调试器。它是一种解释型语言（Interpreted Language），类似于Visual Basic，但与C等传统编程语言不同，它不需要编译就可以运行。然而，由于大量内置的数学计算函数，以及它是一种专门设计用于简单快速地对数组（即向量或矩阵）进行计算的数组处理语言（Array-Processing Language），它在回测方面比使用Excel或Visual Basic更加灵活和强大。特别是，C或Visual Basic中必需的许多循环在MATLAB中只需一行代码即可替代。它还包含广泛的文本处理功能，使其成为解析和分析文本（如网页）的强大工具。此外，它有一个全面的图形库，可以轻松绘制各种类型的图形，甚至动画。（本书中的许多图表都是使用MATLAB创建的。）最后，MATLAB代码可以编译成C或C++可执行文件，在没有安装MATLAB平台的计算机上运行。事实上，也有第三方软件可以将MATLAB代码转换为C源代码。

MATLAB的基本语法与Visual Basic或C非常相似。例如，我们可以这样初始化数组$x$的元素：

```matlab
x(1)=0.1;
x(2)=0.3;
% 3 elements of an array initialized.
% This is by default a row-vector
x(3)=0.2;
```

注意我们不需要先"声明"这个数组，也不需要事先告诉MATLAB它的预期大小。如果你省略";"号，MATLAB将打印出被赋值变量的内容结果。任何注释都可以写在"%"号之后。如果你愿意，你可以将大量元素一次性初始化为相同的值：

```matlab
% assigning the value 0.8 to all elements of a 3-vector y.
This is a row-vector.y=0.8*ones(1, 3)
```

现在如果你想对两个向量做向量加法，你可以用传统方式（就像在C中一样），即使用循环：

```matlab
for i=1:3
    z(i)=x(i)+y(i) % z is [0.91.11]
end
```

但MATLAB的强大之处在于它可以非常简洁地并行处理许多数组操作，而无需使用循环。（这就是为什么它被称为向量处理语言。）所以上面的循环，你只需写

```txt
z=x+y % z is the same [0.91.11]
```

更强大的是，你可以轻松地选择不同数组的部分并对其进行操作。你认为以下代码的结果是什么？

```javascript
w=x([13]) + z([21])
```

$x([13])$选择了$x$的第一个和第三个元素，所以$x([13])$就是$[0.1\ 0.2]$。$z([21])$按顺序选择了$y$的第二个和第一个元素，所以$z([21])$是$[1.1\ 0.9]$。因此$w$是$[1.2\ 1.1]$。

你可以同样轻松地删除数组的部分：

```txt
x([13]) = [] % this leaves x as [0.3]
```

连接两个数组也很简单。按行连接，使用";"分隔数组：

```matlab
u=[z([11]); w]
% u is now
% [0.90000.9000;
% 1.20001.1000]
```

按列连接，省略";"：

```txt
v=[z([11]) w]
% v is now
% [0.90000.90001.20001.1000]
```

子数组的选择不仅可以使用包含索引的数组；也可以使用包含逻辑值的数组。例如，这是一个逻辑数组：

```matlab
vlogical=v<1.1
% vlogical is [1100], where the 0s and 1's
% indicate whether that element is less than 1.1 or
% not.
vlt=v(vlogical) % vlt is [0.90.9]
```

实际上，我们可以使用常用的简写来选择相同的子数组

```txt
vlt=v(v<1.1) % vlt is the same [0.90.9]
```

如果出于某些原因，你对$v$中值小于1.1的元素的实际索引感兴趣，可以使用"find"函数：

```matlab
idx=find(v<1.1); % idx is [12]
```

当然，你可以使用这个索引数组来选择与之前相同的子数组：

```matlab
vlt=v(idx); % vlt is the again same [0.90.9]
```

到目前为止，数组示例都是一维的。但当然，MATLAB也可以处理多维数组。这是一个二维示例：

```matlab
x=[123; 456; 789];
% x is
% 123
% 456
% 789
```

你可以使用":"符号选择多维数组的整行或整列。例如，

```matlab
xr1=x(1,:) % xr1 is the first row of x, i.e. xr1 is [123]
xc2=x(:, 2)% xc2 is the second column of x, i.e. xc2 is
% 2
% 5
% 8
```

当然，你可以使用相同的方法从数组中删除整行。

```matlab
x(1,:) = [] % x is now just [456; 789]
```

矩阵的转置（Transpose）用简单的'表示。所以$x$的转置就是$x$，

```txt
475869
```

数组的元素不必是数字。它们可以是字符串，甚至是数组本身。这种数组在MATLAB中称为元胞数组（Cell Array）。在以下示例中，$C$就是这样一个元胞数组：

```txt
C={[123];['a' 'b' 'c' 'd']} C is
% [123]
% 'abcd'
```

MATLAB的一个优点是几乎所有内置函数都可以同时对数组的所有元素进行操作。例如，

```matlab
log(x) % this gives
    % 1.38631.60941.7918
    % 1.94592.07942.1972
```

有大量的此类内置函数。我使用过的一些包括：

```txt
sum, cumsum, diag, max, min, mean, std, corrcoef, repmat, reshape, squeeze, sort, sortrow, rand, size, length, eigs, fix, round, floor, ceil, mod, factorial, setdiff, union, intersect, ismember, unique, any, all, eval, eye, ones, strmatch, regexp, regexprep, plot, hist, bar, scatter, try, catch, circshift, datestr, datenum, isempty, isfinite, isnan, islogical, randperm
```

如果基本MATLAB平台的内置函数不能满足你的所有需求，你总可以从MATLAB购买额外的工具箱（Toolbox）。对量化交易者有用的一些工具箱包括优化（Optimization）、偏微分方程（Partial Differential Equations，用于衍生品交易者）、遗传算法（Genetic Algorithms）、统计学（Statistics）、神经网络（Neural Networks）、信号处理（Signal Processing）、小波（Wavelet）、金融（Financial）、金融衍生品（Financial Derivatives）、GARCH、金融时间序列（Financial Time Series）、数据源（Datafeed）和固定收益（Fixed Income）工具箱。如果这些工具箱太贵，或者它们仍然不能满足你的所有需求，还有许多免费的用户贡献工具箱可以从互联网下载。我在本书中介绍了一个：由James LeSage开发的计量经济学工具箱（Econometrics Toolbox）（www.spatial-econometrics.com）。我以前还使用过其他一些工具箱：Kevin Murphy的贝叶斯网络工具箱（Bayes Net Toolbox）（www.cs.ubc.ca/murphyk/Software/BNT/bnt.html），或者Kevin Sheppard的GARCH工具箱（www.kevinsheppard.org/research/ucsd_garch/ucsd_garch.aspx）。这些用户贡献工具箱的易获取性，以及庞大的MATLAB用户社区（你可以从中寻求帮助），极大地增强了MATLAB作为计算平台的实用性。

当然，你也可以在MATLAB中编写自己的函数。我在本书中给出了许多示例函数，都可以从我的网站www.epchan.com/book下载。事实上，开发自己的常用工具函数库对构建交易策略非常有帮助。随着这个自制库的增长，你开发新策略的生产力也会提高。

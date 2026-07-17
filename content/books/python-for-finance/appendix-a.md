---
title: "附录A · 日期与时间"
weight: 35
description: "Python标准库datetime模块、NumPy日期时间功能、pandas时间序列工具的使用方法。"
---

# 日期与时间

与大多数科学学科一样，日期和时间在金融领域扮演着重要角色。本附录介绍在Python编程中与此主题相关的不同方面。当然，它不可能面面俱到，但它提供了对Python生态系统中支持日期和时间信息建模的主要领域的介绍。

## Python

Python标准库中的`datetime`模块允许实现大多数重要的日期和时间相关任务：

```python
In [1]: from pylab import mpl, plt
    plt.style.use('seaborn')
    mpl.rcParams['font.family'] = 'serif'
    %matplotlib inline

In [2]: import datetime as dt

In [3]: dt.datetime.now() ①
Out[3]: datetime.datetime(2018, 10, 19, 15, 17, 32, 164295)

In [4]: to = dt.datetime.today() ①
to
Out[4]: datetime.datetime(2018, 10, 19, 15, 17, 32, 177092)

In [5]: type(to)
Out[5]: datetime.datetime

In [6]: dt.datetime.today().weekday() ②
Out[6]: 4
```

返回当前精确日期和系统时间。

```txt
⑥ ... day ...
```

```txt
⑤ ... month ...
```

以数字形式返回星期几，其中0 = 星期一。

当然，`datetime`对象可以自由定义：

```txt
In [7]: d = dt.datetime(2020, 10, 31, 10, 5, 30, 500000)
d
Out[7]: datetime.datetime(2020, 10, 31, 10, 5, 30, 500000)
In [8]: str(d)
Out[8]: '2020-10-3110:05:30.500000'
In [9]: print(d)
2020-10-3110:05:30.500000
In [10]: d.year
Out[10]: 2020
In [11]: d.month
Out[11]: 10
In [12]: d.day
Out[12]: 31
In [13]: d.hour
Out[13]: 10
```

自定义`datetime`对象。

字符串表示。

打印该对象。

年属性……

……和时属性。

转换和拆分也很容易实现：

```python
In [14]: o = d.toordinal( ) ①
    o
Out[14]: 737729

In [15]: dt.datetime.fromordinal(o) ②
Out[15]: datetime.datetime(2020, 10, 31, 0, 0)

In [16]: t = dt.datetime.time(d) ③
```

```python
t
Out[16]: datetime.time(10, 5, 30, 500000)
In [17]: type(t)
Out[17]: datetime.time
In [18]: dd = dt.datetime.date(d) ④
dd
Out[18]: datetime.date(2020, 10, 31)
In [19]: d.replace(second=0, microsecond=0) ⑤
Out[19]: datetime.datetime(2020, 10, 31, 10, 5)
```

转换为序数（ordinal number）。

从序数转换回来。

拆分时间部分。

拆分日期部分。

将选定的值设为0。

`timedelta`对象由`datetime`对象上的算术运算（即求两个此类对象之间的差）等操作产生：

```txt
In [20]: td = d - dt.datetime.now() ①
    td
Out[20]: datetime.timedelta(days=742, seconds=67678, microseconds=169720)
In [21]: type(td) ②
Out[21]: datetime.timedelta
In [22]: td.days
Out[22]: 742
In [23]: td.seconds
Out[23]: 67678
In [24]: td.microseconds
Out[24]: 169720
In [25]: td.total_seconds() ③
Out[25]: 64176478.16972
```

两个`datetime`对象之差……

……得到一个`timedelta`对象。

以秒为单位的差值。

有多种方法可以将`datetime`对象转换为不同表示形式，也可以从`str`对象等生成`datetime`对象。详细内容请参见`datetime`模块的文档。以下是一些示例：

```python
In [26]: d.isoformat() ①
Out[26]: '2020-10-31T10:05:30.500000'
In [27]: d.strftime('%A, %d. %B %Y %I:%M%p') ②
Out[27]: 'Saturday, 31. October 202010:05AM'
In [28]: dt.datetime.strptime('2017-03-31', '%Y-%m-%d') ③
Out[28]: datetime.datetime(2017, 3, 31, 0, 0)
In [29]: dt.datetime.strptime('30-4-16', '%d-%m-%y') ③
Out[29]: datetime.datetime(2016, 4, 30, 0, 0)
In [30]: ds = str(d)
ds
Out[30]: '2020-10-3110:05:30.500000'
In [31]: dt.datetime.strptime(ds, '%Y-%m-%d %H:%M:%S.%f') ③
Out[31]: datetime.datetime(2020, 10, 31, 10, 5, 30, 500000)
```

ISO格式字符串表示。

字符串表示的精确模板。

基于模板从`str`对象创建`datetime`对象。

除了`now()`和`today()`函数外，还有`utcnow()`函数，它以UTC（协调世界时，Coordinated Universal Time，以前称为格林威治标准时间GMT）格式返回精确的日期和时间信息。这比作者所在时区（欧洲中部时间CET或欧洲中部夏令时间CEST）早一或两个小时：

```javascript
In [32]: dt.datetime.now()
Out[32]: datetime.datetime(2018, 10, 19, 15, 17, 32, 438889)
```

```txt
In [33]: dt.datetime.utcnow() ①
Out[33]: datetime.datetime(2018, 10, 19, 13, 17, 32, 448897)
```

```txt
In [34]: dt.datetime.now() - dt.datetime.utcnow() ②
Out[34]: datetime.timedelta(seconds=7199, microseconds=999995)
```

返回当前UTC时间。

返回本地时间与UTC时间之差。

`datetime`模块的另一个类是`tzinfo`类，一个通用的时区类，包含`utcoffset()`、`dst()`和`tzname()`方法。UTC和CEST时间的定义可能如下所示：

```python
In [35]: class UTC(dt.tzinfo):
    def utcoffset(self, d):
    return dt.timedelta(hours=0) ①
    def dst(self, d):
    return dt.timedelta(hours=0) ①
    def tzname(self, d):
    return 'UTC'

In [36]: u = dt.datetime.utcnow()

In [37]: u
Out[37]: datetime.datetime(2018, 10, 19, 13, 17, 32, 474585)

In [38]: u = u.replace(tzinfo=UTF()) ②

In [39]: u
Out[39]: datetime.datetime(2018, 10, 19, 13, 17, 32, 474585, tzinfo=<__main__.UTC object at 0x11c9a2320>)

In [40]: class CEST(dt.tzinfo):
    def utcoffset(self, d):
    return dt_timedelta(hours=2) ③
    def dst(self, d):
    return dt_timedelta(hours=1) ③
    def tzname(self, d):
    return 'CEST'

In [41]: c = u.astimezone(CEST()) ④
    c
Out[41]: datetime.datetime(2018, 10, 19, 15, 17, 32, 474585, tzinfo=<__main__.CEST object at 0x11c9a2cc0>)

In [42]: c - c.dst() ⑤
Out[42]: datetime.datetime(2018, 10, 19, 14, 17, 32, 474585, tzinfo=<__main__.CEST object at 0x11c9a2cc0>)
```

UTC没有偏移量。

通过`replace()`方法附加`dt.tzinfo`对象。

CEST的常规和夏令时（Daylight Saving Time, DST）偏移量。

将UTC时区转换为CEST时区。

给出转换后`datetime`对象的夏令时时间。

有一个名为`pytz`的Python模块，实现了世界上最重要的时区：

```python
In [43]: import pytz

In [44]: pytz.country_names['US'] ①
Out[44]: 'United States'

In [45]: pytz.country_timezones['BE'] ②
Out[45]: ['Europe/Brussels']

In [46]: pytz.common_timezones[-10:] ③
Out[46]: ['Pacific/Wake', 'Pacific/Wallis', 'US/Alaska', 'US/Arizona', 'US/Central', 'US/Eastern', 'US/Hawaii', 'US/Mountain', 'US/Pacific', 'UTC']
```

单个国家。

单个时区。

一些常见时区。

使用`pytz`，通常不需要自定义`tzinfo`对象：

```javascript
In [47]: u = dt.datetime.utcnow()

In [48]: u = u.replace(tzinfo=pytz.utc) ①

In [49]: u
Out[49]: datetime.datetime(2018, 10, 19, 13, 17, 32, 611417, tzinfo=<UTC>)
In [50]: u.astimezone(pytz.timezone('CET')) ②
Out[50]: datetime.datetime(2018, 10, 19, 15, 17, 32, 611417, tzinfo=<DstTzInfo 'CET' CEST+2:00:00 DST>)
In [51]: u.astimezone(pytz.timezone('GMT')) ②
Out[51]: datetime.datetime(2018, 10, 19, 13, 17, 32, 611417, tzinfo=<StaticTzInfo 'GMT'>)

In [52]: u.astimezone(pytz.timezone('US/Central')) ②
Out[52]: datetime.datetime(2018, 10, 19, 8, 17, 32, 611417, tzinfo=<DstTzInfo 'US/Central' CDT-1 day, 19:00:00 DST>)
```

通过`pytz`定义`tzinfo`对象。

将`datetime`对象转换到不同时区。

## NumPy

NumPy也提供了处理日期和时间信息的功能：

```python
In [53]: import numpy as np

In [54]: nd = np.datetime64('2020-10-31') ①
    nd
Out[54]: numpy.datetime64('2020-10-31')

In [55]: np.datetime_as_string(nd) ①
Out[55]: '2020-10-31'

In [56]: np.datetime_data(nd) ②
Out[56]: ('D', 1)

In [57]: d
Out[57]: datetime.datetime(2020, 10, 31, 10, 5, 30, 500000)

In [58]: nd = np.datetime64(d) ③
    nd
Out[58]: numpy.datetime64('2020-10-31T10:05:30.500000')

In [59]: nd.astype(dt.datetime) ④
Out[59]: datetime.datetime(2020, 10, 31, 10, 5, 30, 500000)
```

从`str`对象构建及字符串表示。

关于数据本身的元信息（类型、大小）。

从`datetime`对象构建。

转换为`datetime`对象。

另一种构造此类对象的方式是提供`str`对象，例如包含年月和频率信息。请注意，对象值默认为该月的第一天。基于列表对象构建`ndarray`对象也是可行的：

```python
In [60]: nd = np.datetime64('2020-10', 'D')
nd
Out[60]: numpy.datetime64('2020-10-01')
```

```txt
In [61]: np.datetime64('2020-10') == np.datetime64('2020-10-01')
Out[61]: True
```

```javascript
In [62]: np.array(['2020-06-10', '2020-07-10', '2020-08-10'], dtype='datetime64')
```

```python
Out[62]: array(['2020-06-10', '2020-07-10', '2020-08-10'], dtype='datetime64[D]')
In [63]: np.array(['2020-06-10T12:00:00', '2020-07-10T12:00:00', '2020-08-10T12:00:00'], dtype='datetime64[s]')
Out[63]: array(['2020-06-10T12:00:00', '2020-07-10T12:00:00', '2020-08-10T12:00:00'], dtype='datetime64[s]')
```

也可以使用`np.arange()`函数生成日期范围。不同的频率（例如天、周或秒）也很容易处理：

```python
In [64]: np.arange('2020-01-01', '2020-01-04', dtype='datetime64') ①
Out[64]: array(['2020-01-01', '2020-01-02', '2020-01-03'], dtype='datetime64[D]')

In [65]: np.arange('2020-01-01', '2020-10-01', dtype='datetime64[M]') ②
Out[65]: array(['2020-01', '2020-02', '2020-03', '2020-04', '2020-05', '2020-06', '2020-07', '2020-08', '2020-09'], dtype='datetime64[M]')
```

```python
In [66]: np.arange('2020-01-01', '2020-10-01', dtype='datetime64[W]')[:10]
Out[66]: array(['2019-12-26', '2020-01-02', '2020-01-09', '2020-01-16', '2020-01-23', '2020-01-30', '2020-02-06', '2020-02-13', '2020-02-20', '2020-02-27'], dtype='datetime64[W]')
```

```python
In [67]: dtl = np.arange('2020-01-01T00:00:00', '2020-01-02T00:00:00',
    dtype='datetime64[h]') ④
    dtl[:10]
Out[67]: array(['2020-01-01T00', '2020-01-01T01', '2020-01-01T02',
    '2020-01-01T03', '2020-01-01T04', '2020-01-01T05', '2020-01-01T06',
    '2020-01-01T07', '2020-01-01T08', '2020-01-01T09'],
    dtype='datetime64[h]')
```

```python
In [68]: np.arange('2020-01-01T00:00:00', '2020-01-02T00:00:00', dtype='datetime64[s]')[:10] ⑤
Out[68]: array(['2020-01-01T00:00:00', '2020-01-01T00:00:01', '2020-01-01T00:00:02', '2020-01-01T00:00:03', '2020-01-01T00:00:04', '2020-01-01T00:00:05', '2020-01-01T00:00:06', '2020-01-01T00:00:07', '2020-01-01T00:00:08', '2020-01-01T00:00:09'], dtype='datetime64[s]')
```

```txt
In [69]: np.arange('2020-01-01T00:00:00', '2020-01-02T00:00:00',
    dtype='datetime64[ms]'):[10] ⑥
Out[69]: array(['2020-01-01T00:00:00.000', '2020-01-01T00:00:00.001',
    '2020-01-01T00:00:00.002', '2020-01-01T00:00:00.003',
    '2020-01-01T00:00:00.004', '2020-01-01T00:00:00.005',
    '2020-01-01T00:00:00.006', '2020-01-01T00:00:00.007',
    '2020-01-01T00:00:00.008', '2020-01-01T00:00:00.009'],
    dtype='datetime64[ms]')
```

日频率。

月频率。

周频率。

小时频率。

秒频率。

毫秒频率。

绘制日期时间数据和/或时间序列数据有时可能比较棘手。matplotlib支持标准的`datetime`对象。将NumPy的`datetime64`信息转换为Python的`datetime`信息通常可以解决问题，如下例所示（结果如图A-1所示）：

```python
In [70]: import matplotlib.pyplot as plt
%matplotlib inline

In [71]: np.random.seed(3000)
rnd = np.random.standard_normal(len(dtl)).cumsum() ** 2

In [72]: fig = plt.figure(figsize=(10, 6))
plt.plot(dtl.astype(dt.datetime), rnd) ①
fig.autofmt_xdate(); ②
```

使用`datetime`信息作为x值。

自动格式化x轴上的日期时间刻度。

{{< caption >}}图A.1 自动格式化日期时间x轴刻度的绘图{{< /caption >}}

```python
In [74]: ts = pd.Timestamp('2020-06-30')
ts
Out[74]: Timestamp('2020-06-3000:00:00')
```

## pandas

pandas包在设计时至少在一定程度上考虑了时间序列数据。因此，该包提供了能够高效处理日期和时间信息的类，例如用于时间索引的`DatetimeIndex`类（参见 <http://bit.ly/timeseries_doc> 上的文档）。

pandas引入了`Timestamp`对象，作为`datetime`和`datetime64`对象的另一种替代：

```txt
In [73]: import pandas as pd
```

```python
In [75]: d = ts.to_pydatetime() ②
d
Out[75]: datetime.datetime(2020, 6, 30, 0, 0)
```

```txt
In [76]: pd.Timestamp(d) 3
Out[76]: Timestamp('2020-06-3000:00:00')
```

```txt
In [77]: pd.Timestamp(nd) 4
Out[77]: Timestamp('2020-10-0100:00:00')
```

从`str`对象创建`Timestamp`对象。

从`Timestamp`对象创建`datetime`对象。

从`datetime`对象创建`Timestamp`对象。

从`datetime64`对象创建`Timestamp`对象。

另一个重要的类是前面提到的`DatetimeIndex`类，它是`Timestamp`对象的集合，附带许多有用的方法。可以使用`pd.date_range()`函数创建`DatetimeIndex`对象，该函数在构建时间索引方面相当灵活且强大（更多细节请参见第8章）。常见的转换也是可行的：

```python
In [78]: dti = pd.date_range('2020/01/01', freq='M', periods=12)
dti
Out[78]: DatetimeIndex(['2020-01-31', '2020-02-29', '2020-03-31', '2020-04-30', '2020-05-31', '2020-06-30', '2020-07-31', '2020-08-31', '2020-09-30', '2020-10-31', '2020-11-30', '2020-12-31'], dtype='datetime64[ns]', freq='M')
In [79]: dti[6]
Out[79]: Timestamp('2020-07-3100:00:00', freq='M')
```

```python
In [80]: pdi = dti.to_pydatetime() ②
    pdi

Out[80]: array([datetime.datetime(2020, 1, 31, 0, 0),
    datetime.datetime(2020, 2, 29, 0, 0),
    datetime.datetime(2020, 3, 31, 0, 0),
    datetime.datetime(2020, 4, 30, 0, 0),
    datetime.datetime(2020, 5, 31, 0, 0),
    datetime.datetime(2020, 6, 30, 0, 0),
    datetime.datetime(2020, 7, 31, 0, 0),
    datetime.datetime(2020, 8, 31, 0, 0),
    datetime.datetime(2020, 9, 30, 0, 0),
    datetime.datetime(2020, 10, 31, 0, 0),
    datetime.datetime(2020, 11, 30, 0, 0),
    datetime.datetime(2020, 12, 31, 0, 0)], dtype=object)
```

```javascript
In [81]: datetimeIndex(('2020-01-31', '2020-02-29', '2020-03-31', '2020-04-30', '2020-05-31', '2020-06-30', '2020-07-31', '2020-08-31', '2020-09-30', '2020-10-31', '2020-11-30', '2020-12-31'], dtype='datetime64[ns]', freq=None)
```

```python
In [82]: pd.DatetimeIndex(dtl) ④
Out[82]: DatetimeIndex(['2020-01-0100:00:00', '2020-01-0101:00:00',
    '2020-01-0102:00:00', '2020-01-0103:00:00',
    '2020-01-0104:00:00', '2020-01-0105:00:00',
    '2020-01-0106:00:00', '2020-01-0107:00:00',
    '2020-01-0108:00:00', '2020-01-0109:00:00',
    '2020-01-0110:00:00', '2020-01-0111:00:00',
    '2020-01-0112:00:00', '2020-01-0113:00:00',
    '2020-01-0114:00:00', '2020-01-0115:00:00',
    '2020-01-0116:00:00', '2020-01-0117:00:00',
    '2020-01-0118:00:00', '2020-01-0119:00:00',
    '2020-01-0120:00:00', '2020-01-0121:00:00',
    '2020-01-0122:00:00', '2020-01-0123:00:00'],
dtype='datetime64[ns]', freq=None)
```

每月频率、12个周期的`DatetimeIndex`对象。

转换为包含`datetime`对象的`ndarray`对象。

从包含`datetime`对象的`ndarray`对象创建`DatetimeIndex`对象。

从包含`datetime64`对象的`ndarray`对象创建`DatetimeIndex`对象。

pandas能够正确处理日期时间信息的绘图（见图A-2及第8章）：

```python
In [83]: rnd = np.random.standard_normal(len(dti)).cumsum() ** 2
```

```python
In [84]: df = pd.DataFrame(rnd, columns=['data'], index=dti)
```

```javascript
In [85]: df.plot(figsize=(10, 6));
```

{{< caption >}}图A.2 pandas自动格式化Timestamp x轴刻度的绘图{{< /caption >}}

pandas还与`pytz`模块良好集成，用于管理时区：

```python
In [86]: pd.date_range('2020/01/01', freq='M', periods=12, tz=pytz.timezone('CET'))
Out[86]: DatetimeIndex(['2020-01-3100:00:00+01:00', '2020-02-2900:00:00+01:00',
'2020-03-3100:00:00+02:00', '2020-04-3000:00:00+02:00',
'2020-05-3100:00:00+02:00', '2020-06-3000:00:00+02:00',
'2020-07-3100:00:00+02:00', '2020-08-3100:00:00+02:00',
'2020-09-3000:00:00+02:00', '2020-10-3100:00:00+01:00',
'2020-11-3000:00:00+01:00', '2020-12-3100:00:00+01:00'],
dtype='datetime64[ns, CET]', freq='M')
In [87]: dti = pd.date_range('2020/01/01', freq='M', periods=12, tz='US/Eastern')
dti
Out[87]: DatetimeIndex(['2020-01-3100:00:00-05:00', '2020-02-2900:00:00-05:00',
'2020-03-3100:00:00-04:00', '2020-04-3000:00:00-04:00',
'2020-05-3100:00:00-04:00', '2020-06-30T00:00:00-04:00',
'2020-07-31T00:00:00-04:00', '2020-08-31T00:00:00-04:00',
'2020-09-30T00:00:00-04:00', '2020-10-31T00:00:00-04:00',
'2020-11-30T00:00:00-05:00', '2020-12-31T00:00:00-05:00'],
dtype='datetime64[ns, US/Eastern]', freq='M')
In [88]: dti.tz_convert('GMT')
```

Out[88]: DatetimeIndex(['2020-01-3105:00:00+00:00', '2020-02-2905:00:00+00:00', '2020-03-3104:00:00+00:00', '2020-04-3004:00:00+00:00', '2020-05-3104:00:00+00:00', '2020-06-3004:00:00+00:00', '2020-07-3104:00:00+00:00', '2020-08-3104:00:00+00:00', '2020-09-3004:00:00+00:00', '2020-10-3104:00:00+00:00', '2020-11-3005:00:00+00:00', '2020-12-3105:00:00+00:00'], dtype='datetime64[ns, GMT]', freq='M')

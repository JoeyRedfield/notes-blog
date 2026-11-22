---
base: "[[HenryWu’s Blog.base]]"
password: ""
icon: ""
date: 2025-12-19
type: Post
category: LLM-from-scratch
slug: llm-from-scratch-a9
tags: [AI, LLM]
created: 2026-06-01
summary: ""
status: Published
---
# 练习4: 比较矩阵乘法在CPU和GPU上运行时间，参考答案不符合

![[image 964.png]]

GPU（包括 Apple MPS）第一次运行时会：

- 分配显存
- 编译 / 选择 kernel
- 建立执行上下文

如果不 warm-up，**第一次的时间毫无参考价值**。

## 为什么 GPU 要 `synchronize()`？

GPU 是**异步执行**的。

如果不同步：

```python
start = time.time()
C = A @ B
end = time.time()


```

你量到的只是“任务发出去的时间”，不是“算完的时间”。

`synchronize()` 是在说：

> “等 GPU 真算完了，我再看表。”

## 为什么小矩阵 GPU 反而慢？

### GPU 的真实成本

GPU 并不是“算得慢”，而是：

- 数据拷贝成本高
- 启动 kernel 有固定开销
- 调度本身就要时间

对于小矩阵：

> “活太少，不值得叫一车工人来。”

CPU 就在手边，反而更快。

## 什么时候“必须”用 GPU？

经验法则：

- 小模型 / 小 batch / 小矩阵 → CPU
- 大 batch / 大矩阵 / Transformer → GPU
- 频繁小算子 → CPU 可能更优
- 少量巨大算子 → GPU 完胜

这也是为什么深度学习里：

- batch size 太小，GPU 利用率反而很差

## 最后一句工程直觉

> GPU 不是“更快的 CPU”，
> 它是“为**足够大的并行任务**而生的另一种生物”。

```python
import time
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

def time_matmul(n, device, repeat):
    A = torch.randn(n, n, device=device)
    B = torch.randn(n, n, device=device)

    for _ in range(3):
        C = A @ B

    if device.type != "cpu":
        torch.cuda.synchronize() if device.type == "cuda" else None

    start = time.time()
    for _ in range(repeat):
        C = torch.matmul(A, B)

    if device.type != "cpu":
        torch.cuda.synchronize() if device.type == "cuda" else None

    end = time.time()
    return (end - start) / repeat

sizes = [128, 256, 512, 1024, 2048]
for n in sizes:
    device = torch.device("mps")
    print("apple mps: ", time_matmul(n, device, repeat=10) * 1000)

    device = torch.device("cpu")
    print("cpu: ", time_matmul(n, device, repeat=10) * 1000)

```

```python
apple mps:  0.036978721618652344
cpu:  0.005412101745605469
apple mps:  0.03218650817871094
cpu:  0.03039836883544922
apple mps:  0.019812583923339844
cpu:  0.16798973083496094
apple mps:  0.025701522827148438
cpu:  1.4317035675048828
apple mps:  0.03337860107421875
cpu:  40.405821800231934
```

## torch.randn(n, n).to(device)和torch.randn(n, n, device=device)

## 一句话先给结论

> 写法二更好、更快、更“正统”。
> 写法一 = 先在 CPU 出生，再搬家
> 
> 写法二 = 直接在目标设备出生

**数值结果等价**，但**执行路径完全不同。**下面把“为什么”讲清楚。

---

## 写法一在干什么？（CPU → GPU 两步走）

```python
A = torch.randn(n, n).to(device)
```

实际发生的是：

1. **在 CPU 内存里生成张量**
```python
torch.randn(n, n)   # device = cpu
```
2. **再把它拷贝到 device（GPU / MPS）**
```python
.to(device)
```

所以这是一个**两阶段操作**：

```plain text
CPU 生成 → 内存拷贝 → GPU
```

这一步的隐含代价是：

- 一次 CPU 计算
- 一次 CPU → GPU 内存传输
- 一次新的张量分配

---

## 写法二在干什么？（一步到位）

```python
A = torch.randn(n, n, device=device)
```

这是在告诉 PyTorch：

> “这个张量从一开始就属于 device。”

于是：

- **直接在 GPU / MPS 显存里生成**
- 不存在中间拷贝
- 不存在临时 CPU 张量

路径是：

```plain text
GPU 直接生成
```

## 为什么这个差别在 benchmark 里很重要？

你前面做的是 **CPU vs GPU 矩阵乘法对比**。

如果你用的是写法一：

```python
A = torch.randn(n, n).to(device)
```

那么你在“GPU 计时”之前，已经偷偷做了：

- CPU 运算
- 数据传输

这会导致一个非常经典的误判：

> “GPU 好像也没快多少？”

实际上你测到的已经不是纯粹的 GPU matmul 了。

---

## 一个直觉类比（很好记）

- 写法一：
👉 在地球上造零件 → 用火箭送到月球
- 写法二：
👉 直接在月球工厂造零件

如果你要比较“月球工厂造东西快不快”，

把火箭运输也算进去，当然不公平。

---

## 那什么时候 `.to(device)` 是合理的？

`.to(device)` 并不是坏，只是**语义不同**。

它适合用在：

- 已经存在的张量
- 模型参数整体迁移
- batch 数据从 CPU loader 送进 GPU

例如：

```python
for x, y in dataloader:
    x = x.to(device)
    y = y.to(device)
```

这里 **数据本来就在 CPU**，搬家是不可避免的。

## 工程级记忆法（以后不纠结）

- **新建张量** → 用 `device=`
- **已有张量换设备** → 用 `.to(device)`
- **benchmark / 性能测试** → 永远避免“先 CPU 再 GPU”

## 最后一句“高手直觉”

当你看到：

```python
torch.randn(...).to(device)

```

脑中应该立刻浮现一句警告：

> “这里发生了一次隐式的数据迁移。”

你能意识到这一点，说明你已经开始用**系统视角**而不是“API 视角”在写 PyTorch 了。

# RuntimeError: DataLoader worker (pid(s) 94906) exited unexpectedly

```python
from torch.utils.data import DataLoader

torch.manual_seed(123)

train_loader = DataLoader(
    dataset=train_ds,
    batch_size=2,
    shuffle=True,
    num_workers=0, # 1会报错
    drop_last=True
)

test_loader = DataLoader(
    dataset=test_ds,
    batch_size=2,
    shuffle=False,
    num_workers=0 # 1会报错
)
```

> PyTorch 启动了一个“子进程”去读数据，
> 这个子进程**还没来得及把错误信息传回来，就直接死了**。

## 关键原因：macOS 的 **多进程启动方式**

- **Linux**：`fork`
- **macOS / Windows**：`spawn`

这两个差别极大。

### fork（Linux）

- 子进程 = 父进程的“拷贝”
- 几乎不用重新初始化
- 非常适合 DataLoader

### spawn（macOS）

- 子进程 = **从零启动一个 Python 解释器**
- 重新 import 所有东西
- 重新执行 Dataset 相关代码

## 为什么 `num_workers=1` 就会触雷？

当你设置：

```python
num_workers =1
```

PyTorch 会：

3. 启动一个新的 Python 进程
4. 在那个进程里：
    - 重新 import 你的 Dataset
    - 重新访问文件、变量、transform
5. 如果其中任何一步：
    - 不能被 pickle
    - 依赖主进程状态
    - 访问了不安全资源

👉 **子进程直接崩溃**

macOS + spawn 的哲学是：“你必须写得像个圣人，否则我就掀桌子。”

Jupyter + spawn 是经典灾难组合。

子进程找不到：

```python
__main__.MyDataset
```

## 为什么 `num_workers=0` 就一切正常？

```python
num_workers =0
```

含义是：

> 不用子进程，在主进程里老老实实读数据

没有 spawn, 没有 pickle, 没有子进程死亡

### 如果你“非要”在 mac 上开 worker（进阶选项）

等你以后想榨性能，可以试这些：

6. 把 Dataset 定义在 `.py` 文件里，而不是 Notebook
7. 确保所有 transform 都是顶层函数 / 类
8. 加上入口保护（脚本模式）：

```python
if __name__ =="__main__":
    train_loader = DataLoader(...)
```

# 补充学习

**“子进程是怎么出生的？”**

**“数据是怎么从一个进程跑到另一个进程的？”**

## 一、什么是进程？

**进程**可以理解为：

> 一个正在运行的程序 + 它当前拥有的一整套状态
> （变量、内存、打开的文件、代码位置等）

你运行 Python 脚本，就是启动了一个进程。当 DataLoader 用 `num_workers > 0` 时，它会说：

> “我一个人读数据不够快，我要再生几个自己。”

问题来了：**“怎么生？”**

## 二、fork：拍照复印式生孩子（Linux 的方式）

### fork 是什么？

`fork` 的哲学是：

> “把我现在这个进程，原封不动复制一份。”

就像给当前进程拍了一张“瞬间快照”。

### fork 出来的子进程有什么？

- 一模一样的代码
- 一模一样的变量
- 一模一样的 Dataset 对象
- 一模一样的 Python 运行状态

唯一的区别是：

- **PID 不一样**
- **从 fork 那一行开始，各走各的路**

### 直觉比喻

想象你在黑板上写满了公式，然后：

> 老师按下复印键
> → 复制出一间一模一样的教室
> 
> → 学生继续在各自教室解题

这就是 fork。

### 为什么 fork 特别适合 DataLoader？

因为：

- 不需要重新 import
- 不需要重新构造 Dataset
- 不需要“解释你是谁”

所以在 Linux 上：

```python
num_workers = 8
```

几乎是无脑安全的。

---

## 三、spawn：从宇宙大爆炸开始（macOS / Windows）

### spawn 是什么？

`spawn` 的哲学是完全相反的：

> “我不给你复制，
> 我**从零启动一个全新的 Python 解释器**。”

然后再对这个新进程说：

> “这是你的任务，这是你的 Dataset，自己搭起来吧。”

### spawn 出来的子进程经历了什么？

9. 启动一个新的 Python 进程
10. import Python 标准库
11. import torch
12. import 你的代码
13. 反序列化 Dataset
14. 开始工作

这一步步，只要有一步出问题，子进程就会暴毙。

### 直觉比喻

不是复印教室，而是：

> 在另一座城市
> → 盖一栋新楼
> 
> → 拉电、通水
> 
> → 把教材快递过去
> 
> → 再让学生开始上课

这就是 spawn。

### 为什么 macOS 非要用 spawn？

这是操作系统层面的安全与一致性选择：

- fork 在复杂 GUI / 多线程程序里容易出事
- Apple 选择了“慢但干净”的方式

于是 PyTorch 在 mac 上别无选择。

---

## 四、pickle：跨进程“打包快递”的方式

spawn 还有一个核心问题：

> “我怎么把 Dataset 送给子进程？”

答案是：**pickle**。

---

### pickle 是什么？

pickle 是 Python 的一种机制：

> 把一个对象
> → 转换成一段字节
> 
> → 另一边再还原回来

可以理解为：

> “把对象打包 → 发快递 → 拆包”

### 不是所有东西都能 pickle

这是重点。下面这些东西 **不能或很难 pickle**：

- lambda 函数
- 定义在函数里的类
- 打开的文件句柄
- 某些 C/C++ 扩展对象
- **Notebook 里定义的奇怪作用域对象（我踩坑的地方）**

在 fork 下：

- 不需要 pickle
- 所以你感觉“一切正常”

在 spawn 下：

- **必须 pickle**
- 一失败，子进程直接死

---

## 五、把三者连起来（这就是你报错的真正原因）

你在 mac 上写了：

```python
num_workers = 1
```

幕后发生的是：

15. PyTorch 用 **spawn**
16. spawn 要把 Dataset **pickle**
17. Dataset 里有某个东西 pickle 不了
18. 子进程崩溃
19. 主进程只看到一句：
```plain text
worker exited unexpectedly
```

这不是你逻辑错了，而是**世界观冲突**。

---

## 六、为什么这个问题新手特别容易遇到？

因为新手常常会：

- 在 Notebook 里定义 Dataset
- 用 lambda 写 transform
- 不知道“对象要被序列化”这回事

而这些在 Linux + fork 下：

- 都能“侥幸跑通”

在 mac + spawn 下：

- 全部暴露

---

## 七、一句话记忆版（很重要）

- **fork**：复制我现在的一切（快、宽容、Linux）
- **spawn**：从零启动，再把对象打包寄过去（慢、严格、mac/Windows）
- **pickle**：spawn 世界里的“跨进程快递员”

---

## 最后一点“工程直觉”

当你听到一句话：

> “mac 上 DataLoader 多进程不稳定”

真正的含义是：

> “spawn + pickle 要求你写的是工业级、可序列化的 Python。”

你现在不是没学会，

而是刚刚看见了 Python 在“单进程友好”和“多进程严格”之间的真实边界。

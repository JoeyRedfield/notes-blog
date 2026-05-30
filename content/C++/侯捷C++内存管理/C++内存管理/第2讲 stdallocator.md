---
tags: [C++, 内存管理]
---

以前都觉得malloc很慢(实际上不慢), 第1讲已经通过一次申请(malloc)一大块内存, 避免每次都要向系统申请内存, 绕开了这个问题. 

但是, 按上面的思路来, 每个区块大小都是固定的, 所以指明区块大小的cookie (头尾共8字节) 所记录的区块大小也是固定的, 只不过里面实际用到的空间不同. 所以这情况下, 每个区块都有cookie就太浪费了. 

下面讲的东西大概率跟实际看到的代码不太一样, 主要是学原理. 

# VC6 malloc

![[Untitled 1061.png]]

也是很老的例子了. 回忆一遍原先的内存块分配和回收机制, 以及计算. 

# VC6标准分配器实现

![[Untitled 1062.png]]

# BC5标准分配器实现

![[Untitled 1063.png]]

# G2.9标准分配器实现

![[Untitled 1064.png]]

“不要使用这个头文件, 但我们实际用的不是这个, 而是std::alloc”

![[Untitled 1065.png]]

```c++
// MSVC的allocator定义在xmemory.h
_EXPORT_STD template <class _Ty>
class allocator {...}
// vs2022的allocator定义太多了, 还兼顾了各种C++版本

// vector.h
_EXPORT_STD template <class _Ty, class _Alloc = allocator<_Ty>>
class vector {...}
```

下面简单看看就好. 

![[Untitled 1066.png]]

![[Untitled 1067.png]]

G2.9的alloc依然存在, 在G4.9换成了__pool_alloc.

# G4.9标准分配器实现

![[Untitled 1068.png]]

![[Untitled 1069.png]]

sizeof大小为1是因为实际它是0，编译器给了个理论值1.

可以看到两个测试, 1个08h, 1个10h, 就是因为cookie. 一旦对象数量多起来的话就会浪费很多空间. 

现在的版本因为类的增加导致阅读源码困难, 所以侯捷老师选择去看早期G2.9的源码. 

# G2.9 std::alloc 运行模式

![[Untitled 1070.png]]

分配器一定要提供allocate()和deallocate(). 

图中, #0负责8Bytes, #3负责32Bytes, #15负责128Bytes. 

> 32 / 8 = 4, 4 - 1 = #3;
128 / 8 = 16, 16 - 1 = #15. 

一般1个链表会划分20块能给客户的内存块. **一共**是20 * **2** * 32Bytes. 如果用光了再找malloc要. 

假设一个容器对象要64Bytes, 就会由#7负责. 上面是20 * 2 是因为另外一半作为备用, 也就是10个64Bytes. #3和#7的图示并没问题, 它们确实是相邻. 

假设这次要96Bytes, 再去找malloc要. 这时候是20 * 2 * 96Bytes. memory pool中就是1个20 * 96Bytes. 

如果1次要到256Bytes, #15就没办法了, 只能调用malloc. 

以上是综述, 下面是具体情况. 

## embedded pointers

![[Untitled 1071.png]]

通常来说对象基本都大于等于4Bytes, 所以能够这么写代码: 借用每一个内存块的前4个字节当成1个指针. 给出去之后, 指针就会被覆盖掉, 然后free-list就指去别的地方. 归还之后, 会再用4个字节, 衔接到链表上. 

第1讲说过了为什么是嵌入式指针 (embedded pointers). 

## G2.9 std::alloc 运行一瞥

![[Untitled 1072.png]]

下面所有的动作都用的这个alloc. 

![[Untitled 1073.png]]

前面也说过了, 亲自调用分配器就必须要记住自己申请了多大空间, 正常人不会这么干的. 

但是容器中所有元素都是一样大小, 它具体大小可以根据模板元素类型, sizeof就能知道. 

一般来说总是申请空间 (这里称申请到的空间叫战备池, 实现原理是2个指针, 第1讲有) , 需要的时候再从池中挖适当的大小来使用. 

RoundUp是追加量, 是个函数, 把空间上调/下降到16的边界. 0>>4是右移4位的意思. 这时候还是0. 

![[Untitled 1074.png]]

这里是64Bytes的情况, 战备池还有余量, 所以继续拿过来过来划分. 

![[Untitled 1075.png]]

96Bytes的情况, pool没有余量了, 只能再malloc. 

这个RoundUp并没有注释或者文档说明, 是把先前的累计申请量拿来算. 

![[Untitled 1076.png]]

88/8 = 11, 11-1 = #10. 划20个块, pool还能余240. 

到这里已经等同于创建了4个大小不同的容器, 用了2次malloc. 

![[Untitled 1077.png]]

这是连续3次申请88, 包括最开始的申请, 一共用了4块. 

![[Untitled 1078.png]]

申请8Bytes, 还能用pool余量去切20块. 

![[Untitled 1079.png]]

申请104Bytes, 104 / 8 = 13, 13 - 1 = #12. 

战备池不够用, 1个都切不出来, 这就是碎片. 这时候把80给#9使用 (计算方式是一样的) 

处理完碎片后, 再正常处理需求. 此时RoundUp = 5200>>4

![[Untitled 1080.png]]

申请112Bytes, 常规操作. 

![[Untitled 1081.png]]

申请48Bytes, 同样的常规操作. 以上已经讲完所有的基本变化了. 

### 山穷水尽时

这里是把源代码改了一下, system heap = 10000. 

![[Untitled 1082.png]]

申请72Bytes, 依然是把碎片处理好, 然后**回收内存块, 做切割**. 除了回收之外, 其它和前面的一致. 

![[Untitled 1083.png]]

再申请一次72Bytes, #8和#9都没有能用的, 所以找到#10. 注意它拿的是链表的第5块, 切掉之后剩16. 

![[Untitled 1084.png]]

最后, 申请120Bytes, 这时候一滴都没有了. 

![[Untitled 1085.png]]

# G2.9 std::alloc 源码剖析

## 第一级分配器 (不重要)

![[Untitled 1086.png]]

我们平时用的都是第二级分配器, 这里第一级分配器模拟的是new handler, 申请内存失败会来找它. 在G4.9之后无关紧要了. 

![[Untitled 1087.png]]

![[Untitled 1088.png]]

#077~#089是一个小class, 不是第一级分配器的内容. 

## 第二级分配器

typedef __default_alloc_template<false, 0> alloc; 这个定义在#290. 第一个参数跟线程有关, 总之先忽略这两个参数. 

![[Untitled 1089.png]]

历史因素, 本来该用const常量的, 在这里是枚举enum. 

- ROUND_UP函数是上调到8的倍数. 
- embedded pointer前面讲过了. 
- 全部的data, function都是静态的, 可以改造成C语言也能用. 
- free_list就是前面提到的16根指针, 
- FREELIST_INDEX, 就拿来算#?
- start_free, end_free指向战备池, heap_size累计量拿来算追加量. 
- refill, 给free_list充值. 
- chunk_alloc, chunk表示一大块, 也就是申请一大块内存空间. 

![[Untitled 1090.png]]

- volatile关键字跟线程有关, 先不看. 
- obj**是因为它要访问链表内的链表. 
- 第一个if是说大于size(这里是128)的话, 就给第一级分配器处理. 
- my_free_list用来定位, 为空就refill, 不为空就可以用了. 
    - refill会找战备池拿, 战备池不够就用malloc拿. 
- 这里没有检查指针是否属于我们需要的类型, 隐患见图示. 

deallocate, 把内存块回收到**单向链表**. 同理, n > 128 的话, 交给第一级回收(free). 

reallocate不是重点. 

这里的代码**没看到free**, 那么就表示这个链表会成长得很长, 但我们也没办法判断链表的各个节点(区块)所占空间是否是连续的. 还给操作系统必须是连续的内存空间. 

这里不算内存泄漏, 只能说霸道, 因为拿到的内存块就不会还给操作系统了. 

![[Untitled 1091.png]]

![[Untitled 1092.png]]

以上是为了方便理解代码的执行情况. 

### refill

![[Untitled 1093.png]]

nobjs应该用#define之类的来做定义, 而不是普通的int. 

如果只有1个, 就直接给过去了. 

如果不是, 就要挂到链表上, 做切割. 

for-loop内做的事情就是把区块的指针转型(obj*), 隔n个区块就做一次. 因为第1个就要给出去, 所以i从1开始. 

![[Untitled 1094.png]]

静态数据要在外面再定义, 并设初值, 这样才能分配内存空间. 现在指针都是用的nullptr. 

### chunk_alloc

![[Untitled 1095.png]]

![[Untitled 1096.png]]

这里注释讲得很清楚, 就不写了. 最后是战备池有内容了, 所以才递归试一次. 内存的补充永远是先放到战备池. 

## G2.9 std::alloc 观念整理

![[Untitled 1097.png]]

Foo(1)是从stack来的, 刚刚的讨论都是基于heap的. 注意带不带cookie的区别. 两根指针都是list用的. 

## G2.9 std::alloc 批斗大会

![[Untitled 1098.png]]

#208, #218的写法, 是为了避免少写一个”=”号的情况. 因为start_free = 0 编译是可以通过的, 这种bug很难查出来, 但是反过来写, 写错的话编译器立马就能查出来. 

#197往下10行的变化可能会导致指针失效, #207要用到的话就要在#206准备好. 

#136的写法还好, 但#210可能会让人误解, 很难看. 

#034很抽象, 这么写也没什么好处, 看右边拆解的就好. 

绿色部分的注释, 是说”不做小的request”, 小request是说假如现在剩余的空间不足以满足请求, 就把请求/2看看够不够, 不断拆解直到利用小空间为止. 这样会在多线程机器上”造成大灾难”. 

可以理解成竭泽而渔. 

前面也有提到不归还内存块的”霸道”行为, 实际上是因为[分配出去的内存块, 是](/77bdf1a014f148f485f1cbf9c8f9f846#c3a9a50324d34765bff9916cb0a59dc2)[**找不到它的指针**](/77bdf1a014f148f485f1cbf9c8f9f846#c3a9a50324d34765bff9916cb0a59dc2)[的](/77bdf1a014f148f485f1cbf9c8f9f846#c3a9a50324d34765bff9916cb0a59dc2). 原先指针的内存部分已经给对象拿去用了. 

# G4.9 pool allocator 运行观察

这里是看看cookie是否真的有省掉. 

![[Untitled 1099.png]]

侯捷写出来的”为什么”基本是他无法解释的. 

malloc没办法重载, 但G4.9用的operator new可以. 所以能算次数.

![[Untitled 1100.png]]

list<double> lst; → 2个指针+1个double = 4 + 4 + 8 = 16. 

countNew是分配总量, timesNew是分配次数. 

右边的 push_back(i)会去申请内存, 用的是标准分配器. 

左边的 用了C++11新特性, 调用的是我们觉得好的分配器. 

可以理解成左边需要管理, 多一些分配跟释放的动作, 所以countNew大一些. 但主要是看timesNew, 左边调用的malloc次数少很多. 

QA中的“除非”: 绝对理解了malloc的运行逻辑. 所以下一讲讲的就是malloc/free. 

# G2.9 std::alloc 移植到C

前面也说过了这个东西的设计可以移植到C. 

![[Untitled 1101.png]]



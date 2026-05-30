---
tags: [C++, 内存管理]
---

细说malloc的快慢, 理解它的运行逻辑. 但是这一课不会去看源码, 看的是运行图以及关键代码. 

以VC 6.0为基础, 对GNU之类内存分配的运行逻辑可以触类旁通. 

![[Untitled 1102.png]]

用栈的逻辑, 从下往上看. CRT: C RunTime. 

右下可以联想到第2讲讲过的区块分配的情况. __sbh_alloc_block, 处理小块内存. 可以看到__sbh_threshold是很小的数. 

![[Untitled 1103.png]]

由代码可以看到, VC10之后, 就不再专门处理小块内存了. 实际上那些动作都被包括进了HeapAlloc函数. 

# 了解SBH

![[Untitled 1104.png]]

这里用的是win32的东西. _crtheap是全局变量, 用于指向申请好的堆区. 

![[Untitled 1105.png]]

根据数据结构(中的`BITVEC`)画出的图, 32个bit. Hi跟Lo组合成下面较长的一段, Commit单独作32bit. 

# VC6内存分配

![[Untitled 1106.png]]

在VC6, 程序执行前基本都要去申请32*8=256字节的内存空间. 

![[Untitled 1107.png]]

_heap_alloc_dbg, 跟debug header有关, 调整块的大小. 然后再由base做调整. 

nSize就是前面申请到的内存空间. nNoMansLandSize, 无人区大小, 4字节. 

_CrtMemBlockHeader是在Debug模式下用到, 也可以说是Debug header.

①~⑧跟左边是一一对应的. 

- szFileName指明用的_ioinit().c
- _ioinit()在nLine行, 81
- nDataSize, 记录nSzie, 我们能用的空间. 
- nBlockUse, 没说
- IRequest, 流水号, 第一块
- gap, 4个0xfd. 两个gap算是边界. 

![[Untitled 1108.png]]

这里一直是在调整指针, 先看_pFirstBlock和_pLastBlock. 经过malloc拿到的内存块, 也都是在SBH的掌控之中. 我们用的基本是深灰色部分的空间. 

memset用于填数据, 填什么东西图里有. 

![[Untitled 1109.png]]

把刚刚扩充的内存块size在这里做比较. 1024是我们熟悉的数字, 这里用的1016, 因为cookie是8个字节, 留点位置在之后加cookie.

![[Untitled 1110.png]]

注释写得很清楚了, 注意BYTES_PER_PARA是16, 最终是调成16的倍数. 

以下是侯捷原话, 有点莫名其妙:

> 分配内存的时候, 到⑧进入main时, 在debug模式下进行malloc要3个字节, 相当于nsize是3字节, 我们确实拿到3字节, 其它部分用户看不到, 这里已经讲清楚了计算一个block大小的逻辑. 

这个3字节应该是举例. 

然后又回到图中Block的情况, 0x24 = 36 = 28 + 4 + 4, 0x100h=nsize, 4*2=cookie. 

![[Untitled 1111.png]]

前面都是在讲计算和定义, 现在开始说明怎样赋值. 在原先的图上画出了2个指针, 其中一个指向了一个管理中心(indGroupUse), 64chars对应了cntRegionSize, 两个BITVEC组成了32组. tagGroup对应了Group, 这里面有64 * 2 = 128根指针, tagListHead是双向链表, 也就是64条双向链表. 

以上, 为了好好管理虚拟地址空间, 成本是16K. 

![[Untitled 1112.png]]

逻辑上把虚拟地址空间想成32个块, 1024 / 32 = 32K. 这里1024应该是以前面的最小块来算的, 但不知道为什么他这里说32K. 

32K再细分成8块(page1~8), 每个page都是4K. 

SBH跟操作系统要的最开始的是那32K, 而不是整个虚拟内存空间. 用完了32k再去申请. 

![[Untitled 1113.png]]

一整块是4096, 4096-8 = 4088 → [4080, 4080], 最终能用的是4080. 两个”4080”都是cookie, 少的8Bytes属于保留区, 为了凑16的倍数. 

图中向上的指针是借用了sizeFront. 

第2讲讲的16条链表都是8→16→24→…→128Bytes这样管理, 

这里是64条, 最后一条链表应当 (没说这个”应当”是怎么来的) 负责1024(1K), 所以第一条链表是16, 32, 48, 64Bytes…

但是这里, 最后一条链表负责的都是1k以上的内容, 所以现在目前4080都挂在最后一条链表上. 当最后切割剩余不足1k时就交由它上面的链表管理. 计算逻辑和第2讲类似. 

![[Untitled 1114.png]]

130h是前面提到过的内容. 红色地址是return出去的指针, 最后指针再移动到浅绿色部分. 给出去之后剩余大小就是ec0了. 

00000002表示_CRT_BLOCK, 是给CRT用的. 



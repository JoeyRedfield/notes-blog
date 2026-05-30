---
tags: [C++, 内存管理, index]
---

malloc算法参考：[https://gee.cs.oswego.edu/dl/](https://gee.cs.oswego.edu/dl/)

[[第1讲 primitives]]

> C++语言中与内存相关的所有基础构件（constructs），包括malloc/free，new/delete，operator new/operator delete，placement new/placement delete，我将探讨它们的意义、运用方式和重载方式。并以此开发一个极小型内存池（memory pool）。

[[第2讲 stdallocator]]

> 标准库的兴起，意味我们可以摆脱内存管理的繁复琐屑，直接使用容器。但是容器背后的分配器（allocator）攸关容器的速度性能和空间性能。我将比较Visual C++，Borland C++，GNU C++标准库中的allocator，并深入探索其中最精巧的GNU C++ allocator的设计。

[[第3讲 malloc-free]]

> malloc/free是所有内存管理手段的最后一哩；通过它才和操作系统搭上线。当然你也可以直接调用system API，但不建议。因此理解malloc/free的内部管理至为重要。我将以Visual C++的CRT（C RunTime Library）所带的malloc/free源代码为基础，深度探索这最基础最关键的内存分配与释放函数。

[[第4讲 other allocators]]

> 除了std:：allocator，GNU C++还带不少allocators，它们不是标准库的一部分，可视为标准库的扩充。我将探讨这些扩充的allocator，特别是bitmap allocator。
> 我们谈的不只是应用，还深入设计原理与实现手法。在理解了这么多底层（Windows Heap，CRT malloc/free，C++ new/delete，C++ allocators）之后，也许你终于恍然大悟，再不需要自行管理内存了；或也许你终于有能力想像，该在何处以何种方式加强内存管理。

[[第5讲 lokiallocator]]

> 即使知名如GNU C++ pool allocator，也有其小缺陷。Loki（一套作风前沿的程序
库）的allocator设计精简功能完整几无缺点，很值得我们深究。

---

## 相关笔记

- [[第12章 动态内存]] — C++ Primer 动态内存章节
- [[C++ Primer]] — C++ Primer 全书笔记

---
base: "[[知识库.base]]"
主标签:
  - 技术
Related 知识库: []
重要性: ⭐
子标签:
  - C++
状态: Done
作者: ""
---
# 侯捷C++

学习C++主要分两个部分：C++语言和C++标准库。

入门语言，老师也推荐《[C++ Primer](/0c8f1498626245f2baa0a340366a304f)》，还有《The C++ Programming Language》

语言进阶可以学习《Effective C++》

标准库可以学习《The C++ Standard Library》、《STL源码剖析》

**注意Visual Studio有时候编程可能要在头文件声明最上方写上, 避免strcpy等函数报错
#define _CRT_SECURE_NO_WARNINGS**

重要网页: 

1. [cplusplus.com](https://cplusplus.com/)
2. [C++ Standards Support in GCC - GNU Project](https://gcc.gnu.org/projects/cxx-status.html)
3. [cppreference.com](https://zh.cppreference.com/w/%E9%A6%96%E9%A1%B5), 这个网页好像不挂梯子才能访问. 

```c++
cout << _MSVC_LANG << endl;
// MSVC是微软C++编译器, 201402这是实际版本, C++ 14

cout << __cplusplus << endl;
// 199711, vs不更新这个了
```

![[Untitled 493.png]]

4. C++面向对象高级编程（上）-基于对象和面向对象
5. C++面向对象高级编程（下）-兼谈对象模型
6. 侯捷 STL标准库和泛型编程：939min = 15.65h
7. 侯捷 C++新标准：10h = 600min
8. 侯捷 C++内存管理：840min= 14h
9. 侯捷 C++Startup：252min=4h
10. 侯捷STL 设计模式入门：12h = 720min

[[C++面向对象高级编程（上）]]

[[C++面向对象高级编程（下）]]

[[STL标准库和泛型编程]]

[[C++新标准C++11&14]]

[[C++设计模式]]

[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)

进阶可以参考[这里](https://www.zhihu.com/question/566273396).

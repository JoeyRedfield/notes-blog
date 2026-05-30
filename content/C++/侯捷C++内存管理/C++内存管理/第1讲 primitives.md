---
tags: [C++, 内存管理]
---

# 简介

以前计算机的内存很小，DOS 640K甚至需要程序员要对几K的内容锱铢必较。现在时代变了，但内存管理还是很重要的事情。

![[Untitled 1022.png]]

C++ Library多半是指构建容器的情况。一般来说程序员不会用到O.S. API，不然程序可能不具有可移植性。一般是讨论/使用CRT及以上的部分。

![[Untitled 1023.png]]

![[Untitled 1024.png]]

第7/8行::operator new(), ::operator delete()的内部就是调用的第1/2行malloc, free。然后由于各家厂商并没有完全遵守标准规格，导致产生很多#ifdef. 

allocator<int>().allocate(5); 是先创建了**临时对象(object)**, 然后调用了allocate函数. 但是使用分配器, 你allocate了多少空间, deallocate就要释放多少空间. 所以一般都不推荐手操. 

_MSC_VER和__BORLANDC__的allocate都有第二参数, 区别是后者有默认值. 

![[Untitled 1025.png]]

这里是GNU4.9版的代码, 向标准规格看齐了, 设置成了non-static. __pool_alloc(内存池)的概念之后讲.

## new expression

![[Untitled 1026.png]]

前面调用的是**::**operator new(), 默认是全局函数, 这里少了双冒号, 如果有重载就调用重载, 没有的话还是调用全局函数. 可以看到源代码调用的就是malloc函数. 

pc→Complex::Complex(1,2); 在有些编译器可以过, 有些不行. 所以建议用placement new. 

如果malloc失败后, 就会调用_callnewh(size), 相当于调用程序员自己写的函数(有机会)释放一些内存. 两个函数都失败才是真没内存用了, 获取异常std::bad_alloc. 

std::nothrow_t是说 (这个函数) 不抛出异常, 注意它跟noexcept关键字不太一样. 

## delete expression

![[Untitled 1027.png]]

## 对直接调用ctor和dtor的测试

![[Untitled 1028.png]]

看注释就好了. 

## array new, array delete

![[Untitled 1029.png]]

cookie是最开始就讲过的内容, 所有C++编译器的malloc, free都会操作这一块地方. 

![[Untitled 1030.png]]

this隔了4个Bytes是因为A就只有一个int. 

for循环通过placement new去设置初值, 调用的是A(int i)构造函数, 对应了图中3个ctor输出. 

我自己去测试了一下, 输出结果跟ppt是对的. 

```c++
#include <iostream>
using namespace std;
class A
{
public:
	int id;

	A() : id(0) { cout << "default ctor. this=" << this << " id=" << id << endl; }
	A(int i) : id(i) { cout << "ctor. this=" << this << " id=" << id << endl; }
	~A() { cout << "dtor. this=" << this << " id=" << id << endl; }
};

int main() {
	size_t size = 3;
	//case 1
	//模擬 memory pool 的作法, array new + placement new. 崩潰 
	// A* buf = (A*)(new char[sizeof(A) * size]);
	A* buf = new A[size];
	A* tmp = buf;
	cout << "buf=" << buf << "  tmp=" << tmp << endl;
	for (int i = 0; i < size; ++i)
		new (tmp++) A(i);  			//3次 ctor 
	cout << "buf=" << buf << "  tmp=" << tmp << endl;
	delete[] buf;     	// 去掉[]的话可以看到报错, 
	cout << "\n\n";
}
```

### array size in memory block (VC6)

其它编译器可能不一样, 但原理是一样的. 

![[Untitled 1031.png]]

申请内存空间(new)时, 实际给的内存如图所示. 

![[Untitled 1032.png]]

这个用上面的代码也测试过了, 编译没问题(但是有警告), 运行会报错. 

右上角是在计算Demo d[3]占用实际内存的大小. 

1. 32+4: 两块浅黄色部分
2. 4: 数组长度, 图中表示为3
3. 36: 1个Demo有3个int, 3*4*3=36
4. 4*2: 头和尾, 记录了整块内存大小 (60h = 96) . 
5. 最后调成96是为了调成96的边界, Pad就是这里额外加的. 

## placement new

![[Untitled 1033.png]]

placement new 允许我们将object构建在**已经分配的内存**中. “编译器转为”是指new(buf)Complex(1,2); 

buf就是已经分配的内存. 

## 分配内存的途径

这里相当于把前面的(部分)内容做了个总结. 

### C++应用程序

![[Untitled 1034.png]]

前面也讲过了new不可改变, 不可重载. 所以设计模式有一种解耦new的模式, [(抽象)工厂模式](/6076f4066fff4f189fdbf0f91f925409#c5a94254befa474aaf02054400c30988). 

但operator new(), operator delete()不一样. 

### C++容器

![[Untitled 1035.png]]

## 重载 ::operator new / :: operator delete

这里算是初步了解怎样做内存管理. 先看看它们的函数. 

![[Untitled 1036.png]]

这是重载了**全局**的operator new, operator delete函数, 一般人也不会这么干. 这里没说为什么不可以被声明于一个namespace内.

## 重载 operator new / operator delete

![[Untitled 1037.png]]

这里是重载类内的operator new(), operator delete, 更加实际有用. 

delete有2个参数, 第2个参数可有可无. 

## 重载 operator new[] / operator delete[]

![[Untitled 1038.png]]

第二个参数依然可有可无. 这里提到的per-class allocator是后面要讲的内容. 

## 示例

![[Untitled 1039.png]]

![[Untitled 1040.png]]

![[Untitled 1041.png]]

跟上一页的区别是强制使用了global version. 

## 重载 new() / delete()

![[Untitled 1042.png]]

这里强调了new带小括号都算是placement new. 

### 示例

![[Untitled 1043.png]]

按理说应该写出四个对应new的delete, 

![[Untitled 1044.png]]

但实际上, 就算写了对应的4个operator delete, 触发也是有条件的. 

⑤调用的是**抛出异常的ctor**, 这时候, 对应的operator delete**才会被调用到**. 

## basic_string 使用new(extra)扩充申请量

![[Untitled 1045.png]]

我们平时用的string就是这个, 只不过是通过typedef隐藏了basic_string. 这里看图简单了解下string的创建机制(operator new). 

```c++
// vs2022, string.h的相关定义

// P2465R3 Standard Library Modules std And std.compat
#if _HAS_CXX23 && defined(_BUILD_STD_MODULE)
#define _EXPORT_STD export
#else // _HAS_CXX23 && defined(_BUILD_STD_MODULE)
#define _EXPORT_STD
#endif // _HAS_CXX23 && defined(_BUILD_STD_MODULE)

// 第一个是我们常用的
_EXPORT_STD using string  = basic_string<char, char_traits<char>, allocator<char>>;

_EXPORT_STD using wstring = basic_string<wchar_t, char_traits<wchar_t>, allocator<wchar_t>>;
#ifdef __cpp_lib_char8_t
_EXPORT_STD using u8string = basic_string<char8_t, char_traits<char8_t>, allocator<char8_t>>;
#endif // __cpp_lib_char8_t
_EXPORT_STD using u16string = basic_string<char16_t, char_traits<char16_t>, allocator<char16_t>>;
_EXPORT_STD using u32string = basic_string<char32_t, char_traits<char32_t>, allocator<char32_t>>;

```

这段代码是对于 C++ 标准库的模块导出的宏定义。根据代码中的注释可以解释如下：

6. `_HAS_CXX23`: 这是一个预定义的宏，用于表示是否支持 C++23 版本。可能在该代码文件的其他地方定义了该宏。
7. `_BUILD_STD_MODULE`: 这是另一个预定义的宏，用于表示是否正在构建标准库的模块。也可能在其他地方定义了该宏。
8. `_EXPORT_STD`: 这是一个宏，用于定义模块导出关键字。在 C++23 中引入了模块化编程的概念，允许将库代码划分为模块，这样可以减少编译时间和依赖性。这里根据是否支持 C++23 并且正在构建标准库模块来定义 `_EXPORT_STD`，如果支持 C++23 并且正在构建标准库模块，则将 `_EXPORT_STD` 定义为 `export`，否则为空。

所以，这段代码的作用是根据编译器是否支持 C++23 并且是否正在构建标准库的模块来定义模块导出的关键字。

## 自己做内存管理

减少调用malloc的次数总是好的. 或许我们可以先申请一大块内存空间, 每次要的时候再直接给, 而不是每次都去调用malloc申请. 这个也算是内存池的设计思路. 

### ver.1 Per-class allocator

![[Untitled 1046.png]]

![[Untitled 1047.png]]

### ver.2

![[Untitled 1048.png]]

和ver.1最大的不同是用了[union](http://c.biancheng.net/view/7165.html)的部分. 

![[Untitled 1049.png]]

而ver.1和ver.2, 在operator delete()中最终都**没有把申请好的内存空间返回给操作系统**, 但是这不叫内存泄露. 

### ver.3 static allocator

![[Untitled 1050.png]]

设计模式原则的一种, 把相似的代码抽取出来. 这里无非是把ver.2的动作放到了static allocator里. 

在类内嵌套一个名为 `obj` 的结构体以及一个指向 `obj` 结构体的指针 `next`，是为了实现一个简单的内存分配器的链表管理方式。这种方式通常被称为 "free list" 或 "object pool"。

以下是为什么在 `allocator` 类内嵌套 `obj` 结构体和指针的原因：

9. **内存块管理：** `obj` 结构体的作用是用于管理分配的内存块。每个 `obj` 对象代表一个内存块，其中的 `next` 指针链接到下一个可用的内存块。这种链表结构允许高效地管理可用的内存块，从而减少内存分配和释放的开销。
10. **避免内存碎片：** 使用链表管理内存块可以减少内存碎片的产生。当需要分配一个新的内存块时，分配器可以从链表中选择一个合适大小的内存块，而不必每次都在堆上分配新的内存。这有助于降低内存碎片化的风险。
11. **快速分配：** 由于分配的内存块事先被分配并链接在一起，所以分配内存块的过程通常比从堆上直接分配要快速。这对于需要频繁分配和释放内存的场景特别有用。

总之，嵌套 `obj` 结构体和指针在 `allocator` 类中的使用是一种简单但有效的内存管理方式，旨在提高内存分配和释放的效率，减少内存碎片，并优化内存使用。

总之要知道`allocator`是分配器, 而`obj`可以当成是内存块. 

![[Untitled 1051.png]]

![[Untitled 1052.png]]

### ver.4 macro for static allocator

![[Untitled 1053.png]]

进一步地把类似的代码抽取出来用#define定义了. 

![[Untitled 1054.png]]

### global allocator (with multiple free-lists)

![[Untitled 1055.png]]

## new handler

![[Untitled 1056.png]]

又回到了前面内存空间不够的情况, _call**newh**(size)指的就是new handler, 算是补救措施. 

![[Untitled 1057.png]]

![[Untitled 1058.png]]

## 再谈=default, =delete

![[Untitled 1059.png]]

不只是适用于拷贝构造, 拷贝赋值, 析构函数, 还适用于operator new/new[], operator delete/delete[] and their overloads.

![[Untitled 1060.png]]

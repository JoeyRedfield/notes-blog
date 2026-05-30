---

---
# 头文件与类的声明

延申文件名`extension file name`不一定是.h或.cpp，也可能是.hpp或其它甚至无延伸名。

.h文件有`guard（防卫式声明）`，

![[Untitled 494.png]]

含义：程序第一次引入，不曾定义过`__COMPLEX__`的话，就定义出来并往下执行；第二次时，由于定义过了，就不会再往下执行。这样就不会因为重复的`include`而出现问题。

> 建议写头文件的时候务必加上**防卫式声明**。

# constructor（ctor，构造函数）

## inline（内联）函数

函数若在`class body`内定义完成，便自动成为`inline`**候选人**。
`inline`的特性和缺点属于`C`的内容。
简单来说，太复杂的函数不能做成`inline`函数，并且能不能成为`inline`函数由编译器决定。

函数在`class`本体之外，可以在函数声明前面加`inline`关键字。

## access level（访问级别）

`public`、`private`、`protected`、`default`等，Java借鉴的设计。

# ctor语法

```c++
complex (double r = 0, double i = 0)
	: re (r), im (i) // (初值列，初始列)
{ }
// 上下等价，老师更推荐上面的写法，下面等同于直接执行函数来进行赋值，
// 放弃了初值化，效率比上面差一些
complex (double r = 0, double i = 0)
{ re = r; im = i; }
```

## ctor可以有很多个 - overloading（重载）

类比Java。此外，人看着是同名函数，但是在编译之后，函数实际名称肯定是不一样的。

写重载函数的时候务必注意写法，这种写法就不被允许：

```c++
complex (double r = 0, double i = 0)
	: re (r), im (i) // (初值列，初始列)
{ }
complex () : re(0), im(0) { }
// 这两种写法同时出现是会冲突的
```

# ctor在private区域

构造函数根据情况也会被放在`private`区域，比如`Singleton`单例模式。

![[Untitled 495.png]]

# **参数传递与返回值**

## const member functions（常量成员函数）

```c++
double real() const { return re;}
double imag() const { return im; }
```

不会改变数据内容的函数，就加上`const`。

```c++
complex c1(2,1);
// 下面的写法，如果要用real()和imag()函数就必须加const，否则会报错。
const complex c2(2,1);
```

## 参数传递：pass by value VS. pass by reference (to const)

传`value`，是复制了整个对象，两者互不影响，传`reference`，是传引用（&），一起用。

> 建议所有传递都传引用。一般来说效率会高一些。

```c++
// 传引用，但是不让改被引用对象的值，就可以这样写
complex& operator += (const complex&);
```

## 返回值传递：return by value VS. return by reference (to const)

和参数传递类似，也是尽量传递引用。

当然也有可传和不可传引用的情况。

```c++
// 返回引用
complex& operator += (const complex&);
```

## friend（友元）

```c++
{
	//....
private:
	double re, im;
	friend complex& __doapl(complex*, const complex&);
};

inline complex& __doapl(complex* ths, const complex& r){
	ths->re += r.re;
	ths->im += r.im;
  return *ths;
}
```

简单理解成是朋友，可以直接拿private域的数据。

但是C++强调封装，太多`friend`也不好。可以通过函数拿只是相比`friend`访问会慢一些。

## 相同class的各个objects互为friends（友元）

至少在Java没见过这种写法。但是听起来还很合理。

![[Untitled 496.png]]

## class body外的各种定义（definition），什么时候pass/return by reference

结果放在一个已经有的空间，就用`reference`，
但是要创建新对象，就只能用`value`。而且如果是函数内部创建的对象，在函数结束后对象就销毁了，这时候传`reference`也是没意义的。

# 操作符重载与临时对象

## operator overloading（操作符重载 - 1，成员函数）this

可以重载`+`、`+=`等等操作符，这里是二元运算符`+=`。

成员函数放在`class`声明内。**所有的成员函数一定带着隐藏的参数**`**this**`**，但它不能被显式地写出来**。 

![[Untitled 497.png]]

### return by reference 语法分析

<u>传递者（return *ths）</u>无需知道<u>接收者</u>是以<u>reference形式（complex &）</u>接收。

实际上，`c2 += c1；`完成了加算之后就执行完毕了，返回类型理论上来说`complex &`可以换成`void`都行。但是如果有`c3 += c2 += c1`的用法，改成`void`就会报错

## operator overloading（操作符重载 - 2，非成员函数）无this

![[Untitled 498.png]]

像是这类函数（必定返回local object）就绝不能用`reference`，不然对象被销毁了就没意义了。

图中`return`的写法是`C++`的语法：`typename ();`，创建`temp object`（临时对象）。

```c++
// 这两种也是临时对象，但是没名称，到下一行它们生命周期就寄了
complex();
complex(4,5);

// ....code
```

![[Untitled 499.png]]

理论上`operator + `函数可以改成`reference`。我是觉得既然是取`+`的话，传入的`x`如果一开始都是负数，是需要做处理的，不能直接传回`x`。老师说可以下载下来写代码…

![[Untitled 500.png]]

![[Untitled 501.png]]

![[Untitled 502.png]]

这里的函数不可以加`const`，加了就说明参数`os`在函数内不可以被改变。但是`output stream`每次输出都在改变状态。

根据使用场景，如果只是`cout << conj(c1);`的话，返回类型可以改成void，但是再考虑到`cout << c1 << conj(c1);`的话，这返回类型就不能改成void了。

此外，返回类型也不能加`const`，因为`c1`传给`cout`之后得到的结果，还要接收`conj(cj)`，改变`cout`本身。

![[Untitled 503.png]]

# 复习Complex类的实现过程

![[Untitled 504.png]]

输出流函数可以放回到`complex.h`头文件，但是注意要加上`std::ostream`因为没使用`namespace`

![[Untitled 505.png]]

# **三大函数：拷贝构造，拷贝赋值，析构**

![[Untitled 506.png]]

注意构造函数，

第一个是普通的初始化，默认值`0`是让指针指向空对象。

第二个接收了引用，而且是和类同名，所以是**构造**函数中的**拷贝构造**，

第三个是操作符重载，**赋值**动作，是**拷贝赋值**。

第四个是**析构函数**，当对象死亡的时候，就会调用析构函数。

![[Untitled 507.png]]

## class with pointer members 必须有copy ctor和copy op=

`op(assignment operator)`

如果不做`copy op/ctor`的话，默认是做浅拷贝（拷贝指针），可能会导致`memory leak` 内存泄露。

并且注意一定要检测自我赋值(`self assignment`)

![[Untitled 508.png]]

这里务必要注意`String& str`和`this == &str`，两个`&`意义不一样的：前者是`typename&`，是`reference`， 后者是`object`的前面，取的是地址，得到的是一个**指针**。

# **堆，栈与内存管理**

`Stack`，是存在于某作用域`(scope)`的一块内存空间`(memory space)`. 例如当你调用函数, 函数本身会形成一个`stack`用来防止它所接收的参数，以及返回地址。

在函数本体`(function body)`内**声明**的任何变量，其所使用的内存块都取自上述`stack`。

`Heap`，或者`system heap`，是由操作系统提供的一块`global`内存空间，程序可动态分配`(dynamic allocated)`从中获得若干区块`(blocks)`。

![[Untitled 509.png]]

## stack object

在栈里的变量`c1`被称为`stack object`，其生命在作用域`(scope)`结束之际结束。这种作用域内的`object`，又被称为`auto object`，因为它会被**“自动”**清理。

此外，还有`static object`，其生命作用域`(scope)`结束之后仍然存在，直到整个程序结束。

```c++
static Complex c2(1,2);
```

还有`global object`，其生命在整个程序结束之后才结束。也可以把它视为一种`static object`，其作用域是**”整个程序”**。

## heap object

`new`的方式创建的`p`，需要程序员手动地`delete`掉。其生命在它被`delete`之际结束。

![[Untitled 510.png]]

以上会出现内存泄漏`(memory leak)`，因为当作用域结束，`p`所指的`heap object`仍然存在，**但指针**`**p**`**的生命却结束了**，作用于之外再也看不到`p`，也就没机会`delete p`。

## new：先分配memory，再调用ctor

![[Untitled 511.png]]

![[Untitled 512.png]]

`operator new`是`C++`提供的一个函数，可以看到源代码中调用了`malloc(n)`。

`sizeof(Complex)`，由图中看出实部虚部是两个`double`，所以`sizeof(Complex)`是两个`double`的大小。

②是对`void*`的转型。

③调用了构造函数，`pc`是`this`是因为**谁调用函数就谁是**`**this**`。

## delete：先调用dtor，再释放memory

![[Untitled 513.png]]

![[Untitled 514.png]]

`operator delete`也是C++提供的一个函数。

## 动态分配所得的内存块(memory block), in VC

一个`double`占8字节，所以`Complex`类两个`double`占16字节。视频里讲的`Complex`类占8个`Bytes`应该是错的。 

这里应该`1 word = 8 Bytes`。老师说是`4 Bytes`。

这里暂时`double = 4 Bytes`，比较好理解概念。

![[Untitled 515.png]]

红色部分是`cookie`。系统回收的时候，只给一个指针的话并不知道要回收多大空间，所以需要记录空间大小。
先不管数据错误，`00000041`的含义就是大小是`4*16^1=64 Bytes`，`1`是说系统已经分配出去了（或者说程序拿到手了）。这也保证了分配出去的空间是`16`的倍数。

## 动态分配所得的array，函数`array new`和`array delete`

```c++
new char[strlen(cstr) + 1];

delete[] m_data;
```

这是`array new`和`array delete`的写法，

![[Untitled 516.png]]

最后的`+4`是存放数组长度的位置，此处是`3`，在`Debugger Header`下面。

图示说明了为什么`array new`和`array delete`一定要相互搭配，否则会发生内存泄漏。

![[Untitled 517.png]]

如果是`Complex`例子，它没有指针，也不会做动态分配，那么不搭配也OK的。==但是规范起见，一律一起搭配==。

# 复习String类的实现过程

拷贝赋值一定要考虑到**自我赋值**。

内容太多可能会卡，所以分到别的页面

[[扩展补充：类模板，函数模板，及其他]]

[[组合-继承-委托的相关设计]]


---
tags: [C++]
created: 2026-06-01
---

# 导读

![[Untitled 541.png]]

框内的内容在之后的课程，在这里只会偶尔提到。

- 在先前基礎課程所培養的正規、大器的編程素養上，繼續探討更多技術。
- 泛型編程(Generic Programming)和面向對象編程(Object-Oriented Programming)雖然分屬不同思維但它們正是C++的技術主線，所以本課程也討論template(模板)
- 深入探索面向對象之繼承關係(inheritance)所形成的對象模型(Object Model)，包括隱藏於底層的this指針，vptr(虛指針)，vtbl(虛表)，virtual mechanism(虛機制)以及虚函數(virtual functions)造成的polymorphism(多態)效果

# 转换函数和构造函数

## conversion function, 转换函数

![[Untitled 542.png]]

做**类型转换**的时候就需要写转换函数。上面是把分数转换成`double`类型小数，这样才能执行加法。此外要注意`const`什么时候加。

因为整数`4`没有转换函数，这里如果`Fraction`类没写转换函数的话编译是过不了的。

## **non explicit one argument constructor**

![[Untitled 543.png]]

分子没有默认值，分母有默认值`1`，也就是`two parameter, one-argument`

注意下方代码，由于编译器发现`f`转换不了，转而去转换`4`成`Fraction(4, 1)`和前面刚好相反。

## conversion function vs. **non explicit one argument constructor**

![[Untitled 544.png]]

两种转换都写了的话就会报错，编译器会发现有歧义。

## explicit-one-argument ctor

![[Untitled 545.png]]

给构造函数加上`explicit`，就不会作为转换函数使用。这样就会带来新的问题：`4`没办法通过转换函数转换成`Fraction`，因为没有对应的方法（它被加上关键字了）

## 标准库的案例

![[Untitled 546.png]]

`vector<bool, Alloc>`表示容器放/取的是`bool`值，但却取出了`reference`，类型是`__bit_reference`（这是代理模式），然后取对应类找`bool`类型，或者说至少要有转换函数转为`bool`类型。

这里需要去了解一下`vector`类型

[C++ vector 容器浅析 | 菜鸟教程 (runoob.com)](https://www.runoob.com/w3cnote/cpp-vector-container-analysis.html)

看起来`Alloc`，像是内存分配一样的东西，只用看前面的类型就好。它还有迭代器，后面会提到。

# Pointer/function-like classes

## Pointer-like classes

出现的起因是为了做一些指针做不到的事情。

### 第1类 - 智能指针

![[Untitled 547.png]]

`operator*()`和`operator→()`几乎是固定写法。

这里注意，`sp→method()`已经消耗掉→符号并返回`px`了，为什么还会转换成`px→method()`？

因为箭头符号有一个特殊的行为：**会一直作用下去**，这是语法规定的。但`*`号不会。

### 第2类 - 迭代器

![[Untitled 548.png]]

![[Untitled 549.png]]

两者比较之下是很相像的，同样都是`operator*()`取数据（指针指向的内容），`operator→()`取地址

## function-like classes

![[Untitled 550.png]]

能接受`{}`的，就相当于`function-like`

左边三个结构体都有`operator()`的重载，三个都是模板，变成了`function-like classes`仿函数。

identity结构体，收什么返什么，

select1st结构体，接收Pair类，取first，

select2nd结构体，取second，

这也是标准库的内容：旧版本的`pair`类。

C++标准库会细讲仿函数的内容（都会继承奇特的base classes）。

# namespace

![[Untitled 551.png]]

`jj01`和`jj02`相当于在不同的命名空间，在`int main`内以图中形式调用

# Template

## class template

可以说是泛型应用

![[Untitled 552.png]]

## function template

![[Untitled 553.png]]

## member template

![[Untitled 554.png]]

![[Untitled 555.png]]

和`Java`一样，反之不行。见图右下角代码，子类能放到父类里面，反之则不行。

![[Untitled 556.png]]

父类指针指向子类，也是**继承**的内容，这里用智能指针一样能模拟出来。

## specialization, 模板特化

![[Untitled 557.png]]

这里是标准库的片段。

代码的意思是说如果不是char、int、long的话（也就是没被特化），就会去到泛化（最上面的代码）。特化可以有n多个版本。如果能找到特化就用特化。`hash<long>()`是临时对象，`(1000)`是调用了操作符重载函数。

### partial specialization, 模板偏特化 —— 个数的偏

![[Untitled 558.png]]

`bool`只占1个字节，太浪费了。为了提高效率，做模板偏特化，单独为它设计，而不用泛化。

### partial specialization, 模板偏特化 —— 范围的偏

![[Untitled 559.png]]

简单来说，就是**特化成使用指针**。或者说如果不用指针，就用第一个类，否则第二个类。

## template template parameter, 模板模板参数

![[Untitled 560.png]]

`typename`和`typename`共通，黄色部分表明必须是某`typename`的`Container`类型

下面`list`放进去会报错，要用`C++2.0`特性写法才能通过编译。

![[Untitled 561.png]]

重点是黄色部分的写法。

### 这种算template template parameter吗？

![[Untitled 562.png]]

这里注意，因为有默认值所以`s1`写得没问题，但`s2`体现了这**不是模板模板参数**了，因为**没有任何模糊定义的地方**。

# 关于C++标准库

务必要去学习和使用标准库的东西，比如`iterators, containers, algorithms, Functors.`

主要是要知道标准库有什么东西，有些东西自己写也不会有标准库的效果好。

## 了解编译器对C++2.0的支持度

Google一下就好了，visual studio基本支持。

DevC++上有ISO C++11开关，可以查一下。

通过`cout << __cplusplus <<endl;`来确定是否支持C++11：输出`201103`才对

## ⭐variadic templates (since C++11) 数量不定的模板参数

![[Untitled 563.png]]

就是之前接触过的数量不定的参数的形式。`Java`也有类似的。

图中`print`代码的意思相当于不断递归输出`args`的内容。

## auto ( since C++11 )

![[Untitled 564.png]]

相当于语法糖。但是注意用`auto`一定需要编译器帮你推导，你自己也要清楚会返回什么类型。

## ranged-base for (since C++11)

![[Untitled 565.png]]

也是经典了，`foreach`语法

# reference

![[Untitled 566.png]]

务必要注意，`reference`始终是变量的别名，且**一定要有初值**。和`p`指针不同，`r`不能重新代表其他物体。

`**reference**`**底层实际上还是指针**，但是`sizeof`和`&`等运算会有**假象**，见图 示。

![[Untitled 567.png]]

## 常见用途

`reference`是一种漂亮的`pointer`

课程一直都强调效率，所以更推荐传入/返回`reference`

![[Untitled 568.png]]

注意`signature`签名部分，如果这两种形式能并存的话，编译器就不知道调用`func2`还是`func3`了。

# 组合&继承关系下的构造和析构

见下方笔记，这里只是复习。

关键在于要知道**子在外，父在内**。

# 关于vptr和vtbl（虚指针和虚表），还有多态的应用

主要跟`inheritance`有关。

![[Untitled 569.png]]

和`C`语言不同的是，编译完之后`C++`做了**动态绑定**，而不是`call addr`的形式，这属于**静态绑定**（见图中`p→vptr`）

继承函数，**继承的是调用权而不是内存大小**。也就是说父类有虚函数那子类也一定有。

虚指针指向虚表，`vtbl`里面放的都是函数指针，指向虚函数所在的位置。注意`B`的`vtbl`也是有`A`的`func2()`的。

![[Untitled 570.png]]

这里就是`vptr, vtbl, virtual function`的应用。也是`**polymorphism**`**多态的体现**。

# this

![[Untitled 571.png]]

谁调用函数，谁就是`this`。

# Dynamic binding

上图有提到这个名词，需要去查看汇编代码：

![[Untitled 572.png]]

`a.vfunc1()`是通过实体`A`对象调用，是**静态绑定**，在编译器里面体现的是`call addr`

![[Untitled 573.png]]

`pa`的产生本身就用到了`up cast`向上转型，是指针。

图中`p→vptr`的意思是：通过p指针找到虚指针，再通过虚指针找到虚表，调用其中的第n个虚函数。

# const

![[Untitled 574.png]]

重点是红框部分的`const`的作用。告诉编译器不打算改变`class`的`data`，这是**意图**。

图中的例子是假设`print()`没加`const`关键字

![[Untitled 575.png]]

此外，右边`const`算是`signature`的一部分，需要注意重载的情况。
还有会出现`Copy On Write`是因为标准库的`string`类做了共享的机制，`charT`函数加了`const`所以调用的时候必不能改数据，所以不必考虑`COW`，而`reference`函数，调用者有可能会通过访问`char`数组修改字符串，所以必须考虑`COW`。

为什么要写两个函数调用，或者说为什么要区分开常量/非常量对象调用？
我们希望区分的**常量对象**，要注意常量对象**不可修改**的特性；**非常量对象**，是可以被修改的，而string类是共享数据形式，所以必须考虑`COW`。
这里，C++又新添加了一条规则：

> 当成员函数的`const`和`non-const`版本同时存在，`const object`只会（只能）调用`const`版本，而`non-const object`只会（只能）调用`non-const`版本。

# new、delete

![[Untitled 576.png]]

`new`本身会执行3个动作，这个在之前就提过，`delete`也类似。由此引出下面重载的形式。

# operator new/delete

还有数组形式`[]`的重载。注意这些全局影响会非常深远

![[Untitled 577.png]]

## 重载member operator new/delete

![[Untitled 578.png]]

![[Untitled 579.png]]

## 重载实例

![[Untitled 580.png]]

Foo类占`4+4+4=12 Bytes.`是

![[Untitled 581.png]]

注意`with/without virtual dtor`，`sizeof(Foo)`有区别。

按理说`5 * 12 = 60 Bytes.`但是实际上却是`64`，多出了`4`是指示数组大小，里面的值是`5`.

![[Untitled 582.png]]

## 还可以重载new()， delete()

![[Untitled 583.png]]

![[Untitled 584.png]]

![[Untitled 585.png]]

`ctor`抛出异常的情况，`G2.9`有调用重载的`delete`方法，但`G4.9`没有显示。

## base_string 使用new(extra)扩充申请量

![[Untitled 586.png]]

这里是通过`Rep`去查看有多少`reference counting.` 这种需要无声无息添加额外东西的，就需要重载`placement new`

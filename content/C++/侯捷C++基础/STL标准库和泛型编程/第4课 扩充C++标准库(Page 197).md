---
tags: [C++]
created: 2026-06-01
---

# 一个万用的hash function

![[Untitled 744.png]]

![[Untitled 745.png]]

variadic templates, 可变模板, C++11新特性. 

①是②递归函数的入口, ①给②传的是reference, 此时②③④共用seed所以可以通过递归(recursive)一直改变. ②的参数设置就是为了把①中n个参数(args), 分割成1 + (n - 1), 这里的1给了val, n-1给args. hash_combine用于消耗val修改seed. 而到了最后一个参数后, 执行③而不是②, 因为只剩下1+0个参数了. 

![[Untitled 746.png]]

![[Untitled 747.png]]

![[Untitled 748.png]]

这里是在测试hash函数会把这些对象放到哪个bucket里. 画红线部分实际上是7, 8, 9, 10. 而不是6.

## struct hash偏特化形式(G4.9)

![[Untitled 749.png]]

![[Untitled 750.png]]

# tuple, 用例

看例子就知道感觉这个很神奇. 

![[Untitled 751.png]]

why not 28? → 不要太纠结tuple的大小，非常离谱，用内存对齐规则解释不通。

```c++
int main() {
	tuple<string, int, int, double, double> t; // 40 + 4 + 4 + 8 + 8 = 64
	cout << sizeof(double) << endl;
	cout << sizeof(t) << endl; // but 72
	return 0;
}
```

![[Untitled 752.png]]

variadic template的特点可以让一个类一再一再继承直到没有参数(m_head == nullptr). 

inherited&会做一个**转型**的动作, 实际上跟前面的hash function处理动作非常像. 尽管返回*this, 由于做了**转型返回**inherited&, 效果见图上. 

# type traits

![[Untitled 753.png]]

默认情况(泛化)下, 所有类型都重要. 自定义的话就是特化情况. 

POD是说C语言的, struct中没function只有data. 

![[Untitled 754.png]]

新版本(C++11)之后, 不需要像旧版本一样自己实现, 这里已经提供了相当多的函数. 

![[Untitled 755.png]]

![[Untitled 756.png]]

![[Untitled 757.png]]

左下是basic_string的源码, 重点是注意它析构函数并不是virtual destructor. 且type_traits能知道有没有(has_virtual_destructor). 

![[Untitled 758.png]]

前面已经提到过POD是什么, 这里is_pod==1符合实际. 

![[Untitled 759.png]]

polymorphic多态, 有声明/继承虚函数就是true. 

![[Untitled 760.png]]

delete表示不要拷贝构造(copy_construct). 蓝色部分从上到下对应了Zoo中的5个函数. 

跟move相关的是Zoo&&, 是新语法. 

![[Untitled 761.png]]

经典complex, 有不重要的析构函数 → __has_trivial_destructor == true

![[Untitled 762.png]]

# type_traits 实现

相比于旧版本每个都要自己写, 新版type_traits是怎么做到自动判断的? 

![[Untitled 763.png]]

remove_cv相当于把const和volatile拿掉.

两个remove_const, 后者是做了范围上的偏特化, 两个作用都是只取类型_Tp. remove_volatile同理. 

remove_cv里面, 去除const和volatile先后次序没太大关系. 

最后再看is_void_helper, 也是泛化和偏特化. 泛化让传入非void类型会返回false_type, 偏特化确认void类型后返回true_type

![[Untitled 764.png]]

和is_void类似. 

![[Untitled 765.png]]

说是找不到源代码, 先放着. 

![[Untitled 766.png]]

深入到class内部(比较难)的时候, 就找不到源代码了. 

# cout

![[Untitled 767.png]]

![[Untitled 768.png]]

讲半天没讲源码, 就是说了下这是对象, 如果是要实现自己的class支持operator<<操作符的话就要自己去重载. 

# movable元素对于容器速度性能的影响

M表示move. C表示Copy. 下面重点还是看copy和move copy的执行时间区别. 

![[Untitled 769.png]]

用MCtor和CCtor在速度上 (执行时间milli-seconds) 相差非常大. 

而且因为线性容量增长的原因, 两个ctor执行次数都远超3,000,000 

![[Untitled 770.png]]

![[Untitled 771.png]]

![[Untitled 772.png]]

![[Untitled 773.png]]

![[Untitled 774.png]]

move和copy的区别在&&. 

![[Untitled 775.png]]

简单来说move都是做了个浅拷贝, 然后把原来的指针打断. 这也是为什么move比copy快这么多的原因. 所以有一个弊端就是**必须确保接下来不会用到原本**. 下面会有案例. 

dtor这么写是因为拷贝完之后, _data = NULL了, 这情况下就不再需要所谓的delete _data了. 也是为了避免执行2次dtor. 虽然标准规定delete空指针合法没有副作用.

## 测试函数

![[Untitled 776.png]]

copy深拷贝, move copy浅拷贝且切断原指针. 所以move不能乱用, 确保move后原来的数据不再使用.

`M c11(c1);`默认用的是深拷贝

![[Untitled 777.png]]

![[Untitled 778.png]]

![[Untitled 779.png]]

带&&的基本就跟move版本有关. 所以std::string是movable的.


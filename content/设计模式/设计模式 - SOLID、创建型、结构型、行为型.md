---
base: "[[知识库.base]]"
主标签:
  - 技术
Related 知识库: []
子标签:
  - Java
状态: In progress
作者: ""
---
> [!note]+ 基础：SOLID + 1原则
> 好的，我们正式启程！能够先静下心来理解设计模式背后的思想，这是一个非常棒的开端。这就像学武功，我们不先学招式，而是先修炼内功心法。这“内功”，就是设计原则。
> 
> ---
> 
> ### **第一阶段：思想启蒙与基础巩固**
> 
> ### **第一部分：为什么要学习设计模式？ (The "Why")**
> 
> 想象一下我们是建筑工人。
> 
> - **没有设计模式时：** 我们就像一群没有图纸的工人，只是凭感觉和经验在堆砖砌墙。开始可能很快，但盖到一半，发现墙是歪的，承重有问题，想加个窗户都可能导致墙体坍塌。返工、拆改的成本极高，最终盖出的房子既不稳固也不美观。
> 
> 这就是我们常说的**“烂代码”**的痛点：
> 
> - **僵化 (Rigidity):** 想修改一个微小的功能，却发现要改动十几个文件，牵一发而动全身。
> - **脆弱 (Fragility):** 只不过是修复了一个 Bug，却意外地导致另一个看似毫不相关的功能崩溃了。
> - **难以复用 (Immovability):** 想把一个写好的“用户登录”模块用到新项目里，却发现它和订单、商品、日志等代码死死地耦合在一起，根本抽不出来。
> - **难以理解 (Complexity):** 代码逻辑混乱，充满了巨型函数和上帝类（God Class），新人接手项目如同阅读天书，维护成本极高。
> 
> **而设计模式，就是我们软件建筑的“蓝图”和“工程学原理”。**
> 
> 它带给我们的价值是：
> 
> 1. **高效沟通的“行话”**: 当你和同事说“这里我们用一个策略模式来处理不同的支付方式”，所有人立刻就明白了你的意图、代码结构和未来的扩展方式。这远比你花半小时解释你的 `if-else` 设计要高效得多。
> 2. **提升代码的可维护性与可扩展性**: 好的设计模式会让你的代码职责清晰、耦合度低。当需求变更时（这是必然的！），你能够轻松地“扩展”新功能，而不是“修改”旧代码，这大大降低了引入新 Bug 的风险。
> 3. **提高代码复用性**: 设计模式本身就是对通用问题解决方案的抽象。遵循模式设计的模块，更容易被抽离出来，在不同的项目中复用。
> 4. **提供经过验证的解决方案**: 这 23 种经典设计模式是无数顶尖软件工程师在几十年实践中总结出的“最佳实践”。我们不必重新发明轮子，可以直接站在巨人的肩膀上，避免踩他们踩过的坑。
> 
> 总而言之，学习设计模式的最终目的，**是让你养成一种“面向接口、面向扩展、面向复用”的编程思想**，即使你忘记了所有模式的具体名字，这种思想也会让你自然而然地写出优雅、健壮的代码。
> 
> ---
> 
> ### **第二部分：设计模式的六大原则 (SOLID + 1，我们的内功心法)**
> 
> 这六大原则是设计模式的灵魂，是衡量我们代码“好坏”的标尺。理解它们，你就能理解所有设计模式的精髓。
> 
> **1. 单一职责原则 (Single Responsibility Principle - SRP)**
> 
> - **核心思想：** 一个类应该只有一个引起它变化的原因。
> - **通俗解释：** 一个类只负责一项职责。不要让一个类干太多的事情。
> - **生活类比：** 在餐厅里，厨师负责做菜，服务员负责点餐和上菜。如果让厨师又做菜又上菜，效率会很低，而且任何一个环节出问题（比如菜单变了或厨房着火了），都会影响到这个“全能”的厨师。
> - **Java 示例：**
> ```java
> // 反例：一个类干了太多事
> class BadUser {
>     void getInfo() { /* 获取用户信息 */ }
>     void saveToDb() { /* 将用户信息存入数据库 */ }
>     void sendEmail() { /* 给用户发邮件 */ }
> }
> 
> // 正例：职责分离
> class UserInfo { /* 只负责描述用户属性 */ }
> class UserRepository { void save(UserInfo user) { /* 只负责数据库操作 */ } }
> class EmailService { void sendEmail(UserInfo user) { /* 只负责发送邮件 */ } }
> 
> ```
> - **好处：** 类的复杂性降低，可读性提高，可维护性提高，变更引起的风险降低。
> 
> **2. 开闭原则 (Open/Closed Principle - OCP)**
> 
> - **核心思想：** 软件实体（类、模块、函数等）应该对扩展开放，对修改关闭。
> - **通俗解释：** 当我们想增加新功能时，应该通过增加新代码来实现，而不是修改已经测试好的旧代码。
> - **生活类比：** 你的手机。手机厂商对你“关闭”了修改主板的权限，但通过 App Store 和 USB-C 接口对你“开放”了扩展功能的能力。你可以安装新 App、连接各种设备来获得新功能，而无需拆开手机。
> - **Java 示例：**
> ```java
> // 反例：每次增加一种图形，都要修改 Calculator 类
> class BadShapeCalculator {
>     public double area(Object shape) {
>         if (shape instanceof Rectangle) { /* ... */ }
>         if (shape instanceof Circle) { /* ... */ }
>         // 如果要增加三角形，必须修改这里！
>         return 0;
>     }
> }
> 
> // 正例：通过接口实现扩展
> interface Shape { double area(); }
> class Rectangle implements Shape { public double area() { /* ... */ } }
> class Circle implements Shape { public double area() { /* ... */ } }
> // 新增三角形，只需增加新类，无需修改下面的类
> class Triangle implements Shape { public double area() { /* ... */ } }
> 
> class ShapeCalculator {
>     public double area(Shape shape) {
>         return shape.area(); // 无需修改，对扩展开放
>     }
> }
> 
> ```
> - **好处：** 提高系统的稳定性和灵活性，是很多设计模式（如策略模式、装饰者模式）的基石。
> 
> **3. 里氏替换原则 (Liskov Substitution Principle - LSP)**
> 
> - **核心思想：** 所有引用基类的地方必须能透明地使用其子类的对象。
> - **通俗解释：** 子类必须能够完全替代它的父类，并且不会产生任何错误或异常。简单说，子类应该是“听话的”，父类能做到的事，子类也必须能做到，并且行为符合父类的预期。
> - **生活类比：** 鸟会飞。麻雀是鸟，它会飞。但是，企鹅是鸟，它却不会飞。如果你在一个需要“会飞的鸟”的场景下，用企鹅去替换一只普通的鸟，程序可能就会出问题。这说明“企鹅”这个子类破坏了“鸟”这个父类的行为预期。
> - **Java 示例（经典的矩形/正方形问题）：**
> ```java
> class Rectangle {
>     private int width;
>     private int height;
>     // set/get methods...
>     public void setWidth(int width) { this.width = width; }
>     public void setHeight(int height) { this.height = height; }
> }
> 
> // 反例：子类破坏了父类的行为约定
> class Square extends Rectangle {
>     @Override
>     public void setWidth(int width) {
>         super.setWidth(width);
>         super.setHeight(width); // 为了保持正方形的特性
>     }
>     @Override
>     public void setHeight(int height) {
>         super.setWidth(height);
>         super.setHeight(height); // 为了保持正方形的特性
>     }
> }
> 
> public void testArea(Rectangle r) {
>     r.setWidth(5);
>     r.setHeight(4);
>     // 对于Rectangle，预期结果是 20
>     // 但如果传入的是Square，结果是 16！这就不符合预期了！
>     assert r.getWidth() * r.getHeight() == 20;
> }
> 
> ```
> - **好处：** 保证继承体系的正确性，是实现开闭原则的重要方式之一。
> 
> **4. 接口隔离原则 (Interface Segregation Principle - ISP)**
> 
> - **核心思想：** 客户端不应该依赖它不需要的接口。一个类对另一个类的依赖应该建立在最小的接口上。
> - **通俗解释：** 不要设计“胖”接口，而是要设计多个“瘦”接口。
> - **生活类比：** 一个多功能一体机，集成了打印、扫描、复印、传真功能。对于一个只需要打印功能的用户来说，扫描、复印、传真的接口都是多余的、不必要的。不如提供一个独立的打印机接口。
> - **Java 示例：**
> ```java
> // 反例："胖"接口
> interface IWorker {
>     void work();
>     void eat();
> }
> class Human implements IWorker { /* ... 实现 work 和 eat ... */ }
> class Robot implements IWorker {
>     public void work() { /* ... */ }
>     public void eat() { /* 机器人不需要吃东西，这个方法是多余的，只能空实现或抛异常 */ }
> }
> 
> // 正例：接口拆分
> interface IWorkable { void work(); }
> interface IEatable { void eat(); }
> class Human implements IWorkable, IEatable { /* ... */ }
> class Robot implements IWorkable { /* ... 只实现自己需要的功能 ... */ }
> 
> ```
> - **好处：** 系统解耦，降低类的冗余度，提高内聚性。
> 
> **5. 依赖倒置原则 (Dependency Inversion Principle - DIP)**
> 
> - **核心思想：**
>     - A. 高层模块不应该依赖低层模块，二者都应该依赖其抽象。
>     - B. 抽象不应该依赖细节，细节应该依赖抽象。
> - **通俗解释：** 你的目标应该是“面向接口编程”，而不是“面向实现编程”。
> - **生活类比：** 你开车（高层模块），你操作的是方向盘、油门、刹车这些“抽象接口”，你并不关心发动机、变速箱这些“底层模块”是哪个牌子的、具体怎么工作的。你的车依赖的是这些标准接口，而不是某个具体的发动机型号。这样，换一个发动机（细节），你开车的动作（高层模块）完全不受影响。
> - **Java 示例：**
> ```java
> // 反例：高层(Driver)依赖底层(Benz)
> class Benz { public void run() { /* ... */ } }
> class Driver {
>     public void drive(Benz car) { // 强依赖 Benz 类
>         car.run();
>     }
> }
> 
> // 正例：都依赖抽象(ICar)
> interface ICar { void run(); }
> class Benz implements ICar { public void run() { /* ... */ } }
> class Bmw implements ICar { public void run() { /* ... */ } }
> class Driver {
>     public void drive(ICar car) { // 依赖 ICar 接口
>         car.run();
>     }
> }
> 
> ```
> - **好处：** 这是框架设计的核心原则。大大降低了模块间的耦合度，提高了系统的弹性、可扩展性和可维护性。
> 
> **6. 迪米特法则 (Law of Demeter - LoD) - 又名“最少知识原则”**
> 
> - **核心思想：** 一个对象应该对其他对象保持最少的了解。
> - **通俗解释：** 只和你的“直接朋友”交谈，不要和“朋友的朋友”说话。
> - **生活类比：** 你去商店买东西，你只需要告诉收银员（你的直接朋友）你要买什么，然后付钱。你不需要关心收银员是如何操作收银机，收银机又是如何和银行系统交互的（朋友的朋友）。你只需要完成你的交互。
> - **Java 示例：**
> ```java
> class Wallet { public Money getMoney() { /* ... */ } }
> class Customer { private Wallet wallet; public Wallet getWallet() {return wallet;} }
> class Paperboy {
>     // 反例：知道了太多不该知道的细节
>     public void collectMoney(Customer customer, double amount) {
>         // 这行代码就像在和"朋友的朋友"说话，耦合太深
>         Money money = customer.getWallet().getMoney(amount);
>     }
> }
> 
> // 正例：Customer 负责处理自己的内部事务
> class Customer {
>     private Wallet wallet;
>     // 提供一个高层方法，隐藏内部实现
>     public Money pay(double amount) {
>         return wallet.getMoney(amount);
>     }
> }
> class Paperboy {
>     public void collectMoney(Customer customer, double amount) {
>          Money money = customer.pay(amount); // 只和直接朋友 Customer 交流
>     }
> }
> 
> ```
> - **好处：** 降低类之间的耦合度，让一个类的修改尽可能少地影响到其他类。
> 
> ---
> 
> **总结一下：**
> 
> 这六大原则就像六根支柱，共同撑起了软件设计的宏伟大厦。它们之间相辅相成，比如：
> 
> - **单一职责**是基础，让你把类拆分好。
> - **开闭原则**是目标，让你代码稳定又灵活。
> - **里氏替换**是保证，让你的继承不出乱子。
> - **接口隔离**是手段，让你接口定义更清爽。
> - **依赖倒置**是核心，让你彻底解耦。
> - **迪米特法则**是约束，让你别管闲事。
> 
> 花时间反复理解这些原则，你会发现它们无处不在，也是你未来评判自己和他人代码质量的绝佳标准。
> 
> 现在，你对这些原则有什么感受？有没有哪个觉得特别有启发，或者哪个觉得有点抽象、难以理解？我们可以针对性地再聊聊。
> 
> 当你觉得对这些“内功心法”有了初步的体会后，我们就可以带着这些思想，去学习第一个具体的招式——**单例模式**了。

我们将按照“四人帮”（GoF）的分类，从最常用、最易理解的模式开始，逐一学习。对于每个模式，我们都将遵循“**定义 -> 结构 -> 场景 -> Java代码实现 -> 优缺点分析**”的闭环学习法。

**A. 创建型模式 (Creational Patterns) - 关注对象的创建**

- **学习顺序建议：**
> [!note]+ **单例模式 (Singleton):** 最简单也最知名的模式。保证一个类只有一个实例。是入门的好选择。
> 很好！我们正式进入招式学习阶段。**单例模式 (Singleton Pattern)** 是所有设计模式中最简单、最广为人知的一种，也是面试中的高频考点。它非常适合作为我们学习具体设计模式的开端。
> 
> 我们将遵循我们之前定下的学习闭环：**定义 -> 结构 -> 场景 -> Java代码实现 -> 优缺点分析**。
> 
> ---
> 
> ### **招式一：单例模式 (Singleton Pattern)**
> 
> ### **1. 定义：它是什么？**
> 
> 单例模式的核心意图是：**确保一个类只有一个实例，并提供一个全局访问点来获取这个唯一的实例。**
> 
> - **“一个类只有一个实例”**：无论程序在何时何地，尝试创建这个类的对象多少次，最终在内存中都只会存在一个该类的对象。
> - **“提供一个全局访问点”**：不能让使用者随心所欲地 `new` 对象，而是必须通过该类提供的一个特定方法（通常是静态的 `getInstance()` 方法）来获取这个实例。
> 
> ### **2. 结构与实现思想**
> 
> 要实现单例，必须解决两个核心问题：
> 
> 1. **如何防止外部随心所欲地创建实例？**
>     - **答案：** 将构造函数私有化 (`private Constructor()`)。这样一来，除了在这个类内部，任何地方都无法通过 `new` 关键字来创建它的对象。
> 2. **如何提供那个唯一的实例？**
>     - **答案：** 在类的内部自己创建一个实例，并用一个静态变量（通常也是私有的）持有它。然后，提供一个公有的静态方法（如 `getInstance()`），让外部可以通过这个方法来获取这个唯一的实例。
> 
> ### **3. 场景：什么时候用？**
> 
> 当你需要一个对象来协调整个系统中的行为或管理共享资源时，单例模式就非常有用。
> 
> - **配置管理类：** 整个应用程序读取同一份配置文件，这个配置类只需要一个实例。
> - **日志记录器 (Logger)：** 所有模块都应该使用同一个日志记录器实例，以保证日志输出到同一个地方。
> - **线程池 (ThreadPool)：** 系统中通常只需要一个线程池来管理所有线程，避免资源的无谓消耗。
> - **数据库连接池：** 管理和复用数据库连接，保证连接的统一管理。
> - **操作系统的任务管理器：** 你的电脑上无论打开多少次任务管理器，都只会显示同一个窗口。
> - **Spring 框架中的 Bean：** 在 Spring IoC 容器中，默认创建的 Bean 就是单例的。
> 
> **核心思想：** 凡是涉及“**全局唯一**”和“**共享资源**”的场景，都可以考虑使用单例模式。
> 
> ### **4. Java 代码实现：从基础到完美**
> 
> 单例模式的实现方式有很多种，它们在**懒汉/饿汉（加载时机）和线程安全性**上有所不同。我们来逐一剖析。
> 
> ### **实现方式一：饿汉式 (Eager Initialization)**
> 
> 这是最简单的一种实现方式。
> 
> - **思想：** 类加载的时候就立即创建实例，不管你用不用，先创建了再说。因为它很“饥饿”，迫不及待地想创建实例。
> 
> ```java
> // 饿汉式：线程安全
> public class EagerSingleton {
>     // 1. 在类加载时就创建实例，JVM保证了线程安全
>     private static final EagerSingleton INSTANCE = new EagerSingleton();
> 
>     // 2. 私有化构造函数
>     private EagerSingleton() {
>         System.out.println("饿汉式单例被创建了！");
>     }
> 
>     // 3. 提供全局访问点
>     public static EagerSingleton getInstance() {
>         return INSTANCE;
>     }
> 
>     public void showMessage() {
>         System.out.println("Hello, I am an Eager Singleton!");
>     }
> }
> 
> ```
> 
> - **优点：**
>     - 写法简单。
>     - **天然线程安全**。因为实例是在类加载时创建的，由 JVM 的类加载机制保证了在多线程环境下也只会被创建一次。
> - **缺点：**
>     - **可能造成资源浪费**。如果这个单例对象很耗费内存，但从始至终程序都没有使用过它，那么这部分内存就被白白占用了。启动速度可能会慢一点点。
> 
> ### **实现方式二：懒汉式 (Lazy Initialization) - 基础版 (线程不安全)**
> 
> - **思想：** 不在类加载时创建，而是在第一次调用 `getInstance()` 方法时才创建实例。因为它很“懒”，什么时候需要用了才去创建。
> 
> ```java
> // 懒汉式：线程不安全！【仅用于演示，不要在生产使用】
> public class LazySingleton {
>     private static LazySingleton instance; // 默认是 null
> 
>     private LazySingleton() {
>         System.out.println("懒汉式单例被创建了！");
>     }
> 
>     public static LazySingleton getInstance() {
>         // 关键问题在这里！
>         if (instance == null) {
>             // 多个线程可能同时到达这里，都会判断 instance == null
>             instance = new LazySingleton(); // 从而导致多次创建
>         }
>         return instance;
>     }
> }
> 
> ```
> 
> - **优点：**
>     - 实现了**延迟加载 (Lazy Loading)**，节省了资源。
> - **缺点：**
>     - **线程不安全！** 在多线程环境下，如果有两个或以上的线程同时进入 `if (instance == null)` 判断，它们都会认为实例尚未创建，从而各自创建一个实例，这就违背了单例的初衷。
> 
> ### **实现方式三：懒汉式 - 同步方法版 (线程安全，但性能低)**
> 
> - **思想：** 为了解决线程安全问题，最简单粗暴的方法就是给 `getInstance()` 方法加上 `synchronized` 关键字。
> 
> ```java
> // 懒汉式：线程安全，但性能不佳
> public class SynchronizedLazySingleton {
>     private static SynchronizedLazySingleton instance;
> 
>     private SynchronizedLazySingleton() {}
> 
>     // 加上 synchronized 关键字，保证同一时刻只有一个线程能进入此方法
>     public static synchronized SynchronizedLazySingleton getInstance() {
>         if (instance == null) {
>             instance = new SynchronizedLazySingleton();
>         }
>         return instance;
>     }
> }
> 
> ```
> 
> - **优点：**
>     - 解决了线程安全问题。
> - **缺点：**
>     - **性能差**。`synchronized` 会给方法上锁，导致每次调用 `getInstance()` 都会进行同步，即使实例已经被创建了。而实际上，我们只需要在第一次创建实例时进行同步即可。后续的读取操作是不需要同步的，这造成了不必要的性能开销。
> 
> ### **实现方式四：双重检查锁定 (Double-Checked Locking - DCL)**
> 
> 这是懒汉式的一种非常经典的优化实现，面试高频考点。
> 
> - **思想：** 既要懒加载，又要线程安全，还要高性能。
> 
> ```java
> // 双重检查锁定 (DCL)
> public class DclSingleton {
>     // 关键点1: volatile 关键字
>     // 保证了instance变量在多线程之间的可见性，并禁止指令重排序
>     private static volatile DclSingleton instance;
> 
>     private DclSingleton() {}
> 
>     public static DclSingleton getInstance() {
>         // 关键点2: 第一次检查，在不加锁的情况下判断，提高性能
>         if (instance == null) {
>             // 关键点3: 同步代码块，只有在实例未创建时才进入
>             synchronized (DclSingleton.class) {
>                 // 关键点4: 第二次检查，防止多个线程同时通过第一次检查后重复创建
>                 if (instance == null) {
>                     instance = new DclSingleton();
>                 }
>             }
>         }
>         return instance;
>     }
> }
> 
> ```
> 
> **剖析DCL的精妙之处：**
> 
> 3. **第一次 **`**if (instance == null)**`**:** 这个检查是为了性能。如果实例已经存在，就直接返回，避免了每次都进入同步块的开销。
> 4. `**synchronized**`** 锁:** 只有当实例不存在时，才需要加锁进入创建流程，大大减小了锁的粒度。
> 5. **第二次 **`**if (instance == null)**`**:** 这是为了防止线程安全问题。假设线程A和B都通过了第一次检查，A先拿到锁，创建了实例。当A释放锁后，B拿到锁，如果没有第二次检查，B会再次创建一个实例。第二次检查确保了只有真正需要创建的线程才会执行 `new` 操作。
> 6. `**volatile**`** 关键字：** 这是 DCL 的灵魂！它有两个作用：
>     - **保证可见性：** 当一个线程修改了 `instance` 变量的值，其他线程能够立即得知这个修改。
>     - **禁止指令重排序：** `instance = new DclSingleton()` 这行代码在底层实际上分为三步：1. 分配内存空间；2. 初始化对象；3. 将 `instance` 引用指向分配的内存地址。JVM 可能会进行指令重排序，变成 1 -> 3 -> 2。如果没有 `volatile`，线程A执行了1和3，但还没执行2，此时 `instance` 已经不为 `null` 了。线程B进行第一次检查，发现 `instance` 不为 `null`，就直接返回了一个尚未初始化完成的对象，使用时就会出错。`volatile` 杜绝了这种情况。
> 
> ### **实现方式五：静态内部类 (Static Inner Class)**
> 
> 这是目前被认为**最优雅、最推荐**的懒汉式实现。
> 
> - **思想：** 利用 JVM 类加载机制来保证线程安全和懒加载。
> 
> ```java
> // 静态内部类方式：线程安全且懒加载
> public class StaticInnerClassSingleton {
>     // 1. 私有化构造器
>     private StaticInnerClassSingleton() {}
> 
>     // 2. 定义一个私有的静态内部类
>     private static class SingletonHolder {
>         // 在内部类中持有单例的实例，并且是 final 的
>         private static final StaticInnerClassSingleton INSTANCE = new StaticInnerClassSingleton();
>     }
> 
>     // 3. 提供全局访问点
>     public static StaticInnerClassSingleton getInstance() {
>         return SingletonHolder.INSTANCE;
>     }
> }
> 
> ```
> 
> **剖析其原理：**
> 
> 7. **懒加载：** 只要不调用 `getInstance()` 方法，`SingletonHolder` 这个内部类就不会被加载，它的 `INSTANCE` 字段也就不会被初始化。这就实现了懒加载。
> 8. **线程安全：** 当第一次调用 `getInstance()` 时，JVM 会去加载 `SingletonHolder` 类。JVM 的类加载过程是天然线程安全的，它会确保 `INSTANCE` 静态变量只被初始化一次。
> 9. **简洁优雅：** 代码没有了 DCL 中复杂的 `volatile` 和 `synchronized`，非常清晰。
> 
> ### **实现方式六：枚举 (Enum)**
> 
> 这是《Effective Java》作者 Joshua Bloch 极力推崇的方式，**最简单、最安全**的实现。
> 
> - **思想：** 枚举类型本身就是单例的。
> 
> ```java
> // 枚举方式：最简洁、最安全的单例实现
> public enum EnumSingleton {
>     INSTANCE; // 定义一个枚举元素，它本身就是单例的实例
> 
>     public void showMessage() {
>         System.out.println("Hello, I am an Enum Singleton!");
>     }
> }
> 
> // 如何使用？
> // EnumSingleton.INSTANCE.showMessage();
> 
> ```
> 
> - **优点：**
>     - 写法极度简洁。
>     - **天然的线程安全**，由 JVM 保证。
>     - **可以防止通过反射和反序列化破坏单例**。前面几种方式，都可以通过反射暴力调用私有构造器来创建新实例，或者在反序列化时创建新对象。而枚举类型在这些方面都有天然的防御机制。
> - **缺点：**
>     - 不是懒加载。
>     - 对于习惯了面向对象编程的开发者来说，可能稍微有点不直观。
> 
> ### **5. 优缺点分析 & 总结**
> 
> - **优点：**
>     - **内存控制：** 保证内存中只有一个实例，节约系统资源。
>     - **逻辑控制：** 方便对唯一实例进行统一的控制和管理。
>     - **全局访问：** 提供了一个方便的全局访问点。
> - **缺点：**
>     - **违反单一职责原则：** 一个类既要负责自己的业务逻辑，又要负责保证自己是单例的，职责不够单一。
>     - **扩展性差：** 通常没有接口，难以扩展。如果想用一个子类替换单例类，几乎是不可能的（除了饿汉式可以稍微变通）。
>     - **对测试不友好：** 因为是全局状态，所以测试用例之间可能会相互影响。
>     - **可能引起“上帝类”：** 由于全局可访问，容易导致开发者把过多的逻辑塞到单例类中，形成一个庞大而耦合严重的“上帝类”。
> 
> **如何选择？**
> 
> - **无所谓懒加载，且追求极致安全、简洁：** **枚举** 是首选。
> - **需要懒加载，且追求优雅、简洁、线程安全：** **静态内部类** 是最佳选择。
> - **需要熟悉经典思想和面试：** **双重检查锁定 (DCL)** 必须掌握。
> - **简单场景，不关心懒加载：** **饿汉式** 也完全够用。
> - **绝对不要使用线程不安全的懒汉式！**
> 
> ---
> 
> 至此，我们已经完整地学习了单例模式。从它的定义、应用场景，到六种不同的实现方式及其背后的原理和优缺点，都进行了详细的剖析。
> 
> 你感觉如何？有没有对某个实现方式特别感兴趣，或者对 `volatile` 关键字、类加载机制这些细节想更深入地了解一下？或者，你想不想讨论一下如何通过反射来“破解”单例模式，以及枚举是如何防御的？
> 
> 我们可以随时深入任何一个你感兴趣的点。如果你觉得已经掌握了，我们就可以准备进入下一个非常重要的模式——**工厂方法模式**了。

> [!note]+ **工厂方法模式 (Factory Method):** 将对象的创建过程延迟到子类。这是理解“依赖倒置”的绝佳案例。
> 从控制“谁是唯一”的单例模式，我们现在迈向一个更广阔的主题：如何“优雅地创建对象”。**工厂方法模式 (Factory Method Pattern)** 是创建型模式中的顶梁柱，它完美地诠释了我们之前学到的**开闭原则**和**依赖倒置原则**。
> 
> 让我们继续沿用学习闭环来掌握这个重要的招式。
> 
> ---
> 
> ### **招式二：工厂方法模式 (Factory Method Pattern)**
> 
> ### **1. 定义：它是什么？**
> 
> 工厂方法模式定义了一个**用于创建对象的接口（或抽象类）**，但让**子类决定实例化哪一个类**。它将对象的实例化过程延迟到了子类。
> 
> ![[image 170.png]]
> 
> 听起来有点抽象？我们把它翻译成大白话：
> 
> > 咱们开个店（比如咖啡店），店里有个核心工作，就是“制作咖啡”。但是，我们不把“具体制作哪种咖啡”的逻辑写死在店里。相反，我们只定下一个规矩：“每个分店都必须会制作咖啡”。至于A分店是专门做美式的，B分店是专门做拿铁的，由各个分店自己决定。
> 
> 在这个比喻中：
> 
> - **总店的规矩“每个分店都必须会制作咖啡”** -> 就是那个“用于创建对象的接口”。
> - **A分店、B分店** -> 就是“子类”。
> - **具体是做美式还是拿铁** -> 就是“实例化哪一个具体类”。
> 
> ### **2. 痛点：它解决了什么问题？**
> 
> 我们先来看一个没有使用工厂方法模式的糟糕设计。假设我们有个咖啡店，一开始只卖美式咖啡。
> 
> ```java
> // 产品
> class Americano {}
> 
> // 咖啡店 (客户端)
> class CoffeeStore {
>     // 强耦合：CoffeeStore直接依赖于具体的Americano类
>     public Americano orderCoffee() {
>         // 创建逻辑直接写在代码里
>         Americano coffee = new Americano();
>         // ...加糖、打包等操作...
>         return coffee;
>     }
> }
> 
> ```
> 
> 这看起来没问题。但现在，老板说：“我们要增加拿铁（Latte）！” 我们怎么办？最直接的想法是修改 `CoffeeStore`：
> 
> ```java
> // 产品
> class Americano {}
> class Latte {}
> 
> // 糟糕的设计：违反了开闭原则
> class CoffeeStore {
>     public Object orderCoffee(String type) {
>         if ("americano".equals(type)) {
>             return new Americano();
>         } else if ("latte".equals(type)) {
>             return new Latte();
>         }
>         // 如果要加卡布奇诺呢？又要修改这里！
>         // 这里的代码会随着产品的增加而无限膨胀，非常难以维护。
>         else {
>             throw new RuntimeException("Sorry, we don't sell this type of coffee.");
>         }
>     }
> }
> 
> ```
> 
> **痛点暴露无遗：**
> 
> 1. **违反了开闭原则 (OCP)：** 每增加一种新咖啡，我们都必须**修改** `CoffeeStore` 类的 `orderCoffee` 方法，这增加了引入错误的风险。
> 2. **违反了依赖倒置原则 (DIP)：** `CoffeeStore` 这个高层模块，直接依赖了 `Americano` 和 `Latte` 这些**具体实现**，而不是依赖抽象。
> 3. **职责不单一 (SRP)：** `CoffeeStore` 不仅要负责下单流程，还要负责具体创建哪种咖啡，职责混杂。
> 
> 工厂方法模式就是为了解决这些问题而生的。
> 
> ### **3. 结构与核心组件**
> 
> 工厂方法模式引入了四个核心角色：
> 
> 4. **Product (抽象产品)**：定义了工厂方法所创建的对象的接口。在我们的例子里，就是 `Coffee` 接口。
> 5. **ConcreteProduct (具体产品)**：实现了 `Product` 接口的具体类。例如 `Americano` 和 `Latte` 类。
> 6. **Creator (抽象工厂)**：声明了工厂方法 `createCoffee()`，其返回类型是 `Product`。它也可以定义一些通用的业务逻辑，这些逻辑会使用工厂方法创建出的产品。我们称之为 `CoffeeFactory`。
> 7. **ConcreteCreator (具体工厂)**：实现了 `Creator` 的抽象工厂方法，负责创建并返回一个具体的 `ConcreteProduct` 实例。例如 `AmericanoFactory` 和 `LatteFactory`。
> 
> ### **4. Java 代码实现 (咖啡店重构)**
> 
> 现在，我们用工厂方法模式来重构我们的咖啡店。
> 
> **第一步：定义抽象产品 (Product) 和具体产品 (ConcreteProduct)**
> 
> ```java
> // 1. 抽象产品：Coffee
> public interface Coffee {
>     String getName();
> }
> 
> // 2. 具体产品：Americano
> public class Americano implements Coffee {
>     @Override
>     public String getName() {
>         return "美式咖啡";
>     }
> }
> 
> // 2. 具体产品：Latte
> public class Latte implements Coffee {
>     @Override
>     public String getName() {
>         return "拿铁咖啡";
>     }
> }
> 
> ```
> 
> **第二步：定义抽象工厂 (Creator) 和具体工厂 (ConcreteCreator)**
> 
> ```java
> // 3. 抽象工厂：CoffeeFactory
> public abstract class CoffeeFactory {
> 
>     // 这是核心的工厂方法，留给子类实现
>     public abstract Coffee createCoffee();
> 
>     // 这里可以有通用的业务逻辑
>     public void takeOrder() {
>         Coffee coffee = createCoffee(); // 使用工厂方法创建产品
>         System.out.println("成功点了一杯: " + coffee.getName());
>         // ...可以有加糖、打包等通用操作
>     }
> }
> 
> // 4. 具体工厂：AmericanoFactory
> public class AmericanoFactory extends CoffeeFactory {
>     @Override
>     public Coffee createCoffee() {
>         // 只负责创建美式咖啡
>         return new Americano();
>     }
> }
> 
> // 4. 具体工厂：LatteFactory
> public class LatteFactory extends CoffeeFactory {
>     @Override
>     public Coffee createCoffee() {
>         // 只负责创建拿铁咖啡
>         return new Latte();
>     }
> }
> 
> ```
> 
> **第三步：客户端使用**
> 
> 客户端现在不再关心如何创建咖啡，而是选择使用哪个工厂。
> 
> ```java
> public class CoffeeShop {
>     public static void main(String[] args) {
>         System.out.println("--- 顾客想喝美式 ---");
>         // 我想要一个专门做美式的工厂
>         CoffeeFactory americanoFactory = new AmericanoFactory();
>         americanoFactory.takeOrder();
> 
>         System.out.println("\\n--- 另一位顾客想喝拿铁 ---");
>         // 我想要一个专门做拿铁的工厂
>         CoffeeFactory latteFactory = new LatteFactory();
>         latteFactory.takeOrder();
>     }
> }
> 
> // ---- 输出 ----
> // --- 顾客想喝美式 ---
> // 成功点了一杯: 美式咖啡
> //
> // --- 另一位顾客想喝拿铁 ---
> // 成功点了一杯: 拿铁咖啡
> 
> ```
> 
> **回头看，如果我们现在要增加“卡布奇诺 (Cappuccino)”呢？**
> 
> 我们只需要：
> 
> 8. 创建一个 `Cappuccino` 类实现 `Coffee` 接口。
> 9. 创建一个 `CappuccinoFactory` 类继承 `CoffeeFactory`，并实现 `createCoffee()` 方法返回 `new Cappuccino()`。
> 
> **全程无需修改任何已有的代码 (**`**CoffeeFactory**`**, **`**AmericanoFactory**`**, **`**LatteFactory**`**, **`**CoffeeShop**`**)！** 这就是**开闭原则**的完美体现。
> 
> ### **5. 优缺点分析**
> 
> - **优点：**
>     1. **优秀的解耦：** 客户端代码只依赖于抽象的 `Product` 和 `Creator`，完全不知道具体的实现类是什么，符合**依赖倒置原则**。
>     2. **遵循开闭原则：** 增加新产品时，只需要增加对应的具体产品类和具体工厂类即可，无需修改现有代码，系统的可扩展性极佳。
>     3. **职责更单一：** 创建对象的具体逻辑被封装在各个具体工厂中，使得代码结构更清晰。
> - **缺点：**
>     1. **类的数量会增多：** 每增加一个产品，就需要增加一个对应的具体工厂类。这在一定程度上增加了系统的复杂度和代码量。如果产品种类非常多，会导致类的数量爆炸。
> 
> ### **与“简单工厂模式”的对比**
> 
> 你可能听说过一个叫“简单工厂”（或静态工厂）的模式，它就是我们最开始那个用 `if-else` 或 `switch` 的 `CoffeeStore` 的变种，只是把 `if-else` 逻辑单独抽到一个静态方法里。
> 
> - **简单工厂：** 用一个工厂类，根据传入的参数，通过 `if-else`/`switch` 来决定创建哪个产品。**它不属于 GoF 23 种设计模式**，因为它违反了开闭原则。
> - **工厂方法：** **将创建逻辑延迟到子类**，每个子类工厂负责一个产品的创建，遵循开闭原则。
> 
> **工厂方法模式是对简单工厂模式的“开闭原则”修复版。**
> 
> ---
> 
> **总结与思考：**
> 
> 工厂方法模式的核心在于“**延迟实例化到子类**”。它不是给你一个万能的工厂，而是给你一套“建工厂的规范”。你想要什么产品，就建一个对应的“专职工厂”。
> 
> 这个模式在很多框架和库中都有应用，例如：
> 
> - `java.util.Collection` 接口中的 `iterator()` 方法。`ArrayList` 和 `LinkedList` 都实现了这个接口，但它们各自返回的 `Iterator` 实现是不同的。这里的 `iterator()` 就是一个工厂方法。
> - 各种日志框架（如 Log4j、SLF4J）中获取 Logger 实例的过程也体现了工厂方法的思想。
> 
> 现在，你对工厂方法模式的理解如何？你是否清楚地看到了它是如何应用开闭原则来解决“烂代码”的痛点？或者你对“类的数量增多”这个缺点有什么看法，觉得在什么情况下可以接受？
> 
> 准备好了的话，我们的下一站将是工厂模式的“升级版”——**抽象工厂模式 (Abstract Factory Pattern)**，它将处理更复杂的产品创建问题。

> [!note]+ **抽象工厂模式 (Abstract Factory):** 创建一系列相关的对象，而无需指定其具体类。
> 非常好！我们现在来攀登工厂模式的更高峰——**抽象工厂模式 (Abstract Factory Pattern)**。
> 
> 如果说工厂方法模式是为每个产品建立一个“专卖店”（如美式咖啡专卖店、拿铁咖啡专卖店），那么抽象工厂模式就是建立一个“**品牌主题店**”（如“意式风情店”、“美式休闲店”）。在“意式风情店”里，你不仅能买到拿铁，还能买到配套的提拉米苏；在“美式休闲店”里，你能买到美式咖啡和配套的布朗尼。
> 
> 这个模式的关键在于**创建一系列相互关联或相互依赖的对象**，而无需指定它们具体的类。
> 
> ---
> 
> ### **招式三：抽象工厂模式 (Abstract Factory Pattern)**
> 
> ### **1. 定义：它是什么？**
> 
> ![[image 171.png]]
> 
> 抽象工厂模式提供一个接口，用于创建**一系列相关或依赖对象的家族**，而无需指定它们的具体类。
> 
> - **“一系列对象” / “产品家族 (Product Family)”**：这是与工厂方法模式最核心的区别。工厂方法的目标是创建**一个**产品，而抽象工厂的目标是创建**一组**产品。
> - **“相关或依赖”**：这组产品必须是相互兼容、配套使用的。比如，Windows 风格的按钮和 Windows 风格的文本框，它们属于同一个“Windows UI”家族。
> 
> ### **2. 痛点：它解决了什么问题？**
> 
> 我们继续咖啡店的例子。使用工厂方法模式后，我们的店可以灵活地增加新的咖啡种类。现在，老板有了新需求：“为了提升顾客体验，我们不光卖咖啡，还要卖配套的甜点！而且要有主题套餐，比如‘美式休闲套餐’（美式咖啡+布朗尼）和‘意式风情套餐’（拿铁+提拉米苏）。”
> 
> 如果我们继续用工厂方法模式，可能会这样做：
> 
> - 一个 `CoffeeFactory` 体系（`AmericanoFactory`, `LatteFactory`...）
> - 一个 `DessertFactory` 体系（`BrownieFactory`, `TiramisuFactory`...）
> 
> 客户端（店员）在点单时，需要自己去组合：
> 
> ```java
> // 客户端需要知道哪个配哪个，非常容易出错
> CoffeeFactory coffeeFactory = new AmericanoFactory();
> DessertFactory dessertFactory = new TiramisuFactory(); // Oops! 风格不匹配！
> Coffee coffee = coffeeFactory.createCoffee();
> Dessert dessert = dessertFactory.createDessert();
> 
> ```
> 
> **痛点显而易见：**
> 
> 1. **客户端职责过重：** 客户端必须知道哪种咖啡要搭配哪种甜点，这种产品间的“兼容性”逻辑暴露给了客户端，增加了复杂性和出错的可能。
> 2. **无法保证产品家族的一致性：** 无法从机制上保证创建出来的产品属于同一个“风格”或“主题”。
> 
> 抽象工厂模式正是为了解决这个问题：**将配套产品的创建逻辑捆绑在一起，交给一个专门的“主题工厂”来负责**，客户端只需要选择主题，就能得到一整套互相兼容的产品。
> 
> ### **3. 结构与核心组件**
> 
> 抽象工厂模式的结构比工厂方法更复杂一些，因为它涉及多个产品等级结构。
> 
> 3. **AbstractFactory (抽象工厂)**：声明了一组用于创建不同抽象产品的方法。在我们的例子里，就是 `CuisineFactory`，它有 `createCoffee()` 和 `createDessert()` 两个方法。
> 4. **ConcreteFactory (具体工厂)**：实现了抽象工厂的接口，负责创建属于同一个产品家族的具体产品。例如 `AmericanStyleFactory` 和 `ItalianStyleFactory`。
> 5. **AbstractProduct (抽象产品)**：为产品家族中的每一种产品定义接口。我们有两个抽象产品：`Coffee` 和 `Dessert`。
> 6. **ConcreteProduct (具体产品)**：实现了抽象产品的接口，是具体工厂创建的目标。例如 `Americano`, `Latte`, `Brownie`, `Tiramisu`。
> 
> *(这个UML图清晰地展示了两个平行的继承体系：工厂体系和产品体系)*
> 
> ### **4. Java 代码实现 (主题套餐咖啡店)**
> 
> **第一步：定义多个抽象产品和它们各自的具体实现**
> 
> ```java
> // 抽象产品族：咖啡和甜点
> // 抽象产品 A: Coffee
> interface Coffee {
>     String getName();
> }
> 
> // 抽象产品 B: Dessert
> interface Dessert {
>     void show();
> }
> 
> // --- 具体产品 ---
> // 具体产品 A1: Americano
> class Americano implements Coffee {
>     public String getName() { return "美式咖啡"; }
> }
> 
> // 具体产品 A2: Latte
> class Latte implements Coffee {
>     public String getName() { return "拿铁咖啡"; }
> }
> 
> // 具体产品 B1: Brownie
> class Brownie implements Dessert {
>     public void show() { System.out.println("一份布朗尼"); }
> }
> 
> // 具体产品 B2: Tiramisu
> class Tiramisu implements Dessert {
>     public void show() { System.out.println("一份提拉米苏"); }
> }
> 
> ```
> 
> **第二步：定义抽象工厂和具体工厂**
> 
> ```java
> // 1. 抽象工厂：定义了要创建的产品家族
> public interface CuisineFactory {
>     Coffee createCoffee();
>     Dessert createDessert();
> }
> 
> // 2. 具体工厂 A：美式风情工厂
> public class AmericanStyleFactory implements CuisineFactory {
>     @Override
>     public Coffee createCoffee() {
>         return new Americano(); // 生产美式咖啡
>     }
>     @Override
>     public Dessert createDessert() {
>         return new Brownie(); // 生产布朗尼
>     }
> }
> 
> // 2. 具体工厂 B：意式风情工厂
> public class ItalianStyleFactory implements CuisineFactory {
>     @Override
>     public Coffee createCoffee() {
>         return new Latte(); // 生产拿铁
>     }
>     @Override
>     public Dessert createDessert() {
>         return new Tiramisu(); // 生产提拉米苏
>     }
> }
> 
> ```
> 
> **第三步：客户端使用**
> 
> 客户端现在变得非常简单，它只需要选择一个“主题”，然后向这个主题工厂索要产品即可。
> 
> ```java
> public class ThemedCoffeeShop {
>     public static void orderMenu(CuisineFactory factory) {
>         Coffee coffee = factory.createCoffee();
>         Dessert dessert = factory.createDessert();
> 
>         System.out.println("感谢惠顾！您的套餐是：");
>         System.out.println("饮品: " + coffee.getName());
>         System.out.print("甜点: ");
>         dessert.show();
>     }
> 
>     public static void main(String[] args) {
>         System.out.println("--- 顾客A想要美式套餐 ---");
>         // 客户端只需要选择一个工厂，就保证了产品的一致性
>         orderMenu(new AmericanStyleFactory());
> 
>         System.out.println("\\n--- 顾客B想要意式套餐 ---");
>         orderMenu(new ItalianStyleFactory());
>     }
> }
> 
> // ---- 输出 ----
> // --- 顾客A想要美式套餐 ---
> // 感谢惠顾！您的套餐是：
> // 饮品: 美式咖啡
> // 甜点: 一份布朗尼
> //
> // --- 顾客B想要意式套餐 ---
> // 感谢惠顾！您的套餐是：
> // 饮品: 拿铁咖啡
> // 甜点: 一份提拉米苏
> 
> ```
> 
> 看到客户端代码的变化了吗？它完全与 `Americano`, `Latte`, `Brownie`, `Tiramisu`这些具体类解耦了。它甚至与 `AmericanStyleFactory` 和 `ItalianStyleFactory` 也解耦了（通过参数传入）。这就是**依赖倒置原则**的威力。
> 
> ### **5. 优缺点分析**
> 
> - **优点：**
>     1. **极佳的隔离性：** 客户端与具体产品的实现细节完全隔离。
>     2. **保证产品兼容性：** 切换整个产品家族变得非常容易。只需要改变具体工厂的实例，就能获得一套完全不同但内部兼容的产品。
>     3. **高内聚，低耦合：** 相关的产品创建逻辑被集中在一个工厂里，使得代码更加内聚，也更容易管理。
> - **缺点：**
>     1. **难以扩展新的产品种类 (违反开闭原则)：** 这是抽象工厂模式最主要的缺点。如果我们想在所有套餐里都增加一个“小食（Snack）”，那就必须修改 `CuisineFactory` 抽象工厂的接口，增加 `createSnack()` 方法。这会导致所有已有的具体工厂类（`AmericanStyleFactory`, `ItalianStyleFactory`等）都需要进行修改，这严重违反了开闭原则。
>     2. **系统复杂度增加：** 需要引入大量的接口和类，对于简单的系统来说，可能会显得过于笨重。
> 
> **简单总结优缺点：抽象工厂模式对于“增加新的产品家族”是开放的，但对于“给产品家族增加新的产品种类”是关闭的。**
> 
> ---
> 
> ### **工厂方法 vs. 抽象工厂：一图胜千言**
> 
> | 对比维度 | **工厂方法模式 (Factory Method)** | **抽象工厂模式 (Abstract Factory)** |
> | --- | --- | --- |
> | **解决问题** | 创建**单一**产品，解耦产品创建与使用。 | 创建**一族**相关的产品，保证产品间的兼容性。 |
> | **核心** | “建工厂的规范”，将实例化**延迟到子类**。 | “品牌主题店”，提供一个接口创建**产品家族**。 |
> | **产品层级** | 通常只有一个抽象产品等级结构。 | 有多个抽象产品等级结构。 |
> | **例子** | `CoffeeFactory` -> `createCoffee()` | `CuisineFactory` -> `createCoffee()`, `createDessert()` |
> | **优点** | 扩展新产品很容易（遵循OCP）。 | 扩展新产品家族很容易（遵循OCP）。 |
> | **缺点** | 如果产品族多，工厂类会很多。 | 扩展新产品种类很困难（违反OCP）。 |
> 
> 至此，创建型模式中最重要的三个模式：**单例、工厂方法、抽象工厂**，我们都已经深入学习完毕。它们的核心都是围绕“如何更好地创建对象”来展开的。
> 
> 你现在能清晰地分辨出工厂方法和抽象工厂的使用场景和它们各自的权衡了吗？特别是抽象工厂“难以扩展新产品种类”的这个缺点，你有什么想法？
> 
> 如果你已经准备好了，我们可以切换一下思路，从“如何创建对象”进入到“如何组合对象和类，形成更大的结构”，开始学习**结构型模式**，比如非常实用的**适配器模式 (Adapter Pattern)** 或 **装饰者模式 (Decorator Pattern)**。

> [!note]+ **建造者模式 (Builder):** 将一个复杂对象的构建与其表示分离。解决构造函数参数过多的问题。


> [!note]+ **原型模式 (Prototype):** 通过复制现有实例来创建新实例。


**B. 结构型模式 (Structural Patterns) - 关注类与对象的组合**

- **学习顺序建议：**
    1. **适配器模式 (Adapter):** “转换插头”，让不兼容的接口能够协同工作。非常实用。
    2. **装饰者模式 (Decorator):** 动态地给一个对象添加一些额外的职责。比继承更灵活。Java IO 流中大量使用。
    3. **代理模式 (Proxy):** 为其他对象提供一种代理以控制对这个对象的访问。Spring AOP 的核心。
    4. **外观模式 (Facade):** 为子系统中的一组接口提供一个统一的界面。简化复杂系统的使用。
    5. **组合模式 (Composite):** 将对象组合成树形结构以表示“部分-整体”的层次结构。
    6. **桥接模式 (Bridge):** 将抽象部分与它的实现部分分离，使它们都可以独立地变化。
    7. **享元模式 (Flyweight):** 运用共享技术有效地支持大量细粒度的对象。用于性能优化。

**C. 行为型模式 (Behavioral Patterns) - 关注对象间的通信与职责分配**

- **学习顺序建议：**
    1. **策略模式 (Strategy):** 定义一系列算法，并将每一个算法封装起来，使它们可以相互替换。
    2. **观察者模式 (Observer):** 定义对象间的一种一对多的依赖关系，当一个对象的状态发生改变时，所有依赖于它的对象都得到通知并被自动更新。
    3. **模板方法模式 (Template Method):** 在一个方法中定义一个算法的骨架，而将一些步骤延迟到子类中。
    4. **责任链模式 (Chain of Responsibility):** 为请求创建了一个接收者对象的链。
    5. **命令模式 (Command):** 将一个请求封装为一个对象，从而使你可用不同的请求对客户进行参数化。
    6. **迭代器模式 (Iterator):** 提供一种方法顺序访问一个聚合对象中各个元素，而又不暴露该对象的内部表示。
    7. **状态模式 (State):** 允许一个对象在其内部状态改变时改变它的行为。
    8. **中介者模式 (Mediator):** 用一个中介对象来封装一系列的对象交互。
    9. **备忘录模式 (Memento):** 在不破坏封装性的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态。

---

## 相关笔记

- [[C++设计模式]] — 侯捷 C++ 设计模式课程
- [[《GoF书》]] — GoF 原书阅读笔记
- [[代码随想录&leetcode]] — 算法练习中设计模式的应用
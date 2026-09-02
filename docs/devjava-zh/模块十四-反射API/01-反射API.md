# 反射 API（The Reflection API）

> 来源：Oracle 官方 [Dev.java 教程](https://dev.java/learn/) →《The Reflection API》
> 忠实还原官方板块结构（检索类/读类名/读修饰符/字段/方法/构造器/数组/枚举/记录/读注解/拦截器示例/依赖注入示例）。框架底层（Spring、MyBatis、JUnit、Jackson）的基石，后端面试高频。

## 一、反射是什么？（Why Reflection）

**反射（reflection）** 指程序在运行时**检查或修改运行在 JVM 中的应用行为**的能力。它是相对高级的特性，适合对语言基础有扎实掌握的人使用。尽管如此，反射是强大技术，能让应用执行原本不可能的操作。

> **一句话**：程序在运行期"看到"并"操作"自身的类、方法、字段——这正是 DI 容器、ORM、序列化库能"魔法般"工作的原因。

---

## 二、检索类（Retrieving Classes）

从名称或对象获取 `Class` 实例（含数组和基本类型）：

```java
// 1. 类字面量
Class<String> c1 = String.class;

// 2. 对象.getClass()
String s = "hello";
Class<?> c2 = s.getClass();

// 3. Class.forName(类名)
Class<?> c3 = Class.forName("java.lang.String");   // 可能抛 ClassNotFoundException

// 4. 基本类型与包装类
Class<Integer> c4 = int.class;
Class<Integer> c5 = Integer.TYPE;                  // 同为 int.class

// 5. 数组类型
Class<?> c6 = String[].class;
```

---

## 三、读类名（Reading Class Names）

读取类的名称，含数组和基本类型：

```java
Class<?> c = String.class;
System.out.println(c.getName());       // java.lang.String（全限定名）
System.out.println(c.getSimpleName()); // String（简单名）

// 数组类名带 [ 前缀（JVM 内部表示）
System.out.println(String[].class.getName());  // [Ljava.lang.String;
```

> 面试点：`getName()` 返回 JVM 内部名（数组带 `[`），`getSimpleName()` 返回源码中的简单名。基本类型的 `getName()` 返回 `int`、`double` 等关键字。

---

## 四、读修饰符（Reading Modifiers）

发现类或其任何成员（字段、方法、构造器）的修饰符：

```java
// 用 Modifier 类判断
int mods = MyClass.class.getModifiers();
System.out.println(Modifier.isPublic(mods));    // true
System.out.println(Modifier.isAbstract(mods));  // false

// 字段/方法的修饰符同理
Field f = MyClass.class.getDeclaredField("name");
int fMods = f.getModifiers();
System.out.println(Modifier.isPrivate(fMods));  // true
```

---

## 五、读写字段（Reading and Writing Fields）

字段有类型，且对给定对象有一个关联值。`Field` 类的方法可获取字段信息（名称、类型、修饰符、注解），也有方法**动态访问和修改字段值**：

```java
public class MyClass {
    private String name;
    public int age;
}

// 读取字段信息
Field nameField = MyClass.class.getDeclaredField("name");
String fName = nameField.getName();             // "name"
Class<?> fType = nameField.getType();           // String.class
int fMods = nameField.getModifiers();

// 动态访问/修改（绕过访问控制）
MyClass obj = new MyClass();
nameField.setAccessible(true);                   // 允许访问 private
Object val = nameField.get(obj);                 // 读取值
nameField.set(obj, "张三");                      // 修改值
```

> **面试高频**：`setAccessible(true)` 的作用（打破封装访问 private）、反射性能开销、Spring/Jackson 是如何用反射读取/填充字段的。

---

## 六、调用方法（Invoking Methods）

方法包含可执行的代码，可被调用。**反射代码使方法选择可限定到某个特定类而不考虑其父类**——父类方法仍可访问，但能确定其声明类，这在非反射代码中无法编程发现，是很多隐蔽 bug 的来源。

```java
Method m = MyClass.class.getMethod("greet", String.class);
Object result = m.invoke(obj, "世界");   // 调用 greet("世界")，返回结果

// 带参数类型获取
Method m2 = MyClass.class.getDeclaredMethod("privateMethod");
m2.setAccessible(true);
m2.invoke(obj);
```

> 面试点：`getMethod`（含继承的 public）vs `getDeclaredMethod`（仅本类声明，含 private）。

---

## 七、调用构造器（Invoking Constructors）

构造器用于创建类的实例对象，通常在方法调用或字段访问前执行初始化。**构造器从不被继承**。反射可动态创建实例：

```java
Constructor<MyClass> ctor = MyClass.class.getConstructor(int.class, String.class);
MyClass obj = ctor.newInstance(25, "李四");

// 默认构造器
MyClass obj2 = MyClass.class.getDeclaredConstructor().newInstance();
```

> 面试点：反射调用构造器与 `new` 的区别、`newInstance()`（已被 `getDeclaredConstructor().newInstance()` 取代）的坑、JUnit 和框架如何用反射实例化测试对象。

---

## 八、操作数组（Working with Arrays）

数组是引用类型对象，包含固定数量、同类型的组件；长度不可变。创建数组实例需要知道**长度和组件类型**。组件可为基本类型、引用类型或数组。**多维数组本质是组件为数组类型的数组**。

```java
// 用反射创建数组并读写
Class<?> arrClass = Class.forName("[Ljava.lang.String;");  // String[] 的 Class
Object array = java.lang.reflect.Array.newInstance(String.class, 3);
Array.set(array, 0, "a");
Array.set(array, 1, "b");
Object first = Array.get(array, 0);   // "a"
```

---

## 九、操作枚举（Working with Enumerations）

枚举用于定义类型安全的枚举，当需要固定命名值集合时使用。所有枚举隐式继承 `java.lang.Enum`。枚举可含一个或多个**枚举常量**，定义枚举类型的唯一实例。**枚举声明与类很相似**，可含字段、方法、构造器（有一定限制）。

```java
enum Day { MONDAY, TUESDAY, WEDNESDAY }

// 反射读取枚举常量
Class<?> dayClass = Day.class;
Object[] constants = dayClass.getEnumConstants();
System.out.println(constants[0]);   // MONDAY
```

---

## 十、操作记录（Working with Records）

识别记录类型、获取其组件信息、访问其字段：

```java
record Point(int x, int y) {}

Class<?> rc = Point.class;
System.out.println(rc.isRecord());                       // true
RecordComponent[] comps = rc.getRecordComponents();      // [x, y]
for (RecordComponent rc2 : comps) {
    System.out.println(rc2.getName() + ": " + rc2.getType());
}
```

---

## 十一、读注解（Reading Annotations）

发现类元素和类型上的注解（配合模块十注解使用）：

```java
@Retention(RetentionPolicy.RUNTIME)
@interface MyAnno { String value(); }

@MyAnno("测试")
class Annotated {}

Annotated annotation = Annotated.class.getAnnotation(MyAnno.class);
System.out.println(annotation.value());   // "测试"

// 读取方法/字段上的注解
Method m = Annotated.class.getMethod("someMethod");
MyAnno ma = m.getAnnotation(MyAnno.class);
```

> **核心面试点**：只有 `@Retention(RUNTIME)` 的注解才能被反射读取——这是 Spring 能扫描 `@Component`、MyBatis 能读 `@Param` 的前提。

---

## 十二、示例：用注解创建拦截器（Interceptor）

本节带你用注解 + 反射 API 为一个服务方法创建简单拦截器：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Log { }

class Service {
    @Log
    public void handle() { System.out.println("业务逻辑"); }
}

class Interceptor {
    static void invoke(Object obj, Method m) {
        if (m.isAnnotationPresent(Log.class))
            System.out.println("[拦截器] 前置日志");
        m.invoke(obj);
        if (m.isAnnotationPresent(Log.class))
            System.out.println("[拦截器] 后置日志");
    }
}
```

---

## 十三、示例：创建依赖注入框架（Dependency Injection Framework）

**经典面试题**：如何用反射实现一个简易 DI 框架？（Spring 的核心思想）

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Inject { }

class A { 
    @Inject B b;    // 注入 B
    public void run() { b.work(); }
}
class B { public void work() { System.out.println("B 执行"); } }

class SimpleDI {
    static <T> T create(Class<T> cls) throws Exception {
        T obj = cls.getDeclaredConstructor().newInstance();
        for (Field f : cls.getDeclaredFields()) {
            if (f.isAnnotationPresent(Inject.class)) {
                f.setAccessible(true);
                f.set(obj, create(f.getType()));   // 递归注入依赖
            }
        }
        return obj;
    }
}

// 使用
A a = SimpleDI.create(A.class);
a.run();   // 自动注入 B 并执行
```

> **面试高频**：反射 = DI 框架底层。Spring 的 `@Autowired` 本质是：扫描带注解字段 → 反射 `field.set(obj, bean)`。理解这个示例，你就理解了 Spring IoC 的核心机制。

---

## 核心速查表

| 主题 | 关键类/方法 | 要点 |
|------|------------|------|
| 获取 Class | `String.class` / `obj.getClass()` / `Class.forName()` | 三种方式 |
| 读类名 | `getName()` / `getSimpleName()` | 全限定 vs 简单名，数组带 `[` |
| 读修饰符 | `Class.getModifiers()` + `Modifier.isXxx()` | 判断 public/abstract 等 |
| 读字段 | `Field.getName/getType/getModifiers` | 字段元信息 |
| 写字段 | `field.setAccessible(true)` + `field.set(obj, val)` | 打破封装，动态赋值 |
| 调方法 | `Class.getMethod(name, args).invoke(obj, args)` | 反射调用 |
| 调构造器 | `getConstructor(...).newInstance(...)` | 动态创建实例 |
| 操作数组 | `Array.newInstance/get/set` | 动态数组 |
| 操作枚举 | `getEnumConstants()` | 枚举常量 |
| 操作记录 | `isRecord()` / `getRecordComponents()` | record 组件 |
| 读注解 | `getAnnotation(Class)` | 需 `@Retention(RUNTIME)` |
| DI 框架 | 扫描注解字段 + 递归反射注入 | Spring IoC 核心原理 |

> **面试高频**：`setAccessible` 原理与性能、`getMethod` vs `getDeclaredMethod`、反射读取注解需 RUNTIME 保留、反射是 Spring DI / MyBatis / Jackson 底层、反射性能开销（可用 MethodHandle 优化，Java 7+）。

*最后更新：2021 年 9 月 14 日（官方）*

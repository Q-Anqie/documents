# 新特性：Records 与模式匹配

> 来源：Oracle 官方 [Dev.java 教程](https://dev.java/learn/) →《Records》《Pattern Matching》
> 忠实翻译，保留全部代码示例与官方配图（官方本模块无内容图，采用纯文代码示例）。

本模块聚焦 Java 近几版最重要的两个语言特性：**Record（记录类，Java 16 正式）** 和 **模式匹配（pattern matching，Java 16 起逐步完善）**。这些是后端开发高频使用的新语法，也是面试常考的新特性。

---

## 一、Record（记录类）

### 为什么要用 Record？

在 Java 里，写一个只承载数据的类（如 DTO、VO、POJO），通常需要手写构造器、`getter`、`equals`、`hashCode`、`toString`——大量模板代码（boilerplate）。

**Record 是一种专门为「不可变数据载体」设计的类**，只需声明字段，编译器自动生成：

- **构造器**（含参数校验机会）
- **访问器方法**（`accessor`，即 `getter`）
- `equals()`、`hashCode()`、`toString()`

### 定义 Record

```java
public record Point(int x, int y) { }
```

这一行就生成了一个不可变的二维点类，包含：

- 构造器：`new Point(3, 4)`
- 访问器：`point.x()`、`point.y()`（注意：没有 `getX()`，而是 `x()`）
- `equals`/`hashCode`/`toString`

```java
Point p1 = new Point(3, 4);
Point p2 = new Point(3, 4);
System.out.println(p1.x());            // 3
System.out.println(p1.equals(p2));     // true（按组件比较）
System.out.println(p1);                // Point[x=3, y=4]（自动 toString）
```

### 多组件的 Record

```java
public record Person(String name, int age, String email) { }

Person p = new Person("Alice", 30, "alice@example.com");
System.out.println(p.name());   // "Alice"
System.out.println(p.age());    // 30
```

### 自定义 Record 组件

可以添加构造器（用**紧凑构造器** compact constructor 做校验）、静态方法、实例方法。

**紧凑构造器（compact constructor）**——在 `{}` 里写校验逻辑，无需重新赋值：

```java
public record Person(String name, int age) {
    // 紧凑构造器：编译后参数校验
    public Person {
        if (age < 0) {
            throw new IllegalArgumentException("年龄不能为负数: " + age);
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("姓名不能为空");
        }
    }

    // 可以添加额外方法
    public String greeting() {
        return "Hello, " + name;
    }
}
```

### Record 的限制

| 限制 | 说明 |
|------|------|
| 隐式 final | Record 类本身就是 final，不能被继承 |
| 不可变 | 组件字段是 final，不能修改 |
| 不能有实例字段 | 除声明的组件外，不能声明其他实例字段 |
| 可加静态成员 | 可以加静态字段、静态方法 |
| 可实现接口 | 可以实现接口 |
| 继承 Object | 不能显式 extends 其他类（record 已隐式 extends Object） |

### Record 实现接口

```java
public interface Shape {
    double area();
}

public record Circle(double radius) implements Shape {
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}
```

### Record 与模式匹配结合（最常用）

Record 常用于**模式匹配的解构**（见下文）：

```java
Object obj = new Person("Alice", 30);

if (obj instanceof Person person) {
    System.out.println(person.name() + ", " + person.age());
}
```

---

## 二、模式匹配（Pattern Matching）

**模式匹配是一种让程序检查对象的结构、并安全地提取其中数据的能力。** Java 从 `instanceof` 模式匹配开始（Java 16），逐步扩展到 `switch` 模式匹配（Java 21 正式）。

### 1. instanceof 模式匹配（Java 16 正式）

**旧写法**：`instanceof` 检查后必须强转。

```java
// 旧写法
Object obj = "hello";
if (obj instanceof String) {
    String s = (String) obj;     // 必须强转
    System.out.println(s.length());
}
```

**新写法**：`instanceof` 模式匹配，无需强转，直接绑定变量。

```java
// 新写法
Object obj = "hello";
if (obj instanceof String s) {
    System.out.println(s.length());   // 直接使用绑定的变量 s
}
```

**好处**：消除了冗余的强转，更安全、更简洁。

### 2. 模式变量绑定

模式匹配可以绑定变量，并配合逻辑运算。

```java
Object obj = ...;

if (obj instanceof String s && s.length() > 5) {
    System.out.println("长字符串: " + s);
}

// 注意：|| 中变量不能跨分支使用，但 && 可以
if (obj instanceof String s || obj instanceof Integer i) { }
```

### 3. switch 模式匹配（Java 21 正式）

**旧 switch**：只能匹配整数/字符串/枚举常量，无类型检查。

**新 switch**（Java 21）：可以匹配**类型模式**，并支持 `null`、守卫条件。

```java
// Java 21 正式：switch 模式匹配
String describe(Object obj) {
    return switch (obj) {
        case Integer i   -> "整数: " + i;
        case String s    -> "字符串长度: " + s.length();
        case int[] arr   -> "数组长度: " + arr.length;
        case null        -> "null 值";
        default          -> "未知类型";
    };
}
```

### 4. 记录解构模式（Record Deconstruction Patterns）

**把 Record 的解构与 switch 模式匹配结合**，可直接解开 Record 的组件：

```java
record Point(int x, int y) { }

String where(Object obj) {
    return switch (obj) {
        case Point(int x, int y) -> "坐标(" + x + ", " + y + ")";
        case String s -> "字符串: " + s;
        default -> "未知";
    };
}
```

这里 `case Point(int x, int y)` 直接把 `Point` 解构成 `x`、`y` 两个变量。

### 5. 守卫条件（Guard Patterns）

在 `switch` 模式匹配中，可以用 `when` 添加额外条件：

```java
String describe(Integer n) {
    return switch (n) {
        case Integer i when i > 0 -> "正数: " + i;
        case Integer i when i < 0 -> "负数: " + i;
        default -> "零";
    };
}
```

---

## 三、Record + 模式匹配完整示例

```java
// 一个简单的表达式计算器（用 Record + 模式匹配）
public sealed interface Expr permits Add, Mul, Num { }

record Num(int n) implements Expr { }
record Add(Expr left, Expr right) implements Expr { }
record Mul(Expr left, Expr right) implements Expr { }

public class Calculator {
    // 用模式匹配计算表达式
    static int eval(Expr e) {
        return switch (e) {
            case Num(int n) -> n;
            case Add(Expr l, Expr r) -> eval(l) + eval(r);
            case Mul(Expr l, Expr r) -> eval(l) * eval(r);
        };
    }

    public static void main(String[] args) {
        // (1 + 2) * 3 = 9
        Expr expr = new Mul(new Add(new Num(1), new Num(2)), new Num(3));
        System.out.println(eval(expr));   // 9
    }
}
```

> **注**：`sealed` 修饰的接口限制可直接实现的子类（`permits` 列出），让 `switch` 模式匹配能穷尽检查（不需要 `default` 分支）。这是与 Record、模式匹配配套的重要新特性。

---

## 四、新特性速查表

| 特性 | 版本 | 说明 | 示例 |
|------|------|------|------|
| `instanceof` 模式匹配 | Java 16 正式 | 免强转，绑定变量 | `if (obj instanceof String s)` |
| Record | Java 16 正式 | 不可变数据载体 | `record Point(int x, int y)` |
| 密封类（sealed） | Java 17 正式 | 限制子类，配合 switch 穷尽 | `sealed interface Expr permits ...` |
| switch 模式匹配 | Java 21 正式 | 匹配类型、null、守卫 | `case String s -> ...` |
| 记录解构模式 | Java 21 | 解开 Record 组件 | `case Point(int x, int y)` |
| 守卫条件 | Java 21 | `when` 加条件 | `case Integer i when i > 0` |
| 文本块 | Java 15 正式 | 多行字符串 | `""" ... """` |
| var | Java 10 正式 | 局部类型推断 | `var list = new ArrayList<>()` |

---

## 核心速查表

| 主题 | 关键点 |
|------|--------|
| Record | 不可变数据载体，自动生成构造器/访问器/equals/hashCode/toString |
| Record 访问器 | `record Point(int x, int y)` 用 `point.x()`（非 getX） |
| 紧凑构造器 | `public Point { ... }` 做参数校验 |
| Record 限制 | final、不可变、无其他实例字段、不能继承类 |
| instanceof 模式匹配 | 免强转，`if (obj instanceof String s)` |
| switch 模式匹配 | Java 21，匹配类型/null/守卫，配合密封类穷尽 |
| 记录解构模式 | `case Point(int x, int y)` 解开组件 |
| 密封类 | `sealed ... permits ...`，限定子类，配合模式匹配 |
| 守卫条件 | `case Integer i when i > 0` |

> **面试高频**：Record 与普通类的区别、Record 自动生成哪些方法、紧凑构造器校验、为何 Record 不可变（final 组件）、`instanceof` 模式匹配免强转的好处、switch 模式匹配 + 密封类如何实现穷尽检查、记录解构模式。

*最后更新：2021 年 9 月 14 日（官方）*

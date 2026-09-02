# Java 语言基础：Switch 语句与 Switch 表达式

> 来源：Oracle 官方 [Dev.java 教程](https://dev.java/learn/) ·《Java Language Basics》模块
> 本文件为忠实中文翻译，保留全部代码示例。

---

## 一、用 switch 语句控制程序流

`switch` 语句是 Java 语言的**五种控制流语句之一**，允许任意数量的执行路径。它接收一个**选择变量（selector variable）**作为参数，用它来选择要执行的路径。

### 选择变量的允许类型
- `byte`、`short`、`char`、`int` 基本类型；
- `Character`、`Byte`、`Short`、`Integer` 包装类型；
- 枚举类型（enumerated types）；
- `String` 类型。

**不能用于选择变量的类型**：`boolean`、`long`、`float`、`double`。

### 第一个 switch 示例

```java
public class SwitchDemo {
    public static void main(String[] args) {
        int month = 8;
        String monthString;
        switch (month) {
            case 1:  monthString = "January"; break;
            case 2:  monthString = "February"; break;
            case 3:  monthString = "March"; break;
            case 4:  monthString = "April"; break;
            case 5:  monthString = "May"; break;
            case 6:  monthString = "June"; break;
            case 7:  monthString = "July"; break;
            case 8:  monthString = "August"; break;
            case 9:  monthString = "September"; break;
            case 10: monthString = "October"; break;
            case 11: monthString = "November"; break;
            case 12: monthString = "December"; break;
            default: monthString = "Invalid month"; break;
        }
        System.out.println(monthString);   // 输出 August
    }
}
```

`switch` 语句的主体叫 **switch 块**。块中的语句可以带一个或多个 `case` 或 `default` 标签。`switch` 先求值其表达式，然后执行**匹配的 case 标签之后的所有语句**。

### 关于 break 关键字
你注意到 `break` 的使用。每个 `break` 终止外层 switch 语句，控制流继续到 switch 块之后的**第一条语句**。**`break` 是必需的**，因为没有它们，switch 块里的语句会**穿透（fall through）**——匹配的 case 标签之后的所有语句会依序执行，无论后续 case 标签的表达式是什么，直到遇到 `break`。

利用穿透，下面的代码用 `fall through` 填充 `futureMonths` 列表：

```java
public class SwitchDemoFallThrough {
    public static void main(String[] args) {
        java.util.ArrayList<String> futureMonths = new java.util.ArrayList<>();
        int month = 8;
        switch (month) {
            case 1:  futureMonths.add("January");
            case 2:  futureMonths.add("February");
            case 3:  futureMonths.add("March");
            case 4:  futureMonths.add("April");
            case 5:  futureMonths.add("May");
            case 6:  futureMonths.add("June");
            case 7:  futureMonths.add("July");
            case 8:  futureMonths.add("August");
            case 9:  futureMonths.add("September");
            case 10: futureMonths.add("October");
            case 11: futureMonths.add("November");
            case 12: futureMonths.add("December");
            default: break;
        }
        if (futureMonths.isEmpty()) {
            System.out.println("Invalid month number");
        } else {
            for (String monthName : futureMonths) {
                System.out.println(monthName);
            }
        }
    }
}
```

技术上，最后一个 `break` 并非必需（因为流程会自然退出 switch 语句），但建议保留，让修改代码更简单、更不易出错。

`default` 部分处理所有未被 case 部分显式处理的值。下面示例展示一个语句可带多个 case 标签，计算某月的天数：

```java
public class SwitchDemo2 {
    public static void main(String[] args) {
        int month = 2;
        int year = 2000;
        int numDays = 0;

        switch (month) {
            case 1: case 3: case 5:
            case 7: case 8: case 10:
            case 12:
                numDays = 31;
                break;
            case 4: case 6:
            case 9: case 11:
                numDays = 30;
                break;
            case 2:
                if (((year % 4 == 0) && !(year % 100 == 0))
                    || (year % 400 == 0))
                    numDays = 29;
                else
                    numDays = 28;
                break;
            default:
                System.out.println("Invalid month.");
                break;
        }
        System.out.println("Number of Days = " + numDays);   // 输出 29
    }
}
```

---

## 二、switch 与 if-then-else 的选择

在 `if-then-else` 和 `switch` 之间做选择，取决于**可读性**和被测试的表达式。

- `if-then-else` 可测试**基于值范围或条件**的表达式；
- `switch` 只测试**单个整数、枚举值或 String 对象**。

例如，下面代码可用 switch 写：

```java
if (day == 1) System.out.println("Monday");
else if (day == 2) System.out.println("Tuesday");
else if (day == 3) System.out.println("Wednesday");
// ...
```

而下面这段**不能用 switch 写**，因为 switch 不支持 `boolean` 类型的标签：

```java
if (grade == 'A') System.out.println("Excellent");
else if (grade == 'B') System.out.println("Good");
else if (grade == 'C') System.out.println("Average");
```

---

## 三、用 String 作为 case 标签类型

Java SE 7 起，可在 switch 表达式里使用 `String` 对象。下面示例根据名为 `month` 的 String 值显示月份编号：

```java
public class StringSwitchDemo {
    public static void main(String[] args) {
        String month = "August";

        switch (month.toLowerCase()) {
            case "january":
                System.out.println(1);
                break;
            case "february":
                System.out.println(2);
                break;
            case "march":
                System.out.println(3);
                break;
            case "april":
                System.out.println(4);
                break;
            case "may":
                System.out.println(5);
                break;
            case "june":
                System.out.println(6);
                break;
            case "july":
                System.out.println(7);
                break;
            case "august":
                System.out.println(8);
                break;
            case "september":
                System.out.println(9);
                break;
            case "october":
                System.out.println(10);
                break;
            case "november":
                System.out.println(11);
                break;
            case "december":
                System.out.println(12);
                break;
            default:
                System.out.println("Invalid month");
                break;
        }
    }
}
```

switch 表达式中的 String 与每个 case 标签关联的表达式比较，就像使用 `String.equals()` 方法一样。为了让示例忽略大小写接受任意月份，`month` 被转成小写（用 `toLowerCase()` 方法），所有 case 标签关联的字符串也都是小写。

---

## 四、空选择变量

switch 的选择变量可以是对象，因此**可为 null**。**应保护代码免受 null 选择变量影响**，因为此时 switch 会抛出 `NullPointerException`。

---

## 五、switch 表达式（Java SE 14 新语法）

在 Java SE 14 中，你可以使用另一种更便捷的 `switch` 语法：**switch 表达式**。这项新语法由几点动机驱动：

1. **默认的穿透行为易出错**，易导致应用 bug；
2. switch 块被当作一个块，若只在一个特定 `case` 里定义变量会受阻碍；
3. switch 语句是语句，把每个 case 里给变量赋值改成**表达式**，可写出更好、更易读的代码。

前面的 `switch` 语句在 Java SE 14 仍可用，语义未变。从 Java SE 14 起新增了 **switch 表达式**语法，它修改了 switch 标签的语法。

### 新语法：`case L ->`

假设你有如下 switch 语句：

```java
int day = 2;
String dayType;
switch (day) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
        dayType = "Weekday";
        break;
    case 6:
    case 7:
        dayType = "Weekend";
        break;
    default:
        dayType = "Invalid";
}
```

用 switch 表达式语法可写成：

```java
int day = 2;
String dayType = switch (day) {
    case 1, 2, 3, 4, 5 -> "Weekday";
    case 6, 7           -> "Weekend";
    default             -> "Invalid";
};
```

switch 标签语法现在是 `case L ->`。只有标签匹配时，才执行标签右侧的代码。这段代码可以是单个表达式、一个块或一条 `throw` 语句。因为这段代码是一个块，可在其中定义**该块局部**的变量。

该语法还支持**每个 case 多个常量**，用逗号分隔（如上例）。

### 产生值（Producing a Value）

switch 语句可用作表达式。若 case 块里只有一条语句，该语句产生的值就是 switch 表达式返回的值：

```java
int quarter = 3;
String quarterLabel = switch (quarter) {
    case 1 -> "Q1";
    case 2 -> "Q2";
    case 3 -> "Q3";
    case 4 -> "Q4";
    default -> "Unknown";
};
```

**代码块的情况语法略有不同**。传统上用 `return` 表示块产生的值，但这在 switch 中会导致歧义。看下面**不能编译**的示例（仅作演示）：

```java
int quarter = 3;
String quarterLabel = switch (quarter) {
    case 1 -> "Q1";
    default -> {
        return "Unknown";   // 歧义：这个 return 是退出方法还是退出 switch？
    }
};
```

这里有两个 `return`：一个在 case 块，一个在方法块。歧义在于：第一个 `return` 的含义是「以这个值退出方法」，还是「离开 switch 语句」？这种歧义导致可读性差、代码易错。

**新语法 `yield` 解决了这个歧义**。上面代码应写成：

```java
int quarter = 3;
String quarterLabel = switch (quarter) {
    case 1 -> "Q1";
    case 2 -> "Q2";
    case 3 -> "Q3";
    case 4 -> "Q4";
    default -> {
        yield "Unknown";
    }
};
```

`yield` 是可在 switch 语句的任何 case 块中使用的语句，它带一个值，该值成为外层 switch 语句的值。

### 添加 default 子句

default 子句让你处理**选择值不匹配任何 case 常量**的情况。

**switch 表达式的 case 必须穷尽（exhaustive）**——对所有可能的值，必须有一个匹配的 switch 标签。而 switch 语句**不要求穷尽**——若选择目标不匹配任何标签，switch 语句静默什么都不做，这可能是 bug 藏身处，应避免。

多数情况下，用 default 子句实现穷尽；但对于覆盖所有已知常量的**枚举 switch 表达式**，无需添加 default 子句。

还需处理一种情况：**如果有人给枚举新增了枚举值，但忘了更新该枚举上的 switch 语句**？为处理这种情况，编译器会在穷尽 switch 语句中**为你添加一个 default 子句**。该子句正常情况永不执行，只有新增了枚举值才执行，并抛出 `IncompatibleClassChangeError`。

处理穷尽性是 switch 表达式的一项特性，传统 switch 语句不提供，也不仅用于枚举 switch 场景。

### 在 switch 表达式中写冒号 case

switch 表达式也可使用传统 `case L:` 块。这时**穿透语义有效**，用 `yield` 语句产生值。

### 处理 null 值

到目前为止，switch 语句**不接受 null 选择值**。若对 null 值 switch，会抛 `NullPointerException`。

Java SE 17 有一个预览特性，增强 switch 表达式以允许 null 值，预期该情况会改变。

---

## 附：用 var 声明局部变量（Java SE 10+）

从 Java SE 10 起，可用 **`var` 类型标识符**声明局部变量。这让编译器决定变量真正的类型，一旦创建不能更改。

```java
// 显式声明（冗余）
String message = "Hello";
Path path = Path.of("file.txt");
InputStream stream = Files.newInputStream(path);

// 用 var 声明（简洁）
var message = "Hello";
var path = Path.of("file.txt");
var stream = Files.newInputStream(path);
```

`var` 可用于 for 语句、try-with-resources 语句中声明变量。

### 使用 var 的限制
1. 只能用于**方法、构造器和初始化块中声明的局部变量**；
2. **不能用于字段**，也不能用于方法或构造器参数；
3. 声明变量时编译器必须能选出一个类型——由于 `null` 无类型，**变量必须有初始化器**。

因此下面代码**不能编译**：

```java
// var 不能用作字段或方法参数的类型
class Foo {
    var greeting = "Hi";        // 错误：var 不能用于字段
}
```

同理下面代码也不能编译——`greetings` 缺初始化器，编译器无法推断类型：

```java
var greetings;                  // 错误：变量必须有初始化器
greetings = "Hello";
```

---

## 本节小结

- `switch` 语句按选择变量的值选择执行路径，支持 `byte`/`short`/`char`/`int`、包装类型、枚举、String；不支持 `boolean`/`long`/`float`/`double`。
- `break` 终止 switch，缺失会穿透；`default` 处理未匹配的值。
- `switch` 测试单个值，`if-then-else` 可测试范围/条件。
- **switch 表达式**（Java SE 14+）：`case L ->` 语法、可产生值（用 `yield`）、case 必须穷尽、支持多常量。
- **`var`**（Java SE 10+）：局部变量类型推断，不能用于字段/参数，必须有初始化器。

---

*译文基于 Oracle Dev.java 官方教程，忠实于原文结构，保留全部代码示例。*
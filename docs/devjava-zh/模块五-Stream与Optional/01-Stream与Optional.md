# Stream API 与 Optional

> 来源：Oracle 官方 [Dev.java 教程](https://dev.java/learn/) →《Streams》
> 忠实翻译，保留全部代码示例与官方配图。

**Stream（流）是 Java 8 引入的核心抽象：从支持聚合操作的数据源（如集合）产生的一系列元素。** Stream 不是数据结构，不存储数据；它是**对数据源的元素进行流水线式操作**的载体。

---

## 一、Stream 的特点

1. **不存储数据**：Stream 从数据源（集合、数组、I/O）产生元素，但不持有它们。
2. **流水线（pipeline）**：一次 Stream 操作返回另一个 Stream，可以链接成流水线，在最后用终端操作（terminal operation）产生结果。
3. **惰性求值（lazy）**：中间操作（intermediate operation）不立即执行，只有在遇到**终端操作**时才真正执行整个流水线。
4. **一次消费**：Stream 只能被消费一次，用完后不能复用。

**关键区分**：

- **中间操作**（intermediate）：返回 Stream，可链式调用，惰性执行。如 `filter`、`map`、`sorted`、`distinct`、`limit`、`peek`。
- **终端操作**（terminal）：返回具体结果（如 `List`、`Optional`、`long`）或产生副作用，触发流水线执行。如 `collect`、`forEach`、`reduce`、`count`、`anyMatch`。

---

## 二、创建 Stream

**① 从集合**：

```java
List<String> list = List.of("apple", "banana", "cherry");
list.stream();               // 串行流
list.parallelStream();       // 并行流
```

**② 从数组**：

```java
String[] arr = {"a", "b", "c"};
Arrays.stream(arr);
```

**③ 用 `Stream.of`**：

```java
Stream.of("a", "b", "c");
Stream.of(1, 2, 3);
```

**④ 无限流 / 生成流**：

```java
Stream.iterate(1, n -> n + 1).limit(10);        // 1..10
Stream.generate(Math::random).limit(3);         // 3 个随机数
IntStream.range(0, 5);                           // 0,1,2,3,4
```

**⑤ 从文件行（I/O）**：

```java
Files.lines(Paths.get("file.txt")).forEach(System.out::println);
```

---

## 三、中间操作（返回 Stream）

### `filter` —— 过滤

接收 `Predicate`，保留满足条件的元素。

```java
List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);
nums.stream()
    .filter(n -> n % 2 == 0)     // 偶数
    .forEach(System.out::println);   // 2 4 6
```

### `map` —— 映射/变换

接收 `Function`，把每个元素变换为另一个对象。

```java
List<String> words = List.of("hello", "world");
words.stream()
     .map(String::toUpperCase)
     .forEach(System.out::println);   // HELLO WORLD
```

### `flatMap` —— 扁平化映射

把每个元素映射为一个流，再合并所有流为一个流。用于处理嵌套集合。

```java
List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4));
nested.stream()
      .flatMap(List::stream)
      .forEach(System.out::println);   // 1 2 3 4
```

### `sorted` —— 排序

```java
List.of(3, 1, 2).stream()
    .sorted()
    .forEach(System.out::println);   // 1 2 3

List.of("b", "a").stream()
    .sorted(Comparator.reverseOrder())
    .forEach(System.out::println);   // b a
```

### `distinct` —— 去重

```java
List.of(1, 1, 2, 3, 3).stream()
    .distinct()
    .forEach(System.out::println);   // 1 2 3
```

### `limit` / `skip` —— 限制 / 跳过

```java
Stream.iterate(1, n -> n + 1)
      .limit(5)        // 取前 5 个：1 2 3 4 5
      .skip(2)         // 跳过前 2 个：3 4 5
      .forEach(System.out::println);
```

---

## 四、终端操作（产生结果）

### `collect` —— 收集到集合（最常用）

把流元素收集到 `List`、`Set`、`Map` 等。

```java
List<String> words = List.of("apple", "banana", "cherry");

List<String> longWords = words.stream()
    .filter(w -> w.length() > 5)
    .collect(Collectors.toList());   // [banana, cherry]

Set<String> asSet = words.stream()
    .collect(Collectors.toSet());    // 去重成 Set
```

**用 `Collectors` 做更复杂的聚合**：

```java
// 分组：按首字母分组
Map<Character, List<String>> grouped = words.stream()
    .collect(Collectors.groupingBy(w -> w.charAt(0)));

// 分区：满足条件 / 不满足条件
Map<Boolean, List<String>> partitioned = words.stream()
    .collect(Collectors.partitioningBy(w -> w.length() > 4));

// 汇总：统计长度
IntSummaryStatistics stats = words.stream()
    .collect(Collectors.summarizingInt(String::length));
// stats.getMax(), getMin(), getAverage(), getSum(), getCount()

// 字符串拼接
String joined = words.stream()
    .collect(Collectors.joining(", "));   // "apple, banana, cherry"
```

### `reduce` —— 归约/聚合

把流元素反复组合，产生单个结果。

[归约示意](../assets/images/stream-api/01_reduction.png)

```java
// 求和
int sum = List.of(1, 2, 3, 4).stream()
    .reduce(0, (a, b) -> a + b);   // 10
// 等价于 Integer::sum

// 求最大
int max = List.of(3, 1, 4).stream()
    .reduce(Math::max).orElse(0);   // 4
```

`reduce` 的三种形式：

- `reduce(T identity, BinaryOperator<T> acc)`：带初始值，返回 `T`。
- `reduce(BinaryOperator<T> acc)`：无初始值，返回 `Optional<T>`。
- `reduce(U identity, BiFunction<U,T,U> acc, BinaryOperator<U> combiner)`：带合并器，用于并行流。

### `forEach` —— 副作用遍历

对每个元素执行动作（通常用于打印、外部修改）。

```java
list.stream().forEach(System.out::println);
```

> **注**：`forEach` 是终端操作，产生副作用，违背 Stream 的「无副作用」设计初衷，但仍常用。若要在流中调试，用 `peek`（中间操作）。

### `count` / `min` / `max` / 匹配

```java
long count = list.stream().filter(n -> n > 2).count();   // 计数

Optional<Integer> min = list.stream().min(Integer::compareTo);
Optional<Integer> max = list.stream().max(Integer::compareTo);

boolean any = list.stream().anyMatch(n -> n > 5);   // 任一满足
boolean all = list.stream().allMatch(n -> n > 0);   // 全部满足
boolean none = list.stream().noneMatch(n -> n < 0); // 都不满足
```

### `findFirst` / `findAny`

```java
Optional<String> first = list.stream().filter(w -> w.length() > 3)
    .findFirst();    // 第一个满足的
Optional<String> any = list.stream().parallel()
    .filter(w -> w.length() > 3).findAny();    // 并行流中任一个
```

---

## 五、Map-Filter-Reduce 模式（经典套路）

这是函数式编程的核心模式，Java Stream 用 `map`（变换）、`filter`（过滤）、`reduce`（聚合）实现。它构成许多 Stream 流水线的骨架。

[Map-Filter-Reduce 示意](../assets/images/stream-api/03_reduction-mapping.png)

**示例**：过滤出奇数并求和。

```java
int oddSum = Stream.iterate(1, n -> n + 1)
    .filter(n -> n % 2 != 0)      // filter：只留奇数
    .mapToInt(n -> n * n)          // map：平方
    .limit(5)                      // 取前 5 个
    .reduce(0, Integer::sum);      // reduce：求和
// 1*1 + 3*3 + 5*5 + 7*7 + 9*9 = 165
```

**过滤（filter）+ 映射（map）组合**：

```java
List<String> result = List.of("apple", "bat", "cat", "elephant").stream()
    .filter(w -> w.length() > 3)       // apple, elephant
    .map(String::toUpperCase)          // APPLE, ELEPHANT
    .collect(Collectors.toList());
```

---

## 六、并行流（Parallel Streams）

**并行流利用多核处理器并行处理元素，大幅提高大数据量处理的性能。** 通过 `parallelStream()` 或 `parallel()` 得到。

[并行归约示意](../assets/images/stream-api/02_parallel-reduction.png)

```java
// 大数据量求和，并行
long total = LongStream.rangeClosed(1, 10_000_000).parallel().sum();
```

**注意事项**：

- 并行流**不一定更快**，有拆分与合并开销。小数据量或简单操作时串行更快。
- 并行流中的操作必须**无状态、无副作用、可关联（associative）**。
- 共享可变状态是并行流的大忌（如并行修改共享集合）——会导致竞态条件。
- 用 `reduce` 时需提供**合适的组合器**（combiner）函数。

---

## 七、Gatherers（Java 22 新增）

Java 22 引入 `Stream.Gatherers`，让中间操作能自定义、流式地处理元素（如带状态的过滤、窗口滑动等）。这是对 Stream 能力的扩展，属于较新特性，了解即可。

---

## 八、Optional（可空容器）

**`Optional` 是一个容器对象，可能包含也可能不包含非空值。** 它是 Java 8 引入的替代 `null` 的工具，强制处理「值可能不存在」的情况，减少 `NullPointerException`。

### 创建 Optional

```java
Optional<String> empty = Optional.empty();                    // 空
Optional<String> value = Optional.of("hello");                // 非空，不能传 null
Optional<String> nullable = Optional.ofNullable(mayBeNull);   // 可为 null
```

### 常用方法

| 方法 | 说明 |
|------|------|
| `boolean isPresent()` | 是否有值 |
| `boolean isEmpty()` | 是否为空（Java 11+） |
| `T get()` | 取值，无值抛 `NoSuchElementException`（不推荐直接用） |
| `T orElse(T other)` | 有值返回值，否则返回默认值 |
| `T orElseGet(Supplier)` | 有值返回值，否则用 Supplier 计算（惰性） |
| `T orElseThrow()` | 无值抛 `NoSuchElementException` |
| `<X> T orElseThrow(Supplier<X>)` | 无值抛自定义异常 |
| `Optional<T> filter(Predicate)` | 过滤 |
| `<U> Optional<U> map(Function)` | 变换 |
| `<U> Optional<U> flatMap(Function)` | 扁平化变换 |
| `void ifPresent(Consumer)` | 有值才执行 |

### 使用示例

```java
// 传统 null 检查
String name = getNullableName();
if (name != null) {
    System.out.println(name.length());
}

// Optional 优雅处理
Optional<String> nameOpt = Optional.ofNullable(getNullableName());
nameOpt.map(String::length)
       .ifPresent(System.out::println);   // 有值才打印长度

// orElse 提供默认值
String safe = nameOpt.orElse("unknown");
```

### 典型实践：避免 get()

**不推荐**直接 `get()`，推荐用 `orElse` / `orElseGet` / `ifPresent` / `map` 链式处理：

```java
// 推荐
int len = user.getName()
    .map(String::length)
    .orElse(0);

// 从 Optional 取回集合
List<String> list = optionalList.orElseGet(ArrayList::new);
```

### 与 Stream 结合

```java
// 把 Optional 转成 Stream（Java 9+：stream()）
String result = list.stream()
    .map(this::findByKey)          // 返回 Optional
    .flatMap(Optional::stream)     // 把 Optional 变 Stream，空的自动跳过
    .collect(Collectors.joining(","));
```

---

## 核心速查表

| 类别 | 操作 | 说明 |
|------|------|------|
| 创建 | `stream()`、`Stream.of`、`Arrays.stream` | 产生流 |
| 中间 | `filter` `map` `flatMap` `sorted` `distinct` `limit` `skip` `peek` | 返回 Stream，惰性 |
| 终端 | `collect` `reduce` `forEach` `count` `min/max` `anyMatch` `findFirst` | 产生结果 |
| Collector | `toList` `toSet` `groupingBy` `partitioningBy` `joining` `summarizingInt` | 聚合收集 |
| 并行 | `parallelStream()` / `parallel()` | 多核并行（注意无副作用） |
| Optional | `of` `ofNullable` `empty` `orElse` `map` `filter` `ifPresent` | 处理可空 |

> **面试高频**：中间操作 vs 终端操作、惰性求值、`map` vs `flatMap`（每元素多变一 vs 一对多扁平化）、`reduce` 三种重载、并行流注意事项（无状态/无副作用）、`Optional` 为何不推荐 `get()` 而用 `orElse`/`ifPresent`、`Collectors.groupingBy` 分组。

*最后更新：2021 年 9 月 14 日（官方）*

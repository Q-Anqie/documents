---
title: "record 与枚举：数据类的快捷写法"
order: 5
difficulty: 入门
prerequisites: ["注册代码里的泛型与Supplier", "注解：@ 开头的那些标签"]
---

# record 与枚举：数据类的快捷写法

> 读完这篇，你能看懂 `public record RubyData(int charge, boolean awakened) {}` 这一行为什么能顶掉三十行代码，也能读懂 `Rarity.EPIC`、`Direction.NORTH` 这类"点出来"的东西到底是什么。

## 学习目标

- 能说出 record 自动生成了哪四样东西，以及为什么 1.21 的数据组件特别爱用它。
- 看到 `data.charge()` 不会误以为是静态方法，知道 record 的取值方法不叫 `getXxx()`。
- 能读懂一个带字段、带方法、带 `switch` 的枚举，比如 `MobCategory`、`Rarity`、`InteractionResult`。
- 看到 `record` / `enum` / 普通 `class` 时，能立刻判断"这个类型是用来装数据的、是有限选项、还是有行为有状态"。

## 正文

### 先看这两段

第一段，你在 1.21 的模组代码里会反复看到这种"一行定义"的类：

文件：`src/main/java/com/dafeiyu/data/RubyData.java`

```java
public record RubyData(int charge, boolean awakened) {}
```

第二段，满屏的枚举常量：

文件：`src/main/java/com/dafeiyu/ModItems.java`

```java
stack.set(DataComponents.RARITY, Rarity.EPIC);
```

两段代码都短得不像话，但信息量很大。第一段看着像"什么都没写"，其实已经是一个完整可用的类；第二段的 `Rarity.EPIC` 也不是"某个常量"，`Rarity` 是一个**有方法的类型**。

下面分别拆。

### record：一行定义"只装数据"的类

把上面那行展开，编译器实际帮你生成了这些东西：

```java
// 编译器生成的等价物（简化版，仅用于理解）
public final class RubyData extends java.lang.Record {
    private final int charge;
    private final boolean awakened;

    public RubyData(int charge, boolean awakened) {   // 1. 全参构造器
        this.charge = charge;
        this.awakened = awakened;
    }

    public int charge() { return this.charge; }        // 2. 取值方法
    public boolean awakened() { return this.awakened; }

    @Override public boolean equals(Object o) { ... }  // 3. 按字段比较
    @Override public int hashCode() { ... }            // 4. 按字段算哈希
    @Override public String toString() { ... }         // 5. 打印出字段值
}
```

所以 `new RubyData(5, true)` 能直接构造，`data.charge()` 能直接取值，两个字段相同的 `RubyData` 用 `equals` 比较会返回 `true`，`System.out.println(data)` 会打印 `RubyData[charge=5, awakened=true]`。

**为什么 1.21 到处是 record？** 因为数据组件（data component）对值类型有硬性要求：必须实现 `equals` 和 `hashCode`，并且必须**不可变**。手写一个类要写构造器、两个 getter、`equals`、`hashCode`、`toString`，三四十行；用 record 一行搞定，而且不可能写错。官方译文里那句话很直白："组件值使用 record 实现非常方便。"

这里你只要知道"record = 一组不可变字段 + 自动生成的样板代码"，暂时不用管它底层继承的 `java.lang.Record`、也不用管反射里怎么读它——模组开发里用不到。

### 注意：取值方法叫 `charge()`，不是 `getCharge()`

这是第一次读 record 代码时最容易卡住的地方：

```java
RubyData data = stack.get(ModDataComponents.RUBY_DATA.get());
int c = data.charge();        // 对
int d = data.getCharge();     // 编译不过：没有这个方法
```

Java 的惯例里，字段 `charge` 的取值方法一般叫 `getCharge()`（这叫 JavaBean 命名）。但 record 不遵守这套，它生成的取值方法**就是字段名本身**。

为什么？因为 record 的设计目标是"透明的数据载体"——你看到 `charge()` 就知道它对应构造器里的第一个参数，不需要在 `get` 前缀和字段名之间做一次心算。写 Codec 的时候这个好处特别明显：

```java
Codec.INT.fieldOf("charge").forGetter(RubyData::charge)
```

`RubyData::charge` 这个方法引用，指的就是那个自动生成的取值方法。如果你自己手写一个 `getCharge()`，`forGetter` 就得跟着改，两边容易对不上。

读代码时的判断方法很简单：**看到 `xxx.charge()` 这种"没有 get 前缀、括号里还没参数"的调用，先怀疑它是 record 的取值方法**，而不是静态方法。

### record 能加东西，但不能继承

record 不是"只能装数据、什么都不能干"。它是一个正常的类，只是字段固定。你可以：

**加方法（算派生值）：**

```java
public record RubyData(int charge, boolean awakened) {
    // 不是字段，是每次调用时算出来的
    public boolean isCharged() {
        return this.charge > 0;
    }

    // 想"修改"就造一个新的，这叫 withXxx 风格
    public RubyData withCharge(int newCharge) {
        return new RubyData(newCharge, this.awakened);
    }
}
```

注意 `withCharge` 的写法：record 没有 setter，字段是 `final` 的，想改只能造新对象。这不是缺陷，而是数据组件的硬要求——组件值必须不可变，改了就得 `stack.set(...)` 重新设一遍。

**用紧凑构造器做校验：**

```java
public record RubyData(int charge, boolean awakened) {
    // 紧凑构造器：不写参数列表，参数名就是字段名
    public RubyData {
        charge = Math.max(0, charge);   // 可以直接给参数重新赋值，赋的值就是字段值
    }
}
```

紧凑构造器（compact constructor）的语法很特别：`public RubyData {` 后面不跟括号里的参数列表。它的参数是隐式存在的，你在里面给参数赋值，赋完的值会成为字段的最终值。适合放"夹取范围""补默认值"这类逻辑。

> 一个忠告：如果你的 record 会被 Codec 从 JSON/NBT 解码，**不要在构造器里抛异常**。存档里只要有一条脏数据，`IllegalArgumentException` 会让整个数据加载失败。要校验就夹取（`Math.max`），或者在上层用 `Codec#intRange` 拦。

**不能做的事：**

- 不能 `extends` 别的类（它已经隐式继承 `java.lang.Record`）；
- 不能被别的类继承（record 是 `final`）；
- 不能声明额外的实例字段（只能有构造器参数里那些）；
- 字段没有 setter。

一句话总结：**record 是"字段锁死的类"，能加行为，不能加状态，不能继承。**

顺带一个很实用的副作用：因为 `equals` 和 `hashCode` 是按字段自动算的，record 可以直接当 `Map` 的键用。你写缓存时经常能看到 `Map<RubyData, ItemStack>` 这种写法——两个字段相同的 `RubyData` 会被认成同一个键，换成普通 class 就得自己重写这两个方法，否则永远命中不了。

### enum：不只是常量列表

看到 `Rarity.EPIC`，很多人的第一反应是"哦，一个常量"。但在 Java 里，`enum` 定义的是一个**类型**，`EPIC` 是这个类型的**唯一实例之一**。它可以有字段、有方法、有构造器。

先看一个最朴素的例子——你在模组里自己定义的：

文件：`src/main/java/com/dafeiyu/data/RubyTier.java`

```java
public enum RubyTier {
    ROUGH("rough", 1.0F),
    POLISHED("polished", 2.5F),
    AWAKENED("awakened", 5.0F);

    private final String id;
    private final float multiplier;

    // 枚举的构造器只能是 private（写不写都是 private）
    RubyTier(String id, float multiplier) {
        this.id = id;
        this.multiplier = multiplier;
    }

    public String id() {
        return this.id;
    }

    public float multiplier() {
        return this.multiplier;
    }
}
```

读法：`ROUGH("rough", 1.0F)` 不是"给常量赋个值"，而是**调用构造器创建这个常量**。所以每个常量都能带一组自己的数据，并且通过方法暴露出来：`RubyTier.AWAKENED.multiplier()` 得到 `5.0F`。

这解释了为什么 Minecraft 里到处是这种写法：

| 枚举 | 它带的字段/方法 | 你会在哪见到 |
|---|---|---|
| `Rarity` | `COMMON`/`UNCOMMON`/`RARE`/`EPIC`，每个都带一份用于物品名的样式修饰 | `DataComponents.RARITY`、`Item.Properties#rarity` |
| `Direction` | `NORTH`/`SOUTH`/`EAST`/`WEST`/`UP`/`DOWN`，带 `getOpposite()`、`getStepX()` | 方块朝向、实体面向、`BlockPlaceContext` |
| `MobCategory` | `MONSTER`/`CREATURE`/`AMBIENT`/`MISC` 等，带 `getName()`、`getMaxInstancesPerChunk()` | 生物生成、`EntityType#getCategory` |
| `InteractionResult` | `SUCCESS`/`CONSUME`/`CONSUME_PARTIAL`/`PASS`/`FAIL`，还带静态方法 `sidedSuccess(boolean)` | `Block#useWithoutItem`、`Item#use` 的返回值 |

`InteractionResult` 特别值得注意，因为它同时有"常量"和"静态工厂方法"：

```java
return InteractionResult.SUCCESS;                    // 直接用常量
return InteractionResult.sidedSuccess(level.isClientSide());   // 用静态方法按侧返回
```

后者是官方推荐的写法：客户端返回 `SUCCESS`、服务端返回 `CONSUME`，省得你自己写三目运算符。

顺带一个冷知识：`Rarity` 虽然是枚举，NeoForge 却允许模组往里加新值（通过 `enumExtensions` 机制改字节码）。所以文档里会提醒"模组可能会添加更多稀有度类型"——你写 `switch (rarity)` 时，别假定只有原版那四个。

### 读枚举代码的三件事

**第一，`switch` 配枚举，`case` 不写类名：**

```java
String label = switch (tier) {
    case ROUGH -> "粗糙";
    case POLISHED -> "打磨";
    case AWAKENED -> "觉醒";
};
```

注意 `case ROUGH` 而不是 `case RubyTier.ROUGH`。这是枚举专属的简写。

**第二，`values()` 用来遍历，`valueOf()` 用来从名字反查：**

```java
for (RubyTier tier : RubyTier.values()) {   // 拿到所有常量，顺序就是声明顺序
    LOGGER.info("tier = {}", tier.id());
}

RubyTier t = RubyTier.valueOf("AWAKENED");  // 名字必须完全一致，否则抛 IllegalArgumentException
```

`values()` 每次调用都会克隆一份数组，别在每刻执行的代码里反复调它，存成静态常量更好。

**第三，`EnumMap` / `EnumSet` 是给枚举专用的容器：**

```java
Map<RubyTier, Integer> counts = new EnumMap<>(RubyTier.class);
```

它比 `HashMap` 快、省内存，而且遍历顺序就是枚举声明顺序。看到别人这么写不用奇怪，就是"键一定是这个枚举"的 Map。

### 什么时候你会遇到它们

把常见出现位置列一遍，读代码时对号入座：

- **`DataComponentType` 的泛型参数**：`DataComponentType<RubyData>` 里的 `RubyData` 十有八九是 record，因为组件值要求不可变 + 有 `equals`。
- **各种 `*Data`、`*Config`、`*Settings` 结尾的类**：先怀疑 record。
- **`MobCategory`、`Rarity`、`Direction`、`InteractionResult`、`TriState`、`EventPriority`、`Dist`、`Bus`**：全是枚举。
- **`switch` 的 case 里出现裸名字**：说明被 switch 的是枚举。
- **`BlockStateProperties.FACING` 的取值**：`Direction` 枚举。
- **`FoodProperties`、`Item.Properties`**：这些不是 record，是普通 class + Builder，见 [Builder与链式调用](03-Builder与链式调用.md)。

### 一张表：看到这三种写法分别意味着什么

| 你看到 | 意味着 | 典型例子 | 你该期待什么 |
|---|---|---|---|
| `public record X(...) {}` | 不可变数据包，字段锁死 | `RubyData`、`ExampleRecord` | 构造器、`x.field()`、`equals`、没有 setter |
| `public enum X { A, B, C }` | 有限个选项，每个都是单例 | `Rarity`、`Direction`、`InteractionResult` | `X.A`、`switch`、`values()`、可能带字段和方法 |
| `public class X { ... }` | 有状态、有行为、可能要继承 | `RubyBlock`、`RubyBlockEntity`、`Item` | 字段可变、有 setter、要 `new`、可能实现接口 |

判断口诀：**"它有几个？"** 只有一个确定的数据组合 → record；只有有限几个固定选项 → enum；有多个实例、各自状态不同 → 普通 class。

## 完整示例

三个文件。`RubyData` 是数据包，`RubyTier` 是带字段的枚举，最后一段演示两者怎么一起用。

文件：`src/main/java/com/dafeiyu/data/RubyData.java`

```java
package com.dafeiyu.data;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;

// 一行拿到构造器、charge()、awakened()、equals、hashCode、toString
public record RubyData(int charge, boolean awakened) {

    // 组件值必须有 Codec 才能存盘/同步；forGetter 用的就是自动生成的取值方法
    public static final Codec<RubyData> CODEC = RecordCodecBuilder.create(instance ->
        instance.group(
            Codec.INT.fieldOf("charge").forGetter(RubyData::charge),
            Codec.BOOL.fieldOf("awakened").forGetter(RubyData::awakened)
        ).apply(instance, RubyData::new)   // 构造器引用，参数顺序必须和上面一致
    );

    public static final RubyData EMPTY = new RubyData(0, false);

    // 紧凑构造器：不写参数列表，直接对隐式参数做处理
    public RubyData {
        charge = Math.max(0, charge);   // 夹取，避免负值进存档
    }

    public boolean isCharged() {
        return this.charge > 0;
    }

    // record 没有 setter，"修改"就是造一个新的
    public RubyData withCharge(int newCharge) {
        return new RubyData(newCharge, this.awakened);
    }
}
```

文件：`src/main/java/com/dafeiyu/data/RubyTier.java`

```java
package com.dafeiyu.data;

public enum RubyTier {
    ROUGH("rough", 1.0F),
    POLISHED("polished", 2.5F),
    AWAKENED("awakened", 5.0F);

    private final String id;
    private final float multiplier;

    RubyTier(String id, float multiplier) {
        this.id = id;
        this.multiplier = multiplier;
    }

    public String id() {
        return this.id;
    }

    public float multiplier() {
        return this.multiplier;
    }

    // 枚举里用 switch 表达式，case 直接写常量名
    public RubyTier next() {
        return switch (this) {
            case ROUGH -> POLISHED;
            case POLISHED -> AWAKENED;
            case AWAKENED -> AWAKENED;
        };
    }
}
```

文件：`src/main/java/com/dafeiyu/item/RubySwordItem.java`（片段）

```java
// 读：从组件里取出 record，再按枚举分档
RubyData data = stack.get(ModDataComponents.RUBY_DATA.get());
if (data == null) {
    data = RubyData.EMPTY;          // 没设过组件时 get 返回 null
}

// record 的取值方法没有 get 前缀
float bonus = data.awakened() ? 2.0F : 1.0F;

// 枚举常量带方法，可以问它自己的数据
RubyTier tier = data.awakened() ? RubyTier.AWAKENED : RubyTier.ROUGH;
float damage = 4.0F * tier.multiplier() * bonus;
```

## 常见坑与报错

| 现象 | 原因 | 解决 |
|---|---|---|
| `cannot find symbol: method getCharge()` | record 的取值方法就是字段名 | 改成 `data.charge()` |
| `non-static variable ... cannot be referenced` / 赋值给 record 字段报错 | record 字段是 `private final` | 造新对象：`data.withCharge(3)`，再 `stack.set(...)` |
| `record ... cannot extend ...` | record 已隐式继承 `Record` | 要继承就用普通 class；要复用字段就抽接口 |
| 存档加载时抛 `IllegalArgumentException`，整份数据没读进来 | 紧凑构造器里对解码值做了抛异常的校验 | 改成夹取，或用 `Codec#intRange` 在解码阶段拦 |
| `switch` 少写一个 case 却编译通过，运行时行为不对 | 语句式 `switch` 不要求穷尽 | 用 `switch` 表达式（`->` 形式），漏 case 会编译报错 |
| `RubyTier.valueOf("awakened")` 抛 `IllegalArgumentException` | `valueOf` 区分大小写，只认常量名 `AWAKENED` | 用常量名，或自己写 `fromId(String)` 做映射 |
| 两个内容相同的对象 `equals` 返回 false | 用的是普通 class，没重写 `equals` | 换成 record，或手写 `equals`/`hashCode` |
| record 里放了数组字段，`equals` 结果不对 | record 的 `equals` 对数组用引用比较 | 数组别放进 record，或改用 `List` |

## 练习

1. **（易）** 写一个 `public record FishData(String species, int weight) {}`，构造两个字段相同的实例，用 `equals` 比较并打印结果；再打印其中一个，观察 `toString` 的格式。
2. **（中）** 给 `FishData` 加紧凑构造器，让 `weight` 小于 0 时变成 0，再加一个 `isRecord()` 方法（`weight > 1000` 返回 true）。
3. **（难）** 给 `RubyTier` 加第四个常量 `TRANSCENDENT`，然后编译。观察 `next()` 里的 `switch` 表达式是否报错；如果报错，说明"穷尽性检查"在起作用——这就是 `switch` 表达式比语句式 `switch` 安全的地方。

## 参考

- 本教程译文：[数据组件](/docs/neoforge-1.21.1/04-物品/02-数据组件.md)
- 本教程译文：[Codec](/docs/neoforge-1.21.1/08-数据存储/02-Codec.md)
- 本教程译文：[可扩展枚举](/docs/neoforge-1.21.1/12-高级主题/02-可扩展枚举.md)
- 官方文档：https://docs.neoforged.net/docs/1.21.1/items/datacomponents
- 官方文档：https://docs.neoforged.net/docs/1.21.1/datastorage/codecs

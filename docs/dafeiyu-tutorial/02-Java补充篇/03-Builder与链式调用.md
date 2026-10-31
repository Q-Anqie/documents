---
title: "Builder与链式调用"
order: 3
difficulty: 入门
prerequisites: ["双冒号与方法引用"]
---

# Builder与链式调用

> 读完这篇，你能看懂 `new Item.Properties().stacksTo(16).rarity(Rarity.RARE)` 这种一路点下去的写法，知道它为什么能一直点、什么时候要 `build()`、以及为什么不能把同一个 Properties 塞给两个物品。

## 学习目标

- 能解释 `new Item.Properties()` 后面为什么能一路 `.stacksTo(16).rarity(...)` 点下去
- 能说出 Builder 模式解决的是什么问题（而不是背它的定义）
- 能判断一个 Builder 需不需要显式 `build()`，判断依据是什么
- 能自己写出一个十几行的 Builder，并和 `Item.Properties` 对照
- 能列出模组里最常见的几个 Builder 各自能配什么
- 能避开 Builder 复用、漏 `build()`、顺序覆盖这三个坑

## 先看这段代码

给红宝石加两个属性：最多堆 16 个、稀有度是稀有。

文件：`src/main/java/com/dafeiyu/ModItems.java`

```java
public static final DeferredItem<Item> RUBY = ITEMS.register("ruby",
        () -> new Item(new Item.Properties().stacksTo(16).rarity(Rarity.RARE)));
```

前两篇我们已经拆掉了 `DeferredItem<Item>` 和 `() ->`。现在剩下最里面这一坨：

```java
new Item.Properties().stacksTo(16).rarity(Rarity.RARE)
```

三个疑问：

```text
1. new 完一个对象，后面为什么还能接着点方法？一般不都是 new Xxx().method() 就结束了吗？
2. stacksTo 点完为什么还能点 rarity？它返回的是什么？
3. 为什么这里没有 build()？我在别的地方见过 xxx.builder()...build()，到底哪个对？
```

## 一、从里往外读这一行

先把嵌套拆开，一层层看：

```text
new Item(new Item.Properties().stacksTo(16).rarity(Rarity.RARE))
│       │
│       └─ ① 造一个「物品属性配置」对象
│         ② 在上面调 stacksTo(16)，把最大堆叠改成 16
│         ③ 再调 rarity(RARE)，把稀有度改成稀有
│         ④ 把配置好的这个对象交给 Item 的构造器
└─ 造一个 Item
```

关键是第 ② 步和第 ③ 步：**`stacksTo(16)` 执行完之后，返回的东西还能继续调 `rarity`。** 这说明它返回的不是 `void`，也不是一个数字，而是——**它自己**。

`Item.Properties` 里这些方法的真实形态（简化过的等价代码，不是原版源码逐字复制）：

```java
public class Item.Properties {
    private int maxStackSize = 64;
    private Rarity rarity = Rarity.COMMON;

    public Item.Properties stacksTo(int count) {
        this.maxStackSize = count;   // 改自己的字段
        return this;                 // 把自己交回去
    }

    public Item.Properties rarity(Rarity value) {
        this.rarity = value;
        return this;
    }
}
```

`return this;` 就是全部秘密。方法改完自己的字段，然后把自己返回出去，于是下一个方法又能在同一个对象上调用。这种「返回自己」的手法叫**流式接口（fluent interface）**，写法上就是一条链。

用图表示：

```text
new Item.Properties()      →  对象 P（maxStack=64, rarity=COMMON）
        .stacksTo(16)      →  改 P（maxStack=16），返回 P
        .rarity(RARE)      →  改 P（rarity=RARE），返回 P
结果还是 P，只是配置变了
```

所以那一长串的本质是：**同一个对象被连续改了两次**，不是造了三个对象。这一点非常重要，后面讲坑的时候要用到。

## 二、这种写法叫 Builder，它解决什么问题

假设不用 Builder，`Item` 的构造器把所有可选配置都写成参数，会发生什么：

```java
// 假想中的写法，不要真的去找这个构造器
new Item(64, 0, false, Rarity.COMMON, null, false, true, 0, ...)
```

你看到这行能说出每个参数是什么吗？`64` 是堆叠数还是耐久？第一个 `false` 是防火还是不可修复？改一个参数要数到第几位？再加一个新属性，全项目所有 `new Item(...)` 都得跟着改。

这就是所谓的「构造器参数列表爆炸」。Builder 模式解决它的办法很朴素：

**把「配置」从「构造」里拆出来，配置过程用一串有名字的方法完成，最后再一次性交给构造器。**

```text
不用 Builder：  new Item(16, RARE, false, ...)        ← 靠位置，靠记忆
用 Builder：    new Item.Properties().stacksTo(16).rarity(RARE)   ← 靠方法名，靠 IDE 补全
```

好处有三个，都很实际：

1. **每个设置项有名字。** `stacksTo(16)` 比第 1 个参数是 16 好读一百倍。
2. **可以只设你想设的。** 没调的项保持默认值（`maxStackSize` 默认 64，`rarity` 默认 `COMMON`），不用为「我不想改这个」传一堆占位值。
3. **顺序自由。** `.stacksTo(16).rarity(RARE)` 和 `.rarity(RARE).stacksTo(16)` 结果一样（除非两个方法互相覆盖，见后面的坑）。

代价是：多了一个类、多了一次 `new`、多了一层括号。但读代码的成本降得更多，所以 Minecraft 和 NeoForge 里到处都是它。

## 三、`build()` 什么时候需要

这是最容易懵的地方：有的 Builder 点完直接能用，有的必须 `.build()`。看两个真实例子。

**不需要 `build()` 的：`Item.Properties`**

```java
// 它自己就是「配置对象」，配完直接塞给 Item
new Item(new Item.Properties().stacksTo(16))
```

`Item.Properties` 的定位是「一堆设置项的容器」。`Item` 的构造器收的就是它，所以配完就完事了，没有中间产物要生成。

**需要 `build()` 的：`FoodProperties.Builder`**

```java
// 它是个「建造者」，不是「成品」。必须 build() 才得到 FoodProperties
FoodProperties food = new FoodProperties.Builder()
        .nutrition(4)
        .saturationMod(0.3f)
        .build();

new Item(new Item.Properties().food(food))
```

为什么这里必须要 `build()`？因为 `Item.Properties#food(...)` 要的参数类型是 `FoodProperties`，而 `FoodProperties.Builder` 是另一个类。类型对不上，编译器不让你过：

```text
error: incompatible types: FoodProperties.Builder cannot be converted to FoodProperties
```

**判断依据只有一条：看方法返回什么。**

```text
返回 Builder 自己  →  还能继续点，链没结束
返回别的类型      →  链结束了，拿到成品
```

而「要不要 `build()`」等价于问：**这个位置要的到底是 Builder，还是 Builder 造出来的那个东西？**

- 要 `Item.Properties` → 直接给 `new Item.Properties()...`（它本身就是那个东西）
- 要 `FoodProperties` → 给 `new FoodProperties.Builder()....build()`
- 要 `CreativeModeTab` → 给 `CreativeModeTab.builder()....build()`

一个更省事的记法：**看类名。** 名字里带 `Builder` 的，通常最后要 `.build()`；名字不带 `Builder`、但有一堆返回自己的配置方法的（`Item.Properties`、`BlockBehaviour.Properties`），通常不用。

## 四、手写一个玩具 Builder

光看别人的不够，自己写一遍就彻底懂了。这个类不依赖 Minecraft，你在普通 Java 项目里就能跑。

文件：`src/main/java/com/dafeiyu/SwordBuilder.java`

```java
package com.dafeiyu;

public class SwordBuilder {
    private int damage = 4;          // 默认攻击力
    private int durability = 250;    // 默认耐久
    private boolean fireProof = false;

    public SwordBuilder damage(int v) { this.damage = v; return this; }
    public SwordBuilder durability(int v) { this.durability = v; return this; }
    public SwordBuilder fireProof() { this.fireProof = true; return this; }

    public RubySword build() {
        return new RubySword(damage, durability, fireProof);
    }
}
```

三个配置方法，每个都是「改字段、`return this`」。一个 `build()`，把攒好的字段一次性交给真正的构造器。用起来：

```java
RubySword sword = new SwordBuilder()
        .damage(8)
        .durability(1500)
        .fireProof()
        .build();
```

对照 `Item.Properties`，你会发现结构一模一样：

| `SwordBuilder` | `Item.Properties` | 差别 |
|---|---|---|
| `damage(int)` | `stacksTo(int)` | 都是改一个字段、`return this` |
| `durability(int)` | `durability(int)` | 同名同义 |
| `fireProof()` | `fireResistant()` | 无参方法，表示「打开某个开关」 |
| `build()` 返回 `RubySword` | 没有 `build()` | 因为它自己就是成品配置 |

唯一的实质差别是最后一行：`SwordBuilder` 造的是另一个类（`RubySword`），所以需要 `build()`；`Item.Properties` 就是那个类本身，所以不需要。

> 这里你只要知道：Builder 就是「一堆 `return this` 的 setter + 一个 `build()`」。你不用会设计它，但你要能一眼认出它、能顺着链读下去、能判断链在哪结束。

## 五、模组里你会遇到的 Builder

下面这些是你在前几章就会碰到的。每个给你一行「它能配什么」，够你用就行，具体方法去 IDE 里补全看。

| Builder | 怎么开始 | 能配什么 | 要 `build()` 吗 |
|---|---|---|---|
| `Item.Properties` | `new Item.Properties()` | 堆叠数、耐久、稀有度、防火、食物、修复材料、自定义数据组件 | 不用（自身即配置） |
| `BlockBehaviour.Properties` | `BlockBehaviour.Properties.of()` | 破坏时间、抗爆、声音、光照、摩擦、是否需正确工具、随机刻 | 不用（自身即配置） |
| `FoodProperties.Builder` | `new FoodProperties.Builder()` | 营养值、饱和度系数、是否总能吃、是否快速进食、食用后效果 | **要** `build()` |
| `CreativeModeTab.Builder` | `CreativeModeTab.builder()` | 标题、图标、往标签页里塞哪些物品、排序位置 | **要** `build()` |
| `DataComponentType.Builder` | `DataComponentType.<T>builder()` | 是否持久化到存档、是否网络同步、是否缓存编码 | **要** `build()` |
| `DataComponentPatch.Builder` | `DataComponentPatch.builder()` | 给已有物品加/删某个数据组件 | **要** `build()` |

顺便澄清一个容易误会的东西：**`Component` 不是 Builder。** 你写 `Component.literal("红宝石")`、`Component.translatable("item.dafeiyu.ruby")`，这是工厂方法直接造一个不可变对象，后面没有 `build()`。它长得像链式调用只是因为 `Component` 自己也有一些返回新对象的方法（比如 `.withStyle(...)`），那是「造一个新的」，不是「改这一个」。

`DataComponentType` 那个 Builder 还有个额外的坑：它出现在 `Supplier` 里面时，泛型推断会失败，所以 NeoForge 提供了 `DeferredRegister.DataComponents` 来绕开。等你写到数据组件那一章会碰到，现在知道「有这么回事」就行。

## 六、三个坑

### 坑 1：Builder 被复用，配置串味

因为 `stacksTo` 改的是**对象自己**，所以你把同一个 `Properties` 传给两个物品，它们共享同一份配置来源：

```java
// 危险写法
Item.Properties shared = new Item.Properties().stacksTo(16);

public static final DeferredItem<Item> A = ITEMS.register("a", () -> new Item(shared));
public static final DeferredItem<Item> B = ITEMS.register("b", () -> new Item(shared.durability(100)));
```

第二行的 `.durability(100)` 改的是 `shared` 本身。而且因为两个 lambda 都捕获了同一个 `shared`，`A` 和 `B` 到底拿到什么配置，取决于注册顺序——这种「取决于执行顺序」的代码是最难查的。

`Item` 在构造时会把 `Properties` 读成数据组件，所以这个具体例子未必立刻炸；但同样的模式用在 `FoodProperties.Builder`（`build()` 之后才是成品，Builder 还留在原地可以继续改）或任何「保留引用」的 API 上，就会真的串味。

**规则：一个 Builder 只服务一个产物。** 每个物品、每个方块都写自己的 `new Item.Properties()` / `BlockBehaviour.Properties.of()`，哪怕配置完全一样。多敲几个字，换来的是「改一处不会影响别处」。

### 坑 2：漏了 `build()`

```java
// 错：food() 要 FoodProperties，你给了 Builder
new Item(new Item.Properties().food(new FoodProperties.Builder().nutrition(4)))
```

```text
error: incompatible types: FoodProperties.Builder cannot be converted to FoodProperties
```

补上 `.build()` 就好。看到「cannot be converted to Xxx」，先检查是不是漏了 `build()`。

反过来也会犯错：给不需要 `build()` 的加 `build()`。

```java
// 错：Item.Properties 没有 build() 方法
new Item(new Item.Properties().stacksTo(16).build())
```

```text
error: cannot find symbol: method build()
```

### 坑 3：顺序会互相覆盖

链式调用是「按顺序一个个改字段」，所以后面的会覆盖前面的：

```java
// durability 会把最大堆叠锁成 1，然后 stacksTo(64) 又把它改回 64
new Item.Properties().durability(250).stacksTo(64)
```

结果是一个「有耐久、又能堆 64 个」的怪东西——耐久物品堆叠起来，用坏一个掉一个，行为很反直觉。反过来写 `.stacksTo(64).durability(250)` 就没这个问题，因为 `durability` 最后把堆叠锁成 1。

**规则：先写「大范围」的设置，再写会覆盖它的设置；拿不准就按官方文档示例的顺序抄。** 常见顺序是：堆叠/耐久 → 稀有度 → 防火 → 食物 → 组件。

## 完整示例

三个文件，能直接编译。

文件：`src/main/java/com/dafeiyu/ModItems.java`

```java
package com.dafeiyu;

import net.minecraft.world.food.FoodProperties;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;
import net.neoforged.neoforge.registries.DeferredItem;
import net.neoforged.neoforge.registries.DeferredRegister;

public class ModItems {
    public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems("dafeiyu");

    // 一条链改同一个 Properties：先堆叠，再稀有度
    public static final DeferredItem<Item> RUBY = ITEMS.register("ruby",
            () -> new Item(new Item.Properties()
                    .stacksTo(16)
                    .rarity(Rarity.RARE)));

    // 耐久物品：durability 会自动把堆叠锁成 1，所以不要再写 stacksTo
    public static final DeferredItem<Item> RUBY_SWORD = ITEMS.register("ruby_sword",
            () -> new Item(new Item.Properties()
                    .durability(1500)
                    .rarity(Rarity.RARE)
                    .fireResistant()));

    // 食物：FoodProperties.Builder 必须 build()，拿到成品再交给 food()
    public static final DeferredItem<Item> RUBY_APPLE = ITEMS.register("ruby_apple",
            () -> new Item(new Item.Properties()
                    .food(new FoodProperties.Builder()
                            .nutrition(6)
                            .saturationMod(0.8f)
                            .alwaysEdible()
                            .build())));
}
```

文件：`src/main/java/com/dafeiyu/ModCreativeTabs.java`

```java
package com.dafeiyu;

import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.ItemStack;
import net.neoforged.neoforge.registries.DeferredHolder;
import net.neoforged.neoforge.registries.DeferredRegister;

public class ModCreativeTabs {
    public static final DeferredRegister<CreativeModeTab> TABS =
            DeferredRegister.create(Registries.CREATIVE_MODE_TAB, "dafeiyu");

    // CreativeModeTab.builder() 也是 Builder，链的最后必须 build()
    public static final DeferredHolder<CreativeModeTab, CreativeModeTab> RUBY_TAB = TABS.register("ruby",
            () -> CreativeModeTab.builder()
                    .title(Component.translatable("itemGroup.dafeiyu.ruby"))
                    .icon(() -> new ItemStack(ModItems.RUBY.get()))
                    .displayItems((params, output) -> {
                        output.accept(ModItems.RUBY.get());
                        output.accept(ModItems.RUBY_SWORD.get());
                        output.accept(ModItems.RUBY_APPLE.get());
                    })
                    .build());
}
```

文件：`src/main/java/com/dafeiyu/SwordBuilder.java`（玩具示例，可选）

```java
package com.dafeiyu;

public class SwordBuilder {
    private int damage = 4;
    private int durability = 250;
    private boolean fireProof = false;

    public SwordBuilder damage(int v) { this.damage = v; return this; }
    public SwordBuilder durability(int v) { this.durability = v; return this; }
    public SwordBuilder fireProof() { this.fireProof = true; return this; }

    public String build() {
        // 真实项目里这里 return new RubySword(damage, durability, fireProof);
        return "剑：攻击力 " + damage + "，耐久 " + durability + "，防火 " + fireProof;
    }

    public static void main(String[] args) {
        System.out.println(new SwordBuilder().damage(8).durability(1500).fireProof().build());
        // 输出：剑：攻击力 8，耐久 1500，防火 true
    }
}
```

## 常见坑与报错

| 现象 | 原因 | 解决 |
|---|---|---|
| `cannot find symbol: method build()` | 给不需要 `build()` 的配置类（`Item.Properties`、`BlockBehaviour.Properties`）加了 `build()` | 去掉 `.build()`，它本身就是成品 |
| `incompatible types: FoodProperties.Builder cannot be converted to FoodProperties` | 漏了 `build()` | 在链尾加 `.build()` |
| 两个物品的属性互相影响，改一个另一个也变 | 复用了同一个 `Properties` / Builder 实例 | 每个产物都 `new` 一个，不复用 |
| 物品能堆 64 个又有耐久，行为怪异 | `durability` 之后又调了 `stacksTo`，后者覆盖了「锁 1」 | 调整顺序，或去掉 `stacksTo` |
| `cannot find symbol: method stacksTo(int)` 在 `BlockBehaviour.Properties` 上 | 用错了 Builder，`stacksTo` 是 `Item.Properties` 的方法 | 方块用 `destroyTime` / `explosionResistance`，物品才用 `stacksTo` |
| 链式调用中途报「找不到方法」 | 上一个方法返回的不是 Builder 自己（比如已经 `.build()` 了） | 把 `.build()` 挪到链的最后 |
| `Item.Properties` 上写 `.food(new FoodProperties.Builder().nutrition(4))` 报类型错 | 同上，漏 `build()` | 加 `.build()` |

## 练习

**1.（易）** 下面这行，`stacksTo` 返回的是什么类型？为什么能接着点 `rarity`？

```java
new Item.Properties().stacksTo(16).rarity(Rarity.RARE)
```

<details>
<summary>答案</summary>

`stacksTo` 返回 `Item.Properties`（也就是 `this`，它自己）。因为它返回的是同一个对象，所以还能继续在这个对象上调用 `rarity`。

整条链的结果是**同一个** `Item.Properties` 对象被改了两次，不是造了三个对象。

</details>

**2.（中）** 下面两段代码，哪段有问题？说明原因和修法。

```java
// A
Item.Properties p = new Item.Properties().stacksTo(16);
DeferredItem<Item> a = ITEMS.register("a", () -> new Item(p));
DeferredItem<Item> b = ITEMS.register("b", () -> new Item(p.durability(100)));

// B
DeferredItem<Item> a = ITEMS.register("a", () -> new Item(new Item.Properties().stacksTo(16)));
DeferredItem<Item> b = ITEMS.register("b", () -> new Item(new Item.Properties().durability(100)));
```

<details>
<summary>答案</summary>

A 有问题。两个 lambda 捕获了同一个 `p`，而 `p.durability(100)` 会修改 `p` 本身并返回 `p`。于是 `b` 的配置会污染 `a` 看到的配置，而且最终结果取决于两个 lambda 谁先被调用（注册顺序）。这种「隐式共享 + 顺序依赖」是最难排查的一类 bug。

B 没问题。每个 lambda 里都 `new` 了一个独立的 `Properties`，互不影响。

修法：A 改成 B 的形式——一个 Builder 只服务一个产物。

</details>

**3.（难）** 有人想要「能堆 16 个、有 1500 耐久、防火、稀有」的红宝石剑，写了下面这行。找出所有问题。

```java
new Item.Properties().durability(1500).stacksTo(16).fireResistant().rarity(Rarity.RARE)
```

<details>
<summary>答案</summary>

问题在 `.stacksTo(16)`：`durability(1500)` 会把最大堆叠数量锁成 1（耐久物品不能堆叠），紧接着的 `stacksTo(16)` 又把它改回 16。结果是一个「能堆 16 个又有耐久」的物品，用坏一个掉一个，行为和原版所有工具都不一样，很容易在后续逻辑里出问题。

正确写法是去掉 `stacksTo(16)`：

```java
new Item.Properties()
        .durability(1500)
        .fireResistant()
        .rarity(Rarity.RARE)
```

顺带一个知识点：真正让物品「有耐久」的不只是 `MAX_DAMAGE` 组件，还要 `Item` 类本身支持（原版用 `TieredItem` / `SwordItem` 之类）。这里用裸 `Item` 只是演示配置，做真剑要到工具与盔甲那一章用专门的类。

</details>

## 参考

- 官方文档·物品（`Item.Properties` 各方法说明）：https://docs.neoforged.net/docs/1.21.1/items/
- 官方文档·食物（`FoodProperties.Builder`）：https://docs.neoforged.net/docs/1.21.1/items/#food
- 官方文档·方块（`BlockBehaviour.Properties`）：https://docs.neoforged.net/docs/1.21.1/blocks/
- 官方文档·数据组件（`DataComponentType.Builder`）：https://docs.neoforged.net/docs/1.21.1/items/datacomponents
- 上一篇：[双冒号与方法引用](02-双冒号与方法引用.md)
- 总览：[教程总览与学习路线](../00-教程总览与学习路线.md)

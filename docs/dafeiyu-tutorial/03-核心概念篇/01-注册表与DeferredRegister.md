---
title: "注册表与 DeferredRegister"
order: 1
difficulty: 入门
prerequisites: ["准备篇：工程结构与主类", "Java 补充篇：Supplier 与 Builder 模式"]
---

# 注册表与 DeferredRegister

> 读完这一篇，你能给自己的模组加进第一个真正"存在于游戏里"的物品，并且能说清那三行注册代码每一行到底在干什么。

## 学习目标

- 能说清"注册"解决了什么问题，为什么 `new Item(...)` 之后游戏依然不认这个物品
- 能默写 `DeferredRegister` 的三件套：创建、`register` 条目、在模组构造器里 `register(modEventBus)`
- 能读懂 `DeferredRegister.Items` 与 `DeferredRegister.Blocks` 的便利方法，并知道每个方法等价于哪句"笨写法"
- 能判断什么时候可以安全调用 `.get()`，什么时候调了必然崩

## 一、先看一段"看起来没毛病"的代码

假设你刚学完 Java，兴致勃勃地写下这个：

文件：`src/main/java/com/dafeiyu/ModItems.java`

```java
package com.dafeiyu;

import net.minecraft.world.item.Item;

public class ModItems {
    // 我 new 了一个物品，它就在这儿，怎么会没有呢？
    public static final Item RUBY = new Item(new Item.Properties());
}
```

编译通过，没有任何红线。启动游戏，输入 `/give @s dafeiyu:ruby`，游戏回你一句"未知的物品"。你打开创造模式物品栏，也没有。你甚至写了个命令方块去检测它，依然什么都没有。

问题不在 Java，在于你少做了一件事：**你没告诉游戏"有这么个东西"**。

Java 的 `new` 只是在内存里造了一个对象。而 Minecraft 需要的不是"一个对象"，是"一个**有编号**、**能被存档记录**、**能被客户端和服务端同时认出来**的对象"。这个"编号 + 对象的对照表"，就是注册表（registry）。

## 二、注册表到底是什么

一句话：**注册表就是一张 `编号 → 对象` 的 Map**。

```text
注册表 ITEM（简化）
┌────────────────────────────┬──────────────────────────────┐
│ 键（ResourceLocation）      │ 值（Item 实例）               │
├────────────────────────────┼──────────────────────────────┤
│ minecraft:air              │ AirItem 实例                  │
│ minecraft:dirt             │ BlockItem(dirt) 实例          │
│ minecraft:diamond_sword    │ SwordItem 实例                │
│ dafeiyu:ruby               │ 你的 Ruby 实例                │
└────────────────────────────┴──────────────────────────────┘
```

这个"键"，就是**注册名**（registry name），在 1.21 里统一用 `ResourceLocation` 表示，形如 `命名空间:路径`。你的模组所有注册名都以 `dafeiyu:` 开头。资源位置的细节见[下一篇](04-资源位置与命名空间.md)。

有了这张表，很多事情才成立：

| 场景 | 靠什么找到你的物品 |
|---|---|
| 存档里存了一个物品 | 存的是 `dafeiyu:ruby` 这个字符串，读档时拿它去表里查 |
| 客户端显示手上的物品 | 服务端发来 `dafeiyu:ruby` 的编号，客户端查表得到同一个实例 |
| 配方 JSON 里写原料 | 写 `"item": "dafeiyu:ruby"` |
| 标签文件 `#dafeiyu:gems` | 里面列的是注册名 |
| `/give` 命令补全 | 遍历注册表的所有键 |

所以关键点来了：**游戏里一切"跨存档、跨端、跨文件"的引用，靠的都是注册名，而不是 Java 对象引用**。你 `new` 出来的那个对象没有注册名，游戏根本没法在存档里写它，也没法在网络上发它。

### 为什么不能"只 new"

把上面那句话展开，有四个具体原因：

1. **单例（singleton）**。整个游戏里，`dafeiyu:ruby` 这个物品永远只存在一个实例。你背包里那 64 个红宝石，是同一个 `Item` 实例被引用了 64 次。如果你自己 `new` 了两个，`stack.getItem() == ModItems.RUBY` 这种判断就会莫名其妙地失败。
2. **需要 id**。存档、网络包、配方、标签、模型文件，全都要靠注册名对齐。
3. **注册表有"冻结"机制**。注册不是随时能做的，游戏在启动的某个窗口期内允许你往表里塞东西，窗口一关（冻结），你再塞就崩。这个窗口就是**注册阶段**。
4. **两端必须对得上**。服务端说"这是第 1024 号物品"，客户端必须知道 1024 号是哪个物品。只有两端都按同样的规则注册，编号才能对上。

这也解释了为什么方块那篇文档里会写"不要在注册之外调用 `new Block()`"：你手上那个游离实例，游戏同步和保存时都不认识，最后会把它替换成空气。

## 三、注册表都放在哪

写代码时你会碰到三组入口，别混：

| 位置 | 里面是什么 | 例子 |
|---|---|---|
| `BuiltInRegistries` | 原版（Minecraft 自带）的注册表实例 | `BuiltInRegistries.ITEM`、`BuiltInRegistries.BLOCK` |
| `Registries` | 原版注册表的**键**（`ResourceKey<Registry<T>>`），注册时用 | `Registries.ITEM`、`Registries.BLOCK` |
| `NeoForgeRegistries` | NeoForge 自己加的注册表 | `NeoForgeRegistries.Keys.ATTACHMENT_TYPES` |

记法很简单：**`Registries.XXX` 是"表的名字"，`BuiltInRegistries.XXX` 是"表本身"**。注册时你要提供表的名字，查询时你要用表本身。

最常用的几张表：

```text
Registries.ITEM                 物品
Registries.BLOCK                方块
Registries.BLOCK_ENTITY_TYPE   方块实体类型
Registries.ENTITY_TYPE          实体类型
Registries.MENU                 GUI 菜单
Registries.MOB_EFFECT           状态效果
Registries.SOUND_EVENT          声音事件
Registries.CREATIVE_MODE_TAB    创造模式标签页
Registries.DATA_COMPONENT_TYPE  数据组件类型（见第 5 篇）
Registries.RECIPE_TYPE          配方类型
```

## 四、DeferredRegister 三件套

NeoForge 提供了两种注册方式：`DeferredRegister` 和 `RegisterEvent`。后者是底层机制，前者是对它的封装。**日常开发一律用 `DeferredRegister`**，因为手写 `RegisterEvent` 极容易漏、极容易在错误的时机碰注册表。

"Deferred"是"延迟"的意思。为什么需要延迟？因为你的 `ModItems` 类会在某个不确定的时刻被类加载，而注册必须发生在游戏规定的窗口内。`DeferredRegister` 做的事就是：**你先登记"我要注册这些东西"，等游戏喊"该注册了"，它再统一交上去**。

### 第一件：创建

文件：`src/main/java/com/dafeiyu/registry/ModItems.java`

```java
package com.dafeiyu.registry;

import com.dafeiyu.DafeiyuMod;
import net.minecraft.core.registries.Registries;
import net.minecraft.world.item.Item;
import net.neoforged.neoforge.registries.DeferredRegister;

public class ModItems {
    // 通用写法：指定"哪张表" + "哪个命名空间"
    public static final DeferredRegister<Item> ITEMS =
            DeferredRegister.create(Registries.ITEM, DafeiyuMod.MOD_ID);
}
```

`DeferredRegister.create(表, 命名空间)` 的两个参数：

- 第一个是注册表的键，物品就是 `Registries.ITEM`；
- 第二个是你的 modid，将来所有注册名都会自动加上 `dafeiyu:` 前缀。

这个字段必须是 `public static final`，并且**只创建一次**。它是你这个模组所有物品的"登记处"，重复创建会导致同一个物品被登记两次，直接崩。

### 第二件：登记条目

```java
public static final DeferredItem<Item> RUBY =
        ITEMS.register("ruby", () -> new Item(new Item.Properties()));
```

拆开看这一行：

- `ITEMS.register(...)`：往登记处里加一条；
- `"ruby"`：路径部分，最终注册名是 `dafeiyu:ruby`（命名空间自动补）；
- `() -> new Item(...)`：一个 `Supplier<Item>`，也就是"等会儿再创建"的工厂。这里用到了 Lambda，读不懂的话先看 [注册代码里的泛型与 Supplier](../02-Java补充篇/01-注册代码里的泛型与Supplier.md)，再回来看。
- 返回值 `DeferredItem<Item>`：一个"占位符"，真正对象要等注册完成后才有。

注意第二个参数为什么是 `() -> new Item(...)` 而不是直接 `new Item(...)`：因为**这句话执行的时候，注册窗口还没开**。你现在就把对象造出来，等于在窗口外注册，必崩。用 Supplier 包一层，就把"造对象"这个动作推迟到窗口内。

### 第三件：在构造器里挂上总线

前两件做完，`DeferredRegister` 还只是一份"待办清单"，没人来收。你必须在模组主类的构造器里，把它交给**模组事件总线**：

文件：`src/main/java/com/dafeiyu/DafeiyuMod.java`

```java
package com.dafeiyu;

import com.dafeiyu.registry.ModItems;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.common.Mod;

@Mod(DafeiyuMod.MOD_ID)
public class DafeiyuMod {
    public static final String MOD_ID = "dafeiyu";

    public DafeiyuMod(IEventBus modEventBus, ModContainer modContainer) {
        // 把物品登记处挂到模组总线上，游戏会在注册阶段来取
        ModItems.ITEMS.register(modEventBus);
    }
}
```

这里有个新手必踩的坑：**`ITEMS.register(modEventBus)` 和 `ITEMS.register("ruby", ...)` 是两个完全不同的方法，只是重名（重载）**。

| 写法 | 参数 | 作用 |
|---|---|---|
| `ITEMS.register("ruby", supplier)` | 字符串 + Supplier | 登记一个条目 |
| `ITEMS.register(modEventBus)` | `IEventBus` | 把整张登记表挂到总线上 |

漏掉第二句，后果是：编译通过、游戏能启动、`/give` 说"未知物品"、创造栏里空空如也、日志里一句报错都没有。这是本教程里最"安静"的 bug 之一，务必记住。

### 完整时间线

```text
① 你的 ModItems 类被类加载
   → 创建 DeferredRegister（只是一张空清单）
   → 每个 register(...) 只是往清单里加一行"名字 + 工厂"

② 模组构造器执行
   → ITEMS.register(modEventBus)：把清单交给总线

③ 游戏进入注册阶段，触发 RegisterEvent（每个注册表一次）
   → DeferredRegister 收到通知，逐条调用你的 Supplier
   → new Item(...) 此刻才真正执行
   → 对象被放进注册表，占位符 DeferredHolder 被"填上值"

④ 注册表冻结
   → 从此再也不能往表里加东西

⑤ 游戏正常运行
   → .get() 可以安全调用，拿到那个唯一实例
```

## 五、DeferredRegister.Items 与 DeferredRegister.Blocks

物品和方块太常用了，NeoForge 给它们各做了一个专用子类，省掉一堆样板代码。

### DeferredRegister.Items

```java
// 创建：注意是 createItems，不是 create
public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems(DafeiyuMod.MOD_ID);
```

它比通用版多了四个方法：

```java
// 1. registerItem：把 properties 自动塞进工厂
public static final DeferredItem<Item> RUBY = ITEMS.registerItem(
        "ruby",
        Item::new,                 // 工厂：接收一个 Item.Properties
        new Item.Properties()      // 要用的 properties
);
// 等价于：ITEMS.register("ruby", () -> new Item(new Item.Properties()))

// 2. registerSimpleItem：工厂就是 Item::new 时，直接省略工厂
public static final DeferredItem<Item> RUBY_DUST = ITEMS.registerSimpleItem("ruby_dust");
// 也可以传 properties：registerSimpleItem("ruby_dust", new Item.Properties().stacksTo(16))

// 3. registerSimpleBlockItem：给方块顺手注册对应的 BlockItem
public static final DeferredItem<BlockItem> RUBY_BLOCK_ITEM =
        ITEMS.registerSimpleBlockItem(ModBlocks.RUBY_BLOCK);
// 省略名字时，自动用方块的注册名（这里是 ruby_block）

// 4. 上面这些都有省略 properties 的重载
public static final DeferredItem<Item> RUBY_INGOT = ITEMS.registerItem("ruby_ingot", Item::new);
```

第 3 个方法特别值得记：**方块和"方块的物品形式"是两回事**。世界里的方块在 `BLOCK` 表，背包里那个能拿在手上的东西是 `BlockItem`，在 `ITEM` 表。所以每个要能被捡起来的方块，都得额外注册一个 `BlockItem`。`registerSimpleBlockItem` 就是干这个的，它还会自动帮你把名字对齐（`ruby_block` 方块 → `ruby_block` 物品）。

### DeferredRegister.Blocks

```java
public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks(DafeiyuMod.MOD_ID);

// registerBlock：properties 自动塞进工厂
public static final DeferredBlock<Block> RUBY_BLOCK = BLOCKS.registerBlock(
        "ruby_block",
        Block::new,
        BlockBehaviour.Properties.of().strength(3.0f).requiresCorrectToolForDrops()
);

// registerSimpleBlock：工厂是 Block::new 时省略
public static final DeferredBlock<Block> RUBY_ORE = BLOCKS.registerSimpleBlock(
        "ruby_ore",
        BlockBehaviour.Properties.of().strength(3.0f)
);
```

`DeferredRegister.Blocks` 的 `register` 返回的是 `DeferredBlock<T>`，它继承自 `DeferredHolder<Block, T>`。这个类型信息很有用：注册 `SlabBlock` 时写 `DeferredBlock<SlabBlock>`，之后 `.get()` 拿到的就是 `SlabBlock`，不用强转。

> 顺序提醒：如果你的方块和物品分在两个类里，**物品类里引用方块时要保证方块类先被类加载**。最简单可靠的做法是让 `ModItems` 里出现 `ModBlocks.RUBY_BLOCK` 这个引用——Java 会在解析这个字段时先初始化 `ModBlocks`。

## 六、DeferredHolder 与 `.get()` 的时机

`register` 返回的东西，类型是这样的：

```text
DeferredHolder<R, T extends R>     ← 最通用
   ├── DeferredItem<T extends Item>      ← DeferredRegister.Items 返回
   └── DeferredBlock<T extends Block>    ← DeferredRegister.Blocks 返回
```

- 第一个类型参数 `R`：这张表的元素类型（物品表就是 `Item`）；
- 第二个 `T`：你实际注册的具体类（`Item`、`SwordItem`、`SlabBlock`……）。

它实现了 `Supplier<T>`，所以：

```java
Item ruby = ModItems.RUBY.get();      // 拿到实例
```

**什么时候能调 `.get()`？** 一句话：**在注册完成之后**。具体来说：

| 时机 | 能不能 `.get()` | 说明 |
|---|---|---|
| `ModItems` 的静态字段初始化中 | 不能 | 此时连清单都没交上去 |
| 模组构造器里 | 不能 | 注册阶段还没开始 |
| `FMLCommonSetupEvent` 及之后 | 能 | 注册已完成 |
| 事件处理器里（玩家交互、tick 等） | 能 | 游戏早就跑起来了 |
| `Item` 的构造函数里（间接） | 能 | 构造发生在注册过程中，表里已有本条 |

在不能的时候调，`DeferredHolder#get()` 会抛 `NullPointerException`，信息大概是 "Registry entry not present"，然后游戏在启动阶段就崩了。你会在日志里看到一长串堆栈，最顶上是你自己的类名——这算是好事，至少它大声告诉你了。

另外，`DeferredHolder` 还提供了：

```java
ModItems.RUBY.getId();       // ResourceLocation: dafeiyu:ruby
ModItems.RUBY.getKey();      // ResourceKey<Item>
ModItems.RUBY.isPresent();   // 是否已绑定（注册完成后恒为 true）
```

`.getId()` 在你需要动态拼资源位置时很有用，比如给一堆物品批量生成模型路径。

## 完整示例

五个文件，直接落盘即可运行（还需要 `neoforge.mods.toml` 和 `build.gradle`，见准备篇）。

**① 主类**

文件：`src/main/java/com/dafeiyu/DafeiyuMod.java`

```java
package com.dafeiyu;

import com.dafeiyu.registry.ModItems;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.ModContainer;
import net.neoforged.fml.common.Mod;

@Mod(DafeiyuMod.MOD_ID)
public class DafeiyuMod {
    public static final String MOD_ID = "dafeiyu";

    public DafeiyuMod(IEventBus modEventBus, ModContainer modContainer) {
        // 这一行漏了，全篇代码都白写
        ModItems.ITEMS.register(modEventBus);
    }
}
```

**② 物品注册类**

文件：`src/main/java/com/dafeiyu/registry/ModItems.java`

```java
package com.dafeiyu.registry;

import com.dafeiyu.DafeiyuMod;
import net.minecraft.world.food.FoodProperties;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;
import net.neoforged.neoforge.registries.DeferredItem;
import net.neoforged.neoforge.registries.DeferredRegister;

public class ModItems {
    public static final DeferredRegister.Items ITEMS =
            DeferredRegister.createItems(DafeiyuMod.MOD_ID);

    // 最普通的一个物品：堆叠 64，无特殊属性
    public static final DeferredItem<Item> RUBY =
            ITEMS.registerSimpleItem("ruby");

    // 带属性的物品：最多叠 16 个，稀有度 RARE（名字显示为青色）
    public static final DeferredItem<Item> BIG_RUBY = ITEMS.registerSimpleItem(
            "big_ruby",
            new Item.Properties()
                    .stacksTo(16)
                    .rarity(Rarity.RARE)
    );

    // 食物：恢复 4 点饥饿值，饱和度系数 0.3，且任何时候都能吃
    public static final DeferredItem<Item> RUBY_APPLE = ITEMS.registerSimpleItem(
            "ruby_apple",
            new Item.Properties()
                    .food(new FoodProperties.Builder()
                            .nutrition(4)
                            .saturationMod(0.3f)
                            .alwaysEdible()
                            .build())
    );
}
```

**③ 一个自定义物品类（演示 `DeferredItem<具体子类>`）**

文件：`src/main/java/com/dafeiyu/item/RubySwordItem.java`

```java
package com.dafeiyu.item;

import net.minecraft.world.item.Item;

public class RubySwordItem extends Item {
    public RubySwordItem(Properties properties) {
        super(properties);
    }
    // 具体功能后面章节再填
}
```

**④ 把它注册进去（加在 `ModItems` 里）**

```java
public static final DeferredItem<RubySwordItem> RUBY_SWORD = ITEMS.registerItem(
        "ruby_sword",
        RubySwordItem::new,                     // 工厂类型是 RubySwordItem
        new Item.Properties().stacksTo(1)
);
```

注意这里的 `DeferredItem<RubySwordItem>`：泛型第二个参数写具体子类，之后 `ModItems.RUBY_SWORD.get()` 直接就是 `RubySwordItem`，不用强转。这就是泛型在模组代码里最常见的用处。

**⑤ 语言文件（不然显示的是 `item.dafeiyu.ruby`）**

文件：`src/main/resources/assets/dafeiyu/lang/zh_cn.json`

```json
{
  "item.dafeiyu.ruby": "红宝石",
  "item.dafeiyu.big_ruby": "大块红宝石",
  "item.dafeiyu.ruby_apple": "红宝石苹果",
  "item.dafeiyu.ruby_sword": "红宝石剑"
}
```

启动游戏，`/give @s dafeiyu:ruby` 应该能拿到了。此时它还没有纹理（会显示紫黑格），那是资源包的事，见第 4 篇。

## 常见坑与报错

| 现象 | 原因 | 解决 |
|---|---|---|
| `/give` 说"未知物品"，日志无报错 | 忘了 `ModItems.ITEMS.register(modEventBus)` | 在模组构造器里补上 |
| 启动崩，`NullPointerException: Registry entry not present` | 在静态初始化 / 构造器里调了 `.get()` | 把 `.get()` 移到事件里，或改用 `Supplier` 传下去 |
| 启动崩，`IllegalStateException: Registry is already frozen` | 在注册窗口外 `new` 或注册 | 检查是否有静态代码块在乱注册 |
| 两个物品互相覆盖 / 只有一个生效 | 用了同一个路径名 | 注册名必须唯一，改 `"ruby"` 为 `"ruby_2"` |
| 方块放下来是空气 | 只注册了 `Block`，没注册 `BlockItem` | 用 `registerSimpleBlockItem` 补一个 |
| 编译报"找不到符号 `DeferredItem`" | 导错了包 | 应该是 `net.neoforged.neoforge.registries.DeferredItem` |
| 中文名显示成 `item.dafeiyu.ruby` | 语言文件路径或键写错 | 路径必须是 `assets/dafeiyu/lang/zh_cn.json`，键是 `item.<modid>.<注册路径>` |
| 物品能拿到但没有纹理 | 缺模型和纹理 | 见[资源位置](04-资源位置与命名空间.md)与资源篇 |

## 练习

1. **热身**：注册一个 `dafeiyu:ruby_nugget`，要求最多堆叠 64 个，并补上中英文语言键。
2. **进阶**：注册一个 `dafeiyu:ruby_ore` 方块（`strength(3.0f)`），同时让它能在背包里拿到。想想你需要几个注册类、几个 `DeferredRegister`、几句 `register(modEventBus)`。
3. **思考**：如果把 `ModItems.ITEMS.register(modEventBus)` 从构造器里删掉，但保留所有 `register("xxx", ...)` 调用，游戏会崩还是会静默失败？为什么？先自己猜，再动手验证。

## 参考

- 本教程译文：[注册表](/docs/neoforge-1.21.1/02-核心概念/02-注册表.md)
- 本教程译文：[物品](/docs/neoforge-1.21.1/04-物品/01-物品.md)（`DeferredRegister.Items` 一节）
- 本教程译文：[方块](/docs/neoforge-1.21.1/03-方块/01-方块.md)（`DeferredRegister.Blocks` 一节）
- 官方文档：https://docs.neoforged.net/docs/1.21.1/concepts/registries
- 官方文档：https://docs.neoforged.net/docs/1.21.1/items/

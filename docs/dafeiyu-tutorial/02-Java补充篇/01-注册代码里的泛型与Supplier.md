---
title: "注册代码里的泛型与Supplier"
order: 1
difficulty: 入门
prerequisites: ["创建并运行第一个模组"]
---

# 注册代码里的泛型与Supplier

> 读完这篇，你能把注册物品那一行拆成四块，逐块说出它在干什么，并且明白为什么这里必须写 `() -> new Item(...)`，而不能直接 `new`。

## 学习目标

- 能读懂 `DeferredItem<Item> RUBY = ITEMS.register("ruby", () -> new Item(...))` 这一行的每个部分
- 能说出 `DeferredItem<Item>` 和 `DeferredBlock<Block>` 的尖括号里为什么写的东西不一样
- 能解释取用时为什么必须 `.get()`，不写会报什么错
- 能解释注册时为什么要包一层 `() ->`（也就是 Supplier），直接 `new` 会出什么事
- 看到 `Supplier<X>`、`Consumer<X>`、`Function<A,B>`、`Predicate<X>` 时，能一句话读出它的意思

## 先看这段代码

你新建一个物品，写出来的东西长这样。

文件：`src/main/java/com/dafeiyu/ModItems.java`

```java
public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems("dafeiyu");
public static final DeferredItem<Item> RUBY = ITEMS.register("ruby", () -> new Item(new Item.Properties()));
```

一个普通 Java 教程教过你 `public static final`、教过你 `new`、教过你方法调用。但这行里有四块东西它没教过：

```text
DeferredRegister . Items        ← 点后面跟一个大写开头的名字，这是什么？
DeferredItem < Item >           ← 尖括号里塞了个类型，什么意思？
ITEMS.register("ruby", () -> …) ← 括号里那个没有名字的东西是什么？
RUBY.get()                      ← 明明 RUBY 就是物品，为什么还要 get？
```

我们一块一块来。顺序是：先认类型（尖括号），再认那个 lambda，最后讲为什么要 lambda。

## 一、`DeferredRegister.Items` 里那个 `.Items`

`DeferredRegister` 是一个类。Java 允许你把一个类写在另一个类的里面，这种写在里面的类叫「嵌套类（nested class）」。写出来的时候用点号连起来：`外面那个类.里面那个类`。

所以 `DeferredRegister.Items` 读作「`DeferredRegister` 这个类里面，那个叫 `Items` 的类」。它不是什么字段、不是什么方法，就是一个类名，只不过这个类恰好住在另一个类里面。

NeoForge 为什么要这么安排？因为 `DeferredRegister.Items` 是专门给物品用的版本，它比通用的 `DeferredRegister` 多几个方便方法（`registerItem`、`registerSimpleItem`、`registerSimpleBlockItem`）。把它塞在 `DeferredRegister` 里面，是为了让你一看就知道「这是 `DeferredRegister` 的一个变种」，而不是另外去记一个叫 `ItemsDeferredRegister` 的新名字。

> 这里你只要知道：`A.B` 这种写法，`B` 可能是 `A` 里面的类，也可能是 `A` 里面的静态字段。看到大写开头、又被当成类型用（比如 `DeferredRegister.Items ITEMS`），那就是类。嵌套类怎么写、能不能访问外部类的字段，暂时不用管。

同理，`DeferredRegister.Blocks` 就是 `DeferredRegister` 里面那个管方块的版本，用 `DeferredRegister.createBlocks("dafeiyu")` 创建。两个类长得对称，用法也对称。

## 二、`<Item>` 是什么：给盒子贴标签

现在看 `DeferredItem<Item>`。

`DeferredItem` 你可以想成一个「盒子」，盒子里装着一个物品。但盒子有很多种，装物品的、装方块的、装声音的。尖括号就是贴在盒子上的标签，写明「这个盒子装的是哪一类东西」。

```java
DeferredItem<Item>  RUBY        // 装物品的盒子，里面是 Item
DeferredItem<SwordItem> SWORD   // 装物品的盒子，里面是 SwordItem（Item 的子类）
DeferredBlock<Block> RUBY_BLOCK // 装方块的盒子，里面是 Block
```

三行摆在一起看，规律立刻就出来了：**尖括号里写的是「里面装什么」，盒子名字写的是「这是什么盒子」**。`DeferredItem` 永远只能装 `Item` 那一族的东西，`DeferredBlock` 永远只能装 `Block` 那一族的东西，你写 `DeferredBlock<Item>` 编译器直接不让你过。

这套写法叫「泛型（generics）」。`DeferredItem<T>` 里的 `T` 是占位符，你在用的时候把它填成具体类型。填进去之后，编译器就替你记住了：从这个盒子里 `get()` 出来的东西，一定是 `Item`，你可以直接调用 `Item` 的方法，不用强转。

真实的继承关系是这样的（`DeferredItem` 和 `DeferredBlock` 都是 `DeferredHolder` 的简化版）：

```java
DeferredItem<T extends Item>   extends DeferredHolder<Item, T>
DeferredBlock<T extends Block> extends DeferredHolder<Block, T>
```

`extends` 后面那个 `<Item, T>` 里的 `Item` 是「这个注册表本身装什么」，`T` 是「你实际注册的那个具体类」。所以你写 `DeferredItem<SwordItem>` 时，第一个参数仍然是 `Item`，第二个才是 `SwordItem`。这一层你现在不用背，只要知道「有两个参数、第一个是注册表类型」就够了。

还有一个小符号你会经常见到：`? extends T`。

`DeferredRegister.register` 的真实签名是：

```java
public <T extends Item> DeferredItem<T> register(String name, Supplier<? extends T> sup)
```

`Supplier<? extends T>` 里的 `? extends T`，你读成「**T 或者 T 的子类**」就行。它允许你把「造 `SwordItem` 的供应商」传给一个声明要「造 `Item` 的供应商」的参数——因为 `SwordItem` 是 `Item` 的子类，造出来的东西当 `Item` 用完全没问题。

> 这里你只要知道：`? extends X` = 「X 或 X 的子类」，见到就这么读。`? super X`（下界）在模组代码里极少出现，暂时不用管；怎么写一个自己的泛型类、泛型方法，也不用管——你要做的是**读**，不是设计。

## 三、`RUBY` 不是 `Item`，所以必须 `.get()`

这是新手最容易卡住的一点：`RUBY` 明明就是红宝石物品，为什么到处都要写 `ModItems.RUBY.get()`？

因为 `RUBY` 的**类型**是 `DeferredItem<Item>`，不是 `Item`。它是那个「盒子」，不是盒子里的东西。

```java
ModItems.RUBY        // 类型：DeferredItem<Item>   —— 一张取货单
ModItems.RUBY.get()  // 类型：Item                —— 真正的货
```

所以下面这些写法，哪些对哪些错：

```java
// 错：ItemStack 的构造器要的是 Item，你给了一张取货单
new ItemStack(ModItems.RUBY);

// 对
new ItemStack(ModItems.RUBY.get());

// 错：is() 要的是 Item
stack.is(ModItems.RUBY);

// 对
stack.is(ModItems.RUBY.get());
```

报错大概是这个样子，看到它就说明你漏了 `get()`：

```text
error: no suitable constructor found for ItemStack(DeferredItem<Item>)
error: incompatible types: DeferredItem<Item> cannot be converted to Item
```

那反过来，什么时候**不用** `get()`？当对方要的就是「一个能给出 Item 的东西」时。因为 `DeferredItem` 本身就是一个 Supplier（下一节讲），所以参数类型写 `Supplier<Item>` 的地方，你可以直接把 `ModItems.RUBY` 传进去。判断标准很简单：**看对方要的是 `Item` 还是 `Supplier<Item>`**。前者 `.get()`，后者不用。

还有一个时机问题：`get()` 不是随时都能调的。它要等注册真正完成（`RegisterEvent` 跑完）之后才有东西可取。你在静态初始化块里、在模组构造器里就 `get()`，拿到的会是空或者直接抛异常。所以经验法则是：**`get()` 只写在「游戏已经跑起来之后才会执行」的代码里**——事件处理、`use` 方法、`appendHoverText`，都没问题；字段初始化的那一行，不行。

## 四、`() -> new Item(...)` 是什么

回到这一行：

```java
ITEMS.register("ruby", () -> new Item(new Item.Properties()));
```

第二个参数是 `() -> new Item(new Item.Properties())`。它没有名字，没有 `return`，只有一个箭头。这叫「lambda 表达式（lambda expression）」，你可以把它整个当成**一个值**来看待——就像 `16` 是一个值、`"ruby"` 是一个值一样，这一串也是一个值，只不过它的「值」是**一段行为**。

具体到这一串，它的行为是：

```text
不接收任何参数（括号里是空的）
被调用时，执行 new Item(new Item.Properties())
把造出来的 Item 返回出去
```

换句话说，它是一个「**没有参数、调用后返回一个 Item**」的东西。这种东西在 Java 里有个正式名字：`Supplier<Item>`（供应者）。lambda 只是写它的简写形式。

如果不用 lambda，等价的老写法是这样（你会在这个教程以外的老代码里见到）：

```java
// 匿名内部类写法，和上面的 lambda 完全等价，只是啰嗦
ITEMS.register("ruby", new Supplier<Item>() {
    @Override
    public Item get() {
        return new Item(new Item.Properties());
    }
});
```

两种写法做的事一模一样：都是「交出一个能 `get()` 出 Item 的东西」。lambda 只是把「实现一个只有一个方法的接口」这件事压缩成了一行。

## 五、Supplier 是什么，为什么不能直接 `new`

`Supplier<T>` 这个接口只有一个方法：

```java
@FunctionalInterface
public interface Supplier<T> {
    T get();
}
```

翻译成人话：**`Supplier<T>` 就是「一个能 `get()` 出 T 的东西」**。它不持有 T，它只是「知道怎么弄出一个 T」。你调用 `get()`，它才去造；你不调用，它什么都不做。

那问题来了：既然最后都是要造一个 `Item`，为什么不干脆在注册的时候直接造好传进去？

先看编译层面。`register` 的第二个参数类型是 `Supplier<? extends T>`，你直接传 `new Item(...)`，类型对不上，编译就过不去：

```java
// 编译错误：Item 不是 Supplier
ITEMS.register("ruby", new Item(new Item.Properties()));
```

```text
error: no suitable method found for register(String,Item)
    method DeferredRegister.register(String,Supplier<? extends T>) is not applicable
      (argument mismatch; Item cannot be converted to Supplier<? extends Item>)
```

这是第一道防线，编译器帮你挡住了。但真正要命的是第二层原因——**时序**。

你的 `ModItems` 类里那些字段是 `static final`，它们在你第一次碰这个类的时候就被初始化了。而「第一次碰这个类」发生在哪？发生在模组构造器里：

```java
public DafeiyuMod(IEventBus modEventBus, ModContainer modContainer) {
    ModItems.ITEMS.register(modEventBus);   // 这一行导致 ModItems 被类加载，静态字段全部初始化
}
```

也就是说，执行顺序是这样的：

```text
1. 游戏启动，加载你的模组
2. 调用 DafeiyuMod 构造器
3.   → 碰到 ModItems.ITEMS，ModItems 类被加载
4.   → 静态字段从上到下初始化：先建 ITEMS，再建 RUBY
5.   → 构造器里把 ITEMS 挂到 mod 事件总线上
6. 游戏继续启动……
7. 某个时刻，RegisterEvent 触发，注册表被「解冻」
8.   → DeferredRegister 开始干活：对每个条目调用 supplier.get()，把造出来的对象塞进注册表
9. 注册表重新「冻结」，从此不再接受新条目
```

注意第 4 步和第 7、8 步的差距：**字段初始化的时候，注册表还没开门**。

如果你在第 4 步就 `new Item(...)`，你造出来的对象是在注册表关门的状态下诞生的。它没有注册名、不在注册表里、游戏不认它。这种对象的典型症状是：

- `/give dafeiyu:ruby` 说找不到这个物品
- 物品进了背包，存档再读回来变成空
- 服务端和客户端对这个物品的理解不一致，联机时直接崩
- 更糟的是方块：一个不在注册表里的方块被放进世界，游戏在保存时会把它替换成空气

这就是为什么注册 API 强制要一个 Supplier：**它把「造对象」这个动作推迟到第 8 步，也就是注册表开着门的那一刻**。Supplier 在这里不是语法糖，它是「延迟创建（lazy instantiation）」的实现手段——`DeferredRegister`（延迟注册器）这个名字里的 Deferred，说的就是这件事。

再看一次这个流程，把 Supplier 的位置标出来：

```text
静态初始化阶段：  register("ruby", 【一份说明书：怎么造 ruby】)   ← 只登记说明书
                          ↓ 说明书被存进一个列表
RegisterEvent：    遍历列表，对每份说明书调用 get()
                          ↓
                    new Item(new Item.Properties())   ← 现在才真的造
                          ↓
                    塞进 ITEMS 注册表，绑定 id "dafeiyu:ruby"
```

所以你可以这么记：**`() -> new Item(...)` 交出去的不是物品，是「造物品的方法」；`DeferredItem` 拿到的也不是物品，是「将来会造出物品的承诺」；`.get()` 才是去兑现这个承诺。**

顺便说一句，正因为「造」被推迟了，Supplier 里的代码会在注册那一刻才执行。这意味着你不能在里面读「当前世界」「当前玩家」这类东西——那时候游戏还没进世界。这一点在写自定义物品类时尤其要注意。

## 六、四个函数式接口，一句话读法

`Supplier` 属于一类叫「函数式接口（functional interface）」的东西：只有一个抽象方法的接口。模组代码里高频出现的就是下面四个，见到时按这个表读：

| 你看到的 | 一句话读法 | 方法 | 模组里的典型位置 |
|---|---|---|---|
| `Supplier<X>` | 「能 `get()` 出一个 X 的东西」 | `X get()` | `register("ruby", () -> new Item(...))`、`CreativeModeTab.builder().icon(() -> new ItemStack(...))` |
| `Consumer<X>` | 「能吃进一个 X、不吐东西的东西」 | `void accept(X)` | `event.accept(stack)` 的 `accept`、`displayItems((params, output) -> ...)` 里的 `output` |
| `Function<A,B>` | 「吃进一个 A、吐出一个 B 的东西」 | `B apply(A)` | `registerItem("ruby", Item::new, props)` 里的 `Item::new`（吃 Properties，吐 Item） |
| `Predicate<X>` | 「吃进一个 X、回答是/否的东西」 | `boolean test(X)` | 各种 `filter`、`matches`、条件判断 |

再加一个你一定会见到的：

| `Runnable` | 「什么都不吃、什么都不吐，只是干一件事」 | `void run()` | `modEventBus.addListener(...)` 里传无参方法的场合、`Minecraft.getInstance().execute(() -> ...)` |

读这些签名的诀窍是：**先数参数个数，再看有没有返回值**。`Supplier` 零参数有返回，`Consumer` 一参数无返回，`Function` 一参数有返回，`Predicate` 一参数返回 boolean。参数和返回值对上了，你就能判断一段 lambda 能不能塞进去。

## 完整示例

三个文件，直接落盘就能编译（还需要 `gradle.properties` 里 `mod_id=dafeiyu`，见准备篇）。

文件：`src/main/java/com/dafeiyu/ModItems.java`

```java
package com.dafeiyu;

import net.minecraft.world.item.Item;
import net.neoforged.neoforge.registries.DeferredItem;
import net.neoforged.neoforge.registries.DeferredRegister;

public class ModItems {
    // DeferredRegister.Items 是 DeferredRegister 里面的嵌套类，专管物品
    public static final DeferredRegister.Items ITEMS = DeferredRegister.createItems("dafeiyu");

    // 尖括号里的 Item 表示：这个盒子里装的是 Item
    // 第二个参数是 Supplier：现在只登记「怎么造」，等注册时才真的造
    public static final DeferredItem<Item> RUBY =
            ITEMS.register("ruby", () -> new Item(new Item.Properties()));

    // 同样是一个 Item，只是配置不同；盒子类型仍然是 DeferredItem<Item>
    public static final DeferredItem<Item> RUBY_DUST =
            ITEMS.register("ruby_dust", () -> new Item(new Item.Properties().stacksTo(16)));
}
```

文件：`src/main/java/com/dafeiyu/ModBlocks.java`

```java
package com.dafeiyu;

import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.neoforged.neoforge.registries.DeferredBlock;
import net.neoforged.neoforge.registries.DeferredRegister;

public class ModBlocks {
    // 对称的写法：DeferredRegister.Blocks + DeferredBlock<Block>
    public static final DeferredRegister.Blocks BLOCKS = DeferredRegister.createBlocks("dafeiyu");

    public static final DeferredBlock<Block> RUBY_BLOCK =
            BLOCKS.register("ruby_block", () -> new Block(BlockBehaviour.Properties.of()));
}
```

文件：`src/main/java/com/dafeiyu/DafeiyuMod.java`

```java
package com.dafeiyu;

import net.neoforged.bus.api.IEventBus;
import net.neoforged.fml.common.Mod;
import net.neoforged.fml.ModContainer;

@Mod(DafeiyuMod.MOD_ID)
public class DafeiyuMod {
    public static final String MOD_ID = "dafeiyu";

    public DafeiyuMod(IEventBus modEventBus, ModContainer modContainer) {
        // 触发 ModItems 类加载（静态字段在这一刻初始化，但物品还没造）
        ModItems.ITEMS.register(modEventBus);
        ModBlocks.BLOCKS.register(modEventBus);
    }
}
```

再写一个地方用一下，验证 `.get()`：

文件：`src/main/java/com/dafeiyu/ModCreativeTab.java`（片段）

```java
// 这里要的是 Item，所以必须 get()；如果参数是 Supplier<Item>，就不用 get()
output.accept(ModItems.RUBY.get());
```

## 常见坑与报错

| 现象 | 原因 | 解决 |
|---|---|---|
| `no suitable constructor found for ItemStack(DeferredItem<Item>)` | 忘了 `.get()`，把盒子当成了货 | 加 `.get()`：`new ItemStack(ModItems.RUBY.get())` |
| `incompatible types: DeferredItem<Item> cannot be converted to Item` | 同上，用在 `is()`、`getItem()` 等要 `Item` 的地方 | 加 `.get()` |
| `no suitable method found for register(String,Item)` | 第二个参数直接传了 `new Item(...)`，没包 lambda | 包成 `() -> new Item(...)` |
| 启动时 `NullPointerException`，堆栈指向 `RUBY.get()` | 在静态初始化或构造器里就 `get()` 了，那时还没注册 | 把 `get()` 挪到事件处理、`use`、`appendHoverText` 等运行期代码里 |
| 物品能编译、能启动，但 `/give` 找不到 | 自己 `new` 了一个物品字段，绕过了 `register`，它不在注册表里 | 一律通过 `ITEMS.register(...)` 创建，不要 `public static final Item X = new Item(...)` |
| `type argument Block is not within bounds of type-variable T` | 尖括号写错，比如给 `DeferredBlock` 填了 `Item` | 方块用 `DeferredBlock<Block>`，物品用 `DeferredItem<Item>` |
| `cannot infer type arguments for DeferredItem<>` | 用了 `var` 或 `new DeferredItem<>()` 之类，编译器推不出 `T` | 显式写出完整类型 `DeferredItem<Item>` |

## 练习

**1.（易）** 下面每一行，`RUBY` 和 `RUBY.get()` 分别是什么类型？

```java
public static final DeferredItem<Item> RUBY = ITEMS.register("ruby", () -> new Item(new Item.Properties()));
```

<details>
<summary>答案</summary>

`RUBY` 的类型是 `DeferredItem<Item>`（一个 Supplier，盒子）；`RUBY.get()` 的类型是 `Item`（真正的物品实例）。注意 `RUBY` 的声明类型写的是 `DeferredItem<Item>`，但 `register` 的返回值可能是 `DeferredItem<Item>` 的某种具体化，赋值给这个类型是合法的。

</details>

**2.（中）** 有人这么写，编译能过吗？运行会怎样？为什么？

```java
public static final Item RUBY = new Item(new Item.Properties());
```

<details>
<summary>答案</summary>

编译能过——这就是一个普通的静态字段，语法没问题。

运行会出问题：这个 `new` 发生在 `ModItems` 类加载时，也就是模组构造器里，那时候注册表还没开门（`RegisterEvent` 还没触发）。造出来的 `Item` 没有注册名、不在 `ITEMS` 注册表里，游戏不认它。表现是 `/give dafeiyu:ruby` 找不到、物品进背包后存档丢失、联机时客户端服务端不一致。

正确写法必须是 `ITEMS.register("ruby", () -> new Item(...))`，让「造」这件事发生在注册表开门的那一刻。

</details>

**3.（难）** 下面这段代码想干什么？它为什么编译不过？改成能编译的版本。

```java
public static final DeferredItem<Item> RUBY =
        ITEMS.register("ruby", new Item(new Item.Properties()));
```

<details>
<summary>答案</summary>

它想把一个现造的 `Item` 直接注册进去。编译不过是因为 `register` 的第二个参数类型是 `Supplier<? extends Item>`，而 `Item` 不是 `Supplier`，两者没有继承关系。

报错大意：`no suitable method found for register(String,Item)` / `argument mismatch; Item cannot be converted to Supplier<? extends Item>`。

改成：

```java
public static final DeferredItem<Item> RUBY =
        ITEMS.register("ruby", () -> new Item(new Item.Properties()));
```

如果你觉得这一串括号太丑，NeoForge 给了物品专用的快捷方法（内部做的就是同一件事）：

```java
public static final DeferredItem<Item> RUBY = ITEMS.registerSimpleItem("ruby");
```

</details>

## 参考

- 官方文档·注册表：https://docs.neoforged.net/docs/1.21.1/concepts/registries
- 官方文档·物品（含 `DeferredRegister.Items`）：https://docs.neoforged.net/docs/1.21.1/items/
- 官方文档·方块（含 `DeferredRegister.Blocks`）：https://docs.neoforged.net/docs/1.21.1/blocks/
- 下一篇：[双冒号与方法引用](02-双冒号与方法引用.md)
- 总览：[教程总览与学习路线](../00-教程总览与学习路线.md)

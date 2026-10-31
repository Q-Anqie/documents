---
title: "Optional 与 @Nullable：空值处理"
order: 6
difficulty: 入门
prerequisites: ["注解：@ 开头的那些标签", "record 与枚举：数据类的快捷写法"]
---

# Optional 与 @Nullable：空值处理

> 读完这篇，你能看着一行 `level.getBlockEntity(pos).getInventory()` 立刻判断出它会不会崩，也知道 `Optional` 那一串方法在说什么。

## 学习目标

- 能说出模组开发里 null 为什么格外常见，以及它为什么总在"看起来没问题"的时候崩。
- 拿到一个 API 方法，能判断"这里要不要判空"（看标注、看文档、看方法名）。
- 能读懂 `isPresent()` / `orElse()` / `map()` / `ifPresent()` 这四种最常见的 `Optional` 用法。
- 能认出三个经典崩溃现场，并写出对应的安全版本。

## 正文

### 先看这两段

第一段，几乎每个带方块实体的模组都会写：

文件：`src/main/java/com/dafeiyu/block/RubyAltarBlock.java`

```java
BlockEntity be = level.getBlockEntity(pos);   // 可能是 null
```

第二段，你在 API 里看到的声明：

文件：`net/minecraft/world/entity/player/Inventory.java`（原版）

```java
@Nullable
public ItemStack getCarried() { ... }
```

两段代码的共同点是：**它们都可能给你一个 null，而且编译器不会提醒你。**

第一行更阴险——它连 `@Nullable` 都没写（原版很多方法没标注）。你完全可能写出下面这种代码，编译一路绿灯：

```java
level.getBlockEntity(pos).getInventory().add(stack);   // 崩
```

崩的时候日志里只有一行 `NullPointerException`，指向这一行，但不告诉你"是 `getBlockEntity` 返回了 null，还是 `getInventory` 返回了 null"。

### 为什么 null 是模组开发的头号崩溃源

普通 Java 程序里，null 一般来自"你没初始化"。模组里不一样，null 来自**游戏世界的状态**：

- 区块还没加载，`getBlockEntity` 就是 null；
- 方块已经被替换成空气，方块实体早就没了；
- 玩家还在主菜单，`Minecraft.getInstance().player` 就是 null；
- 客户端刚断开连接，`level` 变成 null，而你的 `ClientTickEvent` 还在跑；
- 服务端和客户端不同步，客户端那边根本没有这个实体。

这些都是**正常状态**，不是错误。游戏随时在加载、卸载、切换维度，你的代码只是在某一瞬间被调用了一次，而那一瞬间对象可能刚好不在。

所以模组里的 null 检查不是"防御性编程的美德"，而是"你必须知道游戏此刻处于什么状态"。

### 读代码时怎么判断"这里要不要判空"

四个线索，按可靠性排序。

**线索一：`@Nullable` 标注。**

```java
@Nullable
public BlockEntity getBlockEntity(BlockPos pos) { ... }
```

看到就判。这是最明确的信号。反过来，`@Nonnull` 或者没有任何标注，**不代表安全**——原版有几万个方法没标注，NeoForge 也只补了一部分。

**线索二：文档里的措辞。**

Javadoc 里出现这些词，一律当"可能 null"处理：

- "may return null"
- "or null if ..."
- "returns null when ..."
- "if present"

比如 `Item#getFoodProperties` 的文档就直说"这可能返回 null，因为并非每个物品都可食用"。

**线索三：方法名。**

| 方法名形态 | 通常含义 |
|---|---|
| `getXxx(...)` | 可能 null（尤其是"按 key / 按坐标 / 按名字查"） |
| `findXxx(...)` | 找不到就 null |
| `getXxxOrNull()` | 明确告诉你可能是 null |
| `getXxxOrDefault(...)` | 不会 null，有兜底 |
| `getOptionalXxx()` / `getXxxOptional()` | 返回 `Optional`，不是 null |
| `orElse(...)` / `orElseThrow()` | 上游是 `Optional` |

**线索四：参数是不是"外部输入的定位信息"。**

凡是参数里带 `BlockPos`、`ResourceLocation`、`UUID`、`Entity` 的查询方法，默认它可能找不到东西。因为这些东西的存在性由世界状态决定，不由你的代码决定。

一个实用习惯：**写完一行链式调用，从右往左看，每个 `.` 前面问一句"这个一定不是 null 吗"。** 上面那行 `level.getBlockEntity(pos).getInventory().add(stack)` 有两处需要问，而作者一处都没问。

### `Optional<T>` 怎么读

`Optional<T>` 是 Java 提供的一个"盒子"：

- 盒子里可能装着一个 `T`；
- 也可能是空盒子；
- **但盒子本身永远不是 null**。

它的意义是把"可能没有"这件事**写进类型里**，让调用方没法假装它一定有。

你在模组代码里需要会读的只有四个方法：

| 写法 | 读作 | 什么时候用 |
|---|---|---|
| `opt.isPresent()` | 盒子里有东西吗 | 需要分支处理时 |
| `opt.orElse(默认值)` | 有就拿出来，没有就用默认值 | 最常见，能一行搞定 |
| `opt.map(x -> ...)` | 有东西就加工一下，还放回盒子里 | 想从对象里取个字段 |
| `opt.ifPresent(x -> ...)` | 有东西就干一件事，没有就算了 | 副作用（打日志、发消息） |

看一段真实的读法：

```java
// 解码 NBT，失败时 result() 给一个空盒子
Optional<RubyData> parsed = RubyData.CODEC.parse(NbtOps.INSTANCE, tag).result();

// 读法一：给默认值
RubyData data = parsed.orElse(RubyData.EMPTY);

// 读法二：只取其中一个字段，再给默认值
int charge = parsed.map(RubyData::charge).orElse(0);

// 读法三：有就干点事
parsed.ifPresent(d -> LOGGER.info("读到了 charge={}", d.charge()));

// 读法四：明确分支
if (parsed.isPresent()) {
    doSomething(parsed.get());   // get() 只在 isPresent() 为 true 时安全
}
```

两个必须知道的细节：

**`get()` 是危险方法。** 空盒子上调 `get()` 会抛 `NoSuchElementException`——和 NPE 一样是崩溃，只是异常名字不同。所以 `opt.get()` 前面必须紧跟 `isPresent()` 判断，否则不如直接返回 null。

**`map` 里返回 null 会变成空盒子。** `Optional.map` 内部用的是 `ofNullable`，所以你 `map` 出一个 null，结果不是"装着 null 的盒子"，而是空盒子。这通常是好事（链式调用不会中断），但如果你指望它区分"没有"和"是 null"，就会出错。

> 这里你只需要会**读** `Optional`，不需要会**设计**返回 `Optional` 的 API。模组开发里你几乎不会自己写 `Optional` 返回值——原版和 NeoForge 已经替你定好了风格。

### 什么时候返回 Optional，什么时候返回可空对象

NeoForge 里两种风格并存，这不是设计混乱，而是历史原因（`Optional` 是 Java 8 才有的，而 Minecraft 的 API 更早）。判断方式：

| 返回 `Optional` 的典型场景 | 返回可空对象的典型场景 |
|---|---|
| Codec 解码结果：`DataResult#result()` | 按坐标取方块实体：`Level#getBlockEntity` |
| 注册表"可选查找"：`Registry#getOptional(...)` | 注册表"直接取"：`Registry#get(...)`（找不到返回 null） |
| 数据组件里"可能不存在"的字段：`optionalFieldOf` | 数据组件取值：`stack.get(DataComponents.RARITY)`（没设就是 null） |
| 可能没有的玩家/实体引用 | 客户端全局状态：`Minecraft.getInstance().player`、`.level` |
| | 能力查询：`level.getCapability(...)`，方块不支持就是 null |

读代码时的应对很简单：**返回值是 `Optional` 就用 `orElse` / `ifPresent`，返回值是普通对象就当它可能 null。** 不要试图把 `Optional` 拆成 null 再判空，那是白折腾。

### 三个经典崩溃现场

**现场一：`Minecraft.getInstance().player` 为 null**

```java
// 危险：主菜单、加载世界、断线重连的瞬间，player 都是 null
Minecraft.getInstance().player.sendSystemMessage(Component.literal("hi"));
```

`Minecraft` 是客户端单例，它在游戏启动时就存在了，但 `player` 要等你真正进入世界才有。你的 `ClientTickEvent` 从主菜单开始就在跑。

```java
// 安全：先拿局部变量，再判
Minecraft mc = Minecraft.getInstance();
LocalPlayer player = mc.player;
if (player == null || mc.level == null) {
    return;   // 还在主菜单 / 世界正在卸载
}
player.sendSystemMessage(Component.literal("hi"));
```

注意这里判了两个：`player` 和 `level`。它们通常同时为 null，但**不保证**——世界卸载的过程中可能先清一个再清另一个。

**现场二：`getBlockEntity` 为 null 后直接调方法**

```java
// 危险
level.getBlockEntity(pos).getInventory().add(stack);
```

两种写法都对，看你需要什么：

```java
// 安全写法 A：只关心"是不是我这种方块实体"
BlockEntity be = level.getBlockEntity(pos);
if (be instanceof RubyAltarBlockEntity altar) {   // 顺带把 null 也挡掉了
    altar.getInventory().add(stack);
}
```

```java
// 安全写法 B：需要区分"没方块实体"和"类型不对"
BlockEntity be = level.getBlockEntity(pos);
if (be == null) {
    return;   // 区块没加载，或方块已经被替换
}
if (!(be instanceof RubyAltarBlockEntity altar)) {
    return;   // 是别的模组的方块实体
}
altar.getInventory().add(stack);
```

`instanceof` 对 null 永远返回 false，所以写法 A 一个判断同时解决了"null"和"类型不对"两件事。这是模组里最常用的写法，详见 [其他常见写法速查](07-其他常见写法速查.md)。

**现场三：客户端未初始化就访问 `level`**

```java
// 危险：在静态初始化块、构造器、或客户端 tick 早期访问
Level level = Minecraft.getInstance().level;
level.playSound(...);   // level 是 null
```

规则：**客户端任何"每刻执行"的代码，开头都要有一次 `player` / `level` 判空**。这不是啰嗦，是必需品。写在事件方法第一行的 `if (mc.player == null) return;` 会帮你挡掉后面 90% 的 NPE。

### 安全写法 vs 危险写法对照表

| 危险写法 | 问题 | 安全写法 |
|---|---|---|
| `level.getBlockEntity(pos).getInventory()` | 方块实体可能不存在 | `if (be instanceof X x) { x.getInventory() }` |
| `Minecraft.getInstance().player.foo()` | 主菜单时 player 为 null | `LocalPlayer p = mc.player; if (p == null) return;` |
| `stack.get(COMPONENT).value()` | 组件没设过时返回 null | `RubyData d = stack.get(C); if (d == null) d = EMPTY;` |
| `opt.get()` | 空盒子抛 `NoSuchElementException` | `opt.orElse(default)` 或先 `isPresent()` |
| `Optional.of(maybeNull)` | 传 null 直接 NPE | `Optional.ofNullable(maybeNull)` |
| `@Nullable ItemStack s = ...; s.getCount()` | 标注只是提示，不判空照样崩 | 标注出现处一律判空 |
| `int n = map.get(key);`（value 是 `Integer`） | 键不存在返回 null，拆箱时 NPE | `map.getOrDefault(key, 0)` |
| 整个方法体包在 `if (x != null) { ... }` 里 | 判空范围太大，读不出"哪一步需要它" | 判空后立刻 `return`，让主逻辑保持平坦 |

### 一条原则：判空要早、要窄

新手常见反应是"那我到处加 `if (x != null)`"。结果代码嵌套五层，还是崩——因为漏了某个。

更好的习惯是**卫语句（guard clause）**：

```java
public void chargeAltar(Level level, BlockPos pos) {
    BlockEntity be = level.getBlockEntity(pos);
    if (!(be instanceof RubyAltarBlockEntity altar)) {
        return;                       // 不满足前提，直接走人
    }
    // 从这里开始，altar 一定不是 null，而且类型正确
    altar.charge();
}
```

判空放在方法开头，判完就 `return`，主逻辑保持零缩进。这样你读代码时不用在脑子里记"这个变量上面判过了没有"。

## 完整示例

三个文件，覆盖"方块实体查询"和"客户端 tick"两个最容易崩的场景。

文件：`src/main/java/com/dafeiyu/block/RubyAltarBlock.java`

```java
package com.dafeiyu.block;

import net.minecraft.core.BlockPos;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.BlockHitResult;

public class RubyAltarBlock extends Block {

    public RubyAltarBlock(Properties properties) {
        super(properties);
    }

    @Override
    protected InteractionResult useWithoutItem(BlockState state, Level level, BlockPos pos,
                                              Player player, BlockHitResult hit) {
        // 客户端只负责表现，真正改数据放在服务端
        if (level.isClientSide()) {
            return InteractionResult.SUCCESS;
        }

        // 一个判断同时挡住 null 和类型不对两种情况
        if (!(level.getBlockEntity(pos) instanceof RubyAltarBlockEntity altar)) {
            return InteractionResult.PASS;
        }

        altar.charge();
        return InteractionResult.CONSUME;
    }
}
```

文件：`src/main/java/com/dafeiyu/event/RubyClientEvents.java`

```java
package com.dafeiyu.event;

import com.dafeiyu.DafeiyuMod;
import net.minecraft.client.Minecraft;
import net.minecraft.client.player.LocalPlayer;
import net.neoforged.api.distmarker.Dist;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.client.event.ClientTickEvent;

@EventBusSubscriber(modid = DafeiyuMod.MOD_ID, value = Dist.CLIENT)
public class RubyClientEvents {

    @SubscribeEvent
    public static void onClientTick(ClientTickEvent.Post event) {
        Minecraft mc = Minecraft.getInstance();

        // 客户端 tick 从主菜单就开始跑，这两行是必需品
        LocalPlayer player = mc.player;
        if (player == null || mc.level == null) {
            return;
        }

        // 走到这里，player 和 level 都确定可用
        if (player.tickCount % 20 == 0) {
            // 每秒一次的客户端逻辑
        }
    }
}
```

文件：`src/main/java/com/dafeiyu/util/RubyDataHelper.java`

```java
package com.dafeiyu.util;

import com.dafeiyu.data.RubyData;
import com.mojang.serialization.DataResult;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.nbt.NbtOps;

import java.util.Optional;

public final class RubyDataHelper {

    private RubyDataHelper() {
    }

    // 从 NBT 读组件值：解码失败不崩，退回 EMPTY
    public static RubyData read(CompoundTag tag) {
        DataResult<RubyData> result = RubyData.CODEC.parse(NbtOps.INSTANCE, tag);
        Optional<RubyData> parsed = result.result();   // 失败时是空盒子
        return parsed.orElse(RubyData.EMPTY);
    }

    // 只想读其中一个字段时，map + orElse 一行搞定
    public static int chargeOf(CompoundTag tag) {
        return RubyData.CODEC.parse(NbtOps.INSTANCE, tag)
                .result()
                .map(RubyData::charge)
                .orElse(0);
    }
}
```

## 常见坑与报错

| 现象 | 原因 | 解决 |
|---|---|---|
| `NullPointerException` 指向一行链式调用，不知道是谁 null | 链式调用里任一环节可能为 null | 拆成多行，逐个判；用 `instanceof` 模式匹配一次挡掉 null + 类型 |
| 主菜单就崩，堆栈在 `ClientTickEvent` | `Minecraft.getInstance().player` / `level` 为 null | 事件方法开头加卫语句 |
| `NoSuchElementException: No value present` | 对空 `Optional` 调了 `get()` | 换 `orElse` / `orElseGet` / 先 `isPresent()` |
| `NullPointerException` 在 `Optional.of(...)` 那行 | `Optional.of(null)` 不允许 null | 改 `Optional.ofNullable(...)` |
| 已经写了 `@Nullable` 还是崩 | 标注只是给人和 IDE 看的，不生成判空代码 | 老老实实判空 |
| `int x = map.get(key)` 偶发 NPE | 值是 `Integer`，键不存在时返回 null，拆箱崩 | `map.getOrDefault(key, 0)` |
| 客户端正常、服务端崩 | 客户端专属代码没做侧判断，服务端跑到了 | 客户端代码放 `value = Dist.CLIENT` 的类里，并保留 `isClientSide` 判断 |
| 判空后代码还是崩在下一行 | 判的是旧变量，用的却是重新取的值 | 判空和取值用同一个局部变量 |

## 练习

1. **（易）** 写一个方法 `int chargeOrZero(ItemStack stack)`：从 `ModDataComponents.RUBY_DATA` 取 `RubyData`，没设过就返回 0。要求只用一行 `return`。
2. **（中）** 在 `ClientTickEvent.Post` 里实现"按住 Shift 时每 20 刻在日志打印玩家坐标"。要求：主菜单不崩、切换维度不崩、断线不崩。
3. **（难）** 给 `RubyAltarBlock` 加一个"打开界面"的行为：先用 `instanceof` 拿到方块实体，再判断玩家是否潜行（潜行时不开界面而是输出电量）。思考：哪一步的判空可以合并，哪一步必须分开。

## 参考

- 本教程译文：[方块实体](/docs/neoforge-1.21.1/05-方块实体/01-方块实体.md)
- 本教程译文：[数据组件](/docs/neoforge-1.21.1/04-物品/02-数据组件.md)
- 本教程译文：[Codec](/docs/neoforge-1.21.1/08-数据存储/02-Codec.md)
- 官方文档：https://docs.neoforged.net/docs/1.21.1/blockentities/
- 相关篇目：[注解：@ 开头的那些标签](04-注解-@开头的那些标签.md)、[其他常见写法速查](07-其他常见写法速查.md)

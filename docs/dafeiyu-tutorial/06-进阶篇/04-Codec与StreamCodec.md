---
title: "Codec 与 StreamCodec"
order: 4
difficulty: 进阶
prerequisites: ["数据存储：NBT 与 SavedData", "record 与枚举", "数据组件"]
---

# Codec 与 StreamCodec

> 读完这篇，你看到 `RecordCodecBuilder.create(instance -> instance.group(...))` 这种「一坨」不再发怵，并且能给自己的数据类写出一对 Codec：一个负责存档和 JSON，一个负责网络传输。

## 学习目标

- 能说清 `Codec` 和 `StreamCodec` 各管哪一段，为什么不能只写一个。
- 能用 `RecordCodecBuilder` 给一个 `record` 写出 Codec，并解释 `fieldOf(...).forGetter(...)` 这一对在干什么。
- 能用 `StreamCodec.composite(...)` 写出网络版，并知道参数为什么是「编码器、取值方法」成对出现。
- 能正确使用 `optionalFieldOf`、`listOf`、`xmap`，并说出 `xmap` 两个参数的顺序。
- 能把同一对 Codec 同时用在数据组件和网络包上。

## 一、两个 Codec，两条路

先建立一个画面。你的 `RubyData` 这个对象，要往两个完全不同的方向走：

```
                    ┌─────────────────────────────┐
   RubyData  ──────►│  Codec：JSON / NBT（人类可读）│──► 存档、数据包 JSON、配置文件
                    └─────────────────────────────┘
                    ┌─────────────────────────────┐
   RubyData  ──────►│  StreamCodec：二进制字节流    │──► 网络包、磁盘上的紧凑格式
                    └─────────────────────────────┘
```

| | `Codec` | `StreamCodec` |
|---|---|---|
| 输出格式 | `JsonElement`、`Tag`（NBT）等树形结构 | 字节流（`ByteBuf`） |
| 典型用途 | 数据包（datapack）JSON、存档 NBT、配置文件 | 网络同步、原版封包 |
| 出错时 | 返回 `DataResult`，带错误信息，**能告诉你哪个字段错了** | 直接抛异常（网络包坏了本来就没法救） |
| 体积 | 大（有键名） | 小（只有值，靠顺序约定） |
| 可读性 | 人能看懂 | 人看不懂 |
| 谁在用 | `DataComponentType#persistent`、配方、战利品表 | `DataComponentType#networkSynchronized`、`CustomPacketPayload` |

**为什么不能只写一个？** 因为两者的目标冲突：存档要「稳、能报错、能兼容旧版本」，所以要有键名、要能部分解析；网络要「快、小」，每 tick 都在传，多一个字段名就是浪费。原版把这两件事分开，你也就得写两份。

好消息是：**两份都写起来很短**，而且字段顺序一一对应，写完一个另一个几乎是照抄。

## 二、为什么 1.21 到处是 Codec

你在 1.20 的代码里会看到大量手写的 `load(CompoundTag)` / `save(CompoundTag)`。1.21 把它们换成了 Codec，原因有四条：

1. **类型安全。** 手写 `tag.getInt("charge")` 时，如果实际存的是 `long`，你会静默拿到 0。Codec 会直接报错：「字段 charge 期望 int，实际是 long」。
2. **自动校验。** `Codec.intRange(0, 100)` 一行就把「必须 0~100」写进去了，越界直接失败，不用你写 if。
3. **一份定义，多种格式。** 同一个 Codec 既能编成 JSON（给数据包作者看），也能编成 NBT（存档），还能编成网络友好的形式。
4. **少写样板。** 一个三字段的 record，手写读写要 20 行，Codec 只要 6 行，而且不可能写漏一个字段。

代价是：**Codec 的写法很「函数式」**，第一次看像天书。这一节的目标就是让你能照着改。

## 三、第一个 Codec：给 record 配一个

先看要序列化的对象。这是 [record 与枚举](../02-Java补充篇/05-record与枚举-数据类的快捷写法.md) 里那个 `RubyData`，我们给它加一个 `owner` 字段（老代码不受影响，只是多一个字段）：

文件：`src/main/java/com/dafeiyu/data/RubyData.java`

```java
package com.dafeiyu.data;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;

public record RubyData(int charge, boolean awakened, String owner) {

    public static final Codec<RubyData> CODEC = RecordCodecBuilder.create(instance ->
            instance.group(
                    // 必填字段：json 里必须有 "charge"
                    Codec.intRange(0, 100).fieldOf("charge").forGetter(RubyData::charge),
                    // 可选字段：没有就用 false
                    Codec.BOOL.optionalFieldOf("awakened", false).forGetter(RubyData::awakened),
                    // 可选字段：没有就用空字符串
                    Codec.STRING.optionalFieldOf("owner", "").forGetter(RubyData::owner)
            ).apply(instance, RubyData::new)
    );

    public static final RubyData EMPTY = new RubyData(0, false, "");
}
```

一行一行拆：

**`RecordCodecBuilder.create(instance -> ...)`** —— 括号里是一个函数，参数 `instance` 你可以理解成「一个正在组装的构造器」。它由框架给你，你不要自己 new。

**`instance.group(...)`** —— 按**构造器参数顺序**列出所有字段。顺序错了不会编译失败，但会悄悄把值塞到错的字段上（比如把 `owner` 塞进 `charge`），所以务必对齐。

**`Codec.intRange(0, 100).fieldOf("charge").forGetter(RubyData::charge)`** —— 这一长串是三段拼起来的，从右往左读最清楚：

1. `RubyData::charge` —— 编码时，从这个对象身上取哪个值（取值方法）。
2. `.fieldOf("charge")` —— 这个值在 JSON/NBT 里叫什么键名（键名）。
3. `Codec.intRange(0, 100)` —— 这个值本身怎么读写、有什么限制（值编解码器）。

**`.apply(instance, RubyData::new)`** —— 三个字段都拿到之后，用 `RubyData::new` 把它们塞进构造器，造出对象。

对应的 JSON 长这样：

```json5
{
  "charge": 42,
  "awakened": true,
  "owner": "Steve"
}
```

`owner` 不写也行，会变成 `""`。

### `Codec` 和 `MapCodec` 是什么关系

你会在原版代码里看到两种写法：

```java
// 写法 A：得到一个 Codec<T>
public static final Codec<RubyData> CODEC = RecordCodecBuilder.create(instance -> ...);

// 写法 B：得到一个 MapCodec<T>
public static final MapCodec<RubyData> MAP_CODEC = RecordCodecBuilder.mapCodec(instance -> ...);
```

区别只有一句：**`Codec` 描述「整个对象」，`MapCodec` 描述「对象里的若干键」**。

- `MapCodec` 只能写进一个 map（JSON 对象 / NBT 复合标签），不能单独编码成一个数字或一个数组。它的好处是**可以被内联**——放进父对象的字段里时，不会多套一层。
- `Codec` 更通用，可以编码成任何形状。

那为什么 `RecordCodecBuilder.create` 给的是 `Codec`？因为它在内部把 `MapCodec` 包了一层，让它能独立使用。**日常写数据类，用 `create` 就对了**；只有当你这个 Codec 要作为另一个 Codec 的字段（尤其是 `dispatch` 的子类型）时，才需要 `mapCodec`。

`MapCodec` 转 `Codec` 很简单，加 `.codec()`：

```java
MapCodec<RubyData> mapCodec = RecordCodecBuilder.mapCodec(instance -> ...);
Codec<RubyData> codec = mapCodec.codec();
```

反过来不行——`Codec` 无法变回 `MapCodec`。这也是为什么 `dispatch` 要求子类型提供 `MapCodec`：它要把子类型的字段和 `type` 字段放在同一层。

### `DataResult`：为什么不是抛异常

Codec 的 `parse` / `encodeStart` 返回的不是对象，而是一个 `DataResult<T>`。这是**故意的**：

- 解析一个数据包里的配方时，某个配方坏了，你希望「跳过这个配方、记一条日志」，而不是整个游戏崩溃。
- 解析玩家输入的 JSON 时，你希望告诉他「第 3 个元素的 `charge` 超出范围」，而不是一个 `NumberFormatException`。

`DataResult` 提供三种取法：

| 方法 | 成功时 | 失败时 |
|---|---|---|
| `result()` | `Optional.of(值)` | `Optional.empty()` |
| `error()` | `Optional.empty()` | `Optional.of(错误信息)` |
| `getOrThrow()` | 直接返回值 | **抛出异常**（调试用） |

写正式代码用 `resultOrPartial(消费者)`：成功给值，失败给「部分结果 + 错误消息」，你可以选择记日志后继续。写调试代码用 `getOrThrow()`，让错误立刻炸出来。

## 四、常用组合子速查

| 组合子 | 作用 | 例子 |
|---|---|---|
| `fieldOf("x")` | 必填字段 | `Codec.INT.fieldOf("charge")` |
| `optionalFieldOf("x", 默认值)` | 可选字段，缺了用默认值 | `Codec.BOOL.optionalFieldOf("awakened", false)` |
| `optionalFieldOf("x")` | 可选字段，包成 `Optional<T>` | 需要区分「没写」和「写了默认值」时用 |
| `listOf()` | 变成列表 | `RubyData.CODEC.listOf()` |
| `xmap(解码, 编码)` | 类型转换 | 枚举 ↔ 字符串、刻 ↔ 秒 |
| `dispatch(...)` | 按类型字段分发到不同子 Codec | 多种「红宝石效果」共用一张表 |

### xmap：最容易写反的一个

`xmap` 的两个参数，**第一个是「从存储类型转到你的类型」，第二个是「从你的类型转回存储类型」**。记忆口诀：**先读后写**，和 `load` / `save` 的顺序一致。

```java
// 存的是字符串，代码里想用枚举
public enum RubyTier {
    ROUGH("rough"), CUT("cut"), PERFECT("perfect");

    private final String id;

    RubyTier(String id) {
        this.id = id;
    }

    public String id() {
        return this.id;
    }

    public static RubyTier byId(String id) {
        for (RubyTier tier : values()) {
            if (tier.id.equals(id)) {
                return tier;
            }
        }
        return ROUGH;   // 读到不认识的字符串时的兜底
    }

    // 解码：String -> RubyTier（先读）
    // 编码：RubyTier -> String（后写）
    public static final Codec<RubyTier> CODEC =
            Codec.STRING.xmap(RubyTier::byId, RubyTier::id);
}
```

写反了会怎样？编译**照样通过**（两个方向的类型刚好都是 `String` 和 `RubyTier` 的话就通不过；但像 `int` 和 `long` 这种能自动装箱的就会静默通过），运行时得到一堆错乱的值。这是本篇最阴的坑，见最后一节。

再看一个数值转换的例子，这个在模组里极常用：

```java
// 内部用"秒"，存档里想用"刻"（1 秒 = 20 刻）
public static final Codec<Integer> SECONDS_CODEC =
        Codec.INT.xmap(ticks -> ticks / 20, seconds -> seconds * 20);
```

### dispatch：按类型分发

当你有「好几种红宝石效果，每种字段不同」时，就需要 `dispatch`：先读一个 `type` 字段，再根据它选对应的子 Codec。

```java
// 骨架示意：DISPATCH 是一个 Registry<MapCodec<? extends RubyEffect>>
public static final Codec<RubyEffect> EFFECT_CODEC = DISPATCH.byNameCodec()
        .dispatch(
                RubyEffect::type,      // 从对象拿到"我是哪种"
                Function.identity()    // 从注册表项拿到对应 codec
        );
```

编码出来的 JSON 会多一个 `type`：

```json5
{
  "type": "dafeiyu:heal",
  "amount": 4
}
```

这段是**骨架**——`DISPATCH` 是一个自定义注册表，把每种效果注册进去才能真跑。你现在只需要记住两点：

1. `dispatch` 的第一参数返回的是「类型」，不是「数据」。
2. 如果子 Codec 不是 `MapCodec`（比如是普通的 `Codec`），编码时框架会自动把内容包进一个 `value` 字段里。看到 `"value": {...}` 这种嵌套，就是这里来的。

## 五、StreamCodec：网络版

`StreamCodec` 的写法和 Codec 很像，但更机械：**一对一对地列「怎么读写这个字段」和「怎么取这个字段」，最后给构造器**。

```java
public static final StreamCodec<ByteBuf, RubyData> STREAM_CODEC = StreamCodec.composite(
        ByteBufCodecs.VAR_INT, RubyData::charge,       // 字段 1
        ByteBufCodecs.BOOL, RubyData::awakened,        // 字段 2
        ByteBufCodecs.STRING_UTF8, RubyData::owner,    // 字段 3
        RubyData::new                                  // 怎么造对象
);
```

对比一下 Codec 的写法，你会发现结构完全一样，只是 `fieldOf("名字")` 换成了「字节编码器」——因为网络上没有键名，只有顺序。

几个高频 `ByteBufCodecs`：

| 编码器 | 类型 | 说明 |
|---|---|---|
| `VAR_INT` | `int` | 变长整数，小数字只占 1 字节，**优先用它** |
| `VAR_LONG` | `long` | 变长长整数 |
| `BOOL` | `boolean` | 1 字节 |
| `STRING_UTF8` | `String` | UTF-8 字符串，有长度上限 |
| `COMPOUND_TAG` | `CompoundTag` | 整个 NBT 复合标签 |
| `byteArray(n)` / `list(n)` | 数组 / 列表 | 括号里是**上限**，防恶意包撑爆内存 |

**为什么泛型第一个参数是 `ByteBuf` 而不是 `RegistryFriendlyByteBuf`？** 因为「越不具体越好」：`ByteBuf` 是最基础的缓冲区，写成 `StreamCodec<ByteBuf, RubyData>` 之后，任何更具体的缓冲区（`FriendlyByteBuf`、`RegistryFriendlyByteBuf`）都能用。反过来写死 `RegistryFriendlyByteBuf` 就只能在那一种场景用。

只有当字段本身需要查注册表时（比如传一个 `Item`），才必须用 `RegistryFriendlyByteBuf`：

```java
// 假设 RubyGift 是一个 record(Holder<Item> item, int count)
public static final StreamCodec<RegistryFriendlyByteBuf, RubyGift> GIFT_STREAM_CODEC =
        StreamCodec.composite(
                ByteBufCodecs.holderRegistry(Registries.ITEM), RubyGift::item,
                ByteBufCodecs.VAR_INT, RubyGift::count,
                RubyGift::new);
```

### StreamCodec 没有「校验」，只有「约定」

`Codec` 有 `intRange`、`optionalFieldOf` 这些带校验的组合子，`StreamCodec` 基本没有——因为网络上省掉的正是「键名和校验信息」。

这意味着**两端必须严格遵守同一份约定**：

- 字段顺序不能变。你给 `RubyData` 加了一个字段，客户端没更新，解码就会错位：本该读 `awakened` 的地方读到了 `owner` 的第一个字节。
- 类型不能变。`VAR_INT` 改成 `INT` 会让后面所有字段偏移。
- 加字段只能加在**末尾**，而且最好同时改协议版本号。

所以 `StreamCodec` 的字段顺序，本质上就是你的「网络协议格式」。它不像 JSON 那样能容忍字段乱序，改之前要想清楚旧版本客户端怎么办。

`StreamCodec` 也有一组组合子，用得上的是这三个：

| 组合子 | 作用 |
|---|---|
| `.map(解码, 编码)` | 类型转换，和 `xmap` 一样是「先读后写」 |
| `.apply(ByteBufCodecs.list(n))` | 变成列表，`n` 是元素上限 |
| `StreamCodec.unit(实例)` | 不传任何数据，只有一个固定值（用于「通知类」包） |

最后那个很有用：像「让客户端播个音效」这种包，如果不需要任何参数，可以直接 `StreamCodec.unit(new PingPayload())`，一个字节都不发。

## 完整示例：一对 Codec，两处使用

**① `src/main/java/com/dafeiyu/data/RubyData.java`** —— 第三节那个类，再加上 StreamCodec：

```java
package com.dafeiyu.data;

import com.mojang.serialization.Codec;
import com.mojang.serialization.codecs.RecordCodecBuilder;
import io.netty.buffer.ByteBuf;
import net.minecraft.network.codec.ByteBufCodecs;
import net.minecraft.network.codec.StreamCodec;

public record RubyData(int charge, boolean awakened, String owner) {

    public static final Codec<RubyData> CODEC = RecordCodecBuilder.create(instance ->
            instance.group(
                    Codec.intRange(0, 100).fieldOf("charge").forGetter(RubyData::charge),
                    Codec.BOOL.optionalFieldOf("awakened", false).forGetter(RubyData::awakened),
                    Codec.STRING.optionalFieldOf("owner", "").forGetter(RubyData::owner)
            ).apply(instance, RubyData::new)
    );

    public static final StreamCodec<ByteBuf, RubyData> STREAM_CODEC = StreamCodec.composite(
            ByteBufCodecs.VAR_INT, RubyData::charge,
            ByteBufCodecs.BOOL, RubyData::awakened,
            ByteBufCodecs.STRING_UTF8, RubyData::owner,
            RubyData::new
    );

    public static final RubyData EMPTY = new RubyData(0, false, "");

    /** 充能：返回新对象（record 不可变，不能就地改） */
    public RubyData withCharge(int newCharge) {
        return new RubyData(Math.min(100, Math.max(0, newCharge)), this.awakened, this.owner);
    }
}
```

**② 用在数据组件上** —— 一个 `DataComponentType` 恰好要两个 Codec：

文件：`src/main/java/com/dafeiyu/ModDataComponents.java`

```java
public static final DeferredHolder<DataComponentType<?>, DataComponentType<RubyData>> RUBY_DATA =
        COMPONENTS.register("ruby_data", () -> DataComponentType.<RubyData>builder()
                .persistent(RubyData.CODEC)                  // 存档用 Codec
                .networkSynchronized(RubyData.STREAM_CODEC)  // 同步给客户端用 StreamCodec
                .build());
```

这两行就是「为什么必须写两份」的最直观答案：**同一个组件，存档走 Codec，同步走 StreamCodec**。

**③ 用在网络包上** —— 见 [网络通信](05-网络通信.md)，那里 `CustomPacketPayload` 要的正是 `STREAM_CODEC`。

**④ 手写测试** —— 想确认 Codec 真的对，可以写个最土的测试：

```java
// 编码成 JSON 看看
JsonElement json = RubyData.CODEC.encodeStart(JsonOps.INSTANCE, new RubyData(5, true, "Steve"))
        .getOrThrow();     // 失败会直接抛异常，方便定位
System.out.println(json);

// 再解码回来，和原对象比较（record 的 equals 是逐字段比较）
RubyData back = RubyData.CODEC.parse(JsonOps.INSTANCE, json).getOrThrow();
System.out.println(back.equals(new RubyData(5, true, "Steve")));   // true
```

`getOrThrow()` 是调试期的好朋友——它把 `DataResult` 里的错误信息原样抛出来，比 `result().orElse(null)` 得到一堆 `null` 强一百倍。

## 常见坑与报错

| 现象 | 原因 | 解决 |
|---|---|---|
| 解码后字段全串位（`charge` 里是 `owner` 的值） | `instance.group(...)` 的顺序和构造器参数顺序不一致 | 按构造器顺序排，一个字段一个字段对 |
| `xmap` 之后数值翻倍/变成 0 | 两个参数写反了（把「写」放在前面） | 第一个是「存储 → 对象」，第二个是「对象 → 存储」 |
| 报错 `No key charge in map` | 用了 `fieldOf` 但 JSON 里没这个键 | 要么补上键，要么改用 `optionalFieldOf` 给默认值 |
| JSON 键名和代码里的对不上 | `fieldOf("charge")` 里的字符串就是键名，改了它旧存档就读不出来 | 键名一旦发布就别改；要改就加 `Codec#withAlternative` 兼容 |
| `optionalFieldOf` 遇到错类型直接崩 | 它不容忍「键存在但类型错」 | 需要容忍时用 `lenientOptionalFieldOf` |
| 网络包解码报 `VarInt too big` | 两端 `StreamCodec` 字段顺序或类型不一致 | 客户端和服务端必须用**同一份** `STREAM_CODEC` 常量 |
| 传物品的包在服务端报注册表相关异常 | 用了 `ByteBuf` 但字段需要注册表 | 泛型改成 `RegistryFriendlyByteBuf` |
| `dispatch` 出来的 JSON 多了一层 `"value"` | 子 Codec 不是 `MapCodec`，被自动包了一层 | 正常现象；想内联就把子 Codec 改成 `RecordCodecBuilder.mapCodec(...)` |
| `ClassCastException` 在 dispatch 里 | 泛型擦除导致运行时无法检查类型 | 每个分支的 Codec 必须真的产出对应子类型，别复用同一个 |

## 练习

1. **（易）** 给 `RubyData` 加一个 `List<String> tags` 字段，要求 JSON 里是数组、缺省是空列表。提示：`Codec.STRING.listOf().optionalFieldOf("tags", List.of())`，注意 `List.of()` 是不可变的，解码后拿到的列表也是不可变的。
2. **（中）** 把 `charge` 的存储格式从 `int` 改成 `float`（0.0~1.0 表示百分比），要求旧存档（0~100 的 int）还能读。提示：`Codec.withAlternative`，或者 `Codec.either`。
3. **（难）** 给 `RubyData` 写一个 `dispatch` 版本：`type` 为 `"simple"` 时只有 `charge`，为 `"named"` 时多一个 `owner`。要求两种都能编码、都能解码，并打印出各自的 JSON 对比。

## 参考

- 本教程译文：[Codec](/docs/neoforge-1.21.1/08-数据存储/02-Codec.md)
- 本教程译文：[StreamCodec](/docs/neoforge-1.21.1/11-网络通信/03-StreamCodec.md)
- 官方文档：https://docs.neoforged.net/docs/1.21.1/datastorage/codecs
- 官方文档：https://docs.neoforged.net/docs/1.21.1/networking/streamcodecs
- 上一篇：[数据存储：NBT 与 SavedData](03-数据存储-NBT与SavedData.md)
- 下一篇：[网络通信](05-网络通信.md)

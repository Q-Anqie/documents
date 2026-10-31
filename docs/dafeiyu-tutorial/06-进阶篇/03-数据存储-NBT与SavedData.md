---
title: "数据存储：NBT 与 SavedData"
order: 3
difficulty: 进阶
prerequisites: ["方块实体", "事件系统", "Codec 与 StreamCodec"]
---

# 数据存储：NBT 与 SavedData

> 读完这篇，你能给玩家记下「第一次进入这个世界的时间」，能给整个存档记下「全服一共挖了多少方块」，并且知道这两件事为什么不能用同一种办法存。

## 学习目标

- 能根据「数据属于谁」在方块实体 NBT、`SavedData`、数据附件三者之间做出选择。
- 能正确实现 `saveAdditional` / `loadAdditional`，并说清 `setChanged()` 漏掉会发生什么。
- 能写一个 `SavedData` 子类，用 `computeIfAbsent` 取到实例，用 `setDirty()` 让它真的落盘。
- 能注册一个 `AttachmentType`，用 `getData` / `setData` 读写，并让它跟着存档保存。
- 能看懂 1.21.1 和更新版本在方法签名上的差异，不会把 `ValueInput` 抄进 1.21.1 的项目里。

## 一、先选对抽屉

存档里的数据，本质上是「某个东西的附属信息」。**附属在谁身上，就该存在谁身上**。选错了不会立刻报错，但会在某个奇怪的时刻丢数据。

| 存储方式 | 数据属于谁 | 生命周期 | 典型用途 |
|---|---|---|---|
| 方块实体 NBT | 一个方块实体 | 跟着区块走 | 箱子内容、机器进度、自定义名字 |
| `SavedData` | 一个维度（世界） | 跟着存档走，维度不卸载就不丢 | 全服统计、全局计数器、已生成的建筑坐标表 |
| 数据附件（Attachment） | 实体 / 区块 / 方块实体 | 跟着宿主走 | 玩家的自定义属性、区块的额外状态 |
| 数据组件（Data Component） | 一个 `ItemStack` | 跟着物品走 | 物品的自定义数值（见 [数据组件](../03-核心概念篇/05-数据组件.md)） |

三条判断规则，从上往下问：

1. **它是不是跟着某个物品跑？** 是 → 数据组件。物品会被复制、被丢在地上、被放进箱子，只有数据组件能一路跟着。
2. **它是不是属于某个具体的方块 / 实体 / 区块？** 是 → 方块实体 NBT 或数据附件。有方块实体就用 NBT；宿主不是方块实体（玩家、羊、区块）就用数据附件。
3. **它是不是「整个世界只有一份」？** 是 → `SavedData`，而且挂在主世界上。

## 二、方块实体 NBT：最基础的一层

这部分你在 [方块实体](../04-内容制作篇/03-方块实体.md) 已经用过，这里只补三个容易含糊的点。

```java
@Override
protected void saveAdditional(CompoundTag tag, HolderLookup.Provider registries) {
    super.saveAdditional(tag, registries);   // 必须第一行，父类要写坐标和类型 id
    tag.putInt("count", this.count);
}

@Override
protected void loadAdditional(CompoundTag tag, HolderLookup.Provider registries) {
    super.loadAdditional(tag, registries);
    this.count = tag.getInt("count");        // 键不存在时返回 0
}
```

**第一，第二个参数为什么是 `HolderLookup.Provider`？** 因为 1.21 的物品堆里存的是「注册表引用」，读一个 `ItemStack` 需要知道去哪个注册表查。你把 `registries` 原样往下传就行，不用理解它的内部结构。

**第二，为什么方法名里有个 "Additional"？** 因为父类 `BlockEntity` 自己要存 `x`、`y`、`z`、`id` 这些字段。你重写的是「额外的部分」，所以必须调 `super`，否则坐标丢失——表现是「所有机器共享同一个数据」，非常难查。

**第三，键名是裸字符串，没有命名空间。** `"count"` 和别的模组的 `"count"` 会撞。养成习惯：**给自己的键加前缀**，比如 `"dafeiyu:count"` 或 `"DFYCount"`。撞了不会报错，只会读出别人的值。

### 读写 NBT 时的几个实用细节

`CompoundTag` 的读写方法是一套「类型 + 名字」的组合，常用的就这些：

| 写入 | 读取 | 缺失时的返回值 |
|---|---|---|
| `putInt("k", 1)` | `getInt("k")` | `0` |
| `putLong("k", 1L)` | `getLong("k")` | `0L` |
| `putBoolean("k", true)` | `getBoolean("k")` | `false` |
| `putString("k", "v")` | `getString("k")` | `""` |
| `put("k", 子标签)` | `getCompound("k")` | 空 `CompoundTag` |
| `put("k", listTag)` | `getList("k", Tag.TAG_INT)` | 空 `ListTag` |

**注意最后两行**：数字和字符串缺失时会给你一个「安全的默认值」，所以代码不会崩，但你也不会知道数据其实没读到。而 `getCompound` / `getList` 在**类型不对**时会返回空对象，同样静默。

所以稳妥的写法是先查再读：

```java
if (tag.contains("dafeiyu:count", Tag.TAG_INT)) {
    this.count = tag.getInt("dafeiyu:count");
}
```

第二个参数是「期望的类型」，写 `Tag.TAG_INT`、`Tag.TAG_LONG` 这种常量。只写 `contains("k")` 也能用，但它只判断「有没有这个键」，不判断类型。

**列表**稍微麻烦，因为 NBT 的列表要求元素类型一致，读取时必须指定类型：

```java
// 写：先建 ListTag，再一个个 add
ListTag list = new ListTag();
list.add(IntTag.valueOf(1));
list.add(IntTag.valueOf(2));
tag.put("dafeiyu:numbers", list);

// 读：必须告诉它元素是什么类型
ListTag read = tag.getList("dafeiyu:numbers", Tag.TAG_INT);
int first = read.getInt(0);
```

**调试技巧**：数据到底存进去没有？在 `saveAdditional` 末尾打一行 `System.out.println(tag)`，日志里会输出 `{dafeiyu:count: 3}` 这样的文本。比反复进出世界猜要快得多。

> **版本提示（很重要）**
>
> 你上网搜 1.21 的方块实体代码，可能会看到这样的签名：
>
> ```java
> protected void saveAdditional(ValueOutput output)          // 1.21.5+
> protected void loadAdditional(ValueInput input)            // 1.21.5+
> ```
>
> **这两个类型在 1.21.1 里根本不存在。** 1.21.1 用的还是 `CompoundTag` + `HolderLookup.Provider`。`ValueInput` / `ValueOutput` 是更晚的版本为了统一「NBT / 二进制 / 其他格式」而引入的抽象，写法和 `CompoundTag` 很像（也是 `putInt`、`getInt`），但**参数类型不同，抄过来直接编译失败**。看到 `ValueInput` 就知道「这是更新的教程」，按本文的 `CompoundTag` 写法来。

## 三、SavedData：整个世界一份的数据

`SavedData` 存在 `世界文件夹/data/xxx.dat` 里。以主世界为例，路径是 `saves/你的存档/data/mining_stats.dat`。

一个 `SavedData` 子类必须做三件事：

1. 提供 `create()`（造一个空实例）和 `load(...)`（从 NBT 恢复）。
2. 重写 `save(...)`，把字段写进 tag。
3. **每次改数据后调 `setDirty()`**。

文件：`src/main/java/com/dafeiyu/MiningStatData.java`

```java
package com.dafeiyu;

import net.minecraft.core.HolderLookup;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.server.MinecraftServer;
import net.minecraft.world.level.saveddata.SavedData;

public class MiningStatData extends SavedData {
    private static final String TAG_TOTAL = "dafeiyu:total_mined";

    private long totalMined = 0L;

    public static MiningStatData create() {
        return new MiningStatData();
    }

    public static MiningStatData load(CompoundTag tag, HolderLookup.Provider registries) {
        MiningStatData data = create();
        data.totalMined = tag.getLong(TAG_TOTAL);
        return data;
    }

    @Override
    public CompoundTag save(CompoundTag tag, HolderLookup.Provider registries) {
        tag.putLong(TAG_TOTAL, this.totalMined);
        return tag;      // 注意：返回传入的那个 tag，不是新建的
    }

    public void add(long amount) {
        this.totalMined += amount;
        this.setDirty();  // 少了这一行，游戏关服时这份数据直接消失
    }

    public long getTotalMined() {
        return this.totalMined;
    }

    /** 取（或首次创建）这份数据。全服唯一入口 */
    public static MiningStatData get(MinecraftServer server) {
        return server.overworld().getDataStorage().computeIfAbsent(
                new SavedData.Factory<>(MiningStatData::create, MiningStatData::load),
                "mining_stats");   // 决定文件名：data/mining_stats.dat
    }
}
```

逐块解释：

**`new SavedData.Factory<>(create, load)`** —— 两个方法引用。第一个告诉游戏「没有存档时怎么造」，第二个告诉它「有存档时怎么读」。这就是 [Builder 与链式调用](../02-Java补充篇/03-Builder与链式调用.md) 里那种「把函数当参数传」的写法，你不需要完全理解泛型，只要记住**两个参数都是方法引用，签名对得上就行**。

**`computeIfAbsent`** —— 名字直译是「不存在就算出来」。它先看内存里有没有，没有就去读 `.dat` 文件，文件也没有才调 `create()`。所以**你永远只会拿到一个实例**，不用自己管单例。

**`server.overworld()`** —— 为什么是主世界？因为主世界是**唯一一个永远不会被完全卸载**的维度。挂在主世界，下界和末地的数据也能一起用。如果你的数据只属于下界（比如下界的某种全局状态），再改成 `server.getLevel(Level.NETHER)`。

**`"mining_stats"`** —— 文件名。不能带 `/` 或 `\`，也不建议带 `.dat`（游戏会自己加）。

**`setDirty()`** —— 这是 `SavedData` 版本里最重要的一行。游戏不是「你一改就写盘」，而是「关服/自动保存时，把标脏的数据写盘」。不调 `setDirty()`，`save()` 永远不会被调用。

### 三个容易想歪的地方

**它不是缓存，别拿它存临时数据。** `SavedData` 是「存档的一部分」，会一直留在内存里直到关服。你如果每 tick 往一个 `List` 里塞东西再存盘，存档文件会越来越大，而且写盘时会有明显卡顿。临时数据放方块实体字段里，或者干脆只放内存（重启就丢的那种）。

**它按维度分文件。** `server.overworld().getDataStorage()` 和 `server.getLevel(Level.NETHER).getDataStorage()` 是**两个不同的仓库**，同名文件互不相干。所以「跨维度共享」的数据必须统一挂主世界，否则玩家在主世界挖的方块和下界挖的方块会被记在两个计数器里。

**读的时候不要假设数据存在。** 第一次玩这个存档时，`.dat` 文件根本不存在，`load` 不会被调用，走的是 `create()`。所以 `create()` 里必须把所有字段初始化成合理的默认值——很多人 `create()` 只写 `new XxxData()`，字段默认是 0，这没问题；但如果你在 `create()` 里忘了初始化某个 `List`，后面 `add` 就会空指针。

## 四、数据附件：挂在实体、区块、方块实体上的自定义字段

`SavedData` 解决的是「世界一份」，那「每个玩家一份」怎么办？你不能给 `Player` 加字段（那是原版类），也不想为它专门写一个 `SavedData` 存 `Map<UUID, Long>`（要自己管增删）。

数据附件（Data Attachment）就是干这个的：**给一个已有的对象挂一个类型化的字段**。

文件：`src/main/java/com/dafeiyu/ModAttachments.java`

```java
package com.dafeiyu;

import com.mojang.serialization.Codec;
import net.neoforged.bus.api.IEventBus;
import net.neoforged.neoforge.attachment.AttachmentType;
import net.neoforged.neoforge.registries.DeferredRegister;
import net.neoforged.neoforge.registries.NeoForgeRegistries;

import java.util.function.Supplier;

public class ModAttachments {
    public static final DeferredRegister<AttachmentType<?>> ATTACHMENT_TYPES =
            DeferredRegister.create(NeoForgeRegistries.ATTACHMENT_TYPES, DafeiyuMod.MOD_ID);

    // 第一次进入世界的时间（毫秒时间戳）
    public static final Supplier<AttachmentType<Long>> FIRST_JOIN =
            ATTACHMENT_TYPES.register("first_join",
                    () -> AttachmentType.builder(() -> 0L)     // 默认值
                            .serialize(Codec.LONG)             // 用 Codec 描述怎么存
                            .build());

    public static void register(IEventBus modEventBus) {
        ATTACHMENT_TYPES.register(modEventBus);
    }
}
```

三个关键点：

**`builder(() -> 0L)`** —— 默认值。第一次 `getData` 时会用它造一个实例挂上去。所以 `getData` **不会返回 null**，这一点和 `Map#get` 完全不同。

**`serialize(Codec.LONG)`** —— 告诉游戏「这个附件要存盘，用 `Codec.LONG` 转成 NBT」。**不写 `serialize` 就不存盘**，关服即失。这就是「临时缓存」和「持久数据」的分界线。

**`NeoForgeRegistries.ATTACHMENT_TYPES`** —— 附件类型有自己的注册表，不是 `Registries` 里那些原版表。

读写只有两个方法：

```java
long firstJoin = player.getData(ModAttachments.FIRST_JOIN);      // 读，没有就挂默认值
player.setData(ModAttachments.FIRST_JOIN, System.currentTimeMillis()); // 写
```

`setData` 会**自动**把宿主标脏（方块实体调 `setChanged`，区块调 `setUnsaved`）。但如果你是 `getData` 拿到一个可变对象（比如 `ItemStackHandler`）然后就地改它，**必须自己标脏**：

```java
var handler = chunk.getData(MY_HANDLER);
handler.insertItem(0, stack, false);
chunk.setUnsaved(true);   // setData 没被调用，得手动来
```

另外两个常用配置：

- `.copyOnDeath()` —— 玩家死亡重生时把附件复制过去。不加的话，玩家一死，你的自定义属性就清零了。
- `AttachmentType.serializable(() -> new MyThing())` —— 当你的类型自己实现了 `INBTSerializable` 时用这个，比写 Codec 省事。

### 附件能挂在哪，挂上去是什么感觉

| 宿主 | 写法 | 什么时候存盘 | 什么时候同步到客户端 |
|---|---|---|---|
| 玩家 / 生物 | `player.getData(...)` | 实体被保存时 | **不会自动同步**，要自己发包 |
| 区块 | `chunk.getData(...)` | 区块保存时 | **不会自动同步** |
| 方块实体 | `blockEntity.getData(...)` | 方块实体保存时 | 跟随 `getUpdateTag` |

第三行要特别注意：**附件的自动保存是「跟着宿主」的，但同步不是。** 如果你把数据挂在玩家身上，客户端 `player.getData(...)` 拿到的是客户端自己那份，永远是默认值。想让客户端看到，就得在服务端改完之后发包（[网络通信](05-网络通信.md)），或者干脆改成用菜单的 `ContainerData` 同步（如果这个数据只在开 GUI 时有用）。

### 那到底用 SavedData 还是附件？

一个简单的判断：

- 数据要按「玩家」「生物」「区块」逐个分开 → **附件**。你不用自己维护 `Map<UUID, ...>`，也不用管玩家退出时删不删。
- 数据是「全世界一份」，或者需要按维度分开 → **SavedData**。
- 数据要跟着物品跑 → **数据组件**，附件帮不了你（物品堆的附件已被数据组件取代）。

三者可以同时用。本文的示例就是「玩家一份（附件）+ 世界一份（SavedData）」的组合，这在真实模组里非常常见。

## 完整示例

两个需求，两种存法。

**① `src/main/java/com/dafeiyu/ModAttachments.java`** —— 就是第四节那段，原样。

**② `src/main/java/com/dafeiyu/MiningStatData.java`** —— 就是第三节那段，原样。

**③ 新文件 `src/main/java/com/dafeiyu/PlayerDataEvents.java`**

```java
package com.dafeiyu;

import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.neoforged.bus.api.SubscribeEvent;
import net.neoforged.fml.common.EventBusSubscriber;
import net.neoforged.neoforge.event.entity.player.PlayerEvent;
import net.neoforged.neoforge.event.level.BlockEvent;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@EventBusSubscriber(modid = DafeiyuMod.MOD_ID)   // 游戏总线，不写 bus
public class PlayerDataEvents {

    private static final DateTimeFormatter FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault());

    /** 玩家进服：第一次就记时间并欢迎 */
    @SubscribeEvent
    public static void onLogin(PlayerEvent.PlayerLoggedInEvent event) {
        if (!(event.getEntity() instanceof ServerPlayer player)) {
            return;
        }
        long firstJoin = player.getData(ModAttachments.FIRST_JOIN);
        if (firstJoin == 0L) {
            firstJoin = System.currentTimeMillis();
            player.setData(ModAttachments.FIRST_JOIN, firstJoin);
            player.sendSystemMessage(Component.literal("欢迎第一次来到这个世界！"));
        }
        player.sendSystemMessage(Component.literal(
                "你第一次进入的时间：" + FORMAT.format(Instant.ofEpochMilli(firstJoin))));
    }

    /** 挖掉一个方块：全服计数 +1 */
    @SubscribeEvent
    public static void onBlockBreak(BlockEvent.BreakEvent event) {
        if (event.getLevel().isClientSide()) {
            return;
        }
        if (event.getPlayer() instanceof ServerPlayer player && player.getServer() != null) {
            MiningStatData data = MiningStatData.get(player.getServer());
            data.add(1);
            player.displayClientMessage(
                    Component.literal("全服累计挖掘：" + data.getTotalMined()), true);
        }
    }
}
```

**④ 主类加一行**

```java
public DafeiyuMod(IEventBus modEventBus, ModContainer modContainer) {
    // ...
    ModAttachments.register(modEventBus);
}
```

**验证方法**：进世界看欢迎语 → 退出重进，欢迎语不再出现但时间还在 → 挖几个方块 → 关掉游戏再进 → 累计数还在。这三步分别验证了「附件默认值」「附件持久化」「SavedData 落盘」。

## 常见坑与报错

| 现象 | 原因 | 解决 |
|---|---|---|
| 关服重进，`SavedData` 的数据回到 0 | 改数据后没调 `setDirty()` | 每个改数据的方法末尾补上 |
| 附件的数据关服就没了 | 构建时没写 `.serialize(...)` | 补 Codec 或改用 `AttachmentType.serializable` |
| 方块实体的坐标全变成 (0,0,0) | `loadAdditional` 里没调 `super` | 第一行补 `super.loadAdditional(...)` |
| 存档打不开，日志里是 `NBT` 解析异常 | 读的时候用错类型（存的 `putLong`，读用 `getInt`） | 存和读的类型必须一致；读之前 `tag.contains(key, Tag.TAG_LONG)` |
| 两个模组的数据互相覆盖 | NBT 键名没加前缀 | 用 `"dafeiyu:xxx"` 这种带命名空间的键 |
| `computeIfAbsent` 每次返回新实例 | 文件名字符串写错（大小写、拼写），或挂在了不同维度 | 全服数据统一挂 `server.overworld()` |
| 玩家死亡后自定义属性清零 | 附件没设 `copyOnDeath` | 构建器加 `.copyOnDeath()` |
| 抄了 `saveAdditional(ValueOutput)` 编译不过 | 那是 1.21.5+ 的签名 | 1.21.1 用 `CompoundTag` + `HolderLookup.Provider` |
| 区块里的附件改了但没存 | 直接改 `getData` 返回的对象，没标脏 | 改完调 `chunk.setUnsaved(true)` |

## 练习

1. **（易）** 给 `MiningStatData` 加一个 `long getAveragePerPlayer(MinecraftServer server)`，用 `server.getPlayerCount()` 算平均值。注意除零。
2. **（中）** 用数据附件记录「玩家上次睡觉的游戏天数」，并在玩家醒来时对比，如果隔了 3 天以上就发一条消息。提示：`PlayerEvent.PlayerLoggedInEvent` 不够用，想想 `SleepFinishedTimeEvent` 或 `PlayerEvent.PlayerRespawnEvent`。
3. **（难）** 把 `MiningStatData` 从「一个 `long`」扩展成「每个玩家一个 `long`」，用 `Map<UUID, Long>` 存，Codec 部分改用 `Codec.unboundedMap(Codec.STRING.xmap(UUID::fromString, UUID::toString), Codec.LONG)`。然后思考：为什么这种情况下用附件反而更简单？

## 参考

- 本教程译文：[NBT](/docs/neoforge-1.21.1/08-数据存储/03-NBT.md)
- 本教程译文：[存档数据](/docs/neoforge-1.21.1/08-数据存储/04-存档数据.md)
- 本教程译文：[数据附件](/docs/neoforge-1.21.1/08-数据存储/01-数据附件.md)
- 官方文档：https://docs.neoforged.net/docs/1.21.1/datastorage/saveddata
- 官方文档：https://docs.neoforged.net/docs/1.21.1/datastorage/attachments
- 上一篇：[能力与物品栏交互](02-能力与物品栏交互.md)
- 下一篇：[Codec 与 StreamCodec](04-Codec与StreamCodec.md)

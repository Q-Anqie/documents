---
title: "Mixin与访问转换器"
order: 8
difficulty: 高级
prerequisites: ["事件系统", "侧-客户端与服务端", "附魔与数据映射"]
---

# Mixin与访问转换器

> 读完这篇，你知道什么情况下才该动原版代码、访问转换器怎么把 `private` 撬开、Mixin 怎么往原版方法里插一段自己的逻辑，以及为什么这两样东西能少用就少用。

## 学习目标

- 能按「事件 → 数据映射/数据包 → 访问转换器 → Mixin」的顺序判断该用哪种手段，而不是一上来就 Mixin。
- 能写 `accesstransformer.cfg`，把字段、方法、类从 `private` 提到 `public`，并在构建脚本里正确声明。
- 能写一个最小可用的 Mixin：`mixins.json` + `@Mixin` + `@Inject`，往 `LivingEntity#die` 里插一行日志。
- 能读懂 `Mixin apply failed` 报错里最关键的那三行，快速判断是签名错、类名错还是没找到注入点。
- 说清 Mixin 的三类典型翻车：签名写错、类被提前加载、和其他模组抢同一个注入点。

## 一、先问一句：真的需要吗

改原版行为有四条路，成本和风险依次上升：

| 手段 | 能做什么 | 风险 | 什么时候用 |
|---|---|---|---|
| 事件（Event） | 在游戏提供的钩子上加逻辑 | 极低 | **永远先看这里** |
| 数据包 / 数据映射 | 改数值、改掉落、加配方、加附魔 | 低 | 能靠数据表达的都走这条 |
| 访问转换器（AT） | 把 `private`/`protected` 变 `public`，去掉 `final` | 中 | 只差「访问不到」这一层 |
| Mixin | 往原版方法里插入/替换/取消代码 | 高 | 前三条都做不到时 |

前两条路你在前面的章节已经用得很熟了：`BlockEvent.BreakEvent`、`LivingDeathEvent`、`PlayerTickEvent`、数据映射……绝大多数「我想让原版做点不一样的事」都能在这里解决。

真正需要往下走的场景其实很窄：

- 原版某个字段是 `private`，你需要读它（AT 就够，不用 Mixin）。
- 原版某个方法的返回值你要改，但没有任何事件暴露这个时机（Mixin）。
- 原版某段逻辑你要整个替换（Mixin，且最脆弱）。

**先把这句话记住**：Mixin 是在别人的字节码上动刀。原版一改方法名、改参数、改内部结构，你的 Mixin 就失效；而失效的表现往往是**启动崩溃**，不是「功能没生效」。用户看到的是「装了这个模组游戏打不开」，而不是「这个模组有点小 bug」。这就是为什么它排在最后。

## 二、访问转换器：只解决「看不见」

访问转换器（Access Transformer，简称 AT）做的事非常有限：**放宽可见性，或者去掉 `final`**。它不改任何逻辑，只让编译器允许你写 `somePrivateField` 而已。

举个例子。你想读 `Level` 的 `isClientSide` 字段——它是 `public` 的，其实不用 AT。但假设你要读某个 `protected` 的方法、或者给一个 `final` 字段赋值，编译器就会拦住你。AT 就是那张通行证。

### 2.1 声明 AT 文件

文件放在 `src/main/resources/META-INF/accesstransformer.cfg`，这是默认位置。

用 ModDevGradle 时，在 `build.gradle` 里声明：

```groovy
// build.gradle
neoForge {
    version = "21.1.80"

    // 告诉 NeoForge 哪个文件是 AT
    accessTransformers.from "src/main/resources/META-INF/accesstransformer.cfg"
}
```

如果你用的是 NeoGradle，写法是：

```groovy
// build.gradle（NeoGradle）
minecraft {
    accessTransformers {
        file('src/main/resources/META-INF/accesstransformer.cfg')
    }
}
```

如果你的 AT 文件不在默认位置，还得在 `neoforge.mods.toml` 里补一条，告诉运行期去哪儿找：

```toml
# src/main/resources/META-INF/neoforge.mods.toml
[[accessTransformers]]
file="META-INF/accesstransformer.cfg"
```

改完 AT 之后，**必须刷新一次 Gradle 项目**（IDEA 右侧 Gradle 面板的刷新按钮），否则新的可见性不会生效——这是新手最常卡的一步，代码明明写对了却一直标红。

### 2.2 语法

一条 AT 就是「新可见性 + 目标」。注释用 `#`。

```text
# src/main/resources/META-INF/accesstransformer.cfg

# 1) 字段：把 Level 的 isClientSide 提成 public
public net.minecraft.world.level.Level isClientSide

# 2) 字段：去掉 final，可见性保持 protected
protected-f net.minecraft.world.entity.LivingEntity lastHurtByMob

# 3) 方法：把 Player.drop(ItemStack, boolean) 提成 public
public net.minecraft.world.entity.player.Player drop(Lnet/minecraft/world/item/ItemStack;Z)Lnet/minecraft/world/entity/item/ItemEntity;

# 4) 类：内部类用 $ 连接
public net.minecraft.world.item.ItemStack$TooltipPart
```

可见性从高到低是 `public` > `protected` > `default` > `private`，后面可以跟 `+f`（加 `final`）或 `-f`（去 `final`）。

方法那一行看着吓人，其实就是 Java 的类型描述符：

| 描述符 | 含义 |
|---|---|
| `I` `J` `F` `D` `Z` `B` `C` `S` | int、long、float、double、boolean、byte、char、short |
| `V` | void（只能出现在返回值位置） |
| `L包名/类名;` | 引用类型，**用斜杠不用点** |
| `[` | 数组的一维，`[[I` 就是 `int[][]` |
| `(...)` | 参数列表，没参数就写 `()` |

所以 `(Lnet/minecraft/world/item/ItemStack;Z)Lnet/minecraft/world/entity/item/ItemEntity;` 读作「接收一个 `ItemStack` 和一个 `boolean`，返回 `ItemEntity`」。

### 2.3 一个必须纠正的旧习惯

很多老教程会教你写：

```text
public net.minecraft.world.level.Level field_12345 # myField
```

那是 1.20.1 及以前的做法，`field_12345` 是 SRG 混淆名。**1.21.1 不要这么写。** NeoForge 从 1.20.2 起在运行期使用 Mojang 官方名，AT 里直接写你在 IDEA 里看到的真实字段名（`isClientSide`）、真实方法名（`drop`）。写 SRG 名会报「找不到目标」。

同理，Mixin 里的 `method = "..."` 也写官方名，不写 `m_6667_` 这种。

### 2.4 AT 的边界

AT 有两个硬限制，绕不过去：

1. **它不能改逻辑。** 你只能「看见」和「改 final」，不能改变方法内部做了什么。
2. **它只改你直接指定的那个成员。** 如果你把一个 `protected` 方法提成 `public`，但某个子类用 `protected` 重写了它，JVM 会在加载时报 `IncompatibleClassChangeError`。所以 AT 最适合 `final` 方法、`static` 方法、`private` 方法这类「不会被重写」的目标。

也正因为 AT 只动可见性、不动逻辑，它的**兼容性远好于 Mixin**：原版改了方法内部的实现，你的 AT 一般照样能用；只有方法本身被删掉或改名时才会失效。所以当你发现「事件不够用」时，第一个该想的组合是「AT 打开访问 + 事件里写逻辑」，而不是直接上 Mixin。比如原版有个 `private` 的计数器字段，你想在 `PlayerTickEvent` 里读它——一个 AT 就够了，完全不需要 Mixin。

## 三、Mixin：在类加载时改写字节码

Mixin 的原理一句话：**在你的模组加载时，Mixin 框架会拦住目标类的字节码，在指定位置插入一段调用你方法的指令，然后再交给 JVM。**

这意味着两件事：

- 它只在运行时生效。你在 IDEA 里点进 `LivingEntity#die` 看到的还是原版代码，看不到自己的注入。
- 它依赖「目标方法的准确签名」。名字、参数类型、返回值，有一个字符不对，注入就失败。

### 3.1 两个配置文件

第一个，Mixin 配置文件，放在 `src/main/resources/dafeiyu.mixins.json`：

```json
{
  "required": true,
  "minVersion": "0.8.5",
  "package": "com.dafeiyu.mixin",
  "compatibilityLevel": "JAVA_21",
  "mixins": ["LivingEntityMixin"],
  "client": [],
  "server": [],
  "injectors": {
    "defaultRequire": 1
  }
}
```

- `package`：Mixin 类所在的包，下面的类名都相对它。
- `mixins`：**两端都要加载**的 Mixin。`client` 和 `server` 分别只在客户端/服务端加载。
- `defaultRequire: 1`：表示每个注入点至少要匹配到 1 处，匹配不到就报错崩溃。这个「宁可炸也不静默失效」的默认值其实是好事。
- 不需要 `refmap`。1.21.1 用官方名，refmap 是旧版本混淆时代的东西。

第二个，在 `neoforge.mods.toml` 里挂上这个文件：

```toml
# src/main/resources/META-INF/neoforge.mods.toml
[[mixins]]
config="dafeiyu.mixins.json"
```

漏了这一条，`mixins.json` 就是一张废纸，Mixin 一个都不会生效，而且**不会报错**。

### 3.2 最小可用例子：给死亡加一行日志

文件：`src/main/java/com/dafeiyu/mixin/LivingEntityMixin.java`

```java
package com.dafeiyu.mixin;

import com.mojang.logging.LogUtils;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.LivingEntity;
import org.slf4j.Logger;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(LivingEntity.class)
public abstract class LivingEntityMixin {

    private static final Logger LOGGER = LogUtils.getLogger();

    @Inject(
            method = "die(Lnet/minecraft/world/damagesource/DamageSource;)V",
            at = @At("HEAD")
    )
    private void dafeiyu$logDeath(DamageSource source, CallbackInfo ci) {
        LivingEntity self = (LivingEntity) (Object) this;
        LOGGER.info("[dafeiyu] {} 死亡，伤害来源 {}", self.getName().getString(), source.getMsgId());
    }
}
```

逐块解释：

- **`@Mixin(LivingEntity.class)`**：声明「我要改这个类」。Mixin 类本身不会被实例化，所以写成 `abstract` 是惯例，防止有人手滑 `new` 它。
- **`method`**：目标方法的**完整签名**。只写 `"die"` 也能用，但当类里有重载时会歧义，写全描述符最保险。
- **`at = @At("HEAD")`**：插在方法体的最开头。其他常用值：`"RETURN"`（每个 return 之前）、`"TAIL"`（最后一个 return 之前）、`"INVOKE"`（某次方法调用处）。
- **方法签名**：注入方法的参数必须**和目标方法的参数一一对应**，最后多一个 `CallbackInfo`。目标方法有返回值时用 `CallbackInfoReturnable<T>`。
- **`(LivingEntity) (Object) this`**：Mixin 类编译时并不继承 `LivingEntity`，所以要先转 `Object` 再转目标类型。这是标准写法。
- **方法名 `dafeiyu$logDeath`**：前缀加模组 id 是社区惯例，避免和别的 Mixin 撞名。

想取消原方法（比如让某个行为不发生），把 `ci.cancel()` 写在注入方法里，并在 `@Inject` 上加 `cancellable = true`。注意 `HEAD` 处取消意味着原方法**一行都不执行**，很容易连带破坏别的逻辑。

### 3.3 另外三种常用注入器

**`@Redirect`**：把目标方法里的一次「调用」换掉。它比 `@Inject` 更精准，也更脆——因为你要精确指出那一行调用。

```java
// 形状示意：把 drop(...) 里对 ItemStack.shrink(int) 的调用换成空实现
@Redirect(
        method = "drop(Lnet/minecraft/world/item/ItemStack;Z)Lnet/minecraft/world/entity/item/ItemEntity;",
        at = @At(value = "INVOKE", target = "Lnet/minecraft/world/item/ItemStack;shrink(I)V")
)
private void dafeiyu$noShrink(ItemStack stack, int amount) {
    // 什么都不做
}
```

`target` 的写法就是 AT 里那套描述符：`L类;方法名(参数)返回值`。**这个方法里到底有没有 `shrink` 调用，必须去字节码里确认**，不能靠猜——这也是 `@Redirect` 最容易失败的地方。

**`@ModifyVariable`**：改方法的局部变量或参数。

```java
@Mixin(Player.class)
public class PlayerMixin {
    @ModifyVariable(method = "causeFoodExhaustion", at = @At("HEAD"), argsOnly = true)
    private float dafeiyu$doubleExhaustion(float amount) {
        return amount * 2.0F;
    }
}
```

`argsOnly = true` 表示只匹配参数；不写的话，Mixin 会按类型匹配方法体里第一个 `float` 局部变量，容易改错对象。

**`@ModifyConstant`**：改方法里的字面常量（比如把某个 `0.5F` 改成 `0.25F`）。它比 `@Redirect` 更细，适合「只想调一个魔法数字」的场景。

还有两个注解你会经常看到：

- **`@Shadow`**：声明「目标类里有这个字段/方法，我只是借用一下」。用来读原版的私有字段，比 AT 更局部。
- **`@Unique`**：声明「这个字段/方法是 Mixin 自己加的，别和目标类冲突」。

## 四、调试 Mixin

Mixin 出错时默认只会给你一句很长的异常。打开详细日志会好受很多。在运行配置的 VM 参数里加：

```text
-Dmixin.debug=true
-Dmixin.debug.export=true
-Dmixin.dumpTargetOnFailure=true
```

- `mixin.debug=true`：打印每个 Mixin 的匹配过程，包括「在哪个方法里找哪个注入点、找到几处」。
- `mixin.debug.export=true`：把改写后的字节码导出到 `run/.mixin.out/`，你可以直接反编译看「到底插进去了没有」。这是排查「注入了但没生效」的终极手段。
- `dumpTargetOnFailure=true`：注入失败时把目标类的完整字节码 dump 出来，方便对照签名。

用 ModDevGradle 的话，也可以写在 `build.gradle` 的 run 配置里：

```groovy
// build.gradle
neoForge {
    runs {
        client {
            client()
            systemProperty 'mixin.debug', 'true'
            systemProperty 'mixin.debug.export', 'true'
        }
    }
}
```

### 读一条典型的报错

```text
Mixin apply for mod dafeiyu failed dafeiyu.mixins.json:LivingEntityMixin -> net.minecraft.world.entity.LivingEntity:
org.spongepowered.asm.mixin.injection.throwables.InvalidInjectionException:
Critical injection failure: @Inject annotation on dafeiyu$logDeath could not find any targets
matching 'die(Lnet/minecraft/world/damagesource/DamageSource;)V' in net.minecraft.world.entity.LivingEntity.
```

拆开看三段就够：

1. **`Mixin apply for mod dafeiyu failed ... LivingEntityMixin -> LivingEntity`**：哪个配置文件、哪个 Mixin 类、目标是谁。先确认目标类对不对。
2. **`@Inject annotation on dafeiyu$logDeath`**：具体是哪个注入方法。到这里你已经能定位到代码行。
3. **`could not find any targets matching '...'`**：最关键的一句——**签名没匹配上**。要么方法名错、要么参数类型错、要么这个方法在这个版本根本不存在。

如果是 `@Redirect` 失败，报错会变成 `@Redirect could not find target ...`，含义是「方法找到了，但里面没有你要拦的那次调用」。

## 五、常见坑与报错

| 现象 | 原因 | 解决 |
|---|---|---|
| 启动崩溃：`could not find any targets matching` | 方法签名写错，或抄了别的版本的签名 | 用 IDEA 打开目标类，右键 Copy Reference 拿准确签名 |
| 启动崩溃：`NoClassDefFoundError` / `ClassNotFoundException`，指向你的 Mixin 类 | 你在普通代码里 `import` 或调用了 Mixin 类，导致它被提前加载 | Mixin 类只能被 Mixin 框架加载，普通代码里**一行都不能引用** |
| 服务端启动崩溃，客户端正常 | 客户端专用的 Mixin 写进了 `mixins` 数组 | 挪到 `client` 数组里 |
| 什么都编译通过，但功能完全没生效 | `neoforge.mods.toml` 里没写 `[[mixins]]`，或文件名对不上 | 补上，并确认 `config="dafeiyu.mixins.json"` 和实际文件名一致 |
| 和另一个模组同时装就崩 | 两个 Mixin 抢同一个注入点（尤其是 `@Redirect`），或一个 `cancel` 了另一个依赖的调用 | 换更靠外的注入点；或用 `@At` 的 `ordinal` 指定第几处；必要时在 issue 里和对方协调 |
| 改完 AT，IDEA 还是标红 | 没刷新 Gradle 项目 | 刷新 Gradle；必要时 `./gradlew --refresh-dependencies` |
| AT 生效但运行期报 `IncompatibleClassChangeError` | 被转换的方法在子类里被以更低的可见性重写了 | 换目标（`final`/`static`/`private` 方法更安全） |
| 换了个 Minecraft 小版本，全部 Mixin 失效 | 原版方法被重命名或重构 | 这是常态，不是 bug；升级版本必须逐个复查 Mixin |

## 完整示例

```text
src/main/resources/META-INF/accesstransformer.cfg
src/main/resources/META-INF/neoforge.mods.toml     # [[mixins]] 与 [[accessTransformers]]
src/main/resources/dafeiyu.mixins.json
src/main/java/com/dafeiyu/mixin/LivingEntityMixin.java
build.gradle                                        # accessTransformers + run 配置
```

`neoforge.mods.toml` 里两段配置合起来长这样：

```toml
# src/main/resources/META-INF/neoforge.mods.toml
[[mixins]]
config="dafeiyu.mixins.json"

[[accessTransformers]]
file="META-INF/accesstransformer.cfg"
```

验证方式：进游戏杀一只猪，看日志里有没有 `[dafeiyu] 猪 死亡，伤害来源 player`。如果没有，先确认 `[[mixins]]` 写了没有，再加 `-Dmixin.debug=true` 看匹配日志。

## 练习

1. **基础**：用 AT 把 `Player` 的某个 `private` 字段提成 `public`（提示：先在 IDEA 里找到它，确认它没有被重写），然后在事件里读它并打印。
2. **进阶**：把 `LivingEntityMixin` 的注入点从 `HEAD` 换成 `TAIL`，观察日志打印时机有什么变化；再试试加 `cancellable = true` 和 `ci.cancel()`，看生物还会不会死。
3. **挑战**：写一个 `@ModifyVariable`，把玩家每次吃食物恢复的饥饿值翻倍，然后用 `-Dmixin.debug.export=true` 导出字节码，确认注入确实写进去了。

## 参考

- 本教程译文：[访问转换器](/docs/neoforge-1.21.1/12-高级主题/01-访问转换器.md)
- 本教程译文：[侧](/docs/neoforge-1.21.1/02-核心概念/03-侧.md)
- 本教程：[事件系统](../03-核心概念篇/02-事件系统.md)
- 官方文档：https://docs.neoforged.net/docs/1.21.1/advanced/accesstransformers
- Mixin 文档：https://github.com/SpongePowered/Mixin/wiki
- 上一篇：[附魔与数据映射](07-附魔与数据映射.md)
- 下一篇：[调试与游戏测试](09-调试与游戏测试.md)

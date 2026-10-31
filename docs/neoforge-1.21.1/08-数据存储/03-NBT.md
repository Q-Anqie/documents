---
title: "命名二进制标签（NBT）"
original_title: "Named Binary Tag (NBT)"
source: "https://docs.neoforged.net/docs/1.21.1/datastorage/nbt"
version: "1.21.1"
---

# 命名二进制标签（NBT）

> 相关 Minecraft Wiki：[NBT格式](https://zh.minecraft.wiki/w/NBT格式)

NBT 是 Minecraft 最早时期引入的一种格式，由 Notch 本人编写。它在整个 Minecraft 代码库中被广泛用于数据存储。

## 规范

NBT 规范与 JSON 规范类似，但有一些差异：

- 存在字节、短整数、长整数和浮点数的独立类型，分别以 `b`、`s`、`l` 和 `f` 为后缀，类似于它们在 Java 代码中的表示方式。
    - 双精度浮点数也可以 `d` 为后缀，但这并非必需，类似于 Java 代码。Java 中整数可用的可选 `i` 后缀在 NBT 中不允许。
    - 后缀不区分大小写。因此例如 `64b` 与 `64B` 相同，`0.5F` 与 `0.5f` 相同。
- 布尔值不存在，它们由字节表示。`true` 变为 `1b`，`false` 变为 `0b`。
    - 当前实现将所有非零值视为 `true`，因此 `2b` 也会被视为 `true`。
- NBT 中没有与 `null` 等价的东西。
- 键两侧的引号是可选的。因此 JSON 属性 `"duration": 20` 在 NBT 中既可以写作 `duration: 20`，也可以写作 `"duration": 20`。
- 在 JSON 中称为子对象的东西，在 NBT 中称为**复合标签**（compound tag，或简称 compound）。
- 与 JSON 不同，NBT 列表不能混合类型。列表类型由第一个元素决定，或在代码中定义。
    - 不过，列表的列表可以混合不同的列表类型。因此，一个包含两个列表的列表，其中第一个是字符串列表、第二个是字节列表，是允许的。
- 存在与列表不同的特殊**数组**类型，但它们遵循在方括号中包含元素的方案。共有三种数组类型：
    - 字节数组，以数组开头的 `B;` 表示。示例：`[B;0b,30b]`
    - 整数数组，以数组开头的 `I;` 表示。示例：`[I;0,-300]`
    - 长整数数组，以数组开头的 `L;` 表示。示例：`[L;0l,240l]`
- 列表、数组和复合标签中允许尾随逗号。

## NBT 文件

> 相关 Minecraft Wiki：[NBT格式](https://zh.minecraft.wiki/w/NBT格式)

Minecraft 大量使用 `.nbt` 文件，例如[数据包][datapack]中的结构文件。包含某个区域内容（即一组区块）的区域文件（`.mca`），以及游戏在不同位置使用的各种 `.dat` 文件，同样是 NBT 文件。

NBT 文件通常使用 GZip 压缩。因此它们是二进制文件，无法直接编辑。

## 代码中的 NBT

> 相关 Minecraft Wiki：[NBT格式](https://zh.minecraft.wiki/w/NBT格式)

与 JSON 一样，所有 NBT 对象都是某个外层对象的子元素。所以我们先创建一个：

```java
CompoundTag tag = new CompoundTag();
```

现在我们可以把数据放入该标签：

```java
tag.putInt("Color", 0xffffff);
tag.putString("Level", "minecraft:overworld");
tag.putDouble("IAmRunningOutOfIdeasForNamesHere", 1d);
```

这里有许多辅助方法，例如除了接收 `int[]` 的标准变体之外，`putIntArray` 还有一个接收 `List<Integer>` 的便捷方法。

当然，我们也可以从该标签中获取值：

```java
int color = tag.getInt("Color");
String level = tag.getString("Level");
double d = tag.getDouble("IAmRunningOutOfIdeasForNamesHere");
```

数字类型在缺失时返回 0。字符串在缺失时返回 `""`。更复杂的类型（列表、数组、复合标签）在缺失时会抛出异常。

因此，我们希望检查标签元素是否存在以作防护：

```java
boolean hasColor = tag.contains("Color");
boolean hasColorMoreExplicitly = tag.contains("Color", Tag.TAG_INT);
```

`TAG_INT` 常量定义在 `Tag` 中，它是所有标签类型的父接口。除 `CompoundTag` 之外的大多数标签类型基本上是内部使用的，例如 `ByteTag` 或 `StringTag`，不过如果你偶尔遇到它们，直接的 `CompoundTag#get` 和 `#put` 方法可以与它们配合使用。

不过有一个明显的例外：`ListTag`。使用它们比较特殊，因为通过 `CompoundTag#getList` 获取列表标签时，你还必须指定列表类型。因此，获取字符串列表的写法如下：

```java
ListTag list = tag.getList("SomeListHere", Tag.TAG_STRING);
```

同样，在创建 `ListTag` 时，你也必须在创建期间指定列表类型：

```java
ListTag list = new ListTag(List.of("Value1", "Value2"), Tag.TAG_STRING);
```

最后，直接操作其他 `CompoundTag` 内部的 `CompoundTag` 会使用 `CompoundTag#get` 和 `#put`：

```java
tag.put("Tag", new CompoundTag());
tag.get("Tag");
```

## NBT 的用途

> 相关 Minecraft Wiki：[NBT格式](https://zh.minecraft.wiki/w/NBT格式)

NBT 在 Minecraft 中被大量使用。一些最常见的例子包括[`BlockEntity`][blockentity]和 `Entity`。

> **注意**
>
> `ItemStack` 将 NBT 的使用抽象为了[数据组件][datacomponents]。

## 另见

- [Minecraft Wiki 上的 NBT 格式][nbtwiki]

[blockentity]: https://docs.neoforged.net/docs/1.21.1/blockentities/
[datapack]: https://docs.neoforged.net/docs/1.21.1/resources/#data
[datacomponents]: https://docs.neoforged.net/docs/1.21.1/items/datacomponents
[nbtwiki]: https://minecraft.wiki/w/NBT_format

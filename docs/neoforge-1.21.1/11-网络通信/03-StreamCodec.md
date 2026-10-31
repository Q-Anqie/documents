---
title: "StreamCodec"
original_title: "Stream Codecs"
source: "https://docs.neoforged.net/docs/1.21.1/networking/streamcodecs"
version: "1.21.1"
---

# StreamCodec

Stream codec 是一种序列化工具，用于描述对象应如何存储到流（例如缓冲区）中以及如何从流中读取。Stream codec 主要被原版的[网络系统][networking]用于同步数据。

> **说明**
>
> 由于 stream codec 与 [Codec] 大致类似，本页采用了相同的排版方式以展示二者的相似之处。

## 使用 StreamCodec

Stream codec 分别通过 `StreamCodec#encode` 与 `StreamCodec#decode` 将对象编码到某个流中或从流中解码。`encode` 接收流与要编码进流的对象。`decode` 接收流并返回解码后的对象。通常，流是 `ByteBuf`、`FriendlyByteBuf` 或 `RegistryFriendlyByteBuf` 之一。

```java
// Let exampleStreamCodec represent a StreamCodec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let buffer be a RegistryFriendlyByteBuf

// Encode Java object into the buffer stream
exampleStreamCodec.encode(buffer, exampleObject);

// Read Java object from buffer stream
ExampleJavaObject obj = exampleStreamCodec.decode(buffer);
```

> **注意**
>
> 除非你手动处理缓冲区对象，否则通常永远不会直接调用 `encode` 与 `decode`。

## 现有的 Stream Codec

### `ByteBufCodecs`

`ByteBufCodecs` 包含某些基本类型与对象的 codec 静态实例。

| Stream Codec   | Java 类型     |
|----------------|---------------|
| `BOOL`         | `Boolean`     |
| `BYTE`         | `Byte`        |
| `SHORT`        | `Short`       |
| `INT`          | `Integer`     |
| `FLOAT`        | `Float`       |
| `DOUBLE`       | `Double`      |
| `BYTE_ARRAY`   | `byte[]`\*    |
| `STRING_UTF8`  | `String`\*\*  |
| `TAG`          | `Tag`         |
| `COMPOUND_TAG` | `CompoundTag` |
| `VECTOR3F`     | `Vector3f`    |
| `QUATERNIONF`  | `Quaternionf` |
| `GAME_PROFILE` | `GameProfile` |

\* `byte[]` 可以通过 `ByteBufCodecs#byteArray` 限制为一定数量的值。

\* `String` 可以通过 `ByteBufCodecs#stringUtf8` 限制为一定数量的字符。

此外，还有一些静态实例使用不同的方法对基本类型与对象进行编码和解码。

#### 无符号短整数

`UNSIGNED_SHORT` 是 `SHORT` 的一种替代，旨在被当作无符号数处理。由于 Java 中的数字是有符号的，无符号短整数在发送和接收时以 `Integer` 形式传递，并屏蔽掉高两个字节。

#### 可变长度数字

`VAR_INT` 与 `VAR_LONG` 是使值被编码得尽可能小的 stream codec。其做法是一次编码七个比特，并使用最高位作为标记，表示该数字是否还有更多数据。对于整数，0 到 2^28-1 之间的数字；对于长整数，0 到 2^56-1 之间的数字，将被发送为小于或等于整数或长整数本身字节数的长度。如果你的数字值通常处于该范围内且一般位于该范围的下端，那么应当使用这些可变长度 stream codec。

> **注意**
>
> `VAR_INT` 是 `INT` 的替代。

#### 受信任的标签

`TRUSTED_TAG` 与 `TRUSTED_COMPOUND_TAG` 分别是 `TAG` 与 `COMPOUND_TAG` 的变体，它们拥有无限制的堆内存用于解码标签，而 `TAG` 与 `COMPOUND_TAG` 有 2MiB 的上限。受信任的标签 stream codec 最好只在客户端绑定的封包中使用，正如原版在[方块实体数据封包][blockentity]与[实体数据序列化器][entityserializer]中所做的那样。

如果应使用不同的上限，则可以通过 `ByteBufCodecs#tagCodec` 或 `#compoundTagCodec` 提供一个带有指定大小的 `NbtAccounter`。

### 原版与 NeoForge

Minecraft 与 NeoForge 为许多经常被编码和解码的对象定义了大量 stream codec。例如用于 `ResourceLocation` 的 `ResourceLocation#STREAM_CODEC`，或用于 `ChunkPos` 的 `NeoForgeStreamCodecs#CHUNK_POS`。

大多数 stream codec 都可以在对象类自身内部，或在 `StreamCodec`、`ByteBufCodecs`、`NeoForgeStreamCodecs` 中找到。

## 创建 Stream Codec

Stream codec 可以为把任意对象读写到流中而创建。本文档将把流视为缓冲区，因为这是它的主要用途。

Stream codec 有两个泛型：`B` 表示缓冲区，`V` 表示对象值。`B` 通常是三种类型之一：`ByteBuf`、`FriendlyByteBuf`、`RegistryFriendlyByteBuf`，它们依次相互扩展。`FriendlyByteBuf` 增加了 Minecraft 特有的读写方法，而 `RegistryFriendlyByteBuf` 提供了对注册表列表及其对象的访问。

构造 stream codec 时，`B` 应当是最不具体的缓冲区类型。例如，`ResourceLocation` 是以字符串形式发送的。由于字符串受普通 `ByteBuf` 支持，因此其类型应为 `StreamCodec<ByteBuf, ResourceLocation>`。`FriendlyByteBuf` 包含写入 `ChunkPos` 的方法，因此其类型应为 `StreamCodec<FriendlyByteBuf, ChunkPos>`。`Item` 需要访问注册表，因此其类型应为 `StreamCodec<RegistryFriendlyByteBuf, Item>`。

大多数接收 stream codec 的方法都会查找 `? super B` 作为缓冲区类型，这意味着如果缓冲区类型是 `RegistryFriendlyByteBuf`，那么上述三个示例都可以使用。

### 成员编码器

`StreamMemberEncoder` 是 `StreamEncoder` 的一种替代，其中编码对象在前、缓冲区在后。这通常用于编码对象自身包含一个将该对象写入缓冲区的方法的情况。可以通过调用 `StreamCodec#ofMember` 使用 `StreamMemberEncoder` 来创建 `StreamCodec`。

```java
// Some object to create a stream codec for
public class ExampleObject {
    
    // The normal constructor
    public ExampleObject(String arg1, int arg2, boolean arg3) { /* ... */ }

    // The stream decoder reference
    public ExampleObject(ByteBuf buffer) { /* ... */ }

    // The stream encoder reference
    public void encode(ByteBuf buffer) { /* ... */ }
}

// What the stream codec would look like
public static StreamCodec<ByteBuf, ExampleObject> STREAM_CODEC =
    StreamCodec.ofMember(ExampleObject::encode, ExampleObject::new);
```

### 复合（Composite）

Stream codec 可以通过 `StreamCodec#composite` 读写对象。每个复合 stream codec 定义一组 stream codec 与 getter，它们按提供的顺序被读写。`composite` 的重载最多支持六个参数。

`composite` 中每两个参数代表一个用于读写该字段的 stream codec，以及一个从对象中获取该字段以进行编码的 getter。最后一个参数是一个在解码时创建对象新实例的函数。

```java
// Objects to create a stream codec for
public record SimpleExample(String arg1, int arg2, boolean arg3) {}
public record RegistryExample(double arg1, Holder<Item> arg2) {}

// The stream codecs
public static final StreamCodec<ByteBuf, SimpleExample> SIMPLE_STREAM_CODEC =
    StreamCodec.composite(
        // Stream codec and getter pair
        ByteBufCodecs.STRING_UTF8, SimpleExample::arg1,
        ByteBufCodecs.VAR_INT, SimpleExample::arg2,
        ByteBufCodecs.BOOL, SimpleExample::arg3,
        SimpleExample::new
    );

// Since this has a holder, a RegistryFriendlyByteBuf is used
public static final StreamCodec<RegistryFriendlyByteBuf, RegistryExample> REGISTRY_STREAM_CODEC =
    StreamCodec.composite(
        // Note that ByteBuf stream codecs can be used here
        ByteBufCodecs.DOUBLE, RegistryExample::arg1,
        ByteBufCodecs.holderRegistry(Registries.ITEM), RegistryExample::arg2,
        RegistryExample::new
    );
```

### 转换器

Stream codec 可以通过映射方法转换为等价的或部分等价的表示形式。其中两个映射方法作用于值，一个映射方法作用于缓冲区。

`map` 方法使用两个函数转换值：一个将当前类型转换为新类型，另一个将新类型转换回当前类型。这类似于 [Codec 转换器][transformers]。

```java
public static final StreamCodec<ByteBuf, ResourceLocation> STREAM_CODEC = 
    ByteBufCodecs.STRING_UTF8.map(
        // String -> ResourceLocation
        ResourceLocation::new,
        // ResourceLocation -> String
        ResourceLocation::toString
    );
```

`apply` 方法使用 `StreamCodec.CodecOperation` 转换值。`StreamCodec.CodecOperation` 接收当前类型的 stream codec，并返回新类型的 stream codec。它们通常围绕 `map` 封装，或接收辅助方法。

```java
public static final StreamCodec<ByteBuf, List<ResourceLocation>> STREAM_CODEC =
    ResourceLocation.STREAM_CODEC.apply(ByteBufCodecs.list());
```

`mapStream` 方法使用一个函数转换缓冲区，该函数接收新的缓冲区类型并返回当前的缓冲区类型。此方法很少需要使用，因为大多数带 stream codec 的方法并不需要改变缓冲区类型。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Integer> STREAM_CODEC =
    ByteBufCodecs.VAR_INT.mapStream(buffer -> (ByteBuf) buffer);
```

### 单元（Unit）

一个提供代码内固定值且不编码任何内容的 stream codec 可以使用 `StreamCodec#unit` 表示。当不应通过网络同步任何信息时，这很有用。

> **警告**
>
> Unit stream codec 要求任何被编码的对象都必须与指定的 unit 匹配，否则将抛出错误。因此，所有对象都必须有某种 `equals` 实现，使其对 unit 对象返回 true；或者保证编码时提供的实例始终是该 unit 实例。

```java
public static final StreamCodec<ByteBuf, Item> UNIT_STREAM_CODEC =
    StreamCodec.unit(Items.AIR);
```
### 延迟初始化

有时，某个 stream codec 可能依赖构造时尚不存在的数据。在这种情况下，可以使用 `NeoForgeStreamCodecs#lazy` 让 stream codec 在首次读/写时自行构造。该方法接收一个提供 stream codec 的 supplier。

```java
public static final StreamCodec<ByteBuf, Item> LAZY_STREAM_CODEC = 
    NeoForgeStreamCodecs.lazy(
        () -> StreamCodec.unit(Items.AIR)
    );
```

### 集合

集合的 stream codec 可以通过 `collection` 从对象的 stream codec 生成。`collection` 接收一个构造空集合的 `IntFunction`、对象的 stream codec，以及一个可选的最大容量。

```java
public static final StreamCodec<ByteBuf, Set<BlockPos>> COLLECTION_STREAM_CODEC =
    ByteBufCodecs.collection(
        HashSet::new, // Constructs a set with the specified capacity
        BlockPos.STREAM_CODEC,
        256 // The set can only have up to 256 elements
    );
```

`collection` 的另一个重载可以与 `StreamCodec#apply` 一起使用。

```java
public static final StreamCodec<ByteBuf, Set<BlockPos>> COLLECTION_STREAM_CODEC =
    BlockPos.STREAM_CODEC.apply(
        ByteBufCodecs.collection(HashSet::new)
    );
```

基于列表的集合也可以通过 `StreamCodec#apply` 调用 `ByteBufCodecs#list` 来指定，并可传入可选的最大容量。

```java
public static final StreamCodec<ByteBuf, List<BlockPos>> LIST_STREAM_CODEC =
    BlockPos.STREAM_CODEC.apply(
        // The list can only have up to 256 elements
        ByteBufCodecs.list(256)
    );
```

### 映射（Map）

键值对象映射的 stream codec 可以通过两个 stream codec 使用 `ByteBufCodecs#map` 生成。该函数还接收一个构造空映射的 `IntFunction` 以及一个可选的最大容量。

```java
public static final StreamCodec<ByteBuf, Map<String, BlockPos>> MAP_STREAM_CODEC =
    ByteBufCodecs.map(
        HashMap::new, // Constructs a map with the specified capacity
        ByteBufCodecs.STRING_UTF8,
        BlockPos.STREAM_CODEC,
        256 // The map can only have up to 256 elements
    );
```

### 二选一（Either）

对同一对象数据提供两种不同读写方式的 stream codec，可以通过两个 stream codec 使用 `ByteBufCodecs#either` 生成。该方法会先读写一个布尔值，指示应分别读写第一个还是第二个 stream codec。

```java
public static final StreamCodec<ByteBuf, Either<Integer, String>> EITHER_STREAM_CODEC = 
    ByteBufCodecs.either(
        ByteBufCodecs.VAR_INT,
        ByteBufCodecs.STRING_UTF8
    );
```

### ID 映射器

在大多数情况下，当在网络中发送那些两侧都存在的对象的信息时，会发送一个表示 id 的整数。表示对象的 id 减少了需要跨网络同步的信息量。枚举与注册表都利用了这一点。

`ByteBufCodecs#idMapper` 提供了一种发送对象 id 的便捷方式。它要么接收两个函数（将对象转换为 int 以及反向转换），要么接收一个 `IdMap`。

```java
// For some enum
public enum ExampleIdObject {
    ;

    // Gets Id -> Enum
    public static final IntFunction<ExampleIdObject> BY_ID = 
        ByIdMap.continuous(
            ExampleIdObject::getId,
            ExampleIdObject.values(),
            ByIdMap.OutOfBoundsStrategy.ZERO
    );
    
    ExampleIdObject(int id) { /* ... */ }
}

// The stream codec would look like
public static final StreamCodec<ByteBuf, ExampleIdObject> ID_STREAM_CODEC =
    ByteBufCodecs.idMapper(ExampleIdObject.BY_ID, ExampleIdObject::getId);
```

> **注意**
>
> NeoForge 通过 `IExtensibleEnum#createStreamCodecForExtensibleEnum` 为 id 映射器提供了另一种实现，它不会在构造时缓存枚举值。不过在可扩展枚举之外，这很少需要用到。

### 可选值（Optional）

发送 `Optional` 包装值的 stream codec 可以通过向 `ByteBufCodecs#optional` 提供一个 stream codec 来生成。该方法会先读写一个布尔值，指示是否应读写该对象。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Optional<DataComponentType<?>>> OPTIONAL_STREAM_CODEC =
    DataComponentType.STREAM_CODEC.apply(ByteBufCodecs::optional);
```

### 注册表对象

注册表对象可以通过三种方法之一在网络中发送：`registry`、`holderRegistry` 或 `holder`。每个方法都接收一个 `ResourceKey`，表示该注册表对象所在的注册表。

> **警告**
>
> 自定义注册表必须通过调用 `RegistryBuilder#sync` 并将值设为 `true` 来使其可同步。否则编码器将抛出异常。

`registry` 与 `holderRegistry` 分别返回注册表对象或包装了注册表对象的 holder。这些方法发送一个表示注册表对象的 id。

```java
// Registry object
public static final StreamCodec<RegistryFriendlyByteBuf, Item> VALUE_STREAM_CODEC =
    BytebufCodecs.registry(Registries.ITEM);

// Holder of registry object
public static final StreamCodec<RegistryFriendlyByteBuf, Holder<Item>> HOLDER_STREAM_CODEC =
    BytebufCodecs.holderRegistry(Registries.ITEM);
```

`holder` 返回一个包装了注册表对象的 holder。该方法发送表示注册表对象的 id；如果提供的 `Holder` 是直接引用，则发送注册表对象本身。为此，`holder` 还接收注册表对象的 stream codec。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, Holder<SoundEvent>> STREAM_CODEC =
    ByteBufCodecs.holder(
        Registries.SOUND_EVENT, SoundEvent.DIRECT_STREAM_CODEC
    );
```

> **注意**
>
> 只有当 holder 不是直接引用时，`holder` 才会针对未同步的自定义注册表抛出异常。

### Holder 集合

标签或包装了注册表对象的 holder 集合可以通过 `holderSet` 发送。该方法接收一个 `ResourceKey`，表示这些注册表对象所在的注册表。

```java
public static final StreamCodec<RegistryFriendlyByteBuf, HolderSet<Item>> HOLDER_SET_STREAM_CODEC =
    BytebufCodecs.holderSet(Registries.ITEM);
```

### 递归

有时，某个对象可能作为字段引用同类型的对象。例如，`MobEffectInstance` 在存在隐藏效果时会接收一个可选的 `MobEffectInstance`。在这种情况下，可以使用 `StreamCodec#recursive`，通过一个函数把 stream codec 自身作为参数传入，从而创建该 stream codec。

```java
// Define our recursive object
public record RecursiveObject(Optional<RecursiveObject> inner) { /* ... */ }

public static final StreamCodec<ByteBuf, RecursiveObject> RECURSIVE_CODEC = StreamCodec.recursive(
    recursedStreamCodec -> StreamCodec.composite(
        recursedStreamCodec.apply(ByteBufCodecs::optional),
        RecursiveObject::inner,
        RecursiveObject::new
    )
);
```

### 分发（Dispatch）

Stream codec 可以拥有子 stream codec，通过 `StreamCodec#dispatch` 根据某个指定类型解码特定对象。这通常与表示类型的注册表对象一起使用，例如 `ParticleOptions` 的 `ParticleType`，或 `Stat` 的 `StatType`。

分发 stream codec 首先尝试读写类型对象。随后，当前对象通过该方法提供的函数之一进行读写。第一个 `Function` 接收当前对象并获取用于写出值的类型。第二个 `Function` 接收类型对象并获取用于读取值的当前对象的 `StreamCodec`。

```java
// Define our object(s)
public abstract class ExampleObject {

    // Define the method used to specify the object type for encoding
    public abstract StreamCodec<? super RegistryFriendlyByteBuf, ? extends ExampleObject> streamCodec();
}

// Assume there is a ResourceKey<StreamCodec< super RegistryFriendlyByteBuf, ? extends ExampleObject>> DISPATCH
public static final StreamCodec<RegistryFriendlyByteBuf, ExampleObject> DISPATCH_STREAM_CODEC =
    ByteBufCodecs.registry(DISPATCH).dispatch(
        // Get the stream codec from the specific object
        ExampleObject::streamCodec,
        // Get the stream codec from the registry object
        Function.identity()
    )
```

[networking]: https://docs.neoforged.net/docs/1.21.1/networking/payload
[codecs]: https://docs.neoforged.net/docs/1.21.1/datastorage/codecs
[blockentity]: https://docs.neoforged.net/docs/1.21.1/blockentities/#synchronizing-on-block-update
[entityserializer]: https://docs.neoforged.net/docs/1.21.1/networking/entities#dynamic-data-parameters
[transformers]: https://docs.neoforged.net/docs/1.21.1/datastorage/codecs#transformers

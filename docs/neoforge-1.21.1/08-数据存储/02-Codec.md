---
title: "Codec"
original_title: "Codec"
source: "https://docs.neoforged.net/docs/1.21.1/datastorage/codecs"
version: "1.21.1"
---

# Codec

> 相关 Minecraft Wiki：[NBT格式](https://zh.minecraft.wiki/w/NBT格式)

Codec 是 Mojang [DataFixerUpper] 中的序列化工具，用于描述对象如何在不同格式之间转换，例如 JSON 的 `JsonElement` 和 NBT 的 `Tag`。

## 使用 Codec

Codec 主要用于将 Java 对象编码（序列化）为某种数据格式类型，以及将格式化的数据对象解码（反序列化）回其对应的 Java 类型。这通常分别通过 `Codec#encodeStart` 和 `Codec#parse` 完成。

### DynamicOps

为了确定编码和解码所使用的中间文件格式，`#encodeStart` 和 `#parse` 都需要一个 `DynamicOps` 实例来定义该格式内的数据。

[DataFixerUpper] 库包含 `JsonOps`，用于对存储在 [`Gson`][gson] 的 `JsonElement` 实例中的 JSON 数据进行 codec 处理。`JsonOps` 支持两种 `JsonElement` 序列化版本：`JsonOps#INSTANCE` 定义标准 JSON 文件，`JsonOps#COMPRESSED` 允许将数据压缩为单个字符串。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleJson be a JsonElement

// Encode Java object to regular JsonElement
exampleCodec.encodeStart(JsonOps.INSTANCE, exampleObject);

// Encode Java object to compressed JsonElement
exampleCodec.encodeStart(JsonOps.COMPRESSED, exampleObject);

// Decode JsonElement into Java object
// Assume JsonElement was parsed normally
exampleCodec.parse(JsonOps.INSTANCE, exampleJson);
```

Minecraft 还提供了 `NbtOps`，用于对存储在 `Tag` 实例中的 NBT 数据进行 codec 处理。可通过 `NbtOps#INSTANCE` 引用它。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleNbt be a Tag

// Encode Java object to Tag
exampleCodec.encodeStart(NbtOps.INSTANCE, exampleObject);

// Decode Tag into Java object
exampleCodec.parse(NbtOps.INSTANCE, exampleNbt);
```

为处理注册表条目，Minecraft 提供了 `RegistryOps`，其中包含用于获取可用注册表元素的查找提供器。这些可通过 `RegistryOps#create` 创建，该方法接收用于存储数据的特定类型的 `DynamicOps`，以及包含可用注册表访问权限的查找提供器。NeoForge 扩展了 `RegistryOps` 以创建 `ConditionalOps`：一个能够处理[加载条目条件][conditions]的注册表 codec 查找器。

```java
// Let lookupProvider be a HolderLookup.Provider
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleObject be a ExampleJavaObject
// Let exampleJson be a JsonElement

// Get the registry ops for JsonElement
RegistryOps<JsonElement> ops = RegistryOps.create(JsonOps.INSTANCE, lookupProvider);

// Encode Java object to JsonElement
exampleCodec.encodeStart(ops, exampleObject);

// Decode JsonElement into Java object
exampleCodec.parse(ops, exampleJson);
```

#### 格式转换

`DynamicOps` 也可以单独用于在两种不同的编码格式之间转换。这可以通过 `#convertTo` 并传入 `DynamicOps` 格式与待转换的已编码对象来完成。

```java
// Convert Tag to JsonElement
// Let exampleTag be a Tag
JsonElement convertedJson = NbtOps.INSTANCE.convertTo(JsonOps.INSTANCE, exampleTag);
```

### DataResult

使用 codec 编码或解码的数据会返回一个 `DataResult`，其中持有转换后的实例，或根据转换是否成功而持有某些错误数据。当转换成功时，`#result` 提供的 `Optional` 将包含成功转换的对象。如果转换失败，`#error` 提供的 `Optional` 将包含 `PartialResult`，其中持有错误消息以及根据 codec 而定的部分转换对象。

此外，`DataResult` 上还有许多方法可用于将结果或错误转换为所需格式。例如，`#resultOrPartial` 在成功时返回包含结果的 `Optional`，失败时返回部分转换的对象。该方法接收一个字符串消费者，用于在存在错误消息时确定如何报告它。

```java
// Let exampleCodec represent a Codec<ExampleJavaObject>
// Let exampleJson be a JsonElement

// Decode JsonElement into Java object
DataResult<ExampleJavaObject> result = exampleCodec.parse(JsonOps.INSTANCE, exampleJson);

result
    // Get result or partial on error, report error message
    .resultOrPartial(errorMessage -> /* Do something with error message */)
    // If result or partial is present, do something
    .ifPresent(decodedObject -> /* Do something with decoded object */);
```

## 现有的 Codec

### 基本类型

`Codec` 类包含针对某些已定义基本类型的静态 codec 实例。

Codec         | Java 类型
:---:         | :---
`BOOL`        | `Boolean`
`BYTE`        | `Byte`
`SHORT`       | `Short`
`INT`         | `Integer`
`LONG`        | `Long`
`FLOAT`       | `Float`
`DOUBLE`      | `Double`
`STRING`      | `String`\*
`BYTE_BUFFER` | `ByteBuffer`
`INT_STREAM`  | `IntStream`
`LONG_STREAM` | `LongStream`
`PASSTHROUGH` | `Dynamic<?>`\*\*
`EMPTY`       | `Unit`\*\*\*

\* `String` 可通过 `Codec#string` 或 `Codec#sizeLimitedString` 限制为特定字符数。

\*\* `Dynamic` 是一个持有以受支持的 `DynamicOps` 格式编码的值的对象。这些通常用于将已编码的对象格式转换为其他已编码的对象格式。

\*\*\* `Unit` 是用于表示 `null` 对象的对象。

### 原版与 NeoForge

Minecraft 和 NeoForge 为许多频繁编码与解码的对象定义了大量 codec。一些例子包括用于 `ResourceLocation` 的 `ResourceLocation#CODEC`、用于 `DateTimeFormatter#ISO_INSTANT` 格式的 `Instant` 的 `ExtraCodecs#INSTANT_ISO8601`，以及用于 `CompoundTag` 的 `CompoundTag#CODEC`。

> **警告**
>
> `CompoundTag` 无法使用 `JsonOps` 从 JSON 解码数字列表。`JsonOps` 在转换时会将数字设置为其最窄的类型。`ListTag` 会为其数据强制指定特定类型，因此类型不同的数字（例如 `64` 会是 `byte`，`384` 会是 `short`）在转换时会抛出错误。

原版与 NeoForge 注册表也为其所包含对象类型的 codec（例如 `BuiltInRegistries#BLOCK` 拥有 `Codec<Block>`）。`Registry#byNameCodec` 会将注册表对象编码为其注册名。原版注册表还拥有 `Registry#holderByNameCodec`，它编码为注册名，并解码为包装在 `Holder` 中的注册表对象。

## 创建 Codec

可以为编码和解码任意对象创建 codec。为便于理解，下文会展示等价的已编码 JSON。

### 记录

Codec 可通过记录（record）来定义对象。每个记录 codec 通过显式命名的字段来定义对象。创建记录 codec 的方式有很多，但最简单的是通过 `RecordCodecBuilder#create`。

`RecordCodecBuilder#create` 接收一个定义 `Instance` 并返回该对象应用（`App`）的函数。可以类比为创建一个类的*实例*，以及用于将该类*应用*到所构造对象上的构造方法。

```java
// Some object to create a codec for
public class SomeObject {

    public SomeObject(String s, int i, boolean b) { /* ... */ }

    public String s() { /* ... */ }

    public int i() { /* ... */ }

    public boolean b() { /* ... */ }
}
```

#### 字段

`Instance` 可通过 `#group` 定义最多 16 个字段。每个字段都必须是一个应用，用于定义正在为其构造对象的实例以及对象的类型。满足该要求的最简单方式是取一个 `Codec`，设置要从中解码的字段名，并设置用于编码该字段的 getter。

字段可通过 `#fieldOf`（若字段必需）或 `#optionalFieldOf`（若字段包装在 `Optional` 中或有默认值）从 `Codec` 创建。这两种方法都需要一个包含已编码对象中字段名的字符串。随后可使用 `#forGetter` 设置用于编码该字段的 getter，它接收一个给定对象返回字段数据的函数。

> **警告**
>
> 如果存在某个元素在解析时抛出错误，`#optionalFieldOf` 将抛出错误。如果该错误应当被忽略，请改用 `#lenientOptionalFieldOf`。

由此，可通过 `#apply` 应用所得到的积（product），以定义该实例应如何为应用构造对象。为方便起见，分组字段应按其在构造方法中出现的顺序列出，以便该函数可以直接是构造方法的方法引用。

```java
public static final Codec<SomeObject> RECORD_CODEC = RecordCodecBuilder.create(instance -> // Given an instance
    instance.group( // Define the fields within the instance
        Codec.STRING.fieldOf("s").forGetter(SomeObject::s), // String
        Codec.INT.optionalFieldOf("i", 0).forGetter(SomeObject::i), // Integer, defaults to 0 if field not present
        Codec.BOOL.fieldOf("b").forGetter(SomeObject::b) // Boolean
    ).apply(instance, SomeObject::new) // Define how to create the object
);
```

```json5
// Encoded SomeObject
{
    "s": "value",
    "i": 5,
    "b": false
}

// Another encoded SomeObject
{
    "s": "value2",
    // i is omitted, defaults to 0
    "b": true
}

// Another encoded SomeObject
{
    "s": "value2",
    // Will throw an error as lenientOptionalFieldOf is not used
    "i": "bad_value",
    "b": true
}
```

### 转换器

Codec 可通过映射方法转换为等价或部分等价的表示。每个映射方法接收两个函数：一个将当前类型转换为新类型，另一个将新类型转换回当前类型。这通过 `#xmap` 函数完成。

```java
// A class
public class ClassA {

    public ClassB toB() { /* ... */ }
}

// Another equivalent class
public class ClassB {

    public ClassA toA() { /* ... */ }
}

// Assume there is some codec A_CODEC
public static final Codec<ClassB> B_CODEC = A_CODEC.xmap(ClassA::toB, ClassB::toA);
```

如果某一类型只是部分等价，即转换过程中存在某些限制，则有一些映射函数会返回 `DataResult`，可用于在遇到异常或无效状态时返回错误状态。

A 与 B 完全等价 | B 与 A 完全等价 | 转换方法
:---:             | :---:             | :---
是                | 是                | `#xmap`
是                | 否                | `#flatComapMap`
否                | 是                | `#comapFlatMap`
否                | 否                | `#flatXMap`

```java
// Given an string codec to convert to a integer
// Not all strings can become integers (A is not fully equivalent to B)
// All integers can become strings (B is fully equivalent to A)
public static final Codec<Integer> INT_CODEC = Codec.STRING.comapFlatMap(
    s -> { // Return data result containing error on failure
        try {
            return DataResult.success(Integer.valueOf(s));
        } catch (NumberFormatException e) {
            return DataResult.error(s + " is not an integer.");
        }
    },
    Integer::toString // Regular function
);
```

```json5
// Will return 5
"5"

// Will error, not an integer
"value"
```

#### 范围 Codec

范围 codec 是 `#flatXMap` 的一种实现，如果值不在所设置的最小值与最大值之间（含边界）则返回错误 `DataResult`。若超出边界，该值仍会作为部分结果提供。整数、浮点数和双精度浮点数分别有对应实现：`#intRange`、`#floatRange` 和 `#doubleRange`。

```java
public static final Codec<Integer> RANGE_CODEC = Codec.intRange(0, 4); 
```

```json5
// Will be valid, inside [0, 4]
4

// Will error, outside [0, 4]
5
```

#### 字符串解析器

`Codec#stringResolver` 是 `flatXmap` 的一种实现，它将字符串映射到某种对象。

```java
public record StringResolverObject(String name) { /* ... */ }

// Assume there is some Map<String, StringResolverObject> OBJECT_MAP
public static final Codec<StringResolverObject> STRING_RESOLVER_CODEC = Codec.stringResolver(StringResolverObject::name, OBJECT_MAP::get);
```

```json5
// Will map this string to its associated object
"example_name"
```

### 默认值

如果编码或解码的结果失败，可通过 `Codec#orElse` 或 `Codec#orElseGet` 提供一个默认值。

```java
public static final Codec<Integer> DEFAULT_CODEC = Codec.INT.orElse(
    errorMessage -> /* Do something with the error message */,
    0 // Can also be a supplied value via #orElseGet
); 
```

```json5
// Not an integer, defaults to 0
"value"
```

### 单位

若某个 codec 提供一个代码内的值且编码为空，可通过 `Codec#unit` 表示。当 codec 使用数据对象中不可编码的条目时，这很有用。

```java
public static final Codec<IEventBus> UNIT_CODEC = Codec.unit(
    () -> NeoForge.EVENT_BUS // Can also be a raw value
);
```

```json5
// Nothing here, will return the NeoForge event bus
```

### 延迟初始化

有时 codec 可能依赖于其构造时尚不存在的数据。在这些情况下，可使用 `Codec#lazyInitialized` 让 codec 在首次编码/解码时构造自身。该方法接收一个提供的 codec。

```java
public static final Codec<IEventBus> LAZY_CODEC = Codec.lazyInitialized(
    () -> Codec.Unit(NeoForge.EVENT_BUS)
);
```

```json5
// Nothing here, will return the NeoForge event bus
// Encodes/decodes the same way as the normal codec
```

### 列表

对象列表的 codec 可通过 `Codec#listOf` 从对象 codec 生成。`listOf` 也可接收表示列表最小与最大长度的整数。`sizeLimitedListOf` 作用相同，但只指定上界。

```java
// BlockPos#CODEC is a Codec<BlockPos>
public static final Codec<List<BlockPos>> LIST_CODEC = BlockPos.CODEC.listOf();
```

```json5
// Encoded List<BlockPos>
[
    [1, 2, 3], // BlockPos(1, 2, 3)
    [4, 5, 6], // BlockPos(4, 5, 6)
    [7, 8, 9]  // BlockPos(7, 8, 9)
]
```

使用列表 codec 解码的列表对象存储在**不可变**列表中。如果需要可变列表，应对列表 codec 应用[转换器]。

### 映射

键值对象映射的 codec 可通过 `Codec#unboundedMap` 从两个 codec 生成。无界映射可指定任意基于字符串或经字符串转换的值作为键。

```java
// BlockPos#CODEC is a Codec<BlockPos>
public static final Codec<Map<String, BlockPos>> MAP_CODEC = Codec.unboundedMap(Codec.STRING, BlockPos.CODEC);
```

```json5
// Encoded Map<String, BlockPos>
{
    "key1": [1, 2, 3], // key1 -> BlockPos(1, 2, 3)
    "key2": [4, 5, 6], // key2 -> BlockPos(4, 5, 6)
    "key3": [7, 8, 9]  // key3 -> BlockPos(7, 8, 9)
}
```

使用无界映射 codec 解码的映射对象存储在**不可变**映射中。如果需要可变映射，应对映射 codec 应用[转换器]。

> **警告**
>
> 无界映射仅支持编码/解码为字符串的键。可以使用键值[对]列表 codec 来绕开该限制。

### 对

对象对的 codec 可通过 `Codec#pair` 从两个 codec 生成。

对 codec 解码对象时，先解码对中的左对象，然后取已编码对象的剩余部分并从中解码右对象。因此，这些 codec 要么必须表达解码后已编码对象的某些信息（例如[记录]），要么必须被增强为 `MapCodec` 并通过 `#codec` 转换为常规 codec。这通常可以通过将 codec 设为某个对象的[字段]来实现。

```java
public static final Codec<Pair<Integer, String>> PAIR_CODEC = Codec.pair(
    Codec.INT.fieldOf("left").codec(),
    Codec.STRING.fieldOf("right").codec()
);
```

```json5
// Encoded Pair<Integer, String>
{
    "left": 5,       // fieldOf looks up 'left' key for left object
    "right": "value" // fieldOf looks up 'right' key for right object
}
```

> **提示**
>
> 具有非字符串键的映射 codec 可以通过应用了[转换器]的键值对列表来编码/解码。

### 二者之一

针对同一对象数据的两种不同编码/解码方式的 codec，可通过 `Codec#either` 从两个 codec 生成。

二者之一 codec 会先尝试用第一个 codec 解码对象。如果失败，则尝试用第二个 codec 解码。如果仍然失败，`DataResult` 将只包含第二个 codec 失败的错误。

```java
public static final Codec<Either<Integer, String>> EITHER_CODEC = Codec.either(
    Codec.INT,
    Codec.STRING
);
```

```json5
// Encoded Either.Left<Integer, String>
5

// Encoded Either.Right<Integer, String>
"value"
```

> **提示**
>
> 这可以与[转换器]结合使用，从两种不同的编码方式中获取特定对象。

#### 异或

`Codec#xor` 是[二者之一] codec 的特例，仅当两种方法之一成功处理时结果才成功。如果两个 codec 都能处理，则改为抛出错误。

```java
public static final Codec<Either<Integer, String>> XOR_CODEC = Codec.xor(
    Codec.INT.fieldOf("number").codec(),
    Codec.STRING.fieldOf("text").codec()
);
```

```json5
// Encoded Either.Left<Integer, String>
{
    "number": 4
}

// Encoded Either.Right<Integer, String>
{
    "text": "value"
}

// Throws an error as both can be decoded
{
    "number": 4,
    "text": "value"
}
```

#### 备选

`Codec#withAlternative` 是[二者之一] codec 的特例，其中两个 codec 都试图解码同一个对象，但存储格式不同。第一个（主）codec 会尝试解码对象。失败时，将改用第二个 codec。编码始终使用主 codec。

```java
public static final Codec<BlockPos> ALTERNATIVE_CODEC = Codec.withAlternative(
    BlockPos.CODEC,
    RecordCodecBuilder.create(instance -> instance.group(
        Codec.INT.fieldOf("x").forGetter(BlockPos::getX),
        Codec.INT.fieldOf("y").forGetter(BlockPos::getY),
        Codec.INT.fieldOf("z").forGetter(BlockPos::getZ)
    ), BlockPos::new)
);
```

```json5
// Normal method to decode BlockPos
[ 1, 2, 3 ]

// Alternative method to decode BlockPos
{
    "x": 1,
    "y": 2,
    "z": 3
}
```

### 递归

有时对象可能将同类型的对象作为字段引用。例如，`EntityPredicate` 为载具、乘客和目标实体接收 `EntityPredicate`。在这种情况下，可使用 `Codec#recursive` 将 codec 作为创建 codec 的函数的一部分提供。

```java
// Define our recursive object
public record RecursiveObject(Optional<RecursiveObject> inner) { /* ... */ }

public static final Codec<RecursiveObject> RECURSIVE_CODEC = Codec.recursive(
    RecursiveObject.class.getSimpleName(), // This is for the toString method
    recursedCodec -> RecordCodecBuilder.create(instance -> instance.group(
        recursedCodec.optionalFieldOf("inner").forGetter(RecursiveObject::inner)
    ).apply(instance, RecursiveObject::new))
);
```

```json5
// An encoded recursive object
{
    "inner": {
        "inner": {}
    }
}
```

### 分发

Codec 可以拥有子 codec，通过 `Codec#dispatch` 根据某个指定类型解码特定对象。这通常用于包含 codec 的注册表，例如规则测试或方块放置器。

分发 codec 首先尝试从某个字符串键（通常是 `type`）获取已编码的类型。随后解码该类型，调用 getter 获取用于解码实际对象的特定 codec。如果用于解码对象的 `DynamicOps` 会压缩其映射，或者对象 codec 本身未被增强为 `MapCodec`（例如记录或带字段的基本类型），则对象需要存储在 `value` 键中。否则，对象会与其他数据处于同一层级进行解码。

```java
// Define our object
public abstract class ExampleObject {

    // Define the method used to specify the object type for encoding
    public abstract MapCodec<? extends ExampleObject> type();
}

// Create simple object which stores a string
public class StringObject extends ExampleObject {

    public StringObject(String s) { /* ... */ }

    public String s() { /* ... */ }

    public MapCodec<? extends ExampleObject> type() {
        // A registered registry object
        // "string":
        //   Codec.STRING.xmap(StringObject::new, StringObject::s).fieldOf("string")
        return STRING_OBJECT_CODEC.get();
    }
}

// Create complex object which stores a string and integer
public class ComplexObject extends ExampleObject {

    public ComplexObject(String s, int i) { /* ... */ }

    public String s() { /* ... */ }

    public int i() { /* ... */ }

    public MapCodec<? extends ExampleObject> type() {
        // A registered registry object
        // "complex":
        //   RecordCodecBuilder.mapCodec(instance ->
        //     instance.group(
        //       Codec.STRING.fieldOf("s").forGetter(ComplexObject::s),
        //       Codec.INT.fieldOf("i").forGetter(ComplexObject::i)
        //     ).apply(instance, ComplexObject::new)
        //   )
        return COMPLEX_OBJECT_CODEC.get();
    }
}

// Assume there is an Registry<MapCodec<? extends ExampleObject>> DISPATCH
public static final Codec<ExampleObject> = DISPATCH.byNameCodec() // Gets Codec<MapCodec<? extends ExampleObject>>
    .dispatch(
        ExampleObject::type, // Get the codec from the specific object
        Function.identity() // Get the codec from the registry
    );
```

```json5
// Simple object
{
    "type": "string", // For StringObject
    "value": "value" // Codec type is not augmented from MapCodec, needs field
}

// Complex object
{
    "type": "complex", // For ComplexObject

    // Codec type is augmented from MapCodec, can be inlined
    "s": "value",
    "i": 0
}
```

[DataFixerUpper]: https://github.com/Mojang/DataFixerUpper
[gson]: https://github.com/google/gson
[conditions]: https://docs.neoforged.net/docs/1.21.1/resources/server/conditions
[transformer]: https://docs.neoforged.net/docs/1.21.1/datastorage/codecs#transformer-codecs
[pair]: https://docs.neoforged.net/docs/1.21.1/datastorage/codecs#pair
[records]: https://docs.neoforged.net/docs/1.21.1/datastorage/codecs#records
[field]: https://docs.neoforged.net/docs/1.21.1/datastorage/codecs#fields
[either]: https://docs.neoforged.net/docs/1.21.1/datastorage/codecs#either

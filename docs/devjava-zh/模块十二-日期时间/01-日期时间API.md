# 日期时间 API（The Date Time API）

> 来源：Oracle 官方 [Dev.java 教程](https://dev.java/learn/) →《The Date Time API》
> 忠实还原 `java.time` 包全部核心概念。后端高频考点：时间字段处理、时区、格式化、Period/Duration、新旧 API 迁移。

`java.time` 包（Java 8 引入）提供了支持**日期、时间、瞬间（instant）和时长（duration）**的类。它取代了老旧的 `java.util.Date` 和 `java.util.Calendar`。

---

## 一、总览：人类时间 vs 机器时间（Overview & Standard Calendar）

理解日期时间 API 的关键是区分两种时间概念：

| 概念 | 代表类 | 用途 |
|------|--------|------|
| **人类时间**（Human Time） | `LocalDate`、`LocalTime`、`LocalDateTime` | 面向人：今天是几号、现在几点。**不含时区**，认为"一年永远是 12 个月、一天永远是 24 小时" |
| **机器时间**（Machine Time） | `Instant`、`Duration` | 面向机器：时间轴上的一个**瞬时点**（epoch 秒 + 纳秒），无日期/时间概念 |
| **带时区的人类时间** | `ZonedDateTime`、`OffsetDateTime` | 人类时间 + 时区/偏移，用于国际业务 |
| **用于计算的时间量** | `Period`、`Duration`、`ChronoUnit` | 计算两个时间点之间的差 |

**核心原则**：时间计算用机器时间（`Instant`/`Duration`），向人展示用人类时间（`LocalDate`/`ZonedDateTime`）。

### 主时段类（Primary Temporal-Based Classes）速查表

| 类 | 含时间 | 含时区 | 用途 |
|----|:----:|:----:|------|
| `LocalDate` | ✗ | ✗ | 日期（2026-08-31），无时间时区 |
| `LocalTime` | ✓ | ✗ | 时间（14:30:00），无日期时区 |
| `LocalDateTime` | ✓ | ✗ | 日期+时间，**无时区**（最常见） |
| `ZonedDateTime` | ✓ | ✓ | 日期+时间+**时区**（用于跨时区业务） |
| `OffsetDateTime` | ✓ | ✓（偏移） | 日期+时间+**UTC 偏移**（如 +08:00） |
| `OffsetTime` | ✓ | ✓（偏移） | 时间+偏移 |
| `Instant` | ✓（机器） | 无 | 时间轴瞬时点（epoch 秒） |
| `YearMonth` | ✗ | ✗ | 年+月（2026-08） |
| `MonthDay` | ✗ | ✗ | 月+日（12-25，常用于生日/纪念日） |
| `Year` | ✗ | ✗ | 年（2026） |

---

## 二、`DayOfWeek` 与 `Month` 枚举

- **`DayOfWeek`** 枚举：`MONDAY` ~ `SUNDAY`，索引从 1（MONDAY）到 7（SUNDAY）。
- **`Month`** 枚举：`JANUARY` ~ `DECEMBER`，索引从 1 到 12。

```java
DayOfWeek dow = DayOfWeek.MONDAY;      // 枚举常量
Month month = Month.AUGUST;            // 枚举常量
int dowVal = dow.getValue();           // 1
int monthVal = month.getValue();       // 8
```

---

## 三、仅日期类：LocalDate / YearMonth / MonthDay / Year

**`LocalDate`** 表示不带时间、不带时区的日期，是不可变（immutable）对象。

```java
LocalDate today = LocalDate.now();                       // 2026-08-31
LocalDate specific = LocalDate.of(2026, 8, 31);          // 指定日期
LocalDate parsed = LocalDate.parse("2026-08-31");        // 从字符串解析（ISO-8601）

int year  = today.getYear();        // 2026
Month mo   = today.getMonth();       // AUGUST
int dom   = today.getDayOfMonth();   // 31
DayOfWeek dw = today.getDayOfWeek(); // MONDAY

// 日期运算（返回新对象，原对象不变）
LocalDate nextWeek = today.plusDays(7);
LocalDate lastMonth = today.minusMonths(1);
```

> **不可变 + 链式**：所有 `java.time` 类都是不可变且线程安全的，运算返回新实例，这是面试常问的设计点。

---

## 四、日期+时间类：LocalTime / LocalDateTime

**`LocalTime`** 不带日期、不带时区的时间；**`LocalDateTime`** 不带时区的日期+时间。

```java
LocalTime time = LocalTime.of(14, 30, 0);      // 14:30:00
LocalTime now = LocalTime.now();

LocalDateTime dt = LocalDateTime.of(2026, 8, 31, 14, 30);
LocalDateTime nowDT = LocalDateTime.now();
LocalDateTime parsedDT = LocalDateTime.parse("2026-08-31T14:30:00");  // ISO-8601

LocalDateTime later = dt.plusHours(2);         // +2 小时
```

> **注意**：`LocalDateTime` 不含时区信息，**不能直接用于跨时区换算**。若一个后端接口接收"某地用户提交的时间"，要正确存储必须用 `ZonedDateTime` 或保存 UTC 的 `Instant`。

---

## 五、时区与偏移：ZonedDateTime / OffsetDateTime / ZoneId

**`ZoneId`** 表示时区（如 `Asia/Shanghai`）；**`ZoneOffset`** 表示固定偏移（如 `+08:00`）；**`ZoneRules`** 表示某时区的规则。

```java
// ZoneId 获取
ZoneId zone = ZoneId.of("Asia/Shanghai");
ZoneId systemZone = ZoneId.systemDefault();      // 系统默认时区

// ZonedDateTime = LocalDateTime + 时区
ZonedDateTime zdt = ZonedDateTime.of(2026, 8, 31, 14, 30, 0, 0, zone);
ZonedDateTime nowZDT = ZonedDateTime.now(zone);

// OffsetDateTime = LocalDateTime + 固定偏移
OffsetDateTime odt = OffsetDateTime.of(2026, 8, 31, 14, 30, 0, 0, ZoneOffset.ofHours(8));

// 时区换算（跨时区）
ZonedDateTime beijing = ZonedDateTime.now(ZoneId.of("Asia/Shanghai"));
ZonedDateTime newYork = beijing.withZoneSameInstant(ZoneId.of("America/New_York"));
```

> **后端最佳实践**：存储一律用 **UTC（`Instant`）**，对外展示再转具体时区，避免夏令时等坑。

---

## 六、Instant：时间轴上的瞬时点

**`Instant`** 表示时间轴上的一个瞬时点，基于 epoch 秒（自 1970-01-01T00:00:00Z 起）+ 纳秒。适合记录"事件发生的绝对时刻"（日志时间戳、数据库时间字段）。

```java
Instant now = Instant.now();                 // 当前瞬时点
Instant epoch = Instant.EPOCH;               // 1970-01-01T00:00:00Z
long epochSec = now.getEpochSecond();        // 秒数
Instant fromSec = Instant.ofEpochSecond(1_700_000_000);

// Instant 与 ZonedDateTime 互转
ZonedDateTime zdt = now.atZone(ZoneId.of("Asia/Shanghai"));
Instant back = zdt.toInstant();
```

---

## 七、解析与格式化（Parsing and Formatting）

用 **`DateTimeFormatter`** 格式化/解析日期时间。推荐内置的 ISO 格式，或自定义模式。

```java
// 格式化
LocalDateTime dt = LocalDateTime.of(2026, 8, 31, 14, 30);
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
String str = dt.format(fmt);                 // "2026-08-31 14:30:00"

// 预定义格式
String iso = dt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

// 解析
LocalDateTime parsed = LocalDateTime.parse("2026-08-31 14:30:00", fmt);

// 带时区格式化
ZonedDateTime zdt = ZonedDateTime.now();
String zh = zdt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z"));
```

> 常用模式字母：`y` 年、`M` 月、`d` 日、`H` 24小时时、`m` 分、`s` 秒、`S` 毫秒/纳秒、`z` 时区名、`Z` 偏移。常见坑：`yyyy` vs `YYYY`（周基准年）、`MM` 必须两位。

---

## 八、Temporal 包：调整器与查询（Adjusters & Query）

**`TemporalAdjusters`** 提供预设调整器，用于"下个周一""本月最后一天"这类业务化日期调整。

```java
LocalDate date = LocalDate.of(2026, 8, 31);
LocalDate nextMonday = date.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
LocalDate lastOfMonth = date.with(TemporalAdjusters.lastDayOfMonth());
LocalDate firstOfNextMonth = date.with(TemporalAdjusters.firstDayOfNextMonth());

// 自定义调整器
LocalDate adjusted = date.with(temporal -> temporal.plus(3, ChronoUnit.DAYS));
```

**`TemporalQuery`** 用于从时间对象查询派生值。

---

## 九、Period 与 Duration：时间量计算

- **`Period`**：以**年/月/日**为单位（人类时间量），用于日期差。
- **`Duration`**：以**秒/纳秒**为单位（机器时间量），用于时间差。
- **`ChronoUnit.between()`**：按指定单位计算两个时间点之差。

```java
// Period：日期差
LocalDate start = LocalDate.of(2026, 1, 1);
LocalDate end = LocalDate.of(2026, 8, 31);
Period p = Period.between(start, end);        // P7M30D（7个月30天）

// Duration：时间差
Instant t1 = Instant.now();
Instant t2 = t1.plusSeconds(3600);
Duration d = Duration.between(t1, t2);         // PT1H
long secs = d.getSeconds();                    // 3600

// ChronoUnit：按单位算差
long days = ChronoUnit.DAYS.between(start, end);      // 242 天
long hours = ChronoUnit.HOURS.between(t1, t2);        // 1 小时
```

---

## 十、Clock：可替代的时钟

**`Clock`** 提供对当前时间的访问，默认用系统时钟。**测试时**可用它注入一个固定时钟（"伪时钟"），让依赖时间的代码可测试。

```java
Clock clock = Clock.systemDefaultZone();          // 系统时钟
Clock fixed = Clock.fixed(Instant.parse("2026-08-31T00:00:00Z"), ZoneId.of("UTC"));

LocalDate today = LocalDate.now(fixed);           // 用固定时钟获取"日期"
```

> 面试加分点：依赖 `Clock` 而非直接 `LocalDate.now()`，可让时间相关逻辑单元测试。

---

## 十一、非 ISO 日历转换（Non-ISO Date Conversion）

ISO 日历系统外，Java 还支持其他历法，如 `JapaneseDate`（日本历）、`ThaiBuddhistDate`（佛历）、`HijrahDate`（回历）等，属于 `java.time.chrono` 包。

```java
JapaneseDate jp = JapaneseDate.from(LocalDate.of(2026, 8, 31));
ThaiBuddhistDate thai = ThaiBuddhistDate.from(LocalDate.of(2026, 8, 31));
```

---

## 十二、新旧 API 迁移（Legacy Date-Time Code）

老代码用 `java.util.Date` / `java.util.Calendar`。`java.time` 提供了互转方法：

```java
// Date -> Instant
Instant instant = new java.util.Date().toInstant();

// Instant -> Date
java.util.Date date = java.util.Date.from(instant);

// Calendar -> ZonedDateTime
ZonedDateTime zdt = Calendar.getInstance().toInstant().atZone(ZoneId.systemDefault());
```

> **面试高频**：为何弃用 `java.util.Date`？——可变（mutable）、非线程安全、月份从 0 开始、时区处理混乱、缺乏人类/机器时间区分。`java.time` 解决了这些问题（不可变、线程安全、清晰分层）。

---

## 核心速查表

| 主题 | 关键类/方法 | 要点 |
|------|------------|------|
| 今日日期 | `LocalDate.now()` | 无时间无时区 |
| 当前时刻 | `LocalDateTime.now()` | 最常见，无时区 |
| 跨时区 | `ZonedDateTime.now(ZoneId.of(...))` | 带时区 |
| 机器时间 | `Instant.now()` | epoch 秒，存储用 |
| 格式化 | `DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")` | 注意 `yyyy` vs `YYYY` |
| 日期差 | `Period.between()` | 年月日 |
| 时间差 | `Duration.between()` / `ChronoUnit.between()` | 时分秒 |
| 业务调整 | `TemporalAdjusters.next(周一)` | 下周一/月末 |
| 测试时钟 | `Clock.fixed(...)` | 注入固定时间 |
| 旧码迁移 | `Date.toInstant()` / `Date.from()` | 互转 |
| 设计要点 | 全部不可变、线程安全 | `plus` 返回新对象 |

> **后端实操建议**：数据库存 `DATETIME` 用 `LocalDateTime` 或 UTC 的 `Instant`；对外 JSON 返回统一格式；跨时区业务必须用 `ZonedDateTime` 并明确存储基准；日志时间戳用 `Instant` + `DateTimeFormatter`。

*最后更新：2021 年 9 月 14 日（官方）*

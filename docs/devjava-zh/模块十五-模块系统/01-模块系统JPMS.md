# 模块系统（Modules / JPMS）

> 来源：Oracle 官方 [Dev.java 教程](https://dev.java/learn/) →《Modules》
> 忠实还原 Java 9 引入的模块系统（JPMS，Project Jigsaw）。后端面试常考：模块化结构、`module-info.java`、`requires`/`exports`、服务加载。

## 一、为什么需要模块系统？

Java 9 前，代码用 **classpath** 堆在一起，缺少边界：

- **类路径（classpath）**上的所有 JAR 被 JVM 视为一个整体，无法表达"谁依赖谁"。
- 一个类能否访问另一个类，只看 public，**没有封装边界**——`internal` 包也能被外部直接用。
- 依赖关系不可见，容易产生类冲突（多个 JAR 含同名类）、脆弱代码。

**模块系统（JPMS）** 给代码加上了**明确的边界和依赖声明**：每个模块是一个自包含的代码单元，**声明它需要哪些模块、导出哪些包**。

> **一句话**：模块 = 一个「装好边界、声明依赖」的 JAR。类似 Maven/Gradle 的依赖管理，但更强——**编译期和运行期都强制**。

---

## 二、模块基础：module-info.java

每个模块的根目录有一个 **`module-info.java`** 文件，声明模块的元数据：

```java
// module-info.java
module com.example.app {
    requires com.example.core;      // 依赖其他模块
    requires java.sql;              // 依赖 JDK 模块
    requires transitive com.example.util;  // 传递依赖（间接导出给使用者）

    exports com.example.app.api;    // 导出包，对外可用
    exports com.example.app.model;

    uses com.example.spi.Service;   // 使用服务（服务定位器）
    provides com.example.spi.Service with com.example.impl.ServiceImpl; // 提供服务实现
}
```

| 关键字 | 作用 |
|--------|------|
| `module <名称>` | 声明模块名 |
| `requires <模块>` | 声明依赖的模块 |
| `requires transitive <模块>` | 传递依赖——依赖本模块的人自动获得该模块 |
| `exports <包>` | 将包导出，只有导出的包对外可见 |
| `exports <包> to <模块>` | 只导出给指定模块（限定导出） |
| `opens <包>` | 开放包给运行时反射（框架需要） |
| `uses <接口>` | 声明本模块使用某服务接口 |
| `provides <接口> with <实现>` | 提供服务实现（SPI） |

> **关键点**：未 `exports` 的包对外完全不可见——这是模块化最大的封装收益，阻止了 `internal` 包被乱用。**框架用到反射访问非导出包时，需要 `opens`**（这是 Spring 用反射扫描时可能要 `--add-opens` 的原因）。

---

## 三、模块依赖声明（requires）

**`requires` 声明的模块**必须存在于模块路径（module path）上，否则编译/运行报错。

```java
module com.example.web {
    requires java.net.http;      // 依赖 JDK HTTP 客户端
    requires com.example.core;   // 依赖自研模块
}
```

**传递依赖 `requires transitive`**：A 依赖 B，B 依赖 C；若 B 用 `requires transitive C`，则 A 自动能看到 C，无需显式声明：

```java
// B 模块
module com.example.b {
    requires transitive com.example.c;
    exports com.example.b.api;
}
// A 模块用 B 时，自动获得 C 的导出包
```

---

## 四、导出包（exports）

**只有 `exports` 的包对模块外可见**。不导出的包是模块私有实现：

```java
module com.example.app {
    exports com.example.app.api;         // 对外可用
    // exports com.example.app.internal;  不导出 → 外部无法访问
}
```

- 外部模块 `requires com.example.app` 后，只能访问 `com.example.app.api` 包里的 **public 类型**。
- **未导出包里的 public 类，外部照样不能访问**——模块封装比包/类封装更严格。

---

## 五、模块化后的 Java 程序结构

一个模块化应用通常是**多个模块 + 一个启动模块**：

```
myproject/
├── module-info.java              # 根模块声明
├── com/example/app/              # 代码包
│   └── Main.java
├── libs/
│   ├── core.jar                  # 依赖模块（也含 module-info.java）
│   └── util.jar
```

**编译**：
```bash
# 编译模块（含 module-info.java）
javac -d out --module-source-path src -m com.example.app
```

**运行**：
```bash
java --module-path out:libs -m com.example.app/com.example.app.Main
```

> **关键命令**：`--module-path` 指定模块路径、`-m` 指定启动模块和主类。JDK 9 起模块化应用用 `java -m` 而非 `java -cp`。

---

## 六、JDK 自身模块化（java.base 等）

JDK 9 起，JDK 本身也模块化，常见模块：

| JDK 模块 | 内容 |
|----------|------|
| `java.base` | 核心（`java.lang`、`java.util` 等），**所有模块隐式依赖** |
| `java.sql` | JDBC |
| `java.xml` | XML 处理 |
| `java.desktop` | AWT/Swing |
| `java.net.http` | HTTP 客户端（Java 11+） |
| `java.management` | JMX 管理 |

> **注意**：`java.base` 是特殊模块，**自动被所有模块依赖**，无需 `requires`。后端常用 `java.sql`、`java.net.http`、`java.naming`（JNDI）等，需显式 `requires`。

---

## 七、服务加载（uses / provides）

模块系统实现**服务定位器模式**（类似 SPI），让实现类与接口解耦：

```java
// 接口模块
module com.example.spi {
    exports com.example.spi;
    uses com.example.spi.Service;      // 声明使用服务
}

// 实现模块
module com.example.impl {
    requires com.example.spi;
    provides com.example.spi.Service with com.example.impl.ServiceImpl;  // 提供服务
}
```

运行期用 `ServiceLoader` 加载：

```java
ServiceLoader<Service> loader = ServiceLoader.load(Service.class);
for (Service s : loader) {
    s.doSomething();
}
```

> **面试高频**：`ServiceLoader` 与 SPI、`uses`/`provides` 关系。这是 JDBC 驱动、日志框架自动发现实现的机制（`META-INF/services` 声明）。

---

## 八、模块化的好处与坑（实践要点）

**好处**：
- **强封装**：未导出包外部不可见，减少 `internal` 滥用。
- **清晰的依赖**：编译期/运行期强制，避免 classpath 混乱。
- **更快的启动**：JVM 只加载用到的模块（对大型应用）。

**常见坑**：
- **反射访问未导出/未 opens 包** → 运行期 `InaccessibleObjectException`，需 `--add-opens` 或 `opens`。
- **老代码迁移**：非模块化 JAR 自动变成 **自动模块（automatic module）**，模块名默认取 JAR 名，需手动指定。
- **Maven/Gradle 协同**：现代构建工具处理模块路径，但第三方库若未模块化，会以自动模块形式参与。

> **面试高频**：模块化 vs 非模块化（classpath）区别、`requires transitive`、`exports` vs `opens`（反射）、JPMS 为何 Java 9 引入、自动模块概念。

---

## 核心速查表

| 主题 | 关键内容 | 要点 |
|------|---------|------|
| 模块声明 | `module-info.java` | 模块根目录，声明依赖和导出 |
| 依赖 | `requires [transitive]` | 编译/运行期强制 |
| 导出 | `exports <包>` | 未导出包对外不可见 |
| 反射开放 | `opens <包>` | 框架访问私有包需要 |
| 服务 | `uses` / `provides` + `ServiceLoader` | SPI 机制 |
| JDK 模块 | `java.base` 隐式、`java.sql` 等显式 | 后端依赖需 requires |
| 构建 | `javac -m` / `java --module-path -m` | 模块化构建运行命令 |
| 迁移 | 自动模块 | 非模块化 JAR 自动参与 |

> **后端实操**：理解模块化后，排查 `InaccessibleObjectException`（反射开包）、理解 Spring Boot 与 JPMS 的关系（Spring 默认仍用 classpath，模块化需谨慎）、熟悉 JDK 模块清单。

*最后更新：2021 年 9 月 14 日（官方）*

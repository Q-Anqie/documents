---
title: "NeoForge 入门"
original_title: "Getting Started with NeoForge"
source: "https://docs.neoforged.net/docs/1.21.1/gettingstarted/"
version: "1.21.1"
---

# NeoForge 入门

本节包含如何搭建 NeoForge 工作区，以及如何运行和测试你的模组的相关信息。

## 前置要求

- 熟悉 Java 编程语言，特别是其面向对象、多态、泛型与函数式特性。
- 安装 Java 21 开发工具包（JDK）与 64 位 Java 虚拟机（JVM）。NeoForge 推荐并官方支持 [Microsoft 构建的 OpenJDK][jdk]，但其它 JDK 通常也可正常工作。

> **警告**
>
> 请确认你使用的是 64 位 JVM。一种检查方式是在终端中运行 `java -version`。Minecraft 不支持 32 位 JVM。

- 熟悉你所选择的集成开发环境（IDE）。
      - NeoForge 官方支持 [IntelliJ IDEA][intellij] 与 [Eclipse][eclipse]，两者均内置 Gradle 支持。不过任何 IDE 都可以使用，从 Netbeans 或 Visual Studio Code 到 Vim 或 Emacs 均可。
- 熟悉 [Git][git] 与 [GitHub][github]。严格来说这并非必需，但它会让你的开发工作轻松许多。

## 搭建工作区

- 打开模组开发工具包（MDK，可选 [ModDevGradle][mdgmdk] 或 [NeoGradle][ngmdk]）的 GitHub 仓库，点击 "Use this template" 并将新建的仓库克隆到本地。
    - 如果你不想使用 GitHub，或者想获取较旧提交的模板，也可以下载仓库的 ZIP（在 Code -> Download ZIP 下）并解压。
- 打开你的 IDE 并导入该 Gradle 项目。IntelliJ IDEA 与 Eclipse 会自动完成此操作。如果你的 IDE 不会自动完成，也可以通过 `gradlew` 终端命令来完成。
    - 首次执行时，Gradle 会下载 NeoForge 的全部依赖（包括 Minecraft 本身）并对其进行反编译。这可能耗费相当长的时间（视硬件与网络状况，最长可达一小时）。
    - 每当你修改 Gradle 文件后，都需要重新加载 Gradle 变更，可以通过 IDE 中的 "Reload Gradle" 按钮，或再次通过 `gradlew` 终端命令完成。

### Minecraft 源代码

Gradle 成功加载后，你不仅会得到一个示例模组项目，工作区中还会包含 Minecraft 与 NeoForge 的（已修补的）源代码及[资源文件][resources]供你参考。这些源代码可以在 IntelliJ IDEA 的 `External Libraries` 或 Eclipse 的 `Referenced Libraries` 下找到，其名称取决于所使用的 Gradle 插件（其中 `<version>` 为所使用的 NeoForge 版本）：

| Gradle 插件 | Minecraft 源码 | NeoForge 源码 |
|---------------|------------------------------------------------|----------------------------------------------|
| NeoGradle     | `ng_dummy_ng.net.neoforged:neoforge:<version>` | `net.neoforged:neoforge:universal:<version>` |
| ModDevGradle  | `minecraft-patched-<version>-merged.jar`       | `net.neoforged:neoforge:universal:<version>` |

此外，你可以使用 IDE 的搜索功能——在 IntelliJ IDEA 中默认为双击 Shift，在 Eclipse 中默认为 Ctrl+H——来搜索特定的 Minecraft 类或文件。

> **警告**
>
> 其它 IDE 可能不具备这一集成。如果你想查看源代码——这对实现许多功能至关重要——我们仅支持 IntelliJ IDEA 或 Eclipse。

## 自定义你的模组信息

你的模组的许多基本属性都可以在 `gradle.properties` 文件中修改。这包括模组名称或模组版本等基本内容。更多信息请参见 `gradle.properties` 文件中的注释，或参阅 [`gradle.properties` 文件的文档][properties]。

如果你想在此基础上进一步修改构建过程，可以编辑 `build.gradle` 文件。NeoForge 的 Gradle 插件 NeoGradle 提供了若干配置选项，`build.gradle` 文件中的注释解释了其中一部分。完整文档请参见 [NeoGradle 文档][neogradle]。

> **警告**
>
> 只有在你清楚自己在做什么的情况下，才去编辑 `build.gradle` 与 `settings.gradle` 文件。所有基本属性都可以通过 `gradle.properties` 设置。

## 构建与测试你的模组

要构建你的模组，运行 `gradlew build`。这会在 `build/libs` 下输出一个名为 `<archivesBaseName>-<version>.jar` 的文件。`<archivesBaseName>` 与 `<version>` 是由 `build.gradle` 设置的属性，默认分别取 `gradle.properties` 文件中的 `mod_id` 与 `mod_version` 值；如有需要，可在 `build.gradle` 中修改。生成的 JAR 文件随后可以放入已启用 NeoForge 的 Minecraft 环境的 `mods` 文件夹，或上传至模组分发平台。

要在测试环境中运行你的模组，你可以使用生成的运行配置，或使用相关任务（例如 `gradlew runClient`）。这会从对应的 runs 目录（例如 `runs/client` 或 `runs/server`）启动 Minecraft，并附带指定的所有源代码集。默认 MDK 包含 `main` 源代码集，因此任何写在 `src/main/java` 中的代码都会被应用。

### 服务端测试

如果你运行的是专用服务器——无论是通过运行配置还是 `gradlew runServer`——服务器会立即关闭。你需要通过编辑运行目录中的 `eula.txt` 文件来接受 Minecraft EULA。

接受之后，服务器会加载并在 `localhost`（默认即 `127.0.0.1`）下可用。不过你仍然无法加入，因为服务器默认会进入在线模式（online mode），这要求进行身份验证（而 Dev 玩家没有）。要解决此问题，请再次停止服务器，并将 `server.properties` 文件中的 `online-mode` 属性设置为 `false`。现在启动服务器，你应该就能连接了。

> **提示**
>
> 你应当始终在专用服务器环境中测试你的模组。这包括[仅客户端模组][client]，因为它们在服务端加载时不应做任何事情。

[client]: https://docs.neoforged.net/docs/1.21.1/concepts/sides
[eclipse]: https://www.eclipse.org/downloads/
[git]: https://www.git-scm.com/
[github]: https://github.com/
[intellij]: https://www.jetbrains.com/idea/
[jdk]: https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-21
[mdgmdk]: https://github.com/NeoForgeMDKs/MDK-1.21-ModDevGradle
[ngmdk]: https://github.com/NeoForgeMDKs/MDK-1.21-NeoGradle
[neogradle]: https://docs.neoforged.net/neogradle/docs/
[properties]: https://docs.neoforged.net/docs/1.21.1/gettingstarted/modfiles#gradleproperties
[resources]: https://docs.neoforged.net/docs/1.21.1/resources/

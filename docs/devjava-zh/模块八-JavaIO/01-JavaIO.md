# Java IO（输入输出）

> 来源：Oracle 官方 [Dev.java 教程](https://dev.java/learn/) →《Java IO》
> 忠实翻译，保留全部代码示例与官方配图。

**Java IO 是 Java 处理输入输出的核心机制**，涵盖文件系统操作、字节/字符流读写、文件读写、目录操作、I/O 异常处理等。本节聚焦面试高频的**文件系统与文件读写**。

---

## 一、I/O 流概述

**I/O 流（stream）是 Java 中读写数据的抽象。** 流分为两类：

- **字节流（byte stream）**：以字节（8 位）为单位读写，处理二进制数据（图片、音频等）。根类是 `InputStream` / `OutputStream`。
- **字符流（character stream）**：以字符为单位读写，处理文本。根类是 `Reader` / `Writer`。内部用字节流 + 字符编码（如 UTF-8）转换。

**I/O 流的体系**：

| 类别 | 字节流 | 字符流 |
|------|--------|--------|
| 输入 | `InputStream` | `Reader` |
| 输出 | `OutputStream` | `Writer` |
| 文件 | `FileInputStream` / `FileOutputStream` | `FileReader` / `FileWriter` |
| 缓冲 | `BufferedInputStream` / `BufferedOutputStream` | `BufferedReader` / `BufferedWriter` |
| 数据 | `DataInputStream` / `DataOutputStream` | — |

---

## 二、`Path` 与文件系统（java.nio.file）

Java 7 引入 **NIO.2**（`java.nio.file` 包），提供更现代的文件系统 API。核心是 **`Path`** 接口。

### 创建 Path

```java
import java.nio.file.*;

Path p = Paths.get("D:/data/file.txt");
Path p2 = Path.of("D:/data/file.txt");    // Java 11+

// 拼接路径
Path p3 = Path.of("D:", "data", "file.txt");
```

### Path 常用方法

| 方法 | 说明 |
|------|------|
| `getFileName()` | 返回文件名 |
| `getParent()` | 返回父目录 |
| `getRoot()` | 返回根目录 |
| `isAbsolute()` | 是否绝对路径 |
| `toAbsolutePath()` | 转绝对路径 |
| `toString()` | 路径字符串 |

---

## 三、文件操作（Files 类）

`Files` 类（`java.nio.file.Files`）提供操作文件和目录的静态方法。

### 检查与元数据

```java
Files.exists(path);               // 是否存在
Files.isDirectory(path);          // 是否目录
Files.isRegularFile(path);        // 是否普通文件
Files.size(path);                 // 文件大小（字节）
Files.getLastModifiedTime(path);  // 最后修改时间
```

### 创建和删除

```java
Files.createFile(path);           // 创建文件
Files.createDirectory(path);      // 创建目录
Files.createDirectories(path);    // 递归创建目录
Files.delete(path);               // 删除（不存在抛异常）
Files.deleteIfExists(path);       // 存在才删除，安全
```

### 读写字节 / 字符串（简便方法）

```java
// 写字符串到文件（覆盖）
Files.writeString(path, "Hello, world");    // Java 11+

// 读文件为字符串
String content = Files.readString(path);    // Java 11+

// 读写字节
byte[] data = Files.readAllBytes(path);
Files.write(path, data);
```

### 读写行

```java
// 读所有行
List<String> lines = Files.readAllLines(path);

// 写所有行
Files.write(path, List.of("line1", "line2"));

// 用 Stream 读行（惰性，适合大文件）
try (Stream<String> stream = Files.lines(path)) {
    stream.forEach(System.out::println);
}
```

---

## 四、字节流读写（InputStream / OutputStream）

处理二进制数据，如音频、图片、非文本文件。

### 读文件（字节流）

```java
import java.io.*;

try (InputStream in = new FileInputStream("data.bin")) {
    int data;
    while ((data = in.read()) != -1) {
        System.out.print((char) data);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

### 写文件（字节流）

```java
try (OutputStream out = new FileOutputStream("out.bin")) {
    byte[] bytes = {65, 66, 67};
    out.write(bytes);
} catch (IOException e) {
    e.printStackTrace();
}
```

---

## 五、字符流读写（Reader / Writer）

[官方图示：sonnets 文本文件格式](../assets/images/java-io/03_sonnets-file-format.png)

处理文本文件，自动处理字符编码。

### 用 BufferedReader 读文本（推荐，带缓冲）

```java
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

### 用 BufferedWriter 写文本（推荐，带缓冲）

```java
try (BufferedWriter bw = new BufferedWriter(new FileWriter("out.txt"))) {
    bw.write("第一行");
    bw.newLine();                // 换行
    bw.write("第二行");
} catch (IOException e) {
    e.printStackTrace();
}
```

### 为何用 BufferedReader/Writer（缓冲流）？

**缓冲流在内存中维护缓冲区**，减少底层 I/O 调用次数，显著提升读写性能。且 `BufferedReader.readLine()`、`BufferedWriter.newLine()` 提供便捷的按行读写。

### 指定字符编码

```java
// 指定 UTF-8 编码，避免中文乱码
try (BufferedReader br = new BufferedReader(
        new InputStreamReader(new FileInputStream("file.txt"), StandardCharsets.UTF_8))) {
    // ...
}
```

---

## 六、目录操作（遍历文件）

用 `Files.walk` 递归遍历目录树：

```java
try (Stream<Path> stream = Files.walk(Paths.get("D:/data"))) {
    stream.filter(Files::isRegularFile)
          .forEach(System.out::println);   // 打印所有普通文件
}
```

用 `Files.list` 列目录：

```java
try (Stream<Path> stream = Files.list(Paths.get("D:/data"))) {
    stream.forEach(System.out::println);
}
```

---

## 七、格式化输出（PrintWriter）

`PrintWriter` 是带格式化功能的字符流输出，常用于日志、报告。

```java
try (PrintWriter pw = new PrintWriter(new FileWriter("report.txt"))) {
    pw.println("=== 报告 ===");
    pw.printf("销售额: %.2f 元%n", 1234.567);
    pw.println("日期: " + LocalDate.now());
} catch (IOException e) {
    e.printStackTrace();
}
```

---

## 八、一个完整示例：读文件并统计单词

```java
import java.io.*;
import java.nio.file.*;
import java.util.*;

public class WordCount {
    public static void main(String[] args) throws IOException {
        Path path = Path.of("article.txt");
        if (!Files.exists(path)) {
            Files.createFile(path);
            Files.writeString(path, "Hello Java, Java is great. Hello world.");
        }
        Map<String, Integer> counts = new HashMap<>();
        try (Stream<String> lines = Files.lines(path)) {
            lines.flatMap(line -> Arrays.stream(line.split("[\\s,.;]+")))
                 .filter(w -> !w.isEmpty())
                 .forEach(w -> counts.merge(w, 1, Integer::sum));
        }
        counts.forEach((w, c) -> System.out.println(w + ": " + c));
    }
}
```

---

## 九、try-with-resources 与 I/O 资源管理

**I/O 资源必须关闭**（文件句柄、网络连接等），否则造成资源泄漏。**推荐用 try-with-resources** 自动关闭：

```java
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    // 自动关闭，无需 finally
}
```

所有实现 `AutoCloseable` 的资源（I/O 流都属于）都能用此语法，确保异常时也正确关闭。

---

## 核心速查表

| 场景 | 推荐类 |
|------|--------|
| 文件路径 | `Path` / `Paths.get` |
| 文件操作 | `Files`（exists/delete/createFile/readString/writeString） |
| 文本读取 | `BufferedReader` + `FileReader` |
| 文本写入 | `BufferedWriter` + `FileWriter` |
| 二进制读写 | `FileInputStream` / `FileOutputStream` |
| 按行读 | `Files.lines`（Stream） |
| 遍历目录 | `Files.walk` / `Files.list` |
| 格式化输出 | `PrintWriter`（printf） |
| 编码控制 | `StandardCharsets.UTF_8` |
| 资源关闭 | try-with-resources（AutoCloseable） |

> **面试高频**：字节流 vs 字符流、`InputStream`/`Reader` 体系、`BufferedReader` 作用（缓冲+按行）、try-with-resources 原理（AutoCloseable）、NIO 的 `Files`/`Path`、`readString`/`writeString` 简便方法、中文乱码用 UTF-8。

*最后更新：2021 年 9 月 14 日（官方）*

---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "安且的文档库"
  text: "神秘的文档打野点"
  tagline: NeoForge 模组开发教程 · 中文文档 · Java 学习笔记
  actions:
    - theme: brand
      text: 开始学做模组
      link: /docs/dafeiyu-tutorial/
    - theme: alt
      text: NeoForge 中文文档
      link: /docs/neoforge-1.21.1/

features:
  - title: 大肥鱼 MC 教程
    details: 46 篇，从装 JDK 到打包发布。含 Java 写法补课、术语表、29 个高频报错排查。示例工程可一路复制成完整模组。
    link: /docs/dafeiyu-tutorial/
    linkText: 开始阅读
  - title: NeoForge 1.21.1 中文文档
    details: 官方文档全站 63 篇逐段翻译，保留原文链接与 Minecraft Wiki 对照，可当手册随时查。
    link: /docs/neoforge-1.21.1/
    linkText: 打开文档
  - title: Java 补充篇
    details: 专讲模组代码里出现、但普通 Java 教程没讲过的写法：Supplier、Builder、双冒号、注解、record。
    link: /docs/dafeiyu-tutorial/02-Java补充篇/01-注册代码里的泛型与Supplier
    linkText: 补这一课
  - title: 术语表
    details: 66 条术语按主题分组，每条给「定义 / 在哪会碰到 / 和谁容易混」，另附 8 对易混概念对照。
    link: /docs/dafeiyu-tutorial/08-附录/01-术语表
    linkText: 查术语
  - title: 常见报错手册
    details: 启动、资源、注册、运行时、构建五类共 29 个高频报错，每条给现象、原因、修法。
    link: /docs/dafeiyu-tutorial/08-附录/02-常见报错与排错手册
    linkText: 去排错
  - title: Java 基础笔记
    details: 原有 Java 学习笔记，17 个模块，从变量到反射、虚拟线程，可与模组教程对照着看。
    link: /docs/devjava-zh/01-变量与数据类型
    linkText: 看笔记
---

## 这个库怎么用

- **想学做模组**：从 [大肥鱼 MC 教程](/docs/dafeiyu-tutorial/) 开始，按 01 → 08 顺序读，每章都有可运行代码。
- **想查某个 API**：去 [NeoForge 1.21.1 中文文档](/docs/neoforge-1.21.1/)，63 篇对应官方全部页面。
- **代码看不懂**：先翻 [Java 补充篇](/docs/dafeiyu-tutorial/02-Java补充篇/01-注册代码里的泛型与Supplier)，那里只讲模组代码里的怪写法。
- **报错了**：查 [常见报错与排错手册](/docs/dafeiyu-tutorial/08-附录/02-常见报错与排错手册)。
- **忘了术语**：查 [术语表](/docs/dafeiyu-tutorial/08-附录/01-术语表)。

## 版本

| 项目 | 版本 |
|---|---|
| Minecraft | 1.21.1 |
| NeoForge | 21.1.x |
| Java | 21 |
| Gradle 插件 | ModDevGradle |

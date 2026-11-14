---
description: SQL 基础测验，检验增删改查和多表查询掌握程度。
---
# SQL 基础测验

!!! abstract "测验说明"
    本测验用于检验 SQL 基础教程的学习效果。共 10 道选择题。

    📗 入门难度
    ⏱ 约 20 分钟
    📝 10 道题

!!! tip "测验反馈"
    提交答案后，系统会显示：

    - 得分和正确率
    - 错题分析和薄弱知识点
    - 复习建议和推荐教程
    - 下一步学习建议

---

## 选择题

SQL 中用于查询数据的关键字是？

 GET
 FIND
 SELECT
 QUERY

💡 SQL 使用 `SELECT` 语句查询数据，例如 `SELECT * FROM users`

以下哪个 SQL 语句用于删除数据？

 REMOVE
 DELETE
 DROP
 ERASE

💡 `DELETE` 用于删除表中的数据行；`DROP` 用于删除整个表或数据库

`WHERE` 子句的作用是？

 筛选符合条件的数据
 排序数据
 分组数据
 限制返回行数

💡 `WHERE` 用于指定筛选条件，只返回满足条件的数据行

以下哪个函数用于统计数据行数？

 SUM()
 AVG()
 MAX()
 COUNT()

💡 `COUNT()` 统计行数；`SUM()` 求和；`AVG()` 求平均值；`MAX()` 求最大值

`JOIN` 用于？

 插入数据
 删除数据
 关联多张表查询
 更新数据

💡 `JOIN` 用于根据关联字段将多张表的数据关联查询

`ORDER BY` 默认的排序方式是？

 降序（DESC）
 升序（ASC）
 随机排序
 不排序

💡 `ORDER BY` 默认升序（ASC），降序需要显式指定 `DESC`

`GROUP BY` 的作用是？

 按指定字段分组统计
 按指定字段排序
 筛选数据
 限制行数

💡 `GROUP BY` 用于将数据按指定字段分组，通常配合聚合函数使用

`LIMIT 10 OFFSET 20` 的含义是？

 返回前 10 条数据
 返回第 10 到 20 条数据
 跳过前 20 条，返回 10 条
 返回 20 条数据

💡 `LIMIT` 限制返回行数，`OFFSET` 跳过指定行数。常用于分页查询

测试人员校验接口数据时，最常用的 SQL 模式是？

 INSERT INTO
 SELECT ... WHERE
 UPDATE SET
 CREATE TABLE

💡 测试人员最常用 `SELECT ... WHERE` 查询并校验数据

`IS NULL` 用于判断？

 字段值为 0
 字段值为空字符串
 字段值为 FALSE
 字段没有值（空值）

💡 `NULL` 表示没有值，不同于 0、空字符串或 FALSE。判断 NULL 要用 `IS NULL`，不能用 `= NULL`

提交答案

---

## 继续学习

完成测验后，建议继续学习：

- [数据库 SQL 教程](数据库SQL教程-软件测试版.md) - 查看完整教程
- [章节练习与参考答案](../章节练习与参考答案.md) - 更多 SQL 练习
- [Redis 与 MongoDB 教程](Redis与MongoDB教程-软件测试版.md) - 扩展 NoSQL 知识

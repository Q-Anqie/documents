---
description: TypeScript 基础测验，检验类型系统、接口定义、泛型与类型断言掌握程度。
---
# TypeScript 基础测验

!!! abstract "测验说明"
    本测验用于检验 TypeScript 基础教程的学习效果。共 12 道选择题，覆盖基础类型、interface 与 type、函数类型、泛型、类型断言与接口响应建模。

    📗 入门难度
    ⏱ 约 20 分钟
    📝 12 道选择题

!!! tip "测验反馈"
    提交答案后，系统会显示：

    - 得分和正确率
    - 错题分析和薄弱知识点
    - 复习建议和推荐教程
    - 下一步学习建议

---

## 选择题

TypeScript 和 JavaScript 的关系是？

 两者完全无关，是竞争关系
 TypeScript 是 JavaScript 的超集，增加了静态类型，编译后仍是 JavaScript
 TypeScript 是 JavaScript 的旧版本
 TypeScript 只能在浏览器里运行

💡 浏览器和 Node.js 只认识 JS，不认识 TS。所以 `.ts` 文件必须先编译成 `.js` 才能运行，类型检查只发生在编译阶段

相比 JavaScript，TypeScript 最核心的价值是？

 运行速度更快
 代码体积更小
 不需要写测试也能保证质量
 在编译期就发现类型错误，比如拼错属性名、传错参数类型

💡 例如写成 `result.data.tokn` 会立刻报错，而不是等运行时拿到 undefined 才发现。**把错误提前到写代码阶段**是 TS 的最大收益

`any` 和 `unknown` 的区别是？

 `unknown` 更安全，使用前必须先判断类型；`any` 完全绕过类型检查
 两者完全等价，只是名字不同
 `any` 更安全，`unknown` 会报错
 `unknown` 只能用于数字类型

💡 教程的建议是：优先写明确类型，不确定时用 `unknown`，尽量避免 `any`。`any` 会让类型系统形同虚设，等于退回到 JS

要用类型描述一个接口响应的结构，最常用的方式是？

 写一段注释说明字段含义
 用 enum 列举所有字段
 用 interface 定义响应对象的字段与类型
 用 any 接收后再手工判断

💡 用 `interface LoginResponse { code: number; data: { token: string } }` 这类声明建模后，断言脚本里访问字段就有补全和校验，字段改动能立刻被发现

关于 `interface` 和 `type`，下面说法正确的是？

 `interface` 不能描述对象结构
 描述对象结构多用 `interface`（支持继承与声明合并），`type` 更适合联合类型等场景
 `type` 已经废弃，应全部改用 `interface`
 两者完全等价，可以任意替换

💡 描述接口响应、实体对象这类结构用 `interface` 更自然，还能 `extends` 继承；需要 `"success" | "error"` 这种联合类型时用 `type` 更方便

告诉编译器"这个值的类型是 X"，类型断言的写法是？

 value as! X
 cast(value, X)
 (X) value
 value as X

💡 用 `value as X`。常见场景是从 `unknown` 取到的数据（如 JSON 解析结果）需要断言成已知类型后才能访问字段。注意断言只是"你保证"，编译器不会替你验证

泛型（Generic）的作用是？

 让类型作为参数传入，在复用逻辑的同时保留类型信息
 让变量可以自动变成任意类型
 定义一组命名的数字常量
 把多个类型合并成一个

💡 泛型让 `function first&lt;T&gt;(arr: T[]): T` 这样的函数对任意类型都可用，同时又保留"输入什么类型就返回什么类型"的信息，避免退化成 `any`

在 TypeScript 中声明一个可选参数，正确写法是？

 function f(name: string optional)
 function f(name: string?)
 function f(name?: string)
 function f(optional name: string)

💡 问号加在**参数名后面**：`name?: string`。注意可选参数必须放在必选参数之后，也可以直接用默认值 `name: string = "guest"` 达到类似效果

类中用 `private` 修饰的属性表示？

 该属性是只读的，赋值后不能修改
 只能在类内部访问，外部访问会报错
 该属性不会被编译到 JavaScript 中
 该属性对所有子类公开

💡 访问修饰符把封装意图写进类型层：`private` 仅类内可见，`protected` 类内和子类可见，不加修饰符默认 `public`。外部误用会在编译期报错

`enum` 在测试代码中的典型用途是？

 遍历数组元素
 声明异步函数
 导入第三方库
 定义一组有名字的常量，如接口返回码、用例状态，避免散落的魔法数字

💡 把 `0`、`1` 这类返回码写成 `enum Status { Success = 0, Fail = 1 }`，代码可读性和可维护性都会明显提升，也避免了硬编码数字写错

`tsconfig.json` 文件的作用是？

 配置 TypeScript 的编译选项，如目标版本、严格模式、文件范围
 存储测试用例数据
 定义项目的依赖包列表
 配置浏览器的启动参数

💡 `tsconfig.json` 决定 TS 怎么编译。依赖包列表是 `package.json` 的职责，别混淆。开启严格模式能让类型检查更早发现问题

给接口响应定义好类型之后，写测试断言时能得到什么好处？

 断言会自动帮我们生成期望值
 用例执行速度会明显变快
 字段名拼错、类型用错会在编译期被发现，编辑器还能提供自动补全
 不再需要写任何断言

💡 类型定义相当于给接口响应建了"契约"，字段被后端改名时编译就会报错。这让自动化脚本的维护成本显著下降——**而不是替代断言**

提交答案

---

## 继续学习

完成测验后，建议继续学习：

- [TypeScript 基础教程](TypeScript基础教程-软件测试版.md) - 查看完整教程
- [JavaScript 基础测验](JavaScript基础测验.md) - 回补 JS 语法基础
- [Playwright 基础测验](../自动化测试/Playwright基础测验.md) - 在真实框架中使用 TS

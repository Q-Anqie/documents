---
description: Postman 接口测试教程，断言脚本、数据驱动和 Newman 集成。
---
# Postman 接口测试教程（软件测试人员专用）

> 本教程面向软件测试工程师，系统讲解 Postman 在接口测试中的应用，覆盖从基础请求到自动化测试、数据驱动、CI/CD 集成的完整链路。

---

## 前置要求

| 项目 | 要求 | 获取方式 |
|------|------|----------|
| HTTP 协议基础 | 了解 GET/POST 请求方法、状态码、JSON 响应格式 | [网络知识教程-软件测试版](../工具操作/网络知识教程-软件测试版.md) |

---

## 新手导读

Postman 是接口测试入门最重要的工具之一。新手第一遍不要急着写复杂脚本，先能手工调通接口。

建议学习顺序：

1. 会发送 GET 和 POST 请求。
2. 会填写 Header、Params、Body。
3. 会查看状态码和响应 JSON。
4. 会用环境变量保存 Base URL 和 Token。
5. 会写最基础的断言，例如判断业务 code 是否为 0。

当你能把登录接口、查询接口、创建订单接口串起来，再学习 Collection、数据驱动和 Newman。

### 版本与维护说明

| 项目 | 说明 |
|------|------|
| 适用工具 | Postman 桌面版 / Web 版、Newman 命令行 |
| 使用建议 | 菜单名称可能随版本变化，核心学习目标是请求、环境变量、断言和集合运行 |
| 更新提醒 | 使用前建议核对 Postman 官方文档，尤其是团队协作、云同步和 Newman 参数 |
| 术语提醒 | 新版界面可能把 `Tests` 归在 `Scripts / Post-response` 下；本文仍用“Tests”指请求返回后执行的断言脚本 |

---

## 最佳实践速查：推荐写法 vs 新手写法

| 场景 | 新手常见写法 | 推荐写法 | 原因 |
|------|--------------|----------|------|
| 环境地址 | 每个请求都写完整 URL | 使用 `{{base_url}}` 环境变量 | 切换环境方便，减少重复修改 |
| 登录 token | 手工复制 token 到 Header | 登录接口 Tests 自动保存 token | 避免 token 过期后整套接口失败 |
| 断言 | 只看 Status 200 | 同时断言 HTTP 状态码、业务码、关键字段 | 很多业务失败也会返回 200 |
| 密码和 token | 写在请求或脚本里并截图分享 | 使用 secret 变量，日志脱敏 | 避免敏感信息泄露 |
| Collection | 所有接口放在一个平铺列表 | 按模块建文件夹，命名清楚 | 便于维护和团队协作 |
| 数据驱动 | 手工改参数重复发送 | Runner / Newman + CSV / JSON | 提高覆盖率和可重复性 |
| 调试输出 | `console.log` 打完整响应和 token | 只打印必要字段并脱敏 | 日志更清晰，也更安全 |

示例：推荐的登录后保存 token 写法：

```javascript
const body = pm.response.json();

pm.test("登录成功并返回 token", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
    pm.expect(body.code).to.eql(0);
    pm.expect(body.data.token).to.be.a("string").that.is.not.empty;
});

if (body.code === 0 && body.data.token) {
    pm.environment.set("token", body.data.token);
    console.log("token 已保存：" + body.data.token.slice(0, 8) + "...");
}
```

新手记住一句话：Postman 不是“点 Send 的工具”，而是“组织接口、管理环境、自动断言、沉淀回归资产”的工具。

## 一、Postman 简介

### 1.1 什么是 Postman

Postman 是一款功能强大的 **API 开发与测试平台**，最初是 Chrome 浏览器扩展，现已发展为支持 Windows/Mac/Linux 的桌面应用和 Web 版应用。

### 1.2 Postman 能做什么

| 功能 | 说明 |
|------|------|
| 接口调试 | 发送 HTTP/HTTPS 请求，查看响应 |
| 接口测试 | 编写断言脚本，自动化验证接口 |
| 接口文档 | 自动生成接口文档并分享 |
| Mock 服务 | 模拟接口返回，前后端并行开发 |
| 接口监控 | 定时执行接口，监控可用性 |
| 团队协作 | Workspace 共享接口集合 |
| CI/CD 集成 | 通过 Newman 集成到流水线 |
| 性能测试 | 内置基础的性能测试能力 |

### 1.3 Postman vs Fiddler

| 维度 | Postman | Fiddler |
|------|---------|---------|
| 定位 | 主动构造请求 | 被动抓取请求 |
| 适用场景 | 接口测试、自动化 | 抓包分析、Mock |
| 协议层级 | HTTP/HTTPS 应用层 | HTTP/HTTPS 应用层 |
| 脚本能力 | 强（JavaScript） | 中（FiddlerScript） |
| 团队协作 | 强（云同步） | 弱（本地） |

!!! tip "测试人员建议"
    两者搭配使用。Fiddler 用于抓取已有请求 → 导出/复制 → 在 Postman 中重构、参数化、写断言。

---

## 二、安装与账号配置

### 2.1 下载安装

1. 访问官网：`https://www.postman.com/downloads/`
2. 选择对应操作系统的版本下载
3. 双击安装包，全程默认即可

!!! info "版本说明"
    Postman 也提供 Web 版（`https://web.postman.co`），但功能受限，桌面版功能更全。

### 2.2 注册登录

- 首次启动建议注册账号，可享受：
  - 云端同步 Collection、Environment
  - 多设备数据互通
  - 团队协作功能
- 也可点击底部 `Skip and go to the app` 离线使用（数据仅保存在本地）

### 2.3 基础设置

点击右上角齿轮图标 → `Settings`：

**General 标签：**

- `Request timeout in ms`：请求超时时间（默认 0 即无限制，建议设为 30000）
- `SSL certificate verification`：SSL 证书校验（测试自签名证书时建议关闭）
- `Send anonymous usage data to Postman`：匿名数据上报（按需关闭）
- `Working directory`：工作目录（用于上传文件，建议设置固定路径）
- `Allow reading files outside working directory`：允许读取工作目录外文件

**Themes：** 可切换深色/浅色主题

**Proxy：** 配置代理，如需经过 Fiddler 抓包：

- 勾选 `Use custom proxy configuration`
- Proxy server: `127.0.0.1:8888`

---

## 三、界面布局详解

```
┌─────────────────────────────────────────────────────────────┐
│ 顶部菜单栏 / Workspace 切换                                    │
├──────────────┬──────────────────────────────────────────────┤
│              │ ┌──────────────────────────────────────────┐ │
│ 左侧侧边栏     │ │  Tab 区：请求标签页                       │ │
│ Collections  │ ├──────────────────────────────────────────┤ │
│ Environments │ │  请求 URL 栏 + Method + Send 按钮          │ │
│ History      │ ├──────────────────────────────────────────┤ │
│ APIs         │ │  请求参数区                                │ │
│ Mock Servers │ │  Params / Headers / Body / Auth /         │ │
│              │ │  Pre-request Script / Tests              │ │
│              │ ├──────────────────────────────────────────┤ │
│              │ │  响应展示区                                │ │
│              │ │  Body / Cookies / Headers / Test Results │ │
│              │ └──────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────┘
```

### 3.1 左侧侧边栏

侧边栏有 7 个入口，但**日常只用 3 个**。按使用频率排，不要平均用力：

| 模块 | 日常用途 | 新手要不要立刻学 |
|------|----------|------------------|
| `Collections` | 接口集合，所有接口按项目组织在此 | ✅ **主战场，第一天就要建** |
| `Environments` | 环境变量（开发/测试/生产） | ✅ **第二天就要用，否则换环境会疯** |
| `History` | 请求历史，点回去即可重发 | ✅ 随手用，调试时救急 |
| `Mock Servers` | 模拟服务器，后端没写完时用 | ⏸ 第 11 章再学 |
| `Monitors` | 定时执行接口，监控可用性 | ⏸ 了解即可，公司多用专业监控 |
| `APIs` | OpenAPI/Swagger 接口设计 | ⏸ 偏开发，测试只需能导入 |
| `Flows` | 可视化接口编排 | ⏸ 新功能，别在它上面耗时间 |

!!! warning "一个真实的新手坑：只在 History 里调接口"
    新手最常见的坏习惯是「每次从 History 点开、改一改、再 Send」，从不建 Collection。

    代价会在 **需求变更那天** 一次性爆发：开发说「登录接口域名换了」，
    你攒了 60 条历史记录，**没有任何一处集中可改**，只能一条条重发。

    **判断标准很简单**：同一个接口你打算发第 3 次，就该把它存进 Collection。

    - `History` 是**草稿纸**：随手试，关掉就没了
    - `Collection` 是**资产**：能参数化、能批量跑、能进 CI

### 3.2 中间核心区

| 控件 | 是什么 | 新手容易踩的点 |
|------|--------|----------------|
| 请求方法下拉框 | GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS | **方法选错返回 405，不是 404**，别急着报「接口不存在」 |
| URL 输入框 | 请求地址，支持 `{{base_url}}/api/login` | 变量名写错（如 `{{Base_Url}}`）不会报错，**原样发出去** |
| `Send` 按钮 | 发送请求 | 下拉还有 `Send and Download`，只在测文件下载时用 |
| `Save` 按钮 | 存进 Collection | 不 Save 的请求，关掉标签页就没了 |
| `Params` | URL 查询参数，与 URL 输入框**双向同步** | 在 URL 手写 `?a=1` 和在 Params 表格填，是同一份数据 |
| `Headers` | 请求头 | 有 9 个自动加的隐藏头（如 `User-Agent`），点 `hidden` 可见 |
| `Body` | 请求体，仅 POST/PUT/PATCH 等有意义 | **选错格式是最常见的 400**，见 [5.3](#53-body) |
| Response 区 | 响应结果 | 默认 `Pretty` + `JSON`；看原始报文切 `Raw` |

!!! tip "先学会看这个绿色圆点"
    URL 输入框右侧、环境选择器旁边有一个小圆点：

    - **绿色**：当前环境变量全部解析成功
    - **橙色 / 红色**：有 `{{...}}` 变量没找到值

    **看到非绿色就先别点 Send**。否则你会拿字面量 `{{token}}` 去请求，
    然后花半小时疑惑为什么一直 401。

    > 自查方法：点开圆点会列出「哪些变量未解析」。
    > 如果列表非空，去 `Environments` 里补齐，而不是改请求。

### 3.3 响应区关键信息

响应区不是「看一眼 200 就关掉」。这 5 个数字各有用途：

| 字段 | 在哪看 | 测试人员拿它做什么 |
|------|--------|--------------------|
| `Status` | 右上角 `200 OK` | 第一道判断。**注意：业务失败也常返回 200**，见下方红框 |
| `Time` | 右上角 `234 ms` | 粗筛性能异常。同一接口平时 50ms、今天 800ms → 提 Bug |
| `Size` | 右上角 `1.2 KB` | 列表接口体积暴涨 → 分页失效或字段冗余 |
| 响应 `Headers` | 下方 `Headers` 标签 | 查 `Content-Type` 是否对、`Set-Cookie`、`X-Request-Id`（找日志用） |
| `Test Results` | 下方 `Test Results` 标签 | 你写的断言跑了几条、过几条。**这才是回归的凭据** |

!!! danger "「200 就是成功」是新手最贵的一次误判"
    国内大量后端会这样设计——HTTP 状态码 200，但业务其实失败了：

    ```json
    { "code": 40101, "msg": "用户名或密码错误", "data": null }
    ```

    如果你的断言只写 `pm.response.to.have.status(200)`，这条用例**永远绿灯**，
    真实 Bug 已经漏到线上。

    **正确做法**：HTTP 状态码 + 业务 `code` + 关键字段**三重断言**。
    完整写法见 [8.2 常用断言模板](#82)。

    **花 10 秒验证你的系统是不是这种设计**：
    把登录接口的密码故意改错，发一次。

    - 如果返回 **HTTP 200 且 `code` 非 0** → 你的系统就是这种设计，
      只断言 200 等于没写断言
    - 如果返回 **HTTP 4xx** → 你的系统状态码语义规范，
      但仍建议补业务码断言，防止后续改版

---

## 四、发送第一个请求

以一个开放 API 为例，演示基础流程。

### 4.1 准备工作

测试目标接口（公开测试 API）：

```
GET https://jsonplaceholder.typicode.com/users/1
```

### 4.2 操作步骤

1. 点击左上角 `+` 新建一个 Tab
2. 方法选择 `GET`
3. URL 输入：`https://jsonplaceholder.typicode.com/users/1`
4. 点击 `Send`

### 4.3 查看响应

响应区会显示：

- **Status：** `200 OK`
- **Time：** 如 `120 ms`
- **Body：** JSON 格式的用户数据

```json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz"
}
```

切换 Body 显示模式：

- `Pretty`：格式化展示（推荐）
- `Raw`：原始字符串
- `Preview`：预览（HTML 渲染）
- `Visualize`：可视化图表（需脚本支持）

### 4.4 保存请求

请求只有保存到 Collection 才能持久化：

1. 点击右上角 `Save` 按钮
2. 输入请求名称：`查询用户详情`
3. 选择或新建 Collection（如 `用户中心接口`）
4. 点击 `Save`

---

## 五、请求详解

### 5.1 Params（查询参数）

URL 中 `?` 后面的部分，如 `?page=1&size=10`。

**两种填写方式：**

- 方式 A：直接在 URL 中拼接
- 方式 B：在 `Params` 标签下以 Key-Value 形式填写（推荐，可勾选启用/禁用）

| Key | Value | Description |
|-----|-------|-------------|
| page | 1 | 页码 |
| size | 10 | 每页数量 |
| keyword | postman | 搜索词 |

### 5.2 Headers（请求头）

常见 Header：

| Header | 含义 | 示例 |
|--------|------|------|
| `Content-Type` | 请求体类型 | `application/json` |
| `Authorization` | 鉴权信息 | `Bearer eyJhbGc...` |
| `User-Agent` | 客户端标识 | `PostmanRuntime/7.x` |
| `Accept` | 接受的响应类型 | `application/json` |
| `Cookie` | 会话 Cookie | `sessionId=abc123` |

!!! tip "提示"
    Postman 会自动添加一些 Header（如 `Postman-Token`、`Host`），可点击 `hidden` 查看。

### 5.3 Body（请求体）

这是新手**报错最集中**的地方。6 种类型不是知识点，是 6 个开关，**选错就直接 400**。

#### 5.3.0 先看这张表：我该选哪个

**不要背名词，看接口文档怎么说**：

| 接口文档 / 开发说的 | 选这个 | 自动带的 Content-Type |
|---------------------|--------|----------------------|
| 「JSON 传参」「application/json」 | **raw → JSON** | `application/json` |
| 「表单」「form 提交」「multipart」 | **form-data** | `multipart/form-data` |
| 「表单」但明确不是 multipart | **x-www-form-urlencoded** | `application/x-www-form-urlencoded` |
| 「上传文件」单个大文件 | **binary** | 按文件推断 |
| 「GraphQL 查询」 | **GraphQL** | `application/json` |
| 「不需要参数」「参数在 URL 里」 | **none** | 无 |

!!! danger "选错的代价：你不会看到「格式选错了」这种友好提示"
    **两种类型混用是最高频的 400**，而且报错信息通常没法帮你定位：

    | 错误组合 | 后端实际看到 | 典型报错 |
    |----------|--------------|----------|
    | 用 `raw+JSON` 发到要 form 的接口 | Body 是一串 JSON 文本，没有字段 | `缺少必填参数 username` |
    | 用 `x-www-form-urlencoded` 发到要 JSON 的接口 | 后端 JSON 解析器拿到 `a=1&b=2` | `JSON parse error` / `Unexpected character` |
    | 用 `form-data` 传 JSON 字段 | 字段值变成 `"[object Object]"` | `参数类型错误` |
    | 选了 `raw` 但子类型留在 `Text` | Content-Type 是 `text/plain` | `415 Unsupported Media Type` |

    **判断依据**：不要猜，去看接口文档的 `Content-Type`，
    或者问开发要一条能跑通的 curl（里面有 `-H "Content-Type: ..."` 和 `-d` 参数）。

#### 5.3.1 none

无请求体。**只用于 GET、DELETE，或参数全在 URL 里的接口**。

⚠️ 注意一个隐蔽坑：如果接口是 POST 且**必须**有 Body，
选了 `none` 会发一个空 Body，后端可能返回 `Required request body is missing`
——这个报错指向「Body 为空」，但根因常是「你以为不用填」。

#### 5.3.2 form-data

`multipart/form-data`，**支持文件上传**，也支持普通文本字段。

| Key | Value | Type |
|-----|-------|------|
| username | testuser | Text |
| avatar | (选择文件) | File |

**什么时候必须用它**：接口既要传普通字段**又要传文件**。这是它相对
`binary` 的唯一优势——`binary` 只能传一个裸文件，加不了其他字段。

**容易踩的点**：

- 字段类型忘了从 `Text` 切成 `File` → 后端收到的是文件路径字符串
- 同一个 Key 要传多个文件，用 `Key[]` 或重复 Key（看后端实现）

#### 5.3.3 x-www-form-urlencoded

`application/x-www-form-urlencoded`，传统网页表单提交，本质是：

```
username=testuser&password=123456
```

**为什么它还在用**：这是 `<form>` 标签的默认编码，很多老系统、内部后台、
以及 OAuth2 的取 token 接口都用它。

!!! warning "一个特别常见的坑：OAuth2 取 token 接口"
    很多 OAuth2 的 `/oauth/token` 接口要求
    `Content-Type: application/x-www-form-urlencoded`。

    新手用 `raw+JSON` 去请求，得到 `invalid_client` 或 `unsupported_grant_type`，
    然后开始怀疑 Client ID 填错了——**其实只是 Body 格式不对**。

#### 5.3.4 raw

原始数据，子类型可选 `JSON` / `XML` / `HTML` / `Text` / `JavaScript`。

**日常 90% 的接口都是 raw + JSON**：

```json
{
  "username": "testuser",
  "password": "123456",
  "remember": true
}
```

**两个必须养成的习惯**：

1. **子类型一定切到 `JSON`**，不要停在默认的 `Text`，
   否则发出去的是 `Content-Type: text/plain` → 415
2. 写完点一下 `Beautify`（Ctrl+B），**JSON 少一个逗号或括号**时这里能看出来

!!! tip "怎么确认 Content-Type 真的发对了"
    在 `Headers` 标签里点 `hidden`，确认有一行：

    ```
    Content-Type: application/json
    ```

    如果**没有这一行**，说明你选的是 `Text` 子类型，
    或者手动删过——这时请求一定发不出去。

#### 5.3.5 binary

二进制，用于上传**单个**文件，不做任何包装。

**和 form-data 的区别**：`binary` 发的是文件原始字节流，
后端收到的是整个请求体就是文件内容；`form-data` 有边界分隔符和字段名。

**怎么选**：看接口文档写的是 `multipart/form-data`（→ form-data）
还是「请求体为文件二进制」（→ binary）。

#### 5.3.6 GraphQL

GraphQL 专用，Postman 会把它包装成 `{"query": ..., "variables": ...}` 发给后端。

**测试人员最常用的场景**：验证 GraphQL 的**字段级权限**——
只查 `id` 和查 `user.password`，看后端有没有真的做字段过滤。

### 5.4 Authorization（鉴权）

Postman 内置多种鉴权方式，选中后自动添加对应 Header：

| 类型 | 说明 |
|------|------|
| `No Auth` | 无鉴权 |
| `Basic Auth` | 用户名+密码 Base64 |
| `Bearer Token` | Token 鉴权（最常见） |
| `OAuth 1.0` | OAuth 1.0 协议 |
| `OAuth 2.0` | OAuth 2.0 协议 |
| `API Key` | API Key 鉴权 |
| `Digest Auth` | 摘要鉴权 |
| `AWS Signature` | AWS 签名 |

**Bearer Token 示例：**

- Type 选择 `Bearer Token`
- Token 输入：`eyJhbGciOiJIUzI1NiIs...`
- 请求会自动添加 Header：`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`

### 5.5 Cookies 管理

点击 URL 栏右侧 `Cookies` 链接，进入 Cookie 管理器：

- 按域名查看/编辑/删除 Cookie
- 手动添加 Cookie 进行测试
- 测试 Session 时常用

---

## 六、环境与变量管理

### 6.1 为什么需要变量

接口测试中，同一组接口需要在 **不同环境（开发/测试/预发布/生产）** 执行，URL、Token、用户账号都不一样。变量可避免重复修改。

### 6.2 变量作用域（由低到高）

```
Global（全局） < Collection（集合） < Environment（环境） < Data（数据） < Local（本地）
```

层级越高优先级越高，同名变量高层级覆盖低层级。

!!! info "Data vs Local 说明"
    - **Data（数据变量）**：从外部 CSV/JSON 文件加载，在 Collection Runner 数据驱动迭代期间有效
    - **Local（本地变量）**：通过 `pm.variables.set("key", "val")` 在脚本中设置，仅当前请求生效
    - 优先级 Local > Data，但 Data 在整个迭代周期内持久，Local 仅单次请求。两者都高于 Environment。

### 6.3 创建环境变量

**Step 1：新建环境**

1. 左侧 `Environments` → `+` → 命名为 `测试环境`
2. 添加变量：

| Variable | Type | Initial Value | Current Value |
|----------|------|---------------|---------------|
| base_url | default | https://api-test.example.com | https://api-test.example.com |
| username | default | testuser | testuser |
| password | secret | 123456 | 123456 |
| token | default | (空) | (空) |

!!! tip "Type 选择 secret"
    可隐藏敏感字段（密码、Token），团队共享时不暴露明文。

!!! info "Initial Value 与 Current Value 区别"
    Initial 是分享时的默认值；Current 是本地实际生效值。

3. 点击 `Save` 保存

**Step 2：激活环境**

右上角环境下拉框选择 `测试环境`。

**Step 3：使用变量**

在 URL、Headers、Body 中使用 `{{变量名}}` 语法：

```
URL:  {{base_url}}/api/login
Body: {"username":"{{username}}","password":"{{password}}"}
```

变量值会在发送请求时自动替换。

### 6.4 全局变量

`Environments` → `Globals` → 添加变量，所有环境都能访问。

适合放：

- 工具类变量（如 UUID 生成函数对应的值）
- 不区分环境的固定值

### 6.5 变量赋值的几种方式

**方式 1：界面手动设置**（如上述）

**方式 2：在脚本中动态设置**

```javascript
// 设置环境变量
pm.environment.set("token", "eyJhbGci...");

// 设置全局变量
pm.globals.set("requestId", "12345");

// 设置 Collection 变量
pm.collectionVariables.set("nodeId", "abc");

// 设置局部变量（仅当前请求生效）
pm.variables.set("temp", "value");
```

**方式 3：从响应中提取**

```javascript
// 解析 JSON 响应
const responseJson = pm.response.json();
// 提取 token 并保存
pm.environment.set("token", responseJson.data.token);
```

---

## 七、Collection 集合管理

### 7.1 Collection 是什么

Collection 是接口的逻辑分组容器，类似文件夹。一个项目通常对应一个 Collection。

### 7.2 创建 Collection

1. 左侧 `Collections` → `+ Create Collection`
2. 命名：如 `电商系统-接口测试`
3. 可选配置：
   - **Authorization**：集合级鉴权，所有子请求继承
   - **Pre-request Scripts**：集合级前置脚本（每个请求执行前都运行）
   - **Tests**：集合级测试脚本
   - **Variables**：集合级变量

### 7.3 文件夹组织

在 Collection 下创建子文件夹按模块分类：

```
电商系统-接口测试/
├── 01_用户模块/
│   ├── 注册
│   ├── 登录
│   └── 查询用户信息
├── 02_商品模块/
│   ├── 商品列表
│   └── 商品详情
├── 03_订单模块/
│   ├── 创建订单
│   ├── 支付订单
│   └── 取消订单
```

### 7.4 Collection Runner（集合运行器）

批量执行整个 Collection 或文件夹的所有请求：

1. 点击 Collection 右侧 `...` → `Run collection`
2. 配置运行参数：
   - **Iterations**：迭代次数
   - **Delay**：请求间隔（ms）
   - **Data**：数据文件（CSV/JSON，数据驱动用）
   - **Environment**：运行环境
   - **Keep variable values**：保留变量修改
3. 点击 `Run`

### 7.5 接口顺序与依赖

测试场景中接口往往有依赖（如先登录拿 Token 才能调其他接口）。Collection Runner 按文件夹中接口顺序执行，可通过：

- 上下拖动调整顺序
- 在 Tests 脚本中使用 `postman.setNextRequest("请求名")` 动态跳转

---

## 八、Tests 断言脚本

!!! abstract "核心概念"
    Tests 是接口自动化测试的核心。每个请求执行后，Tests 中的脚本会自动运行，验证响应是否符合预期。

### 8.1 编写位置

请求 Tab → `Tests` 标签下，使用 JavaScript 编写。不需要精通 JavaScript，Postman 提供了 `pm.test()`、`pm.expect()`、`pm.response` 等辅助对象，照着模板写就行。

### 8.2 常用断言模板

Postman 右侧提供 `Snippets` 代码片段，点击即可插入。

#### 8.2.1 状态码断言

```javascript
pm.test("状态码为 200", function () {
    pm.response.to.have.status(200);
});
```

#### 8.2.2 响应时间断言

```javascript
pm.test("响应时间小于 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

#### 8.2.3 响应体包含特定字符串

```javascript
pm.test("响应体包含 success", function () {
    pm.expect(pm.response.text()).to.include("success");
});
```

#### 8.2.4 JSON 字段断言

```javascript
pm.test("返回 code 为 0", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.code).to.eql(0);
});

pm.test("data.userId 是数字类型", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.userId).to.be.a("number");
});

pm.test("data.list 数组长度为 10", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data.list).to.have.lengthOf(10);
});
```

#### 8.2.5 响应头断言

```javascript
pm.test("Content-Type 为 JSON", function () {
    pm.response.to.have.header("Content-Type", "application/json; charset=utf-8");
});
```

#### 8.2.6 JSON Schema 校验

JSON Schema 定义响应的"结构模板"——必须有哪些字段、每个字段是什么类型。这样不仅能验证单个值，还能验证整个响应结构是否正确。

```javascript
const schema = {
    "type": "object",
    "required": ["code", "msg", "data"],    // 必须包含这三个字段
    "properties": {
        "code": {"type": "number"},
        "msg": {"type": "string"},
        "data": {
            "type": "object",
            "required": ["userId", "username"],
            "properties": {
                "userId": {"type": "number"},
                "username": {"type": "string"}
            }
        }
    }
};

pm.test("响应结构符合 Schema", function () {
    pm.response.to.have.jsonSchema(schema);
});
```

### 8.3 提取数据传递给下一个请求

```javascript
// 提取登录返回的 token，保存到环境变量
const jsonData = pm.response.json();
if (jsonData.code === 0) {
    pm.environment.set("token", jsonData.data.token);
    pm.environment.set("userId", jsonData.data.userId);
    console.log("Token 已保存：" + jsonData.data.token.slice(0, 8) + "...");
}
```

真实项目不要在 Console 或 CI 日志中打印完整 Token、密码、Cookie、私钥。需要排查时只打印前后几位，或打印“已获取/未获取”的状态。

后续接口使用：

```
Headers: Authorization = Bearer {{token}}
```

### 8.4 控制流程

```javascript
// 跳转到指定请求（按名称）
postman.setNextRequest("创建订单");

// 停止后续请求执行
postman.setNextRequest(null);

// 循环：根据条件回到自己
if (pm.environment.get("retry") < 3) {
    pm.environment.set("retry", pm.environment.get("retry") + 1);
    postman.setNextRequest(pm.info.requestName);
}
```

### 8.5 输出调试信息

```javascript
const token = pm.environment.get("token");
console.log("当前 token：", token ? token.slice(0, 8) + "..." : "未获取");
console.log("响应体：", pm.response.json());
```

通过 `View` → `Show Postman Console`（快捷键 `Ctrl + Alt + C`）查看输出。

---

## 九、Pre-request Scripts 前置脚本

### 9.1 执行时机

每个请求 **发送前** 自动运行，常用于：

- 生成动态参数（时间戳、签名、UUID）
- 数据准备（先调用其他接口获取数据）
- 修改请求参数

### 9.2 常用示例

#### 9.2.1 生成时间戳

```javascript
const timestamp = new Date().getTime();
pm.environment.set("timestamp", timestamp);
```

请求 Body 中使用：`{"time": "{{timestamp}}"}`

#### 9.2.2 生成 UUID

```javascript
const uuid = require('uuid').v4();
pm.environment.set("requestId", uuid);
```

#### 9.2.3 计算 MD5 签名

```javascript
const CryptoJS = require("crypto-js");
const params = "timestamp=" + new Date().getTime() + "&key=mySecretKey";
const sign = CryptoJS.MD5(params).toString();
pm.environment.set("sign", sign);
```

#### 9.2.4 调用其他接口获取 Token

```javascript
pm.sendRequest({
    url: pm.environment.get("base_url") + "/api/login",
    method: 'POST',
    header: { 'Content-Type': 'application/json' },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            username: pm.environment.get("username"),
            password: pm.environment.get("password")
        })
    }
}, function (err, res) {
    if (!err && res.code === 200) {
        const token = res.json().data.token;
        pm.environment.set("token", token);
    }
});
```

---

## 十、数据驱动测试

### 10.1 应用场景

同一个接口需用 **多组不同的测试数据** 执行，验证不同场景（如登录的正常账号、错误密码、空账号、SQL 注入等）。

### 10.2 准备数据文件

**方式 1：CSV 文件（推荐）**

`login_test_data.csv`:

```csv
case_name,username,password,expected_code,expected_msg
正常登录,testuser,123456,0,成功
密码错误,testuser,wrong,1001,密码错误
账号不存在,nouser,123456,1002,账号不存在
账号为空,,123456,1003,账号不能为空
SQL注入测试,admin' OR '1'='1,123456,1001,密码错误
```

**方式 2：JSON 文件**

```json
[
  {
    "case_name": "正常登录",
    "username": "testuser",
    "password": "123456",
    "expected_code": 0
  },
  {
    "case_name": "密码错误",
    "username": "testuser",
    "password": "wrong",
    "expected_code": 1001
  }
]
```

### 10.3 在请求中引用

Body 中：

```json
{
  "username": "{{username}}",
  "password": "{{password}}"
}
```

Tests 中：

```javascript
pm.test(`[${pm.iterationData.get("case_name")}] code 符合预期`, function () {
    const jsonData = pm.response.json();
    const expectedCode = parseInt(pm.iterationData.get("expected_code"));
    pm.expect(jsonData.code).to.eql(expectedCode);
});
```

### 10.4 执行数据驱动测试

1. Collection Runner 中：
2. `Data` 区域选择 CSV/JSON 文件
3. `Iterations` 自动填充为数据行数
4. 点击 `Preview` 预览数据加载情况
5. `Run`

每一行数据会执行一次完整流程，所有结果汇总展示。

---

## 十一、Mock Server 模拟服务

### 11.1 应用场景

- 后端接口未开发完成，前端/测试需要先行进行
- 复现某些难以触发的响应（如服务器超时、5xx 错误）
- 减少对真实环境的依赖

### 11.2 创建 Mock Server

**Step 1：准备示例响应**

在 Collection 中创建请求 → 点击 `Save Response` → `Save as example`

为每个请求添加多个 Example：

- 状态码 200 的成功响应
- 状态码 400 的参数错误响应
- 状态码 500 的服务器错误响应

**Step 2：创建 Mock**

1. 左侧 `Mock Servers` → `+`
2. 选择对应的 Collection 和 Environment
3. 命名 Mock 服务
4. 创建后会生成 Mock URL，例如：
   ```
   https://abc123.mock.pstmn.io
   ```

**Step 3：调用 Mock 接口**

将原本调用 `https://api.example.com/users/1` 改为：

```
https://abc123.mock.pstmn.io/users/1
```

Mock 服务会按 Example 配置返回响应。

### 11.3 智能匹配

Postman Mock 会根据请求的 Method、URL、Query 参数、Header 智能匹配最合适的 Example。可在 Example 上设置 `x-mock-response-name` Header 强制指定返回某个 Example。

---

## 十二、Newman 命令行执行

### 12.1 Newman 是什么

Newman 是 Postman 官方提供的命令行工具，用于在 **终端 / CI/CD 流水线** 中执行 Postman Collection。

### 12.2 安装 Newman

需先安装 Node.js（JavaScript 运行环境，下载地址：`https://nodejs.org/`，选 LTS 版本）。安装后自带 npm（包管理器，类似 pip）。Newman 当前版本要求 Node.js 16+。

```bash
npm install -g newman

# 验证安装
newman --version
```

如需 HTML 报告，额外安装：

```bash
npm install -g newman-reporter-htmlextra
```

### 12.3 导出 Collection

Postman 中：右键 Collection → `Export` → 选择 `Collection v2.1` → 保存为 `collection.json`

同样导出环境：`Environments` → 右键 → `Export` → `environment.json`

### 12.4 执行命令

**基础执行：**

```bash
newman run collection.json
```

**指定环境：**

```bash
newman run collection.json -e environment.json
```

**指定数据文件（数据驱动）：**

```bash
newman run collection.json -e environment.json -d test_data.csv
```

**生成 HTML 报告：**

```bash
newman run collection.json \
  -e environment.json \
  -r htmlextra \
  --reporter-htmlextra-export report.html
```

**完整示例：**

```bash
newman run collection.json \
  -e environment.json \
  -d test_data.csv \
  -n 2 \
  --delay-request 500 \
  --timeout-request 10000 \
  -r cli,htmlextra,json \
  --reporter-htmlextra-export report.html \
  --reporter-json-export report.json
```

参数说明：

| 参数 | 含义 |
|------|------|
| `-n` | 迭代次数 |
| `--delay-request` | 请求间隔（ms） |
| `--timeout-request` | 请求超时（ms） |
| `-r` | 报告类型，多个用逗号 |
| `--bail` | 遇到失败立即停止 |
| `-k` | 跳过 SSL 校验 |

### 12.5 CI/CD 集成示例（GitHub Actions）

```yaml
name: API Test
on: [push]
jobs:
  api-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Newman
        run: |
          npm install -g newman
          npm install -g newman-reporter-htmlextra
      - name: Run API Tests
        run: |
          newman run ./postman/collection.json \
            -e ./postman/environment.json \
            -r cli,htmlextra \
            --reporter-htmlextra-export ./report.html
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-report
          path: ./report.html
```

---

## 十三、接口测试实战案例

### 13.1 案例一：登录 → 提取 Token → 查询用户信息

**接口 1：登录**

```
POST {{base_url}}/api/login
Body (raw JSON):
{
    "username": "{{username}}",
    "password": "{{password}}"
}

Tests:
pm.test("登录成功", function () {
    pm.response.to.have.status(200);
    const json = pm.response.json();
    pm.expect(json.code).to.eql(0);
    pm.environment.set("token", json.data.token);
    pm.environment.set("userId", json.data.userId);
});
```

**接口 2：查询用户信息**

```
GET {{base_url}}/api/user/{{userId}}
Headers:
    Authorization: Bearer {{token}}

Tests:
pm.test("查询成功", function () {
    pm.response.to.have.status(200);
    const json = pm.response.json();
    pm.expect(json.data.userId).to.eql(parseInt(pm.environment.get("userId")));
});
```

### 13.2 案例二：参数化登录测试（数据驱动）

数据文件 `login_cases.csv`：

```csv
case_name,username,password,expected_code
正常登录,testuser,123456,0
账号不存在,nouser,123456,1002
密码错误,testuser,wrong,1001
账号为空,,123456,1003
```

登录请求 Tests：

```javascript
pm.test(`[${pm.iterationData.get("case_name")}]`, function () {
    const json = pm.response.json();
    const expected = parseInt(pm.iterationData.get("expected_code"));
    pm.expect(json.code).to.eql(expected);
});
```

Collection Runner 选择该 CSV → 运行 → 4 条用例自动执行并产出结果。

### 13.3 案例三：完整下单流程

业务链路：登录 → 查询商品 → 加入购物车 → 创建订单 → 查询订单

将 5 个接口放入同一文件夹，通过 Tests 串联：

```javascript
// 接口 1：登录
pm.environment.set("token", pm.response.json().data.token);

// 接口 2：查询商品
pm.environment.set("productId", pm.response.json().data.list[0].id);

// 接口 3：加入购物车
pm.environment.set("cartId", pm.response.json().data.cartId);

// 接口 4：创建订单
pm.environment.set("orderId", pm.response.json().data.orderId);
pm.test("订单创建成功", function() {
    pm.expect(pm.response.json().data.orderId).to.be.a("number");
});

// 接口 5：查询订单
pm.test("订单状态正确", function() {
    pm.expect(pm.response.json().data.status).to.eql("WAIT_PAY");
});
```

Collection Runner 按顺序执行，可验证整条业务链路。

### 13.4 案例四：异常场景测试

针对同一接口构造异常场景：

| 用例 | 修改点 | 预期结果 |
|------|--------|---------|
| 缺失必填参数 | 删除 Body 中某字段 | 返回 4xx，错误码提示字段缺失 |
| 参数类型错误 | 数字字段传字符串 | 返回 4xx |
| 参数边界值 | 长度上限 +1 | 返回 4xx |
| 无 Token | 删除 Authorization | 返回 401 |
| 过期 Token | 使用过期 Token | 返回 401 |
| 无权限 | 用普通用户访问管理接口 | 返回 403 |
| 重复提交 | 短时间内发送 2 次相同请求 | 第 2 次应被拦截 |
| SQL 注入 | 输入 `' OR '1'='1` | 应被拦截或转义 |
| XSS 攻击 | 输入 ````html
```html
<script>
```
alert(1)
</script>
```` | 应被过滤 |

每个用例独立保存为请求，配合数据驱动，可一次性运行所有异常场景。

---

## 十四、团队协作

### 14.1 Workspace 工作空间

- **Personal Workspace**：个人工作空间，仅自己可见
- **Team Workspace**：团队共享空间，成员可同时编辑（免费版有人数限制）

### 14.2 同步与分享

- 登录账号后，所有变更自动云同步
- 右键 Collection → `Share` → 生成分享链接 / 邀请成员
- 团队可对 Collection 进行权限管理（View / Edit）

### 14.3 版本控制

Postman 提供 fork/merge 功能：

- 个人 fork 团队 Collection 进行本地修改
- 修改完成后发起 Pull Request
- 团队 Owner 审核合并

### 14.4 导出与备份

定期导出 Collection 和 Environment 为 JSON，备份到 Git 仓库，避免账号问题导致数据丢失。

---

## 十五、常见问题排查

这一章按**「症状 → 先分清是哪一类 → 再按清单排」**来组织。
新手最常犯的错不是不会排查，是**看到 401 就去改 Token**——而真正的原因可能是变量没解析。

### 15.0 先做一次分诊：问题出在哪一层

**任何一个「请求失败」，先问自己这 3 个问题**，能把排查范围砍掉 2/3：

| 现象 | 大概率层次 | 先查这个 | 跳到 |
|------|-----------|----------|------|
| 根本没发出请求 / Console 无记录 | **变量层** | URL 旁圆点是不是绿的 | [15.3](#153) |
| 发出去了，但 401 / 403 | **鉴权层** | Console 里 `Authorization` 头长什么样 | [15.1](#151-401-403) |
| 发出去了，但 404 | **路由层** | 实际请求的完整 URL 是什么 | [15.2](#152-404) |
| 发出去了，但 400 / 415 | **Body 层** | Content-Type 和格式是否配对 | [5.3](#53-body) |

!!! tip "每次排查第一步都做这件事：打开 Console"
    `View` → `Show Postman Console`（或 `Ctrl+Alt+C`）。

    **Console 会显示 Postman 实际发出去的原始请求**——
    URL 里变量有没有被替换、Header 里到底有没有 `Authorization`、
    Body 实际是什么内容，全在这里。

    没有 Console，你就是在猜；打开 Console，你是在看证据。
    **这比下面所有清单加起来都重要。**

### 15.1 接口返回 401 / 403

**先分清这两个码的语义，排查方向完全不同**：

| 码 | 含义 | 谁的问题 |
|----|------|----------|
| `401 Unauthorized` | **没认证**：没带凭证、凭证无效、凭证过期 | 你的 Token / Header 有问题 |
| `403 Forbidden` | **认证了，但没权限**：身份有效，权限不足 | 你的**账号角色**有问题，改 Token 没用 |

!!! warning "最常见的 401 原因：`Bearer ` 后面少了空格"
    `Authorization: Bearer abc123` ✅
    `Authorization: Bearerabc123` ❌ —— 后端解析失败，直接 401

    另外：如果**你自己在 Headers 里手写了 `Authorization`**，
    同时 `Auth` 标签又选了 `Bearer Token`，
    会**发两个同名 Header**，后端取到哪个不确定。**只留一个。**

**排查清单（按顺序，不要跳）**：

1. Console 里确认请求**确实带了** `Authorization` 头——没有就是没配上
2. 确认格式是 `Bearer <token>`（注意空格，且 `Bearer` 大小写要一致）
3. 用同一 Token 在 `jwt.io` 解码（**只看 `exp` 字段，不要把 Token 贴到任何在线工具**，
   本地解码即可），确认没过期
4. 如果 Code 里 401、直接点 Send 却 200 → 说明是**变量没传给 Cookie/Header**，看 [15.3](#153)
5. 401 都排除了仍是 **403** → 换一个有权限的账号试，确认是权限问题而不是 Token 问题

### 15.2 接口返回 404

**404 有三种完全不同的成因，别混在一起查**：

| 成因 | 现象 | 怎么确认 |
|------|------|----------|
| URL 真的拼错了 | 路径里可能有重复 `/` 或少了 `/api` | Console 里看完整 URL |
| **方法错了**（如该 POST 写成 GET） | 有些框架对方法不匹配返回 404 而非 405 | 换方法再发一次 |
| **变量没解析**，变成了字面量 | URL 里能直接看到 `{{base_url}}` 字样 | 看 URL 旁圆点颜色 |

!!! danger "最隐蔽的一种：「环境没选」导致请求发到错的地方"
    如果你有「开发/测试」两个环境，**忘了选环境**时 `{{base_url}}` 不会被替换。
    Postman 会把 `{{base_url}}/api/users` **原样**发出去，
    有些网关会把它路由到一个 404 页面——**看起来像接口不存在**。

    **确认方法**：Console 里看 `GET` 后面那串。
    如果里面还有 `{{` 和 `}}`，问题就在变量，不在接口。

### 15.3 变量没有生效

这是**最高频、也最容易被误判为「后端接口坏了」**的一类问题。

**按这个顺序查，通常前 2 步就能定位**：

1. **看 URL 旁的圆点颜色**——橙色/红色就是有变量没解析，点开能看到是哪个
2. **确认选中了环境**（右上角下拉框），很多人建了环境但没激活
3. **变量名大小写完全一致**——`{{base_url}}` ≠ `{{BASE_URL}}`，Postman 不报错，直接原样发
4. **`Current Value` 有值吗**——只填了 `Initial Value` 时，本地实际生效的是空
5. **作用域被覆盖了吗**——同名变量优先级：`Local > Data > Environment > Collection > Global`

!!! tip "诊断方法：在 Console 里看替换后的真实值"
    在 `Pre-request Script` 里加一行，把最终解析结果打出来：

    ```javascript
    console.log("base_url =", pm.variables.get("base_url"));
    console.log("token 前 8 位 =", (pm.variables.get("token") || "").slice(0, 8));
    ```

    如果打印出 `undefined`，说明变量压根不存在；
    如果打印出 `{{base_url}}` 字面量，说明是**作用域没激活**。

    ⚠️ **永远不要 `console.log` 完整 Token**——截图分享时最容易泄露。

### 15.4 SSL 证书错误

测试环境常用自签名证书，报错通常是：

```
Error: self signed certificate in certificate chain
SSL Error: Unable to verify the first certificate
```

**排查顺序**：

1. 先判断：是**只有测试环境报**，还是所有环境都报？
   - 只有测试环境 → 自签名证书，正常，按下面关闭校验
   - 所有环境都报 → 注意了，可能是**中间人抓包**（公司网络策略或被劫持），先问运维
2. `Settings` → `General` → 关闭 `SSL certificate verification`
3. Newman 命令行加 `-k`：`newman run xxx.json -k`

!!! warning "关闭证书校验是测试环境的手段，不是默认配置"
    把关闭校验的状态带到生产环境回归里，等于**放弃了证书有效性验证**，
    证书过期、域名不匹配这类问题就测不出来了。**跑生产用例前检查这一项。**

### 15.5 文件上传失败

**按「Body 类型 → 字段类型 → 文件权限 → 编码」四级排查**：

| 层级 | 检查项 | 典型报错 |
|------|--------|----------|
| Body 类型 | 是否选了 `form-data`（不是 raw） | `Required request part 'file' is not present` |
| 字段类型 | Key 那一行的 Type 列是否是 `File` | 后端收到文件名字符串 |
| 文件权限 | `Settings` → `Allow reading files outside working directory` | `Error: ENOENT` / 文件读不到 |
| 文件名 | 路径含中文/空格/特殊字符 | 偶发失败，换纯英文路径试 |

### 15.6 Collection Runner 卡住不动

**先分清是「卡住」还是「很慢」**：

- **很慢**：看 `Delay` 设置，以及请求是否真的每次都超时（Console 有耗时）
- **真卡住**：通常是脚本问题，不是 Postman 的问题

**排查清单**：

1. `Delay` 是否被设成很大的值（如 5000ms × 100 次 = 8 分钟）
2. 有没有 `setNextRequest` 形成**无限循环**——检查跳转条件是否可能永不满足
3. Console 里找**未捕获异常**：某个请求脚本抛错后，Runner 可能停在那一条
4. 数据文件行数是否远大于预期（一次跑几千条会以为卡死）

### 15.7 中文乱码

**分清楚是「响应乱码」还是「请求乱码」，解法不一样**：

| 现象 | 原因 | 解法 |
|------|------|------|
| 响应区中文显示成 `æµ‹è¯•` | 响应头 `Content-Type` 没带 charset，Postman 猜错编码 | 响应区右上角手动切 `UTF-8` |
| 后端收到的中文变成乱码 | 请求 Body 没声明字符集 | Header 补 `Content-Type: application/json; charset=utf-8` |

!!! tip "在断言里防乱码"
    中文乱码是**可以用断言抓到的**，别靠人眼看：

    ```javascript
    pm.test("响应中文未乱码", function () {
        const raw = pm.response.text();
        // 乱码特征：出现连续的拉丁扩展字符
        pm.expect(raw).to.not.match(/[ÃÂåæè][\x80-\xBF]/);
    });
    ```

### 15.8 Postman 不能访问内网接口

**先确认是哪一层进不去**，别一上来就配代理：

| 情况 | 判断方法 | 处理 |
|------|----------|------|
| 本机都 ping 不通 | 浏览器也打不开 | 网络/VPN 问题，找运维 |
| 浏览器能开，Postman 不能 | 只有 Postman 失败 | **Postman 走了代理**（见下） |
| 需要经过公司代理 | 浏览器配了 PAC/代理 | 在 `Settings` → `Proxy` 填代理地址 |

!!! danger "最常见的原因：你为了抓包配了 Fiddler 代理，然后忘了关"
    按 [2.3 基础设置](#23) 配过 `127.0.0.1:8888` 的人，
    **Fiddler 一关，Postman 所有请求都会失败**（连不上代理）。

    排查方法：`Settings` → `Proxy`，看 `Use custom proxy configuration`
    是不是还勾着。访问内网时应该**关掉这个开关**。

---

## 十六、进阶建议

### 16.1 学习路径

```
基础请求 → 变量与环境 → Tests 断言 → 数据驱动 
→ Pre-request 脚本 → Mock Server → Newman → CI/CD 集成
```

### 16.2 配套工具推荐

- **Fiddler / Charles**：抓包工具，与 Postman 互补
- **Swagger / OpenAPI**：接口文档，可直接导入 Postman
- **JMeter**：性能压测
- **Allure**：测试报告美化
- **Jenkins / GitLab CI**：流水线集成
- **YApi / Apifox**：国产替代方案（功能更全，免费）

### 16.3 最佳实践

1. **接口分层管理**：按业务模块用文件夹组织 Collection
2. **环境变量先行**：所有可变内容都用变量，禁止硬编码
3. **每个接口至少 3 个断言**：状态码 / 关键字段 / 响应时间
4. **善用 Pre-request 链路**：自动处理 Token、签名等通用逻辑
5. **数据驱动覆盖异常场景**：CSV 中至少包含正常、异常、边界三类用例
6. **定期备份导出**：导出 JSON 到 Git 版本管理
7. **CI/CD 集成**：每次代码提交触发回归测试

---

## 附录：参考资料

- Postman 官方文档：`https://learning.postman.com/`
- Postman Public API Network：`https://www.postman.com/explore`
- Newman 文档：`https://github.com/postmanlabs/newman`
- Chai 断言库文档（Tests 脚本使用）：`https://www.chaijs.com/api/bdd/`

---

!!! info "文档说明"
    本教程基于 Postman 桌面版 10.x 编写，适用于 Windows/Mac/Linux。

!!! warning "测试纪律"
    接口测试请在测试环境进行，禁止用真实用户数据测试，禁止在生产环境执行批量请求。涉及第三方接口需注意调用频率限制。

---

## 动手任务：为一个「订单查询」接口补齐断言

> 这是本教程的收尾练习。请**独立完成**，不要先看参考答案。目标不是"能发出请求"，而是**能写出真正会抓到缺陷的断言**。

### 任务背景

开发说「订单查询接口已经测过了，返回 200 就没问题」。你要证明这种测法会漏掉大量缺陷——用断言把接口的**契约、业务、数据、安全**四层都覆盖到。

### 任务准备

用 Postman 的 Mock Server 或任意公开测试 API 代替。推荐用 `https://jsonplaceholder.typicode.com` 这类免费接口练习，也可以自己起一个：

如果没有可用服务，用 Postman 的 **Mock Server** 新建一个，返回体设为：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "orderId": "ORD-20260901-0001",
    "userId": 10002,
    "status": "paid",
    "amount": 1299.00,
    "items": [
      { "productId": 101, "name": "显示器", "quantity": 1, "price": 1299.00 }
    ],
    "createdAt": "2026-09-01T10:00:03+08:00"
  }
}
```

> 注意：`amount` 已与 `items` 累加一致（1 × 1299.00）。如果你想让练习更有挑战，可以故意把 `amount` 改成一个不匹配的值，然后确认第 3 题的断言**会失败**。

### 任务要求

请依次完成，并在 Postman 的 **Tests** 标签里写出断言脚本：

1. **协议层断言**：状态码、响应时间上限、`Content-Type`。
2. **业务层断言**：业务码为成功、`message` 符合预期。
3. **数据层断言**：`orderId` 格式正确、`amount` 与 `items` 累加一致、`createdAt` 是合法时间。
4. **安全层断言**：响应体**不包含**手机号、身份证、密码等敏感字段（用断言而不是人眼看）。
5. **把断言整理成可复用的产出**：写一段能放进 Collection 级 `Pre-request`/`Tests` 的公共断言，让整个集合的接口自动校验"响应必须是 JSON 且不含敏感字段"。

### 提交物

| 产出 | 要求 |
|------|------|
| Tests 脚本 | 完整的 5 段断言代码 |
| 运行结果 | Postman Test Results 面板截图（须全绿） |
| 反例验证 | 手工改坏 Mock 响应中的一个字段，证明你的断言**确实会失败** |
| 结论 | 用 3-5 句话说明：只断言状态码会漏掉哪些类型的问题 |

### 完成标准

- [ ] 断言覆盖协议/业务/数据/安全四层，不是只写 `pm.response.to.have.status(200)`
- [ ] 第 3 题的金额校验是**真的计算**（比较 `amount` 与 `items` 求和），不是写死数字
- [ ] 第 4 题用断言主动检查敏感字段，而不是靠人工看响应
- [ ] 做过反例验证——能证明"断言写错/服务出错时测试会红"

??? tip "参考答案与思路（先自己做完再看）"

    **第 1 题：协议层**

    ```javascript
    pm.test("状态码为 200", function () {
        pm.response.to.have.status(200);
    });

    pm.test("响应时间小于 800ms", function () {
        pm.expect(pm.response.responseTime).to.be.below(800);
    });

    pm.test("Content-Type 为 JSON", function () {
        pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
    });
    ```

    **第 2 题：业务层**

    ```javascript
    const body = pm.response.json();

    pm.test("业务码为 0（成功）", function () {
        pm.expect(body.code).to.eql(0);
    });

    pm.test("message 为 success", function () {
        pm.expect(body.message).to.eql("success");
    });
    ```

    **第 3 题：数据层**

    ```javascript
    pm.test("orderId 符合 ORD-日期-序号 格式", function () {
        pm.expect(body.data.orderId).to.match(/^ORD-\d{8}-\d{4}$/);
    });

    pm.test("amount 等于 items 金额累加", function () {
        const sum = body.data.items.reduce(
            (acc, it) => acc + it.price * it.quantity, 0
        );
        pm.expect(body.data.amount).to.eql(sum);
    });

    pm.test("createdAt 是合法时间", function () {
        const t = Date.parse(body.data.createdAt);
        pm.expect(Number.isNaN(t)).to.be.false;
    });
    ```

    要点：金额断言是**动态计算**的。如果开发改了折扣逻辑导致 `amount` 与明细不符，这条断言会立刻失败——这正是只检查状态码发现不了的。

    **第 4 题：安全层**

    ```javascript
    pm.test("响应体不含敏感字段", function () {
        const raw = pm.response.text();
        const forbidden = ["password", "idCard", "phone", "mobile", "token"];
        forbidden.forEach(function (f) {
            pm.expect(raw, "响应体不应包含 " + f).to.not.include(f);
        });
    });
    ```

    **第 5 题：Collection 级公共断言**

    在 Collection → Pre-request / Tests 标签写入（对该集合下所有请求生效）：

    ```javascript
    // 公共断言 1：响应必须是 JSON
    pm.test("响应为合法 JSON", function () {
        pm.response.to.be.json;
    });

    // 公共断言 2：不得泄露敏感信息
    pm.test("无敏感信息泄露", function () {
        const raw = pm.response.text();
        ["password", "idCard", "token"].forEach(function (f) {
            pm.expect(raw).to.not.include(f);
        });
    });
    ```

    **反例验证（关键步骤）**：在 Mock Server 的响应里把 `password` 加进去，或把 `amount` 改成 `9999`，重新发送请求，确认对应的断言**变红**。只有做过这一步，才能说明你的断言真的在起作用——否则可能只是"永远为真的假断言"。

---

## 下一步建议

```html
<div class="tutorial-next-steps" markdown="1">
```

### 完成检查

学完本教程后，检查自己是否能做到：

- [ ] 能创建和发送 GET、POST、PUT、DELETE 请求
- [ ] 能设置请求头、请求体、查询参数
- [ ] 能使用环境变量管理不同环境
- [ ] 能使用 Pre-request Script 提取 Token
- [ ] 能使用 Tests 编写断言
- [ ] 能使用 Collection Runner 批量执行

### 在线自测 { #sec-lab }

上面的四层断言是思路，这道题把它变成可运行的校验器：解析响应、校验金额与明细一致、扫描敏感字段。典型错误答案（只看状态码、金额写死）会被判分拦住。

::: info 在线编程练习场
此功能在原始 MkDocs 站点中提供，当前仅保留练习题目和数据。
:::

```json
{
  "title": "写一个会抓缺陷的响应校验器（而不是只看状态码）",
  "prelude": "import json\n\n# 一次「订单查询」接口的正常响应（字符串形式，模拟收到的原始响应体）\nGOOD_BODY = json.dumps({\n    'code': 0,\n    'message': 'success',\n    'data': {\n        'orderId': 'ORD-20260901-0001',\n        'status': 'paid',\n        'amount': 1299.00,\n        'items': [\n            {'productId': 101, 'name': 'monitor', 'quantity': 1, 'price': 1299.00}\n        ],\n        'createdAt': '2026-09-01T10:00:03+08:00',\n    },\n}, ensure_ascii=False)\n\n# 敏感字段词表：判分时在 prelude 里给出，避免各人自造词表导致误判\nSENSITIVE = ('password', 'idCard', 'id_card', 'mobile', 'phone', 'token')\n",
  "starterCode": "# SENSITIVE 已在上方给出，直接使用即可\n\n\ndef parse(body_text, status_code):\n    \"\"\"任务 1（协议层）：把响应体解析成 dict。\n\n    返回 (ok: bool, data_or_none):\n      - status_code 不是 200        -> (False, None)\n      - 响应体不是合法 JSON          -> (False, None)\n      - 响应体是合法 JSON 但不是对象  -> (False, None)\n      - 其他情况                    -> (True, dict)\n    \"\"\"\n    # TODO: 在这里实现\n    pass\n\n\ndef check_amount(data):\n    \"\"\"任务 2（数据层）：校验 amount 与 items 明细累加一致。\n\n    累加规则：sum(item['price'] * item['quantity'] for item in data['items'])\n    返回 bool。金额比较请容忍 1 分钱以内的浮点误差（< 0.005）。\n    data 缺少 items 或 items 为空时返回 False（空订单不该出现在这个接口里）。\n    \"\"\"\n    # TODO: 在这里实现\n    pass\n\n\ndef find_sensitive(body_text):\n    \"\"\"任务 3（安全层）：返回响应体里出现的敏感字段名列表（小写，去重，按字母序）。\n\n    判定：只要响应原文里（不区分大小写）出现了 SENSITIVE 里的某个词，就算命中。\n    没命中返回空列表 []。\n    \"\"\"\n    # TODO: 在这里实现\n    pass\n",
  "tests": [
    {
      "name": "任务 1：正常响应解析成功",
      "code": "ok, d = parse(GOOD_BODY, 200)\nassert ok is True, f'正常响应应返回 True，实际 {ok}'\nassert isinstance(d, dict) and d.get('code') == 0, f'应解析出 dict 且 code 为 0，实际 {d}'",
      "hint": "用 json.loads()，并用 try/except json.JSONDecodeError 兜住非法 JSON"
    },
    {
      "name": "任务 1：非 200、非 JSON、JSON 但不是对象都要判失败",
      "code": "assert parse(GOOD_BODY, 500)[0] is False, '状态码 500 应判失败'\nassert parse('<html>502 Bad Gateway</html>', 200)[0] is False, 'HTML 响应体应判失败'\nassert parse('[1, 2, 3]', 200)[0] is False, 'JSON 数组不是对象，应判失败'\nassert parse('<html>', 200)[1] is None, '失败时应返回 None 作为数据'\nassert parse('{\"code\": 0}', 200)[1] == {'code': 0}, '合法 JSON 对象应作为第二项返回'",
      "hint": "注意这四种情况的返回第二项都应是 None，不要抛异常"
    },
    {
      "name": "任务 2：金额与明细一致时通过",
      "code": "ok, d = parse(GOOD_BODY, 200)\nassert ok is True, f'正常响应应解析成功，实际 ok={ok}'\nassert check_amount(d['data']) is True, f\"1299.00 应与 1 件 1299.00 一致，data={d.get('data') if d else None}\"\ntwo = {'amount': 798.00, 'items': [\n    {'price': 399.00, 'quantity': 2}]}\nassert check_amount(two) is True, '798.00 应与 2 件 399.00 一致'",
      "hint": "sum(item['price'] * item['quantity']) 再和 data['amount'] 比"
    },
    {
      "name": "任务 2：开发改了折扣却没改 amount 时必须报错",
      "code": "import copy\nbad = copy.deepcopy(dict(code=0, data={'amount': 9999.00,\n      'items': [{'productId': 101, 'name': 'monitor', 'quantity': 1, 'price': 1299.00}]}))\nassert check_amount(bad['data']) is False, 'amount=9999 与明细 1299 不一致，应返回 False'\nassert check_amount({'amount': 100, 'items': []}) is False, '空 items 应返回 False'",
      "hint": "这是这道题的重点：只断言状态码的测试，永远发现不了这一类缺陷"
    },
    {
      "name": "任务 3：正常响应不含敏感字段",
      "code": "assert find_sensitive(GOOD_BODY) == [], f'正常响应不应命中敏感字段，实际 {find_sensitive(GOOD_BODY)}'",
      "hint": "注意 GOOD_BODY 里有 productId、createdAt，别把它们误判成敏感字段"
    },
    {
      "name": "任务 3：大小写混写也要抓到",
      "code": "leak = '{\"data\": {\"userPassword\": \"x\", \"Mobile\": \"138\"}}'\nr = find_sensitive(leak)\nassert r == ['mobile', 'password'], f\"应命中 ['mobile', 'password']，实际 {r}\"",
      "hint": "先把响应体整体 lower()，再逐个子串检查；返回的是 SENSITIVE 里的标准写法"
    }
  ]
}
```

做完点「检查答案」，每题都会给出具体提示。全对之后，本页会在学习进度里
自动标记为已通过（进度存在浏览器本地，换设备不会同步）。

---

### 推荐下一步

根据你的学习进度，选择下一步：

1. **如果你想学抓包**：学习 [Fiddler 抓包教程](Fiddler抓包教程-软件测试版.md)，掌握请求分析
2. **如果你想学接口测试**：学习 [接口测试方法论](../专项测试/接口测试完整教程-软件测试版.md)，掌握用例设计
3. **如果你想进入自动化**：学习 [Python 接口自动化](../自动化测试/Python+Requests+Allure接口自动化教程-软件测试版.md)，掌握代码化测试

### 阶段测验

完成教程后，建议做 [Postman 接口测试测验](Postman接口测试测验.md) 检验学习效果。

### 通关检查

完成本阶段后，使用 [第2阶段-工具实战通关](../学习中心/第2阶段-工具实战通关.md) 检查是否可以进入下一阶段。

</div>

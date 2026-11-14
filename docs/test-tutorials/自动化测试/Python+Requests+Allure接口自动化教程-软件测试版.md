---
description: Python 接口自动化教程，Requests + Pytest + Allure 框架搭建。
---
# Python + Requests + Allure 接口自动化教程（软件测试人员专用）

> 本教程面向软件测试工程师，系统讲解基于 Python 技术栈搭建接口自动化测试框架，覆盖从环境搭建、用例编写、数据驱动到 Allure 报告生成、CI/CD 集成的完整流程。

::: v-pre
<div class="tutorial-meta">
    <span class="difficulty-badge difficulty-intermediate">📙 进阶难度</span>
    <span class="meta-item">⏱ 约 5 天</span>
    <span class="meta-item">📋 前置：Python 基础、接口测试基础</span>
    <span class="meta-item">🎯 目标：搭建完整的接口自动化测试框架</span>
</div>
:::

| 项目 | 要求 | 获取方式 |
|------|------|----------|
| Python 基础 | 掌握变量、函数、类、文件读写、异常处理 | [Python基础教程-软件测试版](../基础理论/Python基础教程-软件测试版.md) |
| 接口测试基础 | 了解接口测试流程、用例设计方法 | [接口测试完整教程-软件测试版](../专项测试/接口测试完整教程-软件测试版.md) |

---

## 新手导读

这篇教程内容较长，新手不要一次性追完整框架。先完成“一个接口用例能运行、能断言、能出报告”这个小目标。

建议学习顺序：

1. 先学 Requests 发送 GET / POST 请求。
2. 再学 Pytest 如何识别和执行用例。
3. 然后学习 Fixture、参数化和配置文件。
4. 最后再加 Allure 报告、日志、数据驱动和 CI/CD。

如果你还不会 Python 基础和 Postman，建议先补这两部分，否则直接看框架会比较吃力。

### 版本与维护说明

| 项目 | 说明 |
|------|------|
| 适用技术栈 | Python 3.x、Requests、Pytest、Allure |
| 使用建议 | 示例以接口自动化思路为主，具体依赖版本以项目 `requirements.txt` 为准 |
| 更新提醒 | Pytest 插件、Allure 命令行和 CI Action 版本可能变化，落地前先用最小用例验证 |

---

## 最佳实践速查：推荐写法 vs 新手写法

| 场景 | 新手常见写法 | 推荐写法 | 原因 |
|------|--------------|----------|------|
| 请求地址 | 用例里硬编码完整 URL | 配置 `base_url`，请求封装拼接 path | 环境切换更安全 |
| 超时 | 不设置 timeout | 每个请求设置统一 timeout | 避免接口卡死导致用例挂住 |
| token | 写死 token | Fixture 动态登录获取 token | 避免 token 过期 |
| 断言 | 只断言 `status_code == 200` | 断言状态码、业务码、字段、数据变化 | 提高缺陷发现能力 |
| 测试数据 | 所有用例共用同一数据 | 独立数据或执行前准备数据 | 降低互相影响 |
| 日志 | 打印完整请求、响应、token | 脱敏输出关键字段 | 安全且易排查 |
| 用例依赖 | 用例按固定顺序执行 | 单接口用例独立，流程用例单独管理 | 减少连锁失败 |

不推荐：

```python
def test_login():
    r = requests.post(
        "https://api-test.example.com/api/login",
        json={"username": "test", "password": "123456"}
    )
    assert r.status_code == 200
```

推荐：

```python
def test_login_success(api_client):
    response = api_client.post(
        "/api/login",
        json={"username": "test", "password": "123456"},  # (1)
    )
    body = response.json()

    assert response.status_code == 200                     # (2)
    assert body["code"] == 0                               # (3)
    assert body["data"]["token"]                           # (4)
```

1. `json=` 会自动将字典序列化为 JSON 并设置 `Content-Type: application/json`，而 `data=` 发送的是表单编码
2. 断言 HTTP 状态码，确认请求本身没有网络层错误
3. 断言业务状态码，区分“请求成功但业务失败”（如密码错误返回 code=1001）
4. 断言关键字段存在，确保登录后确实返回了 token，否则后续接口调用会全部失败

接口自动化的价值不是“能发请求”，而是能稳定判断业务是否被破坏。

## 一、技术栈介绍

### 1.1 为什么选这个组合

| 工具 | 作用 | 优势 |
|------|------|------|
| **Python** | 编程语言 | 简洁易学，测试领域标配 |
| **Requests** | HTTP 请求库 | 接口测试事实标准，API 友好 |
| **Pytest** | 测试框架 | 用例编写灵活，插件生态丰富 |
| **Allure** | 测试报告 | 美观详细，支持步骤、附件、历史趋势 |
| **PyYAML** | 配置/数据驱动 | 可读性强，适合接口数据 |
| **Loguru** | 日志库 | 开箱即用，比标准库简单 |
| **Jenkins** | 持续集成 | 触发执行 + 展示报告 |

### 1.2 框架架构

框架的价值在于**把"变的部分"和"不变的部分"分开**。下面四层，越往下越稳定：接口地址和用例数据天天变（第一层、第四层），HTTP 怎么发、日志怎么打几乎不变（第三层）。所以**改动能被限制在一层之内**——接口改字段只动 `apis/`，换环境只动 `config/`，用例本身不动。

```
┌─────────────────────────────────────────┐
│           测试用例层 (testcases/)         │
│   pytest 用例 + Allure 装饰器             │
├─────────────────────────────────────────┤
│           业务封装层 (apis/)              │
│   接口请求封装（登录、订单、用户等）         │
├─────────────────────────────────────────┤
│           基础工具层 (common/)            │
│   HTTP 请求、断言、日志、读配置、读数据      │
├─────────────────────────────────────────┤
│      数据/配置 (data/, config/)          │
│   YAML 用例数据、环境配置                  │
└─────────────────────────────────────────┘
```

判断自己有没有真的分层，有个很简单的检验方法：**用例文件里应不应该出现 URL 和 headers？** 不该。用例只表达"测什么"，`login_api.py` 才知道"登录要调哪个地址"。如果你发现自己每加一个用例都要复制一段 URL，那说明分层没做到位（第五章会带你完整走一遍，动手任务也是围绕这点设计的）。

### 1.3 学习前置

- 了解 HTTP 协议基础（请求方法、状态码、Header）
- 掌握 Postman 或 Fiddler 基础使用
- Python 语法基础（变量、函数、类、模块）

---

## 二、环境搭建

### 2.1 安装 Python

**Windows：**

1. 官网下载：`https://www.python.org/downloads/`（推荐 3.11+；至少使用仍在维护的版本）
2. 安装时 **务必勾选** `Add Python to PATH`
3. 验证：

```bash
python --version
pip --version
```

**Mac/Linux：**

```bash
# Mac
brew install python3

# Ubuntu
sudo apt install python3 python3-pip

# CentOS
sudo yum install python3 python3-pip
```

### 2.2 配置 pip 国内源（加速）

这一步是**为国内网络环境准备的**：默认从 pypi.org 下载依赖，几百 KB 的包经常卡到超时，报的还是 `ReadTimeoutError` 这种跟代码毫无关系的错。换成国内镜像后通常几秒装完。

```bash
# 临时使用
pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple

# 永久配置
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

常用国内源：

- 清华：`https://pypi.tuna.tsinghua.edu.cn/simple`
- 阿里：`https://mirrors.aliyun.com/pypi/simple/`
- 豆瓣：`https://pypi.douban.com/simple/`

**临时用和永久配置的区别：** `-i` 只对当前这一条命令生效（适合偶尔装一两个包）；`pip config set` 会写进 pip 的全局配置文件，之后所有 `pip install` 都走镜像（适合你的开发机）。如果公司内网有自己的私服，优先用私服——**有些公司的外网会被安全策略拦掉，那时换多少国内源都没用**。

### 2.3 安装项目依赖

创建 `requirements.txt`：

```
requests==2.31.0
pytest==7.4.3
pytest-html==4.1.1
allure-pytest==2.13.2
pyyaml==6.0.1
loguru==0.7.2
jsonpath-ng==1.6.0
faker==20.1.0
```

> 注：`jsonpath` 老库多年未更新，推荐使用 `jsonpath-ng`（功能更全、活跃维护）；如需更轻量可选 `jsonpath-python`。

安装：

```bash
pip install -r requirements.txt
```

### 2.4 安装 Allure 命令行工具

Allure 报告分两部分：Python 库 `allure-pytest`（已通过 pip 装好）+ 命令行工具（需另装）。

**Windows：**

方式 1：通过 Scoop（推荐）

```bash
scoop install allure
```

方式 2：手动安装

1. 下载：`https://github.com/allure-framework/allure2/releases`
2. 解压到本地，如 `D:\tools\allure-<版本号>`
3. 添加到系统环境变量 PATH：`D:\tools\allure-<版本号>\bin`
4. 验证：`allure --version`

**Mac：**

```bash
brew install allure
```

**Linux：**

```bash
# 下载前到 https://github.com/allure-framework/allure2/releases 确认最新稳定版
ALLURE_VERSION=2.30.0
wget -O allure.tgz https://github.com/allure-framework/allure2/releases/download/${ALLURE_VERSION}/allure-${ALLURE_VERSION}.tgz
tar -zxvf allure.tgz -C /opt/
# 添加软链接
ln -sf /opt/allure-${ALLURE_VERSION}/bin/allure /usr/local/bin/allure
allure --version
```

!!! warning "注意"
    Allure 依赖 Java 8+，需先安装 JDK。

### 2.5 安装 IDE

推荐 **PyCharm Community**（免费版足够）或 **VSCode + Python 插件**。

PyCharm 配置：

- `File` → `Settings` → `Project` → `Python Interpreter`
- 选择正确的 Python 解释器
- 安装项目依赖

---

## 三、Requests 库详解

### 3.1 发送基础请求

Requests 把 HTTP 协议压成了几个动词：`requests.get()` 对应查询，`requests.post()` 对应提交，另有 `put` / `delete` / `patch` 对应修改和删除。你不需要记协议细节，只要知道**每个动词背后发出的报文长什么样**。

```python
import requests

# GET 请求
response = requests.get("https://httpbin.org/get")
print(response.status_code)        # 状态码
print(response.text)               # 文本响应
print(response.json())             # JSON 解析  # (1)

# POST 请求
response = requests.post("https://httpbin.org/post", data={"key": "value"})
```

1. `.json()` 将响应体自动反序列化为 Python 字典，若响应非 JSON 格式会抛出 `JSONDecodeError`，调用前建议先检查 `Content-Type`

**这里最容易踩的坑：** `response.text` 和 `response.json()` 都**不会**因为接口返回 404 或 500 而报错——Requests 只在网络层出问题时抛异常，业务失败它照常返回一个 response 对象。所以拿到响应后什么都不检查就当成功，是新手脚本里最典型的假通过。另外 `httpbin.org` 是公开的练习服务，**只在学习阶段用它练手**，公司项目要换成真实或自建的测试环境。

### 3.2 GET 请求传参

GET 请求的参数（查询字符串）有两种拼法，区别不在于"能不能跑"，而在于**出了问题时谁能救你**。

```python
# 方式 1：URL 拼接（不推荐）
requests.get("https://api.example.com/users?page=1&size=10")

# 方式 2：params 参数（推荐）
params = {"page": 1, "size": 10, "keyword": "test"}
response = requests.get("https://api.example.com/users", params=params)
# 实际请求：https://api.example.com/users?page=1&size=10&keyword=test
```

手工拼 URL 有两个躲不开的麻烦：一是参数值里的**特殊字符需要自己转义**（比如中文、空格、`&`、`=`），漏了就变成参数截断或者 400 错误；二是参数一多，**你想从代码里看出"这个接口到底传了什么"就得自己做字符串解析**。用 `params=` 传字典，转义交给 Requests，日志和断言里也直接有结构化的参数可读。

### 3.3 POST 请求三种数据格式

POST 的坑几乎全在这里：**三种格式长得像，发错了服务端就收不到数据**。判断标准只有一个——看接口文档要求的 `Content-Type`。抓包时如果发现请求发出去了、服务端却返回"参数缺失"，第一个要核对的就是这里。

```python
# 1. JSON 格式（最常用）
data = {"username": "test", "password": "123456"}
response = requests.post(
    "https://api.example.com/login",
    json=data       # (1)
)

# 2. 表单格式（form-data）
data = {"username": "test", "password": "123456"}
response = requests.post(
    "https://api.example.com/login",
    data=data       # (2)
)

# 3. 上传文件（multipart/form-data）
files = {"file": open("test.jpg", "rb")}
data = {"description": "头像"}
response = requests.post(
    "https://api.example.com/upload",
    files=files,
    data=data
)
```

1. `json=` 自动将字典序列化为 JSON 字符串，并设置 `Content-Type: application/json`，适用于绝大多数 REST API
2. `data=` 将字典编码为表单格式 `key=value&key=value`，`Content-Type` 为 `application/x-www-form-urlencoded`，适用于传统表单提交

**两种格式服务端收到的内容完全不同**，这也是为什么"参数名明明一样"却报参数错误：

| 你传的 | 服务端实际收到 | Content-Type |
|--------|----------------|--------------|
| `json={"name": "张三"}` | `{"name": "张三"}` | `application/json` |
| `data={"name": "张三"}` | `name=%E5%BC%A0%E4%B8%89` | `application/x-www-form-urlencoded` |

**上传文件时有个资源泄漏的坑：** 上面示例里的 `open("test.jpg", "rb")` 没有关闭文件句柄，一个小脚本无所谓，但**在框架里反复调用会耗尽文件描述符**。规范写法是用 `with` 包住：

```python
with open("test.jpg", "rb") as f:
    response = requests.post(
        "https://api.example.com/upload",
        files={"file": f},
        data={"description": "头像"}
    )
```

另外提醒：**上传接口的断言不能只看状态码**——真正要验的是"文件确实存在、大小/格式被服务端正确识别"，这属于第 4.3 节断言设计要解决的问题。

### 3.4 请求头与认证

请求头是接口测试里"最容易被忽略、又最容易导致 401/403"的部分。同一个接口，带不带 `Authorization`、带的是谁的身份，结果可能完全不同——**接口越权类缺陷往往就藏在"换个身份还能不能访问"里**。

```python
# 自定义 Headers
headers = {
    "Authorization": "Bearer eyJhbGc...",
    "User-Agent": "TestClient/1.0",
    "X-Request-Id": "abc123"
}
response = requests.get("https://api.example.com/user", headers=headers)

# Basic Auth
from requests.auth import HTTPBasicAuth
response = requests.get(
    "https://api.example.com/secure",
    auth=HTTPBasicAuth("admin", "password")
)

# Cookie
cookies = {"sessionId": "abc123"}
response = requests.get("https://api.example.com/profile", cookies=cookies)
```

三种认证方式的适用场景不一样，别混用：

- **`headers` 手写 token**：最常用，适用于 `Bearer` 这类 Token 鉴权。缺点是要自己维护"先登录拿 token、再塞进 headers"的流程，token 一过期所有用例都会 401（第 9 章专门解决这个问题）。
- **`auth=HTTPBasicAuth(...)`**：HTTP Basic 认证，少数内网系统还在用。它其实是**把账号密码 Base64 编码后放进请求头**——Base64 不是加密，抓包直接能还原，所以只能配 HTTPS 用。
- **`cookies=`**：适合接口测试时复用浏览器里的登录态。但如果你要连续调多个接口，别每个请求都手动传 cookie，用下一节的 Session。

> 测试越权缺陷时，标准做法是：用 A 用户的 token 去访问 B 用户的数据，**断言它应该返回 403，而不是 200**。这类用例写起来就是上面 `headers` 的用法，难点在断言怎么设计。

### 3.5 响应对象处理

一个响应对象里能取的东西很多，但**做接口测试真正要关心的只有三类**：请求是否成功到达（状态码）、服务端认为业务是否成功（业务码）、数据是否正确（字段值）。下面的属性按这个顺序看就清楚了。

```python
response = requests.get("https://api.example.com/user/1")

# 状态码
response.status_code              # 200
response.ok                       # True（< 400 即 True）
response.raise_for_status()       # 状态码 >= 400 时抛异常  # (1)

# 响应内容
response.text                     # 字符串形式
response.content                  # 二进制（图片、文件）
response.json()                   # JSON 字典

# 响应头
response.headers                  # 全部
response.headers["Content-Type"]  # 指定

# Cookie
response.cookies                  # 服务器返回的 Cookie
response.cookies.get("sessionId")

# 其他
response.url                      # 实际请求 URL
response.elapsed.total_seconds()  # 响应耗时（秒）
response.encoding                 # 编码
response.encoding = "utf-8"       # 设置编码（解决中文乱码）
```

1. 比手动检查 `status_code` 更高效，配合 `try/except HTTPError` 可统一处理 4xx 和 5xx 错误

**几个容易混淆的属性，一次说清：**

| 属性 | 你会拿到什么 | 什么时候用 |
|------|--------------|------------|
| `status_code` | 数字，如 `200` | 断言协议层结果 |
| `ok` | 布尔值，`< 400` 即为 True | **慎用**：`302` 重定向也是 True，容易误判 |
| `text` | 解码后的字符串 | 接口返回 HTML 或非 JSON 时 |
| `content` | 原始字节 | 下载图片、文件，或需要精确比对字节时 |
| `json()` | Python 字典/列表 | 断言业务字段（最常用） |

**`elapsed.total_seconds()` 别拿来做性能结论。** 它只测了"从 Requests 发出到收到完整响应"这一段，不含 DNS 预解析、也不含你脚本自身的开销，而且单次请求的网络抖动极大。性能结论要用 JMeter 之类的工具压测（见 [JMeter 性能测试教程](../专项测试/JMeter性能测试教程-软件测试版.md)），这个值只适合做"这个接口是不是慢得离谱"的粗略判断。

**中文乱码的根因：** `response.encoding` 默认是按响应头里的 `Content-Type` 猜的，服务端没声明或声明错时就会猜成 ISO-8859-1，中文变成 `æµ‹è¯•`。最稳的做法是**先设编码再读 text**（`response.encoding = "utf-8"` 然后 `response.text`）；如果只是要 JSON，直接用 `response.json()` 就不受这个影响。

### 3.6 Session 会话保持

测试需要"登录后调其他接口"的场景，Session 自动保持 Cookie：

**为什么不能每次都用 `requests.get()`：** 那样每次都是一个全新连接，上一个请求拿到的 Cookie 下一个请求不认。真实业务里 90% 的接口都要求登录态，所以"登录 → 拿 token → 后续请求带上"这个流程会被你写几十遍——**Session 就是用来把它写一遍的**：登录一次，后面的请求自动带上 Cookie，同时复用底层 TCP 连接，速度也更快。

```python
session = requests.Session()

# 第一次：登录
session.post("https://api.example.com/login", json={
    "username": "test",
    "password": "123456"
})

# 后续：自动携带登录态
response = session.get("https://api.example.com/user/info")  # (1)
response = session.get("https://api.example.com/order/list")

# 关闭
session.close()

# 推荐用 with 自动关闭
with requests.Session() as s:
    s.post("https://api.example.com/login", json={"username":"test","password":"123456"})
    r = s.get("https://api.example.com/user/info")
```

1. Session 对象会自动管理 Cookie，登录后服务器返回的 Cookie 会被保存，后续请求自动携带，无需手动处理

**两个必须知道的边界：**

1. **Session 管的是 Cookie，不自动管 Token。** 如果你们接口走的是 `Authorization: Bearer xxx` 这类 Token 鉴权（很常见），Session 不会帮你塞这个请求头——需要手动 `session.headers.update({"Authorization": f"Bearer {token}"})`，或者用第 9 章的 fixture 方式统一管理。
2. **Session 是有状态的，用例之间别共用。** 所有用例共用一个 Session，意味着"上一条用例改了登录态，下一条跟着遭殃"，而且并行执行时会互相踩。正确做法是每个用例独立登录，或用 function 级 fixture——这也是第 14.1 节"用例独立性"的具体体现。

**`close()` 与 `with` 的区别：** 两者都会释放连接池，但 `close()` 是手动调用，**中间一旦抛异常就执行不到**，连接会一直挂着。`with` 在异常时同样会自动释放，所以框架里推荐用 `with`。

### 3.7 高级选项

前面几节的参数都是"接口正常时"要用的，本节这些参数是"接口不正常时"保命用的。它们的共同点是：**平时看不出差别，出事时决定你的用例是"失败"还是"挂死"**。

```python
# 超时（强烈推荐设置！）
requests.get("https://api.example.com", timeout=10)              # 总超时 10s  # (1)
requests.get("https://api.example.com", timeout=(3, 10))         # 连接 3s，读取 10s  # (2)

# 跳过 SSL 校验（自签名证书）
requests.get("https://192.168.1.100", verify=False)
# 抑制警告
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 代理（搭配 Fiddler 抓包）
proxies = {
    "http": "http://127.0.0.1:8888",
    "https": "http://127.0.0.1:8888"
}
requests.get("https://api.example.com", proxies=proxies)

# 重定向控制
requests.get("https://example.com", allow_redirects=False)

# 流式下载大文件
with requests.get("https://example.com/big.zip", stream=True) as r:
    with open("big.zip", "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
```

1. 单值超时同时限制连接和读取，接口测试建议统一设 10-30 秒，避免服务端无响应时用例永久挂起
2. 元组超时分别控制连接建立和响应读取，适用于慢接口需要更长读取时间但连接应快速失败的场景

**为什么 timeout 是这一节里最该先加的一项：** 不设超时的请求，在服务端不响应时会一直等下去（requests 默认无限等待）。本地跑你可能等几分钟就手动中断了，但**在 CI 上没人守着，整条流水线会卡到超时上限**——你看到的报错是"构建超时"，而不是"用例失败"，排查方向会被彻底带偏。宁可失败，不要挂起。

**`verify=False` 的两点提醒：** 它关掉的是证书校验，等于放弃"确认对方是不是真服务器"这一层保护，所以**只能在测试环境用**；另外标准库会打印 `InsecureRequestWarning`，每次请求一条，日志很快被刷满，用 `disable_warnings` 关掉（第 13.2 节还有更细的排查）。

**代理这块和抓包直接相关：** Fiddler / Charles 本质是本地代理，把 requests 的流量指到 `127.0.0.1:8888` 就能在抓包工具里看到自动化脚本发的请求——排查"脚本到底发了什么"比看日志直观得多。

### 3.8 异常处理

前面的代码都默认"网络是通的"。真实环境里断网、超时、服务没起来都会发生，而且**它们出问题的地方不是你的断言，是请求这一步**。不处理的话你看到的是 `ConnectionError` 的裸堆栈，分不清是"环境挂了"还是"脚本写错了"。

```python
import requests
from requests.exceptions import Timeout, ConnectionError, HTTPError, RequestException

try:
    response = requests.get("https://api.example.com", timeout=5)
    response.raise_for_status()
except Timeout:
    print("请求超时")
except ConnectionError:
    print("连接错误")
except HTTPError as e:
    print(f"HTTP 错误：{e}")
except RequestException as e:
    print(f"请求异常：{e}")
```

**关键在于顺序：** `Timeout`、`ConnectionError`、`HTTPError` 都是 `RequestException` 的子类，**必须写在它前面**。Python 的 `except` 从上往下匹配，父类写在前面会把子类分支全吃掉，你就永远只能看到笼统的"请求异常"。最后的 `RequestException` 是兜底，避免未预料的网络异常以裸堆栈形式抛进报告。

**再往前走一步：把异常转成有业务含义的失败信息。**

```python
import pytest

try:
    response = requests.get(f"{BASE_URL}/api/user/info", timeout=5)
except ConnectionError:
    pytest.fail(f"测试环境不可达：{BASE_URL}，请先确认服务状态")
```

报告里写"测试环境不可达"，和写"用例失败"，**排查成本差一个数量级**。能区分"环境问题"和"代码问题"，是用例能不能被团队信任的分水岭——否则大家看到红色第一反应就是"自动化又误报了"。

---

## 四、Pytest 测试框架

Requests 只负责"发请求"，它不知道什么是"用例"。**谁来组织用例、判断通过失败、汇总结果？** 这就是 Pytest 的职责。这一章从最小的用例开始，逐步把用例组织能力补齐。

### 4.1 安装与第一个用例

先装框架，装完立刻写一条能跑的用例——**先跑通再理解，比先读完文档再动手有效得多**：

```bash
pip install pytest
```

创建 `test_demo.py`：

```python
def add(a, b):
    return a + b

def test_add_normal():
    assert add(1, 2) == 3

def test_add_negative():
    assert add(-1, -2) == -3
```

运行：

```bash
pytest                        # 运行当前目录所有 test_*.py
pytest test_demo.py           # 运行指定文件
pytest test_demo.py::test_add_normal   # 运行指定用例
pytest -v                     # 详细输出
pytest -s                     # 显示 print 输出
pytest -k "normal"            # 关键字匹配
```

**注意这段代码里没有"测试类"也没有 `main` 函数**——你只要写个名字以 `test_` 开头的函数，`pytest` 就能找到它。这是 Pytest 和 unittest 最大的体验差异：**断言直接用 Python 原生的 `assert`**，不用记 `assertEqual` / `assertTrue` 这一堆方法名，写起来几乎就是普通 Python 代码。

**`-v` 和 `-s` 是日常用得最多的两个参数：** `-v` 让输出显示每条用例的名字（不然只看到一行行 `.`，根本不知道跑到哪了）；`-s` 让 `print` 能正常输出（默认 Pytest 会捕获它）。第 4.8 节还有一份完整参数表。

### 4.2 命名规范

Pytest 自动发现规则：

| 类型 | 规范 |
|------|------|
| 文件名 | `test_*.py` 或 `*_test.py` |
| 类名 | `Test*` 开头，不能有 `__init__` |
| 函数名 | `test_*` 开头 |

```python
# 函数式
def test_login_success():
    pass

# 类式
class TestLogin:
    def test_login_success(self):
        pass

    def test_login_fail(self):
        pass
```

**命名不是风格问题，是"用例能不能被发现"的开关。** 常见的坑是文件叫 `login_test.py`（不在默认规则里）或者函数名写成 `check_login()`——这两种情况 Pytest 都不会报错，**它只是安静地一条都不跑**，你会以为"测试通过了"。第 4.8 节的 `--collect-only` 可以专门用来确认到底收集到了几条用例。

### 4.3 断言（Assert）

Pytest 直接使用 Python 原生 `assert`。语法上不用学新东西，**但在接口自动化里，"断言写什么"远比"断言怎么写"重要**——只断言状态码 200 的用例，能发现的缺陷非常有限（服务端完全可能返回 200 加一个错误提示）。

```python
def test_examples():
    # 数值
    assert 1 + 1 == 2
    assert 10 > 5
    
    # 字符串
    assert "hello" in "hello world"
    assert "test".startswith("te")
    
    # 列表 / 字典
    assert [1, 2, 3] == [1, 2, 3]
    assert {"name": "test"}.get("name") == "test"
    
    # 类型
    assert isinstance(123, int)
    
    # 接口响应
    response = {"code": 0, "msg": "ok"}
    assert response["code"] == 0
    assert response["msg"] == "ok"
    
    # 自定义错误消息（断言失败时显示）
    assert response["code"] == 0, f"期望 code=0，实际={response['code']}"
```

### 4.4 Fixture（前置/后置）

Fixture 替代了传统的 setUp / tearDown，更灵活。`yield` 之前的代码是前置（setup），`yield` 的值传给测试用例，`yield` 之后的代码是后置（teardown）。

```python
import pytest

@pytest.fixture
def login_token():
    """登录获取 token"""
    print("\n→ 执行登录")
    token = "eyJhbGc..."     # 实际为登录接口返回
    yield token              # 把 token 给用例，用例执行完后继续往下  # (1)
    print("\n→ 清理工作（用例执行后）")           # (2)

def test_get_user_info(login_token):
    print(f"使用 token：{login_token[:8]}...")
    assert login_token is not None

def test_get_order_list(login_token):
    print(f"使用 token：{login_token[:8]}...")
    assert login_token.startswith("ey")
```

1. `yield` 之前的代码在用例执行前运行（setup），`yield` 的值作为参数注入用例函数
2. `yield` 之后的代码在用例执行后运行（teardown），无论用例成功或失败都会执行，适合做资源清理

真实项目不要在本地日志、Allure 附件或 CI 日志中输出完整 Token。需要排查时只输出前几位，或输出“Token 已获取”。

**Fixture 作用域：**

```python
@pytest.fixture(scope="function")   # 每个用例都执行（默认）
@pytest.fixture(scope="class")      # 每个类执行一次
@pytest.fixture(scope="module")     # 每个文件执行一次
@pytest.fixture(scope="session")    # 整个测试会话执行一次（最常用于登录、连数据库）
```

### 4.5 conftest.py（共享 Fixture）

`conftest.py` 是 pytest 的特殊文件，其中定义的 Fixture **不需要 import 即可被同目录及子目录的用例使用**。

`conftest.py`:

```python
import pytest
import requests

@pytest.fixture(scope="session")
def base_url():
    return "https://api-test.example.com"

@pytest.fixture(scope="session")
def login_session(base_url):
    """整个测试会话共享一个登录态"""
    session = requests.Session()
    session.post(f"{base_url}/api/login", json={
        "username": "testuser",
        "password": "123456"
    })
    yield session     # (1)
    session.close()   # (2)
```

1. `scope="session"` 让登录只执行一次，所有用例共享同一个 Session 对象和 Cookie，大幅减少重复登录开销
2. `yield` 后关闭 Session 释放连接资源，确保测试结束后不会残留未关闭的 HTTP 连接

任意用例文件直接使用：

```python
def test_user_info(login_session, base_url):
    response = login_session.get(f"{base_url}/api/user/info")
    assert response.status_code == 200
```

### 4.6 参数化（Parametrize）

一个用例 + 多组数据：

**为什么一定要用参数化，而不是在用例里写 `for` 循环：** 循环跑的时候，第一组数据失败就会中断后面的（除非你手动 try）；而且报告里只看到"一条用例失败"，**分不清是哪组数据挂的**。参数化会把每组数据展开成独立用例，某组失败不影响其他组，Allure 报告里也能精确到具体哪组。

```python
import pytest

@pytest.mark.parametrize("a, b, expected", [   # (1)
    (1, 2, 3),
    (5, 5, 10),
    (-1, 1, 0),
    (0, 0, 0),
])
def test_add(a, b, expected):
    assert a + b == expected
```

1. 每组数据自动生成一个独立用例，失败时可精确定位是哪组数据出了问题，比循环测试更易于排查

执行后会产生 4 个独立用例。

**带 id 的参数化（报告更清晰）：**

```python
@pytest.mark.parametrize("username, password, expected_code", [
    ("testuser", "123456", 0),
    ("nouser", "123456", 1002),
    ("testuser", "wrong", 1001),
    ("", "123456", 1003),
], ids=["正常登录", "账号不存在", "密码错误", "账号为空"])
def test_login(username, password, expected_code):
    # ...
    pass
```

`ids` 参数把每组数据换成人能看懂的名字。不加的话，报告里显示的是 `test_login[testuser-123456-0]` 这种拼接出来的字符串——**一旦参数里有密码或长文本，报告会又长又难认，还可能泄漏敏感信息**，所以业务用例基本都该补上。

### 4.7 Mark 标记

按需运行部分用例：

```python
import pytest

@pytest.mark.smoke
def test_login():
    pass

@pytest.mark.regression
def test_order_flow():
    pass

@pytest.mark.skip(reason="接口未上线")
def test_new_feature():
    pass

@pytest.mark.skipif(condition=True, reason="生产环境跳过")
def test_data_clean():
    pass

@pytest.mark.xfail(reason="已知 Bug")
def test_known_bug():
    assert False
```

执行：

```bash
pytest -m smoke                 # 只跑标记 smoke 的
pytest -m "smoke or regression" # 组合
pytest -m "not regression"      # 排除
```

**注册标记（避免警告）** —— `pytest.ini`:

```ini
[pytest]
markers =
    smoke: 冒烟测试
    regression: 回归测试
    p0: 最高优先级
    p1: 一般优先级
```

### 4.8 常用命令行参数

这些参数**不用全记**，实际工作里高频的就那四五个：本地调试用 `-v -s`，跑挂了用 `--lf` 重跑失败的，提交前用 `-m smoke` 跑冒烟。

```bash
pytest -v                       # 详细输出
pytest -s                       # 显示 print
pytest -q                       # 简洁输出
pytest -x                       # 遇到第一个失败立即停止
pytest --maxfail=3              # 失败 3 个就停
pytest --lf                     # 只跑上次失败的
pytest --ff                     # 上次失败的先跑
pytest -n 4                     # 并发 4 进程（需装 pytest-xdist）
pytest --collect-only           # 仅收集不执行
pytest --html=report.html       # 生成 HTML 报告（需装 pytest-html）
```

**几个容易被忽略但很有用的：**

- `--collect-only`：**不执行，只列出收集到哪些用例**。用例写完了却"一条都没跑"，用它一秒就能确认是命名问题还是路径问题。
- `--lf`：只重跑上次失败的用例。**改完 bug 想验证修没修好，最省时的方式**，不用把整套跑一遍。
- `-x`：出现第一个失败就停。适合在本地快速试错；**不适合 CI**——CI 上你希望一次看到所有失败，好判断影响范围。
- `--tb=short`：把失败堆栈压缩成几行。**输出太长把关键信息淹了是常见痛点**，CI 日志里尤其明显。

> 这些参数最终通常会写进 `pytest.ini` 的 `addopts`（见第 11.2 节），这样团队所有人不用每次手敲。

---

## 五、项目分层设计

到这里，单个用例你已经会写了。但真实项目不是 3 条用例，而是**几百条**——这一章要解决的是"用例变多之后还改得动吗"。

先说清楚不封装会怎样：如果每个用例都自己拼 URL、自己建 headers、自己写断言，那么接口一改字段你要改 200 个文件；换个测试环境你要全局搜替换 URL（漏一个就是一个诡异的失败）；断言标准也不统一，有人断言状态码有人断言业务码。**分层的唯一目的，就是让这些改动只需要改一个地方。**

### 5.1 推荐项目结构

**先说清楚：这是一份"跑起来之后长这样"的参考结构，不是第一天就要建好的模板。** 照着建目录在三条用例的时候只会增加负担（本节末尾会讲什么时候该抽层）。

```text
api-test/
├── config/                     # 配置文件
│   ├── config.yaml            # 环境配置
│   └── settings.py            # 全局常量
├── common/                     # 公共工具
│   ├── __init__.py
│   ├── request_util.py        # HTTP 请求封装
│   ├── yaml_util.py           # YAML 读取
│   ├── logger.py              # 日志封装
│   └── assertion.py           # 断言封装
├── apis/                       # 接口封装层
│   ├── __init__.py
│   ├── login_api.py
│   ├── user_api.py
│   └── order_api.py
├── data/                       # 测试数据
│   ├── login_data.yaml
│   └── order_data.yaml
├── testcases/                  # 测试用例
│   ├── __init__.py
│   ├── test_login.py
│   ├── test_user.py
│   └── test_order.py
├── logs/                       # 日志输出
├── reports/                    # 报告输出
│   ├── allure-results/        # 原始结果
│   └── allure-report/         # 生成的 HTML 报告
├── conftest.py                 # 全局 fixture
├── pytest.ini                  # pytest 配置
├── requirements.txt            # 依赖列表
├── run.py                      # 入口启动脚本
└── README.md
```

**怎么读这个结构：** 从上往下看，`testcases/` 是"测什么"，`apis/` 是"怎么调接口"，`common/` 是"怎么发 HTTP"，`config/` 和 `data/` 是"参数和数据"。**每一层只能依赖它下面那层**（用例调 api，api 调 common，common 读 config），不能反过来。这条单向依赖是分层能成立的前提——如果 `common/request_util.py` 反过来去 import 某个具体接口，那它就不"通用"了。

**给新人的落地建议：** 不要一开始就把这些目录全建出来。三条用例的项目建七个目录，只会让人觉得"这框架好复杂"然后不敢动。**先写平铺的用例，等到你第二次复制粘贴同一段 URL 时，再把那部分抽出来。** 分层的时机是"痛了才分"，不是"先分好再写"。

### 5.2 HTTP 请求封装（common/request_util.py）

这一层的目标是把"发 HTTP 请求"这件事变成**一次调用 + 一份完整日志**。注意看它做了三件事：默认超时、统一日志、异常转抛。

```python
import requests
from loguru import logger

class RequestUtil:
    """HTTP 请求统一封装"""
    
    def __init__(self):
        self.session = requests.Session()
        self.timeout = 30
    
    def send_request(self, method, url, **kwargs):
        """统一发送请求入口（**kwargs 允许传入任意额外参数）"""
        kwargs.setdefault("timeout", self.timeout)   # 如果没传 timeout 就用默认 30 秒
        kwargs.setdefault("verify", False)            # 跳过 SSL 证书校验（仅测试环境用）
        
        # 打印请求日志
        logger.info(f"请求方法：{method}")
        logger.info(f"请求 URL：{url}")
        logger.info(f"请求参数：{kwargs}")
        
        try:
            response = self.session.request(method, url, **kwargs)
            logger.info(f"响应状态：{response.status_code}")
            logger.info(f"响应内容：{response.text[:500]}")
            return response
        except Exception as e:
            logger.error(f"请求异常：{e}")
            raise
    
    def get(self, url, **kwargs):
        return self.send_request("GET", url, **kwargs)
    
    def post(self, url, **kwargs):
        return self.send_request("POST", url, **kwargs)
    
    def put(self, url, **kwargs):
        return self.send_request("PUT", url, **kwargs)
    
    def delete(self, url, **kwargs):
        return self.send_request("DELETE", url, **kwargs)

# 全局实例
http = RequestUtil()
```

**为什么要有"全局实例"这两个字：** `RequestUtil` 内部持有的是一个 `requests.Session`，全局只建一次才能真正复用连接和登录态（见第 3.6 节）。如果每个用例都 `RequestUtil()`，那等于每条用例都重新建了 Session，Cookie 全部丢失。

**两个设计细节值得注意：**

- `kwargs.setdefault(...)` 而不是直接赋值——**允许调用方覆盖默认值**。绝大多数请求用 30 秒超时，但某个已知的慢接口可以自己传 `timeout=60`，不会因为封装而被卡死。
- `except Exception` 里 `logger.error` 之后**必须 `raise`**。只记日志不抛出，等于把失败悄悄吞掉，用例会继续往下跑并"通过"——这是自动化里最危险的一类假绿。

> 这里写死了 `verify=False`，方便内网自签名证书的测试环境，但**这属于"为方便牺牲一点安全性"的取舍**，正规做法是只对特定域名跳过校验，或把 CA 证书装到机器上。

### 5.3 接口封装（apis/login_api.py）

这一层把"发 HTTP"变成"调业务动作"。对比一下：`http.post(f"{BASE_URL}/api/login", json={...})` 和 `LoginApi.login("testuser", "123456")`——**后者用例作者不需要知道登录接口地址是什么、用的是 json 还是 data**。接口改了，只改这里一行。

**注意这一层只负责"发请求"，不做任何断言。** "登录成功了没有"是用例该判断的事。把 `assert` 写进 `LoginApi` 看起来省事，实际会让这一层只能服务于"期望成功"的用例——**而登录失败的用例恰恰是最需要测的**（密码错误、账号不存在）。分层里最常犯的错误就是把断言写错层。

```python
from common.request_util import http
from config.settings import BASE_URL

class LoginApi:
    """登录相关接口"""
    
    @staticmethod
    def login(username, password):
        """用户登录"""
        url = f"{BASE_URL}/api/login"
        data = {"username": username, "password": password}
        return http.post(url, json=data)
    
    @staticmethod
    def logout(token):
        """退出登录"""
        url = f"{BASE_URL}/api/logout"
        headers = {"Authorization": f"Bearer {token}"}
        return http.post(url, headers=headers)
    
    @staticmethod
    def get_captcha():
        """获取验证码"""
        url = f"{BASE_URL}/api/captcha"
        return http.get(url)
```

### 5.4 测试用例（testcases/test_login.py）

到这一层，**用例里已经看不到 URL、看不到 headers、看不到 json 还是 data**，只剩下"我调了登录、我期望什么结果"。这就是分层的最终收益——**读用例的人不需要懂 HTTP 细节，只需要懂业务**。

```python
from apis.login_api import LoginApi

class TestLogin:
    """登录接口测试"""
    
    def test_login_success(self):
        """正常登录"""
        response = LoginApi.login("testuser", "123456")
        assert response.status_code == 200            # (1)
        result = response.json()
        assert result["code"] == 0                    # (2)
        assert "token" in result["data"]              # (3)

    def test_login_wrong_password(self):
        """密码错误"""
        response = LoginApi.login("testuser", "wrong")
        result = response.json()
        assert result["code"] == 1001                 # (4)
        assert "密码" in result["msg"]                # (5)
```

1. HTTP 状态码 200 只表示请求到达了服务器，不代表业务逻辑正确
2. 业务状态码 `code == 0` 表示登录成功，这是接口约定的业务含义
3. 验证返回数据中包含 token，后续接口依赖此 token 做鉴权
4. 密码错误时业务码应为 1001，与接口文档约定一致
5. 验证错误消息包含"密码"关键词，确认用户看到的提示是准确的

### 5.5 分层的好处

- **可维护性高**：接口变了只改 `apis/`，用例不动
- **复用性强**：同一个接口在多个用例中调用
- **职责清晰**：用例只关注业务逻辑和断言
- **新人友好**：分工明确，按模块开发

---

## 六、配置文件与环境管理

分层解决的是"代码怎么组织"，这一章解决的是"**参数往哪放**"。核心原则一句话：**环境相关的信息（地址、账号、超时）一律不写进代码**。原因是这类信息变得最频繁——测试环境换 IP、预发环境要单独跑一遍回归、生产环境绝对禁止跑自动化，**这些都不应该需要改代码**（改了代码就得走一次提交、评审、发布，而改配置只是改个文件或加个环境变量）。

### 6.1 YAML 配置文件（config/config.yaml）

用一份文件同时装下多个环境的配置，靠最上面的 `env` 字段决定用哪套：

```yaml
# 当前环境
env: test

# 测试环境配置
test:
  base_url: https://api-test.example.com
  db_host: 192.168.1.100
  db_port: 3306
  db_user: test_user
  db_pwd: test_pwd
  timeout: 30

# 开发环境配置
dev:
  base_url: https://api-dev.example.com
  db_host: 192.168.1.101
  db_port: 3306
  db_user: dev_user
  db_pwd: dev_pwd
  timeout: 30

# 生产环境配置（一般禁止跑自动化）
prod:
  base_url: https://api.example.com
  timeout: 30

# 默认测试账号
account:
  username: testuser
  password: "123456"
```

**为什么用 YAML 而不是 JSON 或 `.py`：** YAML 支持注释（JSON 不行），也不需要引号包裹每一层（JSON 要）。**最实用的差别是"运维/测试同事不写代码也能改"** ——把 `config/config.yaml` 给同事，他能自己把 `base_url` 换成另一套环境；如果配置写在一个 `.py` 文件里，很多人不敢碰。

**但有个安全红线必须说清楚：这份文件里不该出现生产环境的真实账号密码。** 上面的示例用了 `test_user` / `123456` 这种占位值是可以的，真实项目的敏感凭据要走环境变量或密钥管理（第 6.4 节和第 14 章会讲），并且 `config.yaml` 里如果放了真实凭据，**它必须进 `.gitignore`，否则会永久留在 Git 历史里**。

### 6.2 YAML 读取工具（common/yaml_util.py）

**为什么要单独写这么个小工具：** 因为读 YAML 这件事会在项目里出现几十次（读配置、读用例数据、读环境信息）。**每次都要记得写 `encoding="utf-8"`、记得用 `safe_load`，迟早会漏**——抽成一个函数，漏的可能性就只剩一处。

```python
import yaml
from pathlib import Path

def read_yaml(file_path):
    """读取 YAML 文件"""
    with open(file_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def write_yaml(file_path, data):
    """写入 YAML 文件"""
    with open(file_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True)
```

这几个参数**都不是可有可无的**：

- `encoding="utf-8"`：不写的话 Windows 上会按系统默认编码（GBK）读，测试数据里只要有中文就报 `UnicodeDecodeError`（第 13.3 节专门讲这个）。
- `yaml.safe_load` 而不是 `yaml.load`：`yaml.load` 能执行 YAML 里的 Python 对象标签，**等于允许数据文件执行任意代码**——配置文件来自他人或 CI 时这是真实风险。`safe_load` 只解析基础类型，够用且安全。
- `allow_unicode=True`：不加的话写出来的中文会被转义成 `\u6D4B\u8BD5`，文件可读性全无。

### 6.3 全局配置（config/settings.py）

这一层的作用是**把 YAML 里的字典变成代码里能直接 import 的常量**，同时把"哪些环境用哪套配置"这个判断固定下来。用例只需要 `from config.settings import BASE_URL`，不用关心配置文件长什么样。

```python
from pathlib import Path
from common.yaml_util import read_yaml

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent

# 路径常量
CONFIG_DIR = ROOT_DIR / "config"
DATA_DIR = ROOT_DIR / "data"
LOG_DIR = ROOT_DIR / "logs"
REPORT_DIR = ROOT_DIR / "reports"

# 读取配置
_config = read_yaml(CONFIG_DIR / "config.yaml")
_env = _config["env"]
_env_config = _config[_env]

# 暴露配置
BASE_URL = _env_config["base_url"]
TIMEOUT = _env_config["timeout"]
ACCOUNT = _config["account"]
```

### 6.4 通过环境变量切换

配置文件里写死 `env: test` 有个实际问题：**同一份代码要跑多套环境怎么办？** CI 上跑测试环境，预发发布前跑预发环境，总不能每次改文件再提交。所以加一层环境变量覆盖——**优先级是"环境变量 > 配置文件"**，不改代码就能切换。

修改 `settings.py`：

```python
import os
_env = os.getenv("TEST_ENV", _config["env"])    # 优先读环境变量
```

执行时：

```bash
# Linux/Mac
TEST_ENV=dev pytest

# Windows CMD
set TEST_ENV=dev && pytest

# Windows PowerShell
$env:TEST_ENV="dev"; pytest
```

**为什么"3 行命令写了 3 个平台"** —— 这一节不是凑字数：**设置环境变量的语法各平台完全不同，而且错了不会报错**（变量没设上，代码就悄悄用了配置文件里的默认值）。如果团队里有人用 Windows 有人用 Mac，命令写错的人会一直以为"我在跑 dev 环境"，实际跑的是 test 环境，结果查半天数据对不上。CI（Linux）里则通常写成 `env:` 配置项，不用手敲命令。

**再强调一次红线：生产环境配置里不该有可用的凭据。** 上面的 `prod` 段只有 `base_url` 和 `timeout`，没有账号——这是刻意的，**生产环境就该跑不起来自动化**，真需要线上验证时用专门的只读账号和单独的开关。

---

## 七、数据驱动测试

### 7.1 为什么要数据驱动

同一个接口需要测试多种场景（正常、异常、边界），如果每个场景写一个用例，会出现大量重复代码。数据驱动让 **一套代码 + 多组数据** 自动产生多条用例。

### 7.2 YAML 数据文件（data/login_data.yaml）

数据文件的结构是"一个用例一条记录"，每条记录里既有**输入**（用户名、密码）也有**预期**（期望的业务码和提示语）。这个结构很关键：**预期值和输入值放在一起，一个用例文件就能完整描述一个场景，新增场景不需要改代码。**

```yaml
- case_id: login_001
  case_name: 正常登录
  username: testuser
  password: "123456"
  expected:
    code: 0
    msg: 成功

- case_id: login_002
  case_name: 账号不存在
  username: nouser
  password: "123456"
  expected:
    code: 1002
    msg: 账号不存在

- case_id: login_003
  case_name: 密码错误
  username: testuser
  password: wrong
  expected:
    code: 1001
    msg: 密码错误

- case_id: login_004
  case_name: 账号为空
  username: ""
  password: "123456"
  expected:
    code: 1003
    msg: 账号不能为空

- case_id: login_005
  case_name: SQL 注入测试
  username: "admin' OR '1'='1"
  password: "any"
  expected:
    code: 1001
    msg: 密码错误
```

### 7.3 数据驱动用例

代码部分短得有点不像话——**这正是数据驱动的意义：用例逻辑只写一遍，场景全部下沉到 YAML**。以后产品说"再加一个密码为空的场景"，你只需要往 YAML 里加 5 行，不动一行代码。

```python
import pytest
from apis.login_api import LoginApi
from common.yaml_util import read_yaml
from config.settings import DATA_DIR

# 读取测试数据
login_data = read_yaml(DATA_DIR / "login_data.yaml")

class TestLogin:
    
    @pytest.mark.parametrize(
        "case",
        login_data,
        ids=[c["case_name"] for c in login_data]
    )
    def test_login(self, case):
        # 发送请求
        response = LoginApi.login(case["username"], case["password"])
        result = response.json()
        
        # 断言
        assert result["code"] == case["expected"]["code"], \
            f"用例 {case['case_id']} 失败：期望 code={case['expected']['code']}, 实际={result['code']}"
        assert case["expected"]["msg"] in result["msg"]
```

执行后会产生 5 个独立用例，报告中可清晰看到每个场景的结果。

**这段代码里最值得学的是那句自定义失败信息。** 数据驱动有个副作用：**用例都叫 `test_login`，挂了之后你不知道是哪组数据挂的**。把 `case_id` 和实际值拼进断言消息，报告里直接能看到"期望 1003，实际 0"——**省掉的是打开 YAML 逐条对照的时间**。这不是锦上添花，数据驱动用例量一上来，这是必备的。

**`ids=` 那一行也别省**，否则报告里显示的是 `test_login[case0]` 这类无意义的名字。用 `case_name` 做 id，Allure 里看到的就是"密码错误"这种人话。

### 7.4 复杂数据驱动（含请求体、断言）

上面那种"固定字段"的数据结构适合登录这种参数少的接口。订单、支付这类接口**字段多、每个用例要传的字段还不一样**，就得换一种更通用的写法：**把 HTTP 方法、路径、请求体、断言全部写进数据里**，代码只负责按数据执行。

```yaml
- case_id: order_001
  case_name: 创建订单-正常
  method: POST
  url: /api/order/create
  headers:
    Content-Type: application/json
  data:
    productId: 1001
    quantity: 2
    address: "北京市朝阳区"
  assertions:
    - jsonpath: $.code
      expected: 0
    - jsonpath: $.data.orderId
      type: number
    - jsonpath: $.data.totalAmount
      expected: 200
```

通用驱动函数：

> ⚠️ **先看这里再抄代码：** 下面用的是**老库 `jsonpath`**（`pip install jsonpath`）。而第 2.3 节的 `requirements.txt` 里装的是 **`jsonpath-ng`**，两者的包名和 API 都不一样（一个 `from jsonpath import jsonpath`，一个 `from jsonpath_ng import parse`），**装了一个却 import 另一个会直接报 `ModuleNotFoundError`**。本教程第 7.4 节末尾给了 `jsonpath-ng` 的等价写法，建议统一用 `jsonpath-ng`。

```python
from jsonpath import jsonpath

def run_case(case):
    # 构造完整 URL
    url = BASE_URL + case["url"]
    # 发送请求
    response = http.send_request(
        method=case["method"],
        url=url,
        headers=case.get("headers"),
        json=case.get("data")
    )
    result = response.json()
    
    # 遍历断言
    for assertion in case.get("assertions", []):
        actual = jsonpath(result, assertion["jsonpath"])[0]
        if "expected" in assertion:
            assert actual == assertion["expected"]
        if assertion.get("type") == "number":
            assert isinstance(actual, (int, float))
```

**这段"通用驱动"是把双刃剑，用之前想清楚：**

- **好处**：新接口、新场景完全不用碰代码，数据文件交给测试同事就能加用例。
- **代价**：**用例变成"数据"之后，调试难度陡增**。断言失败时堆栈只指向 `run_case` 这一行，你得先反推是哪条数据、哪个 jsonpath 出的问题；IDE 也没法跳转、没法重构。**这就是为什么很多团队最终放弃纯 YAML 驱动，回到"接口封装 + 代码用例"（第五章那种）**——灵活性用代码换更划算。

**比较务实的组合：** 常规参数校验类用例用 YAML 驱动（量大、模式统一），涉及多接口串接、复杂前置的流程用例写成代码（逻辑复杂，YAML 表达不了）。两种方式在同一个项目里共存，各用在合适的地方。

**两个代码细节：**

- `jsonpath(...)` 返回的是**列表**，取值要 `[0]`；但**取值失败时它返回的是 `False`（布尔值）而不是空列表**，所以 `[0]` 会抛 `TypeError: 'bool' object is not subscriptable`——这个报错和"字段不存在"看起来毫无关系，很容易卡住。**严谨写法是先判断再取值**，或者换成 `jsonpath-ng`（前面依赖清单里推荐的就是它）：它取不到时返回空列表 `[]`，`[0]` 会抛更直观的 `IndexError`，但**同样必须先判空**：

```python
from jsonpath_ng import parse

matched = parse(assertion["jsonpath"]).find(result)
assert matched, f"断言失败：字段 {assertion['jsonpath']} 不存在"
actual = matched[0].value
```

- `assert isinstance(actual, (int, float))` 用布尔值 `True` 也能通过（`True` 是 `int` 的子类），**真要校验数字类型得排除 bool**（`isinstance(x, (int, float)) and not isinstance(x, bool)`），这是很容易漏的一个边界。

---

## 八、Allure 报告集成

前面七章你已经能跑出一堆通过或失败的用例了，但**`pytest` 默认的输出只适合你自己看**——它给不出趋势、不能按模块筛、失败详情和请求响应散在日志里。Allure 解决的是"**把结果变成能在团队里流转的东西**"：测试同事看得了、开发能点进去看请求响应、Leader 能看通过率趋势。

> 先明确一件事：**报告好看不等于测试有效。** Allure 的价值在于"降低别人看结果的成本"，如果用例本身断言写得松（只断言 200），报告再漂亮也发现不了缺陷。

### 8.1 安装与基础使用

注意这里装的是 **Python 库**（`allure-pytest`），它只负责生成结果数据。**生成 HTML 报告还需要单独安装命令行工具**（见第 2.4 节），两者缺一不可——这是新手最常见的一个卡点，只装 pip 包会报"allure 不是内部或外部命令"。

```bash
pip install allure-pytest
```

执行测试并生成结果：

```bash
# 运行测试，结果保存到 allure-results
pytest --alluredir=./reports/allure-results

# 生成 HTML 报告并自动打开
allure serve ./reports/allure-results

# 生成静态 HTML 报告
allure generate ./reports/allure-results -o ./reports/allure-report --clean
# 打开
allure open ./reports/allure-report
```

**`serve` 和 `generate` 的区别要用对：**

| 命令 | 干什么 | 什么时候用 |
|------|--------|------------|
| `allure serve` | 起一个本地 HTTP 服务，临时的 | 本地调试，改完马上看 |
| `allure generate` | 生成静态 HTML 目录，可归档 | **CI 用这个**，产物能上传成构建附件 |
| `allure open` | 打开已生成的报告 | 看历史报告 |

**为什么不能双击 HTML 直接打开：** 报告页面是用 JS 去读同目录的数据文件的，用 `file://` 协议打开会被浏览器的跨域策略拦住，页面能开但**所有数据都是空的**。必须用 `allure open` 起本地服务（第 13.4 节也是这个问题）。

### 8.2 Allure 装饰器

装饰器决定**用例在报告里长什么样**。这排装饰器里，`epic` / `feature` / `story` 三层是最该理解的——它们把报告左侧导航变成"项目 → 模块 → 功能"的树。**用例一多，能不能快速筛选"用户模块挂了几个"，直接影响这份报告有没有人看。**

```python
import allure
import pytest

@allure.epic("电商系统")                       # (1) 项目级，报告侧边栏第一层
@allure.feature("用户模块")                    # (2) 模块级，报告侧边栏第二层
@allure.story("登录功能")                      # (3) 功能级，报告侧边栏第三层
class TestLogin:

    @allure.title("正常账号密码登录成功")        # (4)
    @allure.description("使用正确的账号密码登录，预期返回 token")
    @allure.severity(allure.severity_level.CRITICAL)  # (5)
    @allure.tag("smoke", "P0")
    @allure.link("https://jira.example.com/TEST-100", name="需求链接")
    @allure.issue("BUG-200", name="关联缺陷")
    @allure.testcase("TC-300", name="测试用例")
    def test_login_success(self):
        ...
```

1. `epic` 是最高层级分类，通常对应整个项目或系统，在报告左侧导航中作为一级分组
2. `feature` 对应功能模块，报告中按模块聚合用例，便于按模块查看通过率
3. `story` 对应具体场景，三层结构（epic > feature > story）让报告层级清晰
4. `title` 设置用例在报告中显示的标题，不设置则默认用函数名
5. `severity` 标记用例优先级，报告中可按严重级别筛选和统计

**严重级别（severity）：**

| 级别 | 含义 |
|------|------|
| `BLOCKER` | 阻塞 |
| `CRITICAL` | 严重 |
| `NORMAL` | 一般 |
| `MINOR` | 次要 |
| `TRIVIAL` | 轻微 |

`severity` 不是随便标的：**它决定报告里"按严重级别筛选"时哪些失败最该先看**。标错的实际后果是——一个登录都走不通的用例被标成 `MINOR`，团队按严重级别排序时它会沉到底部。规矩可以自己定，**但要在团队内一致**，通常做法是对齐原有用例的优先级（P0 用 `BLOCKER`/`CRITICAL`）。

**`link` / `issue` / `testcase` 这三个是"报告 → 缺陷跟踪系统"的桥。** 配上 Jira 地址模板后，报告里的失败用例能直接点进对应的需求或缺陷单——**排查时不用再回头翻聊天记录找单号**，这是把自动化接进研发流程的关键一步。

### 8.3 步骤（Step）

单接口用例不需要步骤，但**流程性用例（下单、支付）一定要加**。原因很简单：一条 5 步的下单流程挂了，没有步骤的话报告只会告诉你"这个用例失败"，**你得自己去翻是登录挂了还是创建订单挂了**；有了步骤，报告里直接标红出问题的那一步。

```python
import allure
from apis.login_api import LoginApi

class TestOrder:
    
    @allure.title("完整下单流程")
    def test_order_flow(self):
        with allure.step("1. 用户登录"):                # (1)
            response = LoginApi.login("testuser", "123456")
            assert response.json()["code"] == 0
            token = response.json()["data"]["token"]
        
        with allure.step("2. 查询商品列表"):
            ...
        
        with allure.step("3. 加入购物车"):
            ...
        
        with allure.step("4. 创建订单"):
            ...
        
        with allure.step("5. 校验订单状态"):
            ...
```

1. `with allure.step()` 将代码块标记为报告中的一个步骤，失败时能精确定位到哪一步出问题，而不是只看到整个用例失败

### 8.4 用装饰器封装步骤

`with allure.step()` 的问题是要缩进一整块代码，**在 `apis/` 层复用不了**。`@allure.step` 装饰器能把"步骤"直接贴在函数上，**封装层的方法自动变成报告里的步骤**——这样 `LoginApi.login()` 只要加个装饰器，所有调用它的用例报告里都会出现"登录账号：xxx"这一步，不用每个用例都手写 `with`。

```python
@allure.step("登录账号：{username}")
def do_login(username, password):
    return LoginApi.login(username, password)

class TestLogin:
    def test_login(self):
        response = do_login("testuser", "123456")
        assert response.status_code == 200
```

**花括号里的参数名会被替换成实际值**（报告里显示"登录账号：testuser"）。**但这里有个安全提醒：不要往这个位置放密码、Token 这类敏感值**——报告是会被分享和归档的，运行记录一旦生成，敏感信息就留在那了。

### 8.5 添加附件

附件是 Allure 最实用的功能：**把请求和响应原样存进报告**。它解决的是一个很现实的沟通问题——用例失败了，开发问"你发的什么参数、返回什么"，你截图给他，他说"换个环境再试一次"。有了附件，**他直接点开报告就能看到完整报文**，不用来回问。

报告中可附加请求/响应详情、截图、日志：

```python
import allure

# 文本附件
allure.attach(
    body="这是请求详情",
    name="请求信息",
    attachment_type=allure.attachment_type.TEXT
)

# JSON 附件
import json
allure.attach(
    body=json.dumps(response.json(), ensure_ascii=False, indent=2),
    name="响应数据",
    attachment_type=allure.attachment_type.JSON
)

# HTML 附件
allure.attach(
    body="<h1>结果</h1>",
    name="HTML 展示",
    attachment_type=allure.attachment_type.HTML
)

# 图片附件（如截图）
with open("screenshot.png", "rb") as f:
    allure.attach(
        f.read(),
        name="界面截图",
        attachment_type=allure.attachment_type.PNG
    )
```

### 8.6 在请求封装中自动记录

上面是手动 `allure.attach`。**手动记录的问题是"靠自觉"——今天记得加，明天赶进度就忘了**，而忘掉的那一条往往恰好就是出问题的那条。更可靠的做法是**在请求封装里统一记录**（在第 5.2 节那个 `RequestUtil` 上加几行），这样所有用例、所有请求都会自动带上请求和响应详情，一条都漏不掉。

修改 `request_util.py`，发送请求时自动写入 Allure：

```python
import allure
import json
import requests
from loguru import logger

class RequestUtil:
    def __init__(self):
        self.session = requests.Session()
    
    def send_request(self, method, url, **kwargs):
        kwargs.setdefault("timeout", 30)
        kwargs.setdefault("verify", False)
        
        # 记录到 Allure
        with allure.step(f"发送请求：{method} {url}"):
            # 请求信息
            req_info = {
                "method": method,
                "url": url,
                "headers": kwargs.get("headers"),
                "params": kwargs.get("params"),
                "json": kwargs.get("json"),
                "data": kwargs.get("data"),
            }
            allure.attach(
                json.dumps(req_info, ensure_ascii=False, indent=2),
                name="请求数据",
                attachment_type=allure.attachment_type.JSON
            )
            
            # 发送
            response = self.session.request(method, url, **kwargs)
            
            # 响应信息
            try:
                res_body = response.json()
                allure.attach(
                    json.dumps(res_body, ensure_ascii=False, indent=2),
                    name="响应数据",
                    attachment_type=allure.attachment_type.JSON
                )
            except:
                allure.attach(response.text, name="响应数据", 
                             attachment_type=allure.attachment_type.TEXT)
            
            logger.info(f"[{method}] {url} → {response.status_code}")
            return response
    
    def get(self, url, **kwargs):
        return self.send_request("GET", url, **kwargs)
    
    def post(self, url, **kwargs):
        return self.send_request("POST", url, **kwargs)
```

**这段代码里有个必须改掉的写法：** 那个裸露的 `except:` 会捕获**所有**异常，包括 `KeyboardInterrupt`（你按 Ctrl+C 都停不下来）和你自己代码里的 `NameError`。它本意只是"响应不是 JSON 时改存文本"，所以应该收窄：

```python
try:
    res_body = response.json()
    allure.attach(json.dumps(res_body, ensure_ascii=False, indent=2),
                  name="响应数据", attachment_type=allure.attachment_type.JSON)
except ValueError:      # json() 解析失败时抛的是 ValueError
    allure.attach(response.text, name="响应数据",
                  attachment_type=allure.attachment_type.TEXT)
```

**另一个需要自己评估的点：附件会显著撑大报告体积。** 每条用例存一次完整请求和响应，几百条用例下来报告可能有几十 MB，CI 上传和同事下载都变慢。**常见做法是只在失败时存完整报文**（在 `pytest_runtest_makereport` 钩子里判断，见第 10.2 节），成功时只记一行摘要。

### 8.7 报告中的环境信息

同一个用例在本地通过、在 CI 失败，**第一个要确认的就是"两边跑的是不是同一套环境"**。环境信息写进报告就是为了省掉这句来回确认——报告顶部一眼能看到 BaseUrl、Python 版本、执行人。

在 `allure-results` 目录下创建 `environment.properties`（pytest 运行前后写入）：

```properties
项目名称=电商接口自动化
测试环境=test
BaseUrl=https://api-test.example.com
Python版本=3.10
执行人=tester
```

**不推荐手动维护这个文件**——改环境时很容易忘了同步，报告上写的还是旧地址，反而误导排查。下面的自动生成方式更可靠：

```python
import os
import sys
from config.settings import BASE_URL

def pytest_configure(config):
    # 通过 --alluredir 参数获取目录
    allure_dir = config.getoption("--alluredir", default=None)
    if allure_dir:
        os.makedirs(allure_dir, exist_ok=True)
        env_file = os.path.join(allure_dir, "environment.properties")
        with open(env_file, "w", encoding="utf-8") as f:
            f.write(f"项目名称=电商接口自动化\n")
            f.write(f"BaseUrl={BASE_URL}\n")
            f.write(f"Python版本={sys.version.split()[0]}\n")
```

### 8.8 报告趋势（历史对比）

**这是 Allure 相比 HTML 报告最大的差异点：它能画趋势图**——通过率是升是降、用例总数是涨是缩，一眼看得出。趋势图的实现机制比较特别：**每次生成时要把上一次的 `history` 目录复制进本次的结果目录**，Allure 才拿得到历史数据。

每次执行时把上次的 `history` 目录复制到本次 `allure-results`：

```bash
# 保留历史趋势
cp -r ./reports/allure-report/history ./reports/allure-results/history

# 生成报告
allure generate ./reports/allure-results -o ./reports/allure-report --clean
```

**注意 `--clean` 会清空输出目录**，所以务必先把 history 复制到 results 目录再生成——顺序反了趋势就断了，而且**丢了就补不回来**（历史数据不会重算）。如果报告目录整个被 CI 清理过，趋势只能从下一次开始重新累积。第 11.1 节的 `run.py` 里用 Python 的 `shutil.copytree` 做了这件事，逻辑是一样的。

---

## 九、接口依赖与数据传递

接口测试和功能测试最大的不同在这里：**很多接口不能单独测**。查订单要先有订单，取消订单要先有订单 ID，下单要先登录——**这就是"接口依赖"**。这一章讲三种传递方式，重点不是"哪种能跑"，而是"**哪种不会让你的用例变成一笔糊涂账**"。

### 9.1 场景示例

先看这个链条长什么样，它就是接下来三种方式要解决的问题：

```text
登录接口 → 拿到 token
   ↓
创建订单接口（需要 token） → 拿到 orderId
   ↓
查询订单接口（需要 orderId）
```

**这个链条本身就是个测试对象。** 顺带说一句：`orderId` 这类由服务端生成的动态值**不能硬编码**，因为你没法预知它是多少——所以必然要把上一步的响应结果传给下一步。这就是下面三种方式要解决的问题。

### 9.2 方式一：Fixture 传递（推荐用例间）

**适用场景：** 多个用例都需要"登录态"或"一个存在的订单"这类前置条件。

```python
import pytest
from apis.login_api import LoginApi
from apis.order_api import OrderApi

@pytest.fixture(scope="session")
def token():
    response = LoginApi.login("testuser", "123456")
    return response.json()["data"]["token"]

@pytest.fixture(scope="function")
def order_id(token):
    response = OrderApi.create_order(token, productId=1001, quantity=2)
    return response.json()["data"]["orderId"]

class TestOrder:
    def test_query_order(self, token, order_id):
        response = OrderApi.query_order(token, order_id)
        assert response.json()["data"]["orderId"] == order_id
    
    def test_cancel_order(self, token, order_id):
        response = OrderApi.cancel_order(token, order_id)
        assert response.json()["code"] == 0
```

**为什么这是推荐方式：** 依赖关系被写在了函数签名里——`def test_query_order(self, token, order_id)`，**读代码的人一眼就知道这条用例依赖什么**。`pytest` 会自动按依赖顺序准备数据，用例本身不需要关心"订单从哪来"。

**两个 scope 的用法是最关键的一处设计：**

- `token` 用 `scope="session"`：**整个测试会话只登录一次**。登录接口通常有频率限制，几百条用例各登录一次既慢又可能被封。
- `order_id` 用 `scope="function"`：**每条用例都新建一个订单**。订单是会被"取消"的状态性数据，如果共享同一个订单，先跑取消的用例会让后面的查询用例失败——这类耦合导致的失败最难查。

**如果 order_id 也用了 session scope 会怎样？** `test_cancel_order` 把订单取消后，`test_query_order` 查到的就是一个已取消的订单，断言 `data.orderId == order_id` 依然能过，但**测的已经不是你想测的东西了**。更糟的是执行顺序一变，结果就变——这就是"用例间隐性依赖"。

### 9.3 方式二：全局上下文（推荐用例内串接）

**适用场景：** **一条用例内部的流程串接**（一条用例从登录一路走到下单）。和方式一的区别是：fixture 适合"跨用例共享前置"，上下文适合"单条用例里的多步传值"。

创建 `common/context.py`：

```python
class TestContext:
    """测试上下文，存储动态数据"""
    _data = {}
    
    @classmethod
    def set(cls, key, value):
        cls._data[key] = value
    
    @classmethod
    def get(cls, key, default=None):
        return cls._data.get(key, default)
    
    @classmethod
    def clear(cls):
        cls._data.clear()
```

使用：

```python
from common.context import TestContext

def test_full_flow():
    # 登录
    response = LoginApi.login("test", "123456")
    TestContext.set("token", response.json()["data"]["token"])
    
    # 创建订单
    response = OrderApi.create_order(TestContext.get("token"), 1001, 2)
    TestContext.set("order_id", response.json()["data"]["orderId"])
    
    # 查询订单
    response = OrderApi.query_order(
        TestContext.get("token"),
        TestContext.get("order_id")
    )
    assert response.json()["code"] == 0
```

**这种方式的代价必须说清楚：**

- **`_data` 是类级别的全局变量，用例之间会互相污染。** 所以 `clear()` 不是可有可无的——**通常要在每条用例的 setup 或 teardown 里清一次**，否则上一条用例留下的 `token` 会被下一条读到。
- **并行执行会出事。** 多个进程/线程共享这个字典时，A 用例刚 `set` 的 token 可能被 B 用例覆盖。要用并行（`-n auto`）就别用全局上下文。
- **代码里读不到依赖关系。** 看 `test_full_flow` 的函数签名看不出它依赖什么，全靠读函数体。

**一句话取舍：** 上下文适合"一条用例内部"临时传值；**跨用例的一律用 fixture**。混着用的项目，问题会以"莫名奇妙的偶发失败"的形式冒出来。

### 9.4 方式三：YAML 中引用变量

**适用场景：** 数据驱动框架里的用例串接（第 7 章那种）。变量用 `${}` 占位，框架在执行时替换成上下文里的实际值。

```yaml
- case_id: 001
  case_name: 登录
  url: /api/login
  data:
    username: testuser
    password: "123456"
  extract:
    token: $.data.token         # 用 JSONPath 提取响应字段保存

- case_id: 002
  case_name: 查询用户信息
  url: /api/user/info
  headers:
    Authorization: "Bearer ${token}"   # 引用上一个用例提取的 token
```

执行框架需要解析 `${变量}` 占位符，替换为上下文中的实际值。

**这种方式是"看起来最优雅、实际最难维护"的一种**，原因和 7.4 节说的一样——但多一个特殊问题：**用例 002 的成功依赖用例 001 先执行过**。这意味着：

- 单独跑用例 002 必然失败（`${token}` 找不到来源）
- 换执行顺序就失败
- 并行执行时，002 可能在 001 还没跑完时就开始（拿到空值）

**如果一定要用，务必让框架在 `${token}` 解析不到时报错退出**，而不是替换成空字符串继续跑——因为 `Authorization: "Bearer "` 这种请求通常会返回 401，**你看到的失败信息会指向"鉴权失败"，而真正的原因是用例依赖没满足**，排查方向完全错。

**三种方式的选择建议：**

| 场景 | 用什么 |
|------|--------|
| 跨用例的登录态、前置数据 | Fixture（方式一） |
| 一条用例内部的多步串接 | 全局上下文（方式二），记得清理 |
| 纯数据驱动框架的用例串接 | YAML 变量（方式三），接受它的脆弱性 |

---

## 十、日志与异常处理

自动化最容易走偏的一点是：**用例写完了，但失败时看不出为什么失败**。日志和失败现场留痕解决的就是这个问题——**它不是"锦上添花"，而是决定这套自动化能不能被长期维护的基础设施**。没有日志的框架，失败一次大家就得手动复现一次，时间一长没人愿意看。

### 10.1 Loguru 日志配置

**为什么不用 Python 自带的 `logging`：** 自带库要配 Handler、Formatter，十几行才能打出想要的效果；Loguru 一个 `logger.add()` 搞定，还自带颜色、自动轮转、异常美化。

`common/logger.py`：

```python
from loguru import logger
import sys
from config.settings import LOG_DIR

# 移除默认配置
logger.remove()

# 控制台输出
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
    colorize=True
)

# 文件输出
logger.add(
    LOG_DIR / "test_{time:YYYY-MM-DD}.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG",
    rotation="00:00",           # 每天 0 点切割
    retention="7 days",         # 保留 7 天
    encoding="utf-8"
)
```

任意模块直接 `from loguru import logger` 使用：

```python
logger.debug("调试信息")
logger.info("普通信息")
logger.warning("警告")
logger.error("错误")
logger.critical("严重错误")
```

**配置文件里几个参数是有取舍的：**

- **控制台用 `INFO`、文件用 `DEBUG`**：控制台是给人实时看的，DEBUG 会把屏幕刷满；文件是事后排查用的，**细节越多越好**。这个"控制台精简、文件详尽"的组合是实践里比较省心的默认。
- `rotation="00:00"` 每天切割：**日志文件的检索成本和使用体验直接相关**。如果全部写进一个文件，跑几个月后想找某天的日志会非常痛苦。
- `retention="7 days"` 保留 7 天：**不设置的话日志会一直堆积，最终吃满磁盘**——CI 机器上尤其容易出事。保留多久看你的排查习惯和磁盘空间。
- **日志里绝不要记完整的 Token 和密码。** 日志文件通常会被收集到日志平台、被打进 CI 产物，**写进去就等于泄漏**。需要定位时只记前几位，或者记"Token 已获取"。

**日志和 Allure 的分工：** 日志是**面向执行过程的**（谁在什么时候发了什么请求），Allure 是**面向结果的**（这条用例成功还是失败，失败了差在哪）。两者互补，缺了日志，出了问题只能靠重跑复现。

### 10.2 失败用例自动截图/抓取日志

**这一段是本教程性价比最高的代码**——十几行，但能让每次失败都自带现场。核心机制是 `pytest` 的钩子 `pytest_runtest_makereport`：**每条用例执行后它都会跑一次**，我们只关心"执行阶段出了错"这一种情况。

在 `conftest.py` 中添加 hook：

```python
import pytest
import allure
from loguru import logger

@pytest.hookimpl(hookwrapper=True, tryfirst=True)
def pytest_runtest_makereport(item, call):
    """Pytest 钩子：每个用例执行后自动调用。失败时截图并记录日志。
    hookwrapper=True 表示包裹用例执行，tryfirst 确保先于其他钩子运行。
    可以直接复制使用，不需要完全理解内部机制。"""
    outcome = yield
    report = outcome.get_result()
    
    if report.when == "call" and report.failed:
        # 记录到日志
        logger.error(f"用例失败：{item.name}")
        logger.error(f"失败原因：{report.longrepr}")
        
        # 附加到 Allure
        allure.attach(
            str(report.longrepr),
            name="失败堆栈",
            attachment_type=allure.attachment_type.TEXT
        )
```

**`report.when == "call"` 这个判断别漏掉。** 一个用例的执行分三个阶段：`setup`（前置准备）、`call`（用例本身）、`teardown`（清理）。不加判断的话：

- **`setup` 阶段失败也会触发**，你会看到"登录 fixture 失败"被当成用例失败记录一遍，实际用例根本没跑。
- **`teardown` 失败会重复记录**，日志里同一个用例出现两三次错误。

**这也是第 3.8 节说的"要能区分环境问题和代码问题"的落地位置** —— `setup` 失败通常意味着环境或前置数据有问题，`call` 失败才可能是真的发现了缺陷。**把这两类分开记，能大幅减少"自动化误报"的争论。**

> 提到"自动截图"：那是 Selenium / Playwright 这类 Web 自动化的产物（接口测试没有界面可截）。做法完全一样，在这个钩子里调 `driver.save_screenshot(...)` 再 `allure.attach` 即可，参考 [Selenium Web 自动化教程](Selenium-Web自动化教程-软件测试版.md)。

---

## 十一、完整实战项目

前面十章的知识点是散着的——Requests、Pytest、分层、配置、数据驱动、Allure。**这一章把它们拼成一个能交付的项目**：一个命令跑完、报告自动生成、趋势能接上、失败有现场。如果你只想快速上手，第 11.1 节的 `run.py` 加上第 11.3 节的 `conftest.py` 是最小可用组合。

### 11.1 入口启动脚本 run.py

**为什么需要 `run.py`：** 每次手敲 `pytest --alluredir=... && allure generate ...` 容易漏参数、容易忘记清上次的结果、也容易在趋势复制这步出错。**把它固化成一个脚本，团队所有人执行方式一致**——这是"能跑"和"能交付"的分界线。

```python
import os
import shutil
import pytest
from config.settings import REPORT_DIR

def run():
    # 清理上次结果
    result_dir = REPORT_DIR / "allure-results"
    report_dir = REPORT_DIR / "allure-report"
    
    if result_dir.exists():
        shutil.rmtree(result_dir)
    result_dir.mkdir(parents=True)
    
    # 保留历史趋势
    history_src = report_dir / "history"
    history_dst = result_dir / "history"
    if history_src.exists():
        shutil.copytree(history_src, history_dst)
    
    # 执行测试
    pytest_args = [
        "-v",
        "-s",
        "--alluredir", str(result_dir),
        "--clean-alluredir",
        "testcases/"
    ]
    pytest.main(pytest_args)
    
    # 生成报告
    os.system(f"allure generate {result_dir} -o {report_dir} --clean")
    
    # 可选：自动打开报告
    # os.system(f"allure open {report_dir}")

if __name__ == "__main__":
    run()
```

**这段脚本里有三个细节值得注意：**

1. **先删 `allure-results` 再重建**：不清理的话，上一次运行残留的结果文件会和这次的混在一起，**报告里出现"幽灵用例"**（明明删掉的用例还在），排查时容易误导。
2. **先复制 history 再执行测试**：顺序不能反（8.8 节的原因）。
3. **`pytest.main()` 返回的是退出码**，脚本里没接收它——**这有个隐患**：CI 通过 `python run.py` 判断成功失败时，脚本始终返回 0，**用例全挂了流水线还是绿的**。要接 CI 的话，改成用 `sys.exit(pytest.main(pytest_args))` 把真实结果传递出去（第 12 章会用到）。

### 11.2 pytest.ini

**为什么配置放文件而不是每次敲命令：** 保证**所有人、所有机器（本地和 CI）用的是同一套规则**。`addopts` 写一次，`pytest` 裸跑就等于加了这些参数，新人不用记命令；标记在这里声明过，`-m smoke` 才不会报 "Unknown marker" 警告。

```ini
[pytest]
# 用例目录
testpaths = testcases

# 文件匹配
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# 命令行默认参数
addopts = -v -s --tb=short --color=yes

# 标记定义
markers =
    smoke: 冒烟测试
    regression: 回归测试
    p0: P0 用例
    p1: P1 用例
    skip_prod: 生产环境跳过

# 日志
log_cli = true
log_cli_level = INFO
log_cli_format = %(asctime)s [%(levelname)s] %(message)s
log_cli_date_format = %Y-%m-%d %H:%M:%S
```

**`addopts` 里的参数要在本地和 CI 之间权衡：** `-v -s` 在本地看着舒服，**CI 日志里会非常冗长**。很多团队的做法是本地配置留 `--tb=short`，CI 上通过命令行额外覆盖参数。**别为了本地方便把 CI 日志淹了**——CI 日志是要给全团队看的。

**`skip_prod` 这个标记值得单独说**：它的用途是"给生产环境的前置检查留一个开关"。真正落地时，**更可靠的做法是在框架入口直接拦住生产环境**（比如 `settings.py` 里检测到 `TEST_ENV=prod` 就 `raise`），而不是靠每个用例自觉加标记——**靠自觉的防线迟早会破**。

### 11.3 conftest.py（项目根目录）

`conftest.py` 是 `pytest` 的"全局初始化入口"：**放在项目根目录时，里面定义的 fixture 对所有用例可见，钩子对所有用例生效**（第 4.5 节讲过作用范围）。这一节同时承担了三件事——会话初始化、全局登录态、给请求打上鉴权头。

```python
import pytest
import allure
from loguru import logger
from common.request_util import http
from apis.login_api import LoginApi
from config.settings import ACCOUNT, BASE_URL

@pytest.fixture(scope="session", autouse=True)
def session_setup():
    """会话级初始化"""
    logger.info("=" * 50)
    logger.info(f"测试开始，BaseUrl={BASE_URL}")
    logger.info("=" * 50)
    yield
    logger.info("=" * 50)
    logger.info("测试结束")
    logger.info("=" * 50)

@pytest.fixture(scope="session")
def login_token():
    """全局登录 token"""
    response = LoginApi.login(ACCOUNT["username"], ACCOUNT["password"])
    assert response.json()["code"] == 0, "登录失败，无法继续测试"
    token = response.json()["data"]["token"]
    logger.info(f"登录成功，token={token[:20]}...")
    return token

@pytest.fixture(scope="session")
def auth_session(login_token):
    """已登录的 session"""
    http.session.headers.update({"Authorization": f"Bearer {login_token}"})
    return http
```

**这段 `conftest.py` 里有三个设计决策，值得逐条理解：**

**1. `session_setup` 用 `autouse=True` 自动执行。** 不需要任何用例显式声明它，但它保证**每次会话开始和结束都会打分隔日志**——排查时你能清楚看到"这次运行从哪开始、到哪结束"，日志文件里的多次运行不会糊成一片。

**2. 登录失败时用 `assert` 拦下来。** `assert response.json()["code"] == 0, "登录失败，无法继续测试"` 这句话很关键。**不加的话会怎样？** 登录返回的业务码不是 0（比如密码改了、账号被锁），`response.json()["data"]["token"]` 会抛 `KeyError`，**后面所有用例都会各自失败一次**——报告里几十个红色，看起来像"系统崩了"，实际只有一个根因：登录没成功。**把失败拦在最前面，报告才能反映真实情况。**

**3. `auth_session` 直接改 `http.session.headers`——这行代码有副作用，用的时候要清楚代价。** 它把鉴权头写进了**全局单例**的 Session，意味着**之后所有走 `http` 的请求都自动带上这个 token**。方便，但也意味着：

- **想测"未登录访问应该被拒绝"就做不到了**——因为全局已经带上了 token。
- **要测另一个用户的身份（越权测试）也很别扭**——得先把 header 改掉，测完再改回来，顺序一变就乱。
- **并行执行时更危险**：多个进程各自改同一个 Session 的状态，结果不可预期。

**更好的做法是"每个身份一个 Session 实例"**：登录 A 用户得到一个带 A 鉴权头的 Session 对象，登录 B 用户得到另一个，用例按需取用——**互不影响，也不会污染全局**。这属于框架演进过程中很自然的一步：**先用方便的方式跑起来，遇到"测不了"的场景时再改**。这里特意把代价写出来，是希望你知道什么时候该改。

### 11.4 完整测试用例示例

这一节把前面所有东西拼在一起：分层（调 `UserApi` 而不是拼 URL）、数据驱动（`user_data.yaml`）、Allure（epic/feature/story + step）、标记（`smoke`）。

`testcases/test_user.py`:

```python
import pytest
import allure
from apis.user_api import UserApi
from common.yaml_util import read_yaml
from config.settings import DATA_DIR

user_data = read_yaml(DATA_DIR / "user_data.yaml")

@allure.epic("电商系统")
@allure.feature("用户模块")
class TestUser:
    
    @allure.story("查询用户信息")
    @allure.title("查询当前登录用户信息")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    def test_get_user_info(self, auth_session):
        with allure.step("调用查询接口"):
            response = UserApi.get_user_info()
        
        with allure.step("验证响应"):
            assert response.status_code == 200
            result = response.json()
            assert result["code"] == 0
            assert "userId" in result["data"]
            assert "username" in result["data"]
    
    @allure.story("修改用户信息")
    @allure.title("修改用户信息-{case[case_name]}")
    @pytest.mark.parametrize("case", user_data["update_cases"],
                             ids=[c["case_name"] for c in user_data["update_cases"]])
    def test_update_user(self, auth_session, case):
        with allure.step(f"修改字段：{case['data']}"):
            response = UserApi.update_user(case["data"])
        
        with allure.step(f"预期 code={case['expected']['code']}"):
            assert response.json()["code"] == case["expected"]["code"]
```

### 11.5 执行项目

两种执行方式，日常开发和出正式报告各用各的：

```bash
# 方式 1：直接运行 run.py（推荐）
python run.py

# 方式 2：分步执行
pytest --alluredir=./reports/allure-results
allure serve ./reports/allure-results
```

**日常怎么跑：** 开发阶段用方式 2（快速看结果、不生成完整报告），要出报告给别人看或者提测前一天用方式 1。**`-m smoke` 适合做日常快速回归**——只跑核心用例，几十秒出结果，把全量留给 CI 和发版前。

### 11.6 项目落地检查清单

写完别急着说"框架搭好了"，对着下面这几条过一遍：

- [ ] 用例里**没有出现 URL、headers、账号密码**（都收进 `apis/` 和 `config/`）
- [ ] 随便挑一条用例，**能单独运行并成功**（不依赖其他用例先跑）
- [ ] 把 `TEST_ENV` 改成 `dev`，**不用改任何代码就能跑通另一套环境**
- [ ] 故意把一个用例的断言改错，**Allure 报告里能看到失败的请求报文和响应内容**
- [ ] 代码里搜不到 `token = "eyJ...` 这种硬编码凭据
- [ ] `pytest --collect-only` 收集到的用例数量和预期一致（没有"写漏了不跑"的）
- [ ] 连续跑两次，**第二次结果和第一次一致**（没有残留数据导致的偶发失败）

**最后一条最容易被跳过，但它最能说明框架健不健康。** 今天通过、明天失败、后天又通过，这种"偶发失败"会让整个团队不再信任自动化——**信任一旦崩了，报告就没人看了**。

---

## 十二、CI/CD 持续集成

到这一步，框架已经能在你本机跑出报告了。**但自动化的真正价值在"没人管的时候也在跑"**——每天凌晨回归一次，早上上班就能看到昨天下午的提交有没有破坏老功能。这一章讲怎么接到 CI 上。

**先说 CI 上最容易踩的三个坑：**

1. **本地能跑、CI 跑不了**：环境变量没配、依赖少装、路径用了绝对路径。
2. **用例失败了但流水线是绿的**：`|| true` 或 `continue-on-error` 加得不对，**结果自动化形同虚设**（后面 12.1 会讲正确做法）。
3. **报告生成了但没人看**：没有把报告归档或发通知，跑完就沉底了。

### 12.1 Jenkins 集成

**前置准备：**

- Jenkins 安装 Allure 插件
- Jenkins 服务器安装 Python + Allure

**构建脚本（Execute shell）：**

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 执行测试
pytest --alluredir=./reports/allure-results || true
```

> 加 `|| true` 是为了即使有用例失败也继续生成报告

**关于 `|| true`，说清楚它的两面性：** 这里的目的是"用例失败后继续往下走，把报告生成出来"——**因为报告里才有失败原因，没有报告的话你只能看到一行 exit code**。但它带来的风险是**后续步骤必须自己判断结果**，否则流水线永远成功。正确的完整做法是：

```bash
pytest --alluredir=./reports/allure-results || true
# 后续步骤用测试结果文件或 exit code 决定构建是否失败
```

或者更简单：让 pytest 正常返回非零，**把"生成报告"和"失败即止"拆成两个 Jenkins 构建步骤**，报告步骤用 `Post-build Actions` 触发（下面的 Allure Report 配置天然支持这个）。**判断标准就一条：用例失败时，这条流水线最终是不是红的。** 是红的，`|| true` 就没问题；不是红的，你搭的自动化就是在骗自己。

**配置 Allure 报告（Post-build Actions）：**

- `Allure Report` → `Results` 填 `reports/allure-results`
- 构建后自动展示报告链接

### 12.2 GitHub Actions 集成

`.github/workflows/api-test.yml`:

```yaml
name: API Automation Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'    # 注意：cron 用 UTC 时间，0 2 * * * = 北京时间 10:00

jobs:
  api-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Install Allure
        run: |
          ALLURE_VERSION=2.30.0
          wget -O allure.tgz https://github.com/allure-framework/allure2/releases/download/${ALLURE_VERSION}/allure-${ALLURE_VERSION}.tgz
          sudo tar -zxvf allure.tgz -C /opt/
          sudo ln -sf /opt/allure-${ALLURE_VERSION}/bin/allure /usr/local/bin/allure
      
      - name: Run Tests
        run: pytest --alluredir=./reports/allure-results
        continue-on-error: true
      
      - name: Generate Allure Report
        if: always()
        run: allure generate ./reports/allure-results -o ./reports/allure-report --clean
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-report
          path: ./reports/allure-report
```

**这份 workflow 有三个设计点该看懂：**

**1. `cron` 里的时间说的是 UTC，不是北京时间。** GitHub Actions 的 `cron` **默认按 UTC 解释**，**`0 2 * * *` 实际是北京时间早上 10 点**，不是凌晨 2 点。想在北京时间凌晨 2 点跑要写 `0 18 * * *`。这个时区坑非常常见，直接抄 cron 表达式经常导致"日报没在我期望的时间出"。

> 新版 Actions 支持显式指定时区，不想做心算的话可以这样写（老版本不识别 `timezone` 字段，写了会报语法错误，用之前先在 CI 上验证一次）：
>
> ```yaml
>   schedule:
>     - cron: '0 2 * * *'
>       timezone: "Asia/Shanghai"
> ```

**另外两个 schedule 的硬限制要记住：** 定时任务**只在默认分支上运行**（在 feature 分支上改 cron 不会生效），**且最短间隔是 5 分钟**。还有一点——**定时任务是"尽力而为"的**，负载高时可能延迟甚至丢任务，所以别把"凌晨 2 点必须准点跑"这种要求押在它身上。

**2. `continue-on-error: true` 是为了让报告能生成**，原因和 Jenkins 的 `|| true` 一样。但**必须意识到它的后果**：这一步失败了 job 也是绿的。所以真实项目里还需要**在最后一步把结果"还原"成失败**，让流水线整体变红：

```yaml
      # 给测试步骤加 id，后面才能引用它的结果
      - name: Run Tests
        id: run-tests
        run: pytest --alluredir=./reports/allure-results
        continue-on-error: true

      - name: Generate Allure Report
        if: always()
        run: allure generate ./reports/allure-results -o ./reports/allure-report --clean

      # 报告生成完了，再把失败状态传递下去
      - name: Fail if tests failed
        if: steps.run-tests.outcome == 'failure'
        run: exit 1
```

注意 `id: run-tests` 不能少：**没有 id，`steps.run-tests.outcome` 取不到值，这个判断会永远为假，等于白写。** 顺序也要对——"还原失败"必须放在报告生成**之后**，否则报告就生成不出来了（那就退回成"看不到失败原因"的老问题）。

**只在定时回归的场景下可以考虑不加这一步**（核心是看趋势而不是卡住发布）；**如果是 PR 门禁，绝不能漏**，否则就是最典型的"假绿流水线"——代码有缺陷，但因为测试报告没被检查，直接合进了主干。

**3. 下载 Allure 用了固定版本号 `2.30.0`。** **别用 `latest`**：某天上游发新版改了命令行参数，你的流水线会毫无征兆地挂掉，而代码一行没改——这种问题排查起来非常费时。**固定版本，定期手动升级**，所有 CI 依赖都适用这条规则。

> 另外注意 `pip install -r requirements.txt` 没加速镜像。**GitHub Actions 的 runner 在境外，访问 pypi.org 没问题**，加速镜像反而可能超时——这也是 CI 和本地环境差异的一个典型例子，第 2.2 节的镜像配置主要针对国内网络。

### 12.3 钉钉/企业微信通知

**为什么需要通知：** 定时任务跑在半夜，**没人会主动去看**。报告一直躺在产物里，等于没跑。通知的价值是**把结果推到人眼前**——尤其是"通过率比昨天下降"这种情况，越早发现越好。把结果推到群里，是自动化真正融入团队工作流的一步。

`common/notify.py`:

```python
import requests

def send_dingtalk(webhook, content):
    """发送钉钉通知"""
    headers = {"Content-Type": "application/json"}
    data = {
        "msgtype": "markdown",
        "markdown": {
            "title": "接口自动化测试报告",
            "text": content
        }
    }
    requests.post(webhook, json=data, headers=headers)

def send_wechat(webhook, content):
    """发送企业微信通知"""
    data = {
        "msgtype": "markdown",
        "markdown": {"content": content}
    }
    requests.post(webhook, json=data)
```

在 `conftest.py` 添加测试结束 hook：

```python
def pytest_terminal_summary(terminalreporter):
    """测试结束后发送通知"""
    passed = len(terminalreporter.stats.get("passed", []))
    failed = len(terminalreporter.stats.get("failed", []))
    error = len(terminalreporter.stats.get("error", []))
    total = passed + failed + error
    pass_rate = f"{passed/total*100:.1f}%" if total > 0 else "0%"
    
    content = f"""
## 接口自动化测试报告

- 总用例数：{total}
- 通过：{passed}
- 失败：{failed}
- 错误：{error}
- 通过率：{pass_rate}

[查看报告](http://jenkins.example.com/job/api-test/allure)
"""
    # send_dingtalk("https://oapi.dingtalk.com/robot/send?access_token=xxx", content)
```

**四点要注意：**

**1. Webhook 地址等同于密码，必须走环境变量。** 上面注释里的 `access_token=xxx` 是占位符——**真实的 Webhook 一旦提交进 Git，任何拿到它的人都能往你们群里发消息**，而且删掉代码也没用（还留在历史里）。正确做法是 `os.getenv("DINGTALK_WEBHOOK")`，本地放 `.env`（进 `.gitignore`），CI 上放 Secret。

**2. 别让通知本身把测试搞挂。** 上面这两行 `requests.post` **没有 try/except，也没设 timeout**。网络抖动或 Webhook 失效时，这行会抛异常——**在一个"测试结束"钩子里抛异常，可能让整个 pytest 会话以非零码退出**，于是你看到流水线红了，但实际用例全过了。**通知是附属功能，不该影响测试结论**，稳妥写法是：

```python
try:
    requests.post(webhook, json=data, headers=headers, timeout=5)
except Exception as e:
    logger.warning(f"通知发送失败（不影响测试结果）：{e}")
```

**3. 通知要"有信息量"才有人看。** 每天都发一条"通过率 100%"的消息，很快就会被群里屏蔽——**群消息免打扰一开，失败的那条也被一起屏蔽了**。比较有效的做法是**只在出现失败、或通过率比上次下降时才发**，平时安静。这属于工程习惯问题，但直接决定通知有没有人真正看到。

**4. 报告链接要能点开。** 上面的 `[查看报告]` 指向 Jenkins 地址——**如果 Job 是内网地址，群里用手机的人点不开**。CI 上的做法是上传 Allure 报告为构建产物（像 12.2 节那样），链接直接指向产物页面，谁都能点。

---

## 十三、常见问题排查

这一章的问题**都是实际会撞上的**，而且有个共同特点：**报错信息看起来跟真正的原因没关系**（比如"找不到模块"实际是路径问题、"乱码"实际是编码问题）。所以每条都按"现象 → 真实原因 → 怎么改"来讲。**排查时先看报错里的关键词，再对照这里定位，不要靠猜。**

### 13.1 ModuleNotFoundError

先看报错长什么样：

```
ModuleNotFoundError: No module named 'common'
```

**原因：** Python 找不到模块路径

**真实场景：** 这个错误几乎总是这样出现的——你在项目根目录敲 `pytest` 能跑通，但你在 `testcases/` 目录里敲 `pytest`，或者用 IDE 直接运行某个 `test_xxx.py`，就报了"找不到 `common`"。原因是**Python 的模块搜索路径以"你从哪里启动"为基准**：从根目录启动时根目录在路径里，`import common` 自然找得到；从子目录启动就不在了。

**解决：**

1. 项目根目录创建 `pytest.ini` 即可（pytest 会自动以 pytest.ini 所在目录为根）
2. 或在 `conftest.py` 中添加：

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
```

**两种方式的取舍：** 方式 1 是"**从根目录运行就好**"——更干净，也是标准做法，**推荐优先用它**。方式 2 是硬编码路径，能解决 IDE 直接运行的问题，但**算是绕过设计**：路径写死之后，项目换目录结构就得改代码。

**一个常被忽略的细节：目录里要有 `__init__.py`。** 这个坑的表现**不是 `ModuleNotFoundError`，而是一句更容易看懵的报错**：

```
import file mismatch:
imported module 'test_login' has this __file__ attribute:
  /project/user/test_login.py
which is not the same as the test file we want to collect:
  /project/order/test_login.py
```

真实原因是：**两个目录下有同名的用例文件**（`user/test_login.py` 和 `order/test_login.py`），缺 `__init__.py` 时 Python 按模块名把它们当成同一个模块，加载第二个时报冲突。**报错信息里只有"文件不匹配"，完全没提 `__init__.py`**，所以第一眼看不出该怎么办。解决方式就是在包目录里补上 `__init__.py`（第 5.1 节的结构里每个包目录都有，原因就在这里），或者给用例文件起不同的名字。

### 13.2 SSL 警告

这个警告长这样：

```
InsecureRequestWarning: Unverified HTTPS request is being made
```

**这不是错误，是警告** —— 请求实际上成功了，只是 `verify=False` 关掉了证书校验，urllib3 提醒你一声。

**解决：**

```python
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
```

**但先别急着关警告，想清楚三件事：**

1. **关的是警告，不是风险。** `disable_warnings` 只是让屏幕干净，中间人风险依然存在——**所以它只能出现在测试环境**。
2. **真正的坑是"看不见"**：把警告关掉后，如果哪天有人误把生产环境地址配了进来，**你连一个提示都没有了**。所以更稳妥的做法是**只在确实需要跳过校验的环境里关**（比如按 `TEST_ENV` 判断），而不是全局无脑关。
3. **另一个常见来源：** 这个警告也可能是抓包工具（Fiddler/Charles）在做中间人导致的——**你的证书被代理替换了，这在抓包场景下是预期的**，正式跑用例时应该移除代理配置。

### 13.3 中文乱码

中文乱码只有三个来源，**照这三条对号入座基本都能解决**：

```python
# 1. 读取 YAML 用 utf-8
with open(file, encoding="utf-8") as f: ...

# 2. JSON 输出禁用 ASCII 转义
json.dumps(data, ensure_ascii=False)

# 3. response 编码强制设置
response.encoding = "utf-8"
```

**分别对应什么现象：**

| 现象 | 原因 | 对应哪条 |
|------|------|----------|
| 读 YAML 时直接报 `UnicodeDecodeError` | Windows 默认用 GBK 读文件 | 第 1 条 |
| 日志/断言里看到 `\u6d4b\u8bd5` | `json.dumps` 默认转义非 ASCII | 第 2 条 |
| 响应内容显示成 `æµ‹è¯•` | 按错误的编码解析了响应体 | 第 3 条 |

**第 2 条和第 3 条的区别容易混：** `\u6d4b\u8bd5` 这种是"**能正常显示，只是不认识**"——数据没坏，只是被转义了；`æµ‹è¯•` 这种是"**解码错了**"，**数据已经坏了、还原不回原文**。前者改一行 `ensure_ascii=False` 就好，后者要找到编码设置的地方。**分清楚这两种，能省很多时间。**

**还有一个更隐蔽的情况：Windows 下的控制台。** 如果文件里是正常中文，但打印到终端变成乱码，那是终端编码的问题（可以用 `chcp 65001` 切到 UTF-8），**和你的代码无关**——别在这种地方改代码。

### 13.4 Allure 报告打不开

直接 `file://` 打开 HTML 会因跨域限制无法加载数据，必须用：

```bash
allure open ./reports/allure-report
# 或
allure serve ./reports/allure-results
```

**典型症状是"页面能打开，但一片空白/没有数据"** —— 页面本身是好的，浏览器安全策略不让它读同目录的数据文件（第 8.1 节讲过）。**看到空白页第一反应就该是"用错了打开方式"，而不是怀疑报告生成失败。**

如果换成 `allure open` 还是空的，检查两点：**报告目录是不是被 `--clean` 清空后没重新生成**；**`allure-results` 目录里到底有没有文件**（没有的话说明 `pytest --alluredir` 那步没跑或者路径写错了）。

### 13.5 Allure 报错 "未找到 java"

**Allure 命令行工具是用 Java 写的**，所以即使 Python 环境完全正常，生成报告这一步也会因为找不到 Java 而失败。**症状是 `allure generate` 报 `JAVA_HOME is not set` 或 `'java' 不是内部或外部命令`** ——报错里出现"java"时，就别再折腾 pip 包了，问题在系统环境。

Allure 需要 Java 8+：

```bash
java -version
# 没有则安装
# Ubuntu: sudo apt install openjdk-11-jdk
# CentOS: sudo yum install java-11-openjdk
```

**CI 上要特别注意这一点**：GitHub Actions 的 `ubuntu-latest` runner **默认装了 Java**，但如果你用精简镜像或在 Docker 里跑，就必须显式安装。**12.2 节那份 workflow 只装了 Allure 没装 Java，正因为 runner 自带**——换成自建 runner 时要记得补上。

### 13.6 用例执行顺序问题

Pytest 默认按文件名 + 用例定义顺序执行。如需控制顺序，使用插件：

```bash
# pytest-ordering 已停止维护，推荐 pytest-order
pip install pytest-order
```

```python
@pytest.mark.order(1)
def test_login(): ...

@pytest.mark.order(2)
def test_create_order(): ...
```

!!! tip "更好的实践"
    不要依赖用例执行顺序，每个用例独立。需要数据依赖时用 Fixture。

**为什么教程给了插件用法，却劝你别用：** `pytest-order` 能解决"顺序不对"的表象，**但顺序依赖本身就是设计问题**（第 9 章反复讲过）。一旦用上强制排序，就会形成连锁反应：

- 第 1 条用例挂了，后面 20 条因为前置数据没准备好**全部挂掉**——报告里 21 个红色，实际只有 1 个真问题，**缺陷数量被严重放大**。
- 想并行执行（13.7 节）时直接用不了——**顺序依赖和并行天然冲突**，这是框架后期最难还的技术债。
- 别人想单独跑一条用例做调试，跑不起来。

**例外情况可以接受：** 极少数场景下确实需要顺序，比如"必须先初始化基础数据再跑业务用例"。这时**用 `scope="session"` 的 fixture 来表达这个前置依赖**，而不是用 `@pytest.mark.order` 强行排顺序——**fixture 表达的是"我需要什么"，排序表达的是"你必须第几个跑"**，前者在任何执行顺序下都成立。

### 13.7 并发执行

用例从几十条涨到几百条之后，串行执行的等待时间会变得难以接受，这时才轮到并发执行出场：

```bash
pip install pytest-xdist
pytest -n 4    # 4 进程并发
pytest -n auto # 自动检测 CPU 数
```

!!! warning "注意"
    并发执行时共享数据可能出问题（如同一账号被多用例同时操作），需要每个用例使用独立数据。

**并发不是"改个参数就变快"的事，先检查这几条前置条件：**

| 前置条件 | 不满足会怎样 |
|----------|--------------|
| 用例之间**没有执行顺序依赖** | 结果随机失败，且**本地复现不了** |
| 每个用例**用自己的测试数据** | 两个用例同时改同一条订单，断言互相打架 |
| 登录态**没有被全局共享** | 一个进程改了 `http.session` 的 header，影响另一个进程 |
| 被测接口**能扛住并发** | 你把测试环境的服务压挂了，还以为是框架问题 |

**最后一条经常被忽略：** 20 个进程并发跑，等于对测试环境发起 20 倍的请求量。**如果测试环境很弱，你会看到大量超时和 5xx** ——这时失败的原因不是代码缺陷，而是"你自己把环境打趴了"。**并发度应该逐步往上加**（先 `-n 2`，观察环境是否稳定），而不是一上来就 `-n auto`。

**一个稳妥的落地顺序：** 先让所有用例独立（能任意顺序单独跑），再考虑并发。**顺序反了会非常痛苦**——你不会知道那些偶发失败是并发引起的，还是用例本身就不独立。

### 13.8 Fixture 不生效

排查清单：

- conftest.py 是否在正确位置（用例同目录或上级目录）
- Fixture 函数名是否拼写正确
- 是否漏写了 `@pytest.fixture` 装饰器
- scope 是否合适

**"不生效"通常有三种表现，对应的原因不一样：**

| 表现 | 常见原因 |
|------|----------|
| 报 `fixture 'xxx' not found` | 函数名拼错、漏装饰器，或 `conftest.py` 放错了目录层级 |
| 用例找不到 fixture 参数而报 `TypeError` | 参数名和 fixture 名字不一致（**pytest 靠名字匹配**，不是靠类型） |
| 前置代码看着跑了，但效果不对 | scope 用错——比如该每用例重置的数据用了 `session` scope，**第二条用例读到的是脏数据** |

**第一条最容易踩的坑：`conftest.py` 只在"它所在目录及子目录"生效。** 放在 `testcases/` 下的 fixture，根目录的 `conftest.py` 里用不了（方向反了）；而根目录的能被所有子目录用。**所以共享 fixture 放根目录，模块专用的放对应子目录**，这是最不容易出错的规则。

**还有个隐蔽情况：`autouse=True` 的 fixture 在你看不见的地方跑了。** 如果发现日志里有你没写过的输出、或者用例行为诡异，**搜一下项目里所有 `conftest.py` 里的 `autouse`** ——这类 fixture 不需要任何用例引用就自动执行，**排查时最容易被忽略**。

---

## 十四、最佳实践与进阶

### 14.1 用例编写原则

1. **独立性**：每个用例不依赖其他用例的执行结果
2. **可重复**：多次执行结果一致（数据需要清理或使用独立账号）
3. **单一职责**：一个用例只验证一个场景
4. **快速反馈**：用例执行时间 < 5 秒
5. **明确断言**：断言要具体，不要 `assert response`，要 `assert response.json()["code"] == 0`

### 14.2 项目维护建议

| 维度 | 建议 |
|------|------|
| 用例组织 | 按业务模块分文件夹，与项目结构对应 |
| 命名规范 | 见名知意，`test_login_success` 优于 `test_001` |
| 注释规范 | 每个用例写 docstring，说明测试目的 |
| 数据隔离 | 测试数据用独立账号/独立环境，不污染他人 |
| 失败重试 | `pytest-rerunfailures` 处理偶发网络问题 |
| 接口稳定性 | 框架不依赖接口字段顺序，用 JSONPath 提取 |
| 版本管理 | 接口文档变更后及时更新框架 |

### 14.3 进阶学习路径

框架落地之后，能力提升大致沿这条线走：

```text
基础接口测试 → 数据驱动 → 接口依赖 → Mock → 数据库校验 
→ 性能测试集成（Locust）→ 接口安全测试 → 测试平台化
```

**这个顺序不是随便排的，每一步都在解决上一步暴露的问题：**

- **数据驱动**：用例多起来之后，重复代码受不了了。
- **接口依赖**：发现很多接口根本不能单独测。
- **Mock**：依赖的第三方服务不稳定、或者有缺陷还没修，**用例没法跑**——用 Mock 把别人的问题挡在外面。
- **数据库校验**：接口返回 200，但数据真的落库了吗？**只看响应是查不出这类缺陷的**。
- **性能测试集成**：功能对了，但慢——用 Locust 把功能用例改造成压测脚本。
- **接口安全测试**：功能、性能都正常，但越权呢？SQL 注入呢？
- **测试平台化**：到这一步问题不在技术，而在协作——**让不会写代码的同事也能加用例**。

**给你一个现实的预期：** 大部分团队做到"数据驱动 + 数据库校验"这一步就够了，**再往后是平台团队的事**。不要因为教程列了八步就觉得自己必须全走完——**框架复杂度要匹配团队规模和业务复杂度**，一个三个人的测试团队硬上测试平台，维护成本远大于收益。

### 14.4 配套工具与框架

| 工具/框架 | 用途 |
|----------|------|
| **Locust** | Python 性能压测 |
| **Faker** | 生成测试数据（姓名/手机号/地址） |
| **pymysql / SQLAlchemy** | 数据库校验 |
| **redis-py** | 缓存校验 |
| **WireMock** | Mock 服务 |
| **HttpRunner** | 国产自动化框架（基于 YAML） |
| **pytest-bdd** | BDD 行为驱动开发 |

**什么时候该引入哪个，给几条判断线索：**

- **`Faker`**：只要你有"注册新用户""创建不重复的商品名"这类用例，就该用它。**比手写 `test001`、`test002` 强得多**，而且能稳定复现格式问题（超长姓名、特殊字符）。
- **数据库校验（`pymysql`）**：当你发现"接口断言全过了但线上还是出数据问题时"引入。**这是提升缺陷发现能力性价比最高的一步。**
- **`WireMock` / Mock 服务**：当你的用例时不时因为"依赖的第三方接口挂了/限流了"而失败时引入。
- **`pytest-bdd`**：**先别急着上。** 它适合有非技术同事（产品、业务）要一起维护用例的场景；**纯测试团队用它通常只会增加一层翻译成本**，把"登录成功"写成 Given/When/Then 并不会让用例更清晰。

---

## 附录：参考资料

- Requests 官方文档：`https://requests.readthedocs.io/`
- Pytest 官方文档：`https://docs.pytest.org/`
- Allure 官方文档：`https://docs.qameta.io/allure/`
- JSONPath 语法：`https://goessner.net/articles/JsonPath/`
- Python 官方教程：`https://docs.python.org/zh-cn/3/tutorial/`

---

!!! info "文档说明"
    本教程基于 Python 3.10、Requests 2.31、Pytest 7.4、Allure 2.24 编写。

!!! info "测试纪律"
    自动化测试请在专门的测试环境执行，禁止使用生产账号、生产数据。涉及第三方接口注意调用频率限制，避免被封禁。账号密码、Token 等敏感信息使用环境变量或加密存储，不要硬编码在代码中。

---

## 动手任务：把「一大堆断言」重构成可维护的框架

> 这是本教程的收尾练习。请**独立完成**，不要先看参考答案。目标不是"写出能跑的脚本"，而是**让脚本在半年后还改得动**。

### 任务背景

同事交给你一段接口自动化脚本，说"能跑，用例都过了"。你打开一看：**一个文件几百行，所有请求 URL 硬编码，断言散落在各处，Token 是复制粘贴的**。现在需要新增 20 个接口用例，你评估了一下——**照这个写法，每加一个用例要复制 30 行代码**。

你的任务是**重构它**，让新增用例的成本降到 5 行以内。

### 任务数据

原始脚本（`test_orders.py`，**请先阅读找出问题**）：

```python
import requests

def test_create_order():
    # Token 硬编码，且每个用例都复制一遍
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEwMDAyfQ.abc123",
        "Content-Type": "application/json"
    }
    # URL 硬编码，改环境要全文替换
    url = "http://test.example.com/api/order"
    payload = {"productId": 1001, "quantity": 1}

    r = requests.post(url, json=payload, headers=headers)

    # 断言写在一起，失败时不知道是哪一层错了
    assert r.status_code == 200
    assert r.json()["code"] == 0
    assert r.json()["data"]["orderId"] is not None
    assert r.json()["data"]["amount"] == 1299.00

def test_query_order():
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEwMDAyfQ.abc123",
        "Content-Type": "application/json"
    }
    url = "http://test.example.com/api/order/query"
    # 换个方式传参，风格不统一
    r = requests.get(url + "?orderId=ORD-20260901-0001", headers=headers)

    assert r.status_code == 200
    assert r.json()["code"] == 0
    # 少断言了几个字段

def test_cancel_order():
    # 又复制一遍 Token
    headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEwMDAyfQ.abc123"}
    r = requests.post("http://test.example.com/api/order/cancel",
                      json={"orderId": "ORD-20260901-0001"}, headers=headers)
    # 直接假设上一步的订单存在，用例间有依赖
    assert r.json()["code"] == 0
```

### 任务准备

目标是可验证的重构，你可以：

1. 用 `requests_mock` / `responses` 库把接口打桩，让脚本能离线跑；或
2. 起一个最小 Flask / `http.server` mock（参考接口测试教程里的做法）。

### 任务要求

请依次完成：

1. **列出全部设计问题**：指出上面脚本的问题（至少 5 处），说明每处**在什么场景下会带来什么代价**。
2. **分层设计**：画出你重构后的目录结构，说明每一层的职责（如 config / common / api / testcases）。
3. **实现核心封装**：写出至少两个关键文件 —— **会话管理与请求封装**、**一个用封装改写的用例**。
4. **消除用例间依赖**：原脚本里 `test_cancel_order` 依赖 `test_create_order` 先跑。说明为什么这是隐患，并给出改法。
5. **敏感信息处理**：说明 Token 应该怎么管理，并给出对应的加载代码。

### 提交物

| 产出 | 要求 |
|------|------|
| 问题清单 | 每条含：位置、场景、代价 |
| 目录结构 | 分层清晰，职责单一 |
| 重构代码 | 封装层 + 至少 1 个改写后的用例 |
| 效果对比 | 说明「新增一个用例」从多少行降到多少行 |
| 结论 | 用 3-5 句话说明：为什么"能跑通"和"可维护"是两回事 |

### 完成标准

- [ ] 能指出**硬编码 URL/Token** 的具体代价（不只是"不优雅"，而是"换环境要改 N 处"）
- [ ] 能识别**用例间依赖**导致的严重后果（执行顺序改变就失败）
- [ ] 封装后的用例**只表达业务意图**，看不见 HTTP 细节
- [ ] Token 从环境变量读取，代码里无明文

??? tip "参考答案与思路（先自己做完再看）"

    **第 1 题：设计问题**

    | # | 位置 | 问题 | 代价 |
    |---|------|------|------|
    | 1 | `url = "http://test.example.com/..."` | URL 硬编码 | 切换测试/预发/生产环境要全文替换，极易漏改 |
    | 2 | `"Bearer eyJ..."` | Token 硬编码且重复 3 次 | 泄露风险；Token 过期要改 N 处 |
    | 3 | `headers` 每个用例重建 | 无会话复用 | 无法统一加 header（如 traceId）；重复代码 |
    | 4 | 零散 `assert r.json()["code"] == 0` | 断言无分层、失败信息差 | 失败时只知"断言错误"，不知是协议层还是业务层问题 |
    | 5 | `test_cancel_order` 假设订单存在 | **用例间依赖** | 单独跑/顺序变/并行跑都会失败，是 CI 上最常见的假失败来源 |
    | 6 | 传参风格不统一（json vs 拼 URL 字符串） | 无统一约定 | 新人不知道该用哪种，继续扩散不一致 |
    | 7 | 全部写在同一个文件 | 无分层 | 用例过百后无法维护 |

    **第 2 题：分层设计**

    ```text
    project/
    ├── config/
    │   └── settings.py          # 环境地址、超时、全局配置
    ├── common/
    │   ├── session.py           # Session 复用、统一 header、日志
    │   └── assertions.py        # 分层断言（协议/业务/数据）
    ├── api/
    │   ├── order_api.py         # 订单接口封装（只关心业务语义）
    │   └── user_api.py
    ├── testcases/
    │   └── test_order.py        # 用例（只表达业务意图）
    └── conftest.py              # fixture：登录态、测试数据准备
    ```

    各层职责：

    | 层 | 职责 | 不该做的事 |
    |----|------|-----------|
    | config | 环境地址、超时、凭据来源 | 不写业务逻辑 |
    | common | Session / 断言 / 日志 | 不写具体接口 |
    | api | 把 HTTP 细节封成业务方法（`create_order(product_id, qty)`） | 不做断言 |
    | testcases | 组织场景与断言 | 不出现 URL、不手写 headers |

    **第 3 题：核心封装**

    `config/settings.py`：

    ```python
    import os

    BASE_URL = os.getenv("API_BASE_URL", "http://test.example.com")
    TIMEOUT = int(os.getenv("API_TIMEOUT", "10"))
    # Token 从环境变量读取，代码里绝不出现明文
    TOKEN = os.getenv("API_TOKEN", "")
    ```

    `common/session.py`：

    ```python
    import logging
    import requests
    from config.settings import BASE_URL, TIMEOUT, TOKEN

    log = logging.getLogger(__name__)
    _session = requests.Session()

    def _init_session():
        """统一初始化：base_url、鉴权、超时。全项目共用一个 Session。"""
        _session.headers.update({
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        })

    _init_session()

    def request(method, path, **kwargs):
        url = f"{BASE_URL}{path}"
        kwargs.setdefault("timeout", TIMEOUT)
        log.info("→ %s %s %s", method, url, kwargs.get("json") or kwargs.get("params"))
        r = _session.request(method, url, **kwargs)
        log.info("← %s %s", r.status_code, r.text[:200])
        return r
    ```

    `common/assertions.py`：

    ```python
    def assert_protocol(r, expected_status=200):
        """协议层：HTTP 层面是否正确"""
        assert r.status_code == expected_status, \
            f"HTTP 状态码应为 {expected_status}，实际 {r.status_code}"

    def assert_business(r, expected_code=0):
        """业务层：业务码是否正确"""
        body = r.json()
        assert body.get("code") == expected_code, \
            f"业务码应为 {expected_code}，实际 {body.get('code')}，message={body.get('message')}"

    def assert_data(r, paths_and_values):
        """数据层：字段值是否符合预期"""
        body = r.json()["data"]
        for path, expected in paths_and_values.items():
            actual = body
            for k in path.split("."):
                actual = actual[k]
            assert actual == expected, f"{path} 应为 {expected}，实际 {actual}"
    ```

    `api/order_api.py`：

    ```python
    from common.session import request

    def create_order(product_id, quantity):
        return request("POST", "/api/order",
                       json={"productId": product_id, "quantity": quantity})

    def query_order(order_id):
        return request("GET", "/api/order/query", params={"orderId": order_id})

    def cancel_order(order_id):
        return request("POST", "/api/order/cancel", json={"orderId": order_id})
    ```

    **改写后的用例**（只表达业务意图，5 行一个）：

    ```python
    from api.order_api import create_order, cancel_order
    from common.assertions import assert_protocol, assert_business, assert_data

    def test_create_order():
        r = create_order(product_id=1001, quantity=1)
        assert_protocol(r)
        assert_business(r)
        assert_data(r, {"amount": 1299.00})

    def test_cancel_order():
        # 自己创建前置数据，不依赖其它用例
        created = create_order(product_id=1001, quantity=1)
        order_id = created.json()["data"]["orderId"]

        r = cancel_order(order_id)
        assert_protocol(r)
        assert_business(r)
    ```

    **第 4 题：消除用例间依赖**

    原脚本的问题：`test_cancel_order` **假设** `test_create_order` 已经跑过并留下订单。

    为什么是隐患：

    | 场景 | 后果 |
    |------|------|
    | 单独运行 `test_cancel_order` | 取消一个不存在的订单 → 失败（不是代码问题，是执行方式变了） |
    | pytest 改变执行顺序（随机插件等） | 同上 |
    | CI 并行执行（`-n auto`） | 两个用例可能不在同一进程/机器 |
    | 前面用例失败 | 后面用例连锁失败，掩盖真实缺陷数量 |

    改法：**每个用例自己准备前置数据**（用 fixture 更优雅）：

    ```python
    import pytest

    @pytest.fixture
    def order_id():
        """每个用例独立创建一个订单，保证数据隔离。"""
        r = create_order(product_id=1001, quantity=1)
        assert_business(r)
        return r.json()["data"]["orderId"]

    def test_cancel_order(order_id):
        r = cancel_order(order_id)
        assert_business(r)
    ```

    > 原则：**用例之间必须可以任意顺序、独立、并行执行**。任何"依赖上一步结果"的写法都是定时炸弹。

    **第 5 题：Token 管理**

    ```text
    推荐做法（优先级从高到低）：

    1. 会话级动态获取（推荐）：用登录接口拿 Token，缓存在 Session 级 fixture 里
       @pytest.fixture(scope="session")
       def token():
           r = request("POST", "/api/login",
                       json={"user": os.getenv("TEST_USER"),
                             "pwd": os.getenv("TEST_PWD")})
           return r.json()["data"]["token"]

    2. 环境变量：os.getenv("API_TOKEN")，本地用 .env（且 .env 必须进 .gitignore）

    3. CI Secret：在流水线里注入环境变量，不落盘

    绝对不要：
    - 把 Token 写进代码（会进 Git 历史，删了也还在）
    - 把 Token 打印进日志（会进 CI 日志，可能被他人看到）
    - 把 .env 提交到仓库
    ```

    对应的加载代码见第 3 题的 `config/settings.py`。

    **效果对比**：

    | 指标 | 重构前 | 重构后 |
    |------|--------|--------|
    | 新增一个用例 | ~30 行（复制 headers、URL、断言） | **3-5 行** |
    | 换测试环境 | 全文查找替换 URL | 改一个环境变量 |
    | Token 过期 | 逐个用例改 | 自动登录或改一个变量 |
    | 失败定位 | "断言错误" | 明确是协议层 / 业务层 / 数据层 |
    | 能否单独运行用例 | ❌ 有依赖 | ✅ 完全独立 |

    **结论**："能跑通"只证明脚本在**某一次特定条件下**可用；"可维护"才决定它能否活过下一个迭代。判断标准很简单：**新增一个用例需要改几行代码、改几个文件**——如果需要复制粘贴，就说明封装缺失。

---

## 下一步建议

::: v-pre
<div class="tutorial-next-steps" markdown="1">

### 完成检查

学完本教程后，检查自己是否能做到：

- [ ] 能使用 Requests 库发送 HTTP 请求
- [ ] 能使用 Pytest 编写测试用例
- [ ] 能使用 fixtures 管理测试数据
- [ ] 能使用参数化实现数据驱动
- [ ] 能使用 Allure 生成测试报告
- [ ] 能实现接口关联（提取 Token 等）

### 推荐下一步

根据你的学习进度，选择下一步：

1. **如果你想学 Web 自动化**：学习 [Selenium Web 自动化](Selenium-Web自动化教程-软件测试版.md)，掌握页面自动化
2. **如果你想学现代自动化**：学习 [Playwright Web 自动化](Playwright自动化测试教程-软件测试版.md)，掌握自动等待和网络拦截
3. **如果你想做项目实战**：进入 [接口自动化项目实战](../项目实战/接口自动化项目实战.md)，把知识串联起来

### 阶段测验

完成教程后，建议做 [Python 接口自动化测验](Python接口自动化测验.md) 检验学习效果。

### 通关检查

完成本阶段后，使用 [第4阶段-自动化测试通关](../学习中心/第4阶段-自动化测试通关.md) 检查是否可以进入下一阶段。

</div>
:::

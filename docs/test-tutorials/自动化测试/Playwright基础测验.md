---
description: Playwright 基础测验，检验自动等待、定位和 Page Object 掌握程度。
---
# Playwright 基础测验

!!! abstract "测验说明"
    本测验用于检验 Playwright 自动化测试教程的学习效果。共 12 道选择题，覆盖元素定位、等待机制、Page Object、API 测试和 CI 集成。

    📗 入门难度
    ⏱ 约 20 分钟
    📝 12 道题

!!! tip "测验反馈"
    提交答案后，系统会显示：

    - 得分和正确率
    - 错题分析和薄弱知识点
    - 复习建议和推荐教程
    - 下一步学习建议

---

## 选择题

Playwright 推荐的元素定位方式是？

 XPath
 CSS 选择器
 get_by_role / get_by_text / get_by_test_id
 id 选择器

💡 Playwright 推荐使用语义化定位器 `get_by_role`、`get_by_text`、`get_by_test_id`，更接近用户行为，维护成本低

Playwright 的自动等待机制会在操作前自动等待多久？

 5 秒
 30 秒（可配置）
 无限等待
 10 秒

💡 Playwright 默认操作超时为 30 秒，可通过 `page.set_default_timeout()` 或配置文件修改

以下哪种做法是 Playwright 的**不推荐**写法？

 `expect(locator).to_be_visible()`
 `get_by_role('button', name='提交')`
 `page.wait_for_load_state('networkidle')`
 `page.wait_for_timeout(5000)`

💡 `wait_for_timeout()` 是硬等待，不稳定。应使用 `expect()` 断言或 `wait_for_load_state()` 等条件等待

Page Object 模式的核心思想是？

 将页面元素和操作封装成类，测试代码调用类方法
 把所有页面写在一个文件里
 每个测试用例对应一个页面
 用页面截图代替代码断言

💡 Page Object 将页面元素定位和操作封装为类方法，测试用例只调用方法，实现"定位变更只改一处"

Playwright 使用哪个方法进行 API 请求测试？

 `page.request.get()`
 `browser.request.get()`
 `playwright.request.new_context()` 创建 API 请求上下文
 `context.request.get()` 且需要先打开一个页面

💡 Playwright 通过 `playwright.request.new_context()` 创建独立的 API 请求上下文，无需打开浏览器页面

`storage_state` 的作用是？

 保存浏览器的渲染状态
 保存/复用登录态（cookies、localStorage）
 保存页面截图
 保存网络请求记录

💡 `storage_state` 保存 cookies 和 localStorage，复用登录态可避免每条用例都执行登录流程

Playwright Trace 的作用是？

 记录测试执行过程，可回放失败现场（截图、网络、操作步骤）
 记录代码覆盖率
 记录性能指标
 记录终端输出日志

💡 Trace 记录每一步的截图、网络请求和 DOM 快照，通过 `playwright show-trace` 可回放失败现场

以下哪个是 Playwright 断言的正确写法？

 `assert page.title() == "首页"`
 `assert "home" in page.url`
 `expect(page).to_have_title("首页")`
 `page.assert_title("首页")`

💡 Playwright 使用 `expect()` 断言，自带自动重试机制，比 `assert` 更稳定

`browser_context` 和 `page` 的关系是？

 一对一，一个 context 只能有一个 page
 没有关系，各自独立
 page 包含 context
 一对多，一个 context 可以有多个 page（多标签页）

💡 `browser_context` 类似浏览器的无痕窗口，可包含多个 `page`（多个标签页），共享 cookies 和存储

Playwright 在 CI/CD 中运行时，推荐使用什么模式？

 有头模式（headed），方便调试
 无头模式（headless），不启动浏览器 UI
 必须连接远程 Selenium Grid
 只能本地运行，不支持 CI

💡 CI 环境没有显示器，必须用无头模式。Playwright 默认就是 headless，本地调试时可切换为 headed

UI 自动化测试的最佳实践是？

 UI 只覆盖核心路径，复杂数据校验下沉到接口层
 所有业务逻辑都用 UI 自动化覆盖
 每条用例都从登录页开始手动登录
 一个用例覆盖从注册到支付的完整链路

💡 测试金字塔原则：UI 层只覆盖核心用户路径，数据校验和边界测试放到接口层，降低维护成本

`codegen` 命令的作用是？

 编译 TypeScript 代码
 生成测试报告
 录制浏览器操作并自动生成测试代码
 压缩 JavaScript 文件

💡 `playwright codegen` 打开录制器，操作浏览器时自动生成对应的 Python/JS 测试代码，适合快速编写初始用例

提交答案

---

## 继续学习

完成测验后，建议继续学习：

- [Playwright 自动化测试教程](Playwright自动化测试教程-软件测试版.md) - 查看完整教程
- [Web 自动化项目实战](../项目实战/Web自动化项目实战.md) - Playwright 项目实战
- [Selenium Web 自动化教程](Selenium-Web自动化教程-软件测试版.md) - 对比学习 Selenium

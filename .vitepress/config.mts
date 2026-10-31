import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: "安且文档库",
  titleTemplate: ":title 👉 Anqie's Documents",
  description: "NeoForge 模组开发教程与中文文档、Java 学习笔记",
  base: "/documents/",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/documents/logo.ico' }]
  ],

  themeConfig: {
    siteTitle: "文档库",
    logo: '/logo.ico',
    outline: { level: [2, 3], label: '本页目录' },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    nav: [
      { text: '首页', link: '/index.md' },
      {
        text: '模组开发',
        activeMatch: '/docs/(dafeiyu-tutorial|neoforge-1.21.1)/',
        items: [
          { text: '大肥鱼 MC 教程（从零到发布）', link: '/docs/dafeiyu-tutorial/' },
          { text: 'NeoForge 1.21.1 中文文档', link: '/docs/neoforge-1.21.1/' },
          { text: '术语表', link: '/docs/dafeiyu-tutorial/08-附录/01-术语表' },
          { text: '常见报错手册', link: '/docs/dafeiyu-tutorial/08-附录/02-常见报错与排错手册' }
        ]
      },
      { text: 'Java 笔记', link: '/docs/devjava-zh/01-变量与数据类型', activeMatch: '/docs/devjava-zh/' },
      { text: '文档分类', link: '/category/categories' },
      { text: '关于', link: '/about' }
    ],

    sidebar: {
      '/docs/dafeiyu-tutorial/': [
        {
          text: "总览",
          link: "/docs/dafeiyu-tutorial/"
        },
        {
          text: "教程总览与学习路线",
          link: "/docs/dafeiyu-tutorial/00-教程总览与学习路线"
        },
        {
          text: "01 · 准备篇",
          collapsed: false,
          items: [
            {
              text: "开发环境搭建",
              link: "/docs/dafeiyu-tutorial/01-准备篇/01-开发环境搭建"
            },
            {
              text: "创建并运行第一个模组",
              link: "/docs/dafeiyu-tutorial/01-准备篇/02-创建并运行第一个模组"
            },
            {
              text: "项目结构与配置文件详解",
              link: "/docs/dafeiyu-tutorial/01-准备篇/03-项目结构与配置文件详解"
            }
          ]
        },
        {
          text: "02 · Java补充篇",
          collapsed: false,
          items: [
            {
              text: "注册代码里的泛型与Supplier",
              link: "/docs/dafeiyu-tutorial/02-Java补充篇/01-注册代码里的泛型与Supplier"
            },
            {
              text: "双冒号与方法引用",
              link: "/docs/dafeiyu-tutorial/02-Java补充篇/02-双冒号与方法引用"
            },
            {
              text: "Builder与链式调用",
              link: "/docs/dafeiyu-tutorial/02-Java补充篇/03-Builder与链式调用"
            },
            {
              text: "注解：@ 开头的那些标签",
              link: "/docs/dafeiyu-tutorial/02-Java补充篇/04-注解-@开头的那些标签"
            },
            {
              text: "record 与枚举：数据类的快捷写法",
              link: "/docs/dafeiyu-tutorial/02-Java补充篇/05-record与枚举-数据类的快捷写法"
            },
            {
              text: "Optional 与 @Nullable：空值处理",
              link: "/docs/dafeiyu-tutorial/02-Java补充篇/06-Optional与Nullable-空值处理"
            },
            {
              text: "其他常见写法速查",
              link: "/docs/dafeiyu-tutorial/02-Java补充篇/07-其他常见写法速查"
            }
          ]
        },
        {
          text: "03 · 核心概念篇",
          collapsed: false,
          items: [
            {
              text: "注册表与 DeferredRegister",
              link: "/docs/dafeiyu-tutorial/03-核心概念篇/01-注册表与DeferredRegister"
            },
            {
              text: "事件系统",
              link: "/docs/dafeiyu-tutorial/03-核心概念篇/02-事件系统"
            },
            {
              text: "侧：客户端与服务端",
              link: "/docs/dafeiyu-tutorial/03-核心概念篇/03-侧-客户端与服务端"
            },
            {
              text: "资源位置与命名空间",
              link: "/docs/dafeiyu-tutorial/03-核心概念篇/04-资源位置与命名空间"
            },
            {
              text: "数据组件",
              link: "/docs/dafeiyu-tutorial/03-核心概念篇/05-数据组件"
            }
          ]
        },
        {
          text: "04 · 内容制作篇",
          collapsed: false,
          items: [
            {
              text: "制作你的第一个物品",
              link: "/docs/dafeiyu-tutorial/04-内容制作篇/01-制作你的第一个物品"
            },
            {
              text: "制作你的第一个方块",
              link: "/docs/dafeiyu-tutorial/04-内容制作篇/02-制作你的第一个方块"
            },
            {
              text: "方块实体",
              link: "/docs/dafeiyu-tutorial/04-内容制作篇/03-方块实体"
            },
            {
              text: "创造模式物品栏",
              link: "/docs/dafeiyu-tutorial/04-内容制作篇/04-创造模式物品栏"
            },
            {
              text: "工具与盔甲",
              link: "/docs/dafeiyu-tutorial/04-内容制作篇/05-工具与盔甲"
            },
            {
              text: "食物与状态效果",
              link: "/docs/dafeiyu-tutorial/04-内容制作篇/06-食物与状态效果"
            }
          ]
        },
        {
          text: "05 · 资源与数据篇",
          collapsed: false,
          items: [
            {
              text: "资源包与数据包结构",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/01-资源包与数据包结构"
            },
            {
              text: "模型与纹理",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/02-模型与纹理"
            },
            {
              text: "语言文件与本地化",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/03-语言文件与本地化"
            },
            {
              text: "声音与粒子",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/04-声音与粒子"
            },
            {
              text: "数据生成",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/05-数据生成"
            },
            {
              text: "配方",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/06-配方"
            },
            {
              text: "战利品表",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/07-战利品表"
            },
            {
              text: "标签",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/08-标签"
            },
            {
              text: "进度",
              link: "/docs/dafeiyu-tutorial/05-资源与数据篇/09-进度"
            }
          ]
        },
        {
          text: "06 · 进阶篇",
          collapsed: false,
          items: [
            {
              text: "菜单与容器界面",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/01-菜单与容器界面"
            },
            {
              text: "能力与物品栏交互",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/02-能力与物品栏交互"
            },
            {
              text: "数据存储：NBT 与 SavedData",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/03-数据存储-NBT与SavedData"
            },
            {
              text: "Codec 与 StreamCodec",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/04-Codec与StreamCodec"
            },
            {
              text: "网络通信",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/05-网络通信"
            },
            {
              text: "世界生成",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/06-世界生成"
            },
            {
              text: "附魔与数据映射",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/07-附魔与数据映射"
            },
            {
              text: "Mixin与访问转换器",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/08-Mixin与访问转换器"
            },
            {
              text: "调试与游戏测试",
              link: "/docs/dafeiyu-tutorial/06-进阶篇/09-调试与游戏测试"
            }
          ]
        },
        {
          text: "07 · 实战篇",
          collapsed: false,
          items: [
            {
              text: "实战：从零做一个完整模组",
              link: "/docs/dafeiyu-tutorial/07-实战篇/01-实战-从零做一个完整模组"
            },
            {
              text: "性能优化与最佳实践",
              link: "/docs/dafeiyu-tutorial/07-实战篇/02-性能优化与最佳实践"
            },
            {
              text: "打包发布与版本管理",
              link: "/docs/dafeiyu-tutorial/07-实战篇/03-打包发布与版本管理"
            }
          ]
        },
        {
          text: "08 · 附录",
          collapsed: false,
          items: [
            {
              text: "术语表",
              link: "/docs/dafeiyu-tutorial/08-附录/01-术语表"
            },
            {
              text: "常见报错与排错手册",
              link: "/docs/dafeiyu-tutorial/08-附录/02-常见报错与排错手册"
            },
            {
              text: "学习资源与社区",
              link: "/docs/dafeiyu-tutorial/08-附录/03-学习资源与社区"
            }
          ]
        }
      ],
      '/docs/neoforge-1.21.1/': [
        {
          text: "总览",
          link: "/docs/neoforge-1.21.1/"
        },
        {
          text: "01 · 入门",
          collapsed: false,
          items: [
            {
              text: "NeoForge 入门",
              link: "/docs/neoforge-1.21.1/01-入门/01-NeoForge入门"
            },
            {
              text: "模组文件",
              link: "/docs/neoforge-1.21.1/01-入门/02-模组文件"
            },
            {
              text: "组织你的模组结构",
              link: "/docs/neoforge-1.21.1/01-入门/03-组织你的模组结构"
            },
            {
              text: "版本管理",
              link: "/docs/neoforge-1.21.1/01-入门/04-版本管理"
            }
          ]
        },
        {
          text: "02 · 核心概念",
          collapsed: false,
          items: [
            {
              text: "事件",
              link: "/docs/neoforge-1.21.1/02-核心概念/01-事件"
            },
            {
              text: "注册表",
              link: "/docs/neoforge-1.21.1/02-核心概念/02-注册表"
            },
            {
              text: "侧",
              link: "/docs/neoforge-1.21.1/02-核心概念/03-侧"
            }
          ]
        },
        {
          text: "03 · 方块",
          collapsed: false,
          items: [
            {
              text: "方块",
              link: "/docs/neoforge-1.21.1/03-方块/01-方块"
            },
            {
              text: "方块状态",
              link: "/docs/neoforge-1.21.1/03-方块/02-方块状态"
            }
          ]
        },
        {
          text: "04 · 物品",
          collapsed: false,
          items: [
            {
              text: "物品",
              link: "/docs/neoforge-1.21.1/04-物品/01-物品"
            },
            {
              text: "数据组件",
              link: "/docs/neoforge-1.21.1/04-物品/02-数据组件"
            },
            {
              text: "交互流程",
              link: "/docs/neoforge-1.21.1/04-物品/03-交互流程"
            },
            {
              text: "状态效果与药水",
              link: "/docs/neoforge-1.21.1/04-物品/04-状态效果与药水"
            },
            {
              text: "工具与盔甲",
              link: "/docs/neoforge-1.21.1/04-物品/05-工具与盔甲"
            }
          ]
        },
        {
          text: "05 · 方块实体",
          collapsed: false,
          items: [
            {
              text: "方块实体",
              link: "/docs/neoforge-1.21.1/05-方块实体/01-方块实体"
            },
            {
              text: "方块实体渲染器",
              link: "/docs/neoforge-1.21.1/05-方块实体/02-方块实体渲染器"
            }
          ]
        },
        {
          text: "06 · 资源",
          collapsed: false,
          items: [
            {
              text: "资源",
              link: "/docs/neoforge-1.21.1/06-资源/01-资源总览"
            },
            {
              text: "客户端",
              collapsed: true,
              items: [
                {
                  text: "国际化与本地化",
                  link: "/docs/neoforge-1.21.1/06-资源/02-客户端/01-国际化与本地化"
                },
                {
                  text: "粒子",
                  link: "/docs/neoforge-1.21.1/06-资源/02-客户端/02-粒子"
                },
                {
                  text: "声音",
                  link: "/docs/neoforge-1.21.1/06-资源/02-客户端/03-声音"
                },
                {
                  text: "纹理",
                  link: "/docs/neoforge-1.21.1/06-资源/02-客户端/04-纹理"
                },
                {
                  text: "模型",
                  collapsed: true,
                  items: [
                    {
                      text: "模型",
                      link: "/docs/neoforge-1.21.1/06-资源/02-客户端/05-模型/01-模型"
                    },
                    {
                      text: "烘焙模型",
                      link: "/docs/neoforge-1.21.1/06-资源/02-客户端/05-模型/02-烘焙模型"
                    },
                    {
                      text: "模型数据生成",
                      link: "/docs/neoforge-1.21.1/06-资源/02-客户端/05-模型/03-模型数据生成"
                    },
                    {
                      text: "自定义模型加载器",
                      link: "/docs/neoforge-1.21.1/06-资源/02-客户端/05-模型/04-自定义模型加载器"
                    }
                  ]
                }
              ]
            },
            {
              text: "服务端",
              collapsed: true,
              items: [
                {
                  text: "进度",
                  link: "/docs/neoforge-1.21.1/06-资源/03-服务端/01-进度"
                },
                {
                  text: "数据加载条件",
                  link: "/docs/neoforge-1.21.1/06-资源/03-服务端/02-数据加载条件"
                },
                {
                  text: "伤害类型与伤害来源",
                  link: "/docs/neoforge-1.21.1/06-资源/03-服务端/03-伤害类型与伤害来源"
                },
                {
                  text: "标签",
                  link: "/docs/neoforge-1.21.1/06-资源/03-服务端/04-标签"
                },
                {
                  text: "数据映射",
                  collapsed: true,
                  items: [
                    {
                      text: "数据映射",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/05-数据映射/01-数据映射"
                    },
                    {
                      text: "内置数据映射",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/05-数据映射/02-内置数据映射"
                    }
                  ]
                },
                {
                  text: "附魔",
                  collapsed: true,
                  items: [
                    {
                      text: "附魔",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/06-附魔/01-附魔"
                    },
                    {
                      text: "内置附魔效果组件",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/06-附魔/02-内置附魔效果组件"
                    }
                  ]
                },
                {
                  text: "战利品表",
                  collapsed: true,
                  items: [
                    {
                      text: "战利品表",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/07-战利品表/01-战利品表"
                    },
                    {
                      text: "自定义战利品对象",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/07-战利品表/02-自定义战利品对象"
                    },
                    {
                      text: "全局战利品修改器",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/07-战利品表/03-全局战利品修改器"
                    },
                    {
                      text: "战利品表条件",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/07-战利品表/04-战利品表条件"
                    },
                    {
                      text: "战利品表函数",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/07-战利品表/05-战利品表函数"
                    }
                  ]
                },
                {
                  text: "配方",
                  collapsed: true,
                  items: [
                    {
                      text: "配方",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/08-配方/01-配方"
                    },
                    {
                      text: "内置配方类型",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/08-配方/02-内置配方类型"
                    },
                    {
                      text: "原料",
                      link: "/docs/neoforge-1.21.1/06-资源/03-服务端/08-配方/03-原料"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: "07 · 物品栏与传输",
          collapsed: false,
          items: [
            {
              text: "能力（Capability）",
              link: "/docs/neoforge-1.21.1/07-物品栏与传输/01-能力"
            },
            {
              text: "容器（Container）",
              link: "/docs/neoforge-1.21.1/07-物品栏与传输/02-容器"
            }
          ]
        },
        {
          text: "08 · 数据存储",
          collapsed: false,
          items: [
            {
              text: "数据附件",
              link: "/docs/neoforge-1.21.1/08-数据存储/01-数据附件"
            },
            {
              text: "Codec",
              link: "/docs/neoforge-1.21.1/08-数据存储/02-Codec"
            },
            {
              text: "命名二进制标签（NBT）",
              link: "/docs/neoforge-1.21.1/08-数据存储/03-NBT"
            },
            {
              text: "存档数据",
              link: "/docs/neoforge-1.21.1/08-数据存储/04-存档数据"
            }
          ]
        },
        {
          text: "09 · GUI",
          collapsed: false,
          items: [
            {
              text: "菜单",
              link: "/docs/neoforge-1.21.1/09-GUI/01-菜单"
            },
            {
              text: "界面",
              link: "/docs/neoforge-1.21.1/09-GUI/02-界面"
            }
          ]
        },
        {
          text: "10 · 世界生成",
          collapsed: false,
          items: [
            {
              text: "生物群系修改器",
              link: "/docs/neoforge-1.21.1/10-世界生成/01-生物群系修改器"
            }
          ]
        },
        {
          text: "11 · 网络通信",
          collapsed: false,
          items: [
            {
              text: "网络通信",
              link: "/docs/neoforge-1.21.1/11-网络通信/01-网络通信"
            },
            {
              text: "注册载荷（Payload）",
              link: "/docs/neoforge-1.21.1/11-网络通信/02-注册载荷"
            },
            {
              text: "StreamCodec",
              link: "/docs/neoforge-1.21.1/11-网络通信/03-StreamCodec"
            },
            {
              text: "实体",
              link: "/docs/neoforge-1.21.1/11-网络通信/04-实体"
            },
            {
              text: "使用配置任务",
              link: "/docs/neoforge-1.21.1/11-网络通信/05-使用配置任务"
            }
          ]
        },
        {
          text: "12 · 高级主题",
          collapsed: false,
          items: [
            {
              text: "访问转换器（Access Transformer）",
              link: "/docs/neoforge-1.21.1/12-高级主题/01-访问转换器"
            },
            {
              text: "可扩展枚举",
              link: "/docs/neoforge-1.21.1/12-高级主题/02-可扩展枚举"
            }
          ]
        },
        {
          text: "13 · 杂项",
          collapsed: false,
          items: [
            {
              text: "配置",
              link: "/docs/neoforge-1.21.1/13-杂项/01-配置"
            },
            {
              text: "调试分析器",
              link: "/docs/neoforge-1.21.1/13-杂项/02-调试分析器"
            },
            {
              text: "游戏测试",
              link: "/docs/neoforge-1.21.1/13-杂项/03-游戏测试"
            },
            {
              text: "按键映射",
              link: "/docs/neoforge-1.21.1/13-杂项/04-按键映射"
            },
            {
              text: "资源位置",
              link: "/docs/neoforge-1.21.1/13-杂项/05-资源位置"
            },
            {
              text: "NeoForge 更新检查器",
              link: "/docs/neoforge-1.21.1/13-杂项/06-更新检查器"
            }
          ]
        }
      ],
      '/docs/devjava-zh/': [
        {
          text: 'Java基础',
          items: [
            { text: 'Java基础知识', link: '/docs/devjava-zh/01-变量与数据类型' },
            { text: 'Java集合框架', link: '/docs/devjava-zh/02-数组' },
            { text: 'Java多线程', link: '/docs/devjava-zh/03-运算符' },
            { text: 'Java网络编程', link: '/docs/devjava-zh/04-表达式语句与块' },
            { text: 'Java异常处理', link: '/docs/devjava-zh/05-控制流语句' },
            { text: 'Java输入输出', link: '/docs/devjava-zh/06-switch语句与表达式' },
            { text: '复习指引-后端面试', link: '/docs/devjava-zh/复习指引-后端面试' },
          ]
        },
        {
          text: '面向对象',
          items: [
            { text: '对象类继承接口与包', link: '/docs/devjava-zh/模块二-面向对象/01-对象类继承接口与包' },
            { text: '多态与抽象类', link: '/docs/devjava-zh/模块二-面向对象/02-继承深入' },
            { text: '内部类与匿名类', link: '/docs/devjava-zh/模块二-面向对象/03-接口深入' },
          ]
        },
        {
          text: '泛型与Lambda',
          items: [
            { text: '泛型', link: '/docs/devjava-zh/模块三-泛型与Lambda/01-泛型' },
            { text: 'Lambda表达式', link: '/docs/devjava-zh/模块三-泛型与Lambda/02-类型推断通配符与函数式实战' },
          ]
        },
        {
          text: '集合框架',
          items: [
            { text: '集合框架', link: '/docs/devjava-zh/模块四-集合框架/01-集合框架' },
          ]
        },
        {
          text: 'Stream与Optional',
          items: [
            { text: 'Stream与Optional', link: '/docs/devjava-zh/模块五-Stream与Optional/01-Stream与Optional' },
          ]
        },
        {
          text: '异常处理',
          items: [
            { text: '异常处理', link: '/docs/devjava-zh/模块六-异常处理/01-异常处理' },
          ]
        },
        {
          text: '数字与字符串',
          items: [
            { text: '数字与字符串', link: '/docs/devjava-zh/模块七-数字与字符串/01-数字与字符串' },
          ]
        },
        {
          text: 'Java IO',
          items: [
            { text: 'Java IO', link: '/docs/devjava-zh/模块八-JavaIO/01-JavaIO' },
          ]
        },
        {
          text: '新特性',
          items: [
            { text: 'Records与模式匹配', link: '/docs/devjava-zh/模块九-新特性/01-Records与模式匹配' },
          ]
        },
        {
          text: '注解',
          items: [
            { text: '注解', link: '/docs/devjava-zh/模块十-注解/01-注解' },
          ]
        },
        {
          text: '虚拟线程',
          items: [
            { text: '虚拟线程', link: '/docs/devjava-zh/模块十一-虚拟线程/01-虚拟线程' },
          ]
        },
        {
          text: '日期时间',
          items: [
            { text: '日期时间 API', link: '/docs/devjava-zh/模块十二-日期时间/01-日期时间API' },
          ]
        },
        {
          text: '正则表达式',
          items: [
            { text: '正则表达式', link: '/docs/devjava-zh/模块十三-正则表达式/01-正则表达式' },
          ]
        },
        {
          text: '反射 API',
          items: [
            { text: '反射 API', link: '/docs/devjava-zh/模块十四-反射API/01-反射API' },
          ]
        },
        {
          text: '模块系统',
          items: [
            { text: '模块系统 JPMS', link: '/docs/devjava-zh/模块十五-模块系统/01-模块系统JPMS' },
          ]
        },
        {
          text: '集合框架深入',
          items: [
            { text: '集合框架深入', link: '/docs/devjava-zh/模块十六-集合框架深入/01-集合框架深入' },
          ]
        },
        {
          text: '类与对象深入',
          items: [
            { text: '类与对象深入', link: '/docs/devjava-zh/模块十七-类与对象深入/01-类与对象深入' },
          ]
        }
      ]
    },

    docFooter: { prev: '上一篇', next: '下一篇' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    lastUpdatedText: '最后更新',
    externalLinkIcon: true,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Q-Anqie/documents' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present <a href="https://q-anqie.github.io">Anqie</a>'
    }
  }
})

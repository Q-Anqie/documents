import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: "安且文档库",
  titleTemplate: ":title 👉 Anqie's Documents",
  description: "个人文档仓库：NeoForge 中文文档、模组开发教程、Java 笔记、软件测试知识体系",
  base: "/documents/",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/documents/logo.ico' }],
    ['meta', { name: 'theme-color', content: '#4f46e5' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '安且文档库 · 个人文档仓库' }],
    ['meta', { property: 'og:description', content: '个人文档仓库：NeoForge 中文文档、模组开发教程、Java 笔记、软件测试知识体系' }]
  ],

  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
    lineNumbers: false
  },

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
        text: '文档',
        activeMatch: '/docs/(dafeiyu-tutorial|neoforge-1.21.1)/',
        items: [
          { text: 'MC 模组开发教程', link: '/docs/dafeiyu-tutorial/' },
          { text: 'NeoForge 1.21.1 中文文档', link: '/docs/neoforge-1.21.1/' },
          { text: '术语表', link: '/docs/dafeiyu-tutorial/08-附录/01-术语表' },
          { text: '常见报错手册', link: '/docs/dafeiyu-tutorial/08-附录/02-常见报错与排错手册' }
        ]
      },
      { text: 'Java 笔记', link: '/docs/devjava-zh/01-变量与数据类型', activeMatch: '/docs/devjava-zh/' },
      { text: '软件测试', link: '/docs/test-tutorials/', activeMatch: '/docs/test-tutorials/' },
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
      '/docs/test-tutorials/': [
      {
            text: "总览",
            link: "/docs/test-tutorials/"
      },
      {
            text: "学习路线",
            link: "/docs/test-tutorials/学习路线"
      },
      {
            text: "学习中心",
            collapsed: false,
            items: [
                  {
                        text: "学习中心首页",
                        link: "/docs/test-tutorials/学习中心"
                  },
                  {
                        text: "在线编程练习场",
                        link: "/docs/test-tutorials/学习中心/在线编程练习场"
                  },
                  {
                        text: "学习进度说明",
                        link: "/docs/test-tutorials/学习中心/学习进度说明"
                  },
                  {
                        text: "第1阶段-测试入门通关",
                        link: "/docs/test-tutorials/学习中心/第1阶段-测试入门通关"
                  },
                  {
                        text: "第2阶段-工具实战通关",
                        link: "/docs/test-tutorials/学习中心/第2阶段-工具实战通关"
                  },
                  {
                        text: "第3阶段-专项测试通关",
                        link: "/docs/test-tutorials/学习中心/第3阶段-专项测试通关"
                  },
                  {
                        text: "第4阶段-自动化测试通关",
                        link: "/docs/test-tutorials/学习中心/第4阶段-自动化测试通关"
                  },
                  {
                        text: "第5阶段-项目面试通关",
                        link: "/docs/test-tutorials/学习中心/第5阶段-项目面试通关"
                  }
            ]
      },
      {
            text: "01 · 基础理论",
            collapsed: false,
            items: [
                  {
                        text: "软件测试理论基础教程",
                        link: "/docs/test-tutorials/基础理论/软件测试理论基础教程"
                  },
                  {
                        text: "软件测试理论基础测验",
                        link: "/docs/test-tutorials/基础理论/软件测试理论基础测验"
                  },
                  {
                        text: "ISTQB软件测试术语速查",
                        link: "/docs/test-tutorials/基础理论/ISTQB软件测试术语速查"
                  },
                  {
                        text: "ISTQB术语速查测验",
                        link: "/docs/test-tutorials/基础理论/ISTQB术语速查测验"
                  },
                  {
                        text: "测试金字塔与自动化分层策略",
                        link: "/docs/test-tutorials/基础理论/测试金字塔与自动化分层策略"
                  },
                  {
                        text: "测试金字塔测验",
                        link: "/docs/test-tutorials/基础理论/测试金字塔测验"
                  },
                  {
                        text: "探索式测试教程",
                        link: "/docs/test-tutorials/基础理论/探索式测试教程-软件测试版"
                  },
                  {
                        text: "探索式测试测验",
                        link: "/docs/test-tutorials/基础理论/探索式测试测验"
                  },
                  {
                        text: "敏捷测试教程",
                        link: "/docs/test-tutorials/基础理论/敏捷测试教程-软件测试版"
                  },
                  {
                        text: "敏捷测试测验",
                        link: "/docs/test-tutorials/基础理论/敏捷测试测验"
                  },
                  {
                        text: "测试用例设计方法论教程",
                        link: "/docs/test-tutorials/基础理论/测试用例设计方法论教程-软件测试版"
                  },
                  {
                        text: "测试用例设计测验",
                        link: "/docs/test-tutorials/基础理论/测试用例设计测验"
                  },
                  {
                        text: "Python基础教程",
                        link: "/docs/test-tutorials/基础理论/Python基础教程-软件测试版"
                  },
                  {
                        text: "Python基础测验",
                        link: "/docs/test-tutorials/基础理论/Python基础测验"
                  },
                  {
                        text: "前端基础教程",
                        link: "/docs/test-tutorials/基础理论/前端基础教程-软件测试版"
                  },
                  {
                        text: "前端基础测验",
                        link: "/docs/test-tutorials/基础理论/前端基础测验"
                  },
                  {
                        text: "JavaScript基础教程",
                        link: "/docs/test-tutorials/基础理论/JavaScript基础教程-软件测试版"
                  },
                  {
                        text: "JavaScript基础测验",
                        link: "/docs/test-tutorials/基础理论/JavaScript基础测验"
                  },
                  {
                        text: "TypeScript基础教程",
                        link: "/docs/test-tutorials/基础理论/TypeScript基础教程-软件测试版"
                  },
                  {
                        text: "TypeScript基础测验",
                        link: "/docs/test-tutorials/基础理论/TypeScript基础测验"
                  }
            ]
      },
      {
            text: "02 · 工具操作",
            collapsed: false,
            items: [
                  {
                        text: "数据库SQL教程",
                        link: "/docs/test-tutorials/工具操作/数据库SQL教程-软件测试版"
                  },
                  {
                        text: "SQL基础测验",
                        link: "/docs/test-tutorials/工具操作/SQL基础测验"
                  },
                  {
                        text: "Redis与MongoDB教程",
                        link: "/docs/test-tutorials/工具操作/Redis与MongoDB教程-软件测试版"
                  },
                  {
                        text: "Redis与MongoDB测验",
                        link: "/docs/test-tutorials/工具操作/Redis与MongoDB测验"
                  },
                  {
                        text: "Linux实用教程",
                        link: "/docs/test-tutorials/工具操作/Linux实用教程-软件测试版"
                  },
                  {
                        text: "Linux基础测验",
                        link: "/docs/test-tutorials/工具操作/Linux基础测验"
                  },
                  {
                        text: "Git版本控制教程",
                        link: "/docs/test-tutorials/工具操作/Git版本控制教程-软件测试版"
                  },
                  {
                        text: "Git基础测验",
                        link: "/docs/test-tutorials/工具操作/Git基础测验"
                  },
                  {
                        text: "Docker容器教程",
                        link: "/docs/test-tutorials/工具操作/Docker容器教程-软件测试版"
                  },
                  {
                        text: "Docker基础测验",
                        link: "/docs/test-tutorials/工具操作/Docker基础测验"
                  },
                  {
                        text: "Fiddler抓包教程",
                        link: "/docs/test-tutorials/工具操作/Fiddler抓包教程-软件测试版"
                  },
                  {
                        text: "Fiddler抓包测验",
                        link: "/docs/test-tutorials/工具操作/Fiddler抓包测验"
                  },
                  {
                        text: "Charles抓包教程",
                        link: "/docs/test-tutorials/工具操作/Charles抓包教程-软件测试版"
                  },
                  {
                        text: "Charles抓包测验",
                        link: "/docs/test-tutorials/工具操作/Charles抓包测验"
                  },
                  {
                        text: "接口抓包联调实战教程",
                        link: "/docs/test-tutorials/工具操作/接口抓包联调实战教程-软件测试版"
                  },
                  {
                        text: "接口抓包联调测验",
                        link: "/docs/test-tutorials/工具操作/接口抓包联调测验"
                  },
                  {
                        text: "Postman接口测试教程",
                        link: "/docs/test-tutorials/工具操作/Postman接口测试教程-软件测试版"
                  },
                  {
                        text: "Postman接口测试测验",
                        link: "/docs/test-tutorials/工具操作/Postman接口测试测验"
                  },
                  {
                        text: "正则表达式教程",
                        link: "/docs/test-tutorials/工具操作/正则表达式教程-软件测试版"
                  },
                  {
                        text: "正则表达式速查表",
                        link: "/docs/test-tutorials/工具操作/正则表达式速查表-软件测试版"
                  },
                  {
                        text: "正则表达式测验",
                        link: "/docs/test-tutorials/工具操作/正则表达式测验"
                  },
                  {
                        text: "网络知识教程",
                        link: "/docs/test-tutorials/工具操作/网络知识教程-软件测试版"
                  },
                  {
                        text: "网络知识测验",
                        link: "/docs/test-tutorials/工具操作/网络知识测验"
                  },
                  {
                        text: "禅道与Jira实战教程",
                        link: "/docs/test-tutorials/工具操作/禅道与Jira实战教程-软件测试版"
                  },
                  {
                        text: "禅道与Jira测验",
                        link: "/docs/test-tutorials/工具操作/禅道与Jira测验"
                  }
            ]
      },
      {
            text: "03 · 专项测试",
            collapsed: false,
            items: [
                  {
                        text: "接口测试完整教程",
                        link: "/docs/test-tutorials/专项测试/接口测试完整教程-软件测试版"
                  },
                  {
                        text: "接口测试基础测验",
                        link: "/docs/test-tutorials/专项测试/接口测试基础测验"
                  },
                  {
                        text: "接口测试进阶测验",
                        link: "/docs/test-tutorials/专项测试/接口测试进阶测验"
                  },
                  {
                        text: "JMeter性能测试教程",
                        link: "/docs/test-tutorials/专项测试/JMeter性能测试教程-软件测试版"
                  },
                  {
                        text: "JMeter性能测试测验",
                        link: "/docs/test-tutorials/专项测试/JMeter性能测试测验"
                  },
                  {
                        text: "Web安全测试教程",
                        link: "/docs/test-tutorials/专项测试/Web安全测试教程-软件测试版"
                  },
                  {
                        text: "Web安全测试测验",
                        link: "/docs/test-tutorials/专项测试/Web安全测试测验"
                  },
                  {
                        text: "AI辅助测试教程",
                        link: "/docs/test-tutorials/专项测试/AI辅助测试教程-软件测试版"
                  },
                  {
                        text: "AI辅助测试测验",
                        link: "/docs/test-tutorials/专项测试/AI辅助测试测验"
                  },
                  {
                        text: "测试左右移教程",
                        link: "/docs/test-tutorials/专项测试/测试左右移教程-软件测试版"
                  },
                  {
                        text: "测试左右移测验",
                        link: "/docs/test-tutorials/专项测试/测试左右移测验"
                  },
                  {
                        text: "移动端专项测试教程",
                        link: "/docs/test-tutorials/专项测试/移动端专项测试教程-软件测试版"
                  },
                  {
                        text: "移动端专项测试测验",
                        link: "/docs/test-tutorials/专项测试/移动端专项测试测验"
                  },
                  {
                        text: "小程序与H5测试教程",
                        link: "/docs/test-tutorials/专项测试/小程序与H5测试教程-软件测试版"
                  },
                  {
                        text: "小程序与H5测试测验",
                        link: "/docs/test-tutorials/专项测试/小程序与H5测试测验"
                  }
            ]
      },
      {
            text: "04 · 自动化测试",
            collapsed: false,
            items: [
                  {
                        text: "Python接口自动化教程",
                        link: "/docs/test-tutorials/自动化测试/Python+Requests+Allure接口自动化教程-软件测试版"
                  },
                  {
                        text: "Python接口自动化测验",
                        link: "/docs/test-tutorials/自动化测试/Python接口自动化测验"
                  },
                  {
                        text: "Selenium Web自动化教程",
                        link: "/docs/test-tutorials/自动化测试/Selenium-Web自动化教程-软件测试版"
                  },
                  {
                        text: "Selenium基础测验",
                        link: "/docs/test-tutorials/自动化测试/Selenium基础测验"
                  },
                  {
                        text: "Playwright自动化测试教程",
                        link: "/docs/test-tutorials/自动化测试/Playwright自动化测试教程-软件测试版"
                  },
                  {
                        text: "Playwright基础测验",
                        link: "/docs/test-tutorials/自动化测试/Playwright基础测验"
                  },
                  {
                        text: "Appium App自动化教程",
                        link: "/docs/test-tutorials/自动化测试/Appium-App自动化教程-软件测试版"
                  },
                  {
                        text: "Appium基础测验",
                        link: "/docs/test-tutorials/自动化测试/Appium基础测验"
                  },
                  {
                        text: "测试框架设计与设计模式教程",
                        link: "/docs/test-tutorials/自动化测试/测试框架设计与设计模式教程"
                  },
                  {
                        text: "测试框架设计测验",
                        link: "/docs/test-tutorials/自动化测试/测试框架设计测验"
                  }
            ]
      },
      {
            text: "05 · 项目实战",
            collapsed: false,
            items: [
                  {
                        text: "项目实战总览",
                        link: "/docs/test-tutorials/项目实战/"
                  },
                  {
                        text: "练习靶场与工具清单",
                        link: "/docs/test-tutorials/项目实战/练习靶场与工具清单"
                  },
                  {
                        text: "电商系统测试实战",
                        link: "/docs/test-tutorials/项目实战/电商系统测试实战"
                  },
                  {
                        text: "电商系统测试实战测验",
                        link: "/docs/test-tutorials/项目实战/电商系统测试实战测验"
                  },
                  {
                        text: "接口自动化项目实战",
                        link: "/docs/test-tutorials/项目实战/接口自动化项目实战"
                  },
                  {
                        text: "接口自动化项目实战测验",
                        link: "/docs/test-tutorials/项目实战/接口自动化项目实战测验"
                  },
                  {
                        text: "Web自动化项目实战",
                        link: "/docs/test-tutorials/项目实战/Web自动化项目实战"
                  },
                  {
                        text: "Web自动化项目实战测验",
                        link: "/docs/test-tutorials/项目实战/Web自动化项目实战测验"
                  },
                  {
                        text: "性能测试项目实战",
                        link: "/docs/test-tutorials/项目实战/性能测试项目实战"
                  },
                  {
                        text: "性能测试项目实战测验",
                        link: "/docs/test-tutorials/项目实战/性能测试项目实战测验"
                  },
                  {
                        text: "CICD自动化回归实战",
                        link: "/docs/test-tutorials/项目实战/CICD自动化回归实战"
                  },
                  {
                        text: "CICD自动化回归测验",
                        link: "/docs/test-tutorials/项目实战/CICD自动化回归测验"
                  }
            ]
      },
      {
            text: "06 · 持续集成",
            collapsed: false,
            items: [
                  {
                        text: "Jenkins CI/CD教程",
                        link: "/docs/test-tutorials/持续集成/Jenkins-CICD教程-软件测试版"
                  },
                  {
                        text: "GitHub Actions教程",
                        link: "/docs/test-tutorials/持续集成/GitHub-Actions教程-软件测试版"
                  },
                  {
                        text: "GitLab CI/CD教程",
                        link: "/docs/test-tutorials/持续集成/GitLab-CICD教程-软件测试版"
                  },
                  {
                        text: "持续集成测验",
                        link: "/docs/test-tutorials/持续集成/持续集成测验"
                  }
            ]
      },
      {
            text: "07 · 模板库",
            collapsed: false,
            items: [
                  {
                        text: "模板库总览",
                        link: "/docs/test-tutorials/模板库/"
                  },
                  {
                        text: "测试计划模板",
                        link: "/docs/test-tutorials/模板库/测试计划模板"
                  },
                  {
                        text: "测试用例模板",
                        link: "/docs/test-tutorials/模板库/测试用例模板"
                  },
                  {
                        text: "接口测试用例模板",
                        link: "/docs/test-tutorials/模板库/接口测试用例模板"
                  },
                  {
                        text: "缺陷报告模板",
                        link: "/docs/test-tutorials/模板库/缺陷报告模板"
                  },
                  {
                        text: "测试报告模板",
                        link: "/docs/test-tutorials/模板库/测试报告模板"
                  },
                  {
                        text: "上线检查清单",
                        link: "/docs/test-tutorials/模板库/上线检查清单"
                  }
            ]
      },
      {
            text: "08 · 案例库",
            collapsed: false,
            items: [
                  {
                        text: "案例库总览",
                        link: "/docs/test-tutorials/案例库/"
                  },
                  {
                        text: "登录功能测试案例",
                        link: "/docs/test-tutorials/案例库/登录功能测试案例"
                  },
                  {
                        text: "购物车测试案例",
                        link: "/docs/test-tutorials/案例库/购物车测试案例"
                  },
                  {
                        text: "下单支付测试案例",
                        link: "/docs/test-tutorials/案例库/下单支付测试案例"
                  },
                  {
                        text: "权限控制测试案例",
                        link: "/docs/test-tutorials/案例库/权限控制测试案例"
                  },
                  {
                        text: "文件上传测试案例",
                        link: "/docs/test-tutorials/案例库/文件上传测试案例"
                  },
                  {
                        text: "搜索功能测试案例",
                        link: "/docs/test-tutorials/案例库/搜索功能测试案例"
                  },
                  {
                        text: "消息通知测试案例",
                        link: "/docs/test-tutorials/案例库/消息通知测试案例"
                  },
                  {
                        text: "多语言国际化测试案例",
                        link: "/docs/test-tutorials/案例库/多语言国际化测试案例"
                  },
                  {
                        text: "兼容性测试案例",
                        link: "/docs/test-tutorials/案例库/兼容性测试案例-软件测试版"
                  },
                  {
                        text: "安全测试案例",
                        link: "/docs/test-tutorials/案例库/安全测试案例-软件测试版"
                  },
                  {
                        text: "性能测试案例",
                        link: "/docs/test-tutorials/案例库/性能测试案例-软件测试版"
                  }
            ]
      },
      {
            text: "09 · 面试专题",
            collapsed: false,
            items: [
                  {
                        text: "面试专题总览",
                        link: "/docs/test-tutorials/面试专题/"
                  },
                  {
                        text: "软件测试面试题",
                        link: "/docs/test-tutorials/面试专题/软件测试面试题"
                  },
                  {
                        text: "接口测试面试题",
                        link: "/docs/test-tutorials/面试专题/接口测试面试题"
                  },
                  {
                        text: "自动化测试面试题",
                        link: "/docs/test-tutorials/面试专题/自动化测试面试题"
                  },
                  {
                        text: "性能测试面试题",
                        link: "/docs/test-tutorials/面试专题/性能测试面试题"
                  },
                  {
                        text: "安全测试面试题",
                        link: "/docs/test-tutorials/面试专题/安全测试面试题"
                  },
                  {
                        text: "移动端测试面试题",
                        link: "/docs/test-tutorials/面试专题/移动端测试面试题"
                  },
                  {
                        text: "AI测试面试题",
                        link: "/docs/test-tutorials/面试专题/AI测试面试题"
                  },
                  {
                        text: "测试管理面试题",
                        link: "/docs/test-tutorials/面试专题/测试管理面试题"
                  },
                  {
                        text: "数据库SQL面试题",
                        link: "/docs/test-tutorials/面试专题/数据库SQL面试题"
                  },
                  {
                        text: "Linux面试题",
                        link: "/docs/test-tutorials/面试专题/Linux面试题"
                  },
                  {
                        text: "CICD面试题",
                        link: "/docs/test-tutorials/面试专题/CICD面试题"
                  },
                  {
                        text: "项目经验表达",
                        link: "/docs/test-tutorials/面试专题/项目经验表达"
                  },
                  {
                        text: "面试复盘清单",
                        link: "/docs/test-tutorials/面试专题/面试复盘清单"
                  },
                  {
                        text: "简历撰写与项目包装",
                        link: "/docs/test-tutorials/面试专题/简历撰写与项目包装"
                  },
                  {
                        text: "岗位JD对照与投递策略",
                        link: "/docs/test-tutorials/面试专题/岗位JD对照与投递策略"
                  },
                  {
                        text: "测试岗位技能对照与补课指南",
                        link: "/docs/test-tutorials/面试专题/测试岗位技能对照与补课指南"
                  },
                  {
                        text: "面试流程与谈薪",
                        link: "/docs/test-tutorials/面试专题/面试流程与谈薪"
                  },
                  {
                        text: "测试职业发展路线图",
                        link: "/docs/test-tutorials/面试专题/测试职业发展路线图-软件测试版"
                  }
            ]
      },
      {
            text: "学习辅助",
            collapsed: true,
            items: [
                  {
                        text: "工具选型指南",
                        link: "/docs/test-tutorials/工具选型指南"
                  },
                  {
                        text: "阶段学习检查清单",
                        link: "/docs/test-tutorials/阶段学习检查清单"
                  },
                  {
                        text: "学习验收与通关路径",
                        link: "/docs/test-tutorials/学习验收与通关路径"
                  },
                  {
                        text: "练习总览",
                        link: "/docs/test-tutorials/练习总览"
                  },
                  {
                        text: "章节练习与参考答案",
                        link: "/docs/test-tutorials/章节练习与参考答案"
                  },
                  {
                        text: "更新日志",
                        link: "/docs/test-tutorials/CHANGELOG"
                  }
            ]
      }
],

    docFooter: { prev: '上一篇', next: '下一篇' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    lastUpdatedText: '最后更新',
    externalLinkIcon: true,

    editLink: {
      pattern: 'https://github.com/Q-Anqie/documents/edit/main/:path',
      text: '在 GitHub 上编辑此页'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Q-Anqie/documents' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present <a href="https://q-anqie.github.io">Anqie</a>'
    }
  }
})

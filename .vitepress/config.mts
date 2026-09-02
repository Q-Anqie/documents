import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: "安且文档库",
  titleTemplate: ":title 👉 Anqie's Documents",
  description: "神秘的文档打野点",
  base: "/documents/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {

    // default base config

    siteTitle: "文档库",
    logo: '/logo.ico',
    outline: 'deep',

    // layout config

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present <a href="https://q-anqie.github.io">Anqie</a>'
    },

    nav: [
      { text: '首页', link: '/index.md' },
      { text: '文档分类', link: '/category/categories' },
      { text: '关于', link: '/about' },
    ],

    sidebar: {
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
    }
  }
})
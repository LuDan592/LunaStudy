# LunaStudy

护理课程复习平台（纯静态网站，GitHub Pages 部署）。

## 加一课

1. 在 `content/<课程文件夹>/` 新建一个 `.md` 文件，例如 `02-infection-control.md`（文件名开头的数字只是方便排序）。
2. 新课程就新建文件夹，并放一个 `course.json`：`{ "title": "中文名", "en": "English name", "desc": "简介", "order": 2 }`。
3. 推送到 main，GitHub Actions 会先检查格式，通过后自动上线。文件名以 `_` 开头的是草稿，不会上线。

本地预览：`npm install` 后 `npm run dev`；只检查内容：`npm run check`。

## 一课的格式

开头 `---` 之间是信息块（YAML）：

- `title` / `en` / `order` / `summary`
- `terms`：术语卡，`{ zh, en, note }`
- `quiz`：自测题 5–10 道
  - 选择题：`type: mcq`，`options` 每项 `{ text, why }`（why 写为什么对 / 错），`answer: B`，`explain`
  - 简答题：`type: short`，`answer` 参考答案，`points` 得分点列表

正文是 Markdown，另外支持：

```
:::why            因为…所以…
:::alt 标题        难点的第二种讲法（折叠）
:::q 标题          课件题目，显示【题】
:::ans            答案与解析（折叠，放在 :::q 里）
:::warn 标题       注意 / 易错点
:::               结束
```

写法规范：中文讲解，中文术语后面跟加粗英文（葡萄糖 **glucose**）；每个知识点写「因为…所以…」；课件内容不删；课件题目全部给答案并说明错误选项。

## 隐私

- 仓库是公开的：只放整理后的笔记，不放课件原文件（PDF / PPT 等已在 .gitignore 里拦住，构建检查也会拦）。
- 学习记录只存在浏览器 localStorage，不进仓库。可在「设置与备份」导出 / 导入 JSON。

# hexo-theme-tty

暖色终端风格的 Hexo 主题，配色和版式参考 [claude.dev](https://claude.dev/blog/)：暖黑底、米白字、陶土橙强调色，导航、标签、目录都用等宽字体。主题里没有用到 Anthropic 的字体、图标或其他素材。

## 功能

- 页面：首页（第一篇用大卡片，标签筛选栏）、文章、归档（年 / 月）、单个标签、标签总览、404。标签总览和 404 由主题生成，不需要在 `source/` 里建页面。
- 文章：树形目录、阅读进度、阅读时长、标题锚点、代码块（语言标签、复制按钮、行号）、脚注、图片点击放大。
- 每篇文章有一个像素图标，按标签或目录自动选，也可以在 front matter 里指定，见下文。
- 站内搜索：生成 `search.json`，按 `S` 或 `/` 打开。
- 深浅色：默认跟随系统，可手动切换并记住选择。
- 快捷键：`H` 首页、`A` 归档、`T` 标签、`S` 搜索。
- 可选：[vercount](https://vercount.one) 访问统计、页脚构建时间。
- 不依赖任何前端库或构建工具：模板是 EJS，样式是原生 CSS，脚本是原生 JS。字体随主题自带。

## 安装

站点需要 Hexo 7 和 `hexo-renderer-ejs`。

```bash
git submodule add https://github.com/Sakura286/hexo-theme-tty.git themes/tty
```

站点 `_config.yml` 里设置 `theme: tty`。主题配置写在站点根目录的 `_config.tty.yml`，会覆盖主题 `_config.yml` 里的同名项，可配置项见该文件里的注释。

代码高亮用 Hexo 自带的 highlight.js，并且需要 `hljs: true`：

```yaml
highlight:
  enable: true
  line_number: true
  hljs: true
```

## 文章图标

文章页、首页大卡片和列表里的像素图标按以下顺序选：

1. front matter 里的 `icon: 图标名`；
2. `post_icon.map` 里从上往下第一个命中的项，键是标签名或 `source/_posts/` 下的子目录名，不区分大小写；
3. `post_icon.default`，默认是 `doc`。

内置图标：`doc` `box` `term` `moto` `shapes` `question` `gear` `chip`。写 `identicon` 则按 slug 生成随机的对称点阵。

```yaml
# _config.tty.yml
post_icon:
  map:
    motor: moto
    debian: box
    linux: term
  custom:            # 自己画的图标，'#' 为实心，最大 14x14，会自动居中
    heart:
      - '.##.##.'
      - '#######'
      - '.#####.'
      - '..###..'
      - '...#...'
```

内置图标的点阵在 `scripts/icons.js`。

## 脚注

`hexo-renderer-marked` 不支持脚注，主题在 Markdown 渲染前处理：

```markdown
正文[^1]。

[^1]: 脚注内容，可以包含 [链接](https://example.com)。
    缩进的行算作同一条脚注的续行。
```

编号按正文里第一次引用的顺序重新编，没有被引用的定义也会列在最后。代码块和行内代码里的 `[^1]` 不会被处理。不需要时设 `footnote: false`。

## 结构

```
layout/          EJS 模板；_partial/ 是公共片段
languages/       zh-cn.yml、en.yml、default.yml，文件名必须和站点 language 完全一致
scripts/
  helpers.js     文章图标、阅读时长、构建时间等 helper
  icons.js       内置图标的点阵
  footnote.js    脚注（before_post_render）
  generators.js  search.json、标签总览页、404 页
source/
  css/tty.css    全部样式，颜色都是 :root 上的 CSS 变量
  js/tty.js      深浅色、搜索、快捷键、目录高亮、代码复制、图片放大
  fonts/         Geist、JetBrains Mono（拉丁字符子集）及其许可证
```

## 许可证

主题代码使用 [MIT](LICENSE)。字体 Geist 和 JetBrains Mono 使用 SIL Open Font License 1.1，许可证在 `source/fonts/` 下。

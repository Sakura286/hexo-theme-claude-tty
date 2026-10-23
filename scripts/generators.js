/* global hexo */
'use strict';

function stripHTML(html) {
  return html
    .replace(/<td class="gutter">[\s\S]*?<\/td>/g, '')
    .replace(/<a class="fn-back"[\s\S]*?<\/a>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (m, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// 站内搜索的索引
hexo.extend.generator.register('tty_search', function (locals) {
  const conf = this.theme.config.search || {};
  if (!conf.enable) return [];
  const { root } = this.config;
  const data = locals.posts.sort('-date').map(post => ({
    title: post.title,
    url: encodeURI(root + post.path),
    date: post.date.format('YYYY-MM-DD'),
    tags: post.tags.map(tag => tag.name),
    content: stripHTML(post.content)
  }));
  return { path: conf.path || 'search.json', data: JSON.stringify(data) };
});

// 标签总览页和 404 页，主题自己生成，不需要在 source/ 里建页面
hexo.extend.generator.register('tty_pages', () => [
  { path: 'tags/index.html', layout: ['tags'], data: { type: 'tags' } },
  { path: '404.html', layout: ['404'], data: { type: '404' } }
]);

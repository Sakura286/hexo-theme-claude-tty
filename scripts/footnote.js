/* global hexo */
'use strict';

// 渲染 GFM 风格的脚注：正文 [^1]，定义 [^1]: 内容（续行缩进）。
// hexo-renderer-marked 不支持脚注，所以在 Markdown 渲染前处理。
// 此时代码块已被 Hexo 替换成 <hexoPostRenderCodeBlock>，连同行内代码一起跳过。

const rProtect = /<hexoPostRenderCodeBlock>[\s\S]*?<\/hexoPostRenderCodeBlock>|(`+)[^`\n][\s\S]*?\1/g;
const rDefinition = /^\[\^([^\]\s]+)\]:[ \t]*(.*(?:\n[ \t]+\S.*)*)\n?/gm;
const rReference = /\[\^([^\]\s]+)\]/g;
const rPlaceholder = /\u0000FN(\d+)\u0000/g;

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function plainText(html) {
  return html.replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

function renderInline(text) {
  const html = hexo.render.renderSync({ text, engine: 'markdown' }).trim();
  const single = html.match(/^<p>([\s\S]*)<\/p>$/);
  return single && !single[1].includes('<p>') ? single[1] : html;
}

function renderFootnotes(content, labels) {
  const kept = [];
  const restore = str => str.replace(rPlaceholder, (match, i) => kept[i]);
  let text = content.replace(rProtect, match => {
    kept.push(match);
    return `\u0000FN${kept.length - 1}\u0000`;
  });

  const definitions = new Map();
  text = text.replace(rDefinition, (match, id, body) => {
    if (!definitions.has(id)) definitions.set(id, restore(body.replace(/\n[ \t]+/g, '\n').trim()));
    return '';
  });
  if (!definitions.size) return content;

  const rendered = new Map();
  const numbers = new Map();
  const refCounts = new Map();
  const render = id => {
    if (!rendered.has(id)) rendered.set(id, renderInline(definitions.get(id)));
    return rendered.get(id);
  };

  text = text.replace(rReference, (match, id) => {
    if (!definitions.has(id)) return match;
    if (!numbers.has(id)) numbers.set(id, numbers.size + 1);
    const n = numbers.get(id);
    const k = (refCounts.get(id) || 0) + 1;
    refCounts.set(id, k);
    const refId = k === 1 ? `fnref-${n}` : `fnref-${n}-${k}`;
    return `<sup class="fn-ref"><a href="#fn-${n}" id="${refId}" title="${escapeAttr(plainText(render(id)))}">${n}</a></sup>`;
  });

  // 没被引用的定义也保留，排在最后
  for (const id of definitions.keys()) {
    if (!numbers.has(id)) numbers.set(id, numbers.size + 1);
  }

  const items = [...numbers.entries()].map(([id, n]) => {
    const back = refCounts.has(id)
      ? ` <a class="fn-back" href="#fnref-${n}" aria-label="${escapeAttr(labels.back)}">↩</a>`
      : '';
    return `<li id="fn-${n}">${render(id)}${back}</li>`;
  }).join('');

  text = text.replace(/\s*$/, '')
    + `\n\n<section class="footnotes" role="doc-endnotes"><p class="footnotes-label">${labels.title}</p><ol>${items}</ol></section>\n`;

  return restore(text);
}

hexo.extend.filter.register('before_post_render', data => {
  if (!hexo.theme.config.footnote || !data.content || !data.content.includes('[^')) return data;
  const __ = hexo.theme.i18n.__(hexo.config.language);
  data.content = renderFootnotes(data.content, { title: __('post.footnotes'), back: __('post.footnote_back') });
  return data;
});

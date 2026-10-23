/* global hexo */
'use strict';

const crypto = require('crypto');
const builtinIcons = require('./icons');

const CJK = /[㐀-鿿豈-﫿]/g;
const ICON_SIZE = 14;

// 把点阵（'#' 为实心）转成一条 SVG path，同一行连续的像素合成一个矩形
function bitmapPath(rows, ox = 0, oy = 0) {
  let d = '';
  rows.forEach((row, y) => {
    for (const run of row.matchAll(/#+/g)) {
      d += `M${run.index + ox} ${y + oy}h${run[0].length}v1h-${run[0].length}z`;
    }
  });
  return d;
}

// 由 seed 的 SHA-1 生成左右对称的 9x9 点阵
function identicon(seed) {
  const size = 9;
  const half = Math.ceil(size / 2);
  const hash = crypto.createHash('sha1').update(String(seed)).digest();
  const rows = [];
  for (let y = 0; y < size; y++) {
    const left = [];
    for (let x = 0; x < half; x++) {
      const i = y * half + x;
      left.push((hash[i >> 3] >> (i & 7)) & 1 ? '#' : '.');
    }
    rows.push(left.join('') + left.slice(0, size - half).reverse().join(''));
  }
  return rows;
}

// 选图标：front matter 的 icon > post_icon.map 里第一个命中标签或 _posts 子目录的项 > post_icon.default。
// 图标名写 identicon 时，用 slug 的哈希生成对称点阵。
function iconName(post, conf) {
  if (post.icon) return String(post.icon);
  const names = new Set();
  if (post.tags) post.tags.forEach(tag => names.add(tag.name.toLowerCase()));
  const dir = (post.source || '').replace(/^_posts\//, '').split('/');
  if (dir.length > 1) names.add(dir[0].toLowerCase());
  for (const [key, icon] of Object.entries(conf.map || {})) {
    if (names.has(key.toLowerCase())) return icon;
  }
  return conf.default || 'doc';
}

// variant: 'tile' 是陶土色底块加深色图案，'line' 只有 currentColor 图案
hexo.extend.helper.register('post_icon', function (post, variant = 'line') {
  const conf = this.theme.post_icon || {};
  const name = iconName(post, conf);
  const rows = name === 'identicon'
    ? identicon(post.slug || post.path)
    : (conf.custom && conf.custom[name]) || builtinIcons[name] || builtinIcons.doc;
  const width = Math.max(...rows.map(r => r.length));
  const d = bitmapPath(rows, Math.floor((ICON_SIZE - width) / 2), Math.floor((ICON_SIZE - rows.length) / 2));
  if (variant === 'tile') {
    return `<svg class="px px-tile" viewBox="-3 -3 ${ICON_SIZE + 6} ${ICON_SIZE + 6}" shape-rendering="crispEdges" aria-hidden="true">`
      + `<rect x="-3" y="-3" width="${ICON_SIZE + 6}" height="${ICON_SIZE + 6}"/><path d="${d}"/></svg>`;
  }
  return `<svg class="px px-line" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}" shape-rendering="crispEdges" aria-hidden="true">`
    + `<path d="${d}"/></svg>`;
});

hexo.extend.helper.register('pixel_bitmap', (rows, cls = '') => {
  const width = Math.max(...rows.map(r => r.length));
  return `<svg class="px ${cls}" viewBox="0 0 ${width} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">`
    + `<path d="${bitmapPath(rows)}"/></svg>`;
});

// 阅读时长（分钟）：中文按字、英文按词，不计代码块
hexo.extend.helper.register('reading_minutes', function (html) {
  const conf = this.theme.post || {};
  const text = String(html || '')
    .replace(/<figure class="highlight[\s\S]*?<\/figure>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const cjk = (text.match(CJK) || []).length;
  const words = (text.replace(CJK, ' ').match(/[A-Za-z0-9][\w'-]*/g) || []).length;
  const minutes = cjk / (conf.cjk_per_minute || 400) + words / (conf.words_per_minute || 200);
  return Math.max(1, Math.round(minutes));
});

hexo.extend.helper.register('build_time', () => {
  return new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
});

hexo.extend.helper.register('pad2', n => String(n).padStart(2, '0'));

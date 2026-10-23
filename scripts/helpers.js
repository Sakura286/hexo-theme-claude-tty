/* global hexo */
'use strict';

const crypto = require('crypto');

const CJK = /[㐀-鿿豈-﫿]/g;

// 把点阵（'#' 为实心）转成一条 SVG path，每个像素一个 1x1 方块
function bitmapPath(rows) {
  let d = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') d += `M${x} ${y}h1v1h-1z`;
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

// variant: 'tile' 是陶土色底块加深色图案，'line' 只有 currentColor 图案
hexo.extend.helper.register('pixel_icon', (seed, variant = 'line') => {
  const d = bitmapPath(identicon(seed));
  if (variant === 'tile') {
    return '<svg class="px px-tile" viewBox="-2 -2 13 13" shape-rendering="crispEdges" aria-hidden="true">'
      + `<rect x="-2" y="-2" width="13" height="13"/><path d="${d}"/></svg>`;
  }
  return '<svg class="px px-line" viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true">'
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

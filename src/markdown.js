// Markdown → HTML，额外支持几种自定义块：
//   :::why            因为…所以…（理由框）
//   :::alt 标题        难点的第二种讲法（默认折叠）
//   :::q 标题          课件里的题目，显示【题】
//   :::ans            答案与解析（默认折叠，放在 :::q 里面）
//   :::warn 标题       临床注意 / 易错点
//   :::                结束上一个块
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true }); // 换行就是换行，选项 A–D 不会挤成一段

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const blocks = {
  why: t => [`<div class="blk why"><div class="blk-tag">💡 ${esc(t || '为什么')}</div>`, '</div>'],
  alt: t => [`<details class="blk alt"><summary>🔁 ${esc(t || '换一种讲法')}</summary><div class="blk-body">`, '</div></details>'],
  q: t => [`<div class="blk qblk"><div class="blk-tag">【题】${esc(t || '')}</div>`, '</div>'],
  ans: t => [`<details class="blk ans"><summary>${esc(t || '看答案与解析')}</summary><div class="blk-body">`, '</div></details>'],
  warn: t => [`<div class="blk warn"><div class="blk-tag">⚠️ ${esc(t || '注意')}</div>`, '</div>'],
};

export function preprocess(src) {
  const out = [];
  const stack = [];
  for (const line of src.split(/\r?\n/)) {
    const open = line.match(/^:::\s*(\w+)\s*(.*)$/);
    if (open && blocks[open[1]]) {
      const [o, c] = blocks[open[1]](open[2].trim());
      out.push('', o, '');
      stack.push(c);
      continue;
    }
    if (/^:::\s*$/.test(line) && stack.length) {
      out.push('', stack.pop(), '');
      continue;
    }
    out.push(line);
  }
  while (stack.length) out.push('', stack.pop(), '');
  return out.join('\n');
}

export function renderMarkdown(src) {
  const html = marked.parse(preprocess(src));
  // 表格包一层，手机上可横向滑动
  return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
}

export function renderInline(src) {
  return marked.parseInline(String(src ?? ''));
}

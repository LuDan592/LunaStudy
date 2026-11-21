// 构建前检查 content/：格式错了就让构建失败，不会把坏内容发上线
import fs from 'node:fs';
import path from 'node:path';
import { load as yamlLoad } from 'js-yaml';

const root = path.resolve('content');
const errors = [], warns = [];
let lessons = 0, questions = 0, terms = 0;
const LET = 'ABCDEFGH';
const banned = /\.(pdf|pptx?|key|docx?)$/i;

for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const cdir = path.join(root, dir.name);
  if (!fs.existsSync(path.join(cdir, 'course.json'))) warns.push(`${dir.name}: 没有 course.json（课程名会显示成文件夹名）`);
  else try { JSON.parse(fs.readFileSync(path.join(cdir, 'course.json'), 'utf8')); } catch (e) { errors.push(`${dir.name}/course.json 不是有效 JSON：${e.message}`); }
  for (const f of fs.readdirSync(cdir)) {
    const rel = `${dir.name}/${f}`;
    if (banned.test(f)) errors.push(`${rel}: 课件原文件不能放进 content/（仓库是公开的）`);
    if (!f.endsWith('.md') || f.startsWith('_')) continue;
    lessons++;
    const raw = fs.readFileSync(path.join(cdir, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) { errors.push(`${rel}: 缺少开头的 --- 信息块`); continue; }
    let meta;
    try { meta = yamlLoad(m[1]) || {}; } catch (e) { errors.push(`${rel}: 信息块 YAML 写错了：${e.message.split('\n')[0]}`); continue; }
    if (!meta.title) errors.push(`${rel}: 缺 title`);
    const quiz = meta.quiz || [];
    questions += quiz.length;
    terms += (meta.terms || []).length;
    if (quiz.length < 5 || quiz.length > 10) warns.push(`${rel}: 自测题 ${quiz.length} 道（要求 5–10）`);
    const ids = new Set();
    quiz.forEach((q, i) => {
      const id = q.id || `q${i + 1}`;
      const where = `${rel} 第 ${i + 1} 题`;
      if (ids.has(id)) errors.push(`${where}: id「${id}」重复`);
      ids.add(id);
      if (!q.q) errors.push(`${where}: 缺题干 q`);
      if (q.type === 'short') {
        if (!q.answer) errors.push(`${where}: 简答题缺参考答案 answer`);
        if (!q.points?.length) warns.push(`${where}: 简答题没写得分点 points`);
      } else {
        if (!Array.isArray(q.options) || q.options.length < 2) { errors.push(`${where}: 选择题选项不够`); return; }
        const a = typeof q.answer === 'number' ? q.answer : LET.indexOf(String(q.answer ?? '').toUpperCase());
        if (a < 0 || a >= q.options.length) errors.push(`${where}: 答案「${q.answer}」不在选项范围内`);
        q.options.forEach((o, k) => { if (typeof o !== 'object' || !o.why) warns.push(`${where} 选项 ${LET[k]}: 没写为什么对/错`); });
      }
    });
    (meta.terms || []).forEach((t, i) => { if (!t.zh || !t.en) errors.push(`${rel} 术语 ${i + 1}: 中英都要有`); });
    const opens = (raw.match(/^:::\s*\w+/gm) || []).length, closes = (raw.match(/^:::\s*$/gm) || []).length;
    if (opens !== closes) errors.push(`${rel}: ::: 块开了 ${opens} 个、关了 ${closes} 个，没对上`);
  }
}
warns.forEach(w => console.warn('⚠️ ', w));
errors.forEach(e => console.error('❌', e));
console.log(`内容检查：${lessons} 课，${questions} 道自测题，${terms} 张术语卡；${errors.length} 个错误，${warns.length} 个提醒`);
if (errors.length) process.exit(1);

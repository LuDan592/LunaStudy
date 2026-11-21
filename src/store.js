// 学习记录只存在本机浏览器 localStorage，读写都包 try/catch：
// 隐私模式 / 存储满 / 被禁用时退回内存，页面照常能用，只是关掉后不保存
const KEY = 'lunastudy:v1';
const INTERVALS = [1, 3, 7]; // 错题复习间隔（天）

let storageOk = true;
let state = load();

function blank() {
  return {
    app: 'LunaStudy',
    version: 1,
    plan: {},      // { 周一日期: [{ text, status }] }  status: todo | doing | done
    time: {},      // { 日期: 秒数 }
    done: {},      // { lessonId: 学完日期 }
    answers: {},   // { 题目key: { ok, at } } 最近一次作答
    review: {},    // { 题目key: { stage, due, added, last, misses } }
    last: null,    // 上次看的课 { lessonId, tab, at }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const data = JSON.parse(raw);
    return normalize(data);
  } catch (e) {
    console.warn('读取学习记录失败，使用空白记录', e);
    storageOk = false;
    return blank();
  }
}

function normalize(data) {
  const b = blank();
  if (!data || typeof data !== 'object') return b;
  for (const k of Object.keys(b)) {
    if (k in data && data[k] !== undefined) b[k] = data[k];
  }
  for (const k of ['plan', 'time', 'done', 'answers', 'review']) {
    if (!b[k] || typeof b[k] !== 'object' || Array.isArray(b[k])) b[k] = {};
  }
  return b;
}

let saveTimer = null;
let dirty = false;
export function save(now = false) {
  dirty = true;
  const write = () => {
    if (!dirty) return;
    dirty = false;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOk = true;
    } catch (e) {
      console.warn('保存学习记录失败', e);
      storageOk = false;
      dirty = true;
    }
  };
  clearTimeout(saveTimer);
  if (now) write(); else saveTimer = setTimeout(write, 200);
}
// 关页面前把还没写进去的改动补写；没改动就不写，避免盖掉别的标签页的记录
window.addEventListener('pagehide', () => { if (dirty) save(true); });
// 别的标签页改了记录，这里重新读一次
window.addEventListener('storage', e => { if (e.key === KEY) state = load(); });

export const isStorageOk = () => storageOk;
export const getState = () => state;

// ---------- 日期 ----------
export function dayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}
export function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const wd = (x.getDay() + 6) % 7; // 周一 = 0
  x.setDate(x.getDate() - wd);
  return dayKey(x);
}
export const weekDays = (start = weekStart()) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

// ---------- 学习时长 ----------
export function addTime(seconds) {
  const k = dayKey();
  state.time[k] = (state.time[k] || 0) + seconds;
  save();
}
export const weekSeconds = () => weekDays().reduce((s, k) => s + (state.time[k] || 0), 0);
export const todaySeconds = () => state.time[dayKey()] || 0;

// ---------- 每周计划 ----------
export function getPlan(week = weekStart()) {
  let p = state.plan[week];
  if (!Array.isArray(p) || p.length !== 3) {
    p = [0, 1, 2].map(i => ({ text: (Array.isArray(p) && p[i]?.text) || '', status: (Array.isArray(p) && p[i]?.status) || 'todo' }));
    state.plan[week] = p;
  }
  return p;
}
export function setPlanItem(i, patch, week = weekStart()) {
  const p = getPlan(week);
  p[i] = { ...p[i], ...patch };
  save();
}

// ---------- 学完 / 上次位置 ----------
export function markDone(lessonId, isDone = true) {
  if (isDone) state.done[lessonId] = dayKey(); else delete state.done[lessonId];
  save();
}
export const isDone = id => !!state.done[id];
export function lessonsDoneThisWeek() {
  const days = new Set(weekDays());
  return Object.values(state.done).filter(d => days.has(d)).length;
}
export function setLast(lessonId, tab = 'learn') {
  state.last = { lessonId, tab, at: Date.now() };
  save();
}

// ---------- 作答与错题本（间隔重复 1 / 3 / 7 天） ----------
export function recordAnswer(qkey, lessonId, ok, { fromReview = false } = {}) {
  state.answers[qkey] = { ok, at: Date.now() };
  const today = dayKey();
  const r = state.review[qkey];
  if (!ok) {
    // 答错或「没会」：进错题本，从第 1 档（1 天后）重新开始
    state.review[qkey] = {
      lessonId,
      stage: 0,
      due: addDays(today, INTERVALS[0]),
      added: r?.added || today,
      last: today,
      misses: (r?.misses || 0) + 1,
    };
  } else if (r && fromReview) {
    // 复习时答对：升一档；三档都过了就移出错题本
    const next = r.stage + 1;
    if (next >= INTERVALS.length) delete state.review[qkey];
    else state.review[qkey] = { ...r, stage: next, due: addDays(today, INTERVALS[next]), last: today };
  }
  save();
}
export function reviewItems() {
  return Object.entries(state.review).map(([key, v]) => ({ key, ...v }));
}
export function dueItems(today = dayKey()) {
  return reviewItems().filter(r => r.due <= today).sort((a, b) => a.due.localeCompare(b.due));
}
export function removeReview(key) { delete state.review[key]; save(); }
export const intervals = INTERVALS;

// ---------- 备份 ----------
export function exportData() {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}
export function importData(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'LunaStudy') throw new Error('这不是 LunaStudy 的备份文件');
  state = normalize(data);
  save(true);
  if (!storageOk) throw new Error('已读取备份，但这台设备的浏览器不允许保存（可能是无痕模式）');
}
export function resetAll() {
  state = blank();
  save(true);
}

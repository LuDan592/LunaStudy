import './style.css';
import * as C from './content.js';
import * as S from './store.js';
import { renderInline } from './markdown.js';

const $ = (sel, el = document) => el.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LETTERS = 'ABCDEFGH';

// ---------------- 图标 ----------------
const I = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  plan: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14l2 2 4-4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
  review: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6"/><path d="M4 4v4.6h4.6M12 8v4l3 2"/>',
  cards: '<rect x="3" y="7" width="14" height="13" rx="2"/><path d="M7 4h12a2 2 0 0 1 2 2v11"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  next: '<path d="M9 18l6-6-6-6"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  shuffle: '<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
};
const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

const NAV = [
  { id: 'home', label: '学习总览', short: '总览', icon: 'home', href: '#/' },
  { id: 'plan', label: '每周计划', short: '计划', icon: 'plan', href: '#/plan' },
  { id: 'courses', label: '课程库', short: '课程', icon: 'book', href: '#/courses' },
  { id: 'quiz', label: '自测题', short: '自测', icon: 'quiz', href: '#/quiz' },
  { id: 'review', label: '错题本', short: '错题', icon: 'review', href: '#/review' },
  { id: 'cards', label: '术语卡', short: '术语', icon: 'cards', href: '#/cards' },
  { id: 'settings', label: '设置与备份', short: '设置', icon: 'gear', href: '#/settings' },
];
const BOTTOM = ['home', 'plan', 'courses', 'review', 'cards'];

// ---------------- 框架 ----------------
function shell() {
  document.body.innerHTML = `
  <div class="app">
    <aside class="side" id="side">
      <div class="brand"><div class="logo">L</div><div><div class="brand-name">LunaStudy</div><div class="brand-sub">护理学习工作台</div></div></div>
      <nav class="side-nav">${NAV.map(n => `<a href="${n.href}" data-nav="${n.id}">${icon(n.icon)}<span>${n.label}</span><b class="badge" data-badge="${n.id}"></b></a>`).join('')}</nav>
      <div class="side-foot">学习记录只存在这台设备的浏览器里，换手机前去「设置与备份」导出。</div>
    </aside>
    <div class="scrim" id="scrim"></div>
    <div class="main">
      <header class="top">
        <button class="icon-btn only-m" id="menuBtn" aria-label="菜单">${icon('menu')}</button>
        <div class="top-title" id="topTitle">LunaStudy</div>
        <div class="top-time" id="topTime" title="今天学习时长"></div>
      </header>
      <main class="view" id="view"></main>
    </div>
    <nav class="bottom">${BOTTOM.map(id => NAV.find(n => n.id === id)).map(n => `<a href="${n.href}" data-nav="${n.id}">${icon(n.icon)}<span>${n.short}</span><b class="badge" data-badge="${n.id}"></b></a>`).join('')}</nav>
  </div>
  <div class="toast" id="toast"></div>`;
  $('#menuBtn').onclick = () => document.body.classList.toggle('drawer');
  $('#scrim').onclick = () => document.body.classList.remove('drawer');
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function fmtDur(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} 分钟`;
  return `${Math.floor(m / 60)} 小时 ${m % 60} 分`;
}
function fmtDurShort(sec) {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? (m % 60) + 'm' : ''}`;
}

function refreshChrome(navId, title) {
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === navId));
  const due = S.dueItems().length;
  document.querySelectorAll('[data-badge="review"]').forEach(b => { b.textContent = due || ''; b.hidden = !due; });
  document.querySelectorAll('.badge:not([data-badge="review"])').forEach(b => { b.hidden = true; });
  $('#topTitle').textContent = title;
  $('#topTime').textContent = '今天 ' + fmtDurShort(S.todaySeconds());
  document.title = title === 'LunaStudy' ? 'LunaStudy' : `${title} · LunaStudy`;
}

// ---------------- 学习时长：页面在前台且最近 2 分钟有操作才计时 ----------------
let lastActive = Date.now();
['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(ev => window.addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true, capture: true }));
setInterval(() => {
  if (document.visibilityState === 'visible' && Date.now() - lastActive < 120000) {
    S.addTime(15);
    const el = $('#topTime');
    if (el) el.textContent = '今天 ' + fmtDurShort(S.todaySeconds());
  }
}, 15000);

// ---------------- 路由 ----------------
const routes = [
  [/^\/?$/, viewHome],
  [/^\/plan$/, viewPlan],
  [/^\/courses$/, viewCourses],
  [/^\/c\/([^/]+)$/, viewCourse],
  [/^\/l\/([^/]+)\/([^/]+)(?:\/(learn|quiz|terms))?$/, viewLesson],
  [/^\/quiz$/, viewQuizList],
  [/^\/review$/, viewReview],
  [/^\/cards(?:\/(.+))?$/, viewCards],
  [/^\/settings$/, viewSettings],
];

function route() {
  document.body.classList.remove('drawer');
  const path = decodeURIComponent(location.hash.replace(/^#/, '') || '/');
  const view = $('#view');
  for (const [re, fn] of routes) {
    const m = path.match(re);
    if (m) {
      view.innerHTML = '';
      view.onclick = null;
      fn(view, ...m.slice(1));
      window.scrollTo(0, 0);
      return;
    }
  }
  view.innerHTML = `<div class="empty">找不到这个页面。<a href="#/">回到总览</a></div>`;
  refreshChrome('', '找不到页面');
}

// ---------------- 学习总览 ----------------
function viewHome(v) {
  refreshChrome('home', 'LunaStudy');
  const plan = S.getPlan();
  const planDone = plan.filter(p => p.status === 'done' && p.text).length;
  const planTotal = plan.filter(p => p.text).length;
  const lessonsDone = S.lessonsDoneThisWeek();
  const due = S.dueItems().length;
  const st = S.getState();
  const last = st.last && C.getLesson(st.last.lessonId);
  const first = C.allLessons()[0];
  const target = last || first;
  const days = S.weekDays();
  const maxSec = Math.max(1800, ...days.map(d => st.time[d] || 0));
  const today = S.dayKey();
  const h = new Date().getHours();
  const hello = h < 5 ? '夜深了' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好';

  v.innerHTML = `
  <section class="hero">
    <div>
      <div class="hero-hi">${hello}，Luna</div>
      <div class="hero-sub">${due ? `今天有 <b>${due}</b> 道题到期要复习。` : '今天没有到期的错题，继续往前学吧。'}</div>
    </div>
    ${target ? `<a class="btn btn-hero" href="#/l/${target.courseId}/${target.slug}/${last ? st.last.tab || 'learn' : 'learn'}">${icon('play')}<span>${last ? '继续学习' : '开始学习'}<small>${esc(target.title)}</small></span></a>` : ''}
  </section>

  <section class="stats">
    <a class="stat" href="#/plan"><div class="stat-k">本周完成</div><div class="stat-v">${planDone + lessonsDone}<small> 项</small></div><div class="stat-s">计划 ${planDone}/${planTotal || 3} · 学完 ${lessonsDone} 课</div></a>
    <div class="stat"><div class="stat-k">本周学习时长</div><div class="stat-v">${fmtDurShort(S.weekSeconds())}</div><div class="stat-s">今天 ${fmtDur(S.todaySeconds())}</div></div>
    <a class="stat ${due ? 'stat-alert' : ''}" href="#/review"><div class="stat-k">待复习题数</div><div class="stat-v">${due}<small> 题</small></div><div class="stat-s">错题本共 ${S.reviewItems().length} 题</div></a>
  </section>

  <div class="grid2">
    <section class="card">
      <div class="card-h"><h2>本周最重要的 3 项</h2><a href="#/plan" class="link">编辑</a></div>
      ${plan.map((p, i) => `<div class="plan-mini"><span class="dot s-${p.status}"></span><span class="${p.text ? '' : 'muted'}">${p.text ? esc(p.text) : `第 ${i + 1} 项还没写`}</span><span class="chip s-${p.status}">${statusLabel(p.status)}</span></div>`).join('')}
    </section>
    <section class="card">
      <div class="card-h"><h2>本周每天学习时长</h2></div>
      <div class="bars">${days.map((d, i) => {
        const sec = st.time[d] || 0;
        return `<div class="bar ${d === today ? 'today' : ''}"><div class="bar-v">${sec ? fmtDurShort(sec) : ''}</div><div class="bar-track"><div class="bar-fill" style="height:${Math.round(sec / maxSec * 100)}%"></div></div><div class="bar-d">${'一二三四五六日'[i]}</div></div>`;
      }).join('')}</div>
    </section>
  </div>

  <section class="card">
    <div class="card-h"><h2>课程进度</h2><a href="#/courses" class="link">全部课程</a></div>
    ${C.getCourses().map(c => courseRow(c)).join('') || '<div class="muted">还没有课程</div>'}
  </section>`;
}

function courseRow(c) {
  const done = c.lessons.filter(l => S.isDone(l.id)).length;
  const pct = c.lessons.length ? Math.round(done / c.lessons.length * 100) : 0;
  return `<a class="course-row" href="#/c/${c.id}"><div class="course-row-t"><b>${esc(c.title)}</b><span class="muted">${esc(c.en)}</span></div><div class="prog"><div style="width:${pct}%"></div></div><div class="muted small">${done}/${c.lessons.length} 课</div></a>`;
}

const statusLabel = s => ({ todo: '未开始', doing: '进行中', done: '完成' }[s] || '未开始');

// ---------------- 每周计划 ----------------
function viewPlan(v) {
  refreshChrome('plan', '每周计划');
  const ws = S.weekStart();
  const end = S.addDays(ws, 6);
  const plan = S.getPlan();
  v.innerHTML = `
  <div class="page-h"><h1>每周计划</h1><div class="muted">${ws.slice(5).replace('-', '/')} – ${end.slice(5).replace('-', '/')}（周一到周日）· 只写最重要的 3 项</div></div>
  <section class="plan-list">
    ${plan.map((p, i) => `
    <div class="card plan-item s-${p.status}" data-i="${i}">
      <div class="plan-no">${i + 1}</div>
      <textarea class="plan-text" rows="2" placeholder="例如：复习第 1 课生命体征 + 做完自测" data-i="${i}">${esc(p.text)}</textarea>
      <div class="seg">${['todo', 'doing', 'done'].map(s => `<button class="seg-b ${p.status === s ? 'on' : ''} s-${s}" data-act="status" data-i="${i}" data-s="${s}">${statusLabel(s)}</button>`).join('')}</div>
    </div>`).join('')}
  </section>
  <p class="muted small">写完自动保存。新的一周会自动换成新的空白计划，上周的记录还留着。</p>
  ${pastPlans(ws)}`;
  v.querySelectorAll('.plan-text').forEach(t => {
    t.addEventListener('input', () => S.setPlanItem(+t.dataset.i, { text: t.value.slice(0, 200) }));
  });
  v.onclick = e => {
    const b = e.target.closest('[data-act="status"]');
    if (!b) return;
    S.setPlanItem(+b.dataset.i, { status: b.dataset.s });
    const item = b.closest('.plan-item');
    item.className = `card plan-item s-${b.dataset.s}`;
    item.querySelectorAll('.seg-b').forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.s === 'done') toast('完成一项 👏');
  };
}
function pastPlans(ws) {
  const st = S.getState();
  const weeks = Object.keys(st.plan).filter(w => w < ws && st.plan[w].some(p => p.text)).sort().reverse().slice(0, 4);
  if (!weeks.length) return '';
  return `<section class="card"><div class="card-h"><h2>前几周</h2></div>${weeks.map(w => `<div class="past"><div class="muted small">${w} 那周</div>${st.plan[w].filter(p => p.text).map(p => `<div class="plan-mini"><span class="dot s-${p.status}"></span><span>${esc(p.text)}</span><span class="chip s-${p.status}">${statusLabel(p.status)}</span></div>`).join('')}</div>`).join('')}</section>`;
}

// ---------------- 课程库 ----------------
function viewCourses(v) {
  refreshChrome('courses', '课程库');
  const cs = C.getCourses();
  v.innerHTML = `
  <div class="page-h"><h1>课程库</h1><div class="muted">按课程 → 按课。点进去看讲解、做自测、背术语。</div></div>
  <div class="course-grid">${cs.map(c => {
    const done = c.lessons.filter(l => S.isDone(l.id)).length;
    const qn = c.lessons.reduce((s, l) => s + l.quiz.length, 0);
    return `<a class="card course-card" href="#/c/${c.id}">
      <div class="course-icon">${icon('book')}</div>
      <h2>${esc(c.title)}</h2><div class="muted">${esc(c.en)}</div>
      <p class="small">${esc(c.desc)}</p>
      <div class="prog"><div style="width:${c.lessons.length ? done / c.lessons.length * 100 : 0}%"></div></div>
      <div class="muted small">${c.lessons.length} 课 · ${qn} 道自测题 · 已学完 ${done}</div>
    </a>`;
  }).join('') || '<div class="empty">还没有课程。</div>'}</div>`;
}

function viewCourse(v, cid) {
  const c = C.getCourse(cid);
  if (!c) { v.innerHTML = '<div class="empty">找不到这门课程。</div>'; return refreshChrome('courses', '课程库'); }
  refreshChrome('courses', c.title);
  v.innerHTML = `
  <a class="crumb" href="#/courses">${icon('back')}课程库</a>
  <div class="page-h"><h1>${esc(c.title)}</h1><div class="muted">${esc(c.en)}</div>${c.desc ? `<p>${esc(c.desc)}</p>` : ''}</div>
  <div class="lesson-list">${c.lessons.map((l, i) => {
    const wrong = S.reviewItems().filter(r => r.lessonId === l.id).length;
    return `<a class="card lesson-row ${S.isDone(l.id) ? 'is-done' : ''}" href="#/l/${c.id}/${l.slug}">
      <div class="lesson-no">${S.isDone(l.id) ? icon('check') : i + 1}</div>
      <div class="lesson-main"><div class="lesson-t">${esc(l.title)}${l.placeholder ? ' <span class="chip">示范</span>' : ''}</div><div class="muted small">${esc(l.en)}</div>${l.summary ? `<div class="small lesson-sum">${esc(l.summary)}</div>` : ''}
      <div class="muted small">${l.quiz.length} 道自测 · ${l.terms.length} 张术语卡${wrong ? ` · <span class="warn-t">${wrong} 道在错题本</span>` : ''}</div></div>
      ${icon('next', 'chev')}
    </a>`;
  }).join('') || '<div class="empty">这门课还没有内容。</div>'}</div>`;
}

// ---------------- 单课 ----------------
function viewLesson(v, cid, slug, tab = 'learn') {
  const l = C.getLesson(`${cid}/${slug}`);
  if (!l) { v.innerHTML = '<div class="empty">找不到这一课。</div>'; return refreshChrome('courses', '课程库'); }
  const c = C.getCourse(cid);
  refreshChrome('courses', l.title);
  S.setLast(l.id, tab);
  const idx = c.lessons.indexOf(l);
  const prev = c.lessons[idx - 1], next = c.lessons[idx + 1];
  const base = `#/l/${cid}/${slug}`;
  v.innerHTML = `
  <a class="crumb" href="#/c/${cid}">${icon('back')}${esc(c.title)}</a>
  <div class="page-h"><h1>${esc(l.title)}</h1><div class="muted">${esc(l.en)}</div></div>
  <div class="tabs">
    <a href="${base}/learn" class="${tab === 'learn' ? 'on' : ''}">知识点讲解</a>
    <a href="${base}/quiz" class="${tab === 'quiz' ? 'on' : ''}">自测题 <small>${l.quiz.length}</small></a>
    <a href="${base}/terms" class="${tab === 'terms' ? 'on' : ''}">术语 <small>${l.terms.length}</small></a>
  </div>
  <div id="tabBody"></div>
  <div class="lesson-foot">
    <button class="btn ${S.isDone(l.id) ? 'btn-ghost' : 'btn-primary'}" id="doneBtn">${S.isDone(l.id) ? '✓ 已学完（点一下取消）' : '标记本课已学完'}</button>
    <div class="pager">
      ${prev ? `<a class="btn btn-ghost" href="#/l/${cid}/${prev.slug}">${icon('back')}上一课</a>` : '<span></span>'}
      ${next ? `<a class="btn btn-ghost" href="#/l/${cid}/${next.slug}">下一课${icon('next')}</a>` : '<span></span>'}
    </div>
  </div>`;
  const body = $('#tabBody', v);
  if (tab === 'learn') body.innerHTML = `<article class="card prose">${l.placeholder ? '<div class="placeholder-note">这一课是示范内容（占位），用来看平台效果，不是课件原文。</div>' : ''}${l.html}</article>`;
  if (tab === 'quiz') renderQuiz(body, l.quiz, { lesson: l });
  if (tab === 'terms') body.innerHTML = `<section class="card"><div class="card-h"><h2>本课术语</h2><a class="link" href="#/cards/${encodeURIComponent(l.id)}">用翻卡背 →</a></div><div class="term-table">${l.terms.map(t => `<div class="term-row"><div class="term-zh">${esc(t.zh)}</div><div class="term-en">${esc(t.en)}</div>${t.note ? `<div class="term-note">${renderInline(t.note)}</div>` : ''}</div>`).join('')}</div></section>`;
  $('#doneBtn', v).onclick = () => {
    const d = !S.isDone(l.id);
    S.markDone(l.id, d);
    if (d) toast('这一课学完了 ✓');
    viewLesson(v, cid, slug, tab);
  };
}

// ---------------- 做题（自测 + 复习共用） ----------------
function renderQuiz(box, questions, { lesson = null, fromReview = false, onAnswered = null } = {}) {
  if (!questions.length) { box.innerHTML = '<div class="card empty">这一课还没有自测题。</div>'; return; }
  const result = {}; // key -> true/false
  const mcqCount = questions.filter(q => q.type !== 'short').length;
  box.innerHTML = `
  ${fromReview ? '' : `<div class="card quiz-head"><div><b>本课自测</b> <span class="muted small">选择题点了就判分；简答题先自己想，再看参考答案，最后选「会了 / 没会」。答错和「没会」的会进错题本。</span></div><div class="score" id="score"></div></div>`}
  ${questions.map((q, i) => questionHTML(q, i, fromReview)).join('')}`;
  const updateScore = () => {
    const el = $('#score', box);
    if (!el) return;
    const mcqDone = questions.filter(q => q.type !== 'short' && q.key in result);
    const right = mcqDone.filter(q => result[q.key]).length;
    const shortDone = questions.filter(q => q.type === 'short' && q.key in result);
    el.innerHTML = `选择题 <b>${right}</b>/${mcqCount}${shortDone.length ? ` · 简答会了 ${shortDone.filter(q => result[q.key]).length}/${questions.length - mcqCount}` : ''}`;
  };
  updateScore();
  box.onclick = e => {
    const opt = e.target.closest('[data-opt]');
    const qel = e.target.closest('.q');
    if (!qel) return;
    const q = questions.find(x => x.key === qel.dataset.key);
    if (!q) return;
    if (opt && !qel.classList.contains('answered')) {
      const pick = +opt.dataset.opt;
      const ans = answerIndex(q);
      const ok = pick === ans;
      qel.classList.add('answered', ok ? 'right' : 'wrong');
      qel.querySelectorAll('[data-opt]').forEach((b, i) => {
        b.classList.toggle('correct', i === ans);
        b.classList.toggle('picked', i === pick);
        b.disabled = true;
      });
      qel.querySelector('.q-explain').hidden = false;
      result[q.key] = ok;
      S.recordAnswer(q.key, q.lessonId, ok, { fromReview });
      afterAnswer(qel, ok, fromReview);
      updateScore();
      onAnswered?.(q, ok);
    }
    if (e.target.closest('[data-act="reveal"]')) {
      qel.querySelector('.q-explain').hidden = false;
      e.target.closest('[data-act="reveal"]').hidden = true;
    }
    const self = e.target.closest('[data-self]');
    if (self && !qel.classList.contains('answered')) {
      const ok = self.dataset.self === 'yes';
      qel.classList.add('answered', ok ? 'right' : 'wrong');
      qel.querySelectorAll('[data-self]').forEach(b => { b.disabled = true; b.classList.toggle('picked', b === self); });
      result[q.key] = ok;
      S.recordAnswer(q.key, q.lessonId, ok, { fromReview });
      afterAnswer(qel, ok, fromReview);
      updateScore();
      onAnswered?.(q, ok);
    }
  };
}

function afterAnswer(qel, ok, fromReview) {
  const note = qel.querySelector('.q-note');
  if (!note) return;
  if (!ok) note.innerHTML = '已放进错题本，<b>明天</b>再复习一次。';
  else if (fromReview) note.innerHTML = '答对了，下次复习间隔拉长；1 → 3 → 7 天都过了就移出错题本。';
  else note.innerHTML = '';
  refreshBadge();
}
function refreshBadge() {
  const due = S.dueItems().length;
  document.querySelectorAll('[data-badge="review"]').forEach(b => { b.textContent = due || ''; b.hidden = !due; });
}

function answerIndex(q) {
  if (typeof q.answer === 'number') return q.answer;
  return LETTERS.indexOf(String(q.answer).trim().toUpperCase());
}

function questionHTML(q, i, fromReview) {
  const lesson = C.getLesson(q.lessonId);
  const from = fromReview && lesson ? `<div class="q-from muted small">${esc(lesson.title)}</div>` : '';
  if (q.type === 'short') {
    return `<div class="card q q-short" data-key="${esc(q.key)}">
      ${from}<div class="q-no">第 ${i + 1} 题 · 简答</div>
      <div class="q-text">${renderInline(q.q)}</div>
      <textarea class="q-draft" rows="3" placeholder="先自己写几句（可以不写，不会保存）"></textarea>
      <button class="btn btn-ghost" data-act="reveal">看参考答案和得分点</button>
      <div class="q-explain" hidden>
        <div class="ref"><div class="ref-h">参考答案</div><div>${renderInline(q.answer)}</div></div>
        ${q.points?.length ? `<div class="ref"><div class="ref-h">得分点（每点 1 分，共 ${q.points.length} 分）</div><ol>${q.points.map(p => `<li>${renderInline(p)}</li>`).join('')}</ol></div>` : ''}
        <div class="self-row"><span class="muted small">对照得分点，你这题：</span><button class="btn btn-ok" data-self="yes">会了</button><button class="btn btn-bad" data-self="no">没会</button></div>
        <div class="q-note small"></div>
      </div>
    </div>`;
  }
  const ans = answerIndex(q);
  return `<div class="card q" data-key="${esc(q.key)}">
    ${from}<div class="q-no">第 ${i + 1} 题 · 单选</div>
    <div class="q-text">${renderInline(q.q)}</div>
    <div class="opts">${q.options.map((o, k) => `<button class="opt" data-opt="${k}"><span class="opt-l">${LETTERS[k]}</span><span>${renderInline(typeof o === 'string' ? o : o.text)}</span></button>`).join('')}</div>
    <div class="q-explain" hidden>
      <div class="q-note small"></div>
      ${q.explain ? `<div class="ref"><div class="ref-h">正确答案 ${LETTERS[ans]}</div><div>${renderInline(q.explain)}</div></div>` : ''}
      <div class="ref"><div class="ref-h">每个选项</div>${q.options.map((o, k) => `<div class="why-opt ${k === ans ? 'ok' : ''}"><b>${LETTERS[k]}</b> ${k === ans ? '✓ ' : '✗ '}${renderInline(typeof o === 'string' ? '' : o.why || '')}</div>`).join('')}</div>
    </div>
  </div>`;
}

// ---------------- 自测题总表 ----------------
function viewQuizList(v) {
  refreshChrome('quiz', '自测题');
  const st = S.getState();
  v.innerHTML = `
  <div class="page-h"><h1>自测题</h1><div class="muted">每课 5–10 题。选择题自动判分，简答题自己对照得分点。</div></div>
  ${C.getCourses().map(c => `
  <section class="card"><div class="card-h"><h2>${esc(c.title)}</h2></div>
    ${c.lessons.map(l => {
      const tried = l.quiz.filter(q => st.answers[q.key]);
      const right = tried.filter(q => st.answers[q.key].ok).length;
      return `<a class="quiz-row" href="#/l/${c.id}/${l.slug}/quiz"><div><b>${esc(l.title)}</b><div class="muted small">${l.quiz.length} 题${tried.length ? ` · 上次做了 ${tried.length} 题，对 ${right} 题` : ' · 还没做过'}</div></div>${icon('next', 'chev')}</a>`;
    }).join('')}
  </section>`).join('')}`;
}

// ---------------- 错题本 ----------------
function viewReview(v) {
  refreshChrome('review', '错题本');
  const today = S.dayKey();
  const due = S.dueItems(today).map(r => C.getQuestion(r.key)).filter(Boolean);
  const later = S.reviewItems().filter(r => r.due > today).sort((a, b) => a.due.localeCompare(b.due));
  const missing = S.reviewItems().filter(r => !C.getQuestion(r.key));
  v.innerHTML = `
  <div class="page-h"><h1>错题本</h1><div class="muted">答错或标「没会」的题自动进来，按 1 天 → 3 天 → 7 天 提醒复习；三次都答对就毕业。</div></div>
  <section class="card review-sum">
    <div><div class="stat-k">今天要复习</div><div class="stat-v">${due.length}<small> 题</small></div></div>
    <div><div class="stat-k">之后排队</div><div class="stat-v">${later.length}<small> 题</small></div></div>
  </section>
  <div id="dueBox"></div>
  ${later.length ? `<section class="card"><div class="card-h"><h2>之后要复习的</h2></div>${later.map(r => {
    const q = C.getQuestion(r.key);
    if (!q) return '';
    return `<div class="later-row"><div class="later-q">${renderInline(q.q)}</div><div class="muted small">${esc(C.getLesson(r.lessonId)?.title || '')} · 第 ${r.stage + 1}/3 轮 · ${dueLabel(r.due, today)}</div><button class="link-btn" data-rm="${esc(r.key)}">移出</button></div>`;
  }).join('')}</section>` : ''}
  ${missing.length ? `<p class="muted small">有 ${missing.length} 道题在课程更新后找不到了，<button class="link-btn" id="rmMissing">清掉</button></p>` : ''}`;
  const box = $('#dueBox', v);
  if (due.length) renderQuiz(box, due, { fromReview: true });
  else box.innerHTML = `<div class="card empty">🎉 今天没有到期的错题。${later.length ? '' : '错题本是空的。'}</div>`;
  v.onclick = e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { S.removeReview(rm.dataset.rm); viewReview(v); toast('已移出错题本'); }
    if (e.target.id === 'rmMissing') { missing.forEach(r => S.removeReview(r.key)); viewReview(v); }
  };
}
function dueLabel(due, today) {
  const [a, b] = [due, today].map(s => new Date(s + 'T00:00:00'));
  const n = Math.round((a - b) / 86400000);
  return n === 1 ? '明天' : n === 2 ? '后天' : `${n} 天后（${due.slice(5)}）`;
}

// ---------------- 术语卡 ----------------
function viewCards(v, filter = 'all') {
  refreshChrome('cards', '术语卡');
  filter = filter ? decodeURIComponent(filter) : 'all';
  const all = C.allLessons().flatMap(l => l.terms);
  let list = filter === 'all' ? all
    : filter.startsWith('course:') ? all.filter(t => t.lessonId.startsWith(filter.slice(7) + '/'))
    : all.filter(t => t.lessonId === filter);
  let order = list.map((_, i) => i);
  let pos = 0, flipped = false;
  let dir = safeGet('lunastudy:cardDir') || 'zh';

  const opts = `<option value="all">全部课程</option>${C.getCourses().map(c => `<option value="course:${c.id}">${esc(c.title)}（整门课）</option>${c.lessons.map(l => `<option value="${l.id}">　${esc(l.title)}</option>`).join('')}`).join('')}`;
  v.innerHTML = `
  <div class="page-h"><h1>术语卡</h1><div class="muted">点卡片翻面。可以只看某一课。</div></div>
  <div class="card-tools">
    <select id="cardFilter">${opts}</select>
    <div class="seg"><button class="seg-b" data-dir="zh">中 → 英</button><button class="seg-b" data-dir="en">英 → 中</button></div>
  </div>
  <div id="cardArea"></div>`;
  $('#cardFilter', v).value = filter;
  $('#cardFilter', v).onchange = e => { location.hash = '#/cards/' + encodeURIComponent(e.target.value); };
  const draw = () => {
    v.querySelectorAll('[data-dir]').forEach(b => b.classList.toggle('on', b.dataset.dir === dir));
    const area = $('#cardArea', v);
    if (!list.length) { area.innerHTML = '<div class="card empty">这里还没有术语。</div>'; return; }
    const t = list[order[pos]];
    const front = dir === 'zh' ? `<div class="fc-zh">${esc(t.zh)}</div>` : `<div class="fc-en">${esc(t.en)}</div>`;
    const back = `<div class="fc-zh">${esc(t.zh)}</div><div class="fc-en">${esc(t.en)}</div>${t.note ? `<div class="fc-note">${renderInline(t.note)}</div>` : ''}<div class="fc-from">${esc(C.getLesson(t.lessonId)?.title || '')}</div>`;
    area.innerHTML = `
      <button class="flash ${flipped ? 'flipped' : ''}" id="flash" aria-label="翻面">
        <div class="flash-in"><div class="flash-face front">${front}<div class="fc-hint">点一下看答案</div></div><div class="flash-face back">${back}</div></div>
      </button>
      <div class="fc-bar">
        <button class="btn btn-ghost" id="fcPrev">${icon('back')}上一张</button>
        <div class="muted">${pos + 1} / ${list.length}</div>
        <button class="btn btn-ghost" id="fcNext">下一张${icon('next')}</button>
      </div>
      <div class="fc-bar"><button class="link-btn" id="fcShuffle">${icon('shuffle')} 打乱顺序</button></div>`;
    $('#flash', v).onclick = () => { flipped = !flipped; $('#flash', v).classList.toggle('flipped', flipped); };
    $('#fcPrev', v).onclick = () => { pos = (pos - 1 + list.length) % list.length; flipped = false; draw(); };
    $('#fcNext', v).onclick = () => { pos = (pos + 1) % list.length; flipped = false; draw(); };
    $('#fcShuffle', v).onclick = () => { order = order.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]); pos = 0; flipped = false; draw(); toast('已打乱'); };
  };
  v.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => { dir = b.dataset.dir; safeSet('lunastudy:cardDir', dir); flipped = false; draw(); });
  draw();
}
function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, val) { try { localStorage.setItem(k, val); } catch { /* 存不了就算了 */ } }

// ---------------- 设置与备份 ----------------
function viewSettings(v) {
  refreshChrome('settings', '设置与备份');
  const st = S.getState();
  const totalSec = Object.values(st.time).reduce((a, b) => a + b, 0);
  v.innerHTML = `
  <div class="page-h"><h1>设置与备份</h1><div class="muted">学习记录（进度、错题、时长、计划）只保存在这台设备的这个浏览器里，不会上传。</div></div>
  ${S.isStorageOk() ? '' : '<div class="card warn-card">⚠️ 这个浏览器现在不让网站保存数据（可能开了无痕/隐私模式）。关掉页面后记录会丢，请换普通模式打开。</div>'}
  <section class="card">
    <div class="card-h"><h2>导出备份</h2></div>
    <p class="small">换手机、清浏览器之前先导出。会下载一个 .json 文件，存到「文件」App 或发给自己。</p>
    <button class="btn btn-primary" id="exportBtn">导出学习记录</button>
  </section>
  <section class="card">
    <div class="card-h"><h2>导入备份</h2></div>
    <p class="small">选之前导出的 .json 文件。<b>会覆盖</b>这台设备上现在的记录。</p>
    <label class="btn btn-ghost file-btn">选择备份文件<input type="file" id="importFile" accept=".json,application/json" hidden></label>
  </section>
  <section class="card">
    <div class="card-h"><h2>记录概况</h2></div>
    <div class="kv"><span>累计学习</span><b>${fmtDur(totalSec)}</b></div>
    <div class="kv"><span>学完的课</span><b>${Object.keys(st.done).length}</b></div>
    <div class="kv"><span>做过的题</span><b>${Object.keys(st.answers).length}</b></div>
    <div class="kv"><span>错题本</span><b>${Object.keys(st.review).length}</b></div>
  </section>
  <section class="card">
    <div class="card-h"><h2>清空记录</h2></div>
    <p class="small">删除这台设备上的所有学习记录，不能撤销。建议先导出。</p>
    <button class="btn btn-bad" id="resetBtn">清空所有记录</button>
  </section>`;
  $('#exportBtn', v).onclick = () => {
    try {
      const blob = new Blob([S.exportData()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `lunastudy-backup-${S.dayKey()}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      toast('已导出');
    } catch (e) { alert('导出失败：' + e.message); }
  };
  $('#importFile', v).onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      if (!confirm('导入会覆盖这台设备上现在的学习记录，确定吗？')) return;
      S.importData(text);
      toast('导入成功');
      viewSettings(v);
    } catch (err) {
      alert('导入失败：' + (err instanceof SyntaxError ? '文件不是有效的 JSON' : err.message));
    } finally { e.target.value = ''; }
  };
  $('#resetBtn', v).onclick = () => {
    if (!confirm('确定清空所有学习记录？不能撤销。')) return;
    S.resetAll();
    toast('已清空');
    viewSettings(v);
  };
}

// ---------------- 启动 ----------------
shell();
window.addEventListener('hashchange', route);
route();

// 读取 content/ 下所有课程和课：新增 .md 文件后重新构建就自动出现，不用改代码
import { load as yamlLoad } from 'js-yaml';
import { renderMarkdown } from './markdown.js';

const courseFiles = import.meta.glob('../content/*/course.json', { eager: true, import: 'default' });
const lessonFiles = import.meta.glob('../content/*/*.md', { eager: true, query: '?raw', import: 'default' });

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  return { meta: yamlLoad(m[1]) || {}, body: m[2] };
}

const courses = [];
const courseMap = new Map();
for (const [path, data] of Object.entries(courseFiles)) {
  const id = path.split('/').at(-2);
  const c = { id, title: data.title || id, en: data.en || '', desc: data.desc || '', order: data.order ?? 99, lessons: [] };
  courses.push(c);
  courseMap.set(id, c);
}

const lessonMap = new Map();
for (const [path, raw] of Object.entries(lessonFiles)) {
  const parts = path.split('/');
  const courseId = parts.at(-2);
  const slug = parts.at(-1).replace(/\.md$/, '');
  if (slug.startsWith('_')) continue; // 下划线开头 = 草稿，不上线
  let course = courseMap.get(courseId);
  if (!course) {
    course = { id: courseId, title: courseId, en: '', desc: '', order: 99, lessons: [] };
    courses.push(course);
    courseMap.set(courseId, course);
  }
  const { meta, body } = parseFrontmatter(raw);
  const id = `${courseId}/${slug}`;
  const lesson = {
    id, slug, courseId,
    title: meta.title || slug,
    en: meta.en || '',
    order: meta.order ?? 99,
    summary: meta.summary || '',
    placeholder: !!meta.placeholder,
    quiz: (meta.quiz || []).map((q, i) => ({ ...q, id: q.id || `q${i + 1}`, key: `${id}#${q.id || `q${i + 1}`}`, lessonId: id })),
    terms: (meta.terms || []).map(t => ({ zh: t.zh, en: t.en, note: t.note || '', lessonId: id })),
    body,
    _html: null,
  };
  Object.defineProperty(lesson, 'html', { get() { return this._html ??= renderMarkdown(this.body); } });
  course.lessons.push(lesson);
  lessonMap.set(id, lesson);
}

courses.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
for (const c of courses) c.lessons.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

export const getCourses = () => courses;
export const getCourse = id => courseMap.get(id);
export const getLesson = id => lessonMap.get(id);
export const allLessons = () => courses.flatMap(c => c.lessons);
export const allQuestions = () => allLessons().flatMap(l => l.quiz);
export const getQuestion = key => {
  const lessonId = key.split('#')[0];
  return getLesson(lessonId)?.quiz.find(q => q.key === key);
};

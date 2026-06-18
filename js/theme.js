/**
 * theme.js
 * ダークモードの初期判定・トグル・永続化を担当。
 * Tailwind の darkMode:'class' に合わせて <html> の class を切り替える。
 *
 * 初期適用（FOUC回避）の最小処理は index.html の <head> インラインで行い、
 * ここではトグルUIの配線と localStorage 永続化を担う。
 */

const THEME_KEY = 'os2026_theme';
const root = document.documentElement;

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** 現在ダークかどうか */
export function isDark() {
  return root.classList.contains('dark');
}

/** テーマを適用（'dark' | 'light'） */
function apply(theme) {
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  updateToggleIcon();
}

/** 保存されたテーマ、なければシステム設定で初期化 */
export function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch (e) {
    /* noop */
  }
  const theme = saved || (systemPrefersDark() ? 'dark' : 'light');
  apply(theme);
}

/** 明暗を切り替えて保存 */
export function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  apply(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    /* noop */
  }
}

/** トグルボタンのアイコン・aria を現在状態に合わせて更新 */
function updateToggleIcon() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const dark = isDark();
  btn.setAttribute('aria-pressed', String(dark));
  btn.setAttribute('aria-label', dark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
  const sun = btn.querySelector('[data-icon="sun"]');
  const moon = btn.querySelector('[data-icon="moon"]');
  if (sun && moon) {
    sun.classList.toggle('hidden', !dark); // dark時は「太陽（＝ライトへ）」を表示
    moon.classList.toggle('hidden', dark);
  }
}

/** トグルボタンにイベントを配線 */
export function wireThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
    updateToggleIcon();
  }
}

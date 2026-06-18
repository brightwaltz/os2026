/**
 * ui.js
 * 画面描画とユーザ操作の受け付けを担当するモジュール。
 * 状態は持たず、与えられた state を描画し、操作をコールバックで通知する。
 *
 * 画面:
 *   1) 開始画面  showStart()
 *   2) 出題画面  showQuestion()  … 各問即時フィードバック
 *   3) 結果画面  showResult()    … 総評・回別内訳・誤答一覧
 */

import { APP_CONFIG } from './config.js';
import { QUIZ, TOTAL_QUESTIONS, LECTURE_TITLES } from './quiz-data.js';
import {
  currentQuestion,
  currentAnswer,
  isLast,
  score,
  durationSec,
  byLecture,
  wrongIndices,
} from './state.js';

const app = () => document.getElementById('app');

/* ───────────────── ユーティリティ ───────────────── */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

/** 全問の所要時間の目安（分）。1問あたり想定秒数から算出し、5分単位に丸める。 */
function estimatedMinutes() {
  const totalMin = (TOTAL_QUESTIONS * APP_CONFIG.estSecondsPerQuestion) / 60;
  return Math.max(5, Math.round(totalMin / 5) * 5);
}

function letter(i) {
  return String.fromCharCode(65 + i); // A, B, C, ...
}

function mount(html) {
  const root = app();
  root.innerHTML = html;
  root.scrollTo?.({ top: 0 });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ───────────────── 開始画面 ───────────────── */

export function showStart({ profile, hasSubmitted, submission, onStart }) {
  const reviewBanner = hasSubmitted
    ? `<div class="mb-6 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
         <span class="font-semibold">送信済みです。</span>
         前回スコア ${submission?.lastScore ?? '-'}/${submission?.lastTotal ?? TOTAL_QUESTIONS}。
         もう一度挑戦できますが、<span class="font-semibold">復習モード（再送信なし）</span>になります。
       </div>`
    : '';

  const p = profile || { email: '', studentId: '', name: '' };

  mount(`
    <section class="mx-auto max-w-2xl animate-fade-in">
      ${reviewBanner}
      <div class="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-card backdrop-blur dark:border-slate-700/70 dark:bg-slate-800/60 sm:p-8">
        <p class="mb-2 text-sm font-medium tracking-wide text-brand-600 dark:text-brand-300">${esc(APP_CONFIG.institution)}</p>
        <h2 class="font-serif text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">${esc(APP_CONFIG.courseTitle)}</h2>
        <p class="mt-1 text-lg text-slate-600 dark:text-slate-300">${esc(APP_CONFIG.quizTitle)}</p>

        <p class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
          <svg class="h-4 w-4 text-brand-500 dark:text-brand-300" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM11 6a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z" clip-rule="evenodd"/></svg>
          所要時間の目安：約${estimatedMinutes()}分
        </p>

        <ul class="mt-5 grid grid-cols-3 gap-3 text-center">
          <li class="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-700/40">
            <div class="font-serif text-2xl font-bold text-brand-600 dark:text-brand-300">${TOTAL_QUESTIONS}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">問題数</div>
          </li>
          <li class="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-700/40">
            <div class="font-serif text-2xl font-bold text-brand-600 dark:text-brand-300">7</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">対象回（第1〜7回）</div>
          </li>
          <li class="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-700/40">
            <div class="font-serif text-2xl font-bold text-brand-600 dark:text-brand-300">即時</div>
            <div class="text-xs text-slate-500 dark:text-slate-400">解説表示</div>
          </li>
        </ul>

        <form id="start-form" class="mt-7 space-y-4" novalidate>
          <div>
            <label for="f-email" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">メールアドレス <span class="text-rose-500">*</span></label>
            <input id="f-email" name="email" type="email" autocomplete="email" required
              value="${esc(p.email)}"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white"
              placeholder="you@example.com" />
            <p data-err="email" class="mt-1 hidden text-xs text-rose-500"></p>
          </div>
          <div>
            <label for="f-sid" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">学籍番号 <span class="text-rose-500">*</span> <span class="text-xs font-normal text-slate-400">（数字のみ）</span></label>
            <input id="f-sid" name="studentId" type="text" inputmode="numeric" pattern="[0-9]*" required
              value="${esc(p.studentId)}"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white"
              placeholder="123456789" />
            <p data-err="studentId" class="mt-1 hidden text-xs text-rose-500"></p>
          </div>
          <div>
            <label for="f-name" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">氏名 <span class="text-rose-500">*</span></label>
            <input id="f-name" name="name" type="text" autocomplete="name" required
              value="${esc(p.name)}"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-900/40 dark:text-white"
              placeholder="例) 玉川 太郎" />
            <p data-err="name" class="mt-1 hidden text-xs text-rose-500"></p>
          </div>

          <button type="submit"
            class="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/30 active:scale-[0.99]">
            クイズを開始する
            <svg class="h-5 w-5 transition group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
          <p class="text-center text-xs text-slate-400">回答内容は学習記録として教員に送信されます。</p>
        </form>
      </div>
    </section>
  `);

  const form = document.getElementById('start-form');
  const showErr = (field, msg) => {
    const el = form.querySelector(`[data-err="${field}"]`);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.classList.remove('hidden');
    } else {
      el.textContent = '';
      el.classList.add('hidden');
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      email: form.email.value.trim(),
      studentId: form.studentId.value.trim(),
      name: form.name.value.trim(),
    };
    let ok = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      showErr('email', '有効なメールアドレスを入力してください。');
      ok = false;
    } else showErr('email', '');
    if (!/^[0-9]+$/.test(data.studentId)) {
      showErr('studentId', '学籍番号は数字のみで入力してください。');
      ok = false;
    } else showErr('studentId', '');
    if (data.name.length === 0) {
      showErr('name', '氏名を入力してください。');
      ok = false;
    } else showErr('name', '');
    if (ok) onStart(data);
  });

  document.getElementById('f-email')?.focus();
}

/* ───────────────── 出題画面 ───────────────── */

export function showQuestion(state, { onAnswer, onNext }) {
  const q = currentQuestion(state);
  const ans = currentAnswer(state);
  const num = state.index + 1;
  const progress = Math.round((num / TOTAL_QUESTIONS) * 100);
  const isMulti = q.type === 'multi';

  const typeLabel =
    q.type === 'multi' ? '複数選択（あてはまるものをすべて）' : q.type === 'boolean' ? '正誤問題' : '択一問題';

  const choicesHtml = q.choices
    .map(
      (c, i) => `
      <button type="button" data-choice="${i}"
        role="${isMulti ? 'checkbox' : 'radio'}" aria-checked="false"
        class="choice group flex w-full items-start gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left transition hover:border-brand-400 hover:bg-brand-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-brand-400/70 dark:hover:bg-slate-700/40">
        <span class="mark flex h-7 w-7 flex-none items-center justify-center rounded-${isMulti ? 'md' : 'full'} border border-slate-300 text-sm font-semibold text-slate-500 transition dark:border-slate-500 dark:text-slate-300">${letter(i)}</span>
        <span class="pt-0.5 text-slate-800 dark:text-slate-100">${esc(c)}</span>
      </button>`
    )
    .join('');

  mount(`
    <section class="mx-auto max-w-2xl animate-fade-in">
      <div class="mb-4">
        <div class="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>問 ${num} / ${TOTAL_QUESTIONS}</span>
          <span>${progress}%</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500" style="width:${progress}%"></div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-card backdrop-blur dark:border-slate-700/70 dark:bg-slate-800/60 sm:p-7">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <span class="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">第${q.lecture}回</span>
          <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">${esc(typeLabel)}</span>
        </div>
        <h2 class="mb-5 font-serif text-lg font-bold leading-relaxed text-slate-900 dark:text-white sm:text-xl">${esc(q.q)}</h2>

        <div id="choices" role="${isMulti ? 'group' : 'radiogroup'}" class="space-y-2.5">
          ${choicesHtml}
        </div>

        <div id="feedback" class="mt-5 hidden"></div>

        <div class="mt-6 flex items-center justify-between gap-3">
          <p id="hint" class="text-xs text-slate-400">${isMulti ? '複数選択できます。' : '選択肢をクリック、または数字キーで選べます。'}</p>
          <button id="primary-btn" type="button"
            class="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99]"
            disabled>解答する</button>
        </div>
      </div>
    </section>
  `);

  const choicesEl = document.getElementById('choices');
  const primaryBtn = document.getElementById('primary-btn');
  const feedbackEl = document.getElementById('feedback');
  let selected = [];
  let phase = 'answering'; // 'answering' -> 'answered'

  function refreshChoiceStyles() {
    choicesEl.querySelectorAll('.choice').forEach((btn) => {
      const i = Number(btn.dataset.choice);
      const on = selected.includes(i);
      btn.setAttribute('aria-checked', String(on));
      btn.classList.toggle('border-brand-500', on);
      btn.classList.toggle('bg-brand-50/70', on);
      btn.classList.toggle('dark:bg-brand-500/15', on);
      const mark = btn.querySelector('.mark');
      mark.classList.toggle('bg-brand-600', on);
      mark.classList.toggle('text-white', on);
      mark.classList.toggle('border-brand-600', on);
    });
    primaryBtn.disabled = selected.length === 0;
  }

  function selectChoice(i) {
    if (phase !== 'answering') return;
    if (isMulti) {
      selected = selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i];
    } else {
      selected = [i];
    }
    refreshChoiceStyles();
  }

  function lockAndReveal(result) {
    phase = 'answered';
    // 選択不可にし、正解/不正解で色付け
    choicesEl.querySelectorAll('.choice').forEach((btn) => {
      const i = Number(btn.dataset.choice);
      btn.disabled = true;
      btn.classList.add('cursor-default');
      const isCorrectChoice = q.answer.includes(i);
      const wasSelected = result.selected.includes(i);
      if (isCorrectChoice) {
        btn.classList.add('border-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-500/15');
        btn.querySelector('.mark').classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
      } else if (wasSelected) {
        btn.classList.add('border-rose-400', 'bg-rose-50', 'dark:bg-rose-500/10');
        btn.querySelector('.mark').classList.add('bg-rose-500', 'text-white', 'border-rose-500');
      }
    });

    const correct = result.correct;
    feedbackEl.innerHTML = `
      <div class="rounded-xl border p-4 ${
        correct
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10'
          : 'border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10'
      }">
        <div class="mb-1.5 flex items-center gap-2 font-bold ${correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}">
          ${
            correct
              ? '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>正解'
              : '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4L10 11.4l1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 10-1.4-1.4L10 8.6 8.7 7.3z" clip-rule="evenodd"/></svg>不正解'
          }
        </div>
        <p class="text-sm leading-relaxed text-slate-700 dark:text-slate-200">${esc(q.explanation)}</p>
        <p class="mt-2 text-xs text-slate-400">出典: ${esc(q.source)}</p>
      </div>`;
    feedbackEl.classList.remove('hidden');

    document.getElementById('hint').textContent = '';
    primaryBtn.disabled = false;
    primaryBtn.textContent = isLast(state) ? '結果を見る' : '次の問題へ';
    primaryBtn.focus();
  }

  // クリック選択
  choicesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice');
    if (!btn || btn.disabled) return;
    selectChoice(Number(btn.dataset.choice));
  });

  // 主ボタン: answering→採点 / answered→次へ
  primaryBtn.addEventListener('click', () => {
    if (phase === 'answering') {
      if (selected.length === 0) return;
      const result = onAnswer(selected);
      lockAndReveal(result);
    } else {
      onNext();
    }
  });

  // キーボード操作
  function keyHandler(e) {
    if (phase === 'answering') {
      const n = Number(e.key);
      if (n >= 1 && n <= q.choices.length) {
        selectChoice(n - 1);
        e.preventDefault();
      } else if (e.key === 'Enter' && selected.length > 0) {
        primaryBtn.click();
        e.preventDefault();
      }
    } else if (e.key === 'Enter') {
      primaryBtn.click();
      e.preventDefault();
    }
  }
  document.addEventListener('keydown', keyHandler);
  // 画面差し替え時に解除されるよう、mount のたびに新規付与（古いものはノード破棄で無効化）
  // 明示解除のためハンドラを section に保持
  app().__keyHandler && document.removeEventListener('keydown', app().__keyHandler);
  app().__keyHandler = keyHandler;
}

/* ───────────────── 結果画面 ───────────────── */

function verdict(percent) {
  if (percent >= 90)
    return { title: '素晴らしい！', msg: 'OSの基礎概念をしっかり理解できています。この調子で応用範囲も深めていきましょう。', tone: 'emerald' };
  if (percent >= 70)
    return { title: 'よくできました', msg: '主要な概念は概ね定着しています。間違えた問題の解説を見直すとさらに盤石になります。', tone: 'brand' };
  if (percent >= Math.round(APP_CONFIG.passRatio * 100))
    return { title: '合格ライン', msg: '基礎は押さえられています。誤答した分野を中心に復習して理解を固めましょう。', tone: 'amber' };
  return { title: 'もう一歩', msg: '基礎の取りこぼしがあります。各回の解説とスライドを読み直し、復習モードで再挑戦してみましょう。', tone: 'rose' };
}

export function showResult(state, { submitStatus, onRetry }) {
  const total = TOTAL_QUESTIONS;
  const sc = score(state);
  const percent = Math.round((sc / total) * 100);
  const v = verdict(percent);
  const per = byLecture(state);
  const wrongs = wrongIndices(state);

  const toneRing = {
    emerald: 'text-emerald-500',
    brand: 'text-brand-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
  }[v.tone];

  const circumference = 2 * Math.PI * 52;
  const dash = (percent / 100) * circumference;

  const perLectureHtml = Object.keys(per)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => {
      const { correct, total: t } = per[k];
      const pct = Math.round((correct / t) * 100);
      return `
        <div>
          <div class="mb-1 flex items-center justify-between text-sm">
            <span class="font-medium text-slate-700 dark:text-slate-200">第${k}回 <span class="text-slate-400">${esc(LECTURE_TITLES[k] || '')}</span></span>
            <span class="tabular-nums text-slate-500 dark:text-slate-400">${correct}/${t}</span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style="width:${pct}%"></div>
          </div>
        </div>`;
    })
    .join('');

  const wrongHtml = wrongs.length
    ? wrongs
        .map((i) => {
          const q = QUIZ[i];
          const a = state.answers[i];
          const yours = a.selected.map((x) => letter(x)).join(', ') || '（未選択）';
          const corr = q.answer.map((x) => letter(x)).join(', ');
          return `
          <details class="group rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700/70 dark:bg-slate-800/50">
            <summary class="flex cursor-pointer list-none items-start gap-2 font-medium text-slate-800 dark:text-slate-100">
              <span class="mt-0.5 rounded bg-rose-100 px-1.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">第${q.lecture}回</span>
              <span class="flex-1">${esc(q.q)}</span>
              <svg class="h-5 w-5 flex-none text-slate-400 transition group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" clip-rule="evenodd"/></svg>
            </summary>
            <div class="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm dark:border-slate-700">
              ${q.choices
                .map(
                  (c, ci) =>
                    `<div class="flex items-start gap-2 ${q.answer.includes(ci) ? 'font-semibold text-emerald-600 dark:text-emerald-400' : a.selected.includes(ci) ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}">
                       <span>${letter(ci)}.</span><span>${esc(c)}${q.answer.includes(ci) ? '　✔' : a.selected.includes(ci) ? '　✘' : ''}</span>
                     </div>`
                )
                .join('')}
              <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">あなたの解答: ${yours} ／ 正解: ${corr}</p>
              <p class="rounded-lg bg-slate-50 p-3 leading-relaxed text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">${esc(q.explanation)}</p>
              <p class="text-xs text-slate-400">出典: ${esc(q.source)}</p>
            </div>
          </details>`;
        })
        .join('')
    : `<p class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">全問正解です。誤答はありません！</p>`;

  const submitBadge = (() => {
    if (state.reviewMode)
      return `<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">復習モード（送信なし）</span>`;
    if (submitStatus === 'success')
      return `<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.8a1 1 0 011.4 0z" clip-rule="evenodd"/></svg>送信完了</span>`;
    if (submitStatus === 'sending')
      return `<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"><span class="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></span>送信中…</span>`;
    if (submitStatus === 'error')
      return `<span class="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">送信エラー（通信環境をご確認ください）</span>`;
    return '';
  })();

  mount(`
    <section class="mx-auto max-w-2xl animate-fade-in space-y-5">
      <div class="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-card backdrop-blur dark:border-slate-700/70 dark:bg-slate-800/60 sm:p-8">
        <div class="relative mx-auto h-36 w-36">
          <svg class="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="10" class="text-slate-200 dark:text-slate-700"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"
              class="${toneRing} transition-all duration-1000" stroke-dasharray="${dash} ${circumference}"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-serif text-4xl font-bold text-slate-900 dark:text-white">${percent}<span class="text-xl">%</span></span>
            <span class="text-sm text-slate-500 dark:text-slate-400">${sc} / ${total} 問</span>
          </div>
        </div>
        <h2 class="mt-4 font-serif text-2xl font-bold text-slate-900 dark:text-white">${esc(v.title)}</h2>
        <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">${esc(v.msg)}</p>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          ${submitBadge}
          <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">所要時間 ${fmtDuration(durationSec(state))}</span>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-card backdrop-blur dark:border-slate-700/70 dark:bg-slate-800/60">
        <h3 class="mb-4 font-serif text-lg font-bold text-slate-900 dark:text-white">回別の正答状況</h3>
        <div class="space-y-3.5">${perLectureHtml}</div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-card backdrop-blur dark:border-slate-700/70 dark:bg-slate-800/60">
        <h3 class="mb-4 font-serif text-lg font-bold text-slate-900 dark:text-white">復習：間違えた問題 <span class="text-sm font-normal text-slate-400">(${wrongs.length}問)</span></h3>
        <div class="space-y-3">${wrongHtml}</div>
      </div>

      <button id="retry-btn" type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-brand-400/70 dark:hover:text-brand-300">
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7 7 0 1111.601 5.927 1 1 0 11-1.2-1.6A5 5 0 105 7.101V8a1 1 0 11-2 0V3a1 1 0 011-1z" clip-rule="evenodd"/></svg>
        もう一度挑戦する（復習モード）
      </button>
    </section>
  `);

  document.getElementById('retry-btn')?.addEventListener('click', onRetry);
}

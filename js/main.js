/**
 * main.js
 * アプリのエントリポイント兼コントローラ。
 * state / ui / form-submit / storage / theme を仲介して画面遷移を制御する。
 */

import { initTheme, wireThemeToggle } from './theme.js';
import * as Store from './storage.js';
import * as S from './state.js';
import * as UI from './ui.js';
import { submitToForm } from './form-submit.js';

const state = S.createState();

/* ── 開始画面 ── */
function goStart() {
  UI.showStart({
    profile: Store.getProfile(),
    hasSubmitted: Store.hasSubmitted(),
    submission: Store.getSubmission(),
    onStart: (profile) => {
      S.setProfile(state, profile);
      Store.saveProfile(profile);
      // 既に送信済みなら復習モード（再送信しない）
      const reviewMode = Store.hasSubmitted();
      S.start(state, { reviewMode });
      goQuestion();
    },
  });
}

/* ── 出題画面 ── */
function goQuestion() {
  UI.showQuestion(state, {
    onAnswer: (selected) => S.submitAnswer(state, selected),
    onNext: () => {
      if (S.isLast(state)) {
        S.finish(state);
        goResult();
      } else {
        S.next(state);
        goQuestion();
      }
    },
  });
}

/* ── 結果画面（＋必要なら送信） ── */
async function goResult() {
  // 復習モードは送信しない
  if (state.reviewMode) {
    UI.showResult(state, { submitStatus: 'none', onRetry: retry });
    return;
  }

  // 完了時に1回だけ送信
  UI.showResult(state, { submitStatus: 'sending', onRetry: retry });

  const payload = S.buildResultPayload(state);
  const resultJson = JSON.stringify(payload);
  // フォームのメール収集はオフ。メールは resultJson 内に含めているため
  // emailAddress パラメータは送らない（学籍番号・氏名・結果データの3項目のみ）。
  const res = await submitToForm({
    studentId: state.profile.studentId,
    name: state.profile.name,
    resultJson,
  });

  if (res.ok) {
    Store.markSubmitted({
      submittedAt: payload.submittedAt,
      score: payload.score,
      total: payload.total,
      profile: state.profile,
    });
    // 送信完了を表示（reviewMode は変更しない＝このバッジは「送信完了」のまま）。
    // 以後の再挑戦は retry() / goStart() が hasSubmitted を見て復習モードにする。
    UI.showResult(state, { submitStatus: 'success', onRetry: retry });
  } else {
    UI.showResult(state, { submitStatus: 'error', onRetry: retry });
  }
}

/* ── 再挑戦（復習モード・非送信） ── */
function retry() {
  S.start(state, { reviewMode: true });
  goQuestion();
}

/* ── 起動 ── */
function boot() {
  initTheme();
  wireThemeToggle();
  goStart();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

/**
 * state.js
 * クイズの進行状態を一元管理するモジュール（純粋なロジック、DOM非依存）。
 *  - 受験者プロフィール
 *  - 現在の設問インデックス
 *  - 各問の解答・正誤
 *  - 所要時間
 * 採点・集計のヘルパも提供する。
 */

import { QUIZ } from './quiz-data.js';

/** 配列の中身が（順不同で）等しいか */
function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

export function createState() {
  return {
    profile: { email: '', studentId: '', name: '' },
    index: 0,
    // answers[i] = { selected:number[], correct:boolean, answered:boolean }
    answers: QUIZ.map(() => ({ selected: [], correct: false, answered: false })),
    startedAt: 0,
    finishedAt: 0,
    reviewMode: false, // 送信済みでの再挑戦（=非送信）か
  };
}

export function setProfile(state, profile) {
  state.profile = { ...profile };
}

export function start(state, { reviewMode = false } = {}) {
  state.index = 0;
  state.answers = QUIZ.map(() => ({ selected: [], correct: false, answered: false }));
  state.startedAt = Date.now();
  state.finishedAt = 0;
  state.reviewMode = reviewMode;
}

export function currentQuestion(state) {
  return QUIZ[state.index];
}

export function currentAnswer(state) {
  return state.answers[state.index];
}

/** 解答を確定して採点する。確定済みなら何もしない。 */
export function submitAnswer(state, selected) {
  const ans = state.answers[state.index];
  if (ans.answered) return ans;
  const q = QUIZ[state.index];
  ans.selected = [...selected];
  ans.correct = sameSet(selected, q.answer);
  ans.answered = true;
  return ans;
}

export function isLast(state) {
  return state.index >= QUIZ.length - 1;
}

export function next(state) {
  if (!isLast(state)) state.index += 1;
  return state.index;
}

export function finish(state) {
  if (!state.finishedAt) state.finishedAt = Date.now();
}

export function answeredCount(state) {
  return state.answers.filter((a) => a.answered).length;
}

export function score(state) {
  return state.answers.filter((a) => a.correct).length;
}

export function durationSec(state) {
  const end = state.finishedAt || Date.now();
  return Math.max(0, Math.round((end - state.startedAt) / 1000));
}

/** 回（lecture）別の正答数/出題数を集計 */
export function byLecture(state) {
  const acc = {};
  QUIZ.forEach((q, i) => {
    const k = q.lecture;
    if (!acc[k]) acc[k] = { correct: 0, total: 0 };
    acc[k].total += 1;
    if (state.answers[i].correct) acc[k].correct += 1;
  });
  return acc;
}

/** 誤答した設問のインデックス一覧 */
export function wrongIndices(state) {
  const out = [];
  state.answers.forEach((a, i) => {
    if (a.answered && !a.correct) out.push(i);
  });
  return out;
}

/** Googleフォーム送信用の結果データ（JSON文字列の元になるオブジェクト） */
export function buildResultPayload(state) {
  const total = QUIZ.length;
  const sc = score(state);
  const perLecture = byLecture(state);
  const byLectureStr = {};
  Object.keys(perLecture)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((k) => {
      byLectureStr[`第${k}回`] = `${perLecture[k].correct}/${perLecture[k].total}`;
    });
  return {
    // フォームのメール収集はオフのため、メールは結果データJSONに保持する
    email: state.profile.email,
    score: sc,
    total,
    percent: Math.round((sc / total) * 100),
    durationSec: durationSec(state),
    submittedAt: new Date().toISOString(),
    byLecture: byLectureStr,
    answers: state.answers.map((a, i) => ({
      q: QUIZ[i].id,
      sel: a.selected,
      correct: a.correct,
    })),
  };
}

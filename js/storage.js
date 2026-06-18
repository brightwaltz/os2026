/**
 * storage.js
 * localStorage への薄いラッパ。送信済みフラグや受験者情報を永続化する。
 * localStorage が使えない環境（プライベートモード等）でも例外で落ちないようガードする。
 */

import { APP_CONFIG } from './config.js';

const KEY = APP_CONFIG.storageKey;

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeAll(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
    return true;
  } catch (e) {
    return false;
  }
}

/** 送信済みかどうか */
export function hasSubmitted() {
  return Boolean(readAll().submittedAt);
}

/** 送信済み情報（時刻・スコア等）を取得 */
export function getSubmission() {
  const all = readAll();
  return all.submittedAt ? all : null;
}

/** 送信完了を記録（完了時1回のみ送信のため） */
export function markSubmitted(payload) {
  const all = readAll();
  all.submittedAt = payload.submittedAt;
  all.lastScore = payload.score;
  all.lastTotal = payload.total;
  // 受験者情報は次回の入力補助として保持（メールは保持しない方針も可）
  all.profile = payload.profile || all.profile || null;
  writeAll(all);
}

/** 保存済みの受験者プロフィール（氏名・学籍番号・メール）を取得 */
export function getProfile() {
  return readAll().profile || null;
}

/** 受験者プロフィールを保存（再受験時の再入力を省くため） */
export function saveProfile(profile) {
  const all = readAll();
  all.profile = profile;
  writeAll(all);
}

/** すべてのローカル記録を消去（デバッグ・やり直し用） */
export function clearAll() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* noop */
  }
}

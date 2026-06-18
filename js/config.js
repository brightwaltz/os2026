/**
 * config.js
 * アプリ全体の設定とGoogleフォーム連携の定数を集約するモジュール。
 * フォームの差し替え時はこのファイルだけを編集すればよい。
 *
 * entry ID は対象フォームの FB_PUBLIC_LOAD_DATA_ を解析して確定したもの。
 *  - entry.1839097959 : 学籍番号（必須・数字のみ）
 *  - entry.41642044   : 氏名（必須）
 *  - entry.223334294  : クイズ結果データ（必須・段落）
 *  - emailAddress     : メールアドレス収集（回答者入力モード）
 */

export const FORM_CONFIG = Object.freeze({
  // 末尾は必ず /formResponse （/viewform ではない）
  actionUrl:
    'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfdZLbXCM_K1NMz0WaYjO01PIVpoMXOBhgHkVkS2-v6ipETYw/formResponse',
  fields: Object.freeze({
    email: 'emailAddress',
    studentId: 'entry.1839097959',
    name: 'entry.41642044',
    resultData: 'entry.223334294',
  }),
  // 送信安定化のための補助パラメータ
  extras: Object.freeze({
    fvv: '1',
    pageHistory: '0',
    submit: 'Submit',
  }),
});

export const APP_CONFIG = Object.freeze({
  courseTitle: 'オペレーティングシステム',
  quizTitle: '第1回〜第7回 復習クイズ',
  institution: '玉川大学 工学部',
  storageKey: 'os2026_quiz_state',
  // 合格ライン（総評の閾値の一つ）
  passRatio: 0.6,
  // 学籍番号の桁数めやす（数字のみ・参考表示用）
  studentIdPattern: /^[0-9]{6,10}$/,
});

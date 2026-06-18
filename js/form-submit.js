/**
 * form-submit.js
 * Googleフォームの formResponse エンドポイントへ、ページ遷移なしで
 * バックグラウンド送信するモジュール。
 *
 * Googleフォームは CORS を許可しないため mode:'no-cors' を用いる。
 * no-cors ではレスポンス内容を読めない（opaque）ため、
 * 「リクエストが拒否されずに完了したこと」をもって送信成功とみなす。
 *
 * 失敗の保険として、fetch が使えない/例外時には隠しフォーム+iframe方式に
 * フォールバックする（どちらもページ遷移を起こさない）。
 */

import { FORM_CONFIG } from './config.js';

/** 送信パラメータ（URLSearchParams 化前のプレーンオブジェクト）を組み立てる */
function buildParams({ email, studentId, name, resultJson }) {
  const f = FORM_CONFIG.fields;
  const params = {};
  if (email) params[f.email] = email;
  params[f.studentId] = studentId;
  params[f.name] = name;
  params[f.resultData] = resultJson;
  Object.assign(params, FORM_CONFIG.extras);
  return params;
}

/** fetch + no-cors による送信 */
async function sendViaFetch(params) {
  const body = new URLSearchParams(params);
  await fetch(FORM_CONFIG.actionUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  // no-cors のため response は不可視。例外が出なければ送信できたとみなす。
  return true;
}

/** 隠し form + 隠し iframe による送信（フォールバック、ページ遷移なし） */
function sendViaHiddenForm(params) {
  return new Promise((resolve) => {
    const iframeName = 'os2026_hidden_sink';
    let iframe = document.getElementById(iframeName);
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.name = iframeName;
      iframe.id = iframeName;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    const form = document.createElement('form');
    form.action = FORM_CONFIG.actionUrl;
    form.method = 'POST';
    form.target = iframeName;
    form.style.display = 'none';
    Object.entries(params).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    // 送信後に片付け
    setTimeout(() => {
      form.remove();
      resolve(true);
    }, 800);
  });
}

/**
 * 結果をGoogleフォームへ送信する。
 * @param {{email:string, studentId:string, name:string, resultJson:string}} data
 * @returns {Promise<{ok:boolean, via:string}>}
 */
export async function submitToForm(data) {
  const params = buildParams(data);
  try {
    await sendViaFetch(params);
    return { ok: true, via: 'fetch' };
  } catch (e) {
    // ネットワーク以外の例外時はフォールバック
    try {
      await sendViaHiddenForm(params);
      return { ok: true, via: 'iframe' };
    } catch (e2) {
      return { ok: false, via: 'none' };
    }
  }
}

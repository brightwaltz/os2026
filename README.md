# オペレーティングシステム 復習クイズ

玉川大学 工学部「オペレーティングシステム」第1回〜第7回の復習クイズ（静的フロントエンド）。
学生がブラウザで全58問を解き、結果を裏側で Google フォームへ自動送信します。

**公開URL: https://brightwaltz.github.io/os2026/**

## 特長

- **全58問**（第1〜7回の講義スライドを出典に作成、各問に解説・出典付き）
- **各問即時フィードバック** ＋ 最後に総評・回別正答率・誤答復習
- **ダークモード**対応（自動判定＋手動トグル、設定は保存）
- **ゼロビルド**：HTML + 素の ES Modules + Tailwind(Play CDN)。GitHub Pages に置くだけ
- 結果は **Google フォームへバックグラウンド送信**（ページ遷移なし）

## ディレクトリ構成

```
os2026/
├── index.html        エントリ（Tailwind設定・フォント・テーマ初期化）
├── .nojekyll         GitHub Pages 用（ファイルをそのまま配信）
├── css/custom.css    最小カスタムCSS
└── js/
    ├── main.js        コントローラ（画面遷移）
    ├── config.js      Googleフォーム連携の定数（差し替えはここだけ）
    ├── quiz-data.js   50問データ
    ├── state.js       状態管理・採点・集計
    ├── ui.js          画面描画（開始/出題/結果）
    ├── form-submit.js Googleフォーム no-cors 送信
    ├── theme.js       ダークモード
    └── storage.js     localStorage（送信済み・プロフィール）
```

## ローカルでの確認

ES Modules は `file://` では動かないため、簡易HTTPサーバで開きます。

```bash
cd os2026
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

## GitHub Pages へのデプロイ

1. このディレクトリを Git リポジトリにして GitHub に push
   ```bash
   cd os2026
   git init && git add -A && git commit -m "OS復習クイズ"
   git branch -M main
   git remote add origin https://github.com/<ユーザ名>/<リポジトリ名>.git
   git push -u origin main
   ```
2. GitHub の **Settings → Pages** で、Source を `Deploy from a branch`、Branch を `main` / `root` に設定
3. 数十秒後、`https://<ユーザ名>.github.io/<リポジトリ名>/` で公開

## Google フォーム連携の仕様

フォーム連携の具体的な値（Action URL・各フィールドの `entry.xxxxx` ID）は **`js/config.js` に集約**しています。対象フォームの `FB_PUBLIC_LOAD_DATA_` を解析して確定し、実送信（HTTP 200）で検証済みです。差し替え時は `js/config.js` のみを編集してください。

送信する項目は次の3つです（具体的なパラメータ名は `js/config.js` を参照）。

| 項目 | 内容 |
| --- | --- |
| 学籍番号 | 数字のみ |
| 氏名 | 受験者氏名 |
| クイズ結果データ | 結果JSONを格納。メールアドレスもこの中に含む |

- **メール収集はフォーム側でオフ**。Googleフォームの「メールアドレスを収集」を「確認済み（ログイン必須）」のままにすると匿名のno-cors送信が `HTTP 400` で拒否されるため、収集をオフにしています。メールアドレスは結果JSON内（`email`）に保持します。
- 送信は `fetch(..., { mode: 'no-cors' })`。CORS の都合でレスポンスは読めないため、例外なく完了したら成功とみなします（保険として隠しiframe方式へフォールバック）。
- **完了時に1回だけ送信**。送信後は `localStorage` に記録し、以降の再挑戦は**復習モード（再送信なし）**になります。

### 結果データ（クイズ結果データ欄）のJSON形式（例）

```json
{
  "email": "you@example.com",
  "score": 42, "total": 50, "percent": 84,
  "durationSec": 612,
  "submittedAt": "2026-06-18T05:00:00.000Z",
  "byLecture": { "第1回": "6/7", "第2回": "8/9", "...": "..." },
  "answers": [ { "q": 1, "sel": [0], "correct": true } ]
}
```

## 注意

- クライアントのみで動作するため、第三者による送信を完全には防げません（学内利用前提）。
- Tailwind Play CDN は本番非推奨の警告が出ます。気になる場合は Tailwind CLI でCSSをプリビルドして差し替えてください（クラス駆動のため移行は容易）。
- 問題内容は講義スライドに基づく要約・再構成です。教材の更新時は `js/quiz-data.js` を編集してください。

# 運用テスト手順

本番環境（Vercel）で ailine を実際に動作させるための手順です。

---

## 前提条件

- Vercel にデプロイ済み（例: `https://ailine-ten.vercel.app`）
- 以下の環境変数が Vercel に設定済み:
  - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
  - `AUTH_SECRET`, `NEXTAUTH_URL`, `INITIAL_ADMIN_EMAIL`
  - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
  - `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`

---

## Phase 1: データベースの初期化

ローカルで本番 DB に対してスキーマ適用とシードを実行します。

```bash
# 本番の DB 認証情報を指定して実行
TURSO_DATABASE_URL="libsql://your-db.turso.io" \
TURSO_AUTH_TOKEN="your-token" \
INITIAL_ADMIN_EMAIL="your-google-email@example.com" \
npm run db:push

TURSO_DATABASE_URL="libsql://your-db.turso.io" \
TURSO_AUTH_TOKEN="your-token" \
INITIAL_ADMIN_EMAIL="your-google-email@example.com" \
npm run db:seed
```

- `INITIAL_ADMIN_EMAIL` は Google ログインに使うメールアドレスを指定
- 初回ログイン時に、このメールのユーザーにシステム管理者ロールが付与されます

---

## Phase 2: LINE 公式アカウントの用意

1. [LINE Developers](https://developers.line.biz/) にログイン
2. **Create a new provider** または既存プロバイダを選択
3. **Create a Messaging API channel**
   - チャネル名・説明を入力
   - プラン: **Developer Trial**（無料）で可
4. 作成後、**Messaging API** タブで以下を取得:
   - **Channel ID**（チャネルID）
   - **Channel secret**（チャネルシークレット）
   - **Channel access token**（長期トークンを発行）

---

## Phase 3: 管理画面で初回ログイン

1. `https://ailine-ten.vercel.app/admin/login` にアクセス
2. **Google でログイン** をクリック
3. Phase 1 で指定した `INITIAL_ADMIN_EMAIL` のアカウントでログイン
4. ログイン後、システム管理者ダッシュボードが表示されます

---

## Phase 4: LINE チャネルの登録

1. 管理画面で **LINE公式アカウント**（`/admin/channels`）を開く
2. **新規チャネル登録** フォームに以下を入力:
   - チャネル ID（Phase 2 で取得）
   - チャネルシークレット
   - チャネルアクセストークン（長期）
3. **登録** をクリック
4. 登録後、チャネル一覧に表示されます

---

## Phase 5: LINE Developers で Webhook を設定

1. LINE Developers のチャネル設定 → **Messaging API** タブ
2. **Webhook URL** に以下を入力（`[チャネルID]` は Phase 2 の Channel ID）:

   ```
   https://ailine-ten.vercel.app/api/webhook/line/[チャネルID]
   ```

   例: チャネルIDが `1234567890` の場合  
   `https://ailine-ten.vercel.app/api/webhook/line/1234567890`

3. **Webhook の利用** を **オン** にする
4. **検証** をクリックして「成功」になることを確認

---

## Phase 6: AI の設定

1. チャネル一覧で、登録したチャネルの **設定** をクリック
2. **AI API 設定** セクションで:
   - プロバイダ（OpenAI / Anthropic / Google）を選択
   - API キーを入力
   - モデル（例: gpt-4o-mini, claude-3-haiku）を選択
3. **保存** をクリック

※ API キーは [OpenAI](https://platform.openai.com/) / [Anthropic](https://console.anthropic.com/) / [Google AI Studio](https://aistudio.google.com/) で取得してください。

---

## Phase 7: プロンプトの設定

1. 同じチャネル詳細ページの **プロンプト** セクション
2. **システムプロンプト** を入力（例: 「あなたは親切なアシスタントです。簡潔に回答してください。」）
3. 必要に応じて **コンテキスト往復数** や **応答最大文字数** を変更
4. **保存** をクリック

---

## Phase 8: 動作確認

1. **LINE アプリ** で、作成した公式アカウントを友だち追加
2. メッセージを送信（例: 「こんにちは」）
3. AI からの返信が届くことを確認

---

## トラブルシューティング

| 症状 | 確認項目 |
|------|----------|
| LINE に返信がこない | Inngest の Sync が有効か、`INNGEST_SIGNING_KEY` / `INNGEST_EVENT_KEY` が正しいか |
| 「サブスクリプションの設定が必要」 | 課金は無効のままで問題ない。システム管理者＝コンテンツ管理者の場合は課金免除になる |
| Webhook 検証失敗 | Webhook URL が `https://ailine-ten.vercel.app/api/webhook/line/[チャネルID]` の形式か、チャネルIDが一致しているか |
| 認証エラー | `NEXTAUTH_URL` が `https://ailine-ten.vercel.app` になっているか、Google OAuth のリダイレクト URI に登録済みか |
| AI が応答しない | AI API 設定で API キーとモデルが正しく保存されているか、利用枠に余裕があるか |

---

## Inngest の稼働確認

本番では [Inngest Dashboard](https://app.inngest.com) の **Runs** で、LINE メッセージ受信時の実行履歴を確認できます。

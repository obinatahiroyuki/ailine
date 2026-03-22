# 環境変数設定ガイド

Vercel およびローカル開発での環境変数の設定方法です。

---

## 1. Vercel での設定手順

1. Vercel ダッシュボードでプロジェクトを開く
2. **Settings** → **Environment Variables** をクリック
3. 以下の変数を1つずつ追加（Production / Preview / Development は必要に応じて選択）

---

## 2. 必須の環境変数

### データベース（Turso）

| 変数名 | 値の取得方法 | 例 |
|--------|--------------|-----|
| `TURSO_DATABASE_URL` | Turso ダッシュボードで DB を選択 → **Connect** → **URL** をコピー | `libsql://ailine-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | 上記の **Auth Token** をコピー。または `turso db tokens create ailine` | `eyJhbGci...` |

### 認証（NextAuth.js）

| 変数名 | 値の取得方法 | 例 |
|--------|--------------|-----|
| `AUTH_SECRET` | ローカルで `npx auth secret` を実行して生成 | 64文字のランダム文字列 |
| `NEXTAUTH_URL` | 本番のURL。Vercel では **https://プロジェクト名.vercel.app** | `https://ailine.vercel.app` |

※ NextAuth v5 では `AUTH_URL` も使用可能。未設定時は `NEXTAUTH_URL` が使われます。

### 初回管理者

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `INITIAL_ADMIN_EMAIL` | 初回ログイン時にシステム管理者ロールを付与するメールアドレス | `admin@example.com` |
| `INITIAL_ADMIN_PASSWORD` | （任意）メール・パスワード認証用の初回パスワード。シード時に設定 | 英数字8文字以上 |

---

## 3. OAuth ログインを使う場合

### Google OAuth

- **他プロジェクトのOAuthクライアントIDを流用可能**。その場合は本アプリのリダイレクトURIを「承認済みのリダイレクト URI」に追加する。
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) にアクセス
2. プロジェクトを作成または選択（既存クライアントの場合は編集）
3. **認証情報** → **認証情報を作成** → **OAuth 2.0 クライアント ID**
4. アプリケーションの種類: **ウェブアプリケーション**
5. 承認済みのリダイレクト URI に追加:
   - 開発: `http://localhost:3000/api/auth/callback/google`
   - 本番: `https://NEXTAUTH_URLのドメイン/api/auth/callback/google`（例：`https://ailine-ten.vercel.app/api/auth/callback/google`）

| 変数名 | 値 |
|--------|-----|
| `AUTH_GOOGLE_ID` | クライアント ID |
| `AUTH_GOOGLE_SECRET` | クライアント シークレット |

### GitHub OAuth（未使用）

コンテンツ管理者はGitHubアカウントを持たない想定のため、**GitHubログインは使用しない**。設定不要。

---

## 4. Inngest（非同期処理）の設定

1. [Inngest](https://app.inngest.com) で Organization を作成しアプリを登録
2. **Sync** で `https://あなたのドメイン/api/inngest` を追加（例：`https://ailine-ten.vercel.app/api/inngest`）
3. キーを取得して Vercel に設定:
   - **Signing Keys** 画面 → Current key をコピー → `INNGEST_SIGNING_KEY`
   - **Event Keys** 画面 → Default ingest key をコピー → `INNGEST_EVENT_KEY`

| 変数名 | 取得場所 |
|--------|----------|
| `INNGEST_SIGNING_KEY` | Signing Keys 画面の Current key |
| `INNGEST_EVENT_KEY` | Event Keys 画面の Default ingest key |

---

## 5. 課金（Stripe）を有効にする場合

※ **課金はデフォルト無効**。運用開始後に設定して有効化可能。最初のデプロイ時は不要。

1. [Stripe Dashboard](https://dashboard.stripe.com) でプロダクトと価格を作成
2. **Developers** → **Webhooks** で `https://あなたのドメイン/api/stripe/webhook` を登録
3. イベント: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

| 変数名 | 値 |
|--------|-----|
| `STRIPE_SECRET_KEY` | Stripe のシークレットキー（sk_live_... または sk_test_...） |
| `STRIPE_WEBHOOK_SECRET` | Webhook の署名シークレット（whsec_...） |
| `STRIPE_PRICE_ID_STANDARD` | スタンダードプランの Price ID（price_...） |
| `STRIPE_PRICE_ID_PRO` | プロプランの Price ID（price_...） |

※ 課金を無効のまま運用する場合は設定不要です。

---

## 6. 任意の環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|------------|
| `ENCRYPTION_KEY` | APIキー暗号化用。未設定時は `AUTH_SECRET` を使用 | - |
| `AUTH_URL` | 認証のベースURL。Vercel では `NEXTAUTH_URL` で十分 | - |
| `AUTH_TRUST_HOST` | Vercel デプロイでセッションが保持されない場合に `true` を設定 | - |

---

## 7. 設定後の作業

環境変数を設定したら、以下を実行してください。

```bash
# 1. DBスキーマの適用
npm run db:push

# 2. 初期データ投入（ロール、初回管理者、プラン、課金設定）
npm run db:seed
```

※ Vercel ではビルド時にこれらのコマンドは実行されません。ローカルから本番DBに対して実行するか、Vercel の **Settings** → **General** で **Build Command** に追加する方法があります。推奨はローカルで本番の `TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` を指定して実行することです。

---

## 8. 環境変数一覧（コピー用）

Vercel に追加する際のチェックリスト:

```
必須:
□ TURSO_DATABASE_URL
□ TURSO_AUTH_TOKEN
□ AUTH_SECRET
□ NEXTAUTH_URL
□ INITIAL_ADMIN_EMAIL

OAuth（Google 推奨）:
□ AUTH_GOOGLE_ID
□ AUTH_GOOGLE_SECRET

Inngest（LINE AI処理に必須）:
□ INNGEST_SIGNING_KEY
□ INNGEST_EVENT_KEY

課金を使う場合:
□ STRIPE_SECRET_KEY
□ STRIPE_WEBHOOK_SECRET
□ STRIPE_PRICE_ID_STANDARD
□ STRIPE_PRICE_ID_PRO
```

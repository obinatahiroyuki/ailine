/**
 * Turso データベース接続確認スクリプト
 * 実行: npm run db:verify
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";

// .env.local を読み込む
config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ エラー: 環境変数が設定されていません");
  console.error("   .env.local に以下を設定してください:");
  console.error("   TURSO_DATABASE_URL=libsql://ailine-xxx.turso.io");
  console.error("   TURSO_AUTH_TOKEN=your-token");
  process.exit(1);
}

async function verify() {
  const db = createClient({ url: url!, authToken: authToken! });

  try {
    const result = await db.execute("SELECT 1 as ok");
    console.log("✅ 接続成功:", result.rows[0]);
  } catch (error) {
    console.error("❌ 接続失敗:", error);
    process.exit(1);
  }
}

verify();

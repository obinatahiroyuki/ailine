import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  lineChannels,
  lineChannelContentAdmins,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { CreateChannelForm } from "./create-form";
import { isSystemAdmin } from "@/lib/auth";

function getWebhookBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export default async function ChannelsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const systemAdmin = isSystemAdmin(session);

  const myChannels = systemAdmin
    ? await db
        .select({
          id: lineChannels.id,
          channelId: lineChannels.channelId,
          createdAt: lineChannels.createdAt,
        })
        .from(lineChannels)
        .orderBy(desc(lineChannels.createdAt))
    : await db
        .select({
          id: lineChannels.id,
          channelId: lineChannels.channelId,
          createdAt: lineChannels.createdAt,
        })
        .from(lineChannels)
        .innerJoin(
          lineChannelContentAdmins,
          eq(lineChannelContentAdmins.lineChannelId, lineChannels.id)
        )
        .where(eq(lineChannelContentAdmins.userId, session.user.id))
        .orderBy(desc(lineChannels.createdAt));

  const webhookBaseUrl = getWebhookBaseUrl();
  const webhookUrl = `${webhookBaseUrl}/api/webhook/line`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          LINE公式アカウント
        </h1>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← ダッシュボード
        </Link>
      </div>

      {/* Webhook URL 案内 */}
      <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h2 className="mb-3 font-medium text-amber-900">
          Webhook URL（LINE Developers に登録）
        </h2>
        <p className="mb-3 text-sm text-amber-800">
          チャネル登録後、各チャネルの詳細ページ（「設定」リンク）で、そのチャネル専用の Webhook URL を確認できます。
        </p>
        <p className="mb-2 text-xs font-medium text-amber-900">URL形式</p>
        <code className="block break-all rounded bg-amber-100 px-3 py-3 text-sm text-amber-900">
          {webhookUrl}/[チャネルID]
        </code>
        <p className="mt-2 text-xs text-amber-800">
          例（チャネルIDが 1234567890 の場合）: {webhookUrl}/1234567890
        </p>
      </div>

      {/* 新規登録フォーム */}
      <CreateChannelForm />

      {/* 登録済みチャネル一覧 */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">
          登録済みチャネル
        </h2>
        {myChannels.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
            チャネルがまだ登録されていません。上記フォームから登録してください。
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {myChannels.map((ch) => (
              <li
                key={ch.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <span className="font-mono text-sm text-neutral-900">
                    {ch.channelId}
                  </span>
                  <span className="ml-2 text-xs text-neutral-500">
                    {new Date(ch.createdAt).toLocaleDateString("ja-JP")} 登録
                  </span>
                  <p className="mt-1 font-mono text-xs text-neutral-500">
                    Webhook: {webhookUrl}/{ch.channelId}
                  </p>
                </div>
                <Link
                  href={`/admin/channels/${ch.id}`}
                  className="text-sm text-neutral-600 hover:text-neutral-900"
                >
                  設定 →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

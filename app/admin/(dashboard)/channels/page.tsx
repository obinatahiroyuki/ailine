import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  lineChannels,
  lineChannelContentAdmins,
  users,
  aiProviders,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { CreateChannelForm } from "./create-form";
import { isSystemAdmin } from "@/lib/auth";

/** Webhook URL のベース。本番は NEXTAUTH_URL を優先（VERCEL_URL はプレビューでも変わるため） */
function getWebhookBaseUrl() {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export default async function ChannelsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const systemAdmin = isSystemAdmin(session);

  const myChannels = systemAdmin
    ? await db
        .select({
          id: lineChannels.id,
          name: lineChannels.name,
          channelId: lineChannels.channelId,
          createdAt: lineChannels.createdAt,
        })
        .from(lineChannels)
        .orderBy(desc(lineChannels.createdAt))
    : await db
        .select({
          id: lineChannels.id,
          name: lineChannels.name,
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

  const aiByChannel = new Map<string, { provider: string; model: string }>();
  for (const ch of myChannels) {
    const [ai] = await db
      .select({ provider: aiProviders.provider, model: aiProviders.model })
      .from(aiProviders)
      .where(eq(aiProviders.lineChannelId, ch.id));
    if (ai) aiByChannel.set(ch.id, ai);
  }
  const PROVIDER_LABELS: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Claude",
    google: "Gemini",
  };

  const adminNamesByChannel = new Map<string, string[]>();
  for (const ch of myChannels) {
    const admins = await db
      .select({
        userName: users.name,
        userEmail: users.email,
      })
      .from(lineChannelContentAdmins)
      .innerJoin(users, eq(lineChannelContentAdmins.userId, users.id))
      .where(eq(lineChannelContentAdmins.lineChannelId, ch.id));
    adminNamesByChannel.set(
      ch.id,
      admins.map((a) => a.userName || a.userEmail || "—")
    );
  }

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
          LINE Developers の Webhook 設定では、下記の<strong>本番URL</strong>を必ず使用してください。プレビュー用の URL ではメッセージが届きません。
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
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-900">
                    チャネル名
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-900">
                    コンテンツ管理者
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-900">
                    AI
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-900">
                    チャネルID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-900">
                    Webhook
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-900">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {myChannels.map((ch) => (
                  <tr
                    key={ch.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 text-neutral-900">
                      {ch.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {(adminNamesByChannel.get(ch.id) ?? []).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {aiByChannel.has(ch.id) ? (
                        <span>
                          {PROVIDER_LABELS[aiByChannel.get(ch.id)!.provider] ??
                            aiByChannel.get(ch.id)!.provider}{" "}
                          / {aiByChannel.get(ch.id)!.model}
                        </span>
                      ) : (
                        <span className="text-neutral-400">未設定</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-900">
                      {ch.channelId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {webhookUrl}/{ch.channelId}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/channels/${ch.id}`}
                        className="text-neutral-600 hover:text-neutral-900"
                      >
                        設定 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  lineChannels,
  lineChannelContentAdmins,
  apiUsage,
} from "@/lib/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import Link from "next/link";
import { isSystemAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const systemAdmin = isSystemAdmin(session);

  const channels = systemAdmin
    ? await db
        .select({ id: lineChannels.id, channelId: lineChannels.channelId })
        .from(lineChannels)
        .orderBy(desc(lineChannels.createdAt))
    : await db
        .select({ id: lineChannels.id, channelId: lineChannels.channelId })
        .from(lineChannels)
        .innerJoin(
          lineChannelContentAdmins,
          eq(lineChannelContentAdmins.lineChannelId, lineChannels.id)
        )
        .where(eq(lineChannelContentAdmins.userId, session.user.id))
        .orderBy(desc(lineChannels.createdAt));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const usageByChannel = await Promise.all(
    channels.map(async (ch) => {
      const allRows = await db
        .select({
          inputTokens: apiUsage.inputTokens,
          outputTokens: apiUsage.outputTokens,
          createdAt: apiUsage.createdAt,
        })
        .from(apiUsage)
        .where(eq(apiUsage.lineChannelId, ch.id));

      const monthRows = allRows.filter(
        (r) => r.createdAt && new Date(r.createdAt) >= startOfMonth
      );

      const totalInput = allRows.reduce((a, r) => a + (r.inputTokens ?? 0), 0);
      const totalOutput = allRows.reduce((a, r) => a + (r.outputTokens ?? 0), 0);
      const monthInput = monthRows.reduce(
        (a, r) => a + (r.inputTokens ?? 0),
        0
      );
      const monthOutput = monthRows.reduce(
        (a, r) => a + (r.outputTokens ?? 0),
        0
      );

      return {
        id: ch.id,
        channelId: ch.channelId,
        totalInput,
        totalOutput,
        totalCalls: allRows.length,
        monthInput,
        monthOutput,
      };
    })
  );

  const totalTokens = usageByChannel.reduce(
    (acc, u) => acc + u.totalInput + u.totalOutput,
    0
  );
  const monthTokens = usageByChannel.reduce(
    (acc, u) => acc + u.monthInput + u.monthOutput,
    0
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-neutral-900">
        ダッシュボード
      </h1>
      <p className="text-neutral-600">
        ようこそ、{systemAdmin ? "システム管理者" : (session?.user?.name ?? session?.user?.email)} さん
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-2 font-medium text-neutral-900">API使用量</h2>
          <p className="text-2xl font-semibold text-neutral-700">
            {totalTokens.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-neutral-500">
              トークン（累計）
            </span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            今月: {monthTokens.toLocaleString()} トークン
          </p>
          {usageByChannel.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
              {usageByChannel.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between text-sm"
                >
                  <Link
                    href={`/admin/channels/${u.id}`}
                    className="font-mono text-neutral-600 hover:text-neutral-900"
                  >
                    {u.channelId}
                  </Link>
                  <span className="text-neutral-500">
                    {(u.totalInput + u.totalOutput).toLocaleString()} トークン
                    （{u.totalCalls}回）
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">
              チャネルがありません
            </p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-2 font-medium text-neutral-900">クイックリンク</h2>
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin/channels"
                className="text-neutral-600 underline hover:text-neutral-900"
              >
                LINE公式アカウント設定 →
              </Link>
            </li>
            {systemAdmin && (
              <li>
                <Link
                  href="/admin/users"
                  className="text-neutral-600 underline hover:text-neutral-900"
                >
                  ユーザー管理 →
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

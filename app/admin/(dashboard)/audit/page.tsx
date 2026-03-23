import { auth } from "@/auth";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSystemAdmin } from "@/lib/auth";

const ACTION_LABELS: Record<string, string> = {
  "channel.create": "チャネル作成",
  "channel.delete": "チャネル削除",
  "channel_admin.add": "コンテンツ管理者追加",
  "channel_admin.remove": "コンテンツ管理者削除",
  "role.assign": "ロール付与",
  "role.remove": "ロール削除",
  "ai.generation_error": "AI応答エラー",
};

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!isSystemAdmin(session)) redirect("/admin");

  const logs = await db
    .select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      resource: auditLogs.resource,
      resourceId: auditLogs.resourceId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];
  const userMap = new Map<string, string>();
  for (const uid of userIds) {
    const [u] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, uid!));
    if (u) userMap.set(uid!, u.email);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          監査ログ
        </h1>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← ダッシュボード
        </Link>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-900">
                日時
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-900">
                ユーザー
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-900">
                操作
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-900">
                詳細
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                  {log.createdAt
                    ? new Date(log.createdAt).toLocaleString("ja-JP")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {log.userId ? userMap.get(log.userId) ?? log.userId : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-900">
                  {ACTION_LABELS[log.action] ?? log.action}
                </td>
                <td className="px-4 py-3 text-neutral-600 max-w-xs truncate">
                  {log.details ? (
                    <span title={log.details}>
                      {(() => {
                        try {
                          const d = JSON.parse(log.details);
                          return Object.entries(d)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ");
                        } catch {
                          return log.details;
                        }
                      })()}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="p-8 text-center text-neutral-500">
            ログがありません
          </p>
        )}
      </div>
    </div>
  );
}

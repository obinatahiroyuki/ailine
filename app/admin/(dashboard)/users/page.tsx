import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, userRoles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSystemAdmin } from "@/lib/auth";
import { UserRoleForm } from "./user-role-form";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!isSystemAdmin(session)) redirect("/admin");

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));

  const usersWithRoles = await Promise.all(
    allUsers.map(async (u) => {
      const roles = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(eq(userRoles.userId, u.id));
      return {
        ...u,
        roles: roles.map((r) => r.roleId),
      };
    })
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          ユーザー管理
        </h1>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← ダッシュボード
        </Link>
      </div>

      <p className="mb-6 text-sm text-neutral-600">
        ユーザーにロールを付与して権限を設定します。コンテンツ管理者は、チャネル詳細ページからチャネルに割り当ててください。
      </p>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-900">
                メール
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-900">
                名前
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-900">
                ロール
              </th>
            </tr>
          </thead>
          <tbody>
            {usersWithRoles.map((u) => (
              <tr
                key={u.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-4 py-3 text-neutral-900">{u.email}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {u.name || "—"}
                </td>
                <td className="px-4 py-3">
                  <UserRoleForm
                    userId={u.id}
                    currentRoles={u.roles}
                    isSelf={u.id === session.user?.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

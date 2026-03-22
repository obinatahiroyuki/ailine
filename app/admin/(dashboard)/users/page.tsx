import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, userRoles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSystemAdmin } from "@/lib/auth";
import { UserRoleForm } from "./user-role-form";
import { CreateUserForm } from "./create-user-form";
import { DeleteUserButton } from "./delete-user-button";
import { PasswordResetButton } from "./password-reset-button";
import { BillingExemptCell } from "./billing-exempt-cell";
import { BillingExemptBulkActions } from "./billing-exempt-bulk-actions";

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900">
          ユーザー管理
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            ← ダッシュボード
          </Link>
        </div>
      </div>

      <p className="mb-6 text-sm text-neutral-600">
        ユーザーを登録・削除し、ロールを付与して権限を設定します。コンテンツ管理者は、チャネル詳細ページからチャネルに割り当ててください。または、登録ページから課金して self 登録することもできます。
      </p>

      <div className="mb-6 space-y-4">
        <CreateUserForm />
        <BillingExemptBulkActions
          contentAdminIds={usersWithRoles
            .filter((u) => !u.roles.includes("system_admin"))
            .map((u) => u.id)}
        />
      </div>

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
              <th className="px-4 py-3 text-left font-medium text-neutral-900">
                課金免除
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-900">
                操作
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
                <td className="px-4 py-3">
                  <BillingExemptCell
                    userId={u.id}
                    billingExempt={u.billingExempt ?? false}
                    isSystemAdmin={u.roles.includes("system_admin")}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <PasswordResetButton
                      userId={u.id}
                      userEmail={u.email}
                    />
                    <DeleteUserButton
                      userId={u.id}
                      isSelf={u.id === session.user?.id}
                      isSystemAdmin={
                        u.roles.includes("system_admin")
                      }
                      systemAdminCount={
                        usersWithRoles.filter((x) =>
                          x.roles.includes("system_admin")
                        ).length
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const [user] = await db
    .select({ hasPassword: users.password })
    .from(users)
    .where(eq(users.id, session.user.id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          アカウント設定
        </h1>
        <Link
          href="/admin"
          className="text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← ダッシュボード
        </Link>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 font-medium text-neutral-900">
            パスワードを変更
          </h2>
          <ChangePasswordForm hasPassword={!!user?.hasPassword} />
          <p className="mt-4 text-sm text-neutral-500">
            パスワードを忘れた場合は、システム管理者に連絡してパスワードをリセットしてもらってください。
          </p>
        </div>
      </div>
    </div>
  );
}

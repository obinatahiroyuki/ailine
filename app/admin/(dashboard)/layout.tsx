import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOutAction } from "../actions";
import { isSystemAdmin } from "@/lib/auth";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const systemAdmin = isSystemAdmin(session);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-lg font-semibold text-neutral-900">
              ailine 管理画面
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="text-neutral-500 hover:text-neutral-900">
                ダッシュボード
              </Link>
              <Link href="/admin/channels" className="text-neutral-500 hover:text-neutral-900">
                LINEチャネル
              </Link>
              <Link href="/admin/account" className="text-neutral-500 hover:text-neutral-900">
                アカウント
              </Link>
              <Link href="/admin/settings" className="text-neutral-500 hover:text-neutral-900">
                設定
              </Link>
              {systemAdmin && (
                <>
                  <Link href="/admin/users" className="text-neutral-500 hover:text-neutral-900">
                    ユーザー管理
                  </Link>
                  <Link href="/admin/audit" className="text-neutral-500 hover:text-neutral-900">
                    監査ログ
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600">
              {session.user.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm text-neutral-500 underline hover:text-neutral-700"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

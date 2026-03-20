import { auth } from "@/auth";
import { db } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSystemAdmin } from "@/lib/auth";
import { BillingToggleForm } from "./billing-toggle-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!isSystemAdmin(session)) redirect("/admin");

  const [billingRow] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "billing_enabled"));

  const billingEnabled = billingRow?.value === "true";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          システム設定
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
          <h2 className="mb-4 font-medium text-neutral-900">課金設定</h2>
          <BillingToggleForm initialEnabled={billingEnabled} />
          <p className="mt-4 text-sm text-neutral-500">
            課金を有効にすると、コンテンツ管理者はStripeでサブスクリプション契約が必要になります。システム管理者がコンテンツ管理者でもあるチャネルは課金免除です。
          </p>
        </div>
      </div>
    </div>
  );
}

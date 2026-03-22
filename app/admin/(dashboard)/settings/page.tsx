import { auth } from "@/auth";
import { db } from "@/lib/db";
import { systemSettings, users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSystemAdmin } from "@/lib/auth";
import { BillingToggleForm } from "./billing-toggle-form";
import { BillingEmergencyExemptForm } from "./billing-emergency-exempt-form";
import { ChangeNameForm } from "../account/change-name-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const systemAdmin = isSystemAdmin(session);

  const [currentUser] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id));

  const settingsRows = systemAdmin
    ? await db
        .select()
        .from(systemSettings)
        .where(
          inArray(systemSettings.key, [
            "billing_enabled",
            "billing_emergency_exempt",
          ])
        )
    : [];

  const billingEnabled =
    settingsRows.find((r) => r.key === "billing_enabled")?.value === "true";
  const billingEmergencyExempt =
    settingsRows.find((r) => r.key === "billing_emergency_exempt")?.value ===
    "true";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          設定
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
          <h2 className="mb-4 font-medium text-neutral-900">名前を変更</h2>
          <ChangeNameForm
            initialName={currentUser?.name ?? ""}
            email={currentUser?.email ?? ""}
          />
        </div>

        {systemAdmin && (
          <>
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 font-medium text-neutral-900">課金設定（全体）</h2>
              <BillingToggleForm initialEnabled={billingEnabled} />
              <p className="mt-4 text-sm text-neutral-500">
                課金を有効にすると、コンテンツ管理者はStripeでサブスクリプション契約が必要になります。
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 font-medium text-neutral-900">
                緊急時：全員課金免除
              </h2>
              <BillingEmergencyExemptForm initialEnabled={billingEmergencyExempt} />
              <p className="mt-4 text-sm text-neutral-500">
                緊急時にONにすると、全コンテンツ管理者が課金なしで利用できます。解除すると個別設定・サブスクに戻ります。
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

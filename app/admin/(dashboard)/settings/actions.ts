"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  setBillingEnabled,
  setBillingEmergencyExempt,
} from "@/lib/billing";
import { isSystemAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function updateBillingEnabled(enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };

  await setBillingEnabled(enabled);
  await logAudit({
    userId: session.user.id,
    action: "settings.billing_updated",
    resource: "system_settings",
    details: { billingEnabled: enabled },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateBillingEmergencyExempt(exempt: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };

  await setBillingEmergencyExempt(exempt);
  await logAudit({
    userId: session.user.id,
    action: "settings.billing_emergency_exempt_updated",
    resource: "system_settings",
    details: { billingEmergencyExempt: exempt },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { success: true };
}

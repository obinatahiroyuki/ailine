import { db } from "@/lib/db";
import {
  systemSettings,
  subscriptions,
  lineChannelContentAdmins,
  userRoles,
  users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ROLE_SYSTEM_ADMIN } from "./auth";

const KEY_BILLING_ENABLED = "billing_enabled";
const KEY_BILLING_EMERGENCY_EXEMPT = "billing_emergency_exempt";

export async function getBillingEnabled(): Promise<boolean> {
  const [row] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, KEY_BILLING_ENABLED));
  return row?.value === "true";
}

export async function setBillingEnabled(enabled: boolean): Promise<void> {
  await setSystemSetting(KEY_BILLING_ENABLED, enabled);
}

export async function getBillingEmergencyExempt(): Promise<boolean> {
  const [row] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, KEY_BILLING_EMERGENCY_EXEMPT));
  return row?.value === "true";
}

export async function setBillingEmergencyExempt(exempt: boolean): Promise<void> {
  await setSystemSetting(KEY_BILLING_EMERGENCY_EXEMPT, exempt);
}

async function setSystemSetting(key: string, enabled: boolean): Promise<void> {
  const val = enabled ? "true" : "false";
  const [existing] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, key));

  if (existing) {
    await db
      .update(systemSettings)
      .set({ value: val, updatedAt: new Date() })
      .where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({
      key,
      value: val,
      updatedAt: new Date(),
    });
  }
}

/** チャネルが課金対象か（有効なサブスクがあるか、または免除か） */
export async function isChannelBillingOk(
  lineChannelId: string,
  channelInternalId: string
): Promise<{ ok: boolean; reason?: string }> {
  const enabled = await getBillingEnabled();
  if (!enabled) return { ok: true };

  const emergencyExempt = await getBillingEmergencyExempt();
  if (emergencyExempt) return { ok: true };

  const adminsWithUser = await db
    .select({
      userId: lineChannelContentAdmins.userId,
      billingExempt: users.billingExempt,
    })
    .from(lineChannelContentAdmins)
    .innerJoin(users, eq(lineChannelContentAdmins.userId, users.id))
    .where(eq(lineChannelContentAdmins.lineChannelId, channelInternalId));

  for (const a of adminsWithUser) {
    if (a.billingExempt) return { ok: true };
    const roles = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, a.userId));
    if (roles.some((r) => r.roleId === ROLE_SYSTEM_ADMIN)) {
      return { ok: true };
    }
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.lineChannelId, channelInternalId));

  if (!sub) {
    return { ok: false, reason: "subscription_required" };
  }
  if (sub.status === "cancelled" || sub.status === "past_due") {
    return { ok: false, reason: sub.status };
  }
  return { ok: true };
}
